import fs from 'fs';
import path from 'path';
import { ai } from '../genkit';

export interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  embedding: number[];
}

const knowledgePath = path.join(process.cwd(), 'src', 'lib', 'config', 'knowledge.json');

/**
 * Retorna os documentos da base de conhecimento sem a propriedade embedding para manter leve na transmissão
 */
export function getKnowledge(): Omit<Document, 'embedding'>[] {
  try {
    if (!fs.existsSync(knowledgePath)) {
      return [];
    }
    const data = fs.readFileSync(knowledgePath, 'utf8');
    const docs: Document[] = JSON.parse(data);
    return docs.map(({ embedding, ...doc }) => doc);
  } catch (err) {
    console.error('Erro ao ler base de conhecimento:', err);
    return [];
  }
}

/**
 * Retorna os documentos completos incluindo os embeddings
 */
export function getKnowledgeWithEmbeddings(): Document[] {
  try {
    if (!fs.existsSync(knowledgePath)) {
      return [];
    }
    const data = fs.readFileSync(knowledgePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Erro ao ler base de conhecimento com embeddings:', err);
    return [];
  }
}

/**
 * Salva a lista de documentos no arquivo local
 */
function saveKnowledge(docs: Document[]): void {
  try {
    const dir = path.dirname(knowledgePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(knowledgePath, JSON.stringify(docs, null, 2), 'utf8');
  } catch (err) {
    console.error('Erro ao salvar base de conhecimento:', err);
  }
}

/**
 * Adiciona um novo documento na base de dados, gerando seu embedding
 */
export async function addDocument(title: string, content: string): Promise<Omit<Document, 'embedding'>> {
  // 1. Gera o embedding usando a instância do Genkit
  const embeddingResult = await ai.embed({
    embedder: 'googleai/text-embedding-004',
    content: content,
  });

  if (!embeddingResult || embeddingResult.length === 0) {
    throw new Error('Nenhum embedding gerado pelo provedor de IA.');
  }
  const embedding = embeddingResult[0].embedding;

  const newDoc: Document = {
    id: Math.random().toString(36).substring(2, 9),
    title,
    content,
    createdAt: new Date().toISOString(),
    embedding,
  };

  const docs = getKnowledgeWithEmbeddings();
  docs.push(newDoc);
  saveKnowledge(docs);

  // Retorna o documento sem o embedding
  const { embedding: _, ...result } = newDoc;
  return result;
}

/**
 * Remove um documento pelo ID
 */
export function deleteDocument(id: string): boolean {
  const docs = getKnowledgeWithEmbeddings();
  const initialLength = docs.length;
  const filteredDocs = docs.filter((doc) => doc.id !== id);

  if (filteredDocs.length === initialLength) {
    return false; // Documento não encontrado
  }

  saveKnowledge(filteredDocs);
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

/**
 * Realiza pesquisa semântica por similaridade de cosseno na base de conhecimento local
 */
export async function searchKnowledge(query: string, limit: number = 3, minScore: number = 0.5): Promise<SearchResult[]> {
  const docs = getKnowledgeWithEmbeddings();
  if (docs.length === 0) {
    return [];
  }

  // 1. Gerar o embedding da query
  const embeddingResult = await ai.embed({
    embedder: 'googleai/text-embedding-004',
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
    .slice(0, limit);
}
