"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding";
import { supabase } from "@/lib/supabase";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "▦", num: "01" },
  { href: "/entry", label: "New Entry", icon: "✎", num: "02" },
  { href: "/activity-bank", label: "Activity Bank", icon: "◈", num: "03" },
  { href: "/defense", label: "Defense Prep", icon: "⬡", num: "04" },
];

const NAV_BOTTOM = [
  { href: "/pricing", label: "Plans & Pricing", icon: "◉", num: "05" },
];

interface Props {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function AppSidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { data } = useOnboardingStore();

  // Track whether we're on mobile so we can apply transform via inline style.
  // Tailwind v4 uses the CSS `translate` property which doesn't respond to a
  // `transition: transform` rule — so we control the slide with inline style instead.
  // Initialise synchronously from window so there is no layout flash on first render
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 1024 : true
  );
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const initials = data.fullName
    ? data.fullName.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
    : "S";

  // On mobile the drawer is wider (300px) so brand text never truncates
  const w = isMobile ? 300 : (collapsed ? 68 : 260);

  // Slide off-screen on mobile when drawer is closed; always visible on desktop
  const sidebarTransform = isMobile && !mobileOpen ? "translateX(-100%)" : "translateX(0)";

  return (
    <aside
      style={{
        width: w,
        minHeight: "100vh",
        background: "#4B2E2B",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        transform: sidebarTransform,
        transition: "width 0.22s ease, transform 0.25s ease",
        overflow: "hidden",
      }}
    >
      {/* Logo area */}
      <div
        style={{
          padding: collapsed ? "20px 0" : "20px 20px 18px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          gap: 10,
          minHeight: 76,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden", minWidth: 0, flex: 1 }}>
          <Image
            src="/silogfinal.png"
            alt="SiLog"
            width={64}
            height={64}
            style={{ flexShrink: 0, objectFit: "contain" }}
          />

          {/* Brand text — hidden when collapsed */}
          {!collapsed && (
            <div style={{ overflow: "hidden", minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "var(--font-playfair)",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "white",
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                SiLog
              </div>
              <div
                style={{
                  fontFamily: "var(--font-dm-mono)",
                  fontSize: 9,
                  color: "rgba(255,255,255,0.35)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginTop: 2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Logbook Assistant
              </div>
            </div>
          )}
        </div>

        {/* Single context-aware button:
            - Mobile drawer open → X to close
            - Desktop expanded   → ‹ to collapse
            - Desktop collapsed  → nothing (topbar has ☰) */}
        {mobileOpen ? (
          <button
            onClick={onMobileClose}
            title="Close menu"
            style={{
              flexShrink: 0,
              width: 34,
              height: 34,
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.7)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            ✕
          </button>
        ) : !collapsed && (
          <button
            onClick={onToggle}
            title="Collapse sidebar"
            style={{
              flexShrink: 0,
              width: 34,
              height: 34,
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.7)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              lineHeight: 1,
              transition: "background 0.15s",
            }}
          >
            ‹
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 0" }}>
        {!collapsed && (
          <div
            style={{
              padding: "8px 24px 4px",
              fontFamily: "var(--font-dm-mono)",
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.25)",
            }}
          >
            Navigation
          </div>
        )}

        {[...NAV, ...NAV_BOTTOM].map((item) => {
          const isActive = pathname === item.href;
          const isPricing = item.href === "/pricing";
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: collapsed ? "center" : "flex-start",
                gap: collapsed ? 0 : 10,
                padding: collapsed ? "11px 0" : "9px 24px",
                borderLeft: isActive ? "2px solid #8C5A3C" : "2px solid transparent",
                background: isActive ? "rgba(140,90,60,0.18)" : "transparent",
                textDecoration: "none",
                transition: "all 0.15s",
                marginTop: isPricing && !collapsed ? 8 : 0,
                borderTop: isPricing && !collapsed ? "1px solid rgba(255,255,255,0.06)" : "none",
              }}
            >
              {!collapsed && (
                <span
                  style={{
                    fontFamily: "var(--font-dm-mono)",
                    fontSize: 9,
                    color: isActive ? "#B8805F" : "rgba(255,255,255,0.25)",
                    width: 16,
                    flexShrink: 0,
                  }}
                >
                  {item.num}
                </span>
              )}
              <span
                style={{
                  fontSize: collapsed ? 16 : 14,
                  color: isPricing
                    ? (isActive ? "rgba(255,255,255,0.9)" : "rgba(200,160,100,0.7)")
                    : (isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.45)"),
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </span>
              {!collapsed && (
                <span
                  style={{
                    fontSize: 13,
                    color: isPricing
                      ? (isActive ? "white" : "rgba(200,160,100,0.85)")
                      : (isActive ? "white" : "rgba(255,255,255,0.55)"),
                    fontWeight: isActive ? 500 : 400,
                  }}
                >
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User chip */}
      <div
        style={{
          padding: collapsed ? "14px 0" : "14px 20px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          flexDirection: "column",
          alignItems: collapsed ? "center" : "stretch",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: "rgba(140,90,60,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-playfair)",
              fontSize: 12,
              fontWeight: 700,
              color: "#B8805F",
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          {!collapsed && (
            <div style={{ overflow: "hidden" }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "white",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {data.fullName || "Student"}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.35)",
                  fontFamily: "var(--font-dm-mono)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {data.department || "SIWES Student"}
              </div>
            </div>
          )}
        </div>

        {(mobileOpen || !collapsed) && (
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: "10px 0",
              borderRadius: 7,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "transparent",
              fontSize: 11,
              color: "rgba(255,255,255,0.35)",
              cursor: "pointer",
              fontFamily: "var(--font-dm-mono)",
              letterSpacing: "0.06em",
              transition: "all 0.15s",
            }}
          >
            Sign out
          </button>
        )}
      </div>
    </aside>
  );
}
