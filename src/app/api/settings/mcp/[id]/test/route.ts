import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, error: 'O ID do servidor é obrigatório.' }, { status: 400 });
    }

    const config = getMcpConfig();
    const serverConfig = config.servers.find((s: any) => s.id === id);

    if (!serverConfig) {
      return NextResponse.json({ success: false, error: 'Servidor não encontrado.' }, { status: 404 });
    }

    const client = new Client(
      {
        name: `manager-ai-test-client-${serverConfig.id}`,
        version: "1.0.0",
      },
      { capabilities: {} }
    );

    let transport;

    if (serverConfig.type === "stdio") {
      transport = new StdioClientTransport({
        command: serverConfig.command,
        args: serverConfig.args,
        env: { ...process.env, ...(serverConfig.env || {}) },
      });
    } else if (serverConfig.type === "sse") {
      transport = new SSEClientTransport(new URL(serverConfig.url));
    } else {
      return NextResponse.json({ success: false, error: `Transporte MCP não suportado: ${serverConfig.type}` }, { status: 400 });
    }

    await client.connect(transport);
    const tools = await client.listTools();
    await client.close();

    return NextResponse.json({ success: true, tools: tools.tools });
  } catch (error: any) {
    console.error('Erro ao testar servidor MCP:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
