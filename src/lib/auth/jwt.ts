import { SignJWT, jwtVerify } from 'jose';
import type { ApiTokenPayload } from '@/types/token';

const getJwtSecretKey = (): Uint8Array => {
  const secret = process.env.JWT_SECRET;
  if (!secret || !secret.trim()) {
    throw new Error(
      'A variável de ambiente JWT_SECRET não está configurada no servidor. Configure a chave JWT_SECRET no arquivo .env.local para permitir a emissão e validação de tokens de API.'
    );
  }
  return new TextEncoder().encode(secret.trim());
};

/**
 * Assina um token JWT perpétuo (sem claim exp) contendo jti, agentId e sessionId.
 * Dispara exceção caso a variável JWT_SECRET não esteja configurada no ambiente.
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
 * Dispara exceção caso a variável JWT_SECRET não esteja configurada no ambiente.
 * Retorna null exclusivamente se o token for criptograficamente inválido ou corrompido.
 */
export async function verifyApiToken(token: string): Promise<ApiTokenPayload | null> {
  const secretKey = getJwtSecretKey();

  try {
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
