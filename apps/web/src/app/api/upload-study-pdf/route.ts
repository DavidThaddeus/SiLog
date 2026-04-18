import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const MAX_PDFS = 5;
const MAX_TEXT_CHARS = 60_000; // ~15k tokens per PDF max

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get("authorization");
  const accessToken = authHeader?.replace("Bearer ", "");
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
  );

  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  // ── Check 5-PDF limit ─────────────────────────────────────────────────────
  const { count } = await client
    .from("study_materials")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count ?? 0) >= MAX_PDFS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_PDFS} PDFs allowed. Delete one to upload another.` },
      { status: 400 }
    );
  }

  // ── Parse form data ────────────────────────────────────────────────────────
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file || file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF files are accepted." }, { status: 400 });
  }

  if (file.size > 3 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large. Maximum size is 3 MB." }, { status: 400 });
  }

  // ── Extract text from PDF ─────────────────────────────────────────────────
  let extractedText = "";
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const parsed = await pdfParse(buffer);
    extractedText = (parsed.text as string).slice(0, MAX_TEXT_CHARS);
  } catch (err) {
    console.error("[upload-study-pdf] pdf-parse error:", err);
    // Don't fail the upload — store empty text, AI just won't have content
    extractedText = "";
  }

  // ── Upload to Supabase Storage ────────────────────────────────────────────
  const sanitisedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${user.id}/${Date.now()}_${sanitisedName}`;

  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const { error: storageError } = await client.storage
    .from("study-materials")
    .upload(storagePath, fileBuffer, { contentType: "application/pdf", upsert: false });

  if (storageError) {
    console.error("[upload-study-pdf] storage error:", storageError);
    return NextResponse.json({ error: `Storage error: ${storageError.message}` }, { status: 500 });
  }

  // ── Insert record to DB ───────────────────────────────────────────────────
  const { data, error: dbError } = await client
    .from("study_materials")
    .insert({
      user_id: user.id,
      file_name: file.name,
      storage_path: storagePath,
      extracted_text: extractedText,
      file_size: file.size,
    })
    .select("id, file_name, file_size, created_at")
    .single();

  if (dbError) {
    // Rollback storage upload on DB failure
    await client.storage.from("study-materials").remove([storagePath]);
    console.error("[upload-study-pdf] db error:", dbError);
    return NextResponse.json({ error: `Database error: ${dbError.message}` }, { status: 500 });
  }

  return NextResponse.json(data);
}
