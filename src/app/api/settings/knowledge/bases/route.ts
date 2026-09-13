import { NextRequest, NextResponse } from 'next/server';
import { getKnowledgeBases, createKnowledgeBase } from '@/lib/rag/store';

export async function GET() {
  try {
    const bases = await getKnowledgeBases();
    return NextResponse.json({ success: true, data: bases });
  } catch (error: any) {
    console.error('Erro na API GET de bases de conhecimento:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao carregar bases de conhecimento.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, color } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'O nome da base é obrigatório.' }, { status: 400 });
    }

    const created = await createKnowledgeBase(name.trim(), description?.trim(), color);
    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    console.error('Erro na API POST de bases de conhecimento:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao criar base de conhecimento.' },
      { status: 500 }
    );
  }
}
