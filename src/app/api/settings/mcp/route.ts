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

export async function GET() {
  try {
    const config = getMcpConfig();
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

    const config = getMcpConfig();
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

    saveMcpConfig(config);

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
