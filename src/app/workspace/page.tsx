"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  getAgentsFromFirebase,
  getSessionsFromFirebase,
  getMessagesFromFirebase,
  syncAgentsToFirebase,
  deleteAgentFromFirebase,
  syncSessionToFirebase,
  deleteSessionFromFirebase,
  syncMessagesToFirebase,
  deleteMessagesFromFirebase,
} from "@/lib/firebase/sync";
import { Agent, ChatSession, ChatMessage, AiProviderId } from "./types";
import { TopBar } from "./components/TopBar";
import { AgentSidebar } from "./components/AgentSidebar";
import { ChatArea } from "./components/ChatArea";
import { useRouter } from "next/navigation";

export default function WorkspacePage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  // Responsive Sidebar States
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(300);

  // Chat States
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [openSessionIds, setOpenSessionIds] = useState<string[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({});
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const isMounted = useRef(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    try {
      const savedSidebar = localStorage.getItem("manager_ai_sidebar_state");
      if (savedSidebar) {
        const parsed = JSON.parse(savedSidebar);
        if (typeof parsed.collapsed === "boolean") setIsSidebarCollapsed(parsed.collapsed);
        if (typeof parsed.width === "number" && parsed.width >= 220 && parsed.width <= 500) {
          setSidebarWidth(parsed.width);
        }
      }
    } catch (e) {
      console.error("Error loading sidebar state", e);
    }
  }, []);

  useEffect(() => {
    if (isMounted.current) {
      localStorage.setItem(
        "manager_ai_sidebar_state",
        JSON.stringify({
          collapsed: isSidebarCollapsed,
          width: sidebarWidth,
        })
      );
    }
  }, [isSidebarCollapsed, sidebarWidth]);

  const handleToggleSidebar = () => {
    if (isMobile) {
      setIsMobileDrawerOpen((prev) => !prev);
    } else {
      setIsSidebarCollapsed((prev) => !prev);
    }
  };

  const getAgent = (id: string) => agents.find((a) => a.id === id);

  useEffect(() => {
    const loadFirebaseData = async () => {
      try {
        const fAgents = await getAgentsFromFirebase();
        if (fAgents.length) setAgents(fAgents as any);

        const fSessions = await getSessionsFromFirebase();
        if (fSessions.length) setChatSessions(fSessions as any);

        const fChats = await getMessagesFromFirebase();
        if (Object.keys(fChats).length) setChatMessages(fChats);
      } catch (err) {
        console.error("Erro carregando dados do Firebase:", err);
      }
    };
    loadFirebaseData();

    try {
      const savedSelectedAgent = localStorage.getItem("manager_ai_selected_agent");
      if (savedSelectedAgent) setSelectedAgent(savedSelectedAgent);

      const savedOpenSessions = localStorage.getItem("manager_ai_open_sessions");
      if (savedOpenSessions) setOpenSessionIds(JSON.parse(savedOpenSessions));

      const savedActiveSession = localStorage.getItem("manager_ai_active_session");
      if (savedActiveSession) setActiveSessionId(savedActiveSession);
    } catch (e) {
      console.error("Error loading UI state", e);
    }
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, activeSessionId, selectedAgent]);

  useEffect(() => {
    if (isMounted.current) {
      if (selectedAgent) localStorage.setItem("manager_ai_selected_agent", selectedAgent);
      else localStorage.removeItem("manager_ai_selected_agent");

      localStorage.setItem("manager_ai_open_sessions", JSON.stringify(openSessionIds));

      if (activeSessionId) localStorage.setItem("manager_ai_active_session", activeSessionId);
      else localStorage.removeItem("manager_ai_active_session");
    } else {
      isMounted.current = true;
    }
  }, [selectedAgent, openSessionIds, activeSessionId]);

  // Agent Handlers
  const handleDeleteAgent = (id: string) => {
    if (window.confirm("Deseja realmente excluir este agente?")) {
      const updatedAgents = agents.filter((a) => a.id !== id);
      setAgents(updatedAgents);
      localStorage.setItem("manager_ai_agents", JSON.stringify(updatedAgents));
      deleteAgentFromFirebase(id);

      const agentSessions = chatSessions.filter(s => s.agentId === id);
      const remainingSessions = chatSessions.filter(s => s.agentId !== id);
      setChatSessions(remainingSessions);
      localStorage.setItem("manager_ai_chat_sessions", JSON.stringify(remainingSessions));
      agentSessions.forEach(s => deleteSessionFromFirebase(s.id));

      const updatedChats = { ...chatMessages };
      const updatedOpenIds = [...openSessionIds];
      agentSessions.forEach(s => {
        localStorage.removeItem(`manager_ai_chat_messages_${s.id}`);
        deleteMessagesFromFirebase(s.id);
        delete updatedChats[s.id];
        const openIdx = updatedOpenIds.indexOf(s.id);
        if (openIdx > -1) updatedOpenIds.splice(openIdx, 1);
      });
      setChatMessages(updatedChats);
      setOpenSessionIds(updatedOpenIds);

      if (selectedAgent === id) setSelectedAgent(null);
      if (activeSessionId && agentSessions.find(s => s.id === activeSessionId)) {
        setActiveSessionId(updatedOpenIds.length > 0 ? updatedOpenIds[updatedOpenIds.length - 1] : null);
      }
    }
  };

  const openEditModal = (agent: Agent) => {
    router.push(`/workspace/agent/${agent.id}`);
  };

  const openCreateModal = () => {
    router.push("/workspace/agent/new");
  };

  // Chat Handlers
  const handleCreateSession = (agentId: string) => {
    const existingAgentSessions = chatSessions.filter(s => s.agentId === agentId);
    const newSession: ChatSession = {
      id: "session_" + Math.random().toString(36).slice(2, 11),
      agentId,
      title: `Conversa #${existingAgentSessions.length + 1}`,
      updatedAt: Date.now()
    };
    const updatedSessions = [...chatSessions, newSession];
    setChatSessions(updatedSessions);
    localStorage.setItem("manager_ai_chat_sessions", JSON.stringify(updatedSessions));
    syncSessionToFirebase(newSession);

    if (!openSessionIds.includes(newSession.id)) {
      setOpenSessionIds([...openSessionIds, newSession.id]);
    }
    setActiveSessionId(newSession.id);
    if (isMobile) {
      setIsMobileDrawerOpen(false);
    }
  };

  const handleRenameSession = (sessionId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    const updated = chatSessions.map(s => s.id === sessionId ? { ...s, title: newTitle.trim() } : s);
    setChatSessions(updated);
    localStorage.setItem("manager_ai_chat_sessions", JSON.stringify(updated));
    const session = updated.find(s => s.id === sessionId);
    if (session) syncSessionToFirebase(session);
  };

  const handleDeleteSession = (sessionId: string) => {
    if (window.confirm("Deseja excluir esta conversa?")) {
      const updatedSessions = chatSessions.filter(s => s.id !== sessionId);
      setChatSessions(updatedSessions);
      localStorage.setItem("manager_ai_chat_sessions", JSON.stringify(updatedSessions));
      deleteSessionFromFirebase(sessionId);
      localStorage.removeItem(`manager_ai_chat_messages_${sessionId}`);
      deleteMessagesFromFirebase(sessionId);
      const updatedChats = { ...chatMessages };
      delete updatedChats[sessionId];
      setChatMessages(updatedChats);

      const updatedOpenIds = openSessionIds.filter(id => id !== sessionId);
      setOpenSessionIds(updatedOpenIds);
      if (activeSessionId === sessionId) {
        setActiveSessionId(updatedOpenIds.length > 0 ? updatedOpenIds[updatedOpenIds.length - 1] : null);
      }
    }
  };

  const closeSessionTab = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedOpenIds = openSessionIds.filter(id => id !== sessionId);
    setOpenSessionIds(updatedOpenIds);
    if (activeSessionId === sessionId) {
      setActiveSessionId(updatedOpenIds.length > 0 ? updatedOpenIds[updatedOpenIds.length - 1] : null);
    }
  };

  const handleClearChatHistory = (sessionId: string) => {
    if (window.confirm("Limpar histórico?")) {
      localStorage.removeItem(`manager_ai_chat_messages_${sessionId}`);
      deleteMessagesFromFirebase(sessionId);
      setChatMessages(prev => {
        const copy = { ...prev };
        delete copy[sessionId];
        return copy;
      });
    }
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading || !activeSessionId) return;

    const session = chatSessions.find(s => s.id === activeSessionId);
    if (!session) return;
    const agent = getAgent(session.agentId);
    if (!agent) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    };

    const currentHistory = chatMessages[activeSessionId] || [];
    const updatedHistory = [...currentHistory, userMsg];

    setChatMessages(prev => ({ ...prev, [activeSessionId]: updatedHistory }));
    localStorage.setItem(`manager_ai_chat_messages_${activeSessionId}`, JSON.stringify(updatedHistory));
    syncMessagesToFirebase(activeSessionId, updatedHistory);
    setChatInput("");
    setChatLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          systemPrompt: `Role: ${agent.role}\nDescription: ${agent.description}`,
          provider: agent.provider,
          model: agent.model,
          temperature: agent.temperature,
          reasoningEffort: agent.reasoningEffort,
          mcpServers: agent.mcpServers || []
        })
      });

      if (!response.ok) throw new Error('Falha na resposta do agente.');
      const data = await response.json();

      const modelMsg: ChatMessage = {
        role: "model",
        content: data.response,
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      };

      const finalHistory = [...updatedHistory, modelMsg];
      setChatMessages(prev => ({ ...prev, [activeSessionId]: finalHistory }));
      localStorage.setItem(`manager_ai_chat_messages_${activeSessionId}`, JSON.stringify(finalHistory));
      syncMessagesToFirebase(activeSessionId, finalHistory);
    } catch (e: any) {
      console.error(e);
      const errorMsg: ChatMessage = {
        role: "model",
        content: `[Erro: ${e.message}]`,
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      };
      const finalHistory = [...updatedHistory, errorMsg];
      setChatMessages(prev => ({ ...prev, [activeSessionId]: finalHistory }));
      localStorage.setItem(`manager_ai_chat_messages_${activeSessionId}`, JSON.stringify(finalHistory));
      syncMessagesToFirebase(activeSessionId, finalHistory);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "radial-gradient(ellipse at top left, #1a103c 0%, #03020a 100%)",
        overflow: "hidden",
      }}
    >
      <TopBar
        onToggleSidebar={handleToggleSidebar}
        isSidebarCollapsed={isSidebarCollapsed}
      />

      <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
        <AgentSidebar
          agents={agents}
          selectedAgent={selectedAgent}
          setSelectedAgent={(id) => {
            setSelectedAgent(id);
            if (isMobile && id) setIsMobileDrawerOpen(false);
          }}
          handleCreateSession={handleCreateSession}
          openEditModal={openEditModal}
          handleDeleteAgent={handleDeleteAgent}
          openCreateModal={openCreateModal}
          chatSessions={chatSessions}
          activeSessionId={activeSessionId}
          setActiveSessionId={(id) => {
            setActiveSessionId(id);
            if (isMobile && id) setIsMobileDrawerOpen(false);
          }}
          openSessionIds={openSessionIds}
          setOpenSessionIds={setOpenSessionIds}
          handleRenameSession={handleRenameSession}
          handleDeleteSession={handleDeleteSession}
          isMobile={isMobile}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          isDrawerOpen={isMobileDrawerOpen}
          setIsDrawerOpen={setIsMobileDrawerOpen}
          sidebarWidth={sidebarWidth}
          setSidebarWidth={setSidebarWidth}
        />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          {/* SESSIONS TABS */}
          {openSessionIds.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: 8,
                padding: isMobile ? "12px 12px 0" : "24px 24px 0",
                overflowX: "auto",
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {openSessionIds.map((sessionId) => {
                const session = chatSessions.find((s) => s.id === sessionId);
                if (!session) return null;
                const ag = getAgent(session.agentId);
                const isActive = activeSessionId === sessionId;
                const agentColor = ag?.color || "#8b5cf6";

                return (
                  <div
                    key={sessionId}
                    onClick={() => {
                      setActiveSessionId(sessionId);
                      if (isMobile) setIsMobileDrawerOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 14px",
                      background: isActive
                        ? "rgba(255, 255, 255, 0.08)"
                        : "rgba(255, 255, 255, 0.02)",
                      border: isActive
                        ? `1px solid rgba(255, 255, 255, 0.15)`
                        : "1px solid rgba(255, 255, 255, 0.05)",
                      borderBottom: isActive ? `2px solid ${agentColor}` : "1px solid rgba(255, 255, 255, 0.05)",
                      borderRadius: "12px 12px 0 0",
                      cursor: "pointer",
                      color: isActive ? "#f8fafc" : "#94a3b8",
                      fontSize: "0.82rem",
                      fontWeight: isActive ? 600 : 400,
                      transition: "all 0.2s ease",
                      flexShrink: 0,
                      backdropFilter: "blur(8px)",
                      boxShadow: isActive ? `0 -4px 12px ${agentColor}15` : "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                        e.currentTarget.style.color = "#cbd5e1";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                        e.currentTarget.style.color = "#94a3b8";
                      }
                    }}
                  >
                    {/* Agent Icon Badge */}
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        background: `${agentColor}30`,
                        border: `1px solid ${agentColor}60`,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.75rem",
                        flexShrink: 0,
                      }}
                    >
                      {ag?.icon || "🤖"}
                    </span>

                    {/* Agent Name + Session Title */}
                    <div style={{ display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: "0.75rem", color: isActive ? "#c4b5fd" : "#64748b", fontWeight: 500 }}>
                        {ag?.name || "Agente"}:
                      </span>
                      <span>{session.title}</span>
                    </div>

                    {/* Close Tab Button */}
                    <button
                      onClick={(e) => closeSessionTab(sessionId, e)}
                      title="Fechar aba"
                      style={{
                        background: "transparent",
                        border: "none",
                        color: isActive ? "#cbd5e1" : "#64748b",
                        cursor: "pointer",
                        fontSize: "1rem",
                        lineHeight: 1,
                        marginLeft: 2,
                        padding: "2px 4px",
                        borderRadius: 4,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                        e.currentTarget.style.color = "#ef4444";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = isActive ? "#cbd5e1" : "#64748b";
                      }}
                    >
                      &times;
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <ChatArea
            openSessionIds={openSessionIds}
            setOpenSessionIds={setOpenSessionIds}
            chatSessions={chatSessions}
            activeSessionId={activeSessionId}
            setActiveSessionId={setActiveSessionId}
            getAgent={getAgent}
            chatMessages={chatMessages}
            handleClearChatHistory={handleClearChatHistory}
            chatInput={chatInput}
            setChatInput={setChatInput}
            handleSendChatMessage={handleSendChatMessage}
            chatLoading={chatLoading}
            chatEndRef={chatEndRef}
            closeSessionTab={closeSessionTab}
            isMobile={isMobile}
          />
        </div>
      </div>
    </div>
  );
}
