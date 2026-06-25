import { NextRequest, NextResponse } from 'next/server';
import { getKnowledge, addDocument } from '@/lib/rag/store';

export async function GET() {
  try {
    const list = getKnowledge();
    return NextResponse.json({ success: true, data: list });
  } catch (error: any) {
    console.error('Erro na API GET de conhecimento:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao carregar base de conhecimento.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, content } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: 'O título é obrigatório.' }, { status: 400 });
    }

    if (!content || !content.trim()) {
      return NextResponse.json({ success: false, error: 'O conteúdo é obrigatório.' }, { status: 400 });
    }

    // Adiciona o documento gerando seu embedding
    const doc = await addDocument(title.trim(), content.trim());

    return NextResponse.json({ success: true, data: doc });
  } catch (error: any) {
    console.error('Erro na API POST de conhecimento:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao indexar documento.' },
      { status: 500 }
    );
  }
}
