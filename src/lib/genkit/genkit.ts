import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Instância global do Genkit configurada com o plugin Google AI (Gemini).
 * Todos os flows e agentes devem importar esta instância.
 */
export const ai = genkit({
  plugins: [googleAI()],
});
