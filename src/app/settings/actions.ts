'use server';

import { getApiTokens, createApiToken, revokeApiToken } from '@/lib/firebase/tokens';
import type { ApiTokenRecord } from '@/types/token';

/**
 * Server Action para carregar os tokens internamente na tela de configurações.
 * Não expõe endpoints REST na API.
 */
export async function fetchTokensAction(): Promise<ApiTokenRecord[]> {
  const records = await getApiTokens();
  return JSON.parse(JSON.stringify(records)) as ApiTokenRecord[];
}

/**
 * Server Action para gerar um novo token internamente pela interface.
 * Mantém o segredo JWT_SECRET protegido no ambiente do servidor.
 */
export async function createTokenAction(
  name: string,
  agentId: string
): Promise<{ token: string; record: ApiTokenRecord }> {
  if (!name.trim()) throw new Error('O nome do token é obrigatório.');
  if (!agentId.trim()) throw new Error('A seleção de um Agente é obrigatória.');

  const result = await createApiToken(name.trim(), agentId.trim());
  return {
    token: result.token,
    record: JSON.parse(JSON.stringify(result.record)) as ApiTokenRecord,
  };
}

/**
 * Server Action para revogar um token internamente pela interface.
 */
export async function revokeTokenAction(id: string): Promise<{ success: boolean }> {
  if (!id.trim()) throw new Error('ID do token é obrigatório.');
  await revokeApiToken(id.trim());
  return { success: true };
}
