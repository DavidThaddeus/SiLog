#!/usr/bin/env node

/**
 * SiLog Fine-Tuning Job Executor
 * Submits fine-tuning jobs to OpenAI API
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

const TRAINING_FILE = path.join(__dirname, "../training_data.jsonl");
const ENV_FILE = path.join(__dirname, "../apps/web/.env.local");

// Helper: Make HTTPS request
function httpsRequest(method, hostname, path, headers, data) {
  return new Promise((resolve, reject) => {
    const options = { method, hostname, path, headers };
    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => resolve({ status: res.statusCode || 500, body }));
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

async function uploadTrainingFile(apiKey) {
  console.log("\n[OpenAI] Uploading training file...");

  if (!fs.existsSync(TRAINING_FILE)) {
    throw new Error(`Training file not found: ${TRAINING_FILE}`);
  }

  const fileContent = fs.readFileSync(TRAINING_FILE);
  const boundary = "----FormBoundary7MA4YWxkTrZu0gW";

  // Build proper multipart form data with purpose field
  let formData = `--${boundary}\r\n`;
  formData += `Content-Disposition: form-data; name="purpose"\r\n\r\n`;
  formData += `fine-tune\r\n`;
  formData += `--${boundary}\r\n`;
  formData += `Content-Disposition: form-data; name="file"; filename="training_data.jsonl"\r\n`;
  formData += `Content-Type: application/octet-stream\r\n\r\n`;
  formData += fileContent.toString();
  formData += `\r\n--${boundary}--\r\n`;

  const res = await httpsRequest(
    "POST",
    "api.openai.com",
    "/v1/files",
    {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      "Content-Length": Buffer.byteLength(formData).toString(),
    },
    formData
  );

  const body = JSON.parse(res.body);
  if (res.status !== 200) {
    throw new Error(`OpenAI file upload failed: ${res.body}`);
  }

  console.log(`✓ File uploaded with ID: ${body.id}`);
  return body.id;
}

async function startOpenAIFinetune(apiKey, fileId, model, suffix) {
  console.log(`\n[OpenAI] Starting fine-tuning for ${model}...`);

  const payload = JSON.stringify({
    training_file: fileId,
    model,
    suffix,
  });

  const res = await httpsRequest(
    "POST",
    "api.openai.com",
    "/v1/fine_tuning/jobs",
    {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload).toString(),
    },
    payload
  );

  const body = JSON.parse(res.body);
  if (res.status !== 200) {
    throw new Error(`OpenAI fine-tune creation failed: ${res.body}`);
  }

  console.log(`✓ Job created: ${body.id}`);
  console.log(`  Status: ${body.status}`);
  console.log(`  ETA: 1-2 hours`);
  return body.id;
}

function updateEnvLocal(modelIds) {
  if (!fs.existsSync(ENV_FILE)) {
    console.warn(`\n⚠ .env.local not found at ${ENV_FILE}`);
    console.log("Add these lines manually:");
    Object.entries(modelIds).forEach(([key, value]) => {
      console.log(`${key}=${value}`);
    });
    return;
  }

  let envContent = fs.readFileSync(ENV_FILE, "utf-8");

  // Update or add each fine-tuned model ID
  Object.entries(modelIds).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, "m");
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  });

  fs.writeFileSync(ENV_FILE, envContent, "utf-8");
  console.log(`\n✓ Updated .env.local with fine-tuned model IDs`);
}

async function main() {
  const gpt54Key = process.env.OPENAI_API_KEY_GPT54;
  const gpt54MiniKey = process.env.OPENAI_API_KEY_GPT54_MINI;

  console.log("═══════════════════════════════════════════════════════");
  console.log("  SiLog Fine-Tuning Job Executor");
  console.log("═══════════════════════════════════════════════════════");

  if (!gpt54Key && !gpt54MiniKey) {
    console.error(
      "✗ No OpenAI API keys found. Set OPENAI_API_KEY_GPT54 or OPENAI_API_KEY_GPT54_MINI"
    );
    process.exit(1);
  }

  const jobIds = {};

  try {
    // Step 1: Check training data
    console.log("\n[Step 1] Checking training data...");
    if (!fs.existsSync(TRAINING_FILE)) {
      console.log("  Run: node scripts/generate-finetuning-data.js");
      throw new Error("training_data.jsonl not found");
    }
    console.log("✓ training_data.jsonl found");

    // Step 2: Upload file and start fine-tuning jobs
    let fileId = "";
    if (gpt54Key) {
      fileId = await uploadTrainingFile(gpt54Key);
      console.log("\n[Step 2] Starting OpenAI fine-tuning jobs...");

      // Primary: fine-tune GPT-5.4
      const gpt54JobId = await startOpenAIFinetune(
        gpt54Key,
        fileId,
        "gpt-5.4-2026-03-05",
        "siwes-trained"
      );
      jobIds["gpt-5.4-2026-03-05"] = gpt54JobId;

      if (gpt54MiniKey) {
        // Fallback: fine-tune GPT-5.4-mini
        const gpt54MiniJobId = await startOpenAIFinetune(
          gpt54MiniKey,
          fileId,
          "gpt-5.4-mini-2026-03-17",
          "siwes-trained"
        );
        jobIds["gpt-5.4-mini-2026-03-17"] = gpt54MiniJobId;
      }
    }

    // Step 3: Report
    console.log("\n[Step 3] Fine-tuning jobs submitted!");
    console.log("  Job IDs:");
    Object.entries(jobIds).forEach(([model, jobId]) => {
      console.log(`    ${model}: ${jobId}`);
    });

    console.log("\n  To check status, run:");
    console.log("    curl -H 'Authorization: Bearer $OPENAI_API_KEY_GPT54' \\");
    console.log(`      https://api.openai.com/v1/fine_tuning/jobs/${jobIds["gpt-5.4"] || "JOB_ID"}`);

    console.log("\n  When jobs complete, update .env.local with:");
    console.log("    FINE_TUNED_GPT54=gpt-5.4-2026-03-05:siwes-trained       (from GPT-5.4 job)");
    console.log("    FINE_TUNED_GPT54_MINI=gpt-5.4-mini-2026-03-17:siwes-trained  (from GPT-5.4-mini job)");

    // Save job IDs for reference
    const jobsFile = path.join(__dirname, "../finetuning_jobs.json");
    fs.writeFileSync(jobsFile, JSON.stringify(jobIds, null, 2), "utf-8");
    console.log(`\n✓ Job IDs saved to: ${jobsFile}`);
  } catch (err) {
    console.error("\n✗ Error:", err.message);
    process.exit(1);
  }
}

main();
