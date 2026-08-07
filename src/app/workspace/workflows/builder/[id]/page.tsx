'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  StartNode,
  AgentNode,
  ParallelNode,
  SynthesizerNode,
  ConditionNode,
  EndNode,
} from '../../components/CustomNodes';
import { WorkflowDefinition, WorkflowNode, WorkflowEdge } from '@/types/workflow';

interface AgentItem {
  id: string;
  name: string;
  role: string;
  provider: string;
  model: string;
  description: string;
}

const initialDefaultNodes: Node[] = [
  {
    id: 'node_start',
    type: 'start',
    position: { x: 100, y: 250 },
    data: { label: 'Início', type: 'start' },
  },
  {
    id: 'node_end',
    type: 'end',
    position: { x: 700, y: 250 },
    data: { label: 'Fim', type: 'end' },
  },
];

const initialDefaultEdges: Edge[] = [];

export default function VisualWorkflowBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.id as string;

  const [workflowName, setWorkflowName] = useState('Novo Workflow');
  const [workflowDesc, setWorkflowDesc] = useState('');
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Execution drawer states
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionTask, setExecutionTask] = useState('');
  const [executionLogs, setExecutionLogs] = useState<any[]>([]);
  const [finalOutput, setFinalOutput] = useState('');
  const [showRunDrawer, setShowRunDrawer] = useState(false);
  const [saving, setSaving] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialDefaultNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialDefaultEdges);

  const nodeTypes = useMemo(
    () => ({
      start: StartNode,
      agent: AgentNode,
      parallel: ParallelNode,
      synthesizer: SynthesizerNode,
      condition: ConditionNode,
      end: EndNode,
    }),
    []
  );

  // Carregar agentes cadastrados no workspace
  useEffect(() => {
    fetch('/api/settings/mcp')
      .catch(() => {});
    
    // Carregar agentes do Firestore via endpoint ou localStorage/State
    fetch('/api/chat')
      .then((res) => res.json())
      .catch(() => {});

    // Ler agentes direto das APIs
    const loadedAgents = localStorage.getItem('local_agents');
    if (loadedAgents) {
      try {
        setAgents(JSON.parse(loadedAgents));
      } catch (e) {}
    }
  }, []);

  // Carregar Workflow existente se houver
  useEffect(() => {
    if (!workflowId || workflowId === 'new') return;
    fetch('/api/workflows')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          const found = data.data.find((w: WorkflowDefinition) => w.id === workflowId);
          if (found) {
            setWorkflowName(found.name);
            setWorkflowDesc(found.description || '');
            if (found.nodes && found.nodes.length > 0) setNodes(found.nodes as any);
            if (found.edges) setEdges(found.edges as any);
          }
        }
      })
      .catch((err) => console.error('Erro ao carregar workflow:', err));
  }, [workflowId, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  };

  const onPaneClick = () => {
    setSelectedNode(null);
  };

  // Adicionar Nós ao Canvas
  const addNode = (type: string, label: string) => {
    const id = `node_${type}_${Date.now()}`;
    const newNode: Node = {
      id,
      type,
      position: { x: 350 + Math.random() * 50, y: 150 + Math.random() * 150 },
      data: { label, type },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  // Atualizar dados do nó selecionado
  const updateSelectedNodeData = (key: string, value: any) => {
    if (!selectedNode) return;
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === selectedNode.id) {
          const updatedData = { ...n.data, [key]: value };
          if (key === 'agentId') {
            const ag = agents.find((a) => a.id === value);
            if (ag) {
              updatedData.agentName = ag.name;
              updatedData.label = `Agente: ${ag.name}`;
            }
          }
          return { ...n, data: updatedData };
        }
        return n;
      })
    );
    setSelectedNode((prev) => (prev ? { ...prev, data: { ...prev.data, [key]: value } } : null));
  };

  // Remover Nó
  const deleteSelectedNode = () => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
  };

  // Salvar Workflow
  const handleSaveWorkflow = async () => {
    setSaving(true);
    try {
      const payload: WorkflowDefinition = {
        id: workflowId,
        name: workflowName,
        description: workflowDesc,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nodes: nodes as any,
        edges: edges as any,
      };

      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        alert('Workflow salvo com sucesso!');
      } else {
        alert(`Erro ao salvar: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Erro ao salvar workflow: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Executar Workflow via SSE Stream
  const handleExecuteWorkflow = async () => {
    if (!executionTask) return alert('Por favor, digite uma tarefa para iniciar o workflow.');

    setIsExecuting(true);
    setExecutionLogs([]);
    setFinalOutput('');

    const agentsMap: Record<string, any> = {};
    agents.forEach((a) => {
      agentsMap[a.id] = a;
    });

    try {
      const response = await fetch('/api/workflow/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: executionTask,
          nodes: nodes.map((n) => ({ id: n.id, type: n.type, data: n.data })),
          edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target, label: e.label })),
          agentsMap,
        }),
      });

      if (!response.body) throw new Error('Falha ao abrir stream de execução.');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            try {
              const chunk = JSON.parse(dataStr);
              if (chunk.log) {
                setExecutionLogs((prev) => [...prev, chunk]);
              }
              if (chunk.result) {
                setFinalOutput(chunk.result);
              }
            } catch (e) {}
          }
        }
      }
    } catch (err: any) {
      setExecutionLogs((prev) => [
        ...prev,
        { log: { message: `Erro fatal na execução: ${err.message}`, type: 'error' } },
      ]);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#090710] text-slate-50 flex flex-col overflow-hidden">
      {/* Header Bar */}
      <header className="h-16 border-b border-white/10 px-6 flex items-center justify-between bg-slate-950/80 backdrop-blur z-20 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/workspace/workflows"
            className="text-slate-400 hover:text-slate-200 no-underline text-sm font-semibold flex items-center gap-1"
          >
            ← Voltar
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="bg-transparent text-lg font-bold text-slate-50 border-none outline-none focus:bg-white/5 px-2 py-1 rounded"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRunDrawer(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs md:text-sm shadow-md transition-all cursor-pointer border-none"
          >
            ▶ Executar Workflow
          </button>
          <button
            onClick={handleSaveWorkflow}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-bold text-xs md:text-sm shadow-md transition-all cursor-pointer border-none disabled:opacity-50"
          >
            {saving ? 'Salvando...' : '💾 Salvar Workflow'}
          </button>
        </div>
      </header>

      {/* Builder Main Canvas Area */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Left Toolbar / Node Palette */}
        <aside className="w-64 border-r border-white/10 bg-slate-950/60 p-4 flex flex-col gap-4 z-10 shrink-0 overflow-y-auto">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Adicionar Nós ao Fluxo
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => addNode('agent', 'Novo Agente')}
              className="flex items-center gap-3 p-3 bg-violet-500/10 border border-violet-500/30 hover:bg-violet-500/20 rounded-xl text-violet-300 text-xs font-bold text-left cursor-pointer transition-colors"
            >
              🤖 Nó de Agente
            </button>
            <button
              onClick={() => addNode('parallel', 'Divisor Paralelo')}
              className="flex items-center gap-3 p-3 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 rounded-xl text-cyan-300 text-xs font-bold text-left cursor-pointer transition-colors"
            >
              ⚡ Divisor Paralelo
            </button>
            <button
              onClick={() => addNode('synthesizer', 'Agregador / Sintetizador')}
              className="flex items-center gap-3 p-3 bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 rounded-xl text-indigo-300 text-xs font-bold text-left cursor-pointer transition-colors"
            >
              🧠 Nó Agregador (Sintetizador IA)
            </button>
            <button
              onClick={() => addNode('condition', 'Condição Decisória')}
              className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 rounded-xl text-amber-300 text-xs font-bold text-left cursor-pointer transition-colors"
            >
              ❓ Nó Condicional
            </button>
            <button
              onClick={() => addNode('end', 'Fim do Fluxo')}
              className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 rounded-xl text-blue-300 text-xs font-bold text-left cursor-pointer transition-colors"
            >
              🏁 Nó de Fim
            </button>
          </div>

          <div className="mt-auto pt-4 border-t border-white/5 text-[11px] text-slate-500 leading-relaxed">
            💡 <b>Dica:</b> Arraste as conexões entre as bolinhas dos nós para definir a sequência de execução.
          </div>
        </aside>

        {/* Center React Flow Canvas */}
        <div className="flex-1 h-full bg-[#0a0814] relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="rgba(255,255,255,0.08)" />
            <Controls className="!bg-slate-900 !border-slate-800 !text-slate-200" />
          </ReactFlow>
        </div>

        {/* Right Inspector Drawer (Node Details) */}
        {selectedNode && (
          <aside className="w-80 border-l border-white/10 bg-slate-950/80 backdrop-blur p-5 flex flex-col gap-5 z-10 shrink-0 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 m-0">Propriedades do Nó</h3>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-slate-200 bg-transparent border-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1 font-semibold">Tipo do Nó</label>
                <div className="text-xs font-mono px-3 py-2 bg-white/5 rounded border border-white/10 text-slate-300 uppercase">
                  {selectedNode.type}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1 font-semibold">Rótulo / Título</label>
                <input
                  type="text"
                  value={(selectedNode.data?.label as string) || ''}
                  onChange={(e) => updateSelectedNodeData('label', e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-xs text-slate-50 outline-none focus:border-violet-400"
                />
              </div>

              {selectedNode.type === 'agent' && (
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-semibold">Agente Associado</label>
                  {agents.length === 0 ? (
                    <div className="text-xs text-amber-400 bg-amber-500/10 p-2.5 rounded border border-amber-500/20">
                      Nenhum agente encontrado no workspace. Crie agentes primeiro em /workspace.
                    </div>
                  ) : (
                    <select
                      value={(selectedNode.data?.agentId as string) || ''}
                      onChange={(e) => updateSelectedNodeData('agentId', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded text-xs text-slate-50 outline-none focus:border-violet-400"
                    >
                      <option value="">-- Selecione um Agente --</option>
                      {agents.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.role})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {selectedNode.type === 'condition' && (
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-semibold">Regra / Pergunta da Condição</label>
                  <textarea
                    value={(selectedNode.data?.conditionExpr as string) || ''}
                    onChange={(e) => updateSelectedNodeData('conditionExpr', e.target.value)}
                    placeholder="Ex: A análise de risco identificou ameaças críticas?"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-xs text-slate-50 outline-none focus:border-violet-400 min-h-[80px]"
                  />
                </div>
              )}

              <button
                onClick={deleteSelectedNode}
                className="mt-4 px-4 py-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 rounded-xl font-bold text-xs cursor-pointer transition-colors"
              >
                🗑️ Excluir Nó
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* Execution Drawer / Modal */}
      {showRunDrawer && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-2xl bg-slate-950 border-l border-white/10 h-full p-6 flex flex-col gap-6 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-50 m-0">Executar Workflow</h2>
                <p className="text-xs text-slate-400 mt-1">Dispare a execução do grafo interativo e acompanhe os logs SSE em tempo real.</p>
              </div>
              <button
                onClick={() => setShowRunDrawer(false)}
                className="text-slate-400 hover:text-slate-200 bg-transparent border-none cursor-pointer text-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold text-slate-300">Tarefa / Instrução Inicial</label>
              <textarea
                value={executionTask}
                onChange={(e) => setExecutionTask(e.target.value)}
                placeholder="Ex: Elabore uma proposta comercial completa para um cliente de e-commerce..."
                className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-50 outline-none focus:border-emerald-400 min-h-[100px]"
              />
              <button
                onClick={handleExecuteWorkflow}
                disabled={isExecuting}
                className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl cursor-pointer transition-colors border-none disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isExecuting ? '⚡ Processando Workflow...' : '▶ Iniciar Execução'}
              </button>
            </div>

            {/* Execution Log Stream */}
            <div className="flex-1 flex flex-col gap-3 overflow-hidden border-t border-white/10 pt-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Logs da Execução em Tempo Real</div>
              <div className="flex-1 bg-black/60 border border-white/10 rounded-xl p-4 overflow-y-auto font-mono text-xs flex flex-col gap-2 min-h-[200px]">
                {executionLogs.length === 0 ? (
                  <span className="text-slate-600 italic">Aguardando início...</span>
                ) : (
                  executionLogs.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span>
                      <span
                        className={
                          item.log?.type === 'success'
                            ? 'text-emerald-400 font-bold'
                            : item.log?.type === 'error'
                            ? 'text-rose-400 font-bold'
                            : item.log?.type === 'system'
                            ? 'text-cyan-400 font-bold'
                            : 'text-slate-300'
                        }
                      >
                        {item.log?.message}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Final Output */}
            {finalOutput && (
              <div className="flex flex-col gap-2 border-t border-white/10 pt-4">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Resultado Final Sintetizado</div>
                <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 text-xs text-slate-200 whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {finalOutput}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
