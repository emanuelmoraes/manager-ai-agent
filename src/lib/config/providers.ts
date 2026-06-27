import { adminDb } from '../firebase/admin';

export interface ProviderKeys {
  google?: string;
  openai?: string;
  anthropic?: string;
}

export async function getProviderKeys(): Promise<ProviderKeys> {
  try {
    if (!adminDb) return {};
    const keysDocRef = adminDb.collection('config').doc('keys');
    const doc = await keysDocRef.get();
    if (doc.exists) {
      return doc.data() as ProviderKeys;
    }
  } catch (error) {
    console.error('Erro ao ler chaves de API:', error);
  }
  return {};
}

/**
 * Salva as chaves no arquivo local.
 */
export async function saveProviderKeys(keys: ProviderKeys): Promise<void> {
  try {
    if (!adminDb) throw new Error("Firebase Admin não inicializado");
    const keysDocRef = adminDb.collection('config').doc('keys');
    const current = await getProviderKeys();
    const updated = { ...current, ...keys };
    
    // Remove chaves vazias
    for (const key in updated) {
      if (!updated[key as keyof ProviderKeys]) {
        delete updated[key as keyof ProviderKeys];
      }
    }

    await keysDocRef.set(updated, { merge: true });
  } catch (error) {
    console.error('Erro ao salvar chaves de API:', error);
    throw new Error('Falha ao salvar as configurações.');
  }
}
