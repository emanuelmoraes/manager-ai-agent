'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CredentialModal } from './CredentialModal';

interface GuardActionOptions {
  title?: string;
  description?: string;
}

interface CredentialGuardContextType {
  guardAction: (action: () => Promise<void> | void, options?: GuardActionOptions) => void;
  isSudoActive: boolean;
  remainingSeconds: number;
}

const CredentialGuardContext = createContext<CredentialGuardContextType | undefined>(undefined);

const SUDO_DURATION_MS = 2 * 60 * 1000; // 2 minutos (120 segundos)

export function CredentialGuardProvider({ children }: { children: React.ReactNode }) {
  const [sudoExpiresAt, setSudoExpiresAt] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState<string | undefined>(undefined);
  const [modalDescription, setModalDescription] = useState<string | undefined>(undefined);
  const [pendingAction, setPendingAction] = useState<(() => Promise<void> | void) | null>(null);

  // Checagem de validade da sessão
  const isSudoActive = sudoExpiresAt !== null && Date.now() < sudoExpiresAt;

  // Atualização em tempo real dos segundos restantes
  useEffect(() => {
    if (!sudoExpiresAt) {
      setRemainingSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((sudoExpiresAt - Date.now()) / 1000));
      setRemainingSeconds(remaining);

      if (remaining === 0) {
        setSudoExpiresAt(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sudoExpiresAt]);

  const guardAction = useCallback(
    (action: () => Promise<void> | void, options?: GuardActionOptions) => {
      if (sudoExpiresAt && Date.now() < sudoExpiresAt) {
        // Sessão Sudo ainda válida: executa diretamente sem abrir modal
        action();
        return;
      }

      // Sessão expirada ou inexistente: solicita credenciais
      setPendingAction(() => action);
      setModalTitle(options?.title);
      setModalDescription(options?.description);
      setIsModalOpen(true);
    },
    [sudoExpiresAt]
  );

  const handleSuccess = useCallback(() => {
    // Registra expiração para 2 minutos no futuro
    setSudoExpiresAt(Date.now() + SUDO_DURATION_MS);

    // Executa a ação retida
    if (pendingAction) {
      try {
        pendingAction();
      } catch (err) {
        console.error('[CredentialGuard] Erro ao executar ação protegida:', err);
      }
      setPendingAction(null);
    }
  }, [pendingAction]);

  const handleClose = useCallback(() => {
    setIsModalOpen(false);
    setPendingAction(null);
  }, []);

  return (
    <CredentialGuardContext.Provider value={{ guardAction, isSudoActive, remainingSeconds }}>
      {children}
      <CredentialModal
        isOpen={isModalOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
        title={modalTitle}
        description={modalDescription}
      />
    </CredentialGuardContext.Provider>
  );
}

export function useCredentialGuard() {
  const context = useContext(CredentialGuardContext);
  if (!context) {
    throw new Error('useCredentialGuard deve ser utilizado dentro de um CredentialGuardProvider.');
  }
  return context;
}
