import { NextRequest, NextResponse } from 'next/server';
import { deleteDocument } from '@/lib/rag/store';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, error: 'O ID do documento é obrigatório.' }, { status: 400 });
    }

    const deleted = await deleteDocument(id);

    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Documento não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Documento excluído com sucesso.' });
  } catch (error: any) {
    console.error('Erro na API DELETE de conhecimento:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao excluir documento.' },
      { status: 500 }
    );
  }
}
