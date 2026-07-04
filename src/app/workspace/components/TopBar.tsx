import Link from "next/link";
import React from "react";

export function TopBar() {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        height: 64,
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(10, 5, 20, 0.8)",
        backdropFilter: "blur(12px)",
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      {/* Left: breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            color: "#64748b",
            textDecoration: "none",
            fontSize: "0.85rem",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#a78bfa")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
        >
          Home
        </Link>
        <span style={{ color: "#334155", fontSize: "0.85rem" }}>/</span>
        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#e2e8f0" }}>Workspace</span>
      </div>

      {/* Center: title */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 15px rgba(124, 58, 237, 0.4)",
          }}
        >
          <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid white" }}></div>
        </div>
        <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f8fafc", letterSpacing: "-0.01em" }}>
          Manager<span style={{ color: "#a78bfa" }}>AI</span> <span style={{ color: "#475569", fontWeight: 400 }}>— Workspace</span>
        </span>
      </div>

      {/* Right: controls (Only Settings per user request) */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link
          href="/settings"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            color: "#94a3b8",
            fontSize: "0.85rem",
            textDecoration: "none",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "#e2e8f0"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#94a3b8"; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Settings
        </Link>
      </div>
    </header>
  );
}
