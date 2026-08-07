import { NextRequest, NextResponse } from 'next/server';
import { getWorkflowsFromFirebase, syncWorkflowToFirebase, deleteWorkflowFromFirebase } from '@/lib/firebase/sync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const workflows = await getWorkflowsFromFirebase();
    return NextResponse.json({ success: true, data: workflows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id || !body.name) {
      return NextResponse.json({ success: false, error: 'ID e Nome do Workflow são obrigatórios.' }, { status: 400 });
    }

    const workflow = {
      id: body.id,
      name: body.name,
      description: body.description || '',
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: body.nodes || [],
      edges: body.edges || [],
    };

    await syncWorkflowToFirebase(workflow);
    return NextResponse.json({ success: true, data: workflow });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID é obrigatório.' }, { status: 400 });
    }

    await deleteWorkflowFromFirebase(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
