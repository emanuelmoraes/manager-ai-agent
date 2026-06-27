import { NextRequest, NextResponse } from 'next/server';
import { initializeMcpServers } from '@/lib/mcp/registry';
import { getMcpConfig, saveMcpConfig } from '@/lib/config/mcp';

export async function GET() {
  try {
    const config = await getMcpConfig();
    return NextResponse.json({ success: true, data: config.servers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, type, url, command, args, env } = body;

    if (!id || !id.trim()) {
      return NextResponse.json({ success: false, error: 'O ID do servidor é obrigatório.' }, { status: 400 });
    }

    if (!type || (type !== 'sse' && type !== 'stdio')) {
      return NextResponse.json({ success: false, error: 'O tipo do servidor deve ser sse ou stdio.' }, { status: 400 });
    }

    if (type === 'sse' && (!url || !url.trim())) {
      return NextResponse.json({ success: false, error: 'A URL do servidor SSE é obrigatória.' }, { status: 400 });
    }

    if (type === 'stdio' && (!command || !command.trim())) {
      return NextResponse.json({ success: false, error: 'O comando do servidor Stdio é obrigatório.' }, { status: 400 });
    }

    const config = await getMcpConfig();
    const existingIndex = config.servers.findIndex((s: any) => s.id === id);

    const serverData: any = {
      id: id.trim(),
      name: (name || id).trim(),
      type,
    };

    if (type === 'sse') {
      serverData.url = url.trim();
    } else {
      serverData.command = command.trim();
      serverData.args = Array.isArray(args) ? args : (args ? args.split(',').map((a: string) => a.trim()) : []);
      serverData.env = env || {};
    }

    if (existingIndex > -1) {
      config.servers[existingIndex] = serverData;
    } else {
      config.servers.push(serverData);
    }

    await saveMcpConfig(config);

    // Reinicializa os servidores MCP de forma forçada no backend para conectar ao novo servidor
    try {
      await initializeMcpServers(true);
    } catch (err) {
      console.error('Erro ao reinicializar servidores MCP após cadastro:', err);
    }

    return NextResponse.json({ success: true, data: serverData });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
