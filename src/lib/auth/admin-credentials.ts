import crypto from 'crypto';
import { promisify } from 'util';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';

const scryptAsync = promisify(crypto.scrypt);

export interface AdminCredentialRecord {
  username: string;
  passwordHash: string;
  salt: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

const COLLECTION_NAME = 'system_security';
const DOCUMENT_NAME = 'credentials';

function getDocRef() {
  if (!adminDb) {
    throw new Error('Firebase Admin não está inicializado no servidor.');
  }
  return adminDb.collection(COLLECTION_NAME).doc(DOCUMENT_NAME);
}

/**
 * Gera o hash criptográfico seguro utilizando scrypt nativo do Node.js
 */
async function generateHash(password: string, salt: string): Promise<string> {
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return derivedKey.toString('hex');
}

/**
 * Realiza comparação em tempo constante para mitigar timing attacks
 */
function timingSafeCheck(hashA: string, hashB: string): boolean {
  try {
    const bufA = Buffer.from(hashA, 'hex');
    const bufB = Buffer.from(hashB, 'hex');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Verifica se já existe uma credencial administrativa configurada no Firestore
 */
export async function isCredentialConfigured(): Promise<boolean> {
  try {
    const docRef = getDocRef();
    const snap = await docRef.get();
    return snap.exists;
  } catch (err) {
    console.error('[admin-credentials] Erro ao checar credenciais:', err);
    return false;
  }
}

/**
 * Configuração inicial (bootstrap) da credencial administrativa mestra.
 * Apenas permite cadastro se o documento ainda não existir.
 */
export async function setupInitialCredential(
  username: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const cleanUser = username.trim();
  const cleanPass = password.trim();

  if (!cleanUser || cleanUser.length < 3) {
    return { success: false, error: 'O usuário deve ter ao menos 3 caracteres.' };
  }
  if (!cleanPass || cleanPass.length < 6) {
    return { success: false, error: 'A senha deve ter ao menos 6 caracteres.' };
  }

  try {
    const docRef = getDocRef();
    const snap = await docRef.get();

    if (snap.exists) {
      return { success: false, error: 'Credencial administrativa já configurada no sistema.' };
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = await generateHash(cleanPass, salt);
    const now = Timestamp.now();

    const record: AdminCredentialRecord = {
      username: cleanUser,
      passwordHash,
      salt,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(record);
    return { success: true };
  } catch (err: unknown) {
    console.error('[admin-credentials] Erro ao cadastrar credencial:', err);
    const message = err instanceof Error ? err.message : 'Falha ao salvar credencial.';
    return { success: false, error: message };
  }
}

/**
 * Valida o usuário e a senha informados contra os dados criptografados no Firestore
 */
export async function verifyAdminCredential(
  username: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const cleanUser = username.trim();
  const cleanPass = password.trim();

  if (!cleanUser || !cleanPass) {
    return { success: false, error: 'Usuário e senha são obrigatórios.' };
  }

  try {
    const docRef = getDocRef();
    const snap = await docRef.get();

    if (!snap.exists) {
      return { success: false, error: 'Nenhuma credencial administrativa configurada no sistema.' };
    }

    const data = snap.data() as AdminCredentialRecord;

    // Compara o nome de usuário (case-insensitive para consistência)
    if (data.username.toLowerCase() !== cleanUser.toLowerCase()) {
      return { success: false, error: 'Credenciais inválidas.' };
    }

    // Recalcula o hash da senha fornecida com o salt persistido
    const computedHash = await generateHash(cleanPass, data.salt);
    const isValid = timingSafeCheck(computedHash, data.passwordHash);

    if (!isValid) {
      return { success: false, error: 'Credenciais inválidas.' };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error('[admin-credentials] Erro ao verificar credenciais:', err);
    const message = err instanceof Error ? err.message : 'Falha na validação das credenciais.';
    return { success: false, error: message };
  }
}
