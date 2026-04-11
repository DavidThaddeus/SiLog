"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDashboardStore } from "@/store/dashboard";
import { authHeaders } from "@/lib/auth-fetch";
import type { WeekEntry } from "@/types/dashboard";
import type { DefenseQuestion } from "@/app/api/ai/defense-questions/route";
import type { AnswerResult } from "@/app/api/ai/score-answers/route";

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtShort(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric", month: "short",
  });
}

type Phase = "select" | "loading" | "session" | "scoring" | "results";

interface Answer {
  questionId: string;
  text: string;
  result?: AnswerResult;
}

// ─── Week option card ────────────────────────────────────────────────────────

function WeekOption({ week, selected, onSelect }: {
  week: WeekEntry;
  selected: boolean;
  onSelect: () => void;
}) {
  const filledCount = week.days.filter((d) => d.hasNotes).length;
  const totalDays = week.days.filter((d) => d.isAttendanceDay).length;

  return (
    <button
      onClick={onSelect}
      style={{
        display: "flex", flexDirection: "column", gap: 6,
        padding: "14px 16px", borderRadius: 10, textAlign: "left",
        border: `2px solid ${selected ? "#8C5A3C" : "var(--border)"}`,
        background: selected ? "rgba(140,90,60,0.06)" : "var(--bg)",
        cursor: "pointer", transition: "all 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          fontFamily: "var(--font-dm-mono)", fontSize: 10, fontWeight: 700,
          color: selected ? "#8C5A3C" : "var(--muted)", letterSpacing: "0.06em",
        }}>
          WK {String(week.weekNumber).padStart(2, "0")}
        </span>
        {selected && <span style={{ fontSize: 12, color: "#8C5A3C" }}>✓</span>}
      </div>
      <div style={{ fontSize: 11, color: "var(--muted)" }}>
        {fmtShort(week.startDate)} – {fmtShort(week.endDate)}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{
          height: 3, flex: 1, borderRadius: 2, background: "var(--border)", overflow: "hidden",
        }}>
          <div style={{
            height: "100%", borderRadius: 2, background: "#8C5A3C",
            width: totalDays > 0 ? `${(filledCount / totalDays) * 100}%` : "0%",
          }} />
        </div>
        <span style={{ fontSize: 10, fontFamily: "var(--font-dm-mono)", color: "var(--muted)", flexShrink: 0 }}>
          {filledCount}/{totalDays}
        </span>
      </div>
    </button>
  );
}

// ─── Score ring ──────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#8C5A3C" : "#ef4444";
  const label = score >= 80 ? "Defense Ready" : score >= 60 ? "Almost There" : "Needs Work";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{
        width: 88, height: 88, borderRadius: "50%",
        border: `5px solid ${color}`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{
          fontFamily: "var(--font-dm-mono)", fontSize: 22, fontWeight: 700,
          color, lineHeight: 1,
        }}>
          {score}
        </span>
        <span style={{ fontSize: 9, color: "var(--muted)", fontFamily: "var(--font-dm-mono)" }}>/100</span>
      </div>
      <span style={{
        fontFamily: "var(--font-playfair)", fontSize: 13, fontWeight: 600, color,
      }}>
        {label}
      </span>
    </div>
  );
}

// ─── Spinner ─────────────────────────────────────────────────────────────────

