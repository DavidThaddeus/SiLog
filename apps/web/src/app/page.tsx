"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

// ─── Constants ────────────────────────────────────────────────────────────────

const SIGNUP_URL = "/login";
const BROWN = "#8C5A3C";
const DARK = "#4B2E2B";
const SURFACE = "#FAF6F3";
const FAINT = "#F5EDE7";

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? "rgba(255,255,255,0.97)" : "rgba(255,255,255,0.95)",
      backdropFilter: "blur(12px)",
      borderBottom: scrolled ? "1px solid rgba(140,90,60,0.12)" : "none",
      transition: "border-color 0.2s, background 0.2s",
    }}>
      <div style={{
        maxWidth: 1160, margin: "0 auto",
        padding: "0 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 64,
      }}>
        {/* Logo */}
        <button onClick={() => scrollTo("hero")} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <Image src="/logo-192.png" alt="SiLog" width={28} height={28} style={{ borderRadius: 6 }} />
          <span style={{ fontFamily: "var(--font-playfair)", fontSize: 20, fontWeight: 700, color: DARK }}>SiLog</span>
        </button>

        {/* Desktop nav */}
        <div className="hidden sm:flex" style={{ alignItems: "center", gap: 32 }}>
          {[["Features", "features"], ["Pricing", "pricing"], ["FAQ", "faq"]].map(([label, id]) => (
            <button key={id} onClick={() => scrollTo(id)} style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 14, fontWeight: 500, color: "#555",
              transition: "color 0.15s",
            }}
              onMouseEnter={e => (e.currentTarget.style.color = DARK)}
              onMouseLeave={e => (e.currentTarget.style.color = "#555")}
            >{label}</button>
          ))}
          <Link href={SIGNUP_URL} style={{
            padding: "9px 22px", borderRadius: 8,
            background: DARK, color: "white",
            fontSize: 14, fontWeight: 600, textDecoration: "none",
            transition: "background 0.15s",
          }}
            onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.background = "#3A2220")}
            onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.background = DARK)}
          >Sign Up Free</Link>
        </div>

        {/* Mobile hamburger */}
        <button className="flex sm:hidden" onClick={() => setMobileOpen(o => !o)} style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: 22, color: DARK, padding: 4,
        }}>
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{
          background: "white", borderTop: `1px solid rgba(140,90,60,0.12)`,
          padding: "16px 24px 24px",
        }}>
          {[["Features", "features"], ["Pricing", "pricing"], ["FAQ", "faq"]].map(([label, id]) => (
            <button key={id} onClick={() => scrollTo(id)} style={{
              display: "block", width: "100%", textAlign: "left",
              background: "none", border: "none", cursor: "pointer",
              fontSize: 15, fontWeight: 500, color: "#333",
              padding: "12px 0", borderBottom: "1px solid rgba(140,90,60,0.08)",
            }}>{label}</button>
          ))}
          <Link href={SIGNUP_URL} style={{
            display: "block", marginTop: 16,
            padding: "13px 0", borderRadius: 10, textAlign: "center",
            background: DARK, color: "white",
            fontSize: 15, fontWeight: 600, textDecoration: "none",
          }}>Sign Up Free</Link>
        </div>
      )}
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section id="hero" className="hero-section" style={{
      background: `linear-gradient(160deg, #fff 0%, ${SURFACE} 60%, ${FAINT} 100%)`,
      paddingTop: 64,
    }}>
      <style>{`
        .hero-section {
          min-height: 100vh;
          display: flex;
          align-items: center;
        }
        .hero-inner {
          max-width: 1160px;
          margin: 0 auto;
          padding: 72px 24px 64px;
          width: 100%;
        }
        .hero-content { max-width: 680px; }
        .hero-ctas {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .hero-trust {
          margin-top: 14px;
          margin-bottom: 0;
          font-size: 12px;
          color: #999;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .hero-stats {
          display: flex;
          gap: 14px;
          margin-top: 32px;
          flex-wrap: wrap;
        }
        .hero-stat-card {
          padding: 14px 18px;
          border-radius: 12px;
          background: white;
          border: 1px solid rgba(140,90,60,0.12);
          box-shadow: 0 2px 12px rgba(75,46,43,0.06);
          flex: 1 1 120px;
          min-width: 110px;
          max-width: 180px;
        }
        @media (min-width: 641px) and (max-width: 960px) {
          .hero-inner { padding: 107px 32px 89px; }
          .hero-stats { margin-top: 44px; gap: 16px; }
        }
        @media (max-width: 640px) {
          .hero-section { min-height: unset; align-items: flex-start; }
          .hero-inner { padding: 90px 20px 86px; }
          .hero-ctas { flex-direction: column; align-items: flex-start; }
          .hero-ctas a { text-align: center; width: auto; padding-left: 20px; padding-right: 20px; }
          .hero-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
          .hero-stat-card { flex: unset; min-width: unset; max-width: none; padding: 12px 12px; }
          .hero-trust { font-size: 11px; gap: 6px; }
        }
      `}</style>

      <div className="hero-inner">
        <div className="hero-content">
          {/* Headline */}
          <h1 style={{
            fontFamily: "var(--font-playfair)",
            fontSize: "clamp(26px, 5vw, 44px)",
            fontWeight: 800, lineHeight: 1.15,
            color: DARK, margin: "0 0 18px",
          }}>
            Write Your SIWES Logbook in Minutes,{" "}
            <span style={{ color: BROWN }}>Not Hours</span>
          </h1>

          {/* Subheadline */}
          <p style={{
            fontSize: "clamp(13px, 1.6vw, 15px)",
            lineHeight: 1.7, color: "#555",
            maxWidth: 500, margin: "0 0 28px",
          }}>
            SiLog is your AI-powered assistant that transforms your daily experiences
            into professional logbook entries instantly. Save 50+ hours during your internship.
          </p>

          {/* CTAs */}
          <div className="hero-ctas">
            <Link href={SIGNUP_URL} style={{
              padding: "11px 24px", borderRadius: 8,
              background: DARK, color: "white",
              fontSize: 13, fontWeight: 700, textDecoration: "none",
              transition: "all 0.15s",
              boxShadow: "0 4px 14px rgba(75,46,43,0.25)",
              whiteSpace: "nowrap",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "#3A2220"; (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = DARK; (e.currentTarget as HTMLAnchorElement).style.transform = "none"; }}
            >Start Free Trial →</Link>

            <a href="#how-it-works" onClick={e => { e.preventDefault(); document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" }); }} style={{
              padding: "11px 24px", borderRadius: 8,
              background: "transparent", color: DARK,
              fontSize: 13, fontWeight: 600, textDecoration: "none",
              border: `2px solid rgba(75,46,43,0.25)`,
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = BROWN; (e.currentTarget as HTMLAnchorElement).style.color = BROWN; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(75,46,43,0.25)"; (e.currentTarget as HTMLAnchorElement).style.color = DARK; }}
            >See How It Works</a>
          </div>

          {/* Trust line */}
          <p className="hero-trust">
            <span>✓ No credit card required</span>
            <span style={{ color: "#ddd" }}>·</span>
            <span>✓ 5 free entries included</span>
            <span style={{ color: "#ddd" }}>·</span>
            <span>✓ Works on mobile & desktop</span>
          </p>
        </div>

        {/* Stat cards */}
        <div className="hero-stats">
          {[
            { number: "50+", label: "Hours saved per placement", icon: "⏱" },
            { number: "2 min", label: "Average entry time", icon: "⚡" },
            { number: "100+", label: "Students already using SiLog", icon: "🎓" },
          ].map(({ number, label, icon }) => (
            <div key={label} className="hero-stat-card">
              <div style={{ fontSize: 15, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(18px, 2.5vw, 22px)", fontWeight: 800, color: DARK }}>{number}</div>
              <div style={{ fontSize: "clamp(10px, 1.2vw, 11px)", color: "#777", marginTop: 3, lineHeight: 1.4 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Problem Section ──────────────────────────────────────────────────────────

function ProblemSection() {
  const problems = [
    { icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="1em" height="1em"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>, title: "2–3 Hours Every Night", text: "You're spending 2–3 hours writing logbook entries. Every night. That's 150+ hours wasted during a 3-month placement.", bg: "#FFF5F5" },
    { icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="1em" height="1em"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>, title: "Hard to Know What to Write", text: "You learned something. But how do you explain it professionally? You end up rewriting paragraphs because it doesn't sound right.", bg: "#FFFBF0" },
    { icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="1em" height="1em"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>, title: "The Template Trap", text: "Everyone copies Google templates. It looks professional. But you know it's not really your work. Your supervisor probably knows too.", bg: "#FFF5F5" },
    { icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="1em" height="1em"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h4.5m0 0H21m-4.5 0a9 9 0 0 0 5.25 2.25M3.75 21H12a9 9 0 0 0 9-9V3.75M3.75 21a9 9 0 0 1 9-9h12V3.75M3.75 21A9 9 0 0 0 12 21m0 0h9" /></svg>, title: "What Format Do You Even Use?", text: "Procedure? Problem-solving? Comparison? Nobody explains. Your entries look different each time. You're never sure if you're doing it right.", bg: "#F0F7FF" },
    { icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="1em" height="1em"><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.681a7.5 7.5 0 1 1-10.364 0m6.364 0a2.25 2.25 0 1 1-4.5 0m3-8.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0zm3 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0z" /></svg>, title: "Up Until Midnight Stressed", text: "It's 11 PM. You're tired. You still haven't written today's entry. So you rush through something just to get it done, then go to bed stressed.", bg: "#F5F0FF" },
  ];

  return (
    <section style={{ background: "white", padding: "clamp(48px, 8vw, 96px) clamp(16px, 4vw, 24px)" }}>
      <style>{`
        .problem-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }
        @media (max-width: 600px) {
          .problem-grid { grid-template-columns: 1fr; gap: 12px; }
          .problem-card { padding: 20px 18px !important; }
          .problem-card h3 { font-size: 14px !important; }
          .problem-card p { font-size: 12px !important; }
          .problem-card .icon { font-size: 22px !important; }
        }
      `}</style>
      <div style={{ maxWidth: 1160, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "clamp(32px, 5vw, 56px)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: BROWN, fontFamily: "var(--font-dm-mono)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>The Problem</div>
          <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(22px, 4vw, 40px)", fontWeight: 800, color: DARK, margin: 0 }}>The SIWES Logbook Problem</h2>
        </div>

        <div className="problem-grid">
          {problems.map(({ icon, title, text, bg }) => (
            <div key={title} className="problem-card" style={{
              padding: "28px 24px", borderRadius: 14,
              background: bg,
              border: "1px solid rgba(0,0,0,0.05)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "none"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"; }}
            >
              <div className="icon" style={{ fontSize: 26, marginBottom: 12 }}>{icon}</div>
              <h3 style={{ fontSize: "clamp(14px, 1.5vw, 16px)", fontWeight: 700, color: DARK, margin: "0 0 8px" }}>{title}</h3>
              <p style={{ fontSize: "clamp(12px, 1.2vw, 13px)", color: "#555", lineHeight: 1.65, margin: 0 }}>{text}</p>
            </div>
          ))}
        </div>

        {/* Closing statement */}
        <div style={{ textAlign: "center", marginTop: "clamp(28px, 4vw, 48px)" }}>
          <p style={{ fontSize: "clamp(13px, 1.8vw, 17px)", fontWeight: 600, color: DARK, margin: "0 0 8px" }}>
            The real problem? You came to learn a skill. Not spend hours documenting what you did.
          </p>
          <p style={{ fontSize: "clamp(13px, 1.6vw, 15px)", color: BROWN, fontWeight: 700, margin: 0 }}>
            There has to be a better way.
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

function HowItWorksSection() {
  const steps = [
    { num: "01", icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="1em" height="1em"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 9.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0z" /></svg>, label: "STEP 1", title: "Describe Your Day", text: "Tell SiLog what happened. No fancy language needed. Just the story." },
    { num: "02", icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="1em" height="1em"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.592c.55 0 1.02.398 1.11.94m-.213 9.66c.033.657-.479 1.234-1.136 1.234H6.75c-.657 0-1.17-.577-1.136-1.234m10.081-10.471V5.338c0-.55-.398-1.02-.94-1.11M15.3 9.75H21m-3.708 11.385l1.12-1.12a1.5 1.5 0 0 1 2.122 0l1.081 1.08m-1.06 2.5l1.12 1.12a1.5 1.5 0 0 0 2.122 0l1.081-1.08m-1.06-2.5a1.5 1.5 0 1 1-2.122-2.12m2.12 2.12a1.5 1.5 0 1 0-2.122 2.12M9 12.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0z" /></svg>, label: "STEP 2", title: "SiLog Understands", text: "SiLog reads it. Understands your department, company, role. Identifies what you learned." },
    { num: "03", icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="1em" height="1em"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904l-7.403-7.403a1.5 1.5 0 0 1 0-2.121l1.414-1.414a1.5 1.5 0 0 1 2.121 0l7.403 7.403M17.606 9.293l3.536-3.536a1.5 1.5 0 0 0-2.121-2.121l-3.536 3.536m-8.485 8.485l7.071-7.071a1.5 1.5 0 1 1 2.121 2.121l-7.071 7.071m-4.95 4.95l2.121-2.121a1.5 1.5 0 0 1 2.121 2.121l-2.121 2.121" /></svg>, label: "STEP 3", title: "Entry Generated", text: "Professional Technical Notes section. Proper structure. Diagram suggestions. Done in seconds." },
    { num: "04", icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="1em" height="1em"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg>, label: "STEP 4", title: "Review & Submit", text: "Read it. Fix anything. Submit." },
  ];

  return (
    <section id="how-it-works" style={{ background: "#181414", padding: "clamp(48px, 8vw, 96px) clamp(16px, 4vw, 24px)" }}>
      <style>{`
        .hiw-pipeline {
          display: grid;
          grid-template-columns: 1fr 28px 1fr 28px 1fr 28px 1fr;
          align-items: stretch;
          gap: 0;
        }
        .hiw-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(200,121,65,0.25);
          border-radius: 16px;
          padding: 28px 22px;
        }
        .hiw-arrow {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #C87941;
          font-size: 18px;
        }
        @media (max-width: 760px) {
          .hiw-pipeline {
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }
          .hiw-arrow { display: none; }
          .hiw-card { border-radius: 12px; }
        }
        @media (max-width: 480px) {
          .hiw-pipeline {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          .hiw-card { padding: 18px 16px; }
        }
      `}</style>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "clamp(36px, 5vw, 64px)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#C87941", fontFamily: "var(--font-dm-mono)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 14 }}>The Solution</div>
          <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(22px, 4vw, 42px)", fontWeight: 800, color: "white", margin: 0 }}>
            How SiLog Works
          </h2>
        </div>

        {/* Pipeline */}
        <div className="hiw-pipeline">
          {steps.map(({ icon, label, title, text }, i) => (
            <React.Fragment key={label}>
              <div className="hiw-card">
                <div style={{ fontSize: 10, fontFamily: "var(--font-dm-mono)", fontWeight: 700, color: "#C87941", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 14 }}>{label}</div>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: "rgba(200,121,65,0.15)",
                  border: "1px solid rgba(200,121,65,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, marginBottom: 14, color: "white",
                }}>{icon}</div>
                <h3 style={{ fontSize: "clamp(13px, 1.4vw, 15px)", fontWeight: 700, color: "white", margin: "0 0 8px", lineHeight: 1.3 }}>{title}</h3>
                <p style={{ fontSize: "clamp(11px, 1.2vw, 12.5px)", color: "rgba(255,255,255,0.6)", lineHeight: 1.7, margin: 0 }}>{text}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="hiw-arrow">→</div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Bottom callout */}
        <div style={{ textAlign: "center", marginTop: "clamp(32px, 4vw, 56px)" }}>
          <div style={{
            display: "inline-block",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 50,
            padding: "10px 28px",
          }}>
            <span style={{ fontSize: "clamp(12px, 1.5vw, 15px)", fontWeight: 500, color: "rgba(255,255,255,0.75)" }}>2 minutes.</span>
            <span style={{ fontSize: "clamp(12px, 1.5vw, 15px)", fontWeight: 400, color: "rgba(255,255,255,0.3)", margin: "0 8px" }}>Not</span>
            <span style={{ fontSize: "clamp(12px, 1.5vw, 15px)", fontWeight: 500, color: "rgba(200,121,65,0.7)", textDecoration: "line-through" }}>2 hours.</span>
          </div>
        </div>

      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

function FeaturesSection() {
  const features = [
    { icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="1em" height="1em"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h4.5m0 0H21m-4.5 0a9 9 0 0 0 5.25 2.25M3.75 21H12a9 9 0 0 0 9-9V3.75M3.75 21a9 9 0 0 1 9-9h12V3.75M3.75 21A9 9 0 0 0 12 21m0 0h9" /></svg>, title: "5 Output Formats", text: "Definition, Procedure, Problem-Solution, Organisational, Comparative. Auto-detected." },
    { icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="1em" height="1em"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 18H7.5" /></svg>, title: "Short & Long Mode", text: "1–2 pages or 3–5 pages. Your choice. Change anytime." },
    { icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="1em" height="1em"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3a6 6 0 1 0 0 12 6 6 0 0 0 0-12ZM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7m0 0c1.274 4.057-2.516 7-7.042 7-4.477 0-8.268-2.943-9.542-7" /></svg>, title: "Understands Your Context", text: "Knows your department, company, role. Not a generic template." },
    { icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="1em" height="1em"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.482l1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" /></svg>, title: "Academic Connections", text: "Links your work to what you're studying. Earns full marks." },
    { icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="1em" height="1em"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 6.75c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v13.5c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V6.75ZM16.5 3.75c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v16.5c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V3.75Z" /></svg>, title: "Automatic Diagram Ideas", text: "Suggests diagrams. No guesswork needed." },
    { icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="1em" height="1em"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H13.5C14.8807 1.5 16 2.61929 16 4V20C16 21.3807 14.8807 22.5 13.5 22.5H10.5C9.11929 22.5 8 21.3807 8 20V4C8 2.61929 9.11929 1.5 10.5 1.5Z" /></svg>, title: "Mobile & Desktop", text: "Write anywhere. Phone, tablet, laptop. Same full features." },
  ];
  const track = [...features, ...features];

  return (
    <section id="features" style={{ background: "white", padding: "clamp(48px, 8vw, 96px) 0" }}>
      <style>{`
        @keyframes silog-marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .silog-features-track {
          animation: silog-marquee 36s linear infinite;
        }
        .silog-features-track:hover {
          animation-play-state: paused;
        }
        .features-card {
          width: 264px;
          flex-shrink: 0;
          padding: 32px 24px;
          border-radius: 14px;
          background: #1A1614;
          border: 1px solid rgba(255,255,255,0.07);
          box-shadow: 0 4px 16px rgba(0,0,0,0.18);
          min-height: 280px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        @media (max-width: 600px) {
          .features-card {
            width: 210px;
            min-height: 220px;
            padding: 22px 16px;
            border-radius: 12px;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "clamp(32px, 4vw, 52px)", padding: "0 24px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: BROWN, fontFamily: "var(--font-dm-mono)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Features</div>
        <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(22px, 3.5vw, 38px)", fontWeight: 800, color: DARK, margin: 0 }}>Everything You Need</h2>
      </div>

      {/* Marquee track */}
      <div style={{
        overflow: "hidden",
        maskImage: "linear-gradient(to right, transparent 0%, black 3%, black 97%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 3%, black 97%, transparent 100%)",
      }}>
        <div className="silog-features-track" style={{ display: "flex", gap: 14, width: "max-content", paddingBottom: 4 }}>
          {track.map(({ icon, title, text }, i) => (
            <div key={i} className="features-card">
              <div style={{ fontSize: "clamp(20px, 3vw, 26px)", marginBottom: 12, color: "white" }}>{icon}</div>
              <h3 style={{ fontSize: "clamp(12px, 1.3vw, 14px)", fontWeight: 700, color: "rgba(255,255,255,0.9)", margin: "0 0 8px", lineHeight: 1.3 }}>{title}</h3>
              <p style={{ fontSize: "clamp(11px, 1.1vw, 12px)", color: "rgba(255,255,255,0.45)", lineHeight: 1.7, margin: 0 }}>{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Benefits ─────────────────────────────────────────────────────────────────

function BenefitsSection() {
  const benefits = [
    { icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="1em" height="1em"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>, title: "50+ Hours Saved", text: "No more 2-hour nightly sessions." },
    { icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="1em" height="1em"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.734 20.84a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>, title: "Professional Quality", text: "Consistent, well-structured entries every time." },
    { icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="1em" height="1em"><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.681a7.5 7.5 0 1 1-10.364 0m6.364 0a2.25 2.25 0 1 1-4.5 0m3-8.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0zm3 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0z" /></svg>, title: "Peace of Mind", text: "Logbook handled. Focus on learning." },
    { icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="1em" height="1em"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" /></svg>, title: "₦4,000/block", text: "Less than a meal per week." },
  ];

  return (
    <section style={{ background: FAINT, padding: "clamp(48px, 8vw, 96px) clamp(16px, 4vw, 24px)" }}>
      <style>{`
        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        @media (max-width: 760px) {
          .benefits-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
        }
        @media (max-width: 420px) {
          .benefits-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
          .benefit-card { padding: 20px 14px !important; }
          .benefit-icon { font-size: 24px !important; }
          .benefit-title { font-size: 15px !important; }
          .benefit-text { font-size: 11px !important; }
        }
      `}</style>
      <div style={{ maxWidth: 1160, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "clamp(32px, 5vw, 56px)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: BROWN, fontFamily: "var(--font-dm-mono)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Why SiLog</div>
          <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(22px, 4vw, 40px)", fontWeight: 800, color: DARK, margin: 0 }}>Why Students Choose SiLog</h2>
        </div>

        <div className="benefits-grid">
          {benefits.map(({ icon, title, text }) => (
            <div key={title} className="benefit-card" style={{
              padding: "clamp(20px, 3vw, 36px) clamp(16px, 2.5vw, 28px)",
              borderRadius: 16,
              background: "white",
              border: "1px solid rgba(140,90,60,0.1)",
              boxShadow: "0 2px 10px rgba(75,46,43,0.05)",
              textAlign: "center",
            }}>
              <div className="benefit-icon" style={{ fontSize: "clamp(24px, 3vw, 32px)", marginBottom: 12, display: "flex", justifyContent: "center" }}>{icon}</div>
              <h3 className="benefit-title" style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(16px, 1.8vw, 20px)", fontWeight: 800, color: DARK, margin: "0 0 6px", lineHeight: 1.2 }}>{title}</h3>
              <p className="benefit-text" style={{ fontSize: "clamp(11px, 1.2vw, 13px)", color: "#666", lineHeight: 1.6, margin: 0 }}>{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

function PricingSection() {
  return (
    <section id="pricing" style={{ background: "white", padding: "clamp(48px, 8vw, 96px) clamp(16px, 4vw, 24px)" }}>
      <style>{`
        .pricing-cards {
          display: flex;
          gap: 20px;
          align-items: start;
          justify-content: center;
          flex-wrap: wrap;
        }
        .pricing-card {
          width: 400px;
          flex-shrink: 0;
        }
        @media (max-width: 880px) {
          .pricing-card { width: 100%; max-width: 480px; }
        }
      `}</style>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "clamp(32px, 5vw, 56px)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: BROWN, fontFamily: "var(--font-dm-mono)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Pricing</div>
          <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(22px, 4vw, 40px)", fontWeight: 800, color: DARK, margin: "0 0 12px" }}>Simple, Flexible Pricing</h2>
          <p style={{ fontSize: "clamp(13px, 1.5vw, 15px)", color: "#666", maxWidth: 480, margin: "0 auto" }}>Start free with Week 1. Pay only for what you use. No subscriptions, no auto-renewal.</p>
        </div>

        <div className="pricing-cards">

          {/* Free */}
          <div className="pricing-card" style={{
            padding: "clamp(20px, 3vw, 28px) clamp(18px, 2.5vw, 26px)", borderRadius: 16,
            border: "1px solid rgba(140,90,60,0.15)",
            background: SURFACE,
          }}>
            <div style={{ fontFamily: "var(--font-dm-mono)", fontSize: 10, fontWeight: 700, color: "#888", letterSpacing: "0.1em", marginBottom: 10 }}>FREE</div>
            <div style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(26px, 4vw, 32px)", fontWeight: 800, color: DARK, marginBottom: 3 }}>₦0</div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 20 }}>Week 1 — 5 free AI entries</div>
            {[
              "Week 1 (7 days) — completely free",
              "5 logbook AI generations",
              "All 5 output formats",
              "Full access to all features",
              "Mobile & desktop",
              "No credit card required",
            ].map(item => (
              <div key={item} style={{ display: "flex", gap: 9, marginBottom: 9, fontSize: "clamp(11px, 1.3vw, 12px)", color: "#444" }}>
                <span style={{ color: "#22c55e", flexShrink: 0, fontWeight: 700 }}>✓</span>
                {item}
              </div>
            ))}
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <Link href={SIGNUP_URL} style={{
                display: "inline-block",
                padding: "10px 36px", borderRadius: 9,
                border: `2px solid ${DARK}`, color: DARK,
                fontSize: 13, fontWeight: 700, textDecoration: "none",
                transition: "all 0.15s",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = DARK; (e.currentTarget as HTMLAnchorElement).style.color = "white"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; (e.currentTarget as HTMLAnchorElement).style.color = DARK; }}
              >Start Free</Link>
            </div>
          </div>

          {/* Pro */}
          <div className="pricing-card" style={{
            padding: "clamp(20px, 3vw, 28px) clamp(18px, 2.5vw, 26px)", borderRadius: 16,
            background: DARK,
            boxShadow: "0 16px 48px rgba(75,46,43,0.3)",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: 14, right: 14,
              padding: "3px 9px", borderRadius: 20,
              background: BROWN, color: "white",
              fontSize: 9, fontWeight: 700, fontFamily: "var(--font-dm-mono)", letterSpacing: "0.06em",
            }}>MOST POPULAR</div>

            <div style={{ fontFamily: "var(--font-dm-mono)", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", marginBottom: 10 }}>PRO</div>
            <div style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(26px, 4vw, 32px)", fontWeight: 800, color: "white", marginBottom: 3 }}>₦4,000</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 20 }}>per month block · no auto-renewal</div>
            {[
              "Unlimited AI logbook entries",
              "All 5 output formats",
              "All features included",
              "Activity Bank for busy days",
              "Defense Prep Mode",
              "Priority email support",
              "Cancel anytime",
            ].map(item => (
              <div key={item} style={{ display: "flex", gap: 9, marginBottom: 9, fontSize: "clamp(11px, 1.3vw, 12px)", color: "rgba(255,255,255,0.85)" }}>
                <span style={{ color: "#86efac", flexShrink: 0, fontWeight: 700 }}>✓</span>
                {item}
              </div>
            ))}
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <Link href={SIGNUP_URL} style={{
                display: "inline-block",
                padding: "10px 36px", borderRadius: 9,
                background: BROWN, color: "white",
                fontSize: 13, fontWeight: 700, textDecoration: "none",
                transition: "background 0.15s",
              }}
                onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.background = "#A06840")}
                onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.background = BROWN)}
              >Get Started →</Link>
            </div>
          </div>
        </div>

        {/* FUNAAB banner */}
        <div style={{
          marginTop: 24, padding: "clamp(14px, 2vw, 18px) clamp(16px, 2.5vw, 24px)", borderRadius: 12,
          background: "rgba(34,197,94,0.06)",
          border: "1px solid rgba(34,197,94,0.25)",
          display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
        }}>
          <span style={{ fontSize: "clamp(16px, 2vw, 20px)" }}>🎓</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "clamp(12px, 1.4vw, 13px)", fontWeight: 700, color: "#15803d", marginBottom: 2 }}>FUNAAB Student Discount</div>
            <div style={{ fontSize: "clamp(11px, 1.2vw, 12px)", color: "#555" }}>
              Verified FUNAAB students pay <strong>₦3,500 per month</strong> — a 13% discount. Automatically applied when you sign up with your <strong>@funaab.edu.ng</strong> email.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

function TestimonialsSection() {
  const testimonials = [
    { stars: 5, quote: "SiLog saved me SO much time. Instead of writing logbooks until midnight, I was done in 10 minutes. Genuinely life-changing for my SIWES experience.", name: "Chioma O.", dept: "Food Science & Technology", company: "NAFDAC", initials: "CO" },
    { stars: 4, quote: "Finally, a tool that actually understands SIWES logbooks. The entries are professional and my supervisor loves them. I wish I had this from day one.", name: "Emeka M.", dept: "Software Engineering", company: "Andela Nigeria", initials: "EM" },
    { stars: 5, quote: "No more panicking about what to write. SiLog handles the hard part. I can actually focus on learning during my placement instead of formatting.", name: "Amara K.", dept: "Electrical Engineering", company: "Siemens Nigeria", initials: "AK" },
    { stars: 4, quote: "The FUNAAB discount makes it even better. Worth every kobo. My logbook looks more professional than students who have been doing this for years.", name: "Tunde A.", dept: "Mechanical Engineering", company: "Dangote Refinery", initials: "TA" },
  ];

  const [idx, setIdx] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [dir, setDir] = useState<"left" | "right">("left");
  const [prevIdx, setPrevIdx] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 600);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const step = isMobile ? 1 : 2;

  const go = (nextIdx: number, direction: "left" | "right") => {
    if (animating) return;
    setPrevIdx(idx);
    setDir(direction);
    setAnimating(true);
    setIdx(nextIdx);
    setTimeout(() => { setPrevIdx(null); setAnimating(false); }, 380);
  };
  const prev = () => go((idx - step + testimonials.length) % testimonials.length, "right");
  const next = () => go((idx + step) % testimonials.length, "left");

  const getSlide = (start: number) => isMobile
    ? [testimonials[start % testimonials.length]]
    : [testimonials[start % testimonials.length], testimonials[(start + 1) % testimonials.length]];

  const getPair = (start: number) => getSlide(start);

  const renderPair = (pair: typeof testimonials) => pair.map((t, i) => (
    <div key={i} className="t-card">
      <div style={{ fontSize: 13, color: "#F59E0B", marginBottom: 14, letterSpacing: 3 }}>{"★".repeat(t.stars)}{"☆".repeat(5 - t.stars)}</div>
      <p style={{ fontSize: "clamp(12px, 1.4vw, 14px)", color: "#333", lineHeight: 1.75, margin: "0 0 20px", fontStyle: "italic" }}>"{t.quote}"</p>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: "50%",
          background: FAINT, display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-dm-mono)", fontSize: 11, fontWeight: 700, color: BROWN, flexShrink: 0,
        }}>{t.initials}</div>
        <div>
          <div style={{ fontSize: "clamp(12px, 1.3vw, 13px)", fontWeight: 700, color: DARK }}>{t.name}</div>
          <div style={{ fontSize: "clamp(10px, 1.1vw, 11px)", color: "#888" }}>{t.dept} · {t.company}</div>
        </div>
      </div>
    </div>
  ));

  return (
    <section style={{ background: SURFACE, padding: "clamp(48px, 8vw, 96px) clamp(16px, 4vw, 24px)" }}>
      <style>{`
        @keyframes t-slide-in-left  { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes t-slide-in-right { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @keyframes t-slide-out-left  { from { transform: translateX(0); } to { transform: translateX(-100%); } }
        @keyframes t-slide-out-right { from { transform: translateX(0); } to { transform: translateX(100%); } }
        .t-card {
          background: white;
          border-radius: 20px;
          border: 1px solid rgba(140,90,60,0.1);
          box-shadow: 0 4px 24px rgba(75,46,43,0.07);
          padding: 28px 28px;
        }
        .t-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 600px) {
          .t-grid { grid-template-columns: 1fr; }
          .t-card { padding: 20px 18px; border-radius: 14px; }
        }
      `}</style>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "clamp(28px, 4vw, 48px)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: BROWN, fontFamily: "var(--font-dm-mono)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Testimonials</div>
          <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(22px, 3.5vw, 38px)", fontWeight: 800, color: DARK, margin: 0 }}>Loved by SIWES Students</h2>
        </div>

        {/* Slider viewport */}
        <div style={{ overflow: "hidden", position: "relative", minHeight: 200 }}>
          {animating && prevIdx !== null && (
            <div className="t-grid" style={{
              position: "absolute", top: 0, left: 0, right: 0,
              animation: `t-slide-out-${dir} 0.38s ease forwards`,
            }}>
              {renderPair(getPair(prevIdx))}
            </div>
          )}
          <div className="t-grid" style={{
            animation: animating ? `t-slide-in-${dir} 0.38s ease forwards` : "none",
          }}>
            {renderPair(getPair(idx))}
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginTop: "clamp(20px, 3vw, 28px)" }}>
          <button onClick={prev} style={{
            width: 42, height: 42, borderRadius: "50%",
            border: `2px solid ${BROWN}`, background: "white",
            cursor: "pointer", fontSize: 20, color: BROWN,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s", lineHeight: 1,
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = BROWN; (e.currentTarget as HTMLButtonElement).style.color = "white"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "white"; (e.currentTarget as HTMLButtonElement).style.color = BROWN; }}
          >‹</button>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {(isMobile ? [0,1,2,3] : [0,2]).map((start) => (
              <button key={start} onClick={() => go(start, start > idx ? "left" : "right")} style={{
                width: idx === start ? 22 : 8, height: 8,
                borderRadius: 4, border: "none", cursor: "pointer",
                background: idx === start ? BROWN : "rgba(140,90,60,0.3)",
                transition: "all 0.25s", padding: 0,
              }} />
            ))}
          </div>

          <button onClick={next} style={{
            width: 42, height: 42, borderRadius: "50%",
            border: `2px solid ${BROWN}`, background: "white",
            cursor: "pointer", fontSize: 20, color: BROWN,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s", lineHeight: 1,
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = BROWN; (e.currentTarget as HTMLButtonElement).style.color = "white"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "white"; (e.currentTarget as HTMLButtonElement).style.color = BROWN; }}
          >›</button>
        </div>

      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const faqs = [
    { q: "How does SiLog work?", a: "Describe your day → AI generates entry → Review & submit. Done in 2 minutes." },
    { q: "Is SiLog really free?", a: "Week 1 is free (5 entries). Then pay ₦4,000 per month. No card needed upfront." },
    { q: "Can I cancel anytime?", a: "Yes. Month blocks, no auto-renewal. Pay once, decide later. No penalties." },
    { q: "What if I don't like my entry?", a: "Edit it or regenerate. You control what gets submitted." },
    { q: "Does SiLog work on my phone?", a: "Yes. Full features on phone, tablet, or laptop." },
    { q: "What departments does SiLog support?", a: "All of them. Engineering, FST, IT, Business, Medicine, etc." },
    { q: "Is there a FUNAAB student discount?", a: "Yes. ₦3,500 per month (instead of ₦4,000). Verify with your @funaab.edu.ng email." },
  ];

  return (
    <section id="faq" style={{ background: SURFACE, padding: "clamp(48px, 8vw, 96px) clamp(16px, 4vw, 24px)" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "clamp(28px, 4vw, 52px)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: BROWN, fontFamily: "var(--font-dm-mono)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>FAQ</div>
          <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(22px, 3.5vw, 38px)", fontWeight: 800, color: DARK, margin: 0 }}>Frequently Asked Questions</h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {faqs.map(({ q, a }, i) => {
            const isOpen = openIdx === i;
            return (
              <div key={i} style={{ borderBottom: "1px solid rgba(140,90,60,0.12)" }}>
                <button
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  style={{
                    width: "100%", textAlign: "left",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "clamp(14px, 2vw, 20px) 4px",
                    background: "none", border: "none", cursor: "pointer", gap: 14,
                  }}
                >
                  <span style={{
                    fontSize: "clamp(13px, 1.5vw, 15px)", fontWeight: isOpen ? 700 : 500,
                    color: isOpen ? BROWN : DARK,
                    lineHeight: 1.4, transition: "color 0.2s",
                  }}>{q}</span>
                  <span style={{
                    width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                    background: isOpen ? BROWN : "rgba(140,90,60,0.1)",
                    color: isOpen ? "white" : BROWN,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 15, fontWeight: 400, lineHeight: 1,
                    transition: "all 0.2s",
                    transform: isOpen ? "rotate(45deg)" : "none",
                  }}>+</span>
                </button>
                <div style={{
                  overflow: "hidden",
                  maxHeight: isOpen ? 200 : 0,
                  opacity: isOpen ? 1 : 0,
                  transition: "max-height 0.3s ease, opacity 0.25s ease",
                }}>
                  <p style={{ fontSize: "clamp(12px, 1.3vw, 14px)", color: "#666", lineHeight: 1.8, margin: "0 0 18px", paddingRight: 36 }}>{a}</p>
                </div>
              </div>
            );
          })}
        </div>

        <p style={{ textAlign: "center", marginTop: "clamp(24px, 3vw, 40px)", fontSize: "clamp(12px, 1.3vw, 13px)", color: "#999" }}>
          Still have questions?{" "}
          <a href="mailto:support@silog.pro" style={{ color: BROWN, fontWeight: 600, textDecoration: "none" }}>
            support@silog.pro
          </a>
        </p>
      </div>
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────

function FinalCTA() {
  return (
    <section style={{
      background: "#1E1210",
      padding: "clamp(48px, 8vw, 96px) clamp(16px, 4vw, 24px)",
      textAlign: "center",
    }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <h2 style={{
          fontFamily: "var(--font-playfair)",
          fontSize: "clamp(22px, 3.5vw, 34px)",
          fontWeight: 800, color: "white", lineHeight: 1.25,
          margin: "0 0 14px",
        }}>
          Stop Wasting Hours on Logbook Entries
        </h2>
        <p style={{ fontSize: "clamp(12px, 1.5vw, 15px)", color: "rgba(255,255,255,0.5)", lineHeight: 1.75, margin: "0 0 28px" }}>
          Join 100+ students already using SiLog to save 50+ hours on their SIWES logbook. Start free today — no credit card required.
        </p>
        <Link href={SIGNUP_URL} style={{
          display: "inline-block",
          padding: "12px 32px", borderRadius: 10,
          background: BROWN, color: "white",
          fontSize: "clamp(13px, 1.4vw, 14px)", fontWeight: 700, textDecoration: "none",
          transition: "all 0.15s",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "#A06840"; (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = BROWN; (e.currentTarget as HTMLAnchorElement).style.transform = "none"; }}
        >Start Free Trial →</Link>
        <p style={{ marginTop: 16, fontSize: "clamp(11px, 1.2vw, 12px)", color: "rgba(255,255,255,0.3)" }}>
          Free Week 1 · No card · Cancel anytime
        </p>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer style={{ background: "#000000", padding: "clamp(40px, 6vw, 64px) clamp(16px, 4vw, 24px) clamp(24px, 3vw, 32px)" }}>
      <style>{`
        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 48px;
          margin-bottom: 40px;
        }
        @media (max-width: 700px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 28px;
            margin-bottom: 28px;
          }
          .footer-brand { grid-column: 1 / -1; }
        }
        @media (max-width: 400px) {
          .footer-grid { grid-template-columns: 1fr; gap: 24px; }
          .footer-brand { grid-column: auto; }
        }
      `}</style>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>

        <div className="footer-grid">

          {/* Brand — takes up 2fr on desktop, full width on mobile */}
          <div className="footer-brand">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Image src="/logo-192.png" alt="SiLog" width={26} height={26} style={{ borderRadius: 6, opacity: 0.9 }} />
              <span style={{ fontFamily: "var(--font-playfair)", fontSize: 19, fontWeight: 700, color: "white" }}>SiLog</span>
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", lineHeight: 1.7, margin: "0 0 14px", maxWidth: 280 }}>
              AI-powered SIWES logbook assistant. Spend less time writing, more time learning.
            </p>
            <a href="mailto:support@silog.pro" style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", textDecoration: "none", transition: "color 0.15s" }}
              onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = "white")}
              onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.45)")}
            >support@silog.pro</a>
          </div>

          {/* Quick Links */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-dm-mono)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 18 }}>Quick Links</div>
            {([
              ["Sign Up", SIGNUP_URL, false],
              ["Pricing", "pricing", true],
              ["FAQ", "faq", true],
            ] as [string, string, boolean][]).map(([label, target, isAnchor]) => (
              <a
                key={label}
                href={isAnchor ? `#${target}` : target}
                onClick={isAnchor ? (e) => { e.preventDefault(); document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" }); } : undefined}
                style={{ display: "block", fontSize: 13, color: "rgba(255,255,255,0.45)", textDecoration: "none", marginBottom: 11, transition: "color 0.15s", cursor: "pointer" }}
                onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = "white")}
                onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.45)")}
              >{label}</a>
            ))}
          </div>

          {/* Follow */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-dm-mono)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 18 }}>Follow Us</div>
            {[
              ["Twitter / X", "https://twitter.com/silogapp"],
              ["Instagram", "https://instagram.com/silogapp"],
            ].map(([label, href]) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                style={{ display: "block", fontSize: 13, color: "rgba(255,255,255,0.45)", textDecoration: "none", marginBottom: 11, transition: "color 0.15s" }}
                onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = "white")}
                onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.45)")}
              >{label}</a>
            ))}
          </div>

        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 22, textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.22)", margin: 0 }}>
            © 2026 SiLog. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  // Force light mode on landing page
  useEffect(() => {
    const prev = document.documentElement.getAttribute("data-theme");
    document.documentElement.setAttribute("data-theme", "light");
    return () => {
      if (prev) document.documentElement.setAttribute("data-theme", prev);
      else document.documentElement.removeAttribute("data-theme");
    };
  }, []);

  return (
    <div style={{ fontFamily: "var(--font-sans)" }}>
      <Navbar />
      <Hero />
      <ProblemSection />
      <HowItWorksSection />
      <FeaturesSection />
      <BenefitsSection />
      <PricingSection />
      <TestimonialsSection />
      <FAQSection />
      <FinalCTA />
      <Footer />
    </div>
  );
}
