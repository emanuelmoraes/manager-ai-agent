import { ai } from '../genkit';
import { adminDb } from '../firebase/admin';
import { ensureGeminiApiKey } from '../genkit/keys';
import { Timestamp } from 'firebase-admin/firestore';
import type { KnowledgeBase } from '@/types/knowledge';
import { getRagConfig } from '../config/rag';

export interface Document {
  id: string;
  knowledgeBaseId: string;
  title: string;
  content: string;
  createdAt: Timestamp;
  embedding: number[];
  parentId?: string;
  chunkIndex?: number;
}

const getKnowledgeBasesCollection = () => {
  if (!adminDb) throw new Error("Firebase Admin não inicializado");
  return adminDb.collection('knowledge_bases');
};

const getKnowledgeCollection = () => {
  if (!adminDb) throw new Error("Firebase Admin não inicializado");
  return adminDb.collection('knowledge');
};

// ==========================================
// OPERAÇÕES DE BASES DE CONHECIMENTO (CRUD)
// ==========================================

export async function getKnowledgeBases(): Promise<KnowledgeBase[]> {
  try {
    const snapshot = await getKnowledgeBasesCollection().orderBy('name', 'asc').get();
    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    })) as KnowledgeBase[];
  } catch (err) {
    console.error('Erro ao listar bases de conhecimento:', err);
    try {
      const fallbackSnapshot = await getKnowledgeBasesCollection().get();
      return fallbackSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      })) as KnowledgeBase[];
    } catch {
      return [];
    }
  }
}

