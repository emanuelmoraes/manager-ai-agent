import { NextRequest, NextResponse } from 'next/server';
import { updateKnowledgeBase, deleteKnowledgeBase } from '@/lib/rag/store';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'O ID da base é obrigatório.' }, { status: 400 });
    }

    const body = await req.json();
    const { name, description, color } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'O nome da base é obrigatório.' }, { status: 400 });
    }

    const updated = await updateKnowledgeBase(id, name.trim(), description?.trim(), color);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Erro na API PUT de base de conhecimento:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao atualizar base de conhecimento.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'O ID da base é obrigatório.' }, { status: 400 });
    }

    const deleted = await deleteKnowledgeBase(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Base de conhecimento não encontrada.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Base de conhecimento excluída com sucesso.' });
  } catch (error: any) {
    console.error('Erro na API DELETE de base de conhecimento:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao excluir base de conhecimento.' },
      { status: 500 }
    );
  }
}
