"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

/* ─── Types ─────────────────────────────────────────────────── */
type AgentStatus = "idle" | "running" | "done" | "error";
type TabId = "task" | "pipeline" | "history" | "chat";
type LogType = "info" | "success" | "system";

interface ChatMessage {
  role: "user" | "model";
  content: string;
  timestamp: string;
}

interface LogEntry {
  id: string;
  agentId: string;
  message: string;
  timestamp: Date;
  type: LogType;
}

interface Agent {
  id: string;
  name: string;
  role: string;
  icon: string;
  color: string;
  description: string;
  provider: "google" | "openai" | "anthropic";
  model: string;
}

/* ─── Constants ──────────────────────────────────────────────── */
const AGENTS: Agent[] = [];

const MOCK_HISTORY = [
  {
    id: "h1",
    task: "Analise as principais tendências de IA generativa para 2026 e seus impactos no mercado.",
    status: "done",
    duration: "14.2s",
    date: "22/06/2026 18:43",
    agents: 5,
    tokens: 4_821,
  },
  {
    id: "h2",
    task: "Gere um relatório executivo sobre automação e seus efeitos no setor de tecnologia.",
    status: "done",
    duration: "11.8s",
    date: "22/06/2026 14:17",
    agents: 4,
    tokens: 3_204,
  },
  {
    id: "h3",
    task: "Pesquise melhores práticas de segurança para sistemas de IA em ambiente de produção.",
    status: "error",
    duration: "6.3s",
    date: "21/06/2026 09:05",
    agents: 3,
    tokens: 1_098,
  },
  {
    id: "h4",
    task: "Crie um plano de implementação de MLOps para uma startup de fintech.",
    status: "done",
    duration: "17.5s",
    date: "20/06/2026 22:11",
    agents: 5,
    tokens: 6_530,
  },
];

const SIMULATION: Array<{
  agentId: string;
  parallel?: string[];
  messages: Array<{ text: string; type: LogType; delay: number }>;
}> = [
  {
    agentId: "orchestrator",
    messages: [
      { text: "Analisando a tarefa recebida e definindo escopo de trabalho.", type: "info", delay: 400 },
      { text: "Estratégia: execução paralela de Researcher e Analyst.", type: "info", delay: 700 },
      { text: "Delegando sub-tarefas e iniciando pipeline.", type: "success", delay: 500 },
    ],
  },
  {
    agentId: "researcher",
    parallel: ["analyst"],
    messages: [
      { text: "Iniciando coleta de dados e fontes relevantes...", type: "info", delay: 300 },
      { text: "Consultando base de conhecimento interna.", type: "info", delay: 900 },
      { text: "14 fontes consolidadas. Dados prontos.", type: "success", delay: 700 },
    ],
  },
  {
    agentId: "analyst",
    messages: [
      { text: "Processando dataset recebido do Orchestrator.", type: "info", delay: 500 },
      { text: "Identificando 4 padrões e 2 anomalias relevantes.", type: "info", delay: 1000 },
      { text: "Análise concluída. Insights enviados ao Writer.", type: "success", delay: 600 },
    ],
  },
  {
    agentId: "writer",
    messages: [
      { text: "Recebendo contexto consolidado de Researcher e Analyst.", type: "info", delay: 300 },
      { text: "Estruturando resposta em formato otimizado.", type: "info", delay: 1100 },
      { text: "Conteúdo gerado com 97% de confiança.", type: "success", delay: 800 },
    ],
  },
  {
    agentId: "reviewer",
    messages: [
      { text: "Validando output do Writer...", type: "info", delay: 350 },
      { text: "Verificando consistência factual e tom.", type: "info", delay: 750 },
      { text: "✓ Resultado aprovado. Qualidade: excelente.", type: "success", delay: 500 },
    ],
  },
];

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/* ─── Helper: default agent IDs ──────────────────────────────── */
const DEFAULT_AGENT_IDS = ["orchestrator", "researcher", "analyst", "writer", "reviewer"];

/* ─── Status helpers ─────────────────────────────────────────── */
const statusColor: Record<AgentStatus, string> = {
  idle: "#475569",
  running: "#f59e0b",
  done: "#22c55e",
  error: "#ef4444",
};

const statusLabel: Record<AgentStatus, string> = {
  idle: "Aguardando",
  running: "Executando",
  done: "Concluído",
  error: "Erro",
};

