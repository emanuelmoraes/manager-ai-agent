import React from "react";
import { Agent, ChatSession } from "../types"; // I'll create a types.ts file

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
}: AgentSidebarProps) {
  return (
    <aside
      style={{
        width: 320,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        padding: "24px 0 24px 24px",
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
        <div style={{ padding: "24px 20px 16px" }}>
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
                          }}
                        >
                          {agent.icon}
                        </div>
                        <div>
                          <div style={{ fontSize: "1rem", fontWeight: 700, color: "#f8fafc" }}>
                            {agent.name}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{agent.role}</div>
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
                          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#f8fafc"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#94a3b8"; }}
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
                          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"; }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>

                      {/* Render Chat Sessions for this Agent */}
                      {chatSessions.filter(s => s.agentId === agent.id).map(session => (
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
                            background: activeSessionId === session.id ? "rgba(139, 92, 246, 0.15)" : "transparent",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            borderLeft: `2px solid ${activeSessionId === session.id ? "#8b5cf6" : "transparent"}`,
                            marginTop: 4,
                            borderRadius: "0 8px 8px 0"
                          }}
                          onMouseEnter={(e) => { if (activeSessionId !== session.id) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                          onMouseLeave={(e) => { if (activeSessionId !== session.id) e.currentTarget.style.background = "transparent"; }}
                        >
                          <span style={{ fontSize: "0.75rem", color: activeSessionId === session.id ? "#e2e8f0" : "#94a3b8", display: "flex", alignItems: "center", gap: 6 }}>
                            💬 {session.title}
                          </span>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const newTitle = prompt("Renomear sessão:", session.title);
                                if (newTitle) handleRenameSession(session.id, newTitle);
                              }}
                              style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "0.8rem", opacity: 0.6 }}
                              title="Renomear"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSession(session.id);
                              }}
                              style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "0.8rem", opacity: 0.6 }}
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
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
                        }}
                      >
                        {agent.icon}
                      </div>
                      <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "#cbd5e1" }}>
                        {agent.name}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 8, opacity: 0.6 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditModal(agent); }}
                        style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", display: "flex" }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                        </svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteAgent(agent.id); }}
                        style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", display: "flex" }}
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
    </aside>
  );
}
