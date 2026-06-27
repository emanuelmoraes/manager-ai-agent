import { z } from 'genkit';
import { ai } from '@/lib/genkit';
import { getMcpTools } from '@/lib/mcp/registry';
import { searchKnowledge } from '@/lib/rag/store';
import { getProviderKeys } from '@/lib/config/providers';

const WorkflowInputSchema = z.object({
  task: z.string(),
  model: z.string().default('googleai/gemini-1.5-pro'),
  pipelineAgents: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      role: z.string(),
      provider: z.string(),
      model: z.string(),
      description: z.string(),
    })
  ).default([]),
});

const WorkflowOutputSchema = z.object({
  finalOutput: z.string(),
});

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

export type WorkflowChunk = {
  agentId: string;
  status?: 'running' | 'done' | 'error';
  log?: {
    message: string;
    type: 'info' | 'success' | 'system';
  };
};

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const orchestratorFlow = ai.defineFlow(
  {
    name: 'orchestratorFlow',
    inputSchema: WorkflowInputSchema,
    outputSchema: WorkflowOutputSchema,
  },
  async (input, { sendChunk }) => {
    const { task, pipelineAgents } = input;
    
    const notify = (chunk: WorkflowChunk) => {
      sendChunk(chunk);
    };

    try {
      if (!pipelineAgents || pipelineAgents.length === 0) {
        notify({ agentId: 'system', log: { message: 'Nenhum agente configurado no pipeline para execução.', type: 'system' } });
        return { finalOutput: "Nenhum agente no pipeline." };
      }

      let contextData = "";

      for (let i = 0; i < pipelineAgents.length; i++) {
        const agent = pipelineAgents[i];
        notify({ agentId: agent.id, status: 'running' });
        notify({ agentId: agent.id, log: { message: `Iniciando execução: ${agent.name} (${agent.role})`, type: 'info' } });

        // Carregar ferramentas MCP autorizadas para este agente
        const allowedServers = (agent as any).mcpServers || [];
        notify({ agentId: agent.id, log: { message: `Carregando ferramentas MCP autorizadas (${allowedServers.length} servidores)...`, type: 'info' } });
        const agentMcpTools = await getMcpTools(allowedServers);
        notify({ agentId: agent.id, log: { message: `${agentMcpTools.length} ferramentas MCP prontas para uso.`, type: 'success' } });

        const keys = await getProviderKeys();
        let apiKey = "";
        if (agent.provider === 'google') apiKey = keys.google || process.env.GEMINI_API_KEY || "";
        else if (agent.provider === 'openai') apiKey = keys.openai || "";
        else if (agent.provider === 'anthropic') apiKey = keys.anthropic || "";

        const systemPrompt = `Você é o agente '${agent.name}'. Especialidade: '${agent.role}'.
Descrição/Instruções: ${agent.description}

Instruções da Tarefa:
Você faz parte de um pipeline de agentes. Execute sua tarefa com base no contexto acumulado e no objetivo geral do usuário.
Responda diretamente e formate em Markdown.`;

        const promptText = `TAREFA DO USUÁRIO: "${task}"

CONTEXTO ACUMULADO DOS AGENTES ANTERIORES:
${contextData || "Nenhum contexto acumulado ainda."}

Por favor, faça sua contribuição agora com base no seu papel no pipeline.`;

        let agentOutput = "";

        if (agent.provider === 'google' && apiKey) {
          // Set key dynamically for this plugin call
          process.env.GEMINI_API_KEY = apiKey;
          const response = await ai.generate({
            model: agent.model || 'googleai/gemini-2.5-pro',
            system: systemPrompt,
            prompt: promptText,
            tools: [...agentMcpTools, consultarBaseConhecimentoTool],
          });
          agentOutput = response.text;
        } else if (agent.provider === 'openai' && apiKey) {
          try {
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model: agent.model || 'gpt-4o',
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: promptText }
                ]
              })
            });
            if (res.ok) {
              const data = await res.json();
              agentOutput = data.choices?.[0]?.message?.content || "";
            } else {
              const errText = await res.text();
              throw new Error(`OpenAI API error: ${errText}`);
            }
          } catch (e: any) {
            console.error(e);
            agentOutput = `[Erro ao executar com OpenAI: ${e.message}]`;
          }
        } else if (agent.provider === 'anthropic' && apiKey) {
          try {
            const res = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
              },
              body: JSON.stringify({
                model: agent.model || 'claude-3-5-sonnet-20241022',
                max_tokens: 4096,
                system: systemPrompt,
                messages: [
                  { role: 'user', content: promptText }
                ]
              })
            });
            if (res.ok) {
              const data = await res.json();
              agentOutput = data.content?.[0]?.text || "";
            } else {
              const errText = await res.text();
              throw new Error(`Anthropic API error: ${errText}`);
            }
          } catch (e: any) {
            console.error(e);
            agentOutput = `[Erro ao executar com Anthropic: ${e.message}]`;
          }
        } else {
          // Fallback simulation
          await sleep(1500);
          agentOutput = `[Simulado - Provedor ${agent.provider.toUpperCase()}]\n` +
            `O agente '${agent.name}' processou a tarefa. Como a chave de API de desenvolvimento do provedor '${agent.provider}' não foi configurada, esta etapa foi executada em modo simulado.`;
        }

        notify({ agentId: agent.id, log: { message: `Etapa concluída por ${agent.name}.`, type: 'success' } });
        notify({ agentId: agent.id, status: 'done' });

        contextData += `\n\n### 🤖 Contribuição do Agente: ${agent.name} (${agent.role})\n${agentOutput}\n`;
      }

      return { finalOutput: contextData };

    } catch (error: any) {
      console.error(error);
      notify({ agentId: 'system', status: 'error', log: { message: `Erro crítico na execução do pipeline: ${error.message}`, type: 'system' } });
      throw error;
    }
  }
);
