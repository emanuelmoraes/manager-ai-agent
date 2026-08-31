import { Timestamp } from 'firebase-admin/firestore';
import { ai } from '../genkit';
import { adminDb } from '../firebase/admin';
import { ensureGeminiApiKey } from '../genkit/keys';
import { z } from 'genkit';

export interface AgentMemoryRecord {
  id: string;
  agentId: string;
  content: string;
  category: 'preference' | 'fact' | 'instruction' | 'context' | 'general';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  embedding?: number[];
  score?: number;
}

const getMemoryCollection = () => {
  if (!adminDb) throw new Error('Firebase Admin não inicializado.');
  return adminDb.collection('agent_memories');
};

/**
 * Calcula a similaridade por cosseno entre dois vetores de números
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
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
 * Salva uma nova memória de longo prazo para um agente específico.
 */
export async function saveAgentMemory(
  agentId: string,
  content: string,
  category: 'preference' | 'fact' | 'instruction' | 'context' | 'general' = 'general'
): Promise<AgentMemoryRecord> {
  if (!agentId || !content?.trim()) {
    throw new Error('agentId e content são obrigatórios para salvar memória.');
  }

  ensureGeminiApiKey();

  let embedding: number[] = [];
  try {
    const embeddingResult = await ai.embed({
      embedder: 'googleai/gemini-embedding-001',
      content: content.trim(),
    });
    if (embeddingResult && embeddingResult.length > 0) {
      embedding = embeddingResult[0].embedding;
    }
  } catch (error) {
    console.warn('[Memory] Não foi possível gerar embedding para a memória:', error);
  }

  const memoryId = `mem_${Math.random().toString(36).substring(2, 11)}`;
  const now = Timestamp.now();

  const newRecord: AgentMemoryRecord = {
    id: memoryId,
    agentId,
    content: content.trim(),
    category,
    createdAt: now,
    updatedAt: now,
    embedding,
  };

  try {
    await getMemoryCollection().doc(memoryId).set(newRecord);
  } catch (err: any) {
    console.error('[Memory] Erro ao gravar memória no Firestore:', err);
    throw err;
  }

  return newRecord;
}

/**
 * Retorna as memórias salvas de um agente.
 */
export async function getAgentMemories(agentId: string, limitCount: number = 50): Promise<AgentMemoryRecord[]> {
  if (!agentId) return [];

  try {
    const snapshot = await getMemoryCollection().where('agentId', '==', agentId).get();
    if (snapshot.empty) return [];

    const memories = snapshot.docs.map((doc: any) => doc.data() as AgentMemoryRecord);

    // Ordenação em memória para evitar exigência de índice composto no Firestore
    return memories
      .sort((a: AgentMemoryRecord, b: AgentMemoryRecord) => (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0) - (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0))
      .slice(0, limitCount);
  } catch (err) {
    console.error('[Memory] Erro ao recuperar memórias do agente:', err);
    return [];
  }
}

/**
 * Busca memórias relevantes de um agente com base em similaridade semântica.
 */
export async function searchAgentMemories(
  agentId: string,
  query: string,
  limitCount: number = 5,
  minScore: number = 0.4
): Promise<AgentMemoryRecord[]> {
  if (!agentId || !query?.trim()) return [];

  try {
    ensureGeminiApiKey();

    const snapshot = await getMemoryCollection().where('agentId', '==', agentId).get();
    if (snapshot.empty) return [];

    const records: AgentMemoryRecord[] = snapshot.docs.map((doc: any) => doc.data() as AgentMemoryRecord);

    let queryEmbedding: number[] = [];
    try {
      const embeddingResult = await ai.embed({
        embedder: 'googleai/gemini-embedding-001',
        content: query.trim(),
      });
      if (embeddingResult && embeddingResult.length > 0) {
        queryEmbedding = embeddingResult[0].embedding;
      }
    } catch (e) {
      console.warn('[Memory] Falha ao gerar embedding para query de busca:', e);
    }

    if (!queryEmbedding.length) {
      // Fallback para retorno das memórias mais recentes se embedding falhar
      return records
        .sort((a: AgentMemoryRecord, b: AgentMemoryRecord) => (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0) - (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0))
        .slice(0, limitCount);
    }

    const scored = records.map((rec: AgentMemoryRecord) => {
      const score = rec.embedding && rec.embedding.length > 0 ? cosineSimilarity(queryEmbedding, rec.embedding) : 0;
      return { ...rec, score };
    });

    return scored
      .filter((rec: AgentMemoryRecord) => (rec.score ?? 0) >= minScore)
      .sort((a: AgentMemoryRecord, b: AgentMemoryRecord) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, limitCount);
  } catch (err) {
    console.error('[Memory] Erro na busca semântica de memórias:', err);
    return [];
  }
}

/**
 * Cria as ferramentas Genkit dedicadas para o agente interagir com seu banco de memória isolado.
 */
export function createAgentMemoryTools(agentId: string) {
  const salvarMemoriaTool = ai.defineTool(
    {
      name: 'salvarMemoria',
      description:
        'Salva uma informação importante, preferência do usuário, instrução recorrente ou fato relevante na sua memória persistente de longo prazo para ser lembrada em conversas futuras.',
      inputSchema: z.object({
        conteudo: z.string().describe('O fato, aprendizado ou preferência que você deseja memorizar'),
        categoria: z
          .enum(['preference', 'fact', 'instruction', 'context', 'general'])
          .optional()
          .describe('Categoria da memória'),
      }),
      outputSchema: z.string(),
    },
    async ({ conteudo, categoria }) => {
      try {
        await saveAgentMemory(agentId, conteudo, categoria);
        return `Memória persistida com sucesso: "${conteudo}"`;
      } catch (err: any) {
        return `Erro ao salvar memória: ${err.message}`;
      }
    }
  );

  const consultarMemoriasTool = ai.defineTool(
    {
      name: 'consultarMemorias',
      description:
        'Pesquisa em seu banco de memórias de longo prazo por fatos passados, preferências ou informações lembradas anteriormente.',
      inputSchema: z.object({
        termoBusca: z.string().describe('Termo ou contexto a ser pesquisado nas suas memórias'),
      }),
      outputSchema: z.string(),
    },
    async ({ termoBusca }) => {
      try {
        const results = await searchAgentMemories(agentId, termoBusca, 5, 0.35);
        if (results.length === 0) {
          return 'Nenhuma memória relevante encontrada para este termo.';
        }
        return results
          .map((m) => `[Memória (${m.category}) - Relevância: ${((m.score ?? 1) * 100).toFixed(0)}%]: ${m.content}`)
          .join('\n');
      } catch (err: any) {
        return `Erro ao consultar memórias: ${err.message}`;
      }
    }
  );

  return { salvarMemoriaTool, consultarMemoriasTool };
}