export async function createKnowledgeBase(
  name: string,
  description?: string,
  color?: string
): Promise<KnowledgeBase> {
  if (!name.trim()) throw new Error('O nome da base de conhecimento é obrigatório.');

  const now = Timestamp.now();
  const id = `kb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const newBase: KnowledgeBase = {
    id,
    name: name.trim(),
    description: description?.trim() || '',
    color: color || '#8b5cf6',
    createdAt: now,
    updatedAt: now,
  };

  await getKnowledgeBasesCollection().doc(id).set(newBase);
  return newBase;
}

export async function updateKnowledgeBase(
  id: string,
  name: string,
  description?: string,
  color?: string
): Promise<KnowledgeBase> {
  if (!id.trim()) throw new Error('ID da base é obrigatório.');
  if (!name.trim()) throw new Error('O nome da base de conhecimento é obrigatório.');

  const docRef = getKnowledgeBasesCollection().doc(id);
  const snap = await docRef.get();
  if (!snap.exists) {
    throw new Error('Base de conhecimento não encontrada.');
  }

  const existing = snap.data() as KnowledgeBase;
  const updated: KnowledgeBase = {
    ...existing,
    name: name.trim(),
    description: description !== undefined ? description.trim() : existing.description,
    color: color || existing.color || '#8b5cf6',
    updatedAt: Timestamp.now(),
  };

  await docRef.set(updated, { merge: true });
  return updated;
}

export async function deleteKnowledgeBase(id: string): Promise<boolean> {
  if (!id.trim()) throw new Error('ID da base é obrigatório.');

  const baseRef = getKnowledgeBasesCollection().doc(id);
  const baseSnap = await baseRef.get();
  if (!baseSnap.exists) {
    return false;
  }

  // Deleta todos os documentos vinculados à base em lote
  const docsSnapshot = await getKnowledgeCollection().where('knowledgeBaseId', '==', id).get();
  if (!docsSnapshot.empty) {
    const batch = adminDb.batch();
    docsSnapshot.docs.forEach((doc: any) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }

  await baseRef.delete();
  return true;
}

// ==========================================
// OPERAÇÕES DE DOCUMENTOS INDEXADOS
// ==========================================

export async function getKnowledge(knowledgeBaseId?: string): Promise<Omit<Document, 'embedding'>[]> {
  try {
    let query: any = getKnowledgeCollection();
    if (knowledgeBaseId) {
      query = query.where('knowledgeBaseId', '==', knowledgeBaseId);
    }

    const snapshot = await query.select('title', 'content', 'createdAt', 'parentId', 'knowledgeBaseId').get();
    const grouped = new Map<string, any>();

    snapshot.docs.forEach((doc: any) => {
      const data = doc.data();
      const pId = data.parentId || doc.id;

      if (!grouped.has(pId)) {
        grouped.set(pId, {
          id: pId,
          knowledgeBaseId: data.knowledgeBaseId || '',
          title: data.title.replace(/ \(Parte \d+\)$/, ''),
          content: data.content,
          createdAt: data.createdAt,
        });
      }
    });

    return Array.from(grouped.values());
  } catch (err) {
    console.error('Erro ao ler base de conhecimento:', err);
    return [];
  }
}

export async function getKnowledgeWithEmbeddings(knowledgeBaseId?: string): Promise<Document[]> {
  try {
    let query: any = getKnowledgeCollection();
    if (knowledgeBaseId) {
      query = query.where('knowledgeBaseId', '==', knowledgeBaseId);
    }
    const snapshot = await query.get();
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Document));
  } catch (err) {
    console.error('Erro ao ler base de conhecimento com embeddings:', err);
    return [];
  }
}

function chunkText(text: string, maxChunkSize: number = 1500): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split('\n\n');
  let currentChunk = '';

  for (const p of paragraphs) {
    if ((currentChunk + p).length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
    currentChunk += p + '\n\n';
  }
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  return chunks;
}

export async function addDocument(
  title: string,
  content: string,
  knowledgeBaseId: string
): Promise<Omit<Document, 'embedding'>> {
  if (!knowledgeBaseId || !knowledgeBaseId.trim()) {
    throw new Error('A identificação da base de conhecimento (knowledgeBaseId) é obrigatória.');
  }

  ensureGeminiApiKey();

  const parentId = Math.random().toString(36).substring(2, 9);
  const createdAt = Timestamp.now();

  const chunks = chunkText(content, 1500);
  let firstDoc: Omit<Document, 'embedding'> | null = null;

  for (let i = 0; i < chunks.length; i++) {
    const chunkContent = chunks[i];
    const chunkTitle = chunks.length > 1 ? `${title} (Parte ${i + 1})` : title;

    const embeddingResult = await ai.embed({
      embedder: 'googleai/gemini-embedding-001',
      content: chunkContent,
    });

    if (!embeddingResult || embeddingResult.length === 0) {
      console.warn(`Nenhum embedding gerado para o chunk ${i}. Pulando...`);
      continue;
    }

    const embedding = embeddingResult[0].embedding;
    const newDoc: Document = {
      id: `${parentId}_${i}`,
      knowledgeBaseId: knowledgeBaseId.trim(),
      parentId,
      chunkIndex: i,
      title: chunkTitle,
      content: chunkContent,
      createdAt,
      embedding,
    };

    await getKnowledgeCollection().doc(newDoc.id).set(newDoc);

    if (i === 0) {
      const { embedding: _, ...result } = newDoc;
      firstDoc = { ...result, id: parentId, title };
    }
  }

  if (!firstDoc) throw new Error('Falha ao processar e salvar o documento.');
  return firstDoc;
}

export async function deleteDocument(id: string): Promise<boolean> {
  const snapshot = await getKnowledgeCollection().where('parentId', '==', id).get();

  if (!snapshot.empty) {
    const batch = adminDb.batch();
    snapshot.docs.forEach((doc: any) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    return true;
  }

  const docRef = getKnowledgeCollection().doc(id);
  const doc = await docRef.get();
  if (!doc.exists) {
    return false;
  }

  await docRef.delete();
  return true;
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export interface SearchResult {
  id: string;
  knowledgeBaseId: string;
  title: string;
  content: string;
  createdAt: Timestamp;
  score: number;
}

/**
 * Realiza pesquisa semântica por similaridade de cosseno na base de conhecimento estrita informada
 */
export async function searchKnowledge(
  query: string,
  knowledgeBaseId: string,
  customLimit?: number,
  minScore: number = 0.45
): Promise<SearchResult[]> {
  if (!knowledgeBaseId || !knowledgeBaseId.trim()) {
    return [];
  }

  ensureGeminiApiKey();

  const docs = await getKnowledgeWithEmbeddings(knowledgeBaseId.trim());
  if (docs.length === 0) {
    return [];
  }

  let finalLimit = customLimit;
  if (!finalLimit) {
    const ragConfig = await getRagConfig();
    finalLimit = ragConfig.searchLimit || 5;
  }

  const embeddingResult = await ai.embed({
    embedder: 'googleai/gemini-embedding-001',
    content: query,
  });
  if (!embeddingResult || embeddingResult.length === 0) {
    return [];
  }
  const queryEmbedding = embeddingResult[0].embedding;

  const scoredDocs = docs.map((doc) => {
    const score = cosineSimilarity(queryEmbedding, doc.embedding);
    return {
      id: doc.id,
      knowledgeBaseId: doc.knowledgeBaseId,
      title: doc.title,
      content: doc.content,
      createdAt: doc.createdAt,
      score,
    };
  });

  return scoredDocs
    .filter((doc) => doc.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, finalLimit);
}
