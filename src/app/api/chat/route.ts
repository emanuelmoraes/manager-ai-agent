import { NextRequest, NextResponse } from 'next/server';
import { getProviderKeys } from '@/lib/config/providers';
import { ai } from '@/lib/genkit';
import { getMcpTools } from '@/lib/mcp/registry';
import { searchKnowledge } from '@/lib/rag/store';
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
      const results = await searchKnowledge(query, 3, 0.45);
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, systemPrompt, provider, model, mcpServers } = body;

    if (!message || !provider || !model) {
      return NextResponse.json({ error: 'Campos message, provider e model são obrigatórios.' }, { status: 400 });
    }

    const keys = await getProviderKeys();
    let apiKey = "";
    if (provider === 'google') apiKey = keys.google || process.env.GEMINI_API_KEY || "";
    else if (provider === 'openai') apiKey = keys.openai || "";
    else if (provider === 'anthropic') apiKey = keys.anthropic || "";

    if (!apiKey) {
      return NextResponse.json({
        response: `[Simulado] Olá! Recebi sua mensagem: "${message}". Como a chave de API para o provedor ${provider.toUpperCase()} não está configurada na sessão 'Configurações', estou respondendo em modo de simulação baseado no meu papel. Como posso ajudar com a tarefa?`
      });
    }

    if (provider === 'google') {
      // Configura a chave de API dinamicamente no processo
      process.env.GEMINI_API_KEY = apiKey;

      // Carregar ferramentas MCP autorizadas para este agente
      const allowedServers = mcpServers || [];
      const agentMcpTools = await getMcpTools(allowedServers);

      const response = await ai.generate({
        model: model || 'googleai/gemini-2.5-pro',
        system: systemPrompt,
        prompt: message,
        tools: [...agentMcpTools, consultarBaseConhecimentoTool],
      });

      return NextResponse.json({ response: response.text });
    } else if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ]
        })
      });
      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || "";
        return NextResponse.json({ response: text });
      } else {
        const errText = await response.text();
        throw new Error(`OpenAI API error: ${errText}`);
      }
    } else if (provider === 'anthropic') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 4096,
          system: systemPrompt,
          messages: [
            { role: 'user', content: message }
          ]
        })
      });
      if (response.ok) {
        const data = await response.json();
        const text = data.content?.[0]?.text || "";
        return NextResponse.json({ response: text });
      } else {
        const errText = await response.text();
        throw new Error(`Anthropic API error: ${errText}`);
      }
    }

    return NextResponse.json({ error: 'Provedor não suportado.' }, { status: 400 });

  } catch (error: any) {
    console.error('[chat-api] Erro ao processar:', error);
    return NextResponse.json({ error: `Erro no processamento da mensagem: ${error.message}` }, { status: 500 });
  }
}
