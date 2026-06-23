import { NextRequest, NextResponse } from 'next/server';
import { exampleAgentFlow } from '@/agents/example';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Campo "message" é obrigatório.' }, { status: 400 });
    }

    const result = await exampleAgentFlow({ message });
    return NextResponse.json(result);
  } catch (error) {
    console.error('[example-agent] Erro ao processar requisição:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
