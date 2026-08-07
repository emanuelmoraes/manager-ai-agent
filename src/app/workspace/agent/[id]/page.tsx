"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getAgentsFromFirebase, syncAgentsToFirebase } from "@/lib/firebase/sync";
import { Agent, AiProviderId } from "../../types";
import { ProviderConfig } from "../components/ProviderConfig";

export default function AgentConfigPage() {
  const router = useRouter();
  const params = useParams();
  const agentId = params.id as string;
  const isEditing = agentId !== "new";

  const [agents, setAgents] = useState<Agent[]>([]);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [icon, setIcon] = useState("🤖");
  const [color, setColor] = useState("#a78bfa");
  const [description, setDescription] = useState("");
  const [provider, setProvider] = useState<AiProviderId>("google");
  const [model, setModel] = useState("googleai/gemini-2.5-pro");
  const [temperature, setTemperature] = useState<number>(0.7);
  const [reasoningEffort, setReasoningEffort] = useState<"low" | "medium" | "high">("medium");
  const [mcpServers, setMcpServers] = useState<string[]>([]);
  const [availableMcpServers, setAvailableMcpServers] = useState<{ id: string; name?: string }[]>([]);
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load MCP Servers
    fetch("/api/settings/mcp")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAvailableMcpServers(data.data);
        }
      })
      .catch((err) => console.error("Error loading MCP servers", err));

    // Load Agents
    getAgentsFromFirebase().then((fAgents) => {
      setAgents(fAgents as Agent[]);
      if (isEditing) {
        const found = fAgents.find((a: any) => a.id === agentId);
        if (found) {
          setEditingAgent(found as Agent);
          setName(found.name);
          setRole(found.role);
          setIcon(found.icon);
          setColor(found.color);
          setDescription(found.description);
          setProvider(found.provider as AiProviderId);
          setModel(found.model);
          setTemperature(found.temperature ?? 0.7);
          setReasoningEffort(found.reasoningEffort ?? "medium");
          setMcpServers(found.mcpServers || []);
        } else {
          setFormError("Agente não encontrado.");
        }
      }
      setLoading(false);
    });
  }, [agentId, isEditing]);

  const handleSave = () => {
    if (!name.trim()) return setFormError("O nome do agente é obrigatório.");
    if (!role.trim()) return setFormError("A função do agente é obrigatória.");

    let updatedAgents = [...agents];

    if (isEditing && editingAgent) {
      const updatedAgent: Agent = {
        ...editingAgent,
        name: name.trim(),
        role: role.trim(),
        icon,
        color,
        description: description.trim() || "Sem descrição fornecida.",
        provider,
        model,
        temperature,
        reasoningEffort,
        mcpServers,
      };
      updatedAgents = agents.map((a) => (a.id === editingAgent.id ? updatedAgent : a));
    } else {
      const newAgent: Agent = {
        id: "agent_" + Math.random().toString(36).slice(2, 11),
        name: name.trim(),
        role: role.trim(),
        icon,
        color,
        description: description.trim() || "Sem descrição fornecida.",
        provider,
        model,
        temperature,
        reasoningEffort,
        mcpServers,
      };
      updatedAgents = [...agents, newAgent];
    }

    localStorage.setItem("manager_ai_agents", JSON.stringify(updatedAgents));
    syncAgentsToFirebase(updatedAgents);
    router.push("/workspace");
  };

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#03020a", color: "#fff" }}>
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[radial-gradient(ellipse_at_top_left,_#1a103c_0%,_#03020a_100%)] overflow-y-auto text-slate-50">
      <div className="max-w-5xl mx-auto w-full px-4 md:px-8 py-8 md:py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold m-0">
              {isEditing ? "Edit Agent" : "Create New Agent"}
            </h1>
            <p className="text-slate-400 mt-2 text-sm md:text-base">
              {isEditing
                ? "Modify the properties, instructions, and AI provider of this agent."
                : "Create a new custom agent to integrate into your workspace."}
            </p>
          </div>
          <button
            onClick={() => router.push("/workspace")}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-50 font-semibold cursor-pointer hover:bg-white/10 transition-colors w-full md:w-auto text-center"
          >
            ← Back to Workspace
          </button>
        </div>

        {formError && (
          <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm mb-6">
            {formError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-6">
            
            {/* General Information Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-6 flex flex-col gap-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-200 m-0 border-b border-white/5 pb-3">General Information</h2>
              
              {/* Name */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Coder, Designer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-slate-50 text-sm outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              {/* Role */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Role / Specialty *</label>
                <input
                  type="text"
                  placeholder="e.g. Development & Debugging"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-slate-50 text-sm outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              {/* Icon & Color */}
              <div className="flex flex-col sm:flex-row gap-6 mt-2">
                <div className="flex-1 flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Icon</label>
                  <div className="flex gap-2 flex-wrap">
                    {["🤖", "💻", "🎨", "🚀", "📊", "🔍", "✍️", "🛡️", "🔑"].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setIcon(emoji)}
                        className={`text-xl p-2 rounded-lg cursor-pointer transition-colors ${icon === emoji ? 'bg-violet-500/20 border-violet-500 border' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Color</label>
                  <div className="flex gap-3 flex-wrap">
                    {[
                      { name: "Violet", hex: "#a78bfa" },
                      { name: "Blue", hex: "#60a5fa" },
                      { name: "Green", hex: "#34d399" },
                      { name: "Orange", hex: "#fb923c" },
                      { name: "Pink", hex: "#f472b6" },
                      { name: "Cyan", hex: "#22d3ee" },
                    ].map((colorItem) => (
                      <button
                        key={colorItem.hex}
                        type="button"
                        onClick={() => setColor(colorItem.hex)}
                        className={`w-8 h-8 rounded-full cursor-pointer transition-all ${color === colorItem.hex ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1a103c]' : ''}`}
                        style={{ background: colorItem.hex }}
                        title={colorItem.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Configuration Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-6 flex flex-col gap-5 shadow-sm">
               <h2 className="text-lg font-bold text-slate-200 m-0 border-b border-white/5 pb-3">AI Configuration</h2>
               <div className="flex flex-col gap-4">
                 <ProviderConfig
                  provider={provider}
                  setProvider={setProvider}
                  model={model}
                  setModel={setModel}
                  temperature={temperature}
                  setTemperature={setTemperature}
                  reasoningEffort={reasoningEffort}
                  setReasoningEffort={setReasoningEffort}
                 />
               </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-6">
            
            {/* Behavior & Tools Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-6 flex flex-col gap-6 flex-1 shadow-sm">
               <h2 className="text-lg font-bold text-slate-200 m-0 border-b border-white/5 pb-3">Behavior & Tools</h2>
              
              {/* Description */}
              <div className="flex flex-col gap-2 flex-1 min-h-[250px]">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Instructions</label>
                <textarea
                  placeholder="Describe the rules and purpose of this agent..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="flex-1 w-full p-4 bg-white/5 border border-white/10 rounded-lg text-slate-50 text-sm outline-none resize-y font-inherit focus:border-violet-500 transition-colors"
                />
              </div>

              {/* MCP Servers */}
              <div className="flex flex-col gap-2 mt-auto">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">MCP Servers</label>
                {availableMcpServers.length === 0 ? (
                  <p className="text-slate-500 text-sm m-0 py-1">No MCP servers registered.</p>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto bg-black/20 border border-white/5 rounded-lg p-4">
                    {availableMcpServers.map((srv) => {
                      const isChecked = mcpServers.includes(srv.id);
                      return (
                        <label key={srv.id} className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setMcpServers(mcpServers.filter((id) => id !== srv.id));
                              } else {
                                setMcpServers([...mcpServers, srv.id]);
                              }
                            }}
                            className="cursor-pointer accent-violet-600 w-4 h-4 rounded"
                          />
                          <span className="truncate">{srv.name || srv.id}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            className="w-full md:w-auto px-8 py-3 bg-gradient-to-br from-violet-600 to-indigo-600 border-none rounded-lg text-white font-bold text-base cursor-pointer shadow-[0_4px_16px_rgba(124,58,237,0.3)] transition-transform active:scale-95"
          >
            {isEditing ? "Save Changes" : "Create Agent"}
          </button>
        </div>
      </div>
    </div>
  );
}
