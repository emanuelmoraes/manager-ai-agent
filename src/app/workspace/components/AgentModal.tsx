import React from "react";
import { Agent, AiProviderId } from "../types";

interface AgentModalProps {
  isModalOpen: boolean;
  closeModal: () => void;
  editingAgent: Agent | null;
  newAgentName: string;
  setNewAgentName: (v: string) => void;
  newAgentRole: string;
  setNewAgentRole: (v: string) => void;
  newAgentIcon: string;
  setNewAgentIcon: (v: string) => void;
  newAgentColor: string;
  setNewAgentColor: (v: string) => void;
  newAgentDescription: string;
  setNewAgentDescription: (v: string) => void;
  newAgentProvider: AiProviderId;
  setNewAgentProvider: (v: AiProviderId) => void;
  newAgentModel: string;
  setNewAgentModel: (v: string) => void;
  newAgentMcpServers: string[];
  setNewAgentMcpServers: (v: string[]) => void;
  availableMcpServers: { id: string; name?: string }[];
  formError: string;
  handleCreateAgent: () => void;
  handleEditAgent: () => void;
}

export function AgentModal({
  isModalOpen,
  closeModal,
  editingAgent,
  newAgentName,
  setNewAgentName,
  newAgentRole,
  setNewAgentRole,
  newAgentIcon,
  setNewAgentIcon,
  newAgentColor,
  setNewAgentColor,
  newAgentDescription,
  setNewAgentDescription,
  newAgentProvider,
  setNewAgentProvider,
  newAgentModel,
  setNewAgentModel,
  newAgentMcpServers,
  setNewAgentMcpServers,
  availableMcpServers,
  formError,
  handleCreateAgent,
  handleEditAgent,
}: AgentModalProps) {
  if (!isModalOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(3,2,10,0.7)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        animation: "fade-in 0.2s ease-out",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeModal();
        }
      }}
    >
      <div
        style={{
          background: "rgba(17, 12, 28, 0.96)",
          border: "1px solid rgba(124, 58, 237, 0.3)",
          borderRadius: 16,
          width: "90%",
          maxWidth: 860,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5), 0 0 30px rgba(124, 58, 237, 0.15)",
        }}
      >
        {/* Header */}
        <div style={{ padding: "24px 24px 16px 24px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
              {editingAgent ? "Edit Agent" : "Add New Agent"}
            </h3>
            <button
              onClick={closeModal}
              style={{
                background: "transparent",
                border: "none",
                color: "#64748b",
                cursor: "pointer",
                fontSize: "1.5rem",
                padding: "0 4px",
                lineHeight: 0.8,
              }}
            >
              &times;
            </button>
          </div>
          <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: "6px 0 0 0" }}>
            {editingAgent
              ? "Modify the properties, instructions, and AI provider of this agent."
              : "Create a new custom agent to integrate into your workspace."}
          </p>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {formError && (
            <div
              style={{
                padding: "10px 14px",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 8,
                color: "#f87171",
                fontSize: "0.75rem",
                marginBottom: 20,
              }}
            >
              {formError}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 28 }}>
            {/* LEFT COLUMN */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Name */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Coder, Designer"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  style={{
                    padding: "10px 12px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8,
                    color: "#f8fafc",
                    fontSize: "0.85rem",
                    outline: "none",
                  }}
                />
              </div>

              {/* Role */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Role / Specialty *</label>
                <input
                  type="text"
                  placeholder="e.g. Development & Debugging"
                  value={newAgentRole}
                  onChange={(e) => setNewAgentRole(e.target.value)}
                  style={{
                    padding: "10px 12px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8,
                    color: "#f8fafc",
                    fontSize: "0.85rem",
                    outline: "none",
                  }}
                />
              </div>

              {/* Provider & Model */}
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Provider *</label>
                  <select
                    value={newAgentProvider}
                    onChange={(e) => {
                      const prov = e.target.value as AiProviderId;
                      setNewAgentProvider(prov);
                      if (prov === "google") setNewAgentModel("googleai/gemini-2.5-pro");
                      else if (prov === "openai") setNewAgentModel("gpt-4o");
                      else if (prov === "anthropic") setNewAgentModel("claude-3-5-sonnet-20241022");
                      else if (prov === "deepseek") setNewAgentModel("deepseek-chat");
                      else if (prov === "grok") setNewAgentModel("grok-2-1212");
                    }}
                    style={{
                      padding: "10px 12px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 8,
                      color: "#f8fafc",
                      fontSize: "0.85rem",
                      outline: "none",
                    }}
                  >
                    <option value="google" style={{ background: "#110c1c" }}>Google Gemini</option>
                    <option value="openai" style={{ background: "#110c1c" }}>OpenAI</option>
                    <option value="anthropic" style={{ background: "#110c1c" }}>Anthropic</option>
                    <option value="deepseek" style={{ background: "#110c1c" }}>DeepSeek</option>
                    <option value="grok" style={{ background: "#110c1c" }}>Grok (xAI)</option>
                  </select>
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Model *</label>
                  <select
                    value={newAgentModel}
                    onChange={(e) => setNewAgentModel(e.target.value)}
                    style={{
                      padding: "10px 12px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 8,
                      color: "#f8fafc",
                      fontSize: "0.85rem",
                      outline: "none",
                    }}
                  >
                    {newAgentProvider === "google" && (
                      <>
                        <option value="googleai/gemini-2.5-pro" style={{ background: "#110c1c" }}>gemini-2.5-pro</option>
                        <option value="googleai/gemini-2.5-flash" style={{ background: "#110c1c" }}>gemini-2.5-flash</option>
                      </>
                    )}
                    {newAgentProvider === "openai" && (
                      <>
                        <option value="gpt-4o" style={{ background: "#110c1c" }}>gpt-4o</option>
                        <option value="gpt-4o-mini" style={{ background: "#110c1c" }}>gpt-4o-mini</option>
                      </>
                    )}
                    {newAgentProvider === "anthropic" && (
                      <>
                        <option value="claude-3-5-sonnet-20241022" style={{ background: "#110c1c" }}>claude-3-5-sonnet-20241022</option>
                        <option value="claude-3-5-haiku-20241022" style={{ background: "#110c1c" }}>claude-3-5-haiku-20241022</option>
                      </>
                    )}
                    {newAgentProvider === "deepseek" && (
                      <>
                        <option value="deepseek-chat" style={{ background: "#110c1c" }}>deepseek-chat (V3)</option>
                        <option value="deepseek-reasoner" style={{ background: "#110c1c" }}>deepseek-reasoner (R1)</option>
                      </>
                    )}
                    {newAgentProvider === "grok" && (
                      <>
                        <option value="grok-2-1212" style={{ background: "#110c1c" }}>grok-2-1212</option>
                        <option value="grok-beta" style={{ background: "#110c1c" }}>grok-beta</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Icon & Color */}
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Icon</label>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {["🤖", "💻", "🎨", "🚀", "📊", "🔍", "✍️", "🛡️", "🔑"].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setNewAgentIcon(emoji)}
                        style={{
                          fontSize: "1.1rem",
                          padding: "6px 8px",
                          background: newAgentIcon === emoji ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.03)",
                          border: `1px solid ${newAgentIcon === emoji ? "#7c3aed" : "rgba(255,255,255,0.08)"}`,
                          borderRadius: 8,
                          cursor: "pointer",
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Color</label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {[
                      { name: "Violet", hex: "#a78bfa" },
                      { name: "Blue", hex: "#60a5fa" },
                      { name: "Green", hex: "#34d399" },
                      { name: "Orange", hex: "#fb923c" },
                      { name: "Pink", hex: "#f472b6" },
                      { name: "Cyan", hex: "#22d3ee" },
                    ].map((colorItem) => (
                      <button
                        key={colorItem.hex}
                        type="button"
                        onClick={() => setNewAgentColor(colorItem.hex)}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          background: colorItem.hex,
                          border: newAgentColor === colorItem.hex ? "2px solid #ffffff" : "2px solid transparent",
                          cursor: "pointer",
                        }}
                        title={colorItem.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Description */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Instructions</label>
                <textarea
                  placeholder="Describe the rules and purpose of this agent..."
                  value={newAgentDescription}
                  onChange={(e) => setNewAgentDescription(e.target.value)}
                  style={{
                    flex: 1,
                    minHeight: 120,
                    padding: "10px 12px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8,
                    color: "#f8fafc",
                    fontSize: "0.85rem",
                    outline: "none",
                    resize: "none",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              {/* MCP Servers */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>MCP Servers</label>
                {availableMcpServers.length === 0 ? (
                  <p style={{ color: "#64748b", fontSize: "0.8rem", margin: "4px 0" }}>No MCP servers registered.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 150, overflowY: "auto", background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: 8, padding: 10 }}>
                    {availableMcpServers.map((srv) => {
                      const isChecked = newAgentMcpServers.includes(srv.id);
                      return (
                        <label key={srv.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "#e2e8f0", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setNewAgentMcpServers(newAgentMcpServers.filter((id) => id !== srv.id));
                              } else {
                                setNewAgentMcpServers([...newAgentMcpServers, srv.id]);
                              }
                            }}
                            style={{ cursor: "pointer", accentColor: "#7c3aed" }}
                          />
                          <span>{srv.name || srv.id}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255, 255, 255, 0.05)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button
            type="button"
            onClick={closeModal}
            style={{
              padding: "8px 16px",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              color: "#f8fafc",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={editingAgent ? handleEditAgent : handleCreateAgent}
            style={{
              padding: "8px 18px",
              background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
              border: "none",
              borderRadius: 8,
              color: "white",
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(124,58,237,0.25)",
            }}
          >
            {editingAgent ? "Save Changes" : "Create Agent"}
          </button>
        </div>
      </div>
    </div>
  );
}
