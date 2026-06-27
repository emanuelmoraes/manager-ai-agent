import { NextRequest, NextResponse } from 'next/server';
import { initializeMcpServers } from '@/lib/mcp/registry';
import { getMcpConfig, saveMcpConfig } from '@/lib/config/mcp';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, error: 'O ID do servidor é obrigatório.' }, { status: 400 });
    }

    const config = await getMcpConfig();
    const initialLength = config.servers.length;
    config.servers = config.servers.filter((s: any) => s.id !== id);

    if (config.servers.length === initialLength) {
      return NextResponse.json({ success: false, error: 'Servidor não encontrado.' }, { status: 404 });
    }

    await saveMcpConfig(config);

    // Reinicializa os servidores MCP de forma forçada no backend para fechar e remover a conexão excluída
    try {
      await initializeMcpServers(true);
    } catch (err) {
      console.error('Erro ao reinicializar servidores MCP após exclusão:', err);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
