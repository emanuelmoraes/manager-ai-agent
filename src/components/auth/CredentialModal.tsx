'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FiShield,
  FiLock,
  FiUser,
  FiClock,
  FiAlertCircle,
  FiX,
  FiLoader,
  FiCheckCircle,
} from 'react-icons/fi';
import {
  checkAdminStatusAction,
  setupAdminCredentialAction,
  verifyAdminCredentialAction,
} from '@/app/actions/auth';

export interface CredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export function CredentialModal({
  isOpen,
  onClose,
  onSuccess,
  title = 'Autorização Administrativa',
  description = 'Esta atividade é restrita e exige validação de credenciais de acesso.',
}: CredentialModalProps) {
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  const userInputRef = useRef<HTMLInputElement>(null);

  // Checa status de configuração inicial ao abrir
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setCheckingStatus(true);

      checkAdminStatusAction()
        .then((res) => {
          setIsConfigured(res.configured);
        })
        .catch((err) => {
          console.error('Erro ao verificar status do administrador:', err);
          setIsConfigured(true); // Fallback seguro
        })
        .finally(() => {
          setCheckingStatus(false);
        });
    }
  }, [isOpen]);

  // Foco automático no input ao abrir
  useEffect(() => {
    if (isOpen && !checkingStatus) {
      setTimeout(() => {
        userInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, checkingStatus]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);

    try {
      if (!isConfigured) {
        // Fluxo de Setup Inicial
        if (password !== confirmPassword) {
          setError('As senhas digitadas não coincidem.');
          setLoading(false);
          return;
        }

        const res = await setupAdminCredentialAction(username.trim(), password.trim());
        if (!res.success) {
          setError(res.error || 'Erro ao configurar credencial administrativa.');
          setLoading(false);
          return;
        }

        setIsConfigured(true);
        onSuccess();
        onClose();
      } else {
        // Fluxo de Validação Sudo
        const res = await verifyAdminCredentialAction(username.trim(), password.trim());
        if (!res.success) {
          setError(res.error || 'Credenciais inválidas.');
          setLoading(false);
          return;
        }

        onSuccess();
        onClose();
      }
    } catch (err: unknown) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : 'Falha na comunicação com o servidor de autenticação.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0b0817] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <FiShield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 m-0">
                {!isConfigured && !checkingStatus ? 'Configurar Credencial Mestra' : title}
              </h3>
              <p className="text-xs text-slate-400 m-0 mt-0.5">
                {!isConfigured && !checkingStatus
                  ? 'Definição do primeiro acesso administrativo'
                  : 'Modo Sudo Temporário'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {checkingStatus ? (
            <div className="py-8 flex flex-col items-center justify-center gap-3 text-slate-400">
              <FiLoader className="w-6 h-6 animate-spin text-violet-400" />
              <span className="text-xs">Verificando segurança do sistema...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="text-xs text-slate-300 leading-relaxed bg-white/[0.03] border border-white/5 rounded-xl p-3">
                {!isConfigured ? (
                  'Nenhuma credencial administrativa foi configurada ainda. Defina o usuário e a senha mestra para proteger as atividades sensíveis do sistema.'
                ) : (
                  description
                )}
              </div>

              {/* Banner de Sudo 2 Minutos */}
              {isConfigured && (
                <div className="flex items-center gap-2 text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                  <FiClock className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>
                    Após a validação, as permissões administrativas permanecerão ativas por 2 minutos.
                  </span>
                </div>
              )}

              {/* Erro */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
                  <FiAlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Usuário */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <FiUser className="w-3.5 h-3.5 text-slate-400" />
                  Usuário Administrativo
                </label>
                <input
                  ref={userInputRef}
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ex: admin"
                  disabled={loading}
                  autoComplete="username"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                />
              </div>

              {/* Senha */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <FiLock className="w-3.5 h-3.5 text-slate-400" />
                  Senha de Acesso
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  autoComplete={!isConfigured ? 'new-password' : 'current-password'}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                />
              </div>

              {/* Confirmação de Senha (apenas no setup inicial) */}
              {!isConfigured && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <FiCheckCircle className="w-3.5 h-3.5 text-slate-400" />
                    Confirmar Senha
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    autoComplete="new-password"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                  />
                </div>
              )}

              {/* Ações */}
              <div className="flex items-center justify-end gap-3 mt-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors border-none cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl transition-all shadow-lg shadow-violet-500/20 border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading && <FiLoader className="w-3.5 h-3.5 animate-spin" />}
                  {!isConfigured ? 'Salvar Credencial' : 'Autorizar Ação'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
