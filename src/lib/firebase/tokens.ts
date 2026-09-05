import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { signApiToken } from '@/lib/auth/jwt';
import type { ApiTokenRecord } from '@/types/token';

const COLLECTION_NAME = 'api_tokens';

/**
 * Busca todos os tokens de API cadastrados no sistema
 */
export async function getApiTokens(): Promise<ApiTokenRecord[]> {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as ApiTokenRecord[];
  } catch {
    // Fallback sem ordenação caso o índice de createdAt ainda não esteja criado
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as ApiTokenRecord[];
  }
}

/**
 * Busca um registro de token pelo seu ID (jti)
 */
export async function getApiTokenRecord(id: string): Promise<ApiTokenRecord | null> {
  const docRef = doc(collection(db, COLLECTION_NAME), id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as ApiTokenRecord;
}

/**
 * Cria um novo token de API vinculado a um agente específico
 */
export async function createApiToken(
  name: string,
  agentId: string
): Promise<{ token: string; record: ApiTokenRecord }> {
  if (!name.trim()) throw new Error('O nome do token é obrigatório.');
  if (!agentId.trim()) throw new Error('O agente vinculado é obrigatório.');

  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 9);
  const jti = `tok_${timestamp}_${randomSuffix}`;
  const initialSessionId = `session_${timestamp}_${randomSuffix}`;

  const now = Timestamp.now();

  const record: ApiTokenRecord = {
    id: jti,
    name: name.trim(),
    agentId: agentId.trim(),
    initialSessionId,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    lastUsedAt: null,
    revokedAt: null,
  };

  // Salva no Firestore
  const docRef = doc(collection(db, COLLECTION_NAME), jti);
  await setDoc(docRef, record);

  // Assina o JWT perpétuo
  const token = await signApiToken({
    jti,
    agentId: record.agentId,
    sessionId: record.initialSessionId,
  });

  return { token, record };
}

/**
 * Revoga um token de API existente
 */
export async function revokeApiToken(id: string): Promise<void> {
  const docRef = doc(collection(db, COLLECTION_NAME), id);
  const now = Timestamp.now();

  await updateDoc(docRef, {
    status: 'revoked',
    revokedAt: now,
    updatedAt: now,
  });
}

/**
 * Atualiza o timestamp de último uso do token
 */
export async function updateApiTokenLastUsed(id: string): Promise<void> {
  try {
    const docRef = doc(collection(db, COLLECTION_NAME), id);
    await updateDoc(docRef, {
      lastUsedAt: Timestamp.now(),
    });
  } catch (error) {
    console.warn('[tokens] Falha ao atualizar lastUsedAt do token:', error);
  }
}
