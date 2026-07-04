import React from "react";

interface McpServer {
  id: string;
  name?: string;
  type: "sse" | "stdio";
  url?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
}

interface MCPTabProps {
  mcpServers: McpServer[];
  loadingMcp: boolean;
  mcpForm: {
    id: string;
    name: string;
    type: "sse" | "stdio";
    url: string;
    command: string;
    args: string;
    env: string;
  };
  setMcpForm: React.Dispatch<React.SetStateAction<any>>;
  savingMcp: boolean;
  editingId: string | null;
  testingMcp: string | null;
  handleAddMcpServer: (e: React.FormEvent) => void;
  handleDeleteMcpServer: (id: string) => void;
  handleEditMcpServer: (srv: McpServer) => void;
  handleTestMcpServer: (id: string) => void;
  handleCancelEdit: () => void;
}

export function MCPTab({
  mcpServers,
  loadingMcp,
  mcpForm,
  setMcpForm,
  savingMcp,
  editingId,
  testingMcp,
  handleAddMcpServer,
  handleDeleteMcpServer,
  handleEditMcpServer,
  handleTestMcpServer,
  handleCancelEdit,
}: MCPTabProps) {
  return (
    <div style={{ display: "flex", gap: 40, width: "100%", padding: "40px 0", maxWidth: 1200, margin: "0 auto" }}>
      {/* LEFT COLUMN: Registered Servers */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 32 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
            Servidores MCP
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: 0, lineHeight: 1.5 }}>
            Gerencie conexões com servidores Model Context Protocol (MCP). Adicione fontes de dados e ferramentas externas para seus agentes de IA.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f8fafc", margin: "16px 0 0 0" }}>
            Servidores MCP Cadastrados ({mcpServers.length})
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {loadingMcp ? (
              <p style={{ color: "#94a3b8" }}>Carregando servidores MCP...</p>
            ) : mcpServers.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 16 }}>
                <p style={{ color: "#94a3b8" }}>Nenhum servidor MCP configurado.</p>
              </div>
            ) : (
              mcpServers.map((srv) => (
                <div
                  key={srv.id}
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 16,
                    padding: 24,
                    display: "flex",
                    flexDirection: "column",
                    gap: 20,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <h4 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
                          {srv.name || srv.id}
                        </h4>
                        <span style={{ padding: "4px 8px", background: "rgba(255,255,255,0.1)", borderRadius: 6, fontSize: "0.7rem", fontWeight: 700, color: "#cbd5e1" }}>
                          {srv.type.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#94a3b8", fontSize: "0.85rem", fontFamily: "monospace" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                        {srv.type === "sse" ? srv.url : `${srv.command} ${srv.args?.join(" ")}`}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => handleEditMcpServer(srv)}
                        style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", transition: "color 0.2s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#f8fafc")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteMcpServer(srv.id)}
                        style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", transition: "color 0.2s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 16 }}>
                    <div style={{ display: "flex", gap: 48 }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#64748b", letterSpacing: "0.05em" }}>SERVER ID</span>
                        <span style={{ fontSize: "0.85rem", color: "#e2e8f0", fontFamily: "monospace" }}>{srv.id}</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#64748b", letterSpacing: "0.05em" }}>STATUS</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
                          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#22c55e" }}>Ativo</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleTestMcpServer(srv.id)}
                      disabled={testingMcp === srv.id}
                      style={{
                        padding: "8px 16px",
                        background: "transparent",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8,
                        color: "#f8fafc",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        cursor: testingMcp === srv.id ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => { if (testingMcp !== srv.id) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                      onMouseLeave={(e) => { if (testingMcp !== srv.id) e.currentTarget.style.background = "transparent"; }}
                    >
                      {testingMcp === srv.id ? "Testando..." : "Testar Conexão"}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14"></path>
                        <path d="M12 5l7 7-7 7"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Cadastrar Servidor */}
      <div style={{ width: 440, flexShrink: 0 }}>
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 24,
            padding: 32,
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
              {editingId ? "Editar Servidor MCP" : "Cadastrar Servidor MCP"}
            </h2>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: 0, lineHeight: 1.5 }}>
              Adicione conexões com servidores MCP locais ou remotos. Os agentes autorizados poderão utilizar as ferramentas expostas por estes servidores de forma automática.
            </p>
          </div>

          <form onSubmit={handleAddMcpServer} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#e2e8f0" }}>ID DO SERVIDOR *</label>
              <input
                type="text"
                placeholder="Ex: mcp-weather"
                value={mcpForm.id}
                onChange={(e) => setMcpForm({ ...mcpForm, id: e.target.value })}
                disabled={!!editingId}
                required
                style={{
                  padding: "12px 16px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  color: "#f8fafc",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#e2e8f0" }}>NOME DE EXIBIÇÃO</label>
              <input
                type="text"
                placeholder="Ex: Servidor de Clima e Tempo"
                value={mcpForm.name}
                onChange={(e) => setMcpForm({ ...mcpForm, name: e.target.value })}
                style={{
                  padding: "12px 16px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  color: "#f8fafc",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#e2e8f0" }}>TIPO DE TRANSPORTE *</label>
              <div style={{ position: "relative" }}>
                <select
                  value={mcpForm.type}
                  onChange={(e) => setMcpForm({ ...mcpForm, type: e.target.value as "sse" | "stdio" })}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    color: "#f8fafc",
                    fontSize: "0.9rem",
                    outline: "none",
                    appearance: "none",
                  }}
                >
                  <option value="sse" style={{ background: "#110c1c" }}>SSE (Server-Sent Events) / HTTP</option>
                  <option value="stdio" style={{ background: "#110c1c" }}>STDIO (Execução Local via CMD)</option>
                </select>
                <div style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>
            </div>

            {mcpForm.type === "sse" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, animation: "fade-in 0.3s" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#e2e8f0" }}>URL DO SERVIDOR SSE *</label>
                <input
                  type="url"
                  placeholder="Ex: http://localhost:3001/sse"
                  value={mcpForm.url}
                  onChange={(e) => setMcpForm({ ...mcpForm, url: e.target.value })}
                  required={mcpForm.type === "sse"}
                  style={{
                    padding: "12px 16px",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    color: "#f8fafc",
                    fontSize: "0.9rem",
                    outline: "none",
                  }}
                />
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fade-in 0.3s" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#e2e8f0" }}>COMANDO *</label>
                  <input
                    type="text"
                    placeholder="Ex: node, npx, python3"
                    value={mcpForm.command}
                    onChange={(e) => setMcpForm({ ...mcpForm, command: e.target.value })}
                    required={mcpForm.type === "stdio"}
                    style={{
                      padding: "12px 16px",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                      color: "#f8fafc",
                      fontSize: "0.9rem",
                      outline: "none",
                    }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#e2e8f0" }}>ARGUMENTOS (Separados por vírgula)</label>
                  <input
                    type="text"
                    placeholder="Ex: index.js, --port, 3000"
                    value={mcpForm.args}
                    onChange={(e) => setMcpForm({ ...mcpForm, args: e.target.value })}
                    style={{
                      padding: "12px 16px",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                      color: "#f8fafc",
                      fontSize: "0.9rem",
                      outline: "none",
                    }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#e2e8f0" }}>VARIÁVEIS DE AMBIENTE (JSON Opcional)</label>
                  <textarea
                    placeholder='Ex: { "API_KEY": "12345" }'
                    value={mcpForm.env}
                    onChange={(e) => setMcpForm({ ...mcpForm, env: e.target.value })}
                    style={{
                      padding: "12px 16px",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                      color: "#f8fafc",
                      fontSize: "0.9rem",
                      outline: "none",
                      minHeight: 80,
                      fontFamily: "monospace",
                      resize: "vertical"
                    }}
                  />
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  style={{
                    flex: 1,
                    padding: "14px",
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    color: "#f8fafc",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                disabled={savingMcp}
                style={{
                  flex: 2,
                  padding: "14px",
                  background: savingMcp ? "rgba(124, 58, 237, 0.4)" : "linear-gradient(135deg, #a78bfa, #8b5cf6)",
                  border: "none",
                  borderRadius: 12,
                  color: "white",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  cursor: savingMcp ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: savingMcp ? "none" : "0 8px 25px rgba(124, 58, 237, 0.25)",
                  transition: "all 0.2s",
                }}
              >
                {savingMcp ? (
                  <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", animation: "spin 1s linear infinite" }} />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                    <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                    <line x1="6" y1="6" x2="6.01" y2="6"></line>
                    <line x1="6" y1="18" x2="6.01" y2="18"></line>
                  </svg>
                )}
                {editingId ? "Salvar Alterações" : "Cadastrar Servidor"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
