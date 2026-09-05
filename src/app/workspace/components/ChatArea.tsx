import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Agent, ChatSession, ChatMessage } from "../types";
import { ChatInput } from "./ChatInput";
import { FiMessageSquare } from "react-icons/fi";

interface ChatAreaProps {
  openSessionIds: string[];
  setOpenSessionIds: (ids: string[]) => void;
  chatSessions: ChatSession[];
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  getAgent: (id: string) => Agent | undefined;
  chatMessages: Record<string, ChatMessage[]>;
  handleClearChatHistory: (sessionId: string) => void;
  chatInput: string;
  setChatInput: (val: string) => void;
  handleSendChatMessage: () => void;
  chatLoading: boolean;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  closeSessionTab: (sessionId: string, e: React.MouseEvent) => void;
  isMobile?: boolean;
}

export function ChatArea({
  openSessionIds,
  chatSessions,
  activeSessionId,
  setActiveSessionId,
  getAgent,
  chatMessages,
  handleClearChatHistory,
  chatInput,
  setChatInput,
  handleSendChatMessage,
  chatLoading,
  chatEndRef,
  closeSessionTab,
  isMobile = false,
}: ChatAreaProps) {
  if (!activeSessionId) {
    return (
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
            opacity: 0.6,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#a78bfa" }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <p style={{ fontSize: "0.9rem", color: "#94a3b8", textAlign: "center", maxWidth: 350, lineHeight: 1.5 }}>
            No active conversation. Select an agent from the sidebar and click on '+ New Session' or choose an existing session.
          </p>
        </div>
      </main>
    );
  }

  const session = chatSessions.find((s) => s.id === activeSessionId);
  const ag = session ? getAgent(session.agentId) : null;
  const messages = chatMessages[activeSessionId] || [];

  return (
    <main
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        padding: isMobile ? "0 12px 12px 12px" : "0 24px 24px 0",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: 20,
        }}
      >
        {/* Chat history list */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: isMobile ? "12px 4px 12px 4px" : "20px 20px 20px 0",
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          {messages.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                opacity: 0.5,
                gap: 8,
              }}
            >
              <div style={{ color: "#64748b", marginBottom: 4 }}>
                <FiMessageSquare size={32} />
              </div>
              <p style={{ fontSize: "0.85rem", color: "#94a3b8", textAlign: "center" }}>
                Send a message to start the conversation with {ag?.name}.
              </p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 12,
                    alignSelf: isUser ? "flex-end" : "flex-start",
                    maxWidth: isMobile ? "92%" : "80%",
                  }}
                >
                  {!isUser && ag && (
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: `linear-gradient(135deg, ${ag.color}40, ${ag.color}10)`,
                        border: `1px solid ${ag.color}50`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                        flexShrink: 0,
                      }}
                    >
                      {ag.icon}
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    {!isUser && ag && (
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#f8fafc" }}>
                          {ag.name}
                        </span>
                        <span style={{ fontSize: "0.7rem", color: "#64748b" }}>{msg.timestamp}</span>
                      </div>
                    )}
                    
                    {isUser && (
                      <div style={{ alignSelf: "flex-end", fontSize: "0.7rem", color: "#64748b" }}>
                        {msg.timestamp}
                      </div>
                    )}

                    <div
                      style={{
                        padding: "12px 16px",
                        borderRadius: 16,
                        borderBottomLeftRadius: !isUser ? 4 : 16,
                        borderBottomRightRadius: isUser ? 4 : 16,
                        background: isUser
                          ? "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))"
                          : `linear-gradient(135deg, ${ag?.color}30, ${ag?.color}10)`,
                        border: isUser ? "1px solid rgba(255,255,255,0.1)" : `1px solid ${ag?.color}40`,
                        color: "#e2e8f0",
                        fontSize: "0.9rem",
                        lineHeight: 1.6,
                        wordBreak: "break-word",
                      }}
                    >
                      <div className="markdown-body">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {chatLoading && (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 12, alignSelf: "flex-start" }}>
              {ag && (
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: `linear-gradient(135deg, ${ag.color}40, ${ag.color}10)`,
                    border: `1px solid ${ag.color}50`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    flexShrink: 0,
                  }}
                >
                  {ag.icon}
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 16px",
                  borderRadius: 16,
                  borderBottomLeftRadius: 4,
                  background: `linear-gradient(135deg, ${ag?.color}30, ${ag?.color}10)`,
                  border: `1px solid ${ag?.color}40`,
                }}
              >
                <div style={{ display: "flex", gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#cbd5e1", animation: "bounce 1.4s infinite ease-in-out both" }} />
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#cbd5e1", animation: "bounce 1.4s infinite ease-in-out both", animationDelay: "0.2s" }} />
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#cbd5e1", animation: "bounce 1.4s infinite ease-in-out both", animationDelay: "0.4s" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ paddingTop: 16 }}>
          <ChatInput
            chatInput={chatInput}
            setChatInput={setChatInput}
            handleSendChatMessage={handleSendChatMessage}
            chatLoading={chatLoading}
            agentName={ag?.name || "Agent"}
            isMobile={isMobile}
          />
        </div>
      </div>
    </main>
  );
}
