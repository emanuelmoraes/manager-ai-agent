"use client";

import React, { useState, useEffect } from "react";
import { FiEdit3, FiX } from "react-icons/fi";
import type { KnowledgeBase } from "@/types/knowledge";
import { useCredentialGuard } from "@/components/auth/CredentialGuardProvider";

interface UpdateKnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  base: KnowledgeBase | null;
  onUpdated: (base: KnowledgeBase) => void;
}

export function UpdateKnowledgeBaseModal({
  isOpen,
  onClose,
  base,
  onUpdated,
}: UpdateKnowledgeBaseModalProps) {
  const { guardAction } = useCredentialGuard();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (base) {
      setName(base.name);
      setDescription(base.description || "");
      setError(null);
    }
  }, [base]);

  if (!isOpen || !base) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("O nome da base é obrigatório.");
      return;
    }

    guardAction(
      async () => {
        setLoading(true);
        setError(null);

        try {
          const res = await fetch(`/api/settings/knowledge/bases/${base.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: name.trim(),
              description: description.trim(),
            }),
          });

          const data = await res.json();
          if (data.success && data.data) {
            onUpdated(data.data as KnowledgeBase);
            onClose();
          } else {
            setError(data.error || "Erro ao atualizar base de conhecimento.");
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Erro de conexão ao atualizar base.";
          setError(message);
        } finally {
          setLoading(false);
        }
      },
      {
        title: "Editar Base de Conhecimento",
        description: "A alteração de parâmetros e diretrizes da base de conhecimento requer autorização administrativa.",
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center">
              <FiEdit3 size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 m-0">Editar Base de Conhecimento</h2>
              <p className="text-xs text-slate-400 m-0">Atualize os dados e a descrição</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-slate-200 bg-transparent border-none cursor-pointer p-1"
          >
            <FiX size={20} />
          </button>
        </div>

        {error && (
          <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300">Nome da Base *</label>
            <input
              type="text"
              placeholder="Ex: Vendas"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-100 text-sm outline-none focus:border-violet-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300">Descrição</label>
            <textarea
              placeholder="Descreva o propósito desta base..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-100 text-sm outline-none focus:border-violet-500 resize-none font-inherit"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-transparent border border-white/10 rounded-xl text-slate-300 text-sm font-medium hover:bg-white/5 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl text-white text-sm font-semibold border-none cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
