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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "radial-gradient(ellipse at top left, #1a103c 0%, #03020a 100%)",
        overflowY: "auto",
        color: "#f8fafc",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px", width: "100%" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>
              {isEditing ? "Edit Agent" : "Create New Agent"}
            </h1>
            <p style={{ color: "#94a3b8", marginTop: 8 }}>
              {isEditing
                ? "Modify the properties, instructions, and AI provider of this agent."
                : "Create a new custom agent to integrate into your workspace."}
            </p>
          </div>
          <button
            onClick={() => router.push("/workspace")}
            style={{
              padding: "8px 16px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              color: "#f8fafc",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            ← Back to Workspace
          </button>
        </div>

        {formError && (
          <div
            style={{
              padding: "12px 16px",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 8,
              color: "#f87171",
              fontSize: "0.9rem",
              marginBottom: 24,
            }}
          >
            {formError}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 32 }}>
          {/* LEFT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Name */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Name *</label>
              <input
                type="text"
                placeholder="e.g. Coder, Designer"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  padding: "12px 16px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8,
                  color: "#f8fafc",
                  fontSize: "0.95rem",
                  outline: "none",
                }}
              />
            </div>

            {/* Role */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Role / Specialty *</label>
              <input
                type="text"
                placeholder="e.g. Development & Debugging"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{
                  padding: "12px 16px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8,
                  color: "#f8fafc",
                  fontSize: "0.95rem",
                  outline: "none",
                }}
              />
            </div>

            {/* Provider & Model */}
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

            {/* Icon & Color */}
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Icon</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {["🤖", "💻", "🎨", "🚀", "📊", "🔍", "✍️", "🛡️", "🔑"].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setIcon(emoji)}
                      style={{
                        fontSize: "1.4rem",
                        padding: "8px 12px",
                        background: icon === emoji ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${icon === emoji ? "#7c3aed" : "rgba(255,255,255,0.08)"}`,
                        borderRadius: 8,
                        cursor: "pointer",
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Color</label>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
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
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: colorItem.hex,
                        border: color === colorItem.hex ? "3px solid #ffffff" : "3px solid transparent",
                        cursor: "pointer",
                      }}
                      title={colorItem.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Description */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Instructions</label>
              <textarea
                placeholder="Describe the rules and purpose of this agent..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  flex: 1,
                  minHeight: 180,
                  padding: "12px 16px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8,
                  color: "#f8fafc",
                  fontSize: "0.95rem",
                  outline: "none",
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {/* MCP Servers */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>MCP Servers</label>
              {availableMcpServers.length === 0 ? (
                <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "4px 0" }}>No MCP servers registered.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 200, overflowY: "auto", background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: 8, padding: 16 }}>
                  {availableMcpServers.map((srv) => {
                    const isChecked = mcpServers.includes(srv.id);
                    return (
                      <label key={srv.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.9rem", color: "#e2e8f0", cursor: "pointer" }}>
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
                          style={{ cursor: "pointer", accentColor: "#7c3aed", width: 16, height: 16 }}
                        />
                        <span>{srv.name || srv.id}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ marginTop: 40, display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={handleSave}
            style={{
              padding: "12px 24px",
              background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
              border: "none",
              borderRadius: 8,
              color: "white",
              fontSize: "1rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(124,58,237,0.3)",
              transition: "transform 0.1s ease",
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            {isEditing ? "Save Changes" : "Create Agent"}
          </button>
        </div>
      </div>
    </div>
  );
}
