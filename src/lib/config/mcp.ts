import { adminDb } from '../firebase/admin';

export interface McpServerConfig {
  id: string;
  name?: string;
  type: 'sse' | 'stdio';
  url?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface McpConfig {
  servers: McpServerConfig[];
}

export async function getMcpConfig(): Promise<McpConfig> {
  try {
    if (!adminDb) return { servers: [] };
    const mcpDocRef = adminDb.collection('config').doc('mcp');
    const doc = await mcpDocRef.get();
    if (doc.exists) {
      const data = doc.data() as McpConfig;
      if (data.servers) return data;
    }
  } catch (error) {
    console.error('Erro ao ler configuração MCP:', error);
  }
  return { servers: [] };
}

export async function saveMcpConfig(config: McpConfig): Promise<void> {
  try {
    if (!adminDb) throw new Error("Firebase Admin não inicializado");
    const mcpDocRef = adminDb.collection('config').doc('mcp');
    await mcpDocRef.set(config);
  } catch (error) {
    console.error('Erro ao salvar configuração MCP:', error);
    throw new Error('Falha ao salvar as configurações.');
  }
}
