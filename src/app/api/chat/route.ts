import { NextRequest, NextResponse } from 'next/server';
import { getProviderKeys } from '@/lib/config/providers';
import { ai } from '@/lib/genkit';
import { getMcpTools } from '@/lib/mcp/registry';
import { searchKnowledge } from '@/lib/rag/store';
import { createAgentMemoryTools, searchAgentMemories } from '@/lib/memory/store';
import { z } from 'genkit';

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
  async ({ query }) => {
    try {
      const results = await searchKnowledge(query, undefined, 0.45);
      if (results.length === 0) {
        return 'Nenhum resultado relevante encontrado na base de conhecimento local.';
      }
      return results
        .map((doc) => `[Documento: ${doc.title} (Relevância: ${(doc.score * 100).toFixed(1)}%)]\n${doc.content}`)
        .join('\n\n---\n\n');
    } catch (error: any) {
      console.error('Erro ao consultar base de conhecimento:', error);
      return `Erro ao consultar a base de conhecimento: ${error.message}`;
    }
  }
);

interface ChatHistoryItem {
  role: 'user' | 'model' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      agentId,
      message,
      history = [],
      systemPrompt = '',
      provider,
      model,
      mcpServers,
      temperature,
      reasoningEffort,
    } = body;

    if (!message || !provider || !model) {
      return NextResponse.json({ error: 'Campos message, provider e model são obrigatórios.' }, { status: 400 });
    }

    const keys = await getProviderKeys();
    let apiKey = '';
    if (provider === 'google') apiKey = keys.google || process.env.GEMINI_API_KEY || '';
    else if (provider === 'openai') apiKey = keys.openai || '';
    else if (provider === 'anthropic') apiKey = keys.anthropic || '';
    else if (provider === 'deepseek') apiKey = keys.deepseek || process.env.DEEPSEEK_API_KEY || '';
    else if (provider === 'grok') apiKey = keys.grok || process.env.GROK_API_KEY || process.env.XAI_API_KEY || '';

    if (!apiKey) {
      return NextResponse.json({
        response: `[Simulado] Olá! Recebi sua mensagem: "${message}". Como a chave de API para o provedor ${provider.toUpperCase()} não está configurada na sessão 'Configurações', estou respondendo em modo de simulação baseado no meu papel. Como posso ajudar com a tarefa?`,
      });
    }

    // Janela de memória de curto prazo (máximo de 30 mensagens)
    const recentHistory: ChatHistoryItem[] = Array.isArray(history) ? history.slice(-30) : [];

    // Recuperar memórias semânticas de longo prazo do agente
    let memoryContext = '';
    let agentMemoryTools: any[] = [];

    if (agentId) {
      try {
        const relevantMemories = await searchAgentMemories(agentId, message, 5, 0.35);
        if (relevantMemories.length > 0) {
          memoryContext =
            '\n\n## SUAS MEMÓRIAS PERSISTENTES (Fatos e preferências lembradas de conversas anteriores):\n' +
            relevantMemories.map((m) => `- [${m.category || 'Fato'}]: ${m.content}`).join('\n');
        }

        const { salvarMemoriaTool, consultarMemoriasTool } = createAgentMemoryTools(agentId);
        agentMemoryTools = [salvarMemoriaTool, consultarMemoriasTool];
      } catch (err) {
        console.warn('[chat-api] Erro ao carregar memórias do agente:', err);
      }
    }

    const memoryInstructions =
      '\n\n## DIRETRIZES DE MEMÓRIA:\n' +
      'Você possui a ferramenta "salvarMemoria" para guardar autonomamente fatos importantes, preferências expressas pelo usuário, decisões e regras que devam ser lembradas em conversas futuras. Use-a sempre que identificar informações relevantes de longo prazo.' +
      'Você também pode usar "consultarMemorias" para buscar ativamente em seu banco de memórias.';

    const finalSystemPrompt = `${systemPrompt}${memoryContext}${memoryInstructions}`;

    if (provider === 'google') {
      // Carregar ferramentas MCP autorizadas para este agente
      const allowedServers = mcpServers || [];
      const agentMcpTools = await getMcpTools(allowedServers);

      // Formatar mensagens multi-turn para o Genkit
      const genkitMessages = [
        ...recentHistory.map((m) => ({
          role: (m.role === 'model' || m.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
          content: [{ text: m.content }],
        })),
        { role: 'user' as const, content: [{ text: message }] },
      ];

      const response = await ai.generate({
        model: model,
        system: finalSystemPrompt,
        messages: genkitMessages,
        tools: [...agentMcpTools, consultarBaseConhecimentoTool, ...agentMemoryTools],
        config: {
          apiKey: apiKey,
          temperature: temperature ?? 0.7,
        },
      });

      return NextResponse.json({ response: response.text });
    } else if (provider === 'openai') {
      const formattedMessages = [
        { role: 'system', content: finalSystemPrompt },
        ...recentHistory.map((m) => ({
          role: m.role === 'model' || m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
        { role: 'user', content: message },
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          ...(model.includes('o1') || model.includes('o3')
            ? { reasoning_effort: reasoningEffort || 'medium' }
            : { temperature: temperature ?? 0.7 }),
          messages: formattedMessages,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';
        return NextResponse.json({ response: text });
      } else {
        const errText = await response.text();
        throw new Error(`OpenAI API error: ${errText}`);
      }
    } else if (provider === 'anthropic') {
      const formattedMessages = [
        ...recentHistory.map((m) => ({
          role: m.role === 'model' || m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
        { role: 'user', content: message },
      ];

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 4096,
          temperature: temperature ?? 0.7,
          system: finalSystemPrompt,
          messages: formattedMessages,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.content?.[0]?.text || '';
        return NextResponse.json({ response: text });
      } else {
        const errText = await response.text();
        throw new Error(`Anthropic API error: ${errText}`);
      }
    } else if (provider === 'deepseek') {
      const formattedMessages = [
        { role: 'system', content: finalSystemPrompt },
        ...recentHistory.map((m) => ({
          role: m.role === 'model' || m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
        { role: 'user', content: message },
      ];

      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          temperature: temperature ?? 0.7,
          messages: formattedMessages,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';
        return NextResponse.json({ response: text });
      } else {
        const errText = await response.text();
        throw new Error(`DeepSeek API error: ${errText}`);
      }
    } else if (provider === 'grok') {
      const formattedMessages = [
        { role: 'system', content: finalSystemPrompt },
        ...recentHistory.map((m) => ({
          role: m.role === 'model' || m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
        { role: 'user', content: message },
      ];

      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          temperature: temperature ?? 0.7,
          messages: formattedMessages,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';
        return NextResponse.json({ response: text });
      } else {
        const errText = await response.text();
        throw new Error(`Grok (xAI) API error: ${errText}`);
      }
    }

    return NextResponse.json({ error: 'Provedor não suportado.' }, { status: 400 });
  } catch (error: any) {
    console.error('[chat-api] Erro ao processar:', error);
    return NextResponse.json({ error: `Erro no processamento da mensagem: ${error.message}` }, { status: 500 });
  }
}
