import type { Timestamp } from 'firebase/firestore';

export type TokenStatus = 'active' | 'revoked';

export interface ApiTokenPayload {
  jti: string;
  agentId: string;
  sessionId: string;
  iat: number;
}

export interface ApiTokenRecord {
  id: string; // Corresponde ao claim jti do JWT (ex: "tok_1741170000_abc123")
  name: string; // Nome identificador amigável fornecido no Modal
  agentId: string; // ID do agente vinculado
  initialSessionId: string; // Sessão padrão inicial gerada para o token
  status: TokenStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastUsedAt: Timestamp | null;
  revokedAt: Timestamp | null;
}
