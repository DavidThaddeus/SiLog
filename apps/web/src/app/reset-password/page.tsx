"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);

  // Force light mode
  useEffect(() => {
    const prev = document.documentElement.getAttribute("data-theme");
    document.documentElement.setAttribute("data-theme", "light");
    return () => {
      if (prev) document.documentElement.setAttribute("data-theme", prev);
      else document.documentElement.removeAttribute("data-theme");
    };
  }, []);

  // Supabase sends the user to this page with a token in the URL hash.
  // onAuthStateChange fires with event "PASSWORD_RECOVERY" once the token is exchanged.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      // Sign out so they log in fresh with new password
      await supabase.auth.signOut();
      setTimeout(() => router.replace("/login"), 2500);
    }
    setLoading(false);
  }

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 9, fontFamily: "var(--font-dm-mono)", fontWeight: 700,
    letterSpacing: "0.12em", textTransform: "uppercase", color: "#8C5A3C", marginBottom: 6,
  };
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "11px 44px 11px 14px", borderRadius: 9,
    border: "1px solid var(--border)", background: "var(--surface)",
    fontSize: 13, color: "var(--text)", fontFamily: "var(--font-sans)",
    outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--surface)", padding: 24,
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36, justifyContent: "center" }}>
          <Image src="/silogfinal.png" alt="SiLog" width={68} height={68} style={{ objectFit: "contain" }} />
          <div>
            <div style={{ fontFamily: "var(--font-playfair)", fontSize: 18, fontWeight: 700, color: "var(--text)" }}>SiLog</div>
            <div style={{ fontSize: 10, fontFamily: "var(--font-dm-mono)", color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Logbook Assistant
            </div>
          </div>
        </div>

        <div style={{ background: "var(--card)", borderRadius: 16, border: "1px solid var(--border)", padding: "32px 28px" }}>

          {success ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
                Password updated!
              </div>
              <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
                Redirecting you to sign in…
              </p>
            </div>
          ) : !ready ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
                Verifying reset link…
              </div>
              <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
                If this page stays blank, your link may have expired.{" "}
                <button
                  onClick={() => router.replace("/login")}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#8C5A3C", fontWeight: 600, fontSize: 12 }}
                >
                  Request a new one.
                </button>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
                Set a new password
              </div>
              <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 22, lineHeight: 1.6 }}>
                Choose a strong password for your SiLog account.
              </p>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>New password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    required value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    minLength={6}
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={{
                      position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer",
                      color: "var(--muted)", padding: 2, display: "flex", alignItems: "center",
                    }}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 22 }}>
                <label style={labelStyle}>Confirm new password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  required value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your new password"
                  minLength={6}
                  style={{ ...inputStyle, paddingRight: 14 }}
                />
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

              <button type="submit" disabled={loading} style={{
                width: "100%", padding: "12px", borderRadius: 9, border: "none",
                background: loading ? "var(--border)" : "var(--btn-primary)",
                color: "white", fontSize: 13, fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
              }}>
                {loading ? "Updating…" : "Update password →"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
