"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useDashboardStore } from "@/store/dashboard";
import { useInitWeeks } from "@/hooks/useInitWeeks";
import type { BankedActivity } from "@/types/dashboard";

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function daysUntilExpiry(expiresAt: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const exp = new Date(expiresAt + "T00:00:00");
  return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function ExpiryBadge({ expiresAt }: { expiresAt: string }) {
  const days = daysUntilExpiry(expiresAt);
  const expired = days <= 0;
  const urgent = days > 0 && days <= 7;

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 20,
      fontSize: 9, fontFamily: "var(--font-dm-mono)", fontWeight: 700, letterSpacing: "0.06em",
      background: expired ? "rgba(239,68,68,0.1)" : urgent ? "rgba(234,179,8,0.12)" : "rgba(140,90,60,0.08)",
      color: expired ? "#DC2626" : urgent ? "#92400E" : "var(--muted)",
      border: `1px solid ${expired ? "rgba(239,68,68,0.25)" : urgent ? "rgba(234,179,8,0.3)" : "var(--border)"}`,
    }}>
      {expired ? "Expired" : urgent ? `${days}d left` : `Expires ${fmtDate(expiresAt)}`}
    </span>
  );
}

// ─── Activity item card ──────────────────────────────────────────────────────

function BankItemCard({ item, selected, onToggleSelect, onEdit, onDelete, onUseInEntry }: {
  item: BankedActivity;
  selected: boolean;
  onToggleSelect: () => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onUseInEntry: (item: BankedActivity) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.activityText);
  const days = daysUntilExpiry(item.expiresAt);
  const expired = days <= 0;
  const urgent = days > 0 && days <= 7;
  const needsAction = expired || urgent;

  const handleSave = () => {
    if (draft.trim() && draft.trim() !== item.activityText) {
      onEdit(item.id, draft.trim());
    }
    setEditing(false);
  };

  return (
    <div style={{
      borderRadius: 12,
      border: `1px solid ${selected ? "#8C5A3C" : expired ? "rgba(239,68,68,0.2)" : urgent ? "rgba(234,179,8,0.25)" : "var(--border)"}`,
      background: selected ? "rgba(140,90,60,0.04)" : expired ? "rgba(239,68,68,0.03)" : "var(--card)",
      overflow: "hidden", transition: "all 0.15s",
    }}>
      {/* Expiry warning banner */}
      {needsAction && (
        <div style={{
          padding: "6px 16px",
          background: expired ? "rgba(239,68,68,0.08)" : "rgba(234,179,8,0.08)",
          borderBottom: `1px solid ${expired ? "rgba(239,68,68,0.15)" : "rgba(234,179,8,0.2)"}`,
          fontSize: 11, color: expired ? "#DC2626" : "#92400E",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <span style={{ fontSize: 12 }}>{expired ? "⚠" : "⏳"}</span>
          {expired
            ? "This activity has expired. Convert it to a logbook entry or discard it."
            : `Expiring soon — ${days} day${days === 1 ? "" : "s"} remaining.`}
        </div>
      )}

      <div style={{ padding: "14px 16px" }}>
        {/* Checkbox + Activity text row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          {/* Checkbox */}
          <div
            onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
            style={{
              width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 2,
              border: `2px solid ${selected ? "#8C5A3C" : "var(--border)"}`,
              background: selected ? "#8C5A3C" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            {selected && <span style={{ fontSize: 10, color: "white", fontWeight: 700, lineHeight: 1 }}>✓</span>}
          </div>

          <div style={{ flex: 1 }}>
            {/* Activity text */}
            {editing ? (
              <div style={{ marginBottom: 12 }}>
                <textarea
                  rows={2}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  autoFocus
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: 8,
                    border: "1px solid rgba(140,90,60,0.35)", background: "var(--input-bg)",
                    fontSize: 13, lineHeight: 1.6, color: "var(--text)", resize: "none",
                    fontFamily: "var(--font-sans)", outline: "none", boxSizing: "border-box",
                  }}
                />
                <div style={{ display: "flex", gap: 6, marginTop: 8, justifyContent: "flex-end" }}>
                  <button onClick={() => { setEditing(false); setDraft(item.activityText); }}
                    style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--card)", fontSize: 11, color: "var(--muted)", cursor: "pointer" }}>
                    Cancel
                  </button>
                  <button onClick={handleSave}
                    style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: "var(--btn-primary)", color: "white", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6, margin: "0 0 10px" }}>
                {item.activityText}
              </p>
            )}

            {/* Meta row */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{
                fontSize: 10, fontFamily: "var(--font-dm-mono)", color: "var(--muted)",
                padding: "2px 8px", borderRadius: 20, background: "var(--surface)",
                border: "1px solid var(--border)",
              }}>
                Originally {fmtDate(item.originalDate)}
              </span>
              <ExpiryBadge expiresAt={item.expiresAt} />
            </div>

            {/* Action row */}
            {!editing && (
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={() => onUseInEntry(item)}
                  style={{
                    padding: "5px 14px", borderRadius: 8, border: "none",
                    background: "var(--btn-primary)", color: "white", fontSize: 11, fontWeight: 600, cursor: "pointer",
                  }}>
                  Use in entry →
                </button>
                <button onClick={() => setEditing(true)}
                  style={{
                    padding: "5px 12px", borderRadius: 8,
                    border: "1px solid var(--border)", background: "var(--surface)",
                    fontSize: 11, color: "var(--muted)", cursor: "pointer", fontFamily: "var(--font-dm-mono)",
                  }}>
                  Edit
                </button>
                <button onClick={() => onDelete(item.id)}
                  style={{
                    padding: "5px 12px", borderRadius: 8,
                    border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.04)",
                    fontSize: 11, color: "#DC2626", cursor: "pointer", marginLeft: "auto",
                  }}>
                  Discard
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Add activity form ───────────────────────────────────────────────────────

function AddActivityForm({ onAdd }: { onAdd: (text: string, date: string) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);

  const handleAdd = () => {
    if (text.trim() && date) {
      onAdd(text.trim(), date);
      setText("");
      setDate(today);
      setOpen(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        style={{
          display: "flex", alignItems: "center", gap: 8, width: "100%",
          padding: "12px 16px", borderRadius: 12,
          border: "1.5px dashed rgba(140,90,60,0.35)", background: "var(--card)",
          fontSize: 13, color: "#8C5A3C", cursor: "pointer", fontWeight: 500,
          transition: "all 0.15s",
        }}>
        <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
        Add activity manually
      </button>
    );
  }

  return (
    <div style={{
      padding: "16px 18px", borderRadius: 12,
      border: "1px solid rgba(140,90,60,0.35)", background: "rgba(140,90,60,0.04)",
    }}>
      <div style={{
        fontSize: 9, fontFamily: "var(--font-dm-mono)", fontWeight: 700,
        letterSpacing: "0.12em", textTransform: "uppercase", color: "#8C5A3C", marginBottom: 12,
      }}>
        Add to Activity Bank
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={{
          display: "block", fontSize: 10, fontFamily: "var(--font-dm-mono)", color: "var(--muted)",
          fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4,
        }}>
          Activity description
        </label>
        <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Configured static IP for workstations in accounts department"
          autoFocus
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 8,
            border: "1px solid rgba(140,90,60,0.25)", background: "var(--input-bg)",
            fontSize: 13, lineHeight: 1.6, color: "var(--text)", resize: "none",
            fontFamily: "var(--font-sans)", outline: "none", boxSizing: "border-box",
          }}
        />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={{
          display: "block", fontSize: 10, fontFamily: "var(--font-dm-mono)", color: "var(--muted)",
          fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4,
        }}>
          Date it actually happened
        </label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={today}
          style={{
            padding: "9px 12px", borderRadius: 8, border: "1px solid rgba(140,90,60,0.25)",
            background: "var(--input-bg)", fontSize: 12, color: "var(--text)", fontFamily: "var(--font-sans)",
            outline: "none", cursor: "pointer",
          }}
        />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => { setOpen(false); setText(""); setDate(today); }}
          style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12, color: "var(--muted)", cursor: "pointer" }}>
          Cancel
        </button>
        <button onClick={handleAdd} disabled={!text.trim() || !date}
          style={{
            padding: "7px 20px", borderRadius: 8, border: "none",
            background: text.trim() && date ? "var(--btn-primary)" : "var(--btn-disabled)",
            color: "white", fontSize: 12, fontWeight: 600,
            cursor: text.trim() && date ? "pointer" : "default",
          }}>
          Save to Bank
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ActivityBankPage() {
  const router = useRouter();
  const { activityBank, addToBank, removeFromBank, editBankItem } = useDashboardStore();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useInitWeeks();

  const items = activityBank.items;

  const { expiredItems, urgentItems, activeItems, sorted, coversDays } = useMemo(() => {
    const expired: typeof items = [];
    const urgent: typeof items = [];
    const normal: typeof items = [];

    for (const a of items) {
      const d = daysUntilExpiry(a.expiresAt);
      if (d <= 0) expired.push(a);
      else if (d <= 7) urgent.push(a);
      else normal.push(a);
    }

    return {
      expiredItems: expired,
      urgentItems: urgent,
      activeItems: normal,
      sorted: [...expired, ...urgent, ...normal],
      coversDays: Math.ceil(items.length / 2.5),
    };
  }, [items]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(sorted.map((a) => a.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function useSelectedInEntry() {
    const ids = Array.from(selectedIds).join(",");
    router.push(`/entry?bankItems=${ids}`);
  }

  function handleDelete(id: string) {
    removeFromBank(id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface)" }}>
      <div className="page-pad" style={{ maxWidth: 720, margin: "0 auto", paddingBottom: 120 }}>

        {/* Back */}
        <button onClick={() => router.push("/dashboard")}
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", marginBottom: 28, padding: 0 }}>
          ← Dashboard
        </button>

        {/* Page header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            fontSize: 9, fontFamily: "var(--font-dm-mono)", fontWeight: 700, color: "#8C5A3C",
            letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6,
          }}>
            03 / Activity Bank
          </div>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 28, fontWeight: 700, color: "var(--text)", marginBottom: 8, lineHeight: 1.2 }}>
            Your Activity Bank
          </h1>
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
            Real activities saved from your busy days. Select one or more to use in a logbook entry — keeping every week balanced and authentic.
          </p>
        </div>

        {/* Stats row */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 12, marginBottom: 28,
        }}>
          {[
            {
              value: String(items.length),
              label: items.length === 1 ? "Activity saved" : "Activities saved",
              sub: items.length === 0 ? "Log a busy day to populate" : `Covering ~${coversDays} empty ${coversDays === 1 ? "day" : "days"}`,
              accent: items.length > 0,
            },
            {
              value: String(expiredItems.length),
              label: "Expired",
              sub: expiredItems.length > 0 ? "Convert or discard these" : "None expired",
              accent: false,
              warn: expiredItems.length > 0,
            },
            {
              value: String(urgentItems.length),
              label: "Expiring soon",
              sub: urgentItems.length > 0 ? "Use within 7 days" : "All activities are fresh",
              accent: false,
              warn: urgentItems.length > 0,
            },
          ].map((stat, i) => (
            <div key={i} style={{
              padding: "16px 18px", borderRadius: 12,
              border: `1px solid ${stat.warn ? "rgba(234,179,8,0.25)" : "var(--border)"}`,
              background: stat.warn ? "rgba(234,179,8,0.04)" : "var(--card)",
            }}>
              <div style={{
                fontFamily: "var(--font-playfair)", fontSize: 28, fontWeight: 700,
                color: stat.warn ? "#92400E" : stat.accent ? "#8C5A3C" : "var(--text)",
                lineHeight: 1, marginBottom: 4,
              }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>{stat.label}</div>
              <div style={{ fontSize: 10, color: "var(--muted)" }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* How it works callout */}
        {items.length === 0 && (
          <div style={{
            marginBottom: 24, padding: "16px 20px", borderRadius: 12,
            background: "#4B2E2B", borderLeft: "3px solid #8C5A3C",
          }}>
            <div style={{ fontSize: 9, fontFamily: "var(--font-dm-mono)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#B8805F", marginBottom: 6 }}>
              How the Activity Bank works
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.65 }}>
              When you log a very busy day and describe more than 2–3 activities, the extras are automatically saved here. On your quiet or absent days, the AI pulls from this bank — writing each activity as if it happened on that day. Every entry stays real, your authorship stays intact.
            </div>
          </div>
        )}

        {/* Add activity */}
        <div style={{ marginBottom: 20 }}>
          <AddActivityForm onAdd={(text, date) => addToBank([{ text, date }])} />
        </div>

        {/* Select all / clear row */}
        {sorted.length > 0 && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={selectAll}
                style={{ fontSize: 11, color: "#8C5A3C", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}>
                Select all
              </button>
              {selectedIds.size > 0 && (
                <>
                  <span style={{ color: "var(--border)" }}>·</span>
                  <button onClick={clearSelection}
                    style={{ fontSize: 11, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    Clear
                  </button>
                  <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-dm-mono)" }}>
                    ({selectedIds.size} selected)
                  </span>
                </>
              )}
            </div>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>
              {sorted.length} {sorted.length === 1 ? "activity" : "activities"}
            </span>
          </div>
        )}

        {/* Activity list */}
        {sorted.length === 0 ? (
          <div style={{
            padding: "48px 24px", textAlign: "center", borderRadius: 12,
            border: "1px dashed var(--border)", background: "var(--card)",
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>◈</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
              Your bank is empty
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6, maxWidth: 360, margin: "0 auto" }}>
              Log a busy day and mark extra activities to be banked. Or add them manually above.
            </div>
            <button onClick={() => router.push("/entry")}
              style={{
                marginTop: 20, padding: "9px 24px", borderRadius: 8, border: "none",
                background: "var(--btn-primary)", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>
              + Log a new entry
            </button>
          </div>
        ) : (
          <div>
            {/* Expired section */}
            {expiredItems.length > 0 && (
              <div>
                <div style={{
                  fontSize: 9, fontFamily: "var(--font-dm-mono)", fontWeight: 700, letterSpacing: "0.12em",
                  textTransform: "uppercase", color: "#DC2626", marginBottom: 10,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span>⚠</span> Expired — action required ({expiredItems.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                  {expiredItems.map((item) => (
                    <BankItemCard key={item.id} item={item}
                      selected={selectedIds.has(item.id)}
                      onToggleSelect={() => toggleSelect(item.id)}
                      onEdit={editBankItem}
                      onDelete={handleDelete}
                      onUseInEntry={(item) => router.push(`/entry?bankItems=${item.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Urgent section */}
            {urgentItems.length > 0 && (
              <div>
                <div style={{
                  fontSize: 9, fontFamily: "var(--font-dm-mono)", fontWeight: 700, letterSpacing: "0.12em",
                  textTransform: "uppercase", color: "#92400E", marginBottom: 10,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span>⏳</span> Expiring soon ({urgentItems.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                  {urgentItems.map((item) => (
                    <BankItemCard key={item.id} item={item}
                      selected={selectedIds.has(item.id)}
                      onToggleSelect={() => toggleSelect(item.id)}
                      onEdit={editBankItem}
                      onDelete={handleDelete}
                      onUseInEntry={(item) => router.push(`/entry?bankItems=${item.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Active section */}
            {activeItems.length > 0 && (
              <div>
                {(expiredItems.length > 0 || urgentItems.length > 0) && (
                  <div style={{
                    fontSize: 9, fontFamily: "var(--font-dm-mono)", fontWeight: 700, letterSpacing: "0.12em",
                    textTransform: "uppercase", color: "var(--muted)", marginBottom: 10,
                  }}>
                    Active ({activeItems.length})
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {activeItems.map((item) => (
                    <BankItemCard key={item.id} item={item}
                      selected={selectedIds.has(item.id)}
                      onToggleSelect={() => toggleSelect(item.id)}
                      onEdit={editBankItem}
                      onDelete={handleDelete}
                      onUseInEntry={(item) => router.push(`/entry?bankItems=${item.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PRD rule: Activities expire after 4 weeks */}
        {items.length > 0 && (
          <p style={{ marginTop: 24, fontSize: 11, color: "var(--muted)", textAlign: "center", lineHeight: 1.6 }}>
            Activities automatically expire 4 weeks after their original date.
            Once used in a logbook entry, they are removed from the bank.
          </p>
        )}
      </div>

      {/* Floating selection bar */}
      {selectedIds.size > 0 && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 60,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "16px 24px",
          background: "var(--bg)",
          borderTop: "1px solid var(--border)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}>
          <div style={{
            display: "flex", alignItems: "center", flexWrap: "wrap", gap: 12,
            maxWidth: 720, width: "100%",
          }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <span style={{
                fontFamily: "var(--font-dm-mono)", fontSize: 11, fontWeight: 700, color: "#8C5A3C",
              }}>
                {selectedIds.size} {selectedIds.size === 1 ? "activity" : "activities"} selected
              </span>
              <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 8 }}>
                — ready to use in a logbook entry
              </span>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button onClick={clearSelection}
                style={{
                  padding: "9px 16px", borderRadius: 8, minHeight: 44,
                  border: "1px solid var(--border)", background: "var(--card)",
                  fontSize: 12, color: "var(--muted)", cursor: "pointer",
                }}>
                Cancel
              </button>
              <button onClick={useSelectedInEntry}
                style={{
                  padding: "9px 24px", borderRadius: 8, minHeight: 44,
                  border: "none", background: "var(--btn-primary)",
                  color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>
                Use {selectedIds.size} in entry →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
