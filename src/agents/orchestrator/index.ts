import { z } from 'genkit';
import { ai } from '@/lib/genkit';
import { agentConfigs } from '@/lib/config/agents';
import { getMcpTools } from '@/lib/mcp/registry';
import { searchKnowledge } from '@/lib/rag/store';

const WorkflowInputSchema = z.object({
  task: z.string(),
  model: z.string().default('googleai/gemini-2.5-pro'),
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

export const orchestratorFlow = ai.defineFlow(
  {
    name: 'orchestratorFlow',
    inputSchema: WorkflowInputSchema,
    outputSchema: WorkflowOutputSchema,
  },
  async (input, { sendChunk }) => {
    const { task, model } = input;
    
    const notify = (chunk: WorkflowChunk) => {
      sendChunk(chunk);
    };

    try {
      // Load MCP Tools dynamically
      notify({ agentId: 'system', log: { message: 'Carregando ferramentas MCP registradas...', type: 'info' } });
      const mcpTools = await getMcpTools();
      notify({ agentId: 'system', log: { message: `${mcpTools.length} ferramentas MCP prontas para uso.`, type: 'success' } });

      // --- 1. ORCHESTRATOR ---
      const orchCfg = agentConfigs.orchestrator;
      notify({ agentId: 'orchestrator', status: 'running' });
      notify({ agentId: 'orchestrator', log: { message: 'Analisando a tarefa recebida e definindo escopo.', type: 'info' } });
      
      const planResponse = await ai.generate({
        model: orchCfg.model,
        system: orchCfg.systemPrompt,
        prompt: `Pedido do usuário: "${task}"`,
        config: { temperature: orchCfg.temperature },
      });
      
      notify({ agentId: 'orchestrator', log: { message: 'Plano estratégico criado. Delegando para execução paralela.', type: 'info' } });
      notify({ agentId: 'orchestrator', status: 'done', log: { message: 'Pipeline iniciado.', type: 'success' } });

      // --- 2. RESEARCHER & ANALYST (PARALLEL) ---
      const resCfg = agentConfigs.researcher;
      const anaCfg = agentConfigs.analyst;
      
      notify({ agentId: 'researcher', status: 'running' });
      notify({ agentId: 'analyst', status: 'running' });
      
      notify({ agentId: 'researcher', log: { message: 'Iniciando coleta de dados (com acesso a MCP e Base de Conhecimento)...', type: 'info' } });
      notify({ agentId: 'analyst', log: { message: 'Estruturando modelo analítico inicial...', type: 'info' } });

      const [researchData, analysisData] = await Promise.all([
        ai.generate({
          model: resCfg.model,
          system: resCfg.systemPrompt,
          prompt: `Tarefa: "${task}". Execute sua pesquisa agora.`,
          tools: [...mcpTools, consultarBaseConhecimentoTool], // Injecting MCP Tools and RAG
          config: { temperature: resCfg.temperature },
        }),
        ai.generate({
          model: anaCfg.model,
          system: anaCfg.systemPrompt,
          prompt: `Tarefa: "${task}". Crie o framework de análise. Quais os principais ângulos?`,
          config: { temperature: anaCfg.temperature },
        })
      ]);

      const contextData = researchData.text;
      const contextAnalysis = analysisData.text;

      notify({ agentId: 'researcher', status: 'done', log: { message: 'Dados e fontes consolidadas.', type: 'success' } });
      notify({ agentId: 'analyst', log: { message: 'Aplicando framework analítico aos dados coletados...', type: 'info' } });
      
      const finalAnalysis = await ai.generate({
        model: anaCfg.model,
        system: anaCfg.systemPrompt,
        prompt: `Cruze os dados coletados abaixo com o seu framework e gere os insights.\n\nDADOS COLETADOS:\n${contextData}\n\nSEU FRAMEWORK:\n${contextAnalysis}`,
        config: { temperature: anaCfg.temperature },
      });

      notify({ agentId: 'analyst', status: 'done', log: { message: 'Análise concluída. Insights extraídos.', type: 'success' } });

      // --- 3. WRITER ---
      const writCfg = agentConfigs.writer;
      notify({ agentId: 'writer', status: 'running' });
      notify({ agentId: 'writer', log: { message: 'Recebendo contexto consolidado de Researcher e Analyst.', type: 'info' } });
      
      const draft = await ai.generate({
        model: writCfg.model,
        system: writCfg.systemPrompt,
        prompt: `Escreva a resposta final para a tarefa: "${task}".\n\nPESQUISA BRUTA:\n${contextData}\n\nINSIGHTS DA ANÁLISE:\n${finalAnalysis.text}`,
        config: { temperature: writCfg.temperature },
      });

      notify({ agentId: 'writer', status: 'done', log: { message: 'Conteúdo final gerado.', type: 'success' } });

      // --- 4. REVIEWER ---
      const revCfg = agentConfigs.reviewer;
      notify({ agentId: 'reviewer', status: 'running' });
      notify({ agentId: 'reviewer', log: { message: 'Validando output do Writer quanto à precisão e alinhamento.', type: 'info' } });

      const review = await ai.generate({
        model: revCfg.model,
        system: revCfg.systemPrompt,
        prompt: `Aplique polimento final, garanta a precisão e formatação Markdown impecável.\n\nTEXTO RASCUNHO:\n${draft.text}`,
        config: { temperature: revCfg.temperature },
      });

      notify({ agentId: 'reviewer', status: 'done', log: { message: '✓ Resultado aprovado. Qualidade: excelente.', type: 'success' } });

      return { finalOutput: review.text };

    } catch (error) {
      console.error(error);
      notify({ agentId: 'orchestrator', status: 'error', log: { message: 'Erro crítico na execução do pipeline.', type: 'system' } });
      throw error;
    }
  }
);
