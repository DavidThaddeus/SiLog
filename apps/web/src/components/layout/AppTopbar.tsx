"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDashboardStore } from "@/store/dashboard";
import { useOnboardingStore } from "@/store/onboarding";
import { useSubscriptionStore } from "@/store/subscription";
import { supabase } from "@/lib/supabase";

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/entry": "New Entry",
  "/activity-bank": "Activity Bank",
  "/defense": "Defense Prep",
};

interface Props {
  onToggleSidebar: () => void;
  onMobileMenuOpen: () => void;
  collapsed: boolean;
  mobileOpen: boolean;
}

export function AppTopbar({ onToggleSidebar, onMobileMenuOpen, collapsed, mobileOpen }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useDashboardStore();
  const { data: profile } = useOnboardingStore();
  const { status: subStatus, isFullPayment: isFullyPaid, generationsUsed } = useSubscriptionStore();
  const generationsLeft = Math.max(0, 5 - generationsUsed);
  const pageLabel = ROUTE_LABELS[pathname] ?? "SiLog";

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 1024 : true
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null);
    });
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Show ☰ only when the sidebar is not visible:
  // - Mobile: sidebar drawer is closed (!mobileOpen)
  // - Desktop: sidebar is collapsed
  const showMenuButton = isMobile ? !mobileOpen : collapsed;

  // First name from onboarding profile, or email prefix as fallback
  const firstName = profile.fullName
    ? profile.fullName.trim().split(" ")[0]
    : userEmail
    ? userEmail.split("@")[0]
    : null;

  // On desktop, the topbar must not overlap the sidebar. Left offset matches sidebar width.
  const leftOffset = isMobile ? 0 : (collapsed ? 68 : 260);

  return (
    <header
      style={{
        position: "fixed", top: 0, left: leftOffset, right: 0, zIndex: 50, height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px",
        background: "var(--bg)",
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(12px)",
        transition: "left 0.22s ease",
      }}
    >
      {/* Left: single smart menu button + breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* One button: mobile → opens drawer, desktop → toggles collapse (only shown when collapsed on desktop) */}
        <button
          onClick={() => {
            if (typeof window !== "undefined" && window.innerWidth < 1024) {
              onMobileMenuOpen();
            } else {
              onToggleSidebar();
            }
          }}
          title="Toggle menu"
          style={{
            width: 38,
            height: 38,
            borderRadius: 9,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text)",
            cursor: "pointer",
            display: showMenuButton ? "flex" : "none",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          ☰
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
          <span style={{ color: "var(--text-muted)" }}>SiLog</span>
          <span style={{ color: "var(--border)", fontSize: 14 }}>›</span>
          <span style={{ color: "var(--text)", fontWeight: 500, whiteSpace: "nowrap" }}>{pageLabel}</span>
        </div>
      </div>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>

        {/* Welcome chip — hidden on mobile to save topbar space */}
        {firstName && (
          <div className="hidden sm:flex" style={{
            alignItems: "center", gap: 7,
            padding: "5px 12px", borderRadius: 20,
            background: "rgba(34,197,94,0.07)",
            border: "1px solid rgba(34,197,94,0.2)",
          }}>
            {/* Green active dot */}
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "#22c55e", flexShrink: 0,
              boxShadow: "0 0 0 2px rgba(34,197,94,0.2)",
            }} />
            <span style={{
              fontSize: 12, fontWeight: 500, color: "var(--text)",
            }}>
              Welcome, <strong style={{ fontWeight: 700 }}>{firstName}</strong>
            </span>
          </div>
        )}

        {/* Plan badge — hidden on mobile, clickable → /pricing */}
        <button
          onClick={() => router.push("/pricing")}
          className="hidden sm:block"
          style={{
            padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600,
            fontFamily: "var(--font-dm-mono)", letterSpacing: "0.04em",
            background: subStatus === "paid"
              ? "rgba(34,197,94,0.08)"
              : generationsLeft === 0
              ? "rgba(220,38,38,0.08)"
              : "rgba(140,90,60,0.1)",
            border: subStatus === "paid"
              ? "1px solid rgba(34,197,94,0.3)"
              : generationsLeft === 0
              ? "1px solid rgba(220,38,38,0.25)"
              : "1px solid rgba(140,90,60,0.25)",
            color: subStatus === "paid" ? "#15803d" : generationsLeft === 0 ? "#b91c1c" : "#8C5A3C",
            cursor: "pointer",
          }}
        >
          {subStatus === "paid"
            ? isFullyPaid ? "PAID · FULL" : "PAID · MONTHLY"
            : `FREE · ${generationsLeft}/5`}
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title="Toggle theme"
          style={{
            width: 34, height: 34, borderRadius: 8,
            border: "1px solid var(--border)", background: "var(--surface)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, color: "var(--text)", transition: "border-color 0.15s",
          }}
        >
          {theme === "dark" ? "☀" : "◑"}
        </button>

      </div>
    </header>
  );
}
