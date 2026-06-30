import { ai } from '../genkit';
import { adminDb } from '../firebase/admin';

export interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  embedding: number[];
  parentId?: string;
  chunkIndex?: number;
}

const getKnowledgeCollection = () => {
  if (!adminDb) throw new Error("Firebase Admin não inicializado");
  return adminDb.collection('knowledge');
};

/**
 * Retorna os documentos da base de conhecimento sem a propriedade embedding para manter leve na transmissão
 */
export async function getKnowledge(): Promise<Omit<Document, 'embedding'>[]> {
  try {
    const snapshot = await getKnowledgeCollection().select('title', 'content', 'createdAt', 'parentId').get();
    
    // Agrupa por parentId para mostrar apenas 1 item por documento na UI
    const grouped = new Map<string, any>();
    
    snapshot.docs.forEach((doc: any) => {
      const data = doc.data();
      const pId = data.parentId || doc.id; // Fallback para documentos antigos sem parentId
      
      if (!grouped.has(pId)) {
        grouped.set(pId, {
          id: pId, // Usamos o parentId como ID para a UI poder deletar tudo depois
          title: data.title.replace(/ \(Parte \d+\)$/, ''), // Remove sufixo se existir
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

/**
 * Retorna os documentos completos incluindo os embeddings
 */
export async function getKnowledgeWithEmbeddings(): Promise<Document[]> {
  try {
    const snapshot = await getKnowledgeCollection().get();
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Document));
  } catch (err) {
    console.error('Erro ao ler base de conhecimento com embeddings:', err);
    return [];
  }
}

/**
 * Salva a lista de documentos no arquivo local (substituindo no Firebase seria complexo, usaremos delete/add)
 */
async function saveKnowledge(docs: Document[]): Promise<void> {
  // Esse método é legado para quem reescrevia todo o array. Vamos evitar usar.
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

/**
 * Adiciona um novo documento na base de dados, gerando seu embedding
 */
export async function addDocument(title: string, content: string): Promise<Omit<Document, 'embedding'>> {
  const parentId = Math.random().toString(36).substring(2, 9);
  const createdAt = new Date().toISOString();
  
  // 1. Quebra o documento em chunks
  const chunks = chunkText(content, 1500);
  let firstDoc: Omit<Document, 'embedding'> | null = null;
  
  for (let i = 0; i < chunks.length; i++) {
    const chunkContent = chunks[i];
    const chunkTitle = chunks.length > 1 ? `${title} (Parte ${i+1})` : title;
    
    // 2. Gera o embedding usando a instância do Genkit
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
      firstDoc = { ...result, id: parentId, title }; // Return generic data for UI
    }
  }

  if (!firstDoc) throw new Error('Falha ao processar e salvar o documento.');
  return firstDoc;
}

/**
 * Remove um documento pelo ID
 */
export async function deleteDocument(id: string): Promise<boolean> {
  // Busca e deleta todos os chunks com o parentId igual ao id passado
  const snapshot = await getKnowledgeCollection().where('parentId', '==', id).get();
  
  if (!snapshot.empty) {
    const batch = adminDb.batch();
    snapshot.docs.forEach((doc: any) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    return true;
  }
  
  // Fallback para documentos antigos
  const docRef = getKnowledgeCollection().doc(id);
  const doc = await docRef.get();
  if (!doc.exists) {
    return false; // Documento não encontrado
  }

  await docRef.delete();
  return true;
}

/**
 * Calcula a similaridade por cosseno entre dois vetores de números
 */
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

/**
 * Interface para os resultados de busca semântica
 */
export interface SearchResult {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  score: number;
}

import { getRagConfig } from '../config/rag';

/**
 * Realiza pesquisa semântica por similaridade de cosseno na base de conhecimento local
 */
export async function searchKnowledge(query: string, customLimit?: number, minScore: number = 0.45): Promise<SearchResult[]> {
  const docs = await getKnowledgeWithEmbeddings();
  if (docs.length === 0) {
    return [];
  }
  
  // Buscar limite global se não for passado um customizado fixo
  let finalLimit = customLimit;
  if (!finalLimit) {
    const ragConfig = await getRagConfig();
    finalLimit = ragConfig.searchLimit || 5;
  }

  // 1. Gerar o embedding da query
  const embeddingResult = await ai.embed({
    embedder: 'googleai/gemini-embedding-001',
    content: query,
  });
  if (!embeddingResult || embeddingResult.length === 0) {
    return [];
  }
  const queryEmbedding = embeddingResult[0].embedding;

  // 2. Calcular a similaridade contra todos os documentos indexados
  const scoredDocs = docs.map((doc) => {
    const score = cosineSimilarity(queryEmbedding, doc.embedding);
    return {
      id: doc.id,
      title: doc.title,
      content: doc.content,
      createdAt: doc.createdAt,
      score,
    };
  });

  // 3. Filtrar pelo score mínimo e ordenar pelo mais similar
  return scoredDocs
    .filter((doc) => doc.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, finalLimit);
}
