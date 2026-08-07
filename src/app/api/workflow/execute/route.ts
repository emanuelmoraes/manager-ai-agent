import { NextRequest } from 'next/server';
import { workflowEngineFlow } from '@/agents/orchestrator/workflow.engine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { task, nodes = [], edges = [], agentsMap = {} } = body;

    if (!task) {
      return new Response(JSON.stringify({ error: 'Uma tarefa/instrução é obrigatória.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const responseStream = new TransformStream();
    const writer = responseStream.writable.getWriter();
    const encoder = new TextEncoder();

    const { stream, output } = workflowEngineFlow.stream({
      task,
      nodes,
      edges,
      agentsMap,
    });

    (async () => {
      try {
        for await (const chunk of stream) {
          const payload = `data: ${JSON.stringify(chunk)}\n\n`;
          await writer.write(encoder.encode(payload));
        }

        const finalResult = await output;
        const finalPayload = `data: ${JSON.stringify({
          nodeId: 'system',
          status: 'done',
          result: finalResult.finalOutput,
        })}\n\n`;
        await writer.write(encoder.encode(finalPayload));
      } catch (error: any) {
        console.error('Workflow execution error:', error);
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ nodeId: 'system', status: 'error', error: error.message })}\n\n`)
        );
      } finally {
        await writer.close();
      }
    })();

    return new Response(responseStream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Workflow API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
