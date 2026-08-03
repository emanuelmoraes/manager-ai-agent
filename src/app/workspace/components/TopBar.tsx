import Link from "next/link";
import React from "react";

interface TopBarProps {
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export function TopBar({ onToggleSidebar, isSidebarCollapsed }: TopBarProps) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        height: 64,
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        background: "rgba(10, 5, 20, 0.85)",
        backdropFilter: "blur(16px)",
        flexShrink: 0,
        zIndex: 20,
        position: "relative",
      }}
    >
      {/* Left: Sidebar Toggle Button + Breadcrumbs */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            title={isSidebarCollapsed ? "Expandir menu" : "Recolher menu"}
            style={{
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 10,
              color: "#e2e8f0",
              cursor: "pointer",
              transition: "all 0.2s ease",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)";
              e.currentTarget.style.borderColor = "rgba(167, 139, 250, 0.4)";
              e.currentTarget.style.color = "#a78bfa";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.color = "#e2e8f0";
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              color: "#64748b",
              textDecoration: "none",
              fontSize: "0.85rem",
              fontWeight: 500,
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#a78bfa")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
          >
            Home
          </Link>
          <span style={{ color: "#334155", fontSize: "0.85rem" }}>/</span>
          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#e2e8f0" }}>
            Workspace
          </span>
        </div>
      </div>

      {/* Center: Title (Flexible & safe from overlap on smaller screens) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          padding: "0 8px",
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 15px rgba(124, 58, 237, 0.4)",
            flexShrink: 0,
          }}
        >
          <div style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid white" }}></div>
        </div>
        <span style={{ fontSize: "1rem", fontWeight: 700, color: "#f8fafc", letterSpacing: "-0.01em" }}>
          Manager<span style={{ color: "#a78bfa" }}>AI</span>
          <span
            style={{
              color: "#475569",
              fontWeight: 400,
              marginLeft: 6,
            }}
          >
            — Workspace
          </span>
        </span>
      </div>

      {/* Right: Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link
          href="/settings"
          title="Configurações"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            color: "#94a3b8",
            fontSize: "0.85rem",
            textDecoration: "none",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
            e.currentTarget.style.color = "#f8fafc";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
            e.currentTarget.style.color = "#94a3b8";
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Settings</span>
        </Link>
      </div>
    </header>
  );
}

