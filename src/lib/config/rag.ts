import { adminDb } from '../firebase/admin';

export interface RagConfig {
  searchLimit: number;
}

export async function getRagConfig(): Promise<RagConfig> {
  try {
    if (!adminDb) return { searchLimit: 5 }; // Default limit
    const ragDocRef = adminDb.collection('config').doc('rag');
    const doc = await ragDocRef.get();
    
    if (doc.exists) {
      const data = doc.data() as Partial<RagConfig>;
      return {
        searchLimit: data.searchLimit || 5,
      };
    }
  } catch (error) {
    console.error('Erro ao ler configuração do RAG:', error);
  }
  return { searchLimit: 5 }; // Fallback
}

export async function saveRagConfig(config: RagConfig): Promise<boolean> {
  try {
    if (!adminDb) return false;
    const ragDocRef = adminDb.collection('config').doc('rag');
    await ragDocRef.set(config, { merge: true });
    return true;
  } catch (error) {
    console.error('Erro ao salvar configuração do RAG:', error);
    return false;
  }
}
