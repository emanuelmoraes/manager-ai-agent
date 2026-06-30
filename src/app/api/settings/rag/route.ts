import { NextRequest, NextResponse } from 'next/server';
import { getRagConfig, saveRagConfig } from '@/lib/config/rag';

export async function GET() {
  try {
    const config = await getRagConfig();
    return NextResponse.json({ success: true, data: config });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    if (typeof body.searchLimit !== 'number' || body.searchLimit < 1) {
      return NextResponse.json({ success: false, error: 'O limite de busca deve ser um número maior que 0.' }, { status: 400 });
    }

    const success = await saveRagConfig({ searchLimit: body.searchLimit });

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: 'Falha ao salvar no Firebase.' }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
