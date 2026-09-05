"use client";

import React, { useState } from "react";
import { Key, Copy, Check, X, ShieldCheck, AlertCircle, Bot, RefreshCw, Terminal } from "lucide-react";
import type { ApiTokenRecord } from "@/types/token";

interface AgentOption {
  id: string;
  name: string;
  role: string;
  provider?: string;
  model?: string;
}

interface CreateTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents: AgentOption[];
  onTokenCreated: (data: { token: string; record: ApiTokenRecord }) => void;
}

export function CreateTokenModal({
  isOpen,
  onClose,
  agents,
  onTokenCreated,
}: CreateTokenModalProps) {
  const [name, setName] = useState("");
  const [agentId, setAgentId] = useState(agents[0]?.id || "");
  const [submitting, setSubmitting] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !agentId.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/settings/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          agentId: agentId.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.token && data.record) {
        setGeneratedToken(data.token);
        onTokenCreated({ token: data.token, record: data.record });
      } else {
        setError(data.error || "Falha ao gerar o token de API.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Erro de comunicação ao criar o token.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (!generatedToken) return;
    navigator.clipboard.writeText(generatedToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleClose = () => {
    setName("");
    setAgentId(agents[0]?.id || "");
    setGeneratedToken(null);
    setCopied(false);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0b0817] border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/[0.02]">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 m-0">
              <Key className="w-5 h-5 text-violet-400" />
              {generatedToken ? "Token Gerado com Sucesso" : "Criar Novo Token de API"}
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-0">
              {generatedToken
                ? "Copie e armazene seu token agora. Ele não será exibido novamente."
                : "Gere uma credencial de acesso direto para aplicações e frontends externos."}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 mb-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!generatedToken ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Nome Identificador do Token *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: App Mobile Vendas, Integração ERP"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Identificador amigável para reconhecer o uso deste token no painel.
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Agente Vinculado *
                </label>
                {agents.length === 0 ? (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Nenhum agente cadastrado no workspace. Crie um agente antes de gerar tokens.</span>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={agentId}
                      onChange={(e) => setAgentId(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-violet-500 transition-colors appearance-none cursor-pointer"
                    >
                      {agents.map((ag) => (
                        <option key={ag.id} value={ag.id}>
                          {ag.name} - {ag.role} ({ag.model || "Gemini"})
                        </option>
                      ))}
                    </select>
                    <Bot className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
                  </div>
                )}
                <span className="text-[11px] text-slate-500 mt-1 block">
                  As requisições autenticadas com este token conversarão exclusivamente com o agente selecionado.
                </span>
              </div>

              <div className="p-3.5 bg-violet-500/5 border border-violet-500/15 rounded-lg">
                <div className="flex items-center gap-2 text-xs font-semibold text-violet-300">
                  <ShieldCheck className="w-4 h-4 text-violet-400" />
                  Validade Perpétua e Revogação
                </div>
                <p className="text-[11px] text-slate-400 mt-1 mb-0 leading-relaxed">
                  Este token é emitido sem data de expiração temporal pré-fixada. Você poderá revogar o acesso imediatamente a qualquer momento na tabela de tokens.
                </p>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium rounded-lg border border-white/10 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || agents.length === 0}
                  className="flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-violet-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Gerando Token...
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      Gerar Token
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center gap-2.5 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <span>Credencial gerada com sucesso. Copie agora e guarde em um cofre de variáveis ou ambiente seguro.</span>
              </div>

              {/* Token Display Box */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Token JWT (Bearer Token)
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    readOnly
                    value={generatedToken}
                    className="w-full bg-black/40 border border-violet-500/30 rounded-lg pl-3 pr-24 py-2.5 font-mono text-xs text-violet-300 select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="absolute right-1.5 flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-md shadow transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copiar
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Usage Example */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-slate-500" />
                  Como utilizar na sua requisição HTTP
                </label>
                <div className="p-3 bg-black/50 border border-white/10 rounded-lg font-mono text-[11px] text-slate-300 space-y-1">
                  <div className="text-slate-500"># Cabeçalho de autorização:</div>
                  <div className="text-violet-300 break-all">
                    Authorization: Bearer {generatedToken.slice(0, 30)}...
                  </div>
                  <div className="text-slate-500 pt-1"># Endpoint:</div>
                  <div className="text-emerald-400">POST /api/v1/chat</div>
                </div>
              </div>

              {/* Modal Finish Button */}
              <div className="flex items-center justify-end pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-violet-600/20 transition-colors cursor-pointer"
                >
                  Concluir
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
