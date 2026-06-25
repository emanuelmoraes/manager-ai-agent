import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { getProviderKeys } from '../config/providers';

const keys = getProviderKeys();

// Se houver uma chave salva no sistema local, ela tem prioridade
if (keys.google) {
  process.env.GEMINI_API_KEY = keys.google;
}

/**
 * Instância global do Genkit configurada com os provedores dinâmicos do sistema.
 */
export const ai = genkit({
  plugins: [googleAI()],
});
