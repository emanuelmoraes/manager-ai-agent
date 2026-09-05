'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { WorkflowDefinition } from '@/types/workflow';
import { FiZap, FiTrash2 } from 'react-icons/fi';

export default function WorkflowsListPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkflows = async () => {
    try {
      const res = await fetch('/api/workflows');
      const data = await res.json();
      if (data.success) {
        setWorkflows(data.data || []);
      }
    } catch (err) {
      console.error('Erro ao carregar workflows:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleCreateNew = () => {
    const newId = `wf_${Date.now()}`;
    router.push(`/workspace/workflows/builder/${newId}`);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Deseja realmente excluir este workflow?')) return;

    try {
      await fetch(`/api/workflows?id=${id}`, { method: 'DELETE' });
      setWorkflows((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      console.error('Erro ao excluir workflow:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0712] text-slate-50 flex flex-col">
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 md:px-8 md:py-6 border-b border-white/5 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-50 m-0">
            Workflows & Fluxos de IA
          </h1>
          <p className="text-xs md:text-sm text-slate-400 m-0 mt-1">
            Crie e gerencie fluxos de execução sequenciais, paralelos e condicionais integrando múltiplos agentes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/workspace"
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-200 text-xs md:text-sm font-semibold transition-colors hover:bg-white/10 no-underline"
          >
            Voltar ao Workspace
          </Link>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-br from-violet-500 to-violet-700 text-white rounded-lg text-xs md:text-sm font-bold shadow-lg hover:scale-105 transition-all cursor-pointer border-none"
          >
            + Novo Workflow Visual
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8">
        {loading ? (
          <div className="text-slate-400 text-center py-12">Carregando workflows...</div>
        ) : workflows.length === 0 ? (
          <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-8 md:p-12 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <FiZap size={28} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-50 m-0">Nenhum Workflow Encontrado</h3>
              <p className="text-slate-400 text-sm mt-1 max-w-md">
                Comece criando seu primeiro fluxo de trabalho no construtor visual drag-and-drop.
              </p>
            </div>
            <button
              onClick={handleCreateNew}
              className="mt-2 px-6 py-3 bg-violet-600 text-white rounded-xl font-bold text-sm hover:bg-violet-500 transition-colors border-none cursor-pointer"
            >
              Criar Meu Primeiro Workflow
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflows.map((wf) => (
              <div
                key={wf.id}
                onClick={() => router.push(`/workspace/workflows/builder/${wf.id}`)}
                className="bg-white/5 border border-white/10 hover:border-violet-500/50 rounded-2xl p-6 flex flex-col justify-between gap-4 cursor-pointer transition-all hover:bg-white/[0.07] group"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <h3 className="text-base font-bold text-slate-50 group-hover:text-violet-300 transition-colors m-0">
                      {wf.name}
                    </h3>
                    <button
                      onClick={(e) => handleDelete(wf.id, e)}
                      title="Excluir Workflow"
                      className="text-slate-500 hover:text-rose-400 transition-colors bg-transparent border-none cursor-pointer p-1"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {wf.description || 'Sem descrição.'}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-4">
                  <span className="text-[11px] text-slate-500">
                    Nós: {wf.nodes?.length || 0} | Arestas: {wf.edges?.length || 0}
                  </span>
                  <span className="text-xs font-semibold text-violet-400 group-hover:translate-x-1 transition-transform">
                    Editar Fluxo ↗
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
