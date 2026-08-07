import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Play, Bot, GitFork, BrainCircuit, HelpCircle, CheckCircle } from 'lucide-react';

interface NodeData {
  label?: string;
  agentName?: string;
  conditionExpr?: string;
  [key: string]: any;
}

type CustomNodeProps = NodeProps & { data: NodeData };

export const StartNode = memo(({ data, selected }: CustomNodeProps) => {
  const label = typeof data.label === 'string' ? data.label : 'Início';
  return (
    <div className={`px-4 py-3 bg-slate-900 border-2 ${selected ? 'border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.4)]' : 'border-emerald-500/50'} rounded-xl text-slate-50 min-w-[160px] shadow-lg`}>
      <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
        <Play className="w-4 h-4 fill-emerald-400" />
        <span>{label}</span>
      </div>
      <div className="text-[11px] text-slate-400 mt-1">Ponto de entrada do fluxo</div>
      <Handle type="source" position={Position.Right} className="!bg-emerald-400 !w-3 !h-3" />
    </div>
  );
});
StartNode.displayName = 'StartNode';

export const AgentNode = memo(({ data, selected }: CustomNodeProps) => {
  const label = typeof data.label === 'string' ? data.label : 'Agente';
  const agentName = typeof data.agentName === 'string' ? data.agentName : '';
  return (
    <div className={`px-4 py-3 bg-slate-900 border-2 ${selected ? 'border-violet-400 shadow-[0_0_15px_rgba(167,139,250,0.4)]' : 'border-violet-500/50'} rounded-xl text-slate-50 min-w-[200px] shadow-lg`}>
      <Handle type="target" position={Position.Left} className="!bg-violet-400 !w-3 !h-3" />
      <div className="flex items-center justify-between gap-2 font-bold text-sm text-violet-300">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4" />
          <span>{label}</span>
        </div>
      </div>
      <div className="text-[11px] text-slate-400 mt-1 truncate">
        {agentName ? `Agente: ${agentName}` : 'Selecione um agente...'}
      </div>
      <Handle type="source" position={Position.Right} className="!bg-violet-400 !w-3 !h-3" />
    </div>
  );
});
AgentNode.displayName = 'AgentNode';

export const ParallelNode = memo(({ data, selected }: CustomNodeProps) => {
  const label = typeof data.label === 'string' ? data.label : 'Divisor Paralelo';
  return (
    <div className={`px-4 py-3 bg-slate-900 border-2 ${selected ? 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'border-cyan-500/50'} rounded-xl text-slate-50 min-w-[170px] shadow-lg`}>
      <Handle type="target" position={Position.Left} className="!bg-cyan-400 !w-3 !h-3" />
      <div className="flex items-center gap-2 font-bold text-sm text-cyan-300">
        <GitFork className="w-4 h-4" />
        <span>{label}</span>
      </div>
      <div className="text-[11px] text-slate-400 mt-1">Dispara ramos simultâneos</div>
      <Handle type="source" position={Position.Right} className="!bg-cyan-400 !w-3 !h-3" />
    </div>
  );
});
ParallelNode.displayName = 'ParallelNode';

export const SynthesizerNode = memo(({ data, selected }: CustomNodeProps) => {
  const label = typeof data.label === 'string' ? data.label : 'Agregador / Sintetizador';
  return (
    <div className={`px-4 py-3 bg-slate-900 border-2 ${selected ? 'border-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.4)]' : 'border-indigo-500/50'} rounded-xl text-slate-50 min-w-[190px] shadow-lg`}>
      <Handle type="target" position={Position.Left} className="!bg-indigo-400 !w-3 !h-3" />
      <div className="flex items-center gap-2 font-bold text-sm text-indigo-300">
        <BrainCircuit className="w-4 h-4" />
        <span>{label}</span>
      </div>
      <div className="text-[11px] text-slate-400 mt-1">Funde respostas em 1 relatório</div>
      <Handle type="source" position={Position.Right} className="!bg-indigo-400 !w-3 !h-3" />
    </div>
  );
});
SynthesizerNode.displayName = 'SynthesizerNode';

export const ConditionNode = memo(({ data, selected }: CustomNodeProps) => {
  const label = typeof data.label === 'string' ? data.label : 'Condição';
  const conditionExpr = typeof data.conditionExpr === 'string' ? data.conditionExpr : 'Avaliar resposta';
  return (
    <div className={`px-4 py-3 bg-slate-900 border-2 ${selected ? 'border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.4)]' : 'border-amber-500/50'} rounded-xl text-slate-50 min-w-[180px] shadow-lg`}>
      <Handle type="target" position={Position.Left} className="!bg-amber-400 !w-3 !h-3" />
      <div className="flex items-center gap-2 font-bold text-sm text-amber-300">
        <HelpCircle className="w-4 h-4" />
        <span>{label}</span>
      </div>
      <div className="text-[11px] text-slate-400 mt-1 truncate">
        {conditionExpr}
      </div>
      <Handle type="source" position={Position.Right} id="sim" style={{ top: '35%' }} className="!bg-emerald-400 !w-3 !h-3" />
      <Handle type="source" position={Position.Right} id="nao" style={{ top: '65%' }} className="!bg-rose-400 !w-3 !h-3" />
    </div>
  );
});
ConditionNode.displayName = 'ConditionNode';

export const EndNode = memo(({ data, selected }: CustomNodeProps) => {
  const label = typeof data.label === 'string' ? data.label : 'Fim';
  return (
    <div className={`px-4 py-3 bg-slate-900 border-2 ${selected ? 'border-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.4)]' : 'border-blue-500/50'} rounded-xl text-slate-50 min-w-[150px] shadow-lg`}>
      <Handle type="target" position={Position.Left} className="!bg-blue-400 !w-3 !h-3" />
      <div className="flex items-center gap-2 font-bold text-sm text-blue-400">
        <CheckCircle className="w-4 h-4" />
        <span>{label}</span>
      </div>
      <div className="text-[11px] text-slate-400 mt-1">Resultado final</div>
    </div>
  );
});
EndNode.displayName = 'EndNode';
