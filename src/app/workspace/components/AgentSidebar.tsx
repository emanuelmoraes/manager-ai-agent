import React, { useState, useEffect, useRef } from "react";
import { Agent, ChatSession } from "../types";

interface AgentSidebarProps {
  agents: Agent[];
  selectedAgent: string | null;
  setSelectedAgent: (id: string | null) => void;
  handleCreateSession: (agentId: string) => void;
  openEditModal: (agent: Agent) => void;
  handleDeleteAgent: (id: string) => void;
  openCreateModal: () => void;
  chatSessions: ChatSession[];
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  openSessionIds: string[];
  setOpenSessionIds: (ids: string[]) => void;
  handleRenameSession: (id: string, newTitle: string) => void;
  handleDeleteSession: (id: string) => void;
  // Responsive props
  isMobile?: boolean;
  isCollapsed?: boolean;
  setIsCollapsed?: (val: boolean | ((prev: boolean) => boolean)) => void;
  isDrawerOpen?: boolean;
  setIsDrawerOpen?: (val: boolean | ((prev: boolean) => boolean)) => void;
  sidebarWidth?: number;
  setSidebarWidth?: (val: number | ((prev: number) => number)) => void;
}

export function AgentSidebar({
  agents,
  selectedAgent,
  setSelectedAgent,
  handleCreateSession,
  openEditModal,
  handleDeleteAgent,
  openCreateModal,
  chatSessions,
  activeSessionId,
  setActiveSessionId,
  openSessionIds,
  setOpenSessionIds,
  handleRenameSession,
  handleDeleteSession,
  isMobile = false,
  isCollapsed = false,
  setIsCollapsed,
  isDrawerOpen = false,
  setIsDrawerOpen,
  sidebarWidth = 300,
  setSidebarWidth,
}: AgentSidebarProps) {
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(300);

  // Mouse Drag Resizer Handle for Desktop
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !setSidebarWidth) return;
      const deltaX = e.clientX - startXRef.current;
      const newWidth = Math.max(220, Math.min(480, startWidthRef.current + deltaX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        document.body.style.cursor = "default";
        document.body.style.userSelect = "auto";
      }
    };

    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, setSidebarWidth]);

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    startXRef.current = e.clientX;
    startWidthRef.current = sidebarWidth || 300;
    setIsResizing(true);
  };

  // 1. MOBILE OFF-CANVAS DRAWER MODE (< 768px)
  if (isMobile) {
    if (!isDrawerOpen) return null;

    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          display: "flex",
        }}
      >
        {/* Backdrop overlay */}
        <div
          onClick={() => setIsDrawerOpen && setIsDrawerOpen(false)}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(3, 2, 10, 0.75)",
            backdropFilter: "blur(6px)",
          }}
        />

        {/* Drawer container */}
        <aside
          style={{
            position: "relative",
            width: "85vw",
            maxWidth: 320,
            height: "100%",
            background: "rgba(17, 12, 32, 0.98)",
            borderRight: "1px solid rgba(255, 255, 255, 0.1)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "20px 0 50px rgba(0,0,0,0.6)",
            padding: "16px",
            zIndex: 10,
          }}
        >
          {/* Drawer Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingBottom: 16,
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              marginBottom: 16,
            }}
          >
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#94a3b8",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              Agentes
            </span>
            <button
              onClick={() => setIsDrawerOpen && setIsDrawerOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                fontSize: "1.4rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
              }}
            >
              &times;
            </button>
          </div>

          {/* Agent list in Drawer */}
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
            {agents.length === 0 ? (
              <div style={{ textAlign: "center", opacity: 0.5, marginTop: 40 }}>
                <span style={{ fontSize: "2rem" }}>🤖</span>
                <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: 10 }}>Nenhum agente.</p>
              </div>
            ) : (
              agents.map((agent) => {
                const isSelected = selectedAgent === agent.id;
                return (
                  <div
                    key={agent.id}
                    style={{
                      background: isSelected ? "rgba(255, 255, 255, 0.08)" : "transparent",
                      border: isSelected ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid transparent",
                      borderRadius: 14,
                      padding: "14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <div
                      onClick={() => setSelectedAgent(agent.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 10,
                            background: `linear-gradient(135deg, ${agent.color}40, ${agent.color}10)`,
                            border: `1px solid ${agent.color}50`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 22,
                          }}
                        >
                          {agent.icon}
                        </div>
                        <div>
                          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#f8fafc" }}>
                            {agent.name}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{agent.role}</div>
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => handleCreateSession(agent.id)}
                            style={{
                              flex: 1,
                              padding: "10px",
                              background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
                              border: "none",
                              borderRadius: 10,
                              color: "white",
                              fontSize: "0.85rem",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            + New Session
                          </button>
                          <button
                            onClick={() => openEditModal(agent)}
                            style={{
                              width: 40,
                              height: 40,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: "rgba(255,255,255,0.05)",
                              border: "1px solid rgba(255,255,255,0.1)",
                              borderRadius: 10,
                              color: "#94a3b8",
                            }}
                          >
                            ✏️
                          </button>
                        </div>

                        {/* Chat Sessions */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {chatSessions
                            .filter((s) => s.agentId === agent.id)
                            .map((session) => (
                              <div
                                key={session.id}
                                onClick={() => {
                                  if (!openSessionIds.includes(session.id)) {
                                    setOpenSessionIds([...openSessionIds, session.id]);
                                  }
                                  setActiveSessionId(session.id);
                                }}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  padding: "8px 12px",
                                  background:
                                    activeSessionId === session.id
                                      ? "rgba(139, 92, 246, 0.18)"
                                      : "transparent",
                                  borderRadius: 8,
                                  cursor: "pointer",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "0.8rem",
                                    color: activeSessionId === session.id ? "#f8fafc" : "#94a3b8",
                                  }}
                                >
                                  💬 {session.title}
                                </span>
                              </div>
                            ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Drawer Footer */}
          <div style={{ paddingTop: 16, borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <button
              onClick={() => {
                openCreateModal();
                if (setIsDrawerOpen) setIsDrawerOpen(false);
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.05)",
                color: "#e2e8f0",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              + New Agent
            </button>
          </div>
        </aside>
      </div>
    );
  }

  // 2. COLLAPSED MINI-SIDEBAR DESKTOP MODE (72px)
  if (isCollapsed) {
    return (
      <aside
        style={{
          width: 76,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "24px 8px",
          background: "rgba(17, 12, 32, 0.4)",
          borderRight: "1px solid rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(12px)",
          overflowY: "auto",
          gap: 16,
          transition: "width 0.2s ease",
        }}
      >
        {/* Top collapse button */}
        <button
          onClick={() => setIsCollapsed && setIsCollapsed(false)}
          title="Expandir painel lateral"
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            color: "#e2e8f0",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)";
            e.currentTarget.style.color = "#a78bfa";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
            e.currentTarget.style.color = "#e2e8f0";
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="13 17 18 12 13 7"></polyline>
            <polyline points="6 17 11 12 6 7"></polyline>
          </svg>
        </button>

        <div style={{ width: "100%", height: 1, background: "rgba(255, 255, 255, 0.08)" }} />

        {/* Agents mini icons */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
          {agents.map((agent) => {
            const isSelected = selectedAgent === agent.id;
            return (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                title={`${agent.name} (${agent.role})`}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: isSelected
                    ? `linear-gradient(135deg, ${agent.color}50, ${agent.color}15)`
                    : `${agent.color}20`,
                  border: isSelected ? `2px solid ${agent.color}` : "1px solid rgba(255,255,255,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  cursor: "pointer",
                  position: "relative",
                  boxShadow: isSelected ? `0 0 15px ${agent.color}40` : "none",
                  transition: "all 0.2s",
                }}
              >
                {agent.icon}
                {isSelected && (
                  <span
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: agent.color,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* New Agent Mini Button */}
        <button
          onClick={openCreateModal}
          title="Criar novo agente"
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "rgba(255,255,255,0.05)",
            border: "1px dashed rgba(255,255,255,0.2)",
            color: "#e2e8f0",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.2rem",
          }}
        >
          +
        </button>
      </aside>
    );
  }

  // 3. EXPANDED DESKTOP MODE (Customizable Width with Resizer Handle)
  return (
    <aside
      style={{
        width: sidebarWidth,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        padding: "24px 0 24px 24px",
        position: "relative",
        transition: isResizing ? "none" : "width 0.2s ease",
      }}
    >
      <div
        style={{
          background: "rgba(17, 12, 32, 0.6)",
          border: "1px solid rgba(255,255,255,0.05)",
          borderRadius: 20,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Sidebar header */}
        <div style={{ padding: "24px 20px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#64748b",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            Agents
          </span>
          <button
            onClick={() => setIsCollapsed && setIsCollapsed(true)}
            title="Recolher menu lateral"
            style={{
              background: "transparent",
              border: "none",
              color: "#64748b",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 4,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#a78bfa")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="11 17 6 12 11 7"></polyline>
              <polyline points="18 17 13 12 18 7"></polyline>
            </svg>
          </button>
        </div>

        {/* Agent list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 20px" }}>
          {agents.length === 0 ? (
            <div style={{ textAlign: "center", opacity: 0.5, marginTop: 40 }}>
              <span style={{ fontSize: "2rem" }}>🤖</span>
              <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: 10 }}>Nenhum agente.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {agents.map((agent) => {
                const isSelected = selectedAgent === agent.id;

                if (isSelected) {
                  // Active Agent Card
                  return (
                    <div
                      key={agent.id}
                      style={{
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: 16,
                        padding: "16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            background: `linear-gradient(135deg, ${agent.color}40, ${agent.color}10)`,
                            border: `1px solid ${agent.color}50`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 24,
                            boxShadow: `0 0 20px ${agent.color}20`,
                            flexShrink: 0,
                          }}
                        >
                          {agent.icon}
                        </div>
                        <div style={{ overflow: "hidden" }}>
                          <div
                            style={{
                              fontSize: "1rem",
                              fontWeight: 700,
                              color: "#f8fafc",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {agent.name}
                          </div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#94a3b8",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {agent.role}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => handleCreateSession(agent.id)}
                          style={{
                            flex: 1,
                            padding: "10px",
                            background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
                            border: "none",
                            borderRadius: 10,
                            color: "white",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                        >
                          + New Session
                        </button>
                        <button
                          onClick={() => openEditModal(agent)}
                          style={{
                            width: 40,
                            height: 40,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 10,
                            color: "#94a3b8",
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                            e.currentTarget.style.color = "#f8fafc";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                            e.currentTarget.style.color = "#94a3b8";
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteAgent(agent.id)}
                          style={{
                            width: 40,
                            height: 40,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "rgba(239, 68, 68, 0.1)",
                            border: "1px solid rgba(239, 68, 68, 0.2)",
                            borderRadius: 10,
                            color: "#ef4444",
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>

                      {/* Render Chat Sessions for this Agent */}
                      {chatSessions
                        .filter((s) => s.agentId === agent.id)
                        .map((session) => (
                          <div
                            key={session.id}
                            onClick={() => {
                              if (!openSessionIds.includes(session.id)) {
                                setOpenSessionIds([...openSessionIds, session.id]);
                              }
                              setActiveSessionId(session.id);
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "8px 12px",
                              background:
                                activeSessionId === session.id
                                  ? "rgba(139, 92, 246, 0.15)"
                                  : "transparent",
                              cursor: "pointer",
                              transition: "all 0.2s",
                              borderLeft: `2px solid ${
                                activeSessionId === session.id ? "#8b5cf6" : "transparent"
                              }`,
                              marginTop: 4,
                              borderRadius: "0 8px 8px 0",
                            }}
                            onMouseEnter={(e) => {
                              if (activeSessionId !== session.id)
                                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                            }}
                            onMouseLeave={(e) => {
                              if (activeSessionId !== session.id)
                                e.currentTarget.style.background = "transparent";
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: activeSessionId === session.id ? "#e2e8f0" : "#94a3b8",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                overflow: "hidden",
                                whiteSpace: "nowrap",
                                textOverflow: "ellipsis",
                              }}
                            >
                              💬 {session.title}
                            </span>
                            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newTitle = prompt("Renomear sessão:", session.title);
                                  if (newTitle) handleRenameSession(session.id, newTitle);
                                }}
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  cursor: "pointer",
                                  fontSize: "0.8rem",
                                  opacity: 0.6,
                                }}
                                title="Renomear"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSession(session.id);
                                }}
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  cursor: "pointer",
                                  fontSize: "0.8rem",
                                  opacity: 0.6,
                                }}
                                title="Excluir"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  );
                }

                // Inactive Agent Row
                return (
                  <div
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      borderRadius: 16,
                      background: "transparent",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, overflow: "hidden" }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: `${agent.color}20`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 16,
                          flexShrink: 0,
                        }}
                      >
                        {agent.icon}
                      </div>
                      <span
                        style={{
                          fontSize: "0.95rem",
                          fontWeight: 600,
                          color: "#cbd5e1",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {agent.name}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 8, opacity: 0.6, flexShrink: 0 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(agent);
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#94a3b8",
                          cursor: "pointer",
                          display: "flex",
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAgent(agent.id);
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#94a3b8",
                          cursor: "pointer",
                          display: "flex",
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar footer */}
        <div style={{ padding: "20px" }}>
          <button
            onClick={openCreateModal}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "transparent",
              color: "#e2e8f0",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            New Agent
          </button>
        </div>
      </div>

      {/* Resizer Handle (Alça interativa para arrastar a borda à direita) */}
      <div
        onMouseDown={handleMouseDownResize}
        title="Arrastar para redimensionar"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 8,
          height: "100%",
          cursor: "col-resize",
          background: isResizing ? "rgba(139, 92, 246, 0.5)" : "transparent",
          transition: "background 0.2s",
          zIndex: 20,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(139, 92, 246, 0.3)")}
        onMouseLeave={(e) => {
          if (!isResizing) e.currentTarget.style.background = "transparent";
        }}
      />
    </aside>
  );
}

