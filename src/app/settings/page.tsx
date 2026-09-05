"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/useToast";
import { TopNavigation } from "./components/TopNavigation";
import { IAProvidersTab } from "./components/IAProvidersTab";
import { RAGTab } from "./components/RAGTab";
import { MCPTab } from "./components/MCPTab";
import { TokensTab } from "./components/TokensTab";
import { Timestamp } from "firebase/firestore";
import { getAgentsFromFirebase } from "@/lib/firebase/sync";
import type { ApiTokenRecord } from "@/types/token";
import { AiProviderId, Agent } from "@/app/workspace/types";
import { fetchTokensAction, revokeTokenAction } from "./actions";

interface KnowledgeDoc {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface McpServer {
  id: string;
  name?: string;
  type: "sse" | "stdio";
  url?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
}

type SettingsTab = "keys" | "knowledge" | "mcp" | "tokens";

export default function SettingsPage() {
  const { notifySuccess, notifyError, notifyWarning } = useToast();

  // Navigation State
  const [activeTab, setActiveTab] = useState<SettingsTab>("keys");

  // Providers State
  const [keys, setKeys] = useState<Record<AiProviderId, string>>({ google: "", openai: "", anthropic: "", deepseek: "", grok: "" });
  const [status, setStatus] = useState<Record<AiProviderId, boolean>>({ google: false, openai: false, anthropic: false, deepseek: false, grok: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // RAG State
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [newDoc, setNewDoc] = useState({ title: "", content: "" });
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [ragLimit, setRagLimit] = useState(5);
  const [savingRagLimit, setSavingRagLimit] = useState(false);

  // MCP State
  const [mcpServers, setMcpServers] = useState<McpServer[]>([]);
  const [loadingMcp, setLoadingMcp] = useState(false);
  const [mcpForm, setMcpForm] = useState({
    id: "",
    name: "",
    type: "sse" as "sse" | "stdio",
    url: "",
    command: "",
    args: "",
    env: "",
  });
  const [savingMcp, setSavingMcp] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testingMcp, setTestingMcp] = useState<string | null>(null);

  // Tokens State
  const [tokens, setTokens] = useState<ApiTokenRecord[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);

  // --- Effects ---
  useEffect(() => {
    fetch("/api/settings/keys")
      .then((res) => res.json())
      .then((data) => {
        setStatus(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao carregar status das chaves", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (activeTab === "knowledge") {
      loadKnowledgeDocs();
    } else if (activeTab === "mcp") {
      loadMcpServers();
    } else if (activeTab === "tokens") {
      loadTokens();
      loadAgents();
    }
  }, [activeTab]);

  // --- RAG Functions ---
  const loadKnowledgeDocs = async () => {
    setLoadingDocs(true);
    try {
      const res = await fetch("/api/settings/knowledge");
      const data = await res.json();
      if (data.success) {
        setDocs(data.data);
      }

      const configRes = await fetch("/api/settings/rag");
      if (configRes.ok) {
        const configData = await configRes.json();
        if (configData.success && configData.data) {
          setRagLimit(configData.data.searchLimit || 5);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar documentos:", error);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleSaveRagLimit = async () => {
    setSavingRagLimit(true);
    try {
      const res = await fetch("/api/settings/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchLimit: ragLimit })
      });
      if (res.ok) notifySuccess("Limite de busca atualizado com sucesso!");
      else notifyError("Erro ao salvar o limite de busca.");
    } catch (e) {
      notifyError("Erro de conexão ao salvar limite de busca.");
    } finally {
      setSavingRagLimit(false);
    }
  };

  const handleAddDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.title.trim() || !newDoc.content.trim()) return;

    setIndexing(true);
    try {
      const res = await fetch("/api/settings/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDoc),
      });

      const data = await res.json();

      if (data.success) {
        setDocs((prev) => [...prev, data.data]);
        setNewDoc({ title: "", content: "" });
        notifySuccess("Documento indexado com sucesso na base vetorial!");
      } else {
        notifyError(data.error || "Erro ao indexar documento.");
      }
    } catch (error) {
      console.error(error);
      notifyError("Erro na indexação.");
    } finally {
      setIndexing(false);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja remover este documento da base de conhecimento?")) return;

    try {
      const res = await fetch(`/api/settings/knowledge/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        setDocs((prev) => prev.filter((d) => d.id !== id));
        notifySuccess("Documento excluído com sucesso da base.");
      } else {
        notifyError(data.error || "Erro ao excluir documento.");
      }
    } catch (error) {
      console.error(error);
      notifyError("Erro ao excluir documento.");
    }
  };

  // --- API Keys Functions ---
  const handleSaveKeys = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(keys),
      });

      if (!res.ok) throw new Error("Falha ao salvar chaves");

      setStatus((prev) => ({
        ...prev,
        google: keys.google ? true : prev.google,
        openai: keys.openai ? true : prev.openai,
        anthropic: keys.anthropic ? true : prev.anthropic,
        deepseek: keys.deepseek ? true : prev.deepseek,
        grok: keys.grok ? true : prev.grok,
      }));

      setKeys({ google: "", openai: "", anthropic: "", deepseek: "", grok: "" });
      notifySuccess("Chaves de API salvas com sucesso!");
    } catch (error) {
      notifyError("Erro ao salvar as chaves.");
    } finally {
      setSaving(false);
    }
  };

  // --- MCP Servers Functions ---
  const loadMcpServers = async () => {
    setLoadingMcp(true);
    try {
      const res = await fetch("/api/settings/mcp");
      const data = await res.json();
      if (data.success) {
        setMcpServers(data.data);
      }
    } catch (error) {
      console.error("Erro ao carregar servidores MCP:", error);
    } finally {
      setLoadingMcp(false);
    }
  };

  const handleAddMcpServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mcpForm.id.trim()) return;

    setSavingMcp(true);
    try {
      let parsedEnv = {};
      if (mcpForm.env.trim()) {
        try {
          parsedEnv = JSON.parse(mcpForm.env);
        } catch (err) {
          notifyError("Variáveis de Ambiente JSON inválidas.");
          setSavingMcp(false);
          return;
        }
      }

      // Convert comma-separated string to array for args
      const argsArray = mcpForm.args ? mcpForm.args.split(",").map(a => a.trim()).filter(a => a) : [];

      const payload = {
        ...mcpForm,
        args: argsArray,
        env: parsedEnv
      };

      const res = await fetch("/api/settings/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setMcpServers((prev) => {
          const idx = prev.findIndex((s) => s.id === data.data.id);
          if (idx > -1) {
            const copy = [...prev];
            copy[idx] = data.data;
            return copy;
          }
          return [...prev, data.data];
        });
        setMcpForm({
          id: "",
          name: "",
          type: "sse",
          url: "",
          command: "",
          args: "",
          env: "",
        });
        setEditingId(null);
        notifySuccess(editingId ? "Servidor MCP atualizado com sucesso!" : "Servidor MCP cadastrado com sucesso!");
      } else {
        notifyError(data.error || "Erro ao salvar servidor MCP.");
      }
    } catch (error) {
      console.error(error);
      notifyError("Erro ao cadastrar servidor MCP.");
    } finally {
      setSavingMcp(false);
    }
  };

  const handleDeleteMcpServer = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este servidor MCP?")) return;

    try {
      const res = await fetch(`/api/settings/mcp/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setMcpServers((prev) => prev.filter((s) => s.id !== id));
        notifySuccess("Servidor MCP excluído com sucesso!");
      } else {
        notifyError(data.error || "Erro ao excluir servidor MCP.");
      }
    } catch (error) {
      console.error(error);
      notifyError("Erro ao excluir servidor.");
    }
  };

  const handleEditMcpServer = (srv: McpServer) => {
    setEditingId(srv.id);
    setMcpForm({
      id: srv.id,
      name: srv.name || "",
      type: srv.type,
      url: srv.url || "",
      command: srv.command || "",
      args: srv.args && Array.isArray(srv.args) ? srv.args.join(", ") : "",
      env: srv.env ? JSON.stringify(srv.env) : "",
    });
  };

  const handleTestMcpServer = async (id: string) => {
    setTestingMcp(id);
    try {
      const res = await fetch(`/api/settings/mcp/${id}/test`);
      const data = await res.json();
      if (data.success) {
        notifySuccess(`Conectado com sucesso ao servidor MCP!\nFerramentas: ${data.tools.length}`);
      } else {
        notifyError(`Erro ao testar conexão com o servidor: ${data.error}`);
      }
    } catch (error: any) {
      notifyError(`Erro na requisição de teste: ${error.message}`);
    } finally {
      setTestingMcp(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setMcpForm({
      id: "",
      name: "",
      type: "sse",
      url: "",
      command: "",
      args: "",
      env: "",
    });
  };

  // --- Tokens Functions ---
  const loadTokens = async () => {
    setLoadingTokens(true);
    try {
      const tokenList = await fetchTokensAction();
      setTokens(tokenList);
    } catch (err: unknown) {
      console.error("Erro ao carregar tokens:", err);
      notifyError("Erro ao carregar tokens de API.");
    } finally {
      setLoadingTokens(false);
    }
  };

  const loadAgents = async () => {
    try {
      const fAgents = await getAgentsFromFirebase();
      if (fAgents && Array.isArray(fAgents)) {
        setAgents(fAgents as Agent[]);
      }
    } catch (err) {
      console.error("Erro ao carregar agentes:", err);
    }
  };

  const handleTokenCreated = (data: { token: string; record: ApiTokenRecord }) => {
    notifySuccess("Token de API gerado com sucesso!");
    setTokens((prev) => [data.record, ...prev]);
  };

  const handleRevokeToken = async (id: string) => {
    try {
      await revokeTokenAction(id);
      notifySuccess("Token revogado com sucesso!");
      setTokens((prev) =>
        prev.map((tok) =>
          tok.id === id ? { ...tok, status: "revoked", revokedAt: Timestamp.now() } : tok
        )
      );
    } catch (err: unknown) {
      console.error("Erro ao revogar token:", err);
      notifyError("Erro ao revogar token.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "radial-gradient(ellipse at top left, #1a103c 0%, #03020a 100%)", overflow: "hidden" }}>
      <TopNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      <main style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        {activeTab === "keys" && (
          <div style={{ animation: "fade-in 0.3s ease-out", width: "100%", flex: 1 }}>
            <IAProvidersTab
              keys={keys}
              setKeys={setKeys}
              status={status}
              saving={saving}
              handleSaveKeys={handleSaveKeys}
            />
          </div>
        )}

        {activeTab === "knowledge" && (
          <div style={{ animation: "fade-in 0.3s ease-out", width: "100%", flex: 1 }}>
            <RAGTab
              docs={docs}
              newDoc={newDoc}
              setNewDoc={setNewDoc}
              loadingDocs={loadingDocs}
              indexing={indexing}
              ragLimit={ragLimit}
              setRagLimit={setRagLimit}
              savingRagLimit={savingRagLimit}
              handleSaveRagLimit={handleSaveRagLimit}
              handleAddDoc={handleAddDoc}
              handleDeleteDoc={handleDeleteDoc}
            />
          </div>
        )}

        {activeTab === "mcp" && (
          <div style={{ animation: "fade-in 0.3s ease-out", width: "100%", flex: 1 }}>
            <MCPTab
              mcpServers={mcpServers}
              loadingMcp={loadingMcp}
              mcpForm={mcpForm}
              setMcpForm={setMcpForm}
              savingMcp={savingMcp}
              editingId={editingId}
              testingMcp={testingMcp}
              handleAddMcpServer={handleAddMcpServer}
              handleDeleteMcpServer={handleDeleteMcpServer}
              handleEditMcpServer={handleEditMcpServer}
              handleTestMcpServer={handleTestMcpServer}
              handleCancelEdit={handleCancelEdit}
            />
          </div>
        )}

        {activeTab === "tokens" && (
          <div style={{ animation: "fade-in 0.3s ease-out", width: "100%", flex: 1 }}>
            <TokensTab
              tokens={tokens}
              agents={agents}
              loadingTokens={loadingTokens}
              onRefreshTokens={loadTokens}
              onTokenCreated={handleTokenCreated}
              onRevokeToken={handleRevokeToken}
            />
          </div>
        )}
      </main>
    </div>
  );
}
