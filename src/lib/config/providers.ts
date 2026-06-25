import fs from 'fs';
import path from 'path';

export interface ProviderKeys {
  google?: string;
  openai?: string;
  anthropic?: string;
}

const keysPath = path.join(process.cwd(), 'src', 'lib', 'config', 'keys.json');

/**
 * Lê as chaves salvas localmente.
 */
export function getProviderKeys(): ProviderKeys {
  try {
    if (fs.existsSync(keysPath)) {
      const data = fs.readFileSync(keysPath, 'utf8');
      return JSON.parse(data) as ProviderKeys;
    }
  } catch (error) {
    console.error('Erro ao ler chaves de API:', error);
  }
  return {};
}

/**
 * Salva as chaves no arquivo local.
 */
export function saveProviderKeys(keys: ProviderKeys): void {
  try {
    const current = getProviderKeys();
    const updated = { ...current, ...keys };
    
    // Remove chaves vazias
    for (const key in updated) {
      if (!updated[key as keyof ProviderKeys]) {
        delete updated[key as keyof ProviderKeys];
      }
    }

    fs.writeFileSync(keysPath, JSON.stringify(updated, null, 2), 'utf8');
  } catch (error) {
    console.error('Erro ao salvar chaves de API:', error);
    throw new Error('Falha ao salvar as configurações.');
  }
}
