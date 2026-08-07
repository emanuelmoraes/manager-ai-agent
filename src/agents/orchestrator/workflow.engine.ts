import { z } from 'genkit';
import { ai } from '@/lib/genkit';
import { getMcpTools } from '@/lib/mcp/registry';
import { searchKnowledge } from '@/lib/rag/store';
import { getProviderKeys } from '@/lib/config/providers';
import { WorkflowNode, WorkflowEdge, WorkflowLogChunk } from '@/types/workflow';

const WorkflowEngineInputSchema = z.object({
  task: z.string(),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
  agentsMap: z.record(
    z.string(),
    z.object({
      id: z.string(),
      name: z.string(),
      role: z.string(),
      provider: z.string(),
      model: z.string(),
      description: z.string(),
      temperature: z.number().optional(),
      mcpServers: z.array(z.string()).optional(),
    })
  ).default({}),
});

const WorkflowEngineOutputSchema = z.object({
  finalOutput: z.string(),
  logs: z.array(z.any()).optional(),
});

export const workflowEngineFlow = ai.defineFlow(
  {
    name: 'workflowEngineFlow',
    inputSchema: WorkflowEngineInputSchema,
    outputSchema: WorkflowEngineOutputSchema,
  },
  async (input, { sendChunk }) => {
    const { task, nodes, edges, agentsMap } = input;
    const typedNodes = nodes as WorkflowNode[];
    const typedEdges = edges as WorkflowEdge[];

    const notify = (chunk: WorkflowLogChunk) => {
      sendChunk(chunk);
    };

    notify({
      log: { message: '🚀 Iniciando execução do Workflow...', type: 'system' },
      status: 'running',
    });

    const startNode = typedNodes.find((n) => n.type === 'start');
    if (!startNode) {
      notify({
        log: { message: 'Erro: Nenhum nó de início (Start) foi encontrado no workflow.', type: 'error' },
        status: 'error',
      });
      return { finalOutput: 'Erro: Nó de início ausente.' };
    }

    let currentNode: WorkflowNode | undefined = startNode;
    let currentContext = task;
    const visitedNodes = new Set<string>();

    const getOutgoingEdges = (nodeId: string) => typedEdges.filter((e) => e.source === nodeId);
    const getTargetNode = (edge: WorkflowEdge) => typedNodes.find((n) => n.id === edge.target);

    while (currentNode) {
      const activeNode: WorkflowNode = currentNode;

      if (visitedNodes.has(activeNode.id) && activeNode.type !== 'loop') {
        notify({
          log: { message: `Detectado ciclo infinito no nó: ${activeNode.data.label}. Interrompendo.`, type: 'warning' },
        });
        break;
      }
      visitedNodes.add(activeNode.id);

      notify({
        nodeId: activeNode.id,
        status: 'running',
        log: { message: `Executando Nó: "${activeNode.data.label}" (${activeNode.type.toUpperCase()})`, type: 'info' },
      });

      // 1. INÍCIO
      if (activeNode.type === 'start') {
        notify({
          nodeId: activeNode.id,
          status: 'done',
          log: { message: `Entrada recebida: "${task}"`, type: 'success' },
        });
      }

      // 2. AGENTE
      else if (activeNode.type === 'agent') {
        const agentId = activeNode.data.agentId;
        const agent = agentId ? agentsMap[agentId] : undefined;

        if (!agent) {
          notify({
            nodeId: activeNode.id,
            status: 'error',
            log: { message: `Agente com ID "${agentId}" não foi encontrado.`, type: 'error' },
          });
          currentContext += `\n[Erro: Agente ${agentId} não configurado.]`;
        } else {
          notify({
            nodeId: activeNode.id,
            agentId: agent.id,
            log: { message: `Agente "${agent.name}" (${agent.role}) processando contexto...`, type: 'info' },
          });

          // Carregar Ferramentas MCP autorizadas
          const mcpTools = await getMcpTools(agent.mcpServers || []);
          const keys = await getProviderKeys();
          let apiKey = keys.google || process.env.GEMINI_API_KEY || '';
          if (agent.provider === 'openai') apiKey = keys.openai || '';
          else if (agent.provider === 'anthropic') apiKey = keys.anthropic || '';

          const systemPrompt = `Você é o agente "${agent.name}", atuando como "${agent.role}".
Descrição: ${agent.description}

Instruções e Tarefas:
- Analise a entrada recebida e execute seu papel com rigor e qualidade.
- Se necessário, utilize as ferramentas disponíveis.
- Seja objetivo e forneça respostas bem estruturadas.`;

          const prompt = `Contexto Acumulado do Workflow:\n${currentContext}\n\nSua tarefa atual: Responda ou processe o contexto de acordo com seu papel.`;

          try {
            const response = await ai.generate({
              model: (agent.model || 'googleai/gemini-2.5-pro') as any,
              config: {
                temperature: agent.temperature ?? 0.7,
              },
              system: systemPrompt,
              prompt: prompt,
              tools: mcpTools as any,
            });

            const outputText = response.text || 'Sem resposta gerada.';
            currentContext = outputText;

            notify({
              nodeId: activeNode.id,
              agentId: agent.id,
              status: 'done',
              log: { message: `Agente "${agent.name}" concluiu com sucesso!`, type: 'success' },
              output: outputText,
            });
          } catch (err: any) {
            console.error('Erro na execução do agente:', err);
            notify({
              nodeId: activeNode.id,
              agentId: agent.id,
              status: 'error',
              log: { message: `Erro ao executar agente "${agent.name}": ${err.message}`, type: 'error' },
            });
          }
        }
      }

      // 3. PARALELO
      else if (activeNode.type === 'parallel') {
        const outgoing = getOutgoingEdges(activeNode.id);
        const targetNodes = outgoing.map(getTargetNode).filter(Boolean) as WorkflowNode[];

        notify({
          nodeId: activeNode.id,
          status: 'running',
          log: { message: `Iniciando execução paralela de ${targetNodes.length} ramos...`, type: 'info' },
        });

        // Executar todos os ramos simultaneamente
        const parallelResults = await Promise.all(
          targetNodes.map(async (targetN) => {
            const agentId = targetN.data.agentId;
            const agent = agentId ? agentsMap[agentId] : undefined;

            if (targetN.type === 'agent' && agent) {
              notify({
                nodeId: targetN.id,
                agentId: agent.id,
                status: 'running',
                log: { message: `[Paralelo] Executando "${agent.name}"...`, type: 'info' },
              });

              try {
                const keys = await getProviderKeys();
                const response = await ai.generate({
                  model: (agent.model || 'googleai/gemini-2.5-pro') as any,
                  system: `Você é "${agent.name}" (${agent.role}). ${agent.description}`,
                  prompt: `Tarefa / Contexto:\n${currentContext}`,
                });
                const txt = response.text || '';
                notify({
                  nodeId: targetN.id,
                  agentId: agent.id,
                  status: 'done',
                  log: { message: `[Paralelo] Agente "${agent.name}" finalizado.`, type: 'success' },
                });
                return { nodeLabel: targetN.data.label, agentName: agent.name, output: txt };
              } catch (e: any) {
                return { nodeLabel: targetN.data.label, agentName: agent?.name || 'Agente', output: `Erro: ${e.message}` };
              }
            }
            return { nodeLabel: targetN.data.label, agentName: 'Nó', output: `Executado nó ${targetN.data.label}` };
          })
        );

        // Agrupar resultados dos ramos
        const branchSummary = parallelResults
          .map((r) => `=== RESULTADO DE [${r.agentName}] ===\n${r.output}`)
          .join('\n\n');

        currentContext = branchSummary;

        notify({
          nodeId: activeNode.id,
          status: 'done',
          log: { message: `Execução paralela de ${targetNodes.length} ramos concluída!`, type: 'success' },
        });

        // Tentar encontrar nó agregador seguinte
        const synthEdge = typedEdges.find((e) => targetNodes.some((tn) => tn.id === e.source));
        const synthNode = synthEdge ? getTargetNode(synthEdge) : undefined;

        if (synthNode && synthNode.type === 'synthesizer') {
          currentNode = synthNode;
          continue;
        }
      }

      // 4. SINTETIZADOR / AGREGADOR
      else if (activeNode.type === 'synthesizer') {
        notify({
          nodeId: activeNode.id,
          status: 'running',
          log: { message: 'Sintetizando e consolidando respostas dos ramos...', type: 'info' },
        });

        try {
          const synthPrompt = `Você é um Agregador/Sintetizador de Inteligência Artificial.
Sua missão é ler as diferentes análises/respostas geradas pelos agentes anteriores e fundi-las em um único relatório coeso, profissional e completo.

Respostas dos Ramos Paralelos:
${currentContext}

Por favor, apresente uma síntese final organizada:`;

          const synthRes = await ai.generate({
            model: 'googleai/gemini-2.5-pro',
            prompt: synthPrompt,
          });

          currentContext = synthRes.text;

          notify({
            nodeId: activeNode.id,
            status: 'done',
            log: { message: 'Síntese concluída com sucesso!', type: 'success' },
            output: currentContext,
          });
        } catch (err: any) {
          notify({
            nodeId: activeNode.id,
            status: 'error',
            log: { message: `Erro na síntese: ${err.message}`, type: 'error' },
          });
        }
      }

      // 5. CONDICIONAL
      else if (activeNode.type === 'condition') {
        notify({
          nodeId: activeNode.id,
          status: 'running',
          log: { message: 'Avaliando condição de desvio no fluxo...', type: 'info' },
        });

        const conditionPrompt = activeNode.data.conditionExpr || 'A resposta atual atende aos requisitos?';
        
        try {
          const evalRes = await ai.generate({
            model: 'googleai/gemini-2.5-pro',
            prompt: `Avalie o contexto atual com base na pergunta/condição a seguir.
Condição: "${conditionPrompt}"
Contexto:
${currentContext}

Responda APENAS "SIM" ou "NÃO".`,
          });

          const isTrue = evalRes.text.toUpperCase().includes('SIM');
          const outgoing = getOutgoingEdges(activeNode.id);
          const trueEdge = outgoing.find((e) => e.label?.toLowerCase() === 'sim' || e.label?.toLowerCase() === 'true') || outgoing[0];
          const falseEdge = outgoing.find((e) => e.label?.toLowerCase() === 'não' || e.label?.toLowerCase() === 'nao' || e.label?.toLowerCase() === 'false') || outgoing[1];

          const chosenEdge = isTrue ? trueEdge : falseEdge;
          notify({
            nodeId: activeNode.id,
            status: 'done',
            log: { message: `Condição avaliada como: ${isTrue ? 'SIM / TRUE' : 'NÃO / FALSE'}. Seguindo rota correspondente.`, type: 'success' },
          });

          if (chosenEdge) {
            currentNode = getTargetNode(chosenEdge);
            continue;
          }
        } catch (e: any) {
          notify({ nodeId: activeNode.id, status: 'error', log: { message: `Erro ao avaliar condição: ${e.message}`, type: 'error' } });
        }
      }

      // 6. FIM
      else if (activeNode.type === 'end') {
        notify({
          nodeId: activeNode.id,
          status: 'done',
          log: { message: '🏁 Workflow finalizado com sucesso!', type: 'system' },
        });
        break;
      }

      // Próximo nó
      const outgoing = getOutgoingEdges(activeNode.id);
      if (outgoing.length === 0) break;
      currentNode = getTargetNode(outgoing[0]);
    }

    return {
      finalOutput: currentContext,
    };
  }
);
