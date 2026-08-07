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
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 w-full py-6 md:py-10 px-4 md:px-0 max-w-6xl mx-auto">
      {/* LEFT COLUMN: Registered Servers */}
      <div className="flex-1 flex flex-col gap-8 w-full">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl md:text-2xl font-bold text-slate-50 m-0">
            Servidores MCP
          </h2>
          <p className="text-slate-400 text-sm m-0 leading-relaxed">
            Gerencie conexões com servidores Model Context Protocol (MCP). Adicione fontes de dados e ferramentas externas para seus agentes de IA.
          </p>
        </div>

        <div className="flex flex-col gap-4 mt-2">
          <h3 className="text-lg font-bold text-slate-50 m-0">
            Servidores MCP Cadastrados ({mcpServers.length})
          </h3>
          
          <div className="flex flex-col gap-4">
            {loadingMcp ? (
              <p className="text-slate-400">Carregando servidores MCP...</p>
            ) : mcpServers.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl">
                <p className="text-slate-400">Nenhum servidor MCP configurado.</p>
              </div>
            ) : (
              mcpServers.map((srv) => (
                <div
                  key={srv.id}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 flex flex-col gap-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h4 className="text-lg font-bold text-slate-50 m-0">
                          {srv.name || srv.id}
                        </h4>
                        <span className="px-2 py-1 bg-white/10 rounded-md text-[10px] font-bold text-slate-300">
                          {srv.type.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-start md:items-center gap-2 text-slate-400 text-xs font-mono break-all md:break-normal">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5 md:mt-0">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                        {srv.type === "sse" ? srv.url : `${srv.command} ${srv.args?.join(" ")}`}
                      </div>
                    </div>
                    <div className="flex gap-2 self-end sm:self-auto shrink-0 mt-[-20px] sm:mt-0">
                      <button
                        onClick={() => handleEditMcpServer(srv)}
                        className="bg-transparent border-none text-slate-400 cursor-pointer p-1.5 hover:text-slate-50 transition-colors"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteMcpServer(srv.id)}
                        className="bg-transparent border-none text-slate-400 cursor-pointer p-1.5 hover:text-red-500 transition-colors"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-white/5 pt-4 gap-4">
                    <div className="flex gap-6 sm:gap-12">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-500 tracking-wider">SERVER ID</span>
                        <span className="text-xs text-slate-200 font-mono">{srv.id}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-500 tracking-wider">STATUS</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          <span className="text-xs font-semibold text-green-500">Ativo</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleTestMcpServer(srv.id)}
                      disabled={testingMcp === srv.id}
                      className="px-4 py-2 bg-transparent border border-white/10 rounded-lg text-slate-50 text-xs font-semibold cursor-pointer flex items-center justify-center gap-2 transition-colors hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
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
      <div className="w-full lg:w-[440px] shrink-0">
        <div
          className="bg-white/5 border border-white/10 rounded-[24px] p-6 md:p-8 flex flex-col gap-6"
        >
          <div className="flex flex-col gap-2">
            <h2 className="text-lg md:text-xl font-bold text-slate-50 m-0">
              {editingId ? "Editar Servidor MCP" : "Cadastrar Servidor MCP"}
            </h2>
            <p className="text-slate-400 text-xs md:text-sm m-0 leading-relaxed">
              Adicione conexões com servidores MCP locais ou remotos. Os agentes autorizados poderão utilizar as ferramentas expostas por estes servidores de forma automática.
            </p>
          </div>

          <form onSubmit={handleAddMcpServer} className="flex flex-col gap-5">
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-200">ID DO SERVIDOR *</label>
              <input
                type="text"
                placeholder="Ex: mcp-weather"
                value={mcpForm.id}
                onChange={(e) => setMcpForm({ ...mcpForm, id: e.target.value })}
                disabled={!!editingId}
                required
                className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-50 text-sm outline-none focus:border-violet-400 disabled:opacity-50 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-200">NOME DE EXIBIÇÃO</label>
              <input
                type="text"
                placeholder="Ex: Servidor de Clima e Tempo"
                value={mcpForm.name}
                onChange={(e) => setMcpForm({ ...mcpForm, name: e.target.value })}
                className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-50 text-sm outline-none focus:border-violet-400 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-200">TIPO DE TRANSPORTE *</label>
              <div className="relative">
                <select
                  value={mcpForm.type}
                  onChange={(e) => setMcpForm({ ...mcpForm, type: e.target.value as "sse" | "stdio" })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-50 text-sm outline-none appearance-none focus:border-violet-400 transition-colors"
                >
                  <option value="sse" className="bg-[#110c1c]">SSE (Server-Sent Events) / HTTP</option>
                  <option value="stdio" className="bg-[#110c1c]">STDIO (Execução Local via CMD)</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>
            </div>

            {mcpForm.type === "sse" ? (
              <div className="flex flex-col gap-2 animate-fade-in">
                <label className="text-xs font-bold text-slate-200">URL DO SERVIDOR SSE *</label>
                <input
                  type="url"
                  placeholder="Ex: http://localhost:3001/sse"
                  value={mcpForm.url}
                  onChange={(e) => setMcpForm({ ...mcpForm, url: e.target.value })}
                  required={mcpForm.type === "sse"}
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-50 text-sm outline-none focus:border-violet-400 transition-colors"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-5 animate-fade-in">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-200">COMANDO *</label>
                  <input
                    type="text"
                    placeholder="Ex: node, npx, python3"
                    value={mcpForm.command}
                    onChange={(e) => setMcpForm({ ...mcpForm, command: e.target.value })}
                    required={mcpForm.type === "stdio"}
                    className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-50 text-sm outline-none focus:border-violet-400 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-200">ARGUMENTOS (Separados por vírgula)</label>
                  <input
                    type="text"
                    placeholder="Ex: index.js, --port, 3000"
                    value={mcpForm.args}
                    onChange={(e) => setMcpForm({ ...mcpForm, args: e.target.value })}
                    className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-50 text-sm outline-none focus:border-violet-400 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-200">VARIÁVEIS DE AMBIENTE (JSON Opcional)</label>
                  <textarea
                    placeholder='Ex: { "API_KEY": "12345" }'
                    value={mcpForm.env}
                    onChange={(e) => setMcpForm({ ...mcpForm, env: e.target.value })}
                    className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-50 text-sm outline-none min-h-[80px] font-mono resize-y focus:border-violet-400 transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 p-3.5 bg-transparent border border-white/10 rounded-xl text-slate-50 text-sm font-bold cursor-pointer hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                disabled={savingMcp}
                className={`flex-[2] p-3.5 border-none rounded-xl text-white text-sm font-bold cursor-pointer flex items-center justify-center gap-2 transition-all ${savingMcp ? 'bg-violet-600/40 shadow-none' : 'bg-gradient-to-br from-violet-400 to-violet-600 shadow-[0_8px_25px_rgba(124,58,237,0.25)] hover:scale-[1.02]'}`}
              >
                {savingMcp ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
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
