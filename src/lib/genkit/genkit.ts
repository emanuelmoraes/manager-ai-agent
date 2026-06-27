import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
// A chave de API é injetada dinamicamente via process.env.GEMINI_API_KEY nos controladores.

/**
 * Instância global do Genkit configurada com os provedores dinâmicos do sistema.
 */
export const ai = genkit({
  plugins: [googleAI()],
});
