import React from "react";
import { AiProviderId } from "@/app/workspace/types";
import { SiGoogle, SiAnthropic, SiDeepseek, SiX } from "react-icons/si";
import { TbBrandOpenai } from "react-icons/tb";
import { FiExternalLink } from "react-icons/fi";

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
    icon: <SiGoogle size={20} />,
    color: "#a78bfa",
    description: "Modelos Gemini Pro & Flash",
    link: "https://aistudio.google.com/app/apikey",
  },
  {
    id: "openai",
    name: "OpenAI",
    icon: <TbBrandOpenai size={22} />,
    color: "#f8fafc",
    description: "Modelos GPT-4 & GPT-3.5",
    link: "https://platform.openai.com/api-keys",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    icon: <SiAnthropic size={20} />,
    color: "#cc9b7a",
    description: "Família Claude 3",
    link: "https://console.anthropic.com/settings/keys",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    icon: <SiDeepseek size={20} />,
    color: "#3b82f6",
    description: "Modelos DeepSeek-V3 & R1",
    link: "https://platform.deepseek.com/api_keys",
  },
  {
    id: "grok",
    name: "Grok (xAI)",
    icon: <SiX size={18} />,
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
    <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full py-6 md:py-10 px-4 md:px-0">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl md:text-2xl font-bold text-slate-50 m-0 opacity-0 h-0 overflow-hidden">
          Provedores de IA
        </h2>
      </div>

      <div className="flex flex-col gap-6">
        {PROVIDERS.map((provider) => {
          const isConfigured = status[provider.id];
          return (
            <div key={provider.id} className="flex flex-col gap-2">
              <div
                className="flex flex-col md:flex-row md:items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 gap-6 md:gap-8 shadow-sm"
              >
                {/* Left Side: Info */}
                <div className="flex items-center gap-4 w-full md:w-[260px] shrink-0">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${provider.color}30, ${provider.color}05)`,
                      border: `1px solid ${provider.color}40`,
                    }}
                  >
                    {provider.icon}
                  </div>
                  <div>
                    <div className="text-base md:text-lg font-bold text-slate-50">{provider.name}</div>
                    <div className="text-xs md:text-sm text-slate-400">{provider.description}</div>
                  </div>
                </div>

                {/* Right Side: Input and Status */}
                <div className="flex-1 flex flex-col gap-2 w-full">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Chave de API
                    </span>
                    <div
                      className="flex items-center gap-1.5 px-2 py-1 md:px-3 border rounded-full"
                      style={{
                        background: isConfigured ? "rgba(34, 197, 94, 0.1)" : "rgba(249, 115, 22, 0.1)",
                        borderColor: isConfigured ? "rgba(34, 197, 94, 0.2)" : "rgba(249, 115, 22, 0.2)",
                      }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: isConfigured ? "#22c55e" : "#f97316" }} />
                      <span className="text-[9px] md:text-[10px] font-bold" style={{ color: isConfigured ? "#4ade80" : "#fb923c" }}>
                        {isConfigured ? "CONFIGURADO" : "NÃO CONFIGURADO"}
                      </span>
                    </div>
                  </div>

                  <div className="relative">
                    <input
                      type="password"
                      placeholder={isConfigured ? "•••••••••••••••••••••••• (Configurado)" : "Insira a chave da API (sk-...)"}
                      value={keys[provider.id] || ""}
                      onChange={(e) => setKeys((prev) => ({ ...prev, [provider.id]: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-slate-50 text-sm outline-none transition-colors focus:border-violet-400/50"
                    />
                  </div>
                  <div className="text-right mt-1">
                    <a
                      href={provider.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] md:text-xs text-violet-400 no-underline hover:text-violet-300 transition-colors inline-flex items-center gap-1"
                    >
                      <span>Obter chave no {provider.name.split(" ")[0]}</span>
                      <FiExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end mt-4">
        <button
          onClick={handleSaveKeys}
          disabled={saving}
          className={`flex items-center justify-center gap-2 px-6 py-3 border-none rounded-xl text-white text-sm md:text-base font-bold transition-all w-full md:w-auto ${saving ? 'bg-violet-500/40 cursor-not-allowed shadow-none' : 'bg-gradient-to-br from-violet-400 to-violet-600 cursor-pointer shadow-[0_4px_20px_rgba(139,92,246,0.3)] hover:scale-[1.02]'}`}
        >
          {saving ? (
            <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
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
