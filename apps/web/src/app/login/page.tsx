"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useOnboardingStore } from "@/store/onboarding";
import { isFunaabEmail } from "@/lib/pricing";

export default function LoginPage() {
  const router = useRouter();

  // Force light mode on login/signup — no dark mode on auth pages
  useEffect(() => {
    const prev = document.documentElement.getAttribute("data-theme");
    document.documentElement.setAttribute("data-theme", "light");
    return () => {
      if (prev) document.documentElement.setAttribute("data-theme", prev);
      else document.documentElement.removeAttribute("data-theme");
    };
  }, []);

  // If already logged in with a profile, skip straight to dashboard
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", session.user.id)
        .maybeSingle();
      if (profile) router.replace("/dashboard");
    });
  }, [router]);

  const [mode, setMode] = useState<"login" | "signup" | "forgot" | "forgot-otp" | "verify">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function switchMode(m: "login" | "signup" | "forgot" | "forgot-otp" | "verify") {
    setMode(m);
    setError(null);
    setSuccess(null);
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
  }

  async function handleForgotPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, type: "recovery" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to send code.");
    } else {
      switchMode("forgot-otp");
      setSuccess("A 6-digit code was sent to your email. Enter it below with your new password.");
    }
    setLoading(false);
  }

  async function handleResetWithOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code: otp.trim(), type: "recovery", newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Verification failed.");
    } else {
      switchMode("login");
      setSuccess("Password updated! Sign in with your new password.");
    }
    setLoading(false);
  }

  async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    // Verify OTP and create confirmed account via our API
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code: otp.trim(), type: "signup", password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Verification failed.");
      setLoading(false);
      return;
    }
    // Account confirmed — sign in normally
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError || !signInData.session) {
      setError("Account verified but sign-in failed. Please sign in manually.");
      setLoading(false);
      return;
    }
    useOnboardingStore.getState().reset();
    router.replace("/onboarding");
    setLoading(false);
  }

  async function handleResend() {
    setError(null);
    setSuccess(null);
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, type: "signup" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not resend code.");
    } else {
      setSuccess("A new 6-digit code has been sent to your inbox.");
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (mode === "signup") {
      // Send OTP via Resend — never touches Supabase email
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "signup" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to send verification code.");
      } else {
        switchMode("verify");
        setSuccess("A 6-digit code was sent to your email. Enter it below to confirm your account.");
      }
    } else {
      // LOGIN
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.toLowerCase().includes("email not confirmed")) {
          setError("Email not confirmed. Use the verification code sent to your inbox.");
        } else if (error.message.toLowerCase().includes("invalid login credentials")) {
          setError("Incorrect email or password.");
        } else {
          setError(error.message);
        }
      } else if (data.user) {
        const { data: profile } = await supabase
          .from("profiles").select("id").eq("id", data.user.id).maybeSingle();
        if (profile) {
          router.replace("/dashboard");
        } else {
          useOnboardingStore.getState().reset();
          router.replace("/onboarding");
        }
      }
    }

    setLoading(false);
  }

  const isFunaab = isFunaabEmail(email);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--surface)", padding: "24px",
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36, justifyContent: "center" }}>
          <Image
            src="/silogfinal.png"
            alt="SiLog logo"
            width={68}
            height={68}
            style={{ flexShrink: 0, objectFit: "contain" }}
          />
          <div>
            <div style={{ fontFamily: "var(--font-playfair)", fontSize: 18, fontWeight: 700, color: "var(--text)" }}>
              SiLog
            </div>
            <div style={{ fontSize: 10, fontFamily: "var(--font-dm-mono)", color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Logbook Assistant
            </div>
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: "var(--card)", borderRadius: 16, border: "1px solid var(--border)",
          padding: "32px 28px",
        }}>

          {/* Mode tabs — hidden on forgot/forgot-otp/verify screens */}
          {mode !== "forgot" && mode !== "forgot-otp" && mode !== "verify" && (
            <div style={{ display: "flex", marginBottom: 28, borderBottom: "1px solid var(--border)" }}>
              {(["login", "signup"] as const).map((m) => (
                <button key={m} onClick={() => switchMode(m)}
                  style={{
                    flex: 1, padding: "10px 0", border: "none", background: "none",
                    fontSize: 13, fontWeight: mode === m ? 600 : 400,
                    color: mode === m ? "var(--text-secondary)" : "var(--muted)",
                    borderBottom: `2px solid ${mode === m ? "#8C5A3C" : "transparent"}`,
                    cursor: "pointer", transition: "all 0.15s", marginBottom: -1,
                  }}>
                  {m === "login" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>
          )}

          {/* ── Verify OTP screen ── */}
          {mode === "verify" ? (
            <form onSubmit={handleVerify}>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>✉️</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
                  Check your email
                </div>
                <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>
                  We sent a 6-digit code to <strong>{email}</strong>.<br />
                  Enter it below to activate your account.
                </p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{
                  display: "block", fontSize: 9, fontFamily: "var(--font-dm-mono)", fontWeight: 700,
                  letterSpacing: "0.12em", textTransform: "uppercase", color: "#8C5A3C", marginBottom: 6,
                }}>
                  Verification code
                </label>
                <input
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  style={{
                    width: "100%", padding: "14px", borderRadius: 9, textAlign: "center",
                    border: "1px solid var(--border)", background: "var(--surface)",
                    fontSize: 22, fontWeight: 700, letterSpacing: "0.3em",
                    color: "var(--text)", fontFamily: "var(--font-dm-mono)",
                    outline: "none", boxSizing: "border-box",
                  }}
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
              {success && (
                <div style={{
                  marginBottom: 16, padding: "10px 14px", borderRadius: 8,
                  background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.25)",
                  fontSize: 12, color: "#15803d",
                }}>
                  {success}
                </div>
              )}

              <button type="submit" disabled={loading || otp.length < 6}
                style={{
                  width: "100%", padding: "12px", borderRadius: 9, border: "none",
                  background: loading || otp.length < 6 ? "var(--border)" : "var(--btn-primary)",
                  color: "white", fontSize: 13, fontWeight: 600,
                  cursor: loading || otp.length < 6 ? "not-allowed" : "pointer",
                  transition: "background 0.15s",
                }}>
                {loading ? "Verifying…" : "Verify & continue →"}
              </button>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, fontSize: 12 }}>
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 0 }}
                >
                  ← Back to sign in
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#8C5A3C", fontWeight: 600, padding: 0 }}
                >
                  Resend code
                </button>
              </div>
            </form>

          ) : mode === "forgot" ? (
            /* ── Forgot password form ── */
            <form onSubmit={handleForgotPassword}>
              <button
                type="button"
                onClick={() => switchMode("login")}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#8C5A3C", fontSize: 12, fontWeight: 600,
                  padding: 0, marginBottom: 20, display: "flex", alignItems: "center", gap: 4,
                }}
              >
                ← Back to sign in
              </button>
              <div style={{ marginBottom: 6, fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
                Reset your password
              </div>
              <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 20, lineHeight: 1.6 }}>
                Enter your email and we&apos;ll send you a 6-digit code to reset your password.
              </p>
              <div style={{ marginBottom: 20 }}>
                <label style={{
                  display: "block", fontSize: 9, fontFamily: "var(--font-dm-mono)", fontWeight: 700,
                  letterSpacing: "0.12em", textTransform: "uppercase", color: "#8C5A3C", marginBottom: 6,
                }}>
                  Email address
                </label>
                <input
                  type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu.ng"
                  style={{
                    width: "100%", padding: "11px 14px", borderRadius: 9,
                    border: "1px solid var(--border)", background: "var(--surface)",
                    fontSize: 13, color: "var(--text)", fontFamily: "var(--font-sans)",
                    outline: "none", boxSizing: "border-box",
                  }}
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
              {success && (
                <div style={{
                  marginBottom: 16, padding: "10px 14px", borderRadius: 8,
                  background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.25)",
                  fontSize: 12, color: "#15803d", display: "flex", alignItems: "flex-start", gap: 8,
                }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>✓</span>
                  {success}
                </div>
              )}
              <button type="submit" disabled={loading}
                style={{
                  width: "100%", padding: "12px", borderRadius: 9, border: "none",
                  background: loading ? "var(--border)" : "var(--btn-primary)",
                  color: "white", fontSize: 13, fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer", transition: "background 0.15s",
                }}>
                {loading ? "Sending…" : "Send code →"}
              </button>
            </form>

          ) : mode === "forgot-otp" ? (
            /* ── Enter reset code + new password ── */
            <form onSubmit={handleResetWithOtp}>
              <button
                type="button"
                onClick={() => switchMode("forgot")}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#8C5A3C", fontSize: 12, fontWeight: 600,
                  padding: 0, marginBottom: 20, display: "flex", alignItems: "center", gap: 4,
                }}
              >
                ← Back
              </button>
              <div style={{ marginBottom: 6, fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
                Set a new password
              </div>
              {success && (
                <div style={{
                  marginBottom: 16, padding: "10px 14px", borderRadius: 8,
                  background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.25)",
                  fontSize: 12, color: "#15803d",
                }}>
                  {success}
                </div>
              )}
              <div style={{ marginBottom: 16 }}>
                <label style={{
                  display: "block", fontSize: 9, fontFamily: "var(--font-dm-mono)", fontWeight: 700,
                  letterSpacing: "0.12em", textTransform: "uppercase", color: "#8C5A3C", marginBottom: 6,
                }}>
                  6-digit code from email
                </label>
                <input
                  type="text" required value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456" maxLength={6} inputMode="numeric" autoComplete="one-time-code"
                  style={{
                    width: "100%", padding: "14px", borderRadius: 9, textAlign: "center",
                    border: "1px solid var(--border)", background: "var(--surface)",
                    fontSize: 22, fontWeight: 700, letterSpacing: "0.3em",
                    color: "var(--text)", fontFamily: "var(--font-dm-mono)",
                    outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{
                  display: "block", fontSize: 9, fontFamily: "var(--font-dm-mono)", fontWeight: 700,
                  letterSpacing: "0.12em", textTransform: "uppercase", color: "#8C5A3C", marginBottom: 6,
                }}>
                  New password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"} required value={newPassword} minLength={6}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    style={{
                      width: "100%", padding: "11px 44px 11px 14px", borderRadius: 9,
                      border: "1px solid var(--border)", background: "var(--surface)",
                      fontSize: 13, color: "var(--text)", outline: "none", boxSizing: "border-box",
                    }}
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 2, display: "flex", alignItems: "center" }}>
                    {showPassword
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{
                  display: "block", fontSize: 9, fontFamily: "var(--font-dm-mono)", fontWeight: 700,
                  letterSpacing: "0.12em", textTransform: "uppercase", color: "#8C5A3C", marginBottom: 6,
                }}>
                  Confirm new password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"} required value={confirmPassword} minLength={6}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your new password"
                    style={{
                      width: "100%", padding: "11px 44px 11px 14px", borderRadius: 9,
                      border: "1px solid var(--border)", background: "var(--surface)",
                      fontSize: 13, color: "var(--text)", outline: "none", boxSizing: "border-box",
                    }}
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 2, display: "flex", alignItems: "center" }}>
                    {showPassword
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
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
              <button type="submit" disabled={loading || otp.length < 6}
                style={{
                  width: "100%", padding: "12px", borderRadius: 9, border: "none",
                  background: loading || otp.length < 6 ? "var(--border)" : "var(--btn-primary)",
                  color: "white", fontSize: 13, fontWeight: 600,
                  cursor: loading || otp.length < 6 ? "not-allowed" : "pointer",
                }}>
                {loading ? "Updating…" : "Update password →"}
              </button>
            </form>

          ) : (
          /* ── Login / Signup form ── */
          <form onSubmit={handleSubmit}>

            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: "block", fontSize: 9, fontFamily: "var(--font-dm-mono)", fontWeight: 700,
                letterSpacing: "0.12em", textTransform: "uppercase", color: "#8C5A3C", marginBottom: 6,
              }}>
                Email address
              </label>
              <input
                type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu.ng"
                style={{
                  width: "100%", padding: "11px 14px", borderRadius: 9,
                  border: "1px solid var(--border)", background: "var(--surface)",
                  fontSize: 13, color: "var(--text)", fontFamily: "var(--font-sans)",
                  outline: "none", boxSizing: "border-box",
                }}
              />
            </div>

            {/* FUNAAB discount badge — shown when email matches */}
            {mode === "signup" && isFunaab && (
              <div style={{
                marginBottom: 16, padding: "9px 13px", borderRadius: 8,
                background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.3)",
                fontSize: 12, color: "#15803d", display: "flex", alignItems: "center", gap: 7,
              }}>
                <span style={{ fontSize: 14 }}>🎓</span>
                <span><strong>FUNAAB student detected</strong> — you get ₦3,500/month instead of ₦4,000.</span>
              </div>
            )}

            {/* Password with show/hide toggle */}
            <div style={{ marginBottom: mode === "login" ? 8 : 24 }}>
              <label style={{
                display: "block", fontSize: 9, fontFamily: "var(--font-dm-mono)", fontWeight: 700,
                letterSpacing: "0.12em", textTransform: "uppercase", color: "#8C5A3C", marginBottom: 6,
              }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
                  minLength={6}
                  style={{
                    width: "100%", padding: "11px 44px 11px 14px", borderRadius: 9,
                    border: "1px solid var(--border)", background: "var(--surface)",
                    fontSize: 13, color: "var(--text)", fontFamily: "var(--font-sans)",
                    outline: "none", boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  title={showPassword ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--muted)", padding: 2, lineHeight: 1,
                    fontSize: 16, display: "flex", alignItems: "center",
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

            {/* Forgot password link — login mode only */}
            {mode === "login" && (
              <div style={{ marginBottom: 20, textAlign: "right" }}>
                <button
                  type="button"
                  onClick={() => switchMode("forgot")}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "#8C5A3C", fontSize: 12, fontWeight: 500, padding: 0,
                  }}
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                marginBottom: 16, padding: "10px 14px", borderRadius: 8,
                background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)",
                fontSize: 12, color: "#b91c1c",
              }}>
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div style={{
                marginBottom: 16, padding: "10px 14px", borderRadius: 8,
                background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.25)",
                fontSize: 12, color: "#15803d", display: "flex", alignItems: "flex-start", gap: 8,
              }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>✓</span>
                {success}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{
                width: "100%", padding: "12px", borderRadius: 9, border: "none",
                background: loading ? "var(--border)" : "var(--btn-primary)",
                color: "white", fontSize: 13, fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer", transition: "background 0.15s",
              }}>
              {loading
                ? "Please wait…"
                : mode === "login" ? "Sign in →" : "Create account →"}
            </button>

            {/* FUNAAB info blurb — signup tab, email not yet matching */}
            {mode === "signup" && !isFunaab && (
              <p style={{
                margin: "16px 0 0", fontSize: 11, color: "var(--muted)",
                textAlign: "center", lineHeight: 1.6,
              }}>
                FUNAAB student? Sign up with your{" "}
                <span style={{ color: "#8C5A3C", fontWeight: 600 }}>@student.funaab.edu.ng</span>{" "}
                email to get <strong>₦3,500/month</strong> instead of ₦4,000.
              </p>
            )}
          </form>
          )}
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: "var(--muted)", marginTop: 20, lineHeight: 1.6 }}>
          Your logbook data is private and linked only to your account.
        </p>
      </div>
    </div>
  );
}
