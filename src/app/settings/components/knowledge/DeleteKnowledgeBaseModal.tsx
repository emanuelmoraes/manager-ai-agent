"use client";

import React, { useState } from "react";
import { FiTrash2, FiAlertTriangle, FiX } from "react-icons/fi";
import type { KnowledgeBase } from "@/types/knowledge";
import { useCredentialGuard } from "@/components/auth/CredentialGuardProvider";

interface DeleteKnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  base: KnowledgeBase | null;
  onDeleted: (baseId: string) => void;
}

export function DeleteKnowledgeBaseModal({
  isOpen,
  onClose,
  base,
  onDeleted,
}: DeleteKnowledgeBaseModalProps) {
  const { guardAction } = useCredentialGuard();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !base) return null;

  const handleDelete = () => {
    guardAction(
      async () => {
        setLoading(true);
        setError(null);
        try {
          const res = await fetch(`/api/settings/knowledge/bases/${base.id}`, {
            method: "DELETE",
          });
          const data = await res.json();
          if (data.success) {
            onDeleted(base.id);
            onClose();
          } else {
            setError(data.error || "Erro ao excluir base de conhecimento.");
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Erro ao excluir base de conhecimento.";
          setError(message);
        } finally {
          setLoading(false);
        }
      },
      {
        title: "Excluir Base de Conhecimento",
        description: `Esta ação apagará permanentemente a base "${base.name}" e TODOS os documentos/fragmentos vetoriais vinculados a ela.`,
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
              <FiTrash2 size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 m-0">Excluir Base de Conhecimento</h2>
              <p className="text-xs text-slate-400 m-0">Confirmação de exclusão permanente</p>
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

        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
          <FiAlertTriangle className="text-red-400 shrink-0 mt-0.5" size={18} />
          <div className="text-xs text-red-200 leading-relaxed">
            Tem certeza que deseja excluir a base <strong>{base.name}</strong>?
            Todos os documentos e índices vetoriais associados a esta categoria serão apagados do Firestore.
          </div>
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
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="px-5 py-2 bg-red-600 hover:bg-red-500 rounded-xl text-white text-sm font-semibold border-none cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? "Excluindo..." : "Confirmar Exclusão"}
          </button>
        </div>
      </div>
    </div>
  );
}
