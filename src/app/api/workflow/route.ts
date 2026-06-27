import { NextRequest } from 'next/server';
import { orchestratorFlow } from '@/agents/orchestrator';

export const runtime = 'nodejs'; // Use edge or nodejs depending on deps, Genkit usually works fine on nodejs
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { task, model = 'googleai/gemini-2.5-pro', pipelineAgents = [] } = body;

    if (!task) {
      return new Response(JSON.stringify({ error: 'Task is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Set up a TransformStream for Server-Sent Events (SSE)
    const responseStream = new TransformStream();
    const writer = responseStream.writable.getWriter();
    const encoder = new TextEncoder();

    // Start the Genkit flow stream
    const { stream, output } = orchestratorFlow.stream({ task, model, pipelineAgents });

    // Process the stream asynchronously
    (async () => {
      try {
        // Iterate over the chunks emitted by the flow via sendChunk()
        for await (const chunk of stream) {
          // chunk is what we passed to notify() in the flow
          const payload = `data: ${JSON.stringify(chunk)}\n\n`;
          await writer.write(encoder.encode(payload));
        }

        // Wait for the final output
        const finalResult = await output;
        
        // Send a final system event containing the result
        const finalPayload = `data: ${JSON.stringify({
          agentId: 'system',
          status: 'done',
          result: finalResult,
        })}\n\n`;
        await writer.write(encoder.encode(finalPayload));

      } catch (error: any) {
        console.error('Flow stream error:', error);
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ agentId: 'system', status: 'error', error: error.message })}\n\n`)
        );
      } finally {
        await writer.close();
      }
    })();

    // Return the readable stream to the client
    return new Response(responseStream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
