import { NextRequest } from 'next/server';
import { doc, collection, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { verifyApiToken } from '@/lib/auth/jwt';
import { getApiTokenRecord, updateApiTokenLastUsed } from '@/lib/firebase/tokens';
import { getProviderKeys } from '@/lib/config/providers';
import { ai } from '@/lib/genkit';
import { getMcpTools } from '@/lib/mcp/registry';
import { searchKnowledge } from '@/lib/rag/store';
import { createAgentMemoryTools, searchAgentMemories } from '@/lib/memory/store';
import { handleCorsPreflight, jsonResponseWithCors } from '@/lib/api/cors';
import { z } from 'genkit';
import type { Agent } from '@/app/workspace/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const consultarBaseConhecimentoTool = ai.defineTool(
  {
    name: 'consultarBaseConhecimento',
    description: 'Consulta a base de conhecimento local do ManagerAI para buscar documentos, manuais, diretrizes e informações fornecidas previamente pelo usuário.',
    inputSchema: z.object({
      query: z.string().describe('Frase ou termos de busca para pesquisar semanticamente no banco de conhecimento'),
    }),
    outputSchema: z.string(),
  },
  async ({ query }: { query: string }) => {
    try {
      const results = await searchKnowledge(query, undefined, 0.45);
      if (results.length === 0) {
        return 'Nenhum resultado relevante encontrado na base de conhecimento local.';
      }
      return results
        .map((item) => `[Documento: ${item.title} (Relevância: ${(item.score * 100).toFixed(1)}%)]\n${item.content}`)
        .join('\n\n---\n\n');
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro ao consultar base de conhecimento:', error);
      return `Erro ao consultar a base de conhecimento: ${message}`;
    }
  }
);

interface ChatHistoryItem {
  role: 'user' | 'model' | 'assistant';
  content: string;
}

interface StoredChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: Timestamp;
}

interface ExternalChatRequestBody {
  message?: string;
  sessionId?: string;
}

/**
 * Resposta a pre-flight requests do navegador (CORS)
 */
export async function OPTIONS() {
  return handleCorsPreflight();
}

