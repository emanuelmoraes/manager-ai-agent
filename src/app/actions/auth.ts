'use server';

import {
  isCredentialConfigured,
  setupInitialCredential,
  verifyAdminCredential,
} from '@/lib/auth/admin-credentials';

/**
 * Checa se as credenciais mestras administrativas já estão cadastradas no Firestore
 */
export async function checkAdminStatusAction(): Promise<{ configured: boolean }> {
  const configured = await isCredentialConfigured();
  return { configured };
}

/**
 * Configuração inicial (bootstrap) da credencial mestra administrativa
 */
export async function setupAdminCredentialAction(
  username: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  return await setupInitialCredential(username, password);
}

/**
 * Validação de credenciais para desbloqueio da sessão de sudo (2 minutos)
 */
export async function verifyAdminCredentialAction(
  username: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  return await verifyAdminCredential(username, password);
}
