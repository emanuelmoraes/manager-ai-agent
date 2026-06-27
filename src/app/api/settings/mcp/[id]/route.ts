import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { initializeMcpServers } from '@/lib/mcp/registry';

const mcpConfigPath = path.join(process.cwd(), 'src', 'lib', 'config', 'mcp.json');

function getMcpConfig() {
  try {
    if (!fs.existsSync(mcpConfigPath)) {
      return { servers: [] };
    }
    const data = fs.readFileSync(mcpConfigPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Erro ao ler mcp.json:', err);
    return { servers: [] };
  }
}

function saveMcpConfig(config: any) {
  const dir = path.dirname(mcpConfigPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(mcpConfigPath, JSON.stringify(config, null, 2), 'utf8');
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, error: 'O ID do servidor é obrigatório.' }, { status: 400 });
    }

    const config = getMcpConfig();
    const initialLength = config.servers.length;
    config.servers = config.servers.filter((s: any) => s.id !== id);

    if (config.servers.length === initialLength) {
      return NextResponse.json({ success: false, error: 'Servidor não encontrado.' }, { status: 404 });
    }

    saveMcpConfig(config);

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
