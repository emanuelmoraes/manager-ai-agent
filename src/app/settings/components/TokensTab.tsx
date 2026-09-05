"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Key, Plus, RefreshCw, Shield, ShieldAlert, Bot, Calendar, Clock, AlertTriangle, FileText, ExternalLink } from "lucide-react";
import { CreateTokenModal } from "./CreateTokenModal";
import type { ApiTokenRecord } from "@/types/token";
import type { Timestamp } from "firebase/firestore";

interface AgentItem {
  id: string;
  name: string;
  role: string;
  provider?: string;
  model?: string;
}

interface TokensTabProps {
  tokens: ApiTokenRecord[];
  agents: AgentItem[];
  loadingTokens: boolean;
  onRefreshTokens: () => void;
  onTokenCreated: (data: { token: string; record: ApiTokenRecord }) => void;
  onRevokeToken: (tokenId: string) => Promise<void>;
}

export function TokensTab({
  tokens,
  agents,
  loadingTokens,
  onRefreshTokens,
  onTokenCreated,
  onRevokeToken,
}: TokensTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const getAgentName = (agentId: string) => {
    const ag = agents.find((a) => a.id === agentId);
    return ag ? ag.name : agentId;
  };

  const getAgentRole = (agentId: string) => {
    const ag = agents.find((a) => a.id === agentId);
    return ag ? ag.role : null;
  };

  const formatDate = (timestamp?: Timestamp | null): string => {
    if (!timestamp) return "Nunca utilizado";
    try {
      const date =
        typeof timestamp.toDate === "function"
          ? timestamp.toDate()
          : new Date(timestamp.seconds * 1000);

      return date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Data indisponível";
    }
  };

  const handleRevoke = async (tokenId: string, tokenName: string) => {
    const confirmed = window.confirm(
      `Deseja realmente revogar o token "${tokenName}"?\n\nApós a revogação, qualquer aplicação externa utilizando esta credencial receberá erro HTTP 401 de forma imediata.`
    );
    if (!confirmed) return;

    setRevokingId(tokenId);
    try {
      await onRevokeToken(tokenId);
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/5">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 m-0">
            <Key className="w-5 h-5 text-violet-400" />
            Tokens de Acesso da API
          </h2>
          <p className="text-sm text-slate-400 mt-1 mb-0">
            Gerencie credenciais permanentes protegidas por JWT para que aplicações externas e frontends conversem com seus agentes.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href="/api-docs"
            target="_blank"
            className="flex items-center justify-center gap-2 px-3.5 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-sm font-medium rounded-lg border border-indigo-500/25 transition-colors cursor-pointer"
            title="Abrir documentação interativa Swagger / OpenAPI"
          >
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>Documentação Swagger</span>
            <ExternalLink className="w-3 h-3 text-indigo-400/70" />
          </Link>

          <button
            onClick={onRefreshTokens}
            disabled={loadingTokens}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium rounded-lg border border-white/10 transition-colors cursor-pointer"
            title="Recarregar tokens"
          >
            <RefreshCw className={`w-4 h-4 ${loadingTokens ? "animate-spin" : ""}`} />
            Atualizar
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-violet-600/20 transition-all cursor-pointer w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Novo Token de API
          </button>
        </div>
      </div>

      {/* Info Notice */}
      <div className="mb-6 p-4 bg-violet-500/5 border border-violet-500/15 rounded-xl flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            <span className="font-semibold text-violet-300">Como funciona a autorização:</span> Cada token gerado concede autorização para interagir via <code className="bg-white/10 px-1.5 py-0.5 rounded text-violet-200">POST /api/v1/chat</code> com o Agente configurado. Os tokens são permanentes (sem expiração temporal) e podem ser revogados individualmente a qualquer momento.
          </div>
        </div>
        <Link
          href="/api-docs"
          target="_blank"
          className="shrink-0 text-xs font-medium text-violet-300 hover:text-violet-200 underline underline-offset-4 flex items-center gap-1 self-center"
        >
          Testar no Swagger UI
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Tokens Table */}
      {loadingTokens ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/[0.02] border border-white/5 rounded-xl">
          <RefreshCw className="w-8 h-8 text-violet-400 animate-spin mb-3" />
          <p className="text-slate-400 text-sm m-0">Carregando tokens cadastrados...</p>
        </div>
      ) : tokens.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/[0.02] border border-white/5 rounded-xl text-center px-4">
          <Key className="w-12 h-12 text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-slate-200 m-0">Nenhum token criado</h3>
          <p className="text-sm text-slate-400 max-w-md mt-1 mb-6">
            Crie seu primeiro token de API para permitir que seus aplicativos conversem diretamente com os agentes de IA.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-violet-600/20 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Criar Primeiro Token
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white/[0.02] border border-white/5 rounded-xl shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">Identificador do Token</th>
                <th className="py-4 px-6">Agente Vinculado</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Criado em</th>
                <th className="py-4 px-6">Último Acesso</th>
                <th className="py-4 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm text-slate-300">
              {tokens.map((tok) => {
                const isActive = tok.status === "active";
                const isRevoking = revokingId === tok.id;

                return (
                  <tr key={tok.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Token Name & JTI */}
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-100 flex items-center gap-2">
                        <Key className="w-4 h-4 text-violet-400 shrink-0" />
                        {tok.name}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        ID: {tok.id}
                      </div>
                    </td>

                    {/* Agent details */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-200">
                        <Bot className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                        {getAgentName(tok.agentId)}
                      </div>
                      {getAgentRole(tok.agentId) && (
                        <div className="text-xs text-slate-500 mt-0.5 pl-5.5">
                          {getAgentRole(tok.agentId)}
                        </div>
                      )}
                    </td>

                    {/* Status badge */}
                    <td className="py-4 px-6">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                          Revogado
                        </span>
                      )}
                    </td>

                    {/* Created Date */}
                    <td className="py-4 px-6 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {formatDate(tok.createdAt)}
                      </div>
                    </td>

                    {/* Last Used Date */}
                    <td className="py-4 px-6 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {formatDate(tok.lastUsedAt)}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      {isActive ? (
                        <button
                          onClick={() => handleRevoke(tok.id, tok.name)}
                          disabled={isRevoking}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          title="Revogar credencial imediatamente"
                        >
                          {isRevoking ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Revogando...
                            </>
                          ) : (
                            <>
                              <ShieldAlert className="w-3.5 h-3.5" />
                              Revogar
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500 italic">
                          Revogado {tok.revokedAt ? formatDate(tok.revokedAt) : ""}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal para criação de novo token */}
      <CreateTokenModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        agents={agents}
        onTokenCreated={(data) => {
          onTokenCreated(data);
        }}
      />
    </div>
  );
}
