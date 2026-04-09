"use client";

import { useRef, useState } from "react";
import { useOnboardingStore } from "@/store/onboarding";
import { supabase } from "@/lib/supabase";
import { StepShell } from "../StepShell";

interface Props {
  onComplete: () => void;
}

interface UploadedPDF {
  id: string;
  file_name: string;
  file_size: number;
}

const MAX_PDFS = 5;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function Step8Study({ onComplete }: Props) {
  const { data, setField, prevStep } = useOnboardingStore();

  const [subStep, setSubStep] = useState<"ask" | "describe" | "upload">("ask");

  // PDF upload state
  const [uploadedPDFs, setUploadedPDFs] = useState<UploadedPDF[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleYes = () => {
    setField("hasPersonalStudy", true);
    setSubStep("describe");
  };

  const handleNo = () => {
    setField("hasPersonalStudy", false);
    setField("personalStudyDescription", "");
    onComplete();
  };

  const canContinueDescribe = !!(data.personalStudyDescription?.trim());

  // ── PDF upload ─────────────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) return;
    fileInputRef.current.value = "";
    if (!file) return;

    if (file.type !== "application/pdf") {
      setUploadError("Only PDF files are accepted.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File too large. Maximum size is 10 MB.");
      return;
    }
    if (uploadedPDFs.length >= MAX_PDFS) {
      setUploadError(`You can upload a maximum of ${MAX_PDFS} PDFs.`);
      return;
    }

    setUploadError(null);
    setUploading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not signed in.");

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload-study-pdf", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed.");

      setUploadedPDFs((prev) => [...prev, json as UploadedPDF]);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePDF = async (id: string) => {
    setDeletingId(id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await fetch("/api/delete-study-pdf", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      setUploadedPDFs((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  // ── Q8a: Yes / No ────────────────────────────────────────────────────────────
  if (subStep === "ask") {
    return (
      <StepShell
        stepNum={8}
        phase={2}
        heading="Any technical topics you're applying at work?"
        sub="If there's a skill, technology, or project you're working on in the office, the AI will write it as real workplace activity on your non-attendance days."
        onBack={prevStep}
        onContinue={handleYes}
        canContinue={true}
        continueLabel="Yes, I am"
      >
        <div className="space-y-3">
          <button
            onClick={handleYes}
            className="w-full text-left p-4 rounded-xl border-2 transition-all cursor-pointer"
            style={{ borderColor: "#4B2E2B", background: "var(--card)" }}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">💼</span>
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                  Yes — I have extra activities / topics from work
                </div>
                <div className="text-xs leading-snug" style={{ color: "var(--text-muted)" }}>
                  AI writes these as real office tasks on quiet days.
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={handleNo}
            className="w-full text-left p-4 rounded-xl border transition-all cursor-pointer"
            style={{ borderColor: "rgba(140,90,60,0.2)", background: "var(--card)" }}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🏢</span>
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                  No — office work is enough
                </div>
                <div className="text-xs leading-snug" style={{ color: "var(--text-muted)" }}>
                  AI fills quiet days from Activity Bank + curriculum theory only.
                </div>
              </div>
            </div>
          </button>
        </div>
      </StepShell>
    );
  }

  // ── Q8b: Describe the study ───────────────────────────────────────────────────
  if (subStep === "describe") {
    return (
      <StepShell
        stepNum={8}
        phase={2}
        heading="What are you working on?"
        sub="Describe it however you like. The AI will write it as proper office work — even if you phrase it casually."
        onBack={() => setSubStep("ask")}
        onContinue={() => setSubStep("upload")}
        canContinue={canContinueDescribe}
      >
        <div className="space-y-4">
          <textarea
            rows={5}
            placeholder="e.g. I'm going through Andrew Ng's machine learning course on Coursera. I've been studying linear regression, gradient descent, and building small models in Python…"
            className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-colors resize-none"
            style={{
              borderColor: "rgba(140,90,60,0.25)",
              color: "var(--text)",
              background: "var(--input-bg)",
              lineHeight: "1.65",
            }}
            value={data.personalStudyDescription ?? ""}
            onChange={(e) => setField("personalStudyDescription", e.target.value)}
          />
          {canContinueDescribe && (
            <div
              className="p-3 rounded-xl text-xs leading-relaxed"
              style={{ background: "var(--brown-faint-var)", color: "var(--text-muted)" }}
            >
              <div
                className="text-[9px] font-bold tracking-widest uppercase mb-1"
                style={{ color: "#8C5A3C", fontFamily: "var(--font-dm-mono)" }}
              >
                How it will be written
              </div>
              Written as a real task carried out in the office, connected to your{" "}
              <strong style={{ color: "var(--text-secondary)" }}>{data.department}</strong> coursework.
              No mention of personal study or learning outside the office.
            </div>
          )}
        </div>
      </StepShell>
    );
  }

  // ── Q8c: Upload study PDFs (optional) ────────────────────────────────────────
  if (subStep === "upload") {
    return (
      <StepShell
        stepNum={8}
        phase={2}
        heading="Upload your study materials (optional)"
        sub={`Upload up to ${MAX_PDFS} PDFs of what you're studying. The AI reads them to generate accurate, topic-specific logbook entries.`}
        onBack={() => setSubStep("describe")}
        onContinue={onComplete}
        canContinue={true}
        continueLabel={uploadedPDFs.length > 0 ? "Continue →" : "Skip — no PDFs"}
      >
        <div className="space-y-4">
          {/* Upload area */}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />

          <button
            onClick={() => {
              if (!uploading && uploadedPDFs.length < MAX_PDFS) {
                fileInputRef.current?.click();
              }
            }}
            disabled={uploading || uploadedPDFs.length >= MAX_PDFS}
            style={{
              width: "100%",
              padding: "20px 16px",
              borderRadius: 12,
              border: `2px dashed ${uploadedPDFs.length >= MAX_PDFS ? "var(--border)" : "rgba(140,90,60,0.35)"}`,
              background: uploading ? "rgba(140,90,60,0.04)" : "var(--card)",
              cursor: uploading || uploadedPDFs.length >= MAX_PDFS ? "default" : "pointer",
              textAlign: "center",
              transition: "all 0.15s",
              opacity: uploadedPDFs.length >= MAX_PDFS ? 0.5 : 1,
            }}
          >
            {uploading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <div style={{
                  width: 18, height: 18, borderRadius: "50%",
                  border: "2px solid var(--border)", borderTopColor: "#8C5A3C",
                  animation: "spin 0.8s linear infinite",
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: 13, color: "#8C5A3C", fontWeight: 600 }}>
                  Reading PDF…
                </span>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : uploadedPDFs.length >= MAX_PDFS ? (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>
                  Maximum {MAX_PDFS} PDFs reached
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                  Delete a file below to upload another.
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 22, marginBottom: 6 }}>📄</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
                  Click to choose a PDF
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                  {uploadedPDFs.length}/{MAX_PDFS} uploaded · Max 10 MB per file
                </div>
              </div>
            )}
          </button>

          {/* Error */}
          {uploadError && (
            <div style={{
              padding: "10px 14px", borderRadius: 8,
              background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)",
              fontSize: 12, color: "#b91c1c",
            }}>
              {uploadError}
            </div>
          )}

          {/* Uploaded file list */}
          {uploadedPDFs.length > 0 && (
            <div className="space-y-2">
              <div style={{
                fontSize: 9, fontFamily: "var(--font-dm-mono)", fontWeight: 700,
                letterSpacing: "0.12em", textTransform: "uppercase", color: "#8C5A3C",
              }}>
                Uploaded ({uploadedPDFs.length}/{MAX_PDFS})
              </div>
              {uploadedPDFs.map((pdf) => (
                <div key={pdf.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px", borderRadius: 10,
                  border: "1px solid rgba(140,90,60,0.2)",
                  background: "rgba(140,90,60,0.04)",
                }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>📄</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 12, fontWeight: 600, color: "var(--text-secondary)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {pdf.file_name}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-dm-mono)" }}>
                      {formatBytes(pdf.file_size)} · Text extracted
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeletePDF(pdf.id)}
                    disabled={deletingId === pdf.id}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "var(--muted)", fontSize: 16, padding: "2px 4px",
                      opacity: deletingId === pdf.id ? 0.4 : 1,
                      flexShrink: 0,
                    }}
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Info box */}
          <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--brown-faint-var)" }}>
            <div style={{
              fontSize: 9, fontFamily: "var(--font-dm-mono)", fontWeight: 700,
              letterSpacing: "0.12em", textTransform: "uppercase", color: "#8C5A3C", marginBottom: 6,
            }}>
              How this helps
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {[
                "AI reads the actual content of your PDFs — not just the title.",
                "Quiet days get entries based on your real study topics, never generic filler.",
                "PDFs are private to your account and securely stored.",
              ].map((text, i) => (
                <li key={i} style={{ display: "flex", gap: 6, fontSize: 11, color: "var(--text-muted)", marginBottom: i < 2 ? 4 : 0 }}>
                  <span style={{ color: "#8C5A3C", flexShrink: 0 }}>·</span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </StepShell>
    );
  }

}