/**
 * Endpoint de conversação externa protegido por Bearer JWT
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Extração e validação do cabeçalho Authorization
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonResponseWithCors(
        {
          error:
            'Token de autorização ausente ou em formato incorreto. Envie o cabeçalho no formato: Authorization: Bearer <seu_token_jwt>',
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      return jsonResponseWithCors(
        { error: 'Token de autorização não fornecido.' },
        { status: 401 }
      );
    }

    // 2. Validação criptográfica do JWT (jose)
    const tokenPayload = await verifyApiToken(token);
    if (!tokenPayload) {
      return jsonResponseWithCors(
        { error: 'Token de acesso inválido, corrompido ou assinatura divergente.' },
        { status: 401 }
      );
    }

    // 3. Verificação instantânea de revogação no Firestore
    const tokenRecord = await getApiTokenRecord(tokenPayload.jti);
    if (!tokenRecord) {
      return jsonResponseWithCors(
        { error: 'Token de acesso inexistente.' },
        { status: 401 }
      );
    }

    if (tokenRecord.status !== 'active') {
      return jsonResponseWithCors(
        { error: 'Este token de acesso foi revogado pelo administrador do sistema.' },
        { status: 401 }
      );
    }

    // 4. Validação do corpo da requisição (JSON)
    let body: ExternalChatRequestBody;
    try {
      body = await req.json();
    } catch {
      return jsonResponseWithCors(
        { error: 'Corpo da requisição inválido. Envie um JSON com o campo "message".' },
        { status: 400 }
      );
    }

    const { message, sessionId: bodySessionId } = body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return jsonResponseWithCors(
        { error: 'O campo "message" é obrigatório e deve ser uma string com conteúdo.' },
        { status: 400 }
      );
    }

    // 5. Resolução da Sessão (bodySessionId possui precedência, fallback para sessionId do token)
    const targetSessionId =
      typeof bodySessionId === 'string' && bodySessionId.trim()
        ? bodySessionId.trim()
        : tokenPayload.sessionId;

    // 6. Carregamento do Agente vinculado no Firestore
    const agentRef = doc(collection(db, 'agents'), tokenPayload.agentId);
    const agentSnap = await getDoc(agentRef);

    if (!agentSnap.exists()) {
      return jsonResponseWithCors(
        { error: `O agente vinculado ao token (ID: ${tokenPayload.agentId}) não foi encontrado.` },
        { status: 404 }
      );
    }

    const agent = agentSnap.data() as Agent;

    // 7. Obtenção das chaves de provedor de IA
    const keys = await getProviderKeys();
    let apiKey = '';
    if (agent.provider === 'google') apiKey = keys.google || process.env.GEMINI_API_KEY || '';
    else if (agent.provider === 'openai') apiKey = keys.openai || '';
    else if (agent.provider === 'anthropic') apiKey = keys.anthropic || '';
    else if (agent.provider === 'deepseek') apiKey = keys.deepseek || process.env.DEEPSEEK_API_KEY || '';
    else if (agent.provider === 'grok') apiKey = keys.grok || process.env.GROK_API_KEY || process.env.XAI_API_KEY || '';

    if (!apiKey) {
      return jsonResponseWithCors({
        response: `[Simulado] Olá! Recebi sua mensagem: "${message.trim()}". Como a chave de API para o provedor ${agent.provider.toUpperCase()} não está configurada em 'Configurações', estou respondendo em modo de simulação com o papel de ${agent.role}. Como posso ajudar?`,
        sessionId: targetSessionId,
        agentId: tokenPayload.agentId,
      });
    }

    // 8. Recuperação e Inicialização da Sessão Stateful no Firestore
    const sessionRef = doc(collection(db, 'chat_sessions'), targetSessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (!sessionSnap.exists()) {
      await setDoc(sessionRef, {
        id: targetSessionId,
        agentId: tokenPayload.agentId,
        tokenId: tokenPayload.jti,
        title: `Conversa API #${targetSessionId.slice(-6)}`,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } else {
      await updateDoc(sessionRef, {
        updatedAt: Timestamp.now(),
      });
    }

    // 9. Recuperação do Histórico de Mensagens
    const messagesRef = doc(collection(db, 'chat_messages'), targetSessionId);
    const messagesSnap = await getDoc(messagesRef);

    const existingMessages: StoredChatMessage[] =
      messagesSnap.exists() && Array.isArray(messagesSnap.data().messages)
        ? (messagesSnap.data().messages as StoredChatMessage[])
        : [];

    const recentHistory: ChatHistoryItem[] = existingMessages.slice(-30).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // 10. Memórias persistentes e ferramentas do Agente
    let memoryContext = '';
    type GenkitToolType = ReturnType<typeof ai.defineTool>;
    let agentMemoryTools: GenkitToolType[] = [];

    try {
      const relevantMemories = await searchAgentMemories(tokenPayload.agentId, message.trim(), 5, 0.35);
      if (relevantMemories.length > 0) {
        memoryContext =
          '\n\n## SUAS MEMÓRIAS PERSISTENTES (Fatos e preferências lembradas de conversas anteriores):\n' +
          relevantMemories.map((m) => `- [${m.category || 'Fato'}]: ${m.content}`).join('\n');
      }

      const { salvarMemoriaTool, consultarMemoriasTool } = createAgentMemoryTools(tokenPayload.agentId);
      agentMemoryTools = [salvarMemoriaTool, consultarMemoriasTool];
    } catch (err: any) {
      console.warn('[api/v1/chat] Aviso ao carregar memórias do agente:', err);
    }

    const memoryInstructions =
      '\n\n## DIRETRIZES DE MEMÓRIA:\n' +
      'Você possui a ferramenta "salvarMemoria" para guardar autonomamente fatos importantes, preferências expressas pelo usuário, decisões e regras que devam ser lembradas em conversas futuras. Use-a sempre que identificar informações relevantes de longo prazo.' +
      'Você também pode usar "consultarMemorias" para buscar ativamente em seu banco de memórias.';

    const systemPrompt = `Role: ${agent.role}\nDescription: ${agent.description}`;
    const finalSystemPrompt = `${systemPrompt}${memoryContext}${memoryInstructions}`;

    let replyText = '';

    // 11. Execução da Inferência por Provedor
    if (agent.provider === 'google') {
      const allowedServers = agent.mcpServers || [];
      const agentMcpTools = await getMcpTools(allowedServers);

      const genkitMessages = [
        ...recentHistory.map((m) => ({
          role: (m.role === 'model' || m.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
          content: [{ text: m.content }],
        })),
        { role: 'user' as const, content: [{ text: message.trim() }] },
      ];

      const response = await ai.generate({
        model: agent.model,
        system: finalSystemPrompt,
        messages: genkitMessages,
        tools: [...agentMcpTools, consultarBaseConhecimentoTool, ...agentMemoryTools],
        config: {
          apiKey: apiKey,
          temperature: agent.temperature ?? 0.7,
        },
      });

      replyText = response.text;
    } else if (agent.provider === 'openai') {
      const formattedMessages = [
        { role: 'system', content: finalSystemPrompt },
        ...recentHistory.map((m) => ({
          role: m.role === 'model' || m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
        { role: 'user', content: message.trim() },
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: agent.model,
          ...(agent.model.includes('o1') || agent.model.includes('o3')
            ? { reasoning_effort: agent.reasoningEffort || 'medium' }
            : { temperature: agent.temperature ?? 0.7 }),
          messages: formattedMessages,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenAI API error: ${errText}`);
      }

      const data = await response.json();
      replyText = data.choices?.[0]?.message?.content || '';
    } else if (agent.provider === 'anthropic') {
      const formattedMessages = [
        ...recentHistory.map((m) => ({
          role: m.role === 'model' || m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
        { role: 'user', content: message.trim() },
      ];

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: agent.model,
          max_tokens: 4096,
          temperature: agent.temperature ?? 0.7,
          system: finalSystemPrompt,
          messages: formattedMessages,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Anthropic API error: ${errText}`);
      }

      const data = await response.json();
      replyText = data.content?.[0]?.text || '';
    } else if (agent.provider === 'deepseek') {
      const formattedMessages = [
        { role: 'system', content: finalSystemPrompt },
        ...recentHistory.map((m) => ({
          role: m.role === 'model' || m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
        { role: 'user', content: message.trim() },
      ];

      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: agent.model,
          temperature: agent.temperature ?? 0.7,
          messages: formattedMessages,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`DeepSeek API error: ${errText}`);
      }

      const data = await response.json();
      replyText = data.choices?.[0]?.message?.content || '';
    } else if (agent.provider === 'grok') {
      const formattedMessages = [
        { role: 'system', content: finalSystemPrompt },
        ...recentHistory.map((m) => ({
          role: m.role === 'model' || m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
        { role: 'user', content: message.trim() },
      ];

      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: agent.model,
          temperature: agent.temperature ?? 0.7,
          messages: formattedMessages,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Grok (xAI) API error: ${errText}`);
      }

      const data = await response.json();
      replyText = data.choices?.[0]?.message?.content || '';
    } else {
      return jsonResponseWithCors(
        { error: `Provedor de IA "${agent.provider}" não suportado.` },
        { status: 400 }
      );
    }

    // 12. Persistência da Interação no Firestore
    const userMsg: StoredChatMessage = {
      role: 'user',
      content: message.trim(),
      timestamp: Timestamp.now(),
    };

    const modelMsg: StoredChatMessage = {
      role: 'model',
      content: replyText,
      timestamp: Timestamp.now(),
    };

    const finalMessages = [...existingMessages, userMsg, modelMsg];
    await setDoc(messagesRef, { messages: finalMessages }, { merge: true });

    // 13. Atualização do Timestamp de Último Uso do Token
    await updateApiTokenLastUsed(tokenPayload.jti);

    // 14. Retorno Síncrono em JSON com CORS
    return jsonResponseWithCors(
      {
        response: replyText,
        sessionId: targetSessionId,
        agentId: tokenPayload.agentId,
      },
      { status: 200 }
    );
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Erro interno no servidor.';
    console.error('[api/v1/chat] Erro ao processar requisição externa:', error);
    return jsonResponseWithCors(
      { error: `Erro no processamento da conversa: ${message}` },
      { status: 500 }
    );
  }
}
