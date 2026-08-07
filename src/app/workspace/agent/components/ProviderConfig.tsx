import React from "react";
import { AiProviderId } from "../../types";

interface ProviderConfigProps {
  provider: AiProviderId;
  setProvider: (v: AiProviderId) => void;
  model: string;
  setModel: (v: string) => void;
  temperature: number;
  setTemperature: (v: number) => void;
  reasoningEffort: "low" | "medium" | "high";
  setReasoningEffort: (v: "low" | "medium" | "high") => void;
}

export function ProviderConfig({
  provider,
  setProvider,
  model,
  setModel,
  temperature,
  setTemperature,
  reasoningEffort,
  setReasoningEffort,
}: ProviderConfigProps) {
  // Modelos de reasoning muitas vezes não suportam Temperature ou possuem interface dedicada para Effort.
  const isO1 = model.startsWith("o1") || model.startsWith("o3");
  const showReasoningEffort = isO1;
  const hideTemperature = isO1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* 1st Row: Provider & Model */}
      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Provider *</label>
          <select
            value={provider}
            onChange={(e) => {
              const prov = e.target.value as AiProviderId;
              setProvider(prov);
              if (prov === "google") setModel("googleai/gemini-2.5-pro");
              else if (prov === "openai") setModel("gpt-4o");
              else if (prov === "anthropic") setModel("claude-3-5-sonnet-20241022");
              else if (prov === "deepseek") setModel("deepseek-chat");
              else if (prov === "grok") setModel("grok-2-1212");
            }}
            style={{
              padding: "12px 16px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              color: "#f8fafc",
              fontSize: "0.95rem",
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
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Model *</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            style={{
              padding: "12px 16px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              color: "#f8fafc",
              fontSize: "0.95rem",
              outline: "none",
            }}
          >
            {provider === "google" && (
              <>
                <option value="googleai/gemini-2.5-pro" style={{ background: "#110c1c" }}>gemini-2.5-pro</option>
                <option value="googleai/gemini-2.5-flash" style={{ background: "#110c1c" }}>gemini-2.5-flash</option>
              </>
            )}
            {provider === "openai" && (
              <>
                <option value="gpt-4o" style={{ background: "#110c1c" }}>gpt-4o</option>
                <option value="gpt-4o-mini" style={{ background: "#110c1c" }}>gpt-4o-mini</option>
                <option value="o1-preview" style={{ background: "#110c1c" }}>o1-preview</option>
                <option value="o1-mini" style={{ background: "#110c1c" }}>o1-mini</option>
              </>
            )}
            {provider === "anthropic" && (
              <>
                <option value="claude-3-5-sonnet-20241022" style={{ background: "#110c1c" }}>claude-3-5-sonnet-20241022</option>
                <option value="claude-3-5-haiku-20241022" style={{ background: "#110c1c" }}>claude-3-5-haiku-20241022</option>
              </>
            )}
            {provider === "deepseek" && (
              <>
                <option value="deepseek-chat" style={{ background: "#110c1c" }}>deepseek-chat (V3)</option>
                <option value="deepseek-reasoner" style={{ background: "#110c1c" }}>deepseek-reasoner (R1)</option>
              </>
            )}
            {provider === "grok" && (
              <>
                <option value="grok-2-1212" style={{ background: "#110c1c" }}>grok-2-1212</option>
                <option value="grok-beta" style={{ background: "#110c1c" }}>grok-beta</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* 2nd Row: Advanced Configs */}
      <div style={{ display: "flex", gap: 16 }}>
        {!hideTemperature && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Temperature</label>
              <span style={{ fontSize: "0.85rem", color: "#f8fafc", background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: 4 }}>
                {temperature.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              style={{
                accentColor: "#7c3aed",
                width: "100%",
                marginTop: 6,
              }}
            />
            <p style={{ fontSize: "0.7rem", color: "#64748b", margin: 0 }}>
              0 = Analytical/Precise, 2 = Creative/Random
            </p>
          </div>
        )}

        {showReasoningEffort && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Reasoning Effort</label>
            <select
              value={reasoningEffort}
              onChange={(e) => setReasoningEffort(e.target.value as "low" | "medium" | "high")}
              style={{
                padding: "12px 16px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                color: "#f8fafc",
                fontSize: "0.95rem",
                outline: "none",
              }}
            >
              <option value="low" style={{ background: "#110c1c" }}>Low</option>
              <option value="medium" style={{ background: "#110c1c" }}>Medium</option>
              <option value="high" style={{ background: "#110c1c" }}>High</option>
            </select>
            <p style={{ fontSize: "0.7rem", color: "#64748b", margin: 0 }}>
              Controls the amount of 'thinking' time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
