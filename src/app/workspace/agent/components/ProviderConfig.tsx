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
    <div className="flex flex-col gap-4">
      {/* 1st Row: Provider & Model */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Provider *</label>
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
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-slate-50 text-sm outline-none focus:border-violet-500 transition-colors"
          >
            <option value="google" className="bg-[#110c1c]">Google Gemini</option>
            <option value="openai" className="bg-[#110c1c]">OpenAI</option>
            <option value="anthropic" className="bg-[#110c1c]">Anthropic</option>
            <option value="deepseek" className="bg-[#110c1c]">DeepSeek</option>
            <option value="grok" className="bg-[#110c1c]">Grok (xAI)</option>
          </select>
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Model *</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-slate-50 text-sm outline-none focus:border-violet-500 transition-colors"
          >
            {provider === "google" && (
              <>
                <option value="googleai/gemini-2.5-pro" className="bg-[#110c1c]">gemini-2.5-pro</option>
                <option value="googleai/gemini-2.5-flash" className="bg-[#110c1c]">gemini-2.5-flash</option>
              </>
            )}
            {provider === "openai" && (
              <>
                <option value="gpt-4o" className="bg-[#110c1c]">gpt-4o</option>
                <option value="gpt-4o-mini" className="bg-[#110c1c]">gpt-4o-mini</option>
                <option value="o1-preview" className="bg-[#110c1c]">o1-preview</option>
                <option value="o1-mini" className="bg-[#110c1c]">o1-mini</option>
              </>
            )}
            {provider === "anthropic" && (
              <>
                <option value="claude-3-5-sonnet-20241022" className="bg-[#110c1c]">claude-3-5-sonnet-20241022</option>
                <option value="claude-3-5-haiku-20241022" className="bg-[#110c1c]">claude-3-5-haiku-20241022</option>
              </>
            )}
            {provider === "deepseek" && (
              <>
                <option value="deepseek-chat" className="bg-[#110c1c]">deepseek-chat (V3)</option>
                <option value="deepseek-reasoner" className="bg-[#110c1c]">deepseek-reasoner (R1)</option>
              </>
            )}
            {provider === "grok" && (
              <>
                <option value="grok-2-1212" className="bg-[#110c1c]">grok-2-1212</option>
                <option value="grok-beta" className="bg-[#110c1c]">grok-beta</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* 2nd Row: Advanced Configs */}
      <div className="flex flex-col sm:flex-row gap-4">
        {!hideTemperature && (
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Temperature</label>
              <span className="text-xs text-slate-50 bg-white/10 px-2 py-0.5 rounded">
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
              className="w-full mt-1 accent-violet-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 m-0">
              0 = Analytical/Precise, 2 = Creative/Random
            </p>
          </div>
        )}

        {showReasoningEffort && (
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reasoning Effort</label>
            <select
              value={reasoningEffort}
              onChange={(e) => setReasoningEffort(e.target.value as "low" | "medium" | "high")}
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-slate-50 text-sm outline-none focus:border-violet-500 transition-colors"
            >
              <option value="low" className="bg-[#110c1c]">Low</option>
              <option value="medium" className="bg-[#110c1c]">Medium</option>
              <option value="high" className="bg-[#110c1c]">High</option>
            </select>
            <p className="text-[11px] text-slate-500 m-0">
              Controls the amount of 'thinking' time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
