"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface KnowledgeDoc {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

type SettingsTab = "keys" | "knowledge";

export default function SettingsPage() {
  // Estado para chaves de API
  const [keys, setKeys] = useState({ google: "", openai: "", anthropic: "" });
  const [status, setStatus] = useState({ google: false, openai: false, anthropic: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estado para RAG
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [newDoc, setNewDoc] = useState({ title: "", content: "" });
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [indexing, setIndexing] = useState(false);

  // Controle de Tabs e Mensagens
  const [activeTab, setActiveTab] = useState<SettingsTab>("keys");
  const [message, setMessage] = useState({ text: "", type: "" });

  // Carregar status das chaves no início
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

  // Carregar documentos do RAG quando a aba muda para 'knowledge'
  useEffect(() => {
    if (activeTab === "knowledge") {
      loadKnowledgeDocs();
    }
  }, [activeTab]);

  const loadKnowledgeDocs = async () => {
    setLoadingDocs(true);
    try {
      const res = await fetch("/api/settings/knowledge");
      const data = await res.json();
      if (data.success) {
        setDocs(data.data);
      }
    } catch (error) {
      console.error("Erro ao carregar documentos:", error);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleSaveKeys = async () => {
    setSaving(true);
    setMessage({ text: "", type: "" });
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
      }));

      setKeys({ google: "", openai: "", anthropic: "" });
      setMessage({ text: "Chaves de API salvas com sucesso!", type: "success" });
    } catch (error) {
      setMessage({ text: "Erro ao salvar as chaves.", type: "error" });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    }
  };

  const handleAddDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.title.trim() || !newDoc.content.trim()) return;

    setIndexing(true);
    setMessage({ text: "", type: "" });
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
        setMessage({ text: "Documento indexado com sucesso na base vetorial!", type: "success" });
      } else {
        setMessage({ text: data.error || "Erro ao indexar documento.", type: "error" });
      }
    } catch (error) {
      console.error(error);
      setMessage({ text: "Erro na indexação.", type: "error" });
    } finally {
      setIndexing(false);
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este documento da base de conhecimento?")) return;

    try {
      const res = await fetch(`/api/settings/knowledge/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        setDocs((prev) => prev.filter((d) => d.id !== id));
        setMessage({ text: "Documento excluído com sucesso da base.", type: "success" });
      } else {
        setMessage({ text: data.error || "Erro ao excluir documento.", type: "error" });
      }
    } catch (error) {
      console.error(error);
      setMessage({ text: "Erro ao excluir documento.", type: "error" });
    } finally {
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    }
  };

  const providers = [
    {
      id: "google",
      name: "Google Gemini",
      icon: "✨",
      color: "#4285F4",
      description: "Usado atualmente pelos Agentes (Requerido)",
    },
    {
      id: "openai",
      name: "OpenAI",
      icon: "🧠",
      color: "#10a37f",
      description: "Suporte futuro para GPT-4o e embeddings",
    },
    {
      id: "anthropic",
      name: "Anthropic",
      icon: "🧬",
      color: "#cc9b7a",
      description: "Suporte futuro para Claude 3.5 Sonnet",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", padding: "40px 60px", display: "flex", flexDirection: "column", gap: 30, background: "var(--background)" }}>
      {/* HEADER */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, margin: 0, color: "#f8fafc" }}>Configurações</h1>
          <p style={{ color: "#94a3b8", marginTop: 8 }}>Gerencie seus provedores de IA e a base de conhecimento local.</p>
        </div>
        <Link href="/workspace" style={{ padding: "10px 20px", background: "rgba(255,255,255,0.05)", borderRadius: 12, color: "#e2e8f0", textDecoration: "none", border: "1px solid rgba(255,255,255,0.1)", fontSize: "0.9rem", transition: "all 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}>
          Voltar ao Workspace
        </Link>
      </header>

      {/* NOTIFICATION MESSAGE */}
      {message.text && (
        <div style={{ padding: "16px 20px", borderRadius: 12, background: message.type === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${message.type === "success" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`, color: message.type === "success" ? "#4ade80" : "#f87171", display: "flex", alignItems: "center", gap: 10, animation: "slide-in 0.2s ease" }}>
          {message.type === "success" ? "✓" : "⚠"} {message.text}
        </div>
      )}

      {/* TABS */}
      <div style={{ display: "flex", gap: 24, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 12 }}>
        <button
          onClick={() => setActiveTab("keys")}
          style={{
            background: "transparent",
            border: "none",
            color: activeTab === "keys" ? "#a78bfa" : "#64748b",
            fontSize: "1rem",
            fontWeight: activeTab === "keys" ? 600 : 400,
            cursor: "pointer",
            padding: "8px 16px",
            borderBottom: activeTab === "keys" ? "2px solid #a78bfa" : "2px solid transparent",
            marginBottom: -14,
            transition: "all 0.2s"
          }}
        >
          🔑 Provedores de IA
        </button>
        <button
          onClick={() => setActiveTab("knowledge")}
          style={{
            background: "transparent",
            border: "none",
            color: activeTab === "knowledge" ? "#a78bfa" : "#64748b",
            fontSize: "1rem",
            fontWeight: activeTab === "knowledge" ? 600 : 400,
            cursor: "pointer",
            padding: "8px 16px",
            borderBottom: activeTab === "knowledge" ? "2px solid #a78bfa" : "2px solid transparent",
            marginBottom: -14,
            transition: "all 0.2s"
          }}
        >
          📚 Base de Conhecimento (RAG)
        </button>
      </div>

      {/* TAB CONTENT: API KEYS */}
      {activeTab === "keys" && (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 24, padding: 40, flex: 1 }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: 30, color: "#e2e8f0", display: "flex", alignItems: "center", gap: 10 }}>
            <span>🔑</span> Chaves de API de Provedores
          </h2>

          {loading ? (
            <div style={{ color: "#64748b" }}>Carregando provedores...</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {providers.map((p) => {
                const isConfigured = status[p.id as keyof typeof status];
                
                return (
                  <div key={p.id} style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 40, paddingBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${p.color}15`, color: p.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
                          {p.icon}
                        </div>
                        <h3 style={{ fontSize: "1rem", fontWeight: 600, margin: 0, color: "#e2e8f0" }}>{p.name}</h3>
                      </div>
                      <p style={{ color: "#64748b", fontSize: "0.85rem", lineHeight: 1.5, margin: 0 }}>
                        {p.description}
                      </p>
                      <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 100, background: isConfigured ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)", border: `1px solid ${isConfigured ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)"}`, fontSize: "0.75rem", color: isConfigured ? "#4ade80" : "#fbbf24" }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />
                        {isConfigured ? "Configurado" : "Não Configurado"}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center" }}>
                      <div style={{ position: "relative", width: "100%", maxWidth: 500 }}>
                        <input
                          type="password"
                          placeholder={isConfigured ? "•••••••••••••••••••••••••••• (Substituir chave atual)" : "Cole sua API Key aqui..."}
                          value={keys[p.id as keyof typeof keys]}
                          onChange={(e) => setKeys({ ...keys, [p.id]: e.target.value })}
                          style={{ width: "100%", background: "#0f0e17", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "14px 16px", color: "#e2e8f0", fontSize: "0.95rem", outline: "none", transition: "border-color 0.2s" }}
                          onFocus={(e) => (e.target.style.borderColor = "#7c3aed")}
                          onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                <button
                  onClick={handleSaveKeys}
                  disabled={saving}
                  style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 12, padding: "14px 32px", fontSize: "0.95rem", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, transition: "background 0.2s", boxShadow: "0 0 20px rgba(124,58,237,0.3)" }}
                  onMouseOver={(e) => !saving && (e.currentTarget.style.background = "#6d28d9")}
                  onMouseOut={(e) => !saving && (e.currentTarget.style.background = "#7c3aed")}
                >
                  {saving ? "Salvando..." : "Salvar Configurações"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: KNOWLEDGE BASE (RAG) */}
      {activeTab === "knowledge" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 30, flex: 1, minHeight: 400 }}>
          
          {/* LEFT PANEL: Document list */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 24, padding: 30, display: "flex", flexDirection: "column", gap: 20 }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 600, margin: 0, color: "#e2e8f0", display: "flex", alignItems: "center", gap: 10 }}>
              <span>📚</span> Documentos Indexados ({docs.length})
            </h2>

            {loadingDocs ? (
              <div style={{ color: "#64748b", padding: 20 }}>Carregando documentos...</div>
            ) : docs.length === 0 ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, opacity: 0.5, border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 16, padding: 40 }}>
                <span style={{ fontSize: "2rem" }}>📂</span>
                <p style={{ fontSize: "0.9rem", color: "#94a3b8", textAlign: "center", margin: 0, maxWidth: 300 }}>
                  Nenhum documento indexado. Adicione conhecimento ao lado para treinar os agentes semanticamente.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", maxHeight: "60vh" }}>
                {docs.map((doc) => (
                  <div key={doc.id} style={{ padding: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontSize: "0.95rem", fontWeight: 600, margin: "0 0 6px 0", color: "#f8fafc" }}>{doc.title}</h4>
                      <p style={{ fontSize: "0.82rem", color: "#94a3b8", margin: "0 0 10px 0", lineHeight: 1.5, wordBreak: "break-word" }}>
                        {doc.content.slice(0, 180)}{doc.content.length > 180 ? "..." : ""}
                      </p>
                      <span style={{ fontSize: "0.72rem", color: "#475569" }}>
                        Indexado em: {new Date(doc.createdAt).toLocaleDateString("pt-BR")} às {new Date(doc.createdAt).toLocaleTimeString("pt-BR")}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteDoc(doc.id)}
                      style={{
                        padding: 8,
                        background: "rgba(239,68,68,0.1)",
                        border: "1px solid rgba(239,68,68,0.2)",
                        borderRadius: 10,
                        color: "#ef4444",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(239,68,68,0.2)";
                        e.currentTarget.style.color = "#f87171";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                        e.currentTarget.style.color = "#ef4444";
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT PANEL: Form to index new doc */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 24, padding: 30, display: "flex", flexDirection: "column", gap: 20 }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 600, margin: 0, color: "#e2e8f0" }}>
              Indexar Novo Conteúdo
            </h2>
            <p style={{ fontSize: "0.82rem", color: "#64748b", margin: 0, lineHeight: 1.5 }}>
              Adicione manuais, diretrizes, contextos do seu negócio ou qualquer informação que os agentes devam saber. O texto será transformado em vetores (embeddings) para busca semântica em tempo de execução.
            </p>

            <form onSubmit={handleAddDoc} style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 10 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Título do Documento</label>
                <input
                  type="text"
                  placeholder="Ex: Guia de Tom de Voz da Marca"
                  value={newDoc.title}
                  onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                  disabled={indexing}
                  style={{ width: "100%", background: "#0f0e17", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 14px", color: "#e2e8f0", fontSize: "0.9rem", outline: "none", transition: "border-color 0.2s" }}
                  onFocus={(e) => (e.target.style.borderColor = "#7c3aed")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                  required
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Conteúdo</label>
                <textarea
                  placeholder="Cole ou digite as diretrizes/conhecimento aqui..."
                  value={newDoc.content}
                  onChange={(e) => setNewDoc({ ...newDoc, content: e.target.value })}
                  disabled={indexing}
                  rows={8}
                  style={{ width: "100%", background: "#0f0e17", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 14px", color: "#e2e8f0", fontSize: "0.9rem", outline: "none", resize: "none", lineHeight: 1.6, transition: "border-color 0.2s" }}
                  onFocus={(e) => (e.target.style.borderColor = "#7c3aed")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={indexing || !newDoc.title.trim() || !newDoc.content.trim()}
                style={{
                  background: indexing ? "rgba(124,58,237,0.3)" : "#7c3aed",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  padding: "14px 20px",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  cursor: indexing || !newDoc.title.trim() || !newDoc.content.trim() ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  transition: "background 0.2s",
                  boxShadow: "0 4px 12px rgba(124,58,237,0.15)",
                  marginTop: 8
                }}
              >
                {indexing ? (
                  <>
                    <svg style={{ animation: "spin-slow 1s linear infinite" }} width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="40" strokeDashoffset="10" />
                    </svg>
                    Gerando Embeddings...
                  </>
                ) : (
                  <>
                    <span>🚀</span> Indexar na Base Vetorial
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
