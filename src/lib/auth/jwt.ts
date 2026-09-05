import { SignJWT, jwtVerify } from 'jose';
import type { ApiTokenPayload } from '@/types/token';

const getJwtSecretKey = (): Uint8Array => {
  const secret = process.env.JWT_SECRET || 'manager-ai-jwt-default-secret-key-change-in-prod';
  return new TextEncoder().encode(secret);
};

/**
 * Assina um token JWT perpétuo (sem claim exp) contendo jti, agentId e sessionId.
 */
export async function signApiToken(payload: Omit<ApiTokenPayload, 'iat'>): Promise<string> {
  const secretKey = getJwtSecretKey();

  const token = await new SignJWT({
    agentId: payload.agentId,
    sessionId: payload.sessionId,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setJti(payload.jti)
    .setIssuedAt()
    .sign(secretKey);

  return token;
}

/**
 * Valida a assinatura criptográfica do JWT e extrai seu payload padronizado.
 * Retorna null se o token for inválido ou corrompido.
 */
export async function verifyApiToken(token: string): Promise<ApiTokenPayload | null> {
  try {
    const secretKey = getJwtSecretKey();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
    });

    if (!payload.jti || typeof payload.agentId !== 'string') {
      return null;
    }

    return {
      jti: payload.jti,
      agentId: payload.agentId as string,
      sessionId: typeof payload.sessionId === 'string' ? payload.sessionId : '',
      iat: payload.iat || 0,
    };
  } catch {
    return null;
  }
}
