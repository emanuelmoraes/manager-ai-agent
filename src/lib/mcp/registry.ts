import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { ai } from "@/lib/genkit";
import fs from 'fs';
import path from 'path';

// Keep references to connected clients
const mcpClients: Record<string, Client> = {};
let initialized = false;

/**
 * Initializes all configured MCP servers.
 */
export async function initializeMcpServers(force: boolean = false) {
  if (initialized && !force) return;

  // Fechar conexões anteriores se for forçada a reinicialização
  if (force) {
    for (const [id, client] of Object.entries(mcpClients)) {
      try {
        await client.close();
        console.log(`[MCP] Conexão encerrada para o servidor: ${id}`);
      } catch (err) {
        console.error(`[MCP] Erro ao fechar conexão com servidor ${id}:`, err);
      }
      delete mcpClients[id];
    }
  }

  // Ler o arquivo mcp.json dinamicamente para evitar cache
  const mcpConfigPath = path.join(process.cwd(), 'src', 'lib', 'config', 'mcp.json');
  let configServers = [];
  try {
    if (fs.existsSync(mcpConfigPath)) {
      const data = fs.readFileSync(mcpConfigPath, 'utf8');
      configServers = JSON.parse(data).servers;
    }
  } catch (err) {
    console.error('[MCP] Erro ao ler mcp.json para inicialização:', err);
  }

  for (const serverConfig of configServers) {
    try {
      const client = new Client(
        {
          name: `manager-ai-client-${serverConfig.id}`,
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
        transport = new SSEClientTransport(new URL((serverConfig as any).url));
      } else {
        throw new Error(`Transporte MCP não suportado: ${serverConfig.type}`);
      }

      await client.connect(transport);
      mcpClients[serverConfig.id] = client;
      console.log(`[MCP] Conectado ao servidor: ${serverConfig.id}`);
    } catch (error) {
      console.error(`[MCP] Falha ao conectar no servidor ${serverConfig.id}:`, error);
    }
  }

  initialized = true;
}

/**
 * Loads all tools from connected MCP servers and maps them to Genkit tools.
 */
export async function getMcpTools(allowedServerIds?: string[]) {
  await initializeMcpServers();

  const genkitTools = [];

  for (const [serverId, client] of Object.entries(mcpClients)) {
    // Se a lista de permitidos estiver definida e o servidor não estiver nela, pula
    if (allowedServerIds && !allowedServerIds.includes(serverId)) {
      continue;
    }

    try {
      const { tools } = await client.listTools();

      for (const tool of tools) {
        // Create a unique name for the tool using the server ID to avoid conflicts
        const toolName = `${serverId}_${tool.name}`.replace(/[^a-zA-Z0-Z_-]/g, "_");

        const genkitTool = ai.defineTool(
          {
            name: toolName,
            description: `[Fonte: ${serverId}] ${tool.description || "Ferramenta MCP"}`,
            // Pass the raw JSON schema provided by the MCP server
            // Genkit can accept JSON schemas directly if we cast them
            inputSchema: tool.inputSchema as any,
          },
          async (input) => {
            console.log(`[MCP] Executando ${toolName}...`);
            const result = await client.callTool({
              name: tool.name,
              arguments: input as Record<string, unknown>,
            });

            if (result.isError) {
              throw new Error((result.content as any[]).map(c => c.type === 'text' ? c.text : 'Erro').join('\n'));
            }

            return result.content as any;
          }
        );

        genkitTools.push(genkitTool);
      }
    } catch (error) {
      console.error(`[MCP] Falha ao listar/mapear ferramentas do servidor ${serverId}:`, error);
    }
  }

  return genkitTools;
}
