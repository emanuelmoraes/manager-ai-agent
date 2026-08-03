import React from "react";
import { AiProviderId } from "@/app/workspace/types";

interface Provider {
  id: AiProviderId;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  link: string;
}

interface IAProvidersTabProps {
  keys: Record<AiProviderId, string>;
  setKeys: React.Dispatch<React.SetStateAction<Record<AiProviderId, string>>>;
  status: Record<AiProviderId, boolean>;
  saving: boolean;
  handleSaveKeys: () => void;
}

const PROVIDERS: Provider[] = [
  {
    id: "google",
    name: "Google Gemini",
    icon: "✨",
    color: "#a78bfa",
    description: "Modelos Gemini Pro & Flash",
    link: "https://aistudio.google.com/app/apikey",
  },
  {
    id: "openai",
    name: "OpenAI",
    icon: "🧠",
    color: "#f8fafc",
    description: "Modelos GPT-4 & GPT-3.5",
    link: "https://platform.openai.com/api-keys",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    icon: "🧬",
    color: "#cc9b7a",
    description: "Família Claude 3",
    link: "https://console.anthropic.com/settings/keys",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    icon: "🐋",
    color: "#3b82f6",
    description: "Modelos DeepSeek-V3 & R1",
    link: "https://platform.deepseek.com/api_keys",
  },
  {
    id: "grok",
    name: "Grok (xAI)",
    icon: "⚡",
    color: "#f59e0b",
    description: "Modelos Grok-2 & Vision",
    link: "https://console.x.ai/",
  },
];

export function IAProvidersTab({
  keys,
  setKeys,
  status,
  saving,
  handleSaveKeys,
}: IAProvidersTabProps) {

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, maxWidth: 900, margin: "0 auto", width: "100%", padding: "40px 0" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f8fafc", margin: 0, opacity: 0 }}>
          Provedores de IA
        </h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {PROVIDERS.map((provider) => {
          const isConfigured = status[provider.id];
          return (
            <div key={provider.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 16,
                  padding: "16px 24px",
                  gap: 32,
                }}
              >
                {/* Left Side: Info */}
                <div style={{ display: "flex", alignItems: "center", gap: 16, width: 260, flexShrink: 0 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: `linear-gradient(135deg, ${provider.color}30, ${provider.color}05)`,
                      border: `1px solid ${provider.color}40`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 24,
                    }}
                  >
                    {provider.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f8fafc" }}>{provider.name}</div>
                    <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>{provider.description}</div>
                  </div>
                </div>

                {/* Right Side: Input and Status */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Chave de API
                    </span>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 10px",
                        background: isConfigured ? "rgba(34, 197, 94, 0.1)" : "rgba(249, 115, 22, 0.1)",
                        border: `1px solid ${isConfigured ? "rgba(34, 197, 94, 0.2)" : "rgba(249, 115, 22, 0.2)"}`,
                        borderRadius: 12,
                      }}
                    >
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: isConfigured ? "#22c55e" : "#f97316" }} />
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, color: isConfigured ? "#4ade80" : "#fb923c" }}>
                        {isConfigured ? "CONFIGURADO" : "NÃO CONFIGURADO"}
                      </span>
                    </div>
                  </div>

                  <div style={{ position: "relative" }}>
                    <input
                      type="password"
                      placeholder={isConfigured ? "•••••••••••••••••••••••• (Configurado - Digite para substituir)" : "Insira a chave da API (sk-...)"}
                      value={keys[provider.id] || ""}
                      onChange={(e) => setKeys((prev) => ({ ...prev, [provider.id]: e.target.value }))}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8,
                        color: "#f8fafc",
                        fontSize: "0.95rem",
                        outline: "none",
                        transition: "border 0.2s",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "rgba(167, 139, 250, 0.5)")}
                      onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                    />
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <a href={provider.link} target="_blank" rel="noreferrer" style={{ fontSize: "0.75rem", color: "#a78bfa", textDecoration: "none" }}>
                      Obter chave no {provider.name.split(" ")[0]} ↗
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
        <button
          onClick={handleSaveKeys}
          disabled={saving}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 24px",
            background: saving ? "rgba(139, 92, 246, 0.4)" : "linear-gradient(135deg, #a78bfa, #8b5cf6)",
            border: "none",
            borderRadius: 12,
            color: "white",
            fontSize: "0.95rem",
            fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
            boxShadow: saving ? "none" : "0 4px 20px rgba(139, 92, 246, 0.3)",
            transition: "all 0.2s",
          }}
        >
          {saving ? (
            <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", animation: "spin 1s linear infinite" }} />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
          )}
          Salvar Configurações
        </button>
      </div>
    </div>
  );
}
