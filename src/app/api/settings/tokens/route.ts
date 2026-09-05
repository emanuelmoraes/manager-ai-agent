import { NextRequest, NextResponse } from 'next/server';
import { getApiTokens, createApiToken, revokeApiToken } from '@/lib/firebase/tokens';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tokens = await getApiTokens();
    return NextResponse.json({ tokens });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Erro ao listar tokens.';
    console.error('Erro ao listar tokens de API:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, agentId } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'O nome identificador do token é obrigatório.' },
        { status: 400 }
      );
    }

    if (!agentId || typeof agentId !== 'string' || !agentId.trim()) {
      return NextResponse.json(
        { error: 'A seleção de um Agente é obrigatória.' },
        { status: 400 }
      );
    }

    const { token, record } = await createApiToken(name.trim(), agentId.trim());

    return NextResponse.json({ token, record }, { status: 201 });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Erro ao gerar token.';
    console.error('Erro ao criar token de API:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'ID do token é obrigatório.' }, { status: 400 });
    }

    await revokeApiToken(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Erro ao revogar token.';
    console.error('Erro ao revogar token de API:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