/* ─── Pipeline Node Component ────────────────────────────────── */
function PipelineNode({
  agent,
  status,
  isSelected,
  onClick,
}: {
  agent: Agent;
  status: AgentStatus;
  isSelected: boolean;
  onClick: () => void;
}) {
  const isRunning = status === "running";
  const isDone = status === "done";

  return (
    <button
      onClick={onClick}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        padding: "16px 20px",
        minWidth: 130,
        background: isSelected
          ? `rgba(${agent.color === "#a78bfa" ? "167,139,250" : agent.color === "#60a5fa" ? "96,165,250" : agent.color === "#34d399" ? "52,211,153" : agent.color === "#fb923c" ? "251,146,60" : "244,114,182"},0.12)`
          : isDone
          ? "rgba(34,197,94,0.06)"
          : isRunning
          ? "rgba(245,158,11,0.08)"
          : "rgba(255,255,255,0.03)",
        border: `1px solid ${
          isSelected
            ? agent.color
            : isDone
            ? "rgba(34,197,94,0.3)"
            : isRunning
            ? "rgba(245,158,11,0.5)"
            : "rgba(255,255,255,0.08)"
        }`,
        borderRadius: 16,
        cursor: "pointer",
        transition: "all 0.25s ease",
        boxShadow: isRunning
          ? `0 0 20px ${statusColor.running}33`
          : isSelected
          ? `0 0 20px ${agent.color}33`
          : "none",
      }}
    >
      {/* Pulse ring when running */}
      {isRunning && (
        <div
          style={{
            position: "absolute",
            inset: -4,
            borderRadius: 20,
            border: "1.5px solid rgba(245,158,11,0.4)",
            animation: "ping 1.2s ease-in-out infinite",
          }}
        />
      )}

      {/* Icon */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: isDone
            ? "rgba(34,197,94,0.15)"
            : `${agent.color}1a`,
          border: `1px solid ${isDone ? "rgba(34,197,94,0.3)" : `${agent.color}33`}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          transition: "all 0.25s",
        }}
      >
        {isDone ? "✓" : agent.icon}
      </div>

      {/* Name */}
      <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#e2e8f0" }}>
        {agent.name}
      </div>

      {/* Status pill */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "2px 10px",
          borderRadius: 100,
          background: `${statusColor[status]}15`,
          border: `1px solid ${statusColor[status]}30`,
        }}
      >
        <div
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: statusColor[status],
            boxShadow: isRunning ? `0 0 6px ${statusColor[status]}` : "none",
            animation: isRunning ? "pulse-dot 1.2s infinite" : "none",
          }}
        />
        <span
          style={{
            fontSize: "0.65rem",
            fontWeight: 600,
            color: statusColor[status],
            letterSpacing: "0.05em",
          }}
        >
          {statusLabel[status]}
        </span>
      </div>
    </button>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function WorkspacePage() {
  const [activeTab, setActiveTab] = useState<TabId>("task");
  const [taskInput, setTaskInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatus>>({});
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [totalTokens] = useState<number>(0);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);

  const [agents, setAgents] = useState<Agent[]>(AGENTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  // Form states for agent (create/edit)
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentRole, setNewAgentRole] = useState("");
  const [newAgentIcon, setNewAgentIcon] = useState("🤖");
  const [newAgentColor, setNewAgentColor] = useState("#a78bfa");
  const [newAgentDescription, setNewAgentDescription] = useState("");
  const [newAgentProvider, setNewAgentProvider] = useState<"google" | "openai" | "anthropic">("google");
  const [newAgentModel, setNewAgentModel] = useState("googleai/gemini-1.5-pro");
  const [formError, setFormError] = useState("");

  // Pipeline state
  const [pipeline, setPipeline] = useState<string[]>([]);
  const [pipelineSelectId, setPipelineSelectId] = useState("");

  // Chat states
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({});
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const getAgent = (id: string) => agents.find((a) => a.id === id);

  // Load agents and pipeline from local storage
  useEffect(() => {
    const savedAgents = localStorage.getItem("manager_ai_agents");
    if (savedAgents) {
      try {
        const parsed = JSON.parse(savedAgents);
        if (Array.isArray(parsed)) {
          const validated = parsed.map((agent: any) => ({
            ...agent,
            provider: agent.provider || "google",
            model: agent.model || "googleai/gemini-2.5-pro",
          }));
          setAgents(validated);
        }
      } catch (e) {
        console.error("Error loading agents from local storage", e);
      }
    }

    const savedPipeline = localStorage.getItem("manager_ai_active_pipeline");
    if (savedPipeline) {
      try {
        const parsed = JSON.parse(savedPipeline);
        if (Array.isArray(parsed)) {
          setPipeline(parsed);
        }
      } catch (e) {
        console.error("Error loading pipeline from local storage", e);
      }
    }

    // Load chat histories
    try {
      const chats: Record<string, ChatMessage[]> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("manager_ai_chat_history_")) {
          const agentId = key.replace("manager_ai_chat_history_", "");
          const savedChat = localStorage.getItem(key);
          if (savedChat) {
            chats[agentId] = JSON.parse(savedChat);
          }
        }
      }
      setChatMessages(chats);
    } catch (e) {
      console.error("Error loading chat histories", e);
    }
  }, []);

  const handleCreateAgent = () => {
    if (!newAgentName.trim()) {
      setFormError("O nome do agente é obrigatório.");
      return;
    }
    if (!newAgentRole.trim()) {
      setFormError("A função/especialidade do agente é obrigatória.");
      return;
    }

    const newAgent: Agent = {
      id: "agent_" + Math.random().toString(36).slice(2, 11),
      name: newAgentName.trim(),
      role: newAgentRole.trim(),
      icon: newAgentIcon,
      color: newAgentColor,
      description: newAgentDescription.trim() || "Sem descrição fornecida.",
      provider: newAgentProvider,
      model: newAgentModel,
    };

    const updatedAgents = [...agents, newAgent];
    setAgents(updatedAgents);
    localStorage.setItem("manager_ai_agents", JSON.stringify(updatedAgents));

    // Clear form states & close modal
    setNewAgentName("");
    setNewAgentRole("");
    setNewAgentIcon("🤖");
    setNewAgentColor("#a78bfa");
    setNewAgentDescription("");
    setNewAgentProvider("google");
    setNewAgentModel("googleai/gemini-2.5-pro");
    setFormError("");
    setIsModalOpen(false);
  };

  const handleEditAgent = () => {
    if (!newAgentName.trim()) {
      setFormError("O nome do agente é obrigatório.");
      return;
    }
    if (!newAgentRole.trim()) {
      setFormError("A função/especialidade do agente é obrigatória.");
      return;
    }
    if (!editingAgent) return;

    const updatedAgent: Agent = {
      ...editingAgent,
      name: newAgentName.trim(),
      role: newAgentRole.trim(),
      icon: newAgentIcon,
      color: newAgentColor,
      description: newAgentDescription.trim() || "Sem descrição fornecida.",
      provider: newAgentProvider,
      model: newAgentModel,
    };

    const updatedAgents = agents.map((a) => (a.id === editingAgent.id ? updatedAgent : a));
    setAgents(updatedAgents);
    localStorage.setItem("manager_ai_agents", JSON.stringify(updatedAgents));

    // Reset editing state and close modal
    setEditingAgent(null);
    setNewAgentName("");
    setNewAgentRole("");
    setNewAgentIcon("🤖");
    setNewAgentColor("#a78bfa");
    setNewAgentDescription("");
    setNewAgentProvider("google");
    setNewAgentModel("googleai/gemini-2.5-pro");
    setFormError("");
    setIsModalOpen(false);
  };

  const handleDeleteAgent = (id: string) => {
    if (window.confirm("Deseja realmente excluir este agente?")) {
      const updatedAgents = agents.filter((a) => a.id !== id);
      setAgents(updatedAgents);
      localStorage.setItem("manager_ai_agents", JSON.stringify(updatedAgents));

      // Remove from pipeline too
      const updatedPipeline = pipeline.filter((pid) => pid !== id);
      setPipeline(updatedPipeline);
      localStorage.setItem("manager_ai_active_pipeline", JSON.stringify(updatedPipeline));

      // Remove chat history
      localStorage.removeItem(`manager_ai_chat_history_${id}`);
      const updatedChats = { ...chatMessages };
      delete updatedChats[id];
      setChatMessages(updatedChats);

      if (selectedAgent === id) {
        setSelectedAgent(null);
      }
    }
  };

  const openEditModal = (agent: Agent) => {
    setEditingAgent(agent);
    setNewAgentName(agent.name);
    setNewAgentRole(agent.role);
    setNewAgentIcon(agent.icon);
    setNewAgentColor(agent.color);
    setNewAgentDescription(agent.description);
    setNewAgentProvider(agent.provider);
    setNewAgentModel(agent.model);
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingAgent(null);
    setNewAgentName("");
    setNewAgentRole("");
    setNewAgentIcon("🤖");
    setNewAgentColor("#a78bfa");
    setNewAgentDescription("");
    setNewAgentProvider("google");
    setNewAgentModel("googleai/gemini-1.5-pro");
    setFormError("");
    setIsModalOpen(false);
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading || !selectedAgent) return;

    const agent = getAgent(selectedAgent);
    if (!agent) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    };

    const currentHistory = chatMessages[selectedAgent] || [];
    const updatedHistory = [...currentHistory, userMsg];

    setChatMessages(prev => ({
      ...prev,
      [selectedAgent]: updatedHistory
    }));
    localStorage.setItem(`manager_ai_chat_history_${selectedAgent}`, JSON.stringify(updatedHistory));
    setChatInput("");
    setChatLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          systemPrompt: `Você é o agente '${agent.name}'. Especialidade: '${agent.role}'. Descrição: '${agent.description}'`,
          provider: agent.provider,
          model: agent.model
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Falha na resposta do agente.');
      }

      const data = await response.json();
      const modelMsg: ChatMessage = {
        role: "model",
        content: data.response,
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      };

      const finalHistory = [...updatedHistory, modelMsg];
      setChatMessages(prev => ({
        ...prev,
        [selectedAgent]: finalHistory
      }));
      localStorage.setItem(`manager_ai_chat_history_${selectedAgent}`, JSON.stringify(finalHistory));

    } catch (e: any) {
      console.error(e);
      const errorMsg: ChatMessage = {
        role: "model",
        content: `[Erro ao comunicar com o agente: ${e.message}]`,
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      };
      const finalHistory = [...updatedHistory, errorMsg];
      setChatMessages(prev => ({
        ...prev,
        [selectedAgent]: finalHistory
      }));
      localStorage.setItem(`manager_ai_chat_history_${selectedAgent}`, JSON.stringify(finalHistory));
    } finally {
      setChatLoading(false);
    }
  };

  const handleClearChatHistory = (agentId: string) => {
    if (window.confirm("Deseja realmente limpar o histórico de conversas com este agente?")) {
      localStorage.removeItem(`manager_ai_chat_history_${agentId}`);
      setChatMessages(prev => {
        const copy = { ...prev };
        delete copy[agentId];
        return copy;
      });
    }
  };

  const handleAddToPipeline = (agentId: string) => {
    if (!agentId) return;
    const updated = [...pipeline, agentId];
    setPipeline(updated);
    localStorage.setItem("manager_ai_active_pipeline", JSON.stringify(updated));
    setPipelineSelectId("");
  };

  const handleRemoveFromPipeline = (index: number) => {
    const updated = pipeline.filter((_, i) => i !== index);
    setPipeline(updated);
    localStorage.setItem("manager_ai_active_pipeline", JSON.stringify(updated));
  };

  const handleMovePipelineItem = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === pipeline.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...pipeline];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    setPipeline(updated);
    localStorage.setItem("manager_ai_active_pipeline", JSON.stringify(updated));
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = useCallback((entry: Omit<LogEntry, "id">) => {
    setLogs((prev) => [...prev, { ...entry, id: Math.random().toString(36).slice(2) }]);
  }, []);

  const executeWorkflow = async () => {
    if (!taskInput.trim() || isRunning) return;
    if (pipeline.length === 0) {
      alert("Por favor, adicione pelo menos um agente ao seu pipeline na aba 'Pipeline' antes de executar.");
      return;
    }
    setIsRunning(true);
    setLogs([]);
    setAgentStatuses({});
    setExecutionTime(null);
    startTimeRef.current = Date.now();
    setActiveTab("task");

    addLog({
      agentId: "system",
      message: `Pipeline iniciado → "${taskInput.slice(0, 72)}${taskInput.length > 72 ? "…" : ""}"`,
      timestamp: new Date(),
      type: "system",
    });

    try {
      const pipelineAgents = pipeline.map(id => getAgent(id)).filter(Boolean) as Agent[];
      const response = await fetch('/api/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: taskInput, pipelineAgents }),
      });

      if (!response.ok) {
        throw new Error('Falha ao iniciar o pipeline.');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunkText = decoder.decode(value, { stream: true });
          const events = chunkText.split('\n\n').filter(Boolean);

          for (const ev of events) {
            if (ev.startsWith('data: ')) {
              try {
                const data = JSON.parse(ev.slice(6));
                
                if (data.status) {
                  setAgentStatuses(p => ({ ...p, [data.agentId]: data.status }));
                }
                if (data.log) {
                  addLog({ agentId: data.agentId, message: data.log.message, timestamp: new Date(), type: data.log.type });
                }
                if (data.result) {
                  // Output saved or printed
                  addLog({ agentId: 'system', message: 'Resultado final recebido com sucesso.', timestamp: new Date(), type: 'success' });
                }
                if (data.error) {
                  throw new Error(data.error);
                }
              } catch (e) {
                console.error('Error parsing SSE:', e);
              }
            }
          }
        }
      }

      const elapsed = parseFloat(((Date.now() - startTimeRef.current) / 1000).toFixed(1));
      setExecutionTime(elapsed);
      addLog({
        agentId: "system",
        message: `Pipeline concluído em ${elapsed}s — todos os agentes finalizaram com sucesso.`,
        timestamp: new Date(),
        type: "success",
      });

    } catch (error: any) {
      addLog({ agentId: "system", message: `Erro: ${error.message}`, timestamp: new Date(), type: "error" as LogType });
    } finally {
      setIsRunning(false);
    }
  };

  const resetWorkspace = () => {
    if (isRunning) return;
    setLogs([]);
    setAgentStatuses({});
    setExecutionTime(null);
  };

  const completedCount = Object.values(agentStatuses).filter((s) => s === "done").length;
  const progress = pipeline.length > 0 ? (completedCount / pipeline.length) * 100 : 0;
  const allDone = executionTime !== null;

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <>
      {/* Inline keyframes */}
      <style>{`
        @keyframes ping {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes spin-slow {
          to { transform: rotate(360deg); }
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes flow-dash {
          to { stroke-dashoffset: -20; }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-up {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .log-entry { animation: slide-in 0.25s ease forwards; }
        .tab-active-underline {
          position: absolute;
          bottom: -1px;
          left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, #7c3aed, #a78bfa);
          border-radius: 2px;
        }
      `}</style>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          background: "var(--background)",
          overflow: "hidden",
        }}
      >
        {/* ═══ HEADER ════════════════════════════════════════════ */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            height: 56,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(3,2,10,0.8)",
            backdropFilter: "blur(12px)",
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          {/* Left: breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: "#64748b",
                textDecoration: "none",
                fontSize: "0.8rem",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#a78bfa")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M5 12L11 6M5 12L11 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Home
            </Link>
            <span style={{ color: "#334155", fontSize: "0.8rem" }}>/</span>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#e2e8f0" }}>Workspace</span>
          </div>

          {/* Center: title */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
              }}
            >
              🎯
            </div>
            <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#e2e8f0", letterSpacing: "-0.01em" }}>
              Manager<span style={{ color: "#a78bfa" }}>AI</span> — Workspace
            </span>
            {isRunning && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "3px 10px",
                  background: "rgba(245,158,11,0.12)",
                  border: "1px solid rgba(245,158,11,0.3)",
                  borderRadius: 100,
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: "#f59e0b",
                  letterSpacing: "0.05em",
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#f59e0b",
                    animation: "pulse-dot 1s infinite",
                  }}
                />
                EXECUTANDO
              </div>
            )}
          </div>

          {/* Right: controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Progress indicator */}
            {(isRunning || allDone) && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 8 }}>
                <div
                  style={{
                    width: 100,
                    height: 4,
                    background: "rgba(255,255,255,0.08)",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${progress}%`,
                      background: allDone
                        ? "linear-gradient(90deg,#22c55e,#4ade80)"
                        : "linear-gradient(90deg,#7c3aed,#a78bfa)",
                      borderRadius: 2,
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
                <span style={{ fontSize: "0.7rem", color: "#64748b" }}>
                  {completedCount}/{pipeline.length}
                </span>
              </div>
            )}

            {/* Reset */}
            <button
              onClick={resetWorkspace}
              disabled={isRunning}
              title="Limpar workspace"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                color: isRunning ? "#334155" : "#64748b",
                fontSize: "0.75rem",
                cursor: isRunning ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { if (!isRunning) e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 3v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Limpar
            </button>

            {/* Settings */}
            <Link
              href="/settings"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                color: "#64748b",
                fontSize: "0.75rem",
                textDecoration: "none",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "#a78bfa"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#64748b"; }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Configurações
            </Link>
          </div>
        </header>

        {/* ═══ BODY ══════════════════════════════════════════════ */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* ── SIDEBAR: Agents ────────────────────────────────── */}
          <aside
            style={{
              width: 260,
              flexShrink: 0,
              borderRight: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Sidebar header */}
            <div
              style={{
                padding: "16px 16px 12px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Agentes
                </span>
                <span
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 600,
                    padding: "2px 8px",
                    background: "rgba(124,58,237,0.15)",
                    border: "1px solid rgba(124,58,237,0.3)",
                    borderRadius: 100,
                    color: "#a78bfa",
                  }}
                >
                  {agents.length} ativos
                </span>
              </div>
            </div>

            {/* Agent list */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
              {agents.length === 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    padding: "20px",
                    textAlign: "center",
                    opacity: 0.5,
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: "2rem" }}>🤖</span>
                  <p style={{ fontSize: "0.75rem", color: "#64748b", margin: 0 }}>
                    Nenhum agente criado ainda. Crie seu primeiro agente abaixo.
                  </p>
                </div>
              ) : (
                agents.map((agent) => {
                  const status: AgentStatus = agentStatuses[agent.id] || "idle";
                  const isSelected = selectedAgent === agent.id;
                  const isRunningState = status === "running";
                  const isDone = status === "done";

                  return (
                    <button
                      key={agent.id}
                      onClick={() => setSelectedAgent(isSelected ? null : agent.id)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 12px",
                        borderRadius: 12,
                        border: `1px solid ${isSelected ? agent.color + "50" : "transparent"}`,
                        background: isSelected
                          ? `${agent.color}0d`
                          : isRunningState
                          ? "rgba(245,158,11,0.06)"
                          : "transparent",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.2s ease",
                        marginBottom: 2,
                        boxShadow: isRunningState
                          ? `0 0 12px ${statusColor.running}20`
                          : "none",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = isRunningState ? "rgba(245,158,11,0.06)" : "transparent";
                      }}
                    >
                      {/* Agent icon */}
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: isDone ? "rgba(34,197,94,0.12)" : `${agent.color}1a`,
                          border: `1px solid ${isDone ? "rgba(34,197,94,0.25)" : agent.color + "30"}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 17,
                          flexShrink: 0,
                          transition: "all 0.2s",
                          position: "relative",
                        }}
                      >
                        {isDone ? "✓" : agent.icon}
                        {/* Running pulse */}
                        {isRunningState && (
                          <div
                            style={{
                              position: "absolute",
                              inset: -3,
                              borderRadius: 13,
                              border: `1.5px solid ${statusColor.running}`,
                              animation: "ping 1s ease-in-out infinite",
                            }}
                          />
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#e2e8f0", marginBottom: 2 }}>
                          {agent.name}
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {agent.role}
                        </div>
                      </div>

                      {/* Status dot */}
                      <div
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: statusColor[status],
                          flexShrink: 0,
                          boxShadow: isRunningState ? `0 0 6px ${statusColor[status]}` : "none",
                          animation: isRunningState ? "pulse-dot 1s infinite" : "none",
                        }}
                      />
                    </button>
                  );
                })
              )}
            </div>

            {/* Selected agent detail */}
            {selectedAgent && (() => {
              const ag = getAgent(selectedAgent);
              if (!ag) return null;
              const st: AgentStatus = agentStatuses[selectedAgent] || "idle";
              return (
                <div
                  style={{
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    padding: 16,
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 20 }}>{ag.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: 700, color: ag.color }}>{ag.name}</div>
                      <div style={{ fontSize: "0.65rem", color: "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ag.role}</div>
                    </div>
                  </div>

                  {/* Provider & Model badge */}
                  <div style={{ marginBottom: 10, fontSize: "0.65rem", color: "#64748b" }}>
                    <span style={{ color: "#475569" }}>Config:</span> {(ag.provider || 'google').toUpperCase()} ({(ag.model || 'googleai/gemini-2.5-pro').replace('googleai/', '')})
                  </div>

                  <p style={{ fontSize: "0.72rem", color: "#64748b", lineHeight: 1.6, marginBottom: 12, maxHeight: 80, overflowY: "auto" }}>
                    {ag.description}
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {/* Status indicator + Chat button */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "5px 10px",
                          borderRadius: 8,
                          background: `${statusColor[st]}12`,
                          border: `1px solid ${statusColor[st]}25`,
                        }}
                      >
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor[st] }} />
                        <span style={{ fontSize: "0.7rem", fontWeight: 600, color: statusColor[st] }}>
                          {statusLabel[st]}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setActiveTab("chat");
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "6px 12px",
                          borderRadius: 8,
                          border: "1px solid rgba(124,58,237,0.25)",
                          background: "rgba(124,58,237,0.1)",
                          color: "#a78bfa",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(124,58,237,0.2)";
                          e.currentTarget.style.borderColor = "rgba(124,58,237,0.4)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(124,58,237,0.1)";
                          e.currentTarget.style.borderColor = "rgba(124,58,237,0.25)";
                        }}
                      >
                        💬 Conversar
                      </button>
                    </div>

                    {/* Edit & Delete row */}
                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      <button
                        onClick={() => openEditModal(ag)}
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          padding: "6px 10px",
                          borderRadius: 8,
                          border: "1px solid rgba(255,255,255,0.08)",
                          background: "rgba(255,255,255,0.03)",
                          color: "#94a3b8",
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                          e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                          e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                        }}
                      >
                        📝 Editar
                      </button>

                      <button
                        onClick={() => handleDeleteAgent(ag.id)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 8,
                          border: "1px solid rgba(239,68,68,0.2)",
                          background: "rgba(239,68,68,0.06)",
                          color: "#f87171",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        title="Excluir agente"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(239,68,68,0.12)";
                          e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(239,68,68,0.06)";
                          e.currentTarget.style.borderColor = "rgba(239,68,68,0.2)";
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Sidebar footer */}
            <div
              style={{
                borderTop: "1px solid rgba(255,255,255,0.05)",
                padding: 12,
              }}
            >
              <button
                onClick={() => {
                  setIsModalOpen(true);
                  setFormError("");
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "8px",
                  borderRadius: 10,
                  border: "1px dashed rgba(124,58,237,0.25)",
                  background: "transparent",
                  color: "#64748b",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)";
                  e.currentTarget.style.color = "#a78bfa";
                  e.currentTarget.style.background = "rgba(124,58,237,0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(124,58,237,0.25)";
                  e.currentTarget.style.color = "#64748b";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Adicionar Agente
              </button>
            </div>
          </aside>

          {/* ── MAIN PANEL ─────────────────────────────────────── */}
          <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

            {/* Tabs */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 0,
                padding: "0 24px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                height: 44,
                flexShrink: 0,
              }}
            >
              {(
                [
                  { id: "task", label: "Tarefa", icon: "📝" },
                  { id: "pipeline", label: "Pipeline", icon: "🔗" },
                  { id: "history", label: "Histórico", icon: "🕐" },
                  ...(selectedAgent ? [{ id: "chat" as TabId, label: `Conversar`, icon: "💬" }] : [])
                ] as { id: TabId; label: string; icon: string }[]
              ).map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "0 16px",
                      height: "100%",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? "#e2e8f0" : "#475569",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = "#94a3b8"; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = "#475569"; }}
                  >
                    <span style={{ fontSize: 13 }}>{tab.icon}</span>
                    {tab.label}
                    {isActive && <div className="tab-active-underline" />}
                  </button>
                );
              })}
            </div>

            {/* ── TAB: TASK ─────────────────────────────────────── */}
            {activeTab === "task" && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: 24, gap: 16 }}>

                {/* Task input area */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    padding: 20,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 16,
                    flexShrink: 0,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      Descrição da Tarefa
                    </span>
                  </div>

                  <textarea
                    value={taskInput}
                    onChange={(e) => setTaskInput(e.target.value)}
                    disabled={isRunning}
                    placeholder="Descreva a tarefa que os agentes devem executar. Seja específico sobre o objetivo, contexto e formato de saída esperado…"
                    rows={5}
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 12,
                      padding: "14px 16px",
                      color: "#e2e8f0",
                      fontSize: "0.9rem",
                      lineHeight: 1.7,
                      resize: "none",
                      outline: "none",
                      fontFamily: "var(--font-geist-sans)",
                      transition: "border-color 0.2s",
                      opacity: isRunning ? 0.5 : 1,
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.4)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                  />

                  {/* Config row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                    {/* Model selector */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 12px",
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 8,
                          fontSize: "0.75rem",
                          color: "#64748b",
                        }}
                      >
                        <span>🤖</span>
                        <span style={{ color: "#a78bfa", fontWeight: 600 }}>gemini-1.5-pro</span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 12px",
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 8,
                          fontSize: "0.75rem",
                          color: "#64748b",
                        }}
                      >
                        <span>🔄</span>
                        <span>Paralelo</span>
                      </div>
                    </div>

                    {/* Char count */}
                    <span style={{ fontSize: "0.72rem", color: "#334155" }}>
                      {taskInput.length}/2000
                    </span>
                  </div>
                </div>

                {/* Execute button + result area */}
                <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
                  <button
                    id="btn-execute-pipeline"
                    onClick={executeWorkflow}
                    disabled={isRunning || !taskInput.trim()}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10,
                      padding: "14px 24px",
                      background:
                        isRunning || !taskInput.trim()
                          ? "rgba(124,58,237,0.2)"
                          : "linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%)",
                      border: "none",
                      borderRadius: 12,
                      color: isRunning || !taskInput.trim() ? "#64748b" : "white",
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      cursor: isRunning || !taskInput.trim() ? "not-allowed" : "pointer",
                      transition: "all 0.2s",
                      boxShadow:
                        isRunning || !taskInput.trim()
                          ? "none"
                          : "0 0 0 1px rgba(124,58,237,0.5), 0 8px 24px rgba(124,58,237,0.3)",
                    }}
                  >
                    {isRunning ? (
                      <>
                        <svg
                          style={{ animation: "spin-slow 1s linear infinite" }}
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="40" strokeDashoffset="10" />
                        </svg>
                        Executando Pipeline…
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M5 3l14 9-14 9V3z" fill="currentColor" />
                        </svg>
                        Executar Pipeline
                      </>
                    )}
                  </button>
                </div>

                {/* Execution result banner */}
                {allDone && !isRunning && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "14px 20px",
                      background: "rgba(34,197,94,0.08)",
                      border: "1px solid rgba(34,197,94,0.25)",
                      borderRadius: 12,
                      animation: "slide-in 0.3s ease",
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: "rgba(34,197,94,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                        flexShrink: 0,
                      }}
                    >
                      ✓
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#4ade80", marginBottom: 2 }}>
                        Pipeline concluído com sucesso
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        {agents.length} agentes · {executionTime}s · Qualidade validada
                      </div>
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {!isRunning && logs.length === 0 && (
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 12,
                      opacity: 0.4,
                    }}
                  >
                    <div style={{ fontSize: 48 }}>🤖</div>
                    <p style={{ fontSize: "0.85rem", color: "#475569", textAlign: "center", maxWidth: 300 }}>
                      Descreva uma tarefa acima e clique em{" "}
                      <strong style={{ color: "#64748b" }}>Executar Pipeline</strong> para iniciar.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB: PIPELINE ─────────────────────────────────── */}
            {activeTab === "pipeline" && (
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  padding: 24,
                  gap: 20,
                }}
              >
                {/* Configuration Section at the top */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 16,
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 12,
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#e2e8f0" }}>Configurar Pipeline</span>
                    <span style={{ fontSize: "0.7rem", color: "#64748b" }}>Adicione agentes para criar um pipeline de execução sequencial.</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <select
                      value={pipelineSelectId}
                      onChange={(e) => setPipelineSelectId(e.target.value)}
                      style={{
                        padding: "8px 12px",
                        background: "rgba(17,12,28,0.96)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 8,
                        color: "#e2e8f0",
                        fontSize: "0.8rem",
                        outline: "none",
                        cursor: "pointer",
                      }}
                    >
                      <option value="">Selecione um agente...</option>
                      {agents.map(ag => (
                        <option key={ag.id} value={ag.id}>
                          {ag.icon} {ag.name} ({ag.role})
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => handleAddToPipeline(pipelineSelectId)}
                      disabled={!pipelineSelectId}
                      style={{
                        padding: "8px 16px",
                        background: !pipelineSelectId ? "rgba(124,58,237,0.2)" : "linear-gradient(135deg, #7c3aed, #4f46e5)",
                        border: "none",
                        borderRadius: 8,
                        color: !pipelineSelectId ? "#64748b" : "white",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        cursor: !pipelineSelectId ? "not-allowed" : "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      Adicionar ao Pipeline
                    </button>
                  </div>
                </div>

                {/* Flow Display Area */}
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(255,255,255,0.01)",
                    border: "1px dashed rgba(255,255,255,0.04)",
                    borderRadius: 16,
                    padding: 32,
                  }}
                >
                  {pipeline.length === 0 ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 12,
                        opacity: 0.4,
                      }}
                    >
                      <div style={{ fontSize: 48 }}>🔗</div>
                      <p style={{ fontSize: "0.85rem", color: "#475569", textAlign: "center", maxWidth: 300 }}>
                        Pipeline está vazio. Adicione agentes no menu superior para montar seu fluxo.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
                      {pipeline.map((agentId, index) => {
                        const agent = getAgent(agentId);
                        if (!agent) return null;
                        const status = agentStatuses[agentId] || "idle";
                        const isSelected = selectedAgent === agentId;

                        return (
                          <div key={index} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            {/* Connector line for item > 0 */}
                            {index > 0 && (
                              <svg width="2" height="32" viewBox="0 0 2 32">
                                <line
                                  x1="1"
                                  y1="0"
                                  x2="1"
                                  y2="32"
                                  stroke={status === "running" ? "#f59e0b" : "rgba(124,58,237,0.3)"}
                                  strokeWidth="2"
                                  strokeDasharray="4 3"
                                  style={{
                                    animation: status === "running" ? "flow-dash 0.8s linear infinite" : "none"
                                  }}
                                />
                              </svg>
                            )}

                            {/* Node box wrapper to align Node and controls side by side */}
                            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                              <PipelineNode
                                agent={agent}
                                status={status}
                                isSelected={isSelected}
                                onClick={() => setSelectedAgent(isSelected ? null : agentId)}
                              />

                              {/* Reorder and remove buttons */}
                              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <button
                                  onClick={() => handleMovePipelineItem(index, "up")}
                                  disabled={index === 0}
                                  title="Subir agente no pipeline"
                                  style={{
                                    width: 24,
                                    height: 24,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: "rgba(255,255,255,0.03)",
                                    border: "1px solid rgba(255,255,255,0.06)",
                                    borderRadius: 6,
                                    color: index === 0 ? "#334155" : "#94a3b8",
                                    cursor: index === 0 ? "not-allowed" : "pointer",
                                    fontSize: "0.7rem",
                                    transition: "all 0.2s"
                                  }}
                                >
                                  ▲
                                </button>

                                <button
                                  onClick={() => handleMovePipelineItem(index, "down")}
                                  disabled={index === pipeline.length - 1}
                                  title="Descer agente no pipeline"
                                  style={{
                                    width: 24,
                                    height: 24,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: "rgba(255,255,255,0.03)",
                                    border: "1px solid rgba(255,255,255,0.06)",
                                    borderRadius: 6,
                                    color: index === pipeline.length - 1 ? "#334155" : "#94a3b8",
                                    cursor: index === pipeline.length - 1 ? "not-allowed" : "pointer",
                                    fontSize: "0.7rem",
                                    transition: "all 0.2s"
                                  }}
                                >
                                  ▼
                                </button>

                                <button
                                  onClick={() => handleRemoveFromPipeline(index)}
                                  title="Remover do pipeline"
                                  style={{
                                    width: 24,
                                    height: 24,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: "rgba(239,68,68,0.06)",
                                    border: "1px solid rgba(239,68,68,0.2)",
                                    borderRadius: 6,
                                    color: "#f87171",
                                    cursor: "pointer",
                                    fontSize: "0.75rem",
                                    transition: "all 0.2s",
                                    fontWeight: "bold"
                                  }}
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Final Result / Output connection */}
                      <svg width="2" height="32" viewBox="0 0 2 32">
                        <line x1="1" y1="0" x2="1" y2="32" stroke={allDone ? "#22c55e" : "rgba(255,255,255,0.08)"} strokeWidth="2" strokeDasharray="4 3" />
                      </svg>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "12px 24px",
                          background: allDone ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.03)",
                          border: `1px solid ${allDone ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.08)"}`,
                          borderRadius: 12,
                        }}
                      >
                        <span style={{ fontSize: 18 }}>{allDone ? "✅" : "📤"}</span>
                        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: allDone ? "#4ade80" : "#475569" }}>
                          {allDone ? "Output Final — Aprovado" : "Aguardando Resultado"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB: HISTORY ──────────────────────────────────── */}
            {activeTab === "history" && (
              <div style={{ flex: 1, overflow: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Execuções Recentes
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "#334155" }}>
                    {MOCK_HISTORY.length} registros
                  </span>
                </div>

                {MOCK_HISTORY.map((run) => (
                  <div
                    key={run.id}
                    style={{
                      padding: "16px 18px",
                      background: "rgba(255,255,255,0.03)",
                      border: `1px solid ${run.status === "error" ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.07)"}`,
                      borderRadius: 14,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                      e.currentTarget.style.borderColor = run.status === "error" ? "rgba(239,68,68,0.35)" : "rgba(124,58,237,0.25)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                      e.currentTarget.style.borderColor = run.status === "error" ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.07)";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
                      <p style={{ fontSize: "0.83rem", color: "#c4b5fd", lineHeight: 1.5, flex: 1, margin: 0 }}>
                        {run.task}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "2px 10px",
                          borderRadius: 100,
                          background: run.status === "done" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                          border: `1px solid ${run.status === "done" ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: run.status === "done" ? "#22c55e" : "#ef4444",
                          }}
                        />
                        <span
                          style={{
                            fontSize: "0.65rem",
                            fontWeight: 600,
                            color: run.status === "done" ? "#4ade80" : "#f87171",
                          }}
                        >
                          {run.status === "done" ? "Concluído" : "Erro"}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                      {[
                        { icon: "🕐", label: run.date },
                        { icon: "⏱️", label: run.duration },
                        { icon: "🤖", label: `${run.agents} agentes` },
                        { icon: "💬", label: `${run.tokens.toLocaleString()} tokens` },
                      ].map((meta) => (
                        <span
                          key={meta.label}
                          style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.72rem", color: "#475569" }}
                        >
                          <span style={{ fontSize: 11 }}>{meta.icon}</span>
                          {meta.label}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── TAB: CHAT ─────────────────────────────────────── */}
            {activeTab === "chat" && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: 24, gap: 16 }}>
                {!selectedAgent ? (
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 12,
                      opacity: 0.4,
                    }}
                  >
                    <div style={{ fontSize: 48 }}>💬</div>
                    <p style={{ fontSize: "0.85rem", color: "#475569", textAlign: "center", maxWidth: 300 }}>
                      Selecione um agente na barra lateral para iniciar uma conversa.
                    </p>
                  </div>
                ) : (() => {
                  const ag = getAgent(selectedAgent);
                  if (!ag) return null;
                  const messages = chatMessages[selectedAgent] || [];
                  return (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16 }}>
                      {/* Chat header */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 24 }}>{ag.icon}</span>
                          <div>
                            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: ag.color }}>{ag.name}</div>
                            <div style={{ fontSize: "0.65rem", color: "#64748b" }}>{ag.role}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleClearChatHistory(ag.id)}
                          style={{
                            padding: "6px 12px",
                            background: "transparent",
                            border: "1px solid rgba(239,68,68,0.25)",
                            borderRadius: 8,
                            color: "#f87171",
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          Limpar Histórico
                        </button>
                      </div>

                      {/* Chat messages */}
                      <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
                        {messages.length === 0 ? (
                          <div
                            style={{
                              flex: 1,
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              opacity: 0.3,
                              gap: 8,
                            }}
                          >
                            <div style={{ fontSize: 32 }}>💬</div>
                            <p style={{ fontSize: "0.75rem", color: "#475569", textAlign: "center" }}>
                              Envie uma mensagem para iniciar a conversa com {ag.name}.
                            </p>
                          </div>
                        ) : (
                          messages.map((msg, index) => {
                            const isUser = msg.role === "user";
                            return (
                              <div
                                key={index}
                                style={{
                                  alignSelf: isUser ? "flex-end" : "flex-start",
                                  maxWidth: "75%",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 4,
                                }}
                              >
                                <div
                                  style={{
                                    padding: "10px 14px",
                                    borderRadius: 14,
                                    borderTopRightRadius: isUser ? 2 : 14,
                                    borderTopLeftRadius: isUser ? 14 : 2,
                                    background: isUser ? "linear-gradient(135deg, #7c3aed, #4f46e5)" : "rgba(255,255,255,0.04)",
                                    border: isUser ? "none" : "1px solid rgba(255,255,255,0.06)",
                                    color: "#e2e8f0",
                                    fontSize: "0.85rem",
                                    lineHeight: 1.5,
                                    whiteSpace: "pre-wrap",
                                    wordBreak: "break-word"
                                  }}
                                >
                                  {msg.content}
                                </div>
                                <span style={{ fontSize: "0.6rem", color: "#475569", alignSelf: isUser ? "flex-end" : "flex-start" }}>
                                  {msg.timestamp}
                                </span>
                              </div>
                            );
                          })
                        )}
                        {chatLoading && (
                          <div style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 14, borderTopLeftRadius: 2, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                            <svg
                              style={{ animation: "spin-slow 1s linear infinite" }}
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#64748b"
                            >
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="40" strokeDashoffset="10" />
                            </svg>
                            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Pensando...</span>
                          </div>
                        )}
                      </div>

                      {/* Chat input form */}
                      <div style={{ padding: 16, borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.1)", display: "flex", gap: 10 }}>
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSendChatMessage();
                            }
                          }}
                          disabled={chatLoading}
                          placeholder={`Converse com ${ag.name}...`}
                          style={{
                            flex: 1,
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: 10,
                            padding: "10px 14px",
                            color: "#e2e8f0",
                            fontSize: "0.85rem",
                            outline: "none"
                          }}
                          onFocus={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.4)")}
                          onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                        />
                        <button
                          onClick={handleSendChatMessage}
                          disabled={chatLoading || !chatInput.trim()}
                          style={{
                            padding: "10px 18px",
                            background: chatLoading || !chatInput.trim() ? "rgba(124,58,237,0.2)" : "linear-gradient(135deg, #7c3aed, #4f46e5)",
                            border: "none",
                            borderRadius: 10,
                            color: chatLoading || !chatInput.trim() ? "#64748b" : "white",
                            fontSize: "0.85rem",
                            fontWeight: 700,
                            cursor: chatLoading || !chatInput.trim() ? "not-allowed" : "pointer",
                            transition: "all 0.2s"
                          }}
                        >
                          Enviar
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </main>

          {/* ── RIGHT PANEL: Activity Log ──────────────────────── */}
          <aside
            style={{
              width: 320,
              flexShrink: 0,
              borderLeft: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Log header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Atividade
                </span>
                {logs.length > 0 && (
                  <span
                    style={{
                      fontSize: "0.65rem",
                      padding: "2px 7px",
                      background: "rgba(124,58,237,0.15)",
                      border: "1px solid rgba(124,58,237,0.25)",
                      borderRadius: 100,
                      color: "#a78bfa",
                      fontWeight: 600,
                    }}
                  >
                    {logs.length}
                  </span>
                )}
              </div>

              {/* Running indicator */}
              {isRunning && (
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: "#f59e0b",
                      animation: "pulse-dot 1s infinite",
                    }}
                  />
                  <span style={{ fontSize: "0.65rem", color: "#f59e0b", fontWeight: 600 }}>
                    ao vivo
                  </span>
                </div>
              )}
            </div>

            {/* Log entries */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "8px",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              {logs.length === 0 ? (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: 0.3,
                    gap: 8,
                  }}
                >
                  <div style={{ fontSize: 32 }}>📋</div>
                  <p style={{ fontSize: "0.75rem", color: "#475569", textAlign: "center" }}>
                    O log de atividade aparecerá aqui durante a execução.
                  </p>
                </div>
              ) : (
                logs.map((entry) => {
                  const ag = getAgent(entry.agentId);
                  const color =
                    entry.agentId === "system"
                      ? entry.type === "success"
                        ? "#22c55e"
                        : "#475569"
                      : ag?.color || "#94a3b8";

                  return (
                    <div
                      key={entry.id}
                      className="log-entry"
                      style={{
                        padding: "8px 10px",
                        borderRadius: 10,
                        background:
                          entry.agentId === "system"
                            ? entry.type === "success"
                              ? "rgba(34,197,94,0.06)"
                              : "rgba(255,255,255,0.02)"
                            : "rgba(255,255,255,0.025)",
                        border: `1px solid ${
                          entry.agentId === "system"
                            ? entry.type === "success"
                              ? "rgba(34,197,94,0.15)"
                              : "rgba(255,255,255,0.04)"
                            : `${color}18`
                        }`,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          {ag && (
                            <span style={{ fontSize: 11 }}>{ag.icon}</span>
                          )}
                          <span
                            style={{
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              color,
                              letterSpacing: "0.04em",
                            }}
                          >
                            {ag ? ag.name.toUpperCase() : "SYSTEM"}
                          </span>
                        </div>
                        <span style={{ fontSize: "0.6rem", color: "#334155", fontFamily: "var(--font-geist-mono)" }}>
                          {formatTime(entry.timestamp)}
                        </span>
                      </div>
                      <p style={{ fontSize: "0.75rem", color: entry.type === "success" ? "#86efac" : "#94a3b8", lineHeight: 1.5, margin: 0 }}>
                        {entry.message}
                      </p>
                    </div>
                  );
                })
              )}
              <div ref={logsEndRef} />
            </div>

            {/* Log footer stats */}
            {allDone && !isRunning && (
              <div
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                  padding: "12px 16px",
                  display: "flex",
                  gap: 12,
                  justifyContent: "space-between",
                  flexShrink: 0,
                }}
              >
                {[
                  { label: "Tempo", value: `${executionTime}s` },
                  { label: "Agentes", value: `${agents.length}` },
                  { label: "Eventos", value: `${logs.length}` },
                ].map((stat) => (
                  <div key={stat.label} style={{ flex: 1, textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: "1rem",
                        fontWeight: 800,
                        background: "linear-gradient(135deg,#fff,#a78bfa)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      {stat.value}
                    </div>
                    <div style={{ fontSize: "0.65rem", color: "#475569" }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Modal para criar/editar agente */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(3,2,10,0.7)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            animation: "fade-in 0.2s ease-out",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            style={{
              background: "rgba(17, 12, 28, 0.96)",
              border: "1px solid rgba(124, 58, 237, 0.3)",
              borderRadius: 16,
              width: "100%",
              maxWidth: 480,
              padding: 24,
              boxShadow: "0 20px 40px rgba(0,0,0,0.5), 0 0 30px rgba(124, 58, 237, 0.15)",
              animation: "scale-up 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
                {editingAgent ? "Editar Agente" : "Adicionar Novo Agente"}
              </h3>
              <button
                onClick={closeModal}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  fontSize: "1.2rem",
                  padding: "0 4px",
                  lineHeight: 1,
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = "#f8fafc"}
                onMouseLeave={(e) => e.currentTarget.style.color = "#64748b"}
              >
                &times;
              </button>
            </div>
            <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: "0 0 20px" }}>
              {editingAgent
                ? "Modifique as propriedades, instruções e provedor de IA deste agente."
                : "Crie um novo agente personalizado para integrar na sua interface do workspace."}
            </p>

            {formError && (
              <div
                style={{
                  padding: "8px 12px",
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: 8,
                  color: "#f87171",
                  fontSize: "0.75rem",
                  marginBottom: 16,
                }}
              >
                {formError}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Nome */}
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Nome do Agente *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Coder, Designer, Translator"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  style={{
                    padding: "10px 12px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8,
                    color: "#f8fafc",
                    fontSize: "0.85rem",
                    outline: "none",
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "#7c3aed"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>

              {/* Função */}
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Função / Especialidade *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Desenvolvimento & Debugging"
                  value={newAgentRole}
                  onChange={(e) => setNewAgentRole(e.target.value)}
                  style={{
                    padding: "10px 12px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8,
                    color: "#f8fafc",
                    fontSize: "0.85rem",
                    outline: "none",
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "#7c3aed"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>

              {/* Provedor e Modelo */}
              <div style={{ display: "flex", gap: 16 }}>
                {/* Seleção de Provedor */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Provedor *
                  </label>
                  <select
                    value={newAgentProvider}
                    onChange={(e) => {
                      const prov = e.target.value as "google" | "openai" | "anthropic";
                      setNewAgentProvider(prov);
                      if (prov === "google") setNewAgentModel("googleai/gemini-1.5-pro");
                      else if (prov === "openai") setNewAgentModel("gpt-4o");
                      else if (prov === "anthropic") setNewAgentModel("claude-3-5-sonnet-20241022");
                    }}
                    style={{
                      padding: "10px 12px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 8,
                      color: "#f8fafc",
                      fontSize: "0.85rem",
                      outline: "none",
                      cursor: "pointer",
                    }}
                  >
                    <option value="google" style={{ background: "#110c1c" }}>Google Gemini</option>
                    <option value="openai" style={{ background: "#110c1c" }}>OpenAI</option>
                    <option value="anthropic" style={{ background: "#110c1c" }}>Anthropic</option>
                  </select>
                </div>

                {/* Seleção de Modelo */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Modelo *
                  </label>
                  <select
                    value={newAgentModel}
                    onChange={(e) => setNewAgentModel(e.target.value)}
                    style={{
                      padding: "10px 12px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 8,
                      color: "#f8fafc",
                      fontSize: "0.85rem",
                      outline: "none",
                      cursor: "pointer",
                    }}
                  >
                    {newAgentProvider === "google" && (
                      <>
                        <option value="googleai/gemini-1.5-pro" style={{ background: "#110c1c" }}>gemini-1.5-pro</option>
                        <option value="googleai/gemini-1.5-flash" style={{ background: "#110c1c" }}>gemini-1.5-flash</option>
                      </>
                    )}
                    {newAgentProvider === "openai" && (
                      <>
                        <option value="gpt-4o" style={{ background: "#110c1c" }}>gpt-4o</option>
                        <option value="gpt-4o-mini" style={{ background: "#110c1c" }}>gpt-4o-mini</option>
                      </>
                    )}
                    {newAgentProvider === "anthropic" && (
                      <>
                        <option value="claude-3-5-sonnet-20241022" style={{ background: "#110c1c" }}>claude-3-5-sonnet-20241022</option>
                        <option value="claude-3-5-haiku-20241022" style={{ background: "#110c1c" }}>claude-3-5-haiku-20241022</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Ícone e Cor */}
              <div style={{ display: "flex", gap: 16 }}>
                {/* Seleção de Ícone */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Ícone
                  </label>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {["🤖", "💻", "🎨", "🚀", "📊", "🔍", "✍️", "🛡️", "🔑"].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setNewAgentIcon(emoji)}
                        style={{
                          fontSize: "1.1rem",
                          padding: "6px 8px",
                          background: newAgentIcon === emoji ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.03)",
                          border: `1px solid ${newAgentIcon === emoji ? "#7c3aed" : "rgba(255,255,255,0.08)"}`,
                          borderRadius: 8,
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Seleção de Cor */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Cor Tema
                  </label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
                        onClick={() => setNewAgentColor(colorItem.hex)}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          background: colorItem.hex,
                          border: newAgentColor === colorItem.hex ? "2px solid #ffffff" : "2px solid transparent",
                          cursor: "pointer",
                          boxShadow: newAgentColor === colorItem.hex ? `0 0 8px ${colorItem.hex}` : "none",
                          transition: "all 0.2s",
                        }}
                        title={colorItem.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Descrição */}
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Descrição / Instruções
                </label>
                <textarea
                  placeholder="Descreva brevemente o propósito ou regras especiais deste agente..."
                  value={newAgentDescription}
                  onChange={(e) => setNewAgentDescription(e.target.value)}
                  rows={3}
                  style={{
                    padding: "10px 12px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8,
                    color: "#f8fafc",
                    fontSize: "0.85rem",
                    outline: "none",
                    resize: "none",
                    fontFamily: "inherit",
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "#7c3aed"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>
            </div>

            {/* Ações */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
              <button
                type="button"
                onClick={closeModal}
                style={{
                  padding: "8px 16px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8,
                  color: "#e2e8f0",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={editingAgent ? handleEditAgent : handleCreateAgent}
                style={{
                  padding: "8px 18px",
                  background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                  border: "none",
                  borderRadius: 8,
                  color: "white",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: "0 4px 12px rgba(124,58,237,0.25)",
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
              >
                {editingAgent ? "Salvar Alterações" : "Adicionar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