function Spinner({ message }: { message: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16 }}>
      <div style={{
        width: 44, height: 44, borderRadius: "50%",
        border: "3px solid var(--border)", borderTopColor: "#8C5A3C",
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ fontSize: 14, color: "var(--muted)" }}>{message}</div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DefensePage() {
  const router = useRouter();
  const { weeks } = useDashboardStore();

  const [phase, setPhase] = useState<Phase>("select");
  const [selectedWeek, setSelectedWeek] = useState<WeekEntry | null>(null);
  const [questions, setQuestions] = useState<DefenseQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const practicableWeeks = weeks.filter((w) => !w.isFutureWeek && w.completedDaysCount > 0);

  // ── Start session ─────────────────────────────────────────────────────────

  async function startSession(week: WeekEntry) {
    setPhase("loading");
    setError(null);
    setCurrentQ(0);
    setCurrentAnswer("");

    try {
      const res = await fetch("/api/ai/defense-questions", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({
          weekNumber: week.weekNumber,
          startDate: week.startDate,
          endDate: week.endDate,
          weekSummary: week.weekSummaryCurrent ?? week.weekSummary ?? "",
          days: week.days.filter((d) => d.hasNotes).map((d) => ({
            dayName: d.dayName,
            progressChartEntry: d.progressChartEntry ?? "",
            keyActivities: d.keyActivities ?? [],
            technicalNotes: d.technicalNotesCurrent ?? d.technicalNotes ?? "",
            deptBridgeUsed: d.deptBridgeUsed ?? "",
          })),
        }),
      });

      if (!res.ok) throw new Error();
      const { questions: qs } = await res.json();
      setQuestions(qs);
      setAnswers(qs.map((q: DefenseQuestion) => ({ questionId: q.id, text: "" })));
      setPhase("session");
    } catch {
      setError("Could not generate questions. Please try again.");
      setPhase("select");
    }
  }

  // ── Navigate between questions ────────────────────────────────────────────

  function goTo(idx: number) {
    setAnswers((prev) => prev.map((a, i) => i === currentQ ? { ...a, text: currentAnswer } : a));
    setCurrentQ(idx);
    setCurrentAnswer(answers[idx]?.text ?? "");
  }

  // ── Submit all answers ────────────────────────────────────────────────────

  async function submitAll() {
    const finalAnswers = answers.map((a, i) => i === currentQ ? { ...a, text: currentAnswer } : a);
    setAnswers(finalAnswers);
    setPhase("scoring");

    try {
      const res = await fetch("/api/ai/score-answers", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({
          weekSummary: selectedWeek!.weekSummaryCurrent ?? selectedWeek!.weekSummary ?? "",
          days: selectedWeek!.days.filter((d) => d.hasNotes).map((d) => ({
            dayName: d.dayName,
            technicalNotes: d.technicalNotesCurrent ?? d.technicalNotes ?? "",
            keyActivities: d.keyActivities ?? [],
          })),
          qa: questions.map((q, i) => ({
            question: q.question,
            hint: q.hint,
            answer: finalAnswers[i]?.text ?? "",
          })),
        }),
      });

      if (!res.ok) throw new Error();
      const { results } = await res.json();
      setAnswers(finalAnswers.map((a, i) => ({ ...a, result: results[i] })));
    } catch {
      // Fallback scoring — length-based
      setAnswers(finalAnswers.map((a) => ({
        ...a,
        result: {
          score: a.text.trim().length > 120 ? 70 : a.text.trim().length > 40 ? 50 : 25,
          feedback: a.text.trim().length > 120
            ? "Reasonable attempt. Add more specific technical detail for a higher score."
            : "Your answer is too brief. The panel expects specific procedures and outcomes.",
          modelAnswer: "A strong answer references specific steps, tools used, academic theory applied, and the outcome achieved.",
        },
      })));
    }

    setPhase("results");
  }

  // ── Reset ─────────────────────────────────────────────────────────────────

  function reset() {
    setPhase("select");
    setSelectedWeek(null);
    setQuestions([]);
    setAnswers([]);
    setCurrentQ(0);
    setCurrentAnswer("");
    setError(null);
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  if (phase === "loading") return <Spinner message="Preparing your panel questions…" />;
  if (phase === "scoring") return <Spinner message="The panel is reviewing your answers…" />;

  // ── SELECT ────────────────────────────────────────────────────────────────
  if (phase === "select") {
    return (
      <div className="page-pad" style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9, background: "#4B2E2B",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, color: "white", flexShrink: 0,
            }}>⬡</div>
            <h1 style={{
              fontFamily: "var(--font-playfair)", fontSize: 24, fontWeight: 700,
              color: "var(--text)", margin: 0,
            }}>
              Defense Prep Mode
            </h1>
          </div>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: 0, lineHeight: 1.65, maxWidth: 560 }}>
            Simulate a SIWES defense panel. Select a completed logbook week, answer 5 panel-style questions, and get AI feedback on your responses.
          </p>
        </div>

        {/* Steps callout */}
        <div className="steps-grid" style={{
          background: "#4B2E2B", borderRadius: 12, padding: "18px 22px",
          marginBottom: 32,
        }}>
          {[
            { n: "01", title: "Select a week", desc: "Pick any completed logbook week to practice." },
            { n: "02", title: "Answer 5 questions", desc: "Panel-style questions based on your real entries." },
            { n: "03", title: "Get scored", desc: "AI marks each answer and suggests improvements." },
          ].map((step) => (
            <div key={step.n}>
              <div style={{
                fontFamily: "var(--font-dm-mono)", fontSize: 9, fontWeight: 700,
                color: "#B8805F", letterSpacing: "0.1em", marginBottom: 5,
              }}>
                STEP {step.n}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "white", marginBottom: 3 }}>
                {step.title}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
                {step.desc}
              </div>
            </div>
          ))}
        </div>

        {practicableWeeks.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "52px 24px",
            border: "1px solid var(--border)", borderRadius: 12, background: "var(--bg)",
          }}>
            <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.35 }}>⬡</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
              No completed weeks yet
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 22 }}>
              Log at least one day to start practicing your defense.
            </div>
            <button
              onClick={() => router.push("/entry")}
              style={{
                padding: "9px 24px", borderRadius: 9,
                background: "#8C5A3C", color: "white", border: "none",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              Log your first entry →
            </button>
          </div>
        ) : (
          <>
            <div style={{
              fontFamily: "var(--font-dm-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "var(--muted)", marginBottom: 12,
            }}>
              Choose a week to practice
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
              gap: 10, marginBottom: 28,
            }}>
              {practicableWeeks.map((week) => (
                <WeekOption
                  key={week.weekNumber}
                  week={week}
                  selected={selectedWeek?.weekNumber === week.weekNumber}
                  onSelect={() => setSelectedWeek(week)}
                />
              ))}
            </div>

            {error && (
              <div style={{
                marginBottom: 16, padding: "10px 14px", borderRadius: 8,
                background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)",
                fontSize: 12, color: "#b91c1c",
              }}>
                {error}
              </div>
            )}

            <button
              onClick={() => selectedWeek && startSession(selectedWeek)}
              disabled={!selectedWeek}
              style={{
                padding: "11px 32px", borderRadius: 10,
                background: selectedWeek ? "#8C5A3C" : "var(--border)",
                color: selectedWeek ? "white" : "var(--muted)",
                border: "none", fontSize: 14, fontWeight: 600,
                cursor: selectedWeek ? "pointer" : "not-allowed",
                transition: "all 0.15s",
              }}
            >
              Start Session →
            </button>
          </>
        )}
      </div>
    );
  }

  // ── SESSION ───────────────────────────────────────────────────────────────
  if (phase === "session") {
    const q = questions[currentQ];
    const isLast = currentQ === questions.length - 1;

    return (
      <div className="page-pad" style={{ maxWidth: 760, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <div style={{
              fontFamily: "var(--font-dm-mono)", fontSize: 9, fontWeight: 700,
              letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 5,
            }}>
              Defense Prep — Week {selectedWeek!.weekNumber}
            </div>
            <div style={{
              fontFamily: "var(--font-playfair)", fontSize: 20, fontWeight: 700, color: "var(--text)",
            }}>
              Panel Session
            </div>
          </div>
          <button
            onClick={reset}
            style={{ fontSize: 11, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", marginTop: 4 }}
          >
            Exit session
          </button>
        </div>

        {/* Progress dots */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              title={`Question ${i + 1}`}
              style={{
                width: i === currentQ ? 20 : 8, height: 8,
                borderRadius: 4, border: "none", padding: 0, cursor: "pointer",
                background: i === currentQ ? "#8C5A3C" : (answers[i]?.text ? "#B8805F" : "var(--border)"),
                transition: "all 0.2s",
              }}
            />
          ))}
          <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-dm-mono)", marginLeft: 4 }}>
            {currentQ + 1} / {questions.length}
          </span>
        </div>

        {/* Question card */}
        <div style={{
          border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", marginBottom: 20,
        }}>
          {/* Dark question header */}
          <div style={{ background: "#4B2E2B", padding: "22px 26px" }}>
            <div style={{
              fontFamily: "var(--font-dm-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em",
              textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 12,
            }}>
              Panel Question {currentQ + 1}
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "white", lineHeight: 1.6 }}>
              "{q.question}"
            </div>
          </div>

          {/* Hint bar */}
          {q.hint && (
            <div style={{
              padding: "10px 26px", background: "rgba(140,90,60,0.05)",
              borderBottom: "1px solid var(--border)",
            }}>
              <span style={{
                fontFamily: "var(--font-dm-mono)", fontSize: 9, fontWeight: 700,
                color: "#8C5A3C", letterSpacing: "0.08em", textTransform: "uppercase",
              }}>
                Hint:{" "}
              </span>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>{q.hint}</span>
            </div>
          )}

          {/* Answer input */}
          <div style={{ padding: 24 }}>
            <label style={{
              display: "block", fontSize: 9, fontFamily: "var(--font-dm-mono)", fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase", color: "#8C5A3C", marginBottom: 8,
            }}>
              Your answer
            </label>
            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Type your answer as you would speak to the panel…"
              rows={6}
              style={{
                width: "100%", borderRadius: 9, border: "1px solid var(--border)",
                background: "var(--surface)", color: "var(--text)",
                padding: "12px 14px", fontSize: 13, lineHeight: 1.7,
                resize: "vertical", outline: "none", boxSizing: "border-box",
                fontFamily: "var(--font-dm-sans), sans-serif",
              }}
            />
            <div style={{ marginTop: 6, fontSize: 10, color: "var(--muted)", textAlign: "right", fontFamily: "var(--font-dm-mono)" }}>
              {currentAnswer.trim().length} chars
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={() => goTo(currentQ - 1)}
            disabled={currentQ === 0}
            style={{
              padding: "8px 18px", borderRadius: 8,
              border: "1px solid var(--border)", background: "var(--bg)",
              color: "var(--muted)", fontSize: 12,
              cursor: currentQ === 0 ? "not-allowed" : "pointer",
              opacity: currentQ === 0 ? 0.4 : 1,
            }}
          >
            ← Previous
          </button>

          {isLast ? (
            <button
              onClick={submitAll}
              style={{
                padding: "10px 28px", borderRadius: 9,
                background: "#8C5A3C", color: "white", border: "none",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              Submit & Get Scored →
            </button>
          ) : (
            <button
              onClick={() => goTo(currentQ + 1)}
              style={{
                padding: "9px 22px", borderRadius: 8,
                background: "var(--btn-primary)", color: "white", border: "none",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}
            >
              Next →
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── RESULTS ───────────────────────────────────────────────────────────────
  const overallScore =
    answers.length > 0 && answers.every((a) => a.result)
      ? Math.round(answers.reduce((sum, a) => sum + (a.result?.score ?? 0), 0) / answers.length)
      : 0;

  return (
    <div className="page-pad" style={{ maxWidth: 760, margin: "0 auto" }}>
      {/* Score header */}
      <div style={{ display: "flex", alignItems: "center", gap: 28, marginBottom: 36, flexWrap: "wrap" }}>
        <ScoreRing score={overallScore} />
        <div>
          <div style={{ fontFamily: "var(--font-dm-mono)", fontSize: 9, fontWeight: 700, color: "var(--muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
            Week {selectedWeek!.weekNumber} — Session Complete
          </div>
          <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.65, margin: 0, maxWidth: 400 }}>
            Review each question below to understand what the panel expects and how to improve your answers before your real defense.
          </p>
        </div>
      </div>

      {/* Per-question results */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 32 }}>
        {questions.map((q, i) => {
          const a = answers[i];
          const result = a?.result;
          const qScore = result?.score ?? 0;
          const qColor = qScore >= 80 ? "#22c55e" : qScore >= 60 ? "#8C5A3C" : "#ef4444";

          return (
            <div key={q.id} style={{
              border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", background: "var(--bg)",
            }}>
              {/* Question header */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                padding: "13px 18px", borderBottom: "1px solid var(--border)", background: "var(--surface)",
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: "var(--font-dm-mono)", fontSize: 9, fontWeight: 700,
                    color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4,
                  }}>
                    Q{i + 1}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", lineHeight: 1.5 }}>
                    {q.question}
                  </div>
                </div>
                <div style={{
                  flexShrink: 0, marginLeft: 16,
                  fontFamily: "var(--font-dm-mono)", fontSize: 15, fontWeight: 700, color: qColor,
                }}>
                  {qScore}/100
                </div>
              </div>

              <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Student answer */}
                <div>
                  <div style={{ fontSize: 9, fontFamily: "var(--font-dm-mono)", color: "var(--muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
                    Your answer
                  </div>
                  <div style={{
                    fontSize: 12, color: a?.text ? "var(--text)" : "var(--muted)",
                    lineHeight: 1.65, padding: "10px 12px", background: "var(--surface)",
                    borderRadius: 8, border: "1px solid var(--border)",
                    fontStyle: a?.text ? "normal" : "italic",
                  }}>
                    {a?.text || "No answer given"}
                  </div>
                </div>

                {result && (
                  <>
                    {/* Feedback */}
                    <div>
                      <div style={{ fontSize: 9, fontFamily: "var(--font-dm-mono)", color: "#8C5A3C", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
                        Panel feedback
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.65 }}>
                        {result.feedback}
                      </div>
                    </div>

                    {/* Model answer */}
                    <div style={{
                      padding: "12px 14px", borderRadius: 9,
                      background: "rgba(140,90,60,0.05)", border: "1px solid rgba(140,90,60,0.2)",
                    }}>
                      <div style={{ fontSize: 9, fontFamily: "var(--font-dm-mono)", color: "#8C5A3C", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
                        Model answer
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.65 }}>
                        {result.modelAnswer}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          onClick={reset}
          style={{
            padding: "10px 24px", borderRadius: 9,
            background: "#8C5A3C", color: "white", border: "none",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
        >
          Practice another week
        </button>
        <button
          onClick={() => {
            setQuestions([]);
            setAnswers([]);
            setCurrentQ(0);
            setCurrentAnswer("");
            setPhase("select");
            if (selectedWeek) {
              setTimeout(() => startSession(selectedWeek), 50);
            }
          }}
          style={{
            padding: "10px 24px", borderRadius: 9,
            background: "none", color: "var(--muted)",
            border: "1px solid var(--border)", fontSize: 13, cursor: "pointer",
          }}
        >
          Retry this week
        </button>
        <button
          onClick={() => router.push("/dashboard")}
          style={{
            padding: "10px 24px", borderRadius: 9,
            background: "none", color: "var(--muted)",
            border: "1px solid var(--border)", fontSize: 13, cursor: "pointer",
          }}
        >
          ← Dashboard
        </button>
      </div>
    </div>
  );
}
