"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

/* ─── Types ─────────────────────────────────────────────────── */
type AgentStatus = "idle" | "running" | "done" | "error";
type TabId = "task" | "pipeline" | "history";
type LogType = "info" | "success" | "system";

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
}

/* ─── Constants ──────────────────────────────────────────────── */
const AGENTS: Agent[] = [
  {
    id: "orchestrator",
    name: "Orchestrator",
    role: "Coordenador Principal",
    icon: "🎯",
    color: "#a78bfa",
    description:
      "Planeja a estratégia de execução e delega sub-tarefas para os agentes especializados.",
  },
  {
    id: "researcher",
    name: "Researcher",
    role: "Pesquisa & Dados",
    icon: "🔍",
    color: "#60a5fa",
    description:
      "Coleta informações, consulta fontes e consolida dados relevantes para a tarefa.",
  },
  {
    id: "analyst",
    name: "Analyst",
    role: "Análise & Insights",
    icon: "📊",
    color: "#34d399",
    description:
      "Processa os dados do Researcher e extrai padrões, métricas e insights acionáveis.",
  },
  {
    id: "writer",
    name: "Writer",
    role: "Geração de Conteúdo",
    icon: "✍️",
    color: "#fb923c",
    description:
      "Transforma insights em conteúdo claro, bem estruturado e pronto para uso.",
  },
  {
    id: "reviewer",
    name: "Reviewer",
    role: "Revisão & QA",
    icon: "🛡️",
    color: "#f472b6",
    description:
      "Valida qualidade, consistência factual e alinhamento com os objetivos da tarefa.",
  },
];

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

