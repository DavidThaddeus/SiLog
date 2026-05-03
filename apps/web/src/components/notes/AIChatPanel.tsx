"use client";

import { useState, useRef, useEffect } from "react";
import { authHeaders } from "@/lib/auth-fetch";
import { useSubscriptionStore } from "@/store/subscription";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  suggestion?: string;
}

const QUICK_PROMPTS = [
  "Make this more formal and academic",
  "Add more technical detail",
  "Strengthen the academic bridge",
  "Make it shorter and more concise",
  "Rewrite the opening paragraph",
];

interface Props {
  currentNotes: string;
  dayName: string;
  onApplySuggestion: (text: string) => void;
  notesLengthMode?: "short" | "long";
}

export function AIChatPanel({ currentNotes, dayName, onApplySuggestion, notesLengthMode = "long" }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "ai",
      content: `I can help you improve the ${dayName} technical notes. You can ask me to rewrite sections, add more academic depth, change the tone, or make any other adjustments. Just describe what you want.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const callsToday = useSubscriptionStore((s) => s.callsToday);
  const dailyLimit = useSubscriptionStore((s) => s.dailyLimit);
  const limitReached = callsToday !== null && dailyLimit !== null && callsToday >= dailyLimit;

  // Fetch current usage on mount so the limit check is accurate even if the user
  // landed on this page directly without visiting the entry page first
  useEffect(() => {
    if (callsToday === null) {
      authHeaders().then((headers) =>
        fetch("/api/ai/usage", { headers })
          .then((r) => r.json())
          .then((d) => {
            if (typeof d.callsToday === "number" && typeof d.dailyLimit === "number") {
              useSubscriptionStore.getState().setDailyUsage(d.callsToday, d.dailyLimit);
            }
          })
          .catch(() => {})
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading || limitReached) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/rewrite", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ instruction: text, currentNotes, dayName, notesLengthPreference: notesLengthMode }),
      });

      if (res.status === 429) {
        const errData = await res.json().catch(() => ({}));
        const lim = typeof errData?.limit === "number" ? errData.limit : dailyLimit;
        const used = typeof errData?.callsToday === "number" ? errData.callsToday : lim;
        if (lim !== null && used !== null) useSubscriptionStore.getState().setDailyUsage(used, lim);
        setMessages((m) => [...m, {
          id: (Date.now() + 1).toString(),
          role: "ai",
          content: `You've used all ${lim ?? ""} AI calls for today. Come back at 12:00 AM Nigeria time.`,
        }]);
        setLoading(false);
        return;
      }

      if (res.status === 402) {
        setMessages((m) => [...m, {
          id: (Date.now() + 1).toString(),
          role: "ai",
          content: "You've used all 5 free AI generations. Upgrade to continue using the AI assistant.",
        }]);
        setLoading(false);
        return;
      }

      const data = await res.json();

      // Update both daily and lifetime counters in shared store
      if (typeof data._callsToday === "number" && typeof data._dailyLimit === "number") {
        useSubscriptionStore.getState().setDailyUsage(data._callsToday, data._dailyLimit);
      }
      if (typeof data._generationsUsed === "number") {
        useSubscriptionStore.getState().setGenerationsUsed(data._generationsUsed);
      }

      setMessages((m) => [
        ...m,
        {
          id: (Date.now() + 1).toString(),
          role: "ai",
          content: data.explanation ?? "Here is the rewritten version:",
          suggestion: data.rewritten,
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: (Date.now() + 1).toString(),
          role: "ai",
          content: "Sorry, I couldn't process that right now. Make sure your API key is configured.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 18px",
          borderBottom: "1px solid var(--border)",
          background: "#4B2E2B",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#8C5A3C",
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-dm-mono)",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "white",
          }}
        >
          AI Assistant
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 9,
            color: "rgba(255,255,255,0.4)",
            fontFamily: "var(--font-dm-mono)",
          }}
        >
          SiLog AI
        </span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ marginBottom: 16 }}>
            {/* Role label */}
            <div
              style={{
                fontSize: 9,
                fontFamily: "var(--font-dm-mono)",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: msg.role === "ai" ? "#8C5A3C" : "var(--muted)",
                marginBottom: 5,
              }}
            >
              {msg.role === "ai" ? "SiLog AI" : "You"}
            </div>

            {/* Message bubble */}
            <div
              style={{
                padding: "10px 14px",
                borderRadius: msg.role === "ai" ? "4px 12px 12px 12px" : "12px 4px 12px 12px",
                background: msg.role === "ai" ? "var(--surface)" : "#4B2E2B",
                border: msg.role === "ai" ? "1px solid var(--border)" : "none",
                fontSize: 12,
                lineHeight: 1.65,
                color: msg.role === "ai" ? "var(--text)" : "white",
              }}
            >
              {msg.content}
            </div>

            {/* Apply suggestion button */}
            {msg.suggestion && (
              <div style={{ marginTop: 8 }}>
                <div
                  style={{
                    padding: "10px 14px",
                    background: "rgba(140,90,60,0.06)",
                    border: "1px dashed rgba(140,90,60,0.3)",
                    borderRadius: 8,
                    fontSize: 11,
                    lineHeight: 1.6,
                    color: "var(--muted)",
                    marginBottom: 8,
                    maxHeight: 120,
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <span
                    style={{
                      fontSize: 9,
                      fontFamily: "var(--font-dm-mono)",
                      color: "#8C5A3C",
                      display: "block",
                      marginBottom: 4,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    Suggested rewrite (preview)
                  </span>
                  {msg.suggestion.slice(0, 200)}…
                </div>
                <button
                  onClick={() => onApplySuggestion(msg.suggestion!)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 8,
                    background: "var(--btn-primary)",
                    color: "white",
                    border: "none",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Apply suggestion →
                </button>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
            <div
              style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "#8C5A3C",
                animation: "pulse 1.2s ease-in-out infinite",
              }}
            />
            <span style={{ fontSize: 11, color: "var(--muted)" }}>Thinking…</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <div
        style={{
          padding: "8px 12px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          gap: 6,
          overflowX: "auto",
          background: "var(--surface)",
        }}
      >
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => sendMessage(p)}
            disabled={loading || limitReached}
            style={{
              padding: "4px 10px",
              borderRadius: 20,
              border: "1px solid var(--border)",
              background: "var(--card)",
              fontSize: 10,
              color: "var(--muted)",
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div
        style={{
          padding: "12px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          gap: 8,
        }}
      >
        <textarea
          rows={2}
          placeholder={limitReached ? "Daily limit reached · Come back at 12:00 AM" : "Ask the AI to change anything…"}
          value={input}
          disabled={limitReached}
          maxLength={300}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage(input);
            }
          }}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--card)",
            fontSize: 12,
            resize: "none",
            color: "var(--text)",
            outline: "none",
            fontFamily: "var(--font-sans)",
          }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading || limitReached}
          style={{
            padding: "0 14px",
            borderRadius: 8,
            background: input.trim() && !loading ? "var(--btn-primary)" : "var(--btn-disabled)",
            color: "white",
            border: "none",
            fontSize: 16,
            cursor: input.trim() ? "pointer" : "default",
            alignSelf: "stretch",
            transition: "background 0.15s",
          }}
        >
          ↑
        </button>
      </div>
    </div>
  );
}