/* ─── Helper: get agent data ─────────────────────────────────── */
const getAgent = (id: string) => AGENTS.find((a) => a.id === id);

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

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = useCallback((entry: Omit<LogEntry, "id">) => {
    setLogs((prev) => [...prev, { ...entry, id: Math.random().toString(36).slice(2) }]);
  }, []);

  const executeWorkflow = async () => {
    if (!taskInput.trim() || isRunning) return;
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
      const response = await fetch('/api/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: taskInput }),
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
  const progress = AGENTS.length > 0 ? (completedCount / AGENTS.length) * 100 : 0;
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
                  {completedCount}/{AGENTS.length}
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
                  {AGENTS.length} ativos
                </span>
              </div>
            </div>

            {/* Agent list */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
              {AGENTS.map((agent) => {
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
              })}
            </div>

            {/* Selected agent detail */}
            {selectedAgent && (() => {
              const ag = getAgent(selectedAgent)!;
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
                    <div>
                      <div style={{ fontSize: "0.8rem", fontWeight: 700, color: ag.color }}>{ag.name}</div>
                      <div style={{ fontSize: "0.65rem", color: "#475569" }}>{ag.role}</div>
                    </div>
                  </div>
                  <p style={{ fontSize: "0.72rem", color: "#64748b", lineHeight: 1.6, marginBottom: 10 }}>
                    {ag.description}
                  </p>
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
                        <span style={{ color: "#a78bfa", fontWeight: 600 }}>gemini-2.5-pro</span>
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
                        {AGENTS.length} agentes · {executionTime}s · Qualidade validada
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
                  overflow: "auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 32,
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>

                  {/* Phase label */}
                  <div
                    style={{
                      marginBottom: 6,
                      padding: "3px 12px",
                      background: "rgba(124,58,237,0.1)",
                      border: "1px solid rgba(124,58,237,0.2)",
                      borderRadius: 100,
                      fontSize: "0.65rem",
                      fontWeight: 600,
                      color: "#7c3aed",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    Fase 1 — Planejamento
                  </div>

                  {/* Orchestrator */}
                  <PipelineNode
                    agent={AGENTS[0]}
                    status={agentStatuses["orchestrator"] || "idle"}
                    isSelected={selectedAgent === "orchestrator"}
                    onClick={() => setSelectedAgent(selectedAgent === "orchestrator" ? null : "orchestrator")}
                  />

                  {/* Connector down */}
                  <svg width="2" height="32" viewBox="0 0 2 32">
                    <line x1="1" y1="0" x2="1" y2="32" stroke="rgba(124,58,237,0.4)" strokeWidth="2" strokeDasharray="4 3" style={{ animation: "flow-dash 0.8s linear infinite" }} />
                  </svg>

                  {/* Phase 2 label */}
                  <div
                    style={{
                      marginBottom: 6,
                      padding: "3px 12px",
                      background: "rgba(96,165,250,0.08)",
                      border: "1px solid rgba(96,165,250,0.2)",
                      borderRadius: 100,
                      fontSize: "0.65rem",
                      fontWeight: 600,
                      color: "#60a5fa",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    Fase 2 — Paralelo
                  </div>

                  {/* Researcher + Analyst row */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 40 }}>
                    {/* Branch lines top */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <svg width="80" height="24" viewBox="0 0 80 24" overflow="visible">
                        <path d="M40 0 L40 12 L0 12 L0 24" stroke="rgba(96,165,250,0.4)" strokeWidth="1.5" fill="none" strokeDasharray="4 3" style={{ animation: "flow-dash 0.8s linear infinite" }} />
                      </svg>
                      <PipelineNode
                        agent={AGENTS[1]}
                        status={agentStatuses["researcher"] || "idle"}
                        isSelected={selectedAgent === "researcher"}
                        onClick={() => setSelectedAgent(selectedAgent === "researcher" ? null : "researcher")}
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <svg width="80" height="24" viewBox="0 0 80 24" overflow="visible">
                        <path d="M40 0 L40 12 L80 12 L80 24" stroke="rgba(52,211,153,0.4)" strokeWidth="1.5" fill="none" strokeDasharray="4 3" style={{ animation: "flow-dash 0.8s linear infinite" }} />
                      </svg>
                      <PipelineNode
                        agent={AGENTS[2]}
                        status={agentStatuses["analyst"] || "idle"}
                        isSelected={selectedAgent === "analyst"}
                        onClick={() => setSelectedAgent(selectedAgent === "analyst" ? null : "analyst")}
                      />
                    </div>
                  </div>

                  {/* Converge lines */}
                  <div style={{ position: "relative", height: 32, width: 360 }}>
                    <svg width="360" height="32" viewBox="0 0 360 32" style={{ overflow: "visible" }}>
                      <path d="M95 0 L95 16 L180 16 L180 32" stroke="rgba(251,146,60,0.4)" strokeWidth="1.5" fill="none" strokeDasharray="4 3" style={{ animation: "flow-dash 0.8s linear infinite" }} />
                      <path d="M265 0 L265 16 L180 16 L180 32" stroke="rgba(251,146,60,0.4)" strokeWidth="1.5" fill="none" strokeDasharray="4 3" style={{ animation: "flow-dash 0.8s linear infinite" }} />
                    </svg>
                  </div>

                  {/* Phase 3 */}
                  <div
                    style={{
                      marginBottom: 6,
                      padding: "3px 12px",
                      background: "rgba(251,146,60,0.08)",
                      border: "1px solid rgba(251,146,60,0.2)",
                      borderRadius: 100,
                      fontSize: "0.65rem",
                      fontWeight: 600,
                      color: "#fb923c",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    Fase 3 — Geração
                  </div>

                  <PipelineNode
                    agent={AGENTS[3]}
                    status={agentStatuses["writer"] || "idle"}
                    isSelected={selectedAgent === "writer"}
                    onClick={() => setSelectedAgent(selectedAgent === "writer" ? null : "writer")}
                  />

                  <svg width="2" height="32" viewBox="0 0 2 32">
                    <line x1="1" y1="0" x2="1" y2="32" stroke="rgba(244,114,182,0.4)" strokeWidth="2" strokeDasharray="4 3" style={{ animation: "flow-dash 0.8s linear infinite" }} />
                  </svg>

                  {/* Phase 4 */}
                  <div
                    style={{
                      marginBottom: 6,
                      padding: "3px 12px",
                      background: "rgba(244,114,182,0.08)",
                      border: "1px solid rgba(244,114,182,0.2)",
                      borderRadius: 100,
                      fontSize: "0.65rem",
                      fontWeight: 600,
                      color: "#f472b6",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    Fase 4 — Validação
                  </div>

                  <PipelineNode
                    agent={AGENTS[4]}
                    status={agentStatuses["reviewer"] || "idle"}
                    isSelected={selectedAgent === "reviewer"}
                    onClick={() => setSelectedAgent(selectedAgent === "reviewer" ? null : "reviewer")}
                  />

                  {/* Output node */}
                  <svg width="2" height="32" viewBox="0 0 2 32">
                    <line x1="1" y1="0" x2="1" y2="32" stroke="rgba(34,197,94,0.4)" strokeWidth="2" strokeDasharray="4 3" style={{ animation: "flow-dash 0.8s linear infinite" }} />
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
                  { label: "Agentes", value: `${AGENTS.length}` },
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
    </>
  );
}
