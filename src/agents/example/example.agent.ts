import { z } from 'genkit';
import { ai } from '@/lib/genkit';

/**
 * Schema de entrada do agente de exemplo.
 */
const ExampleInputSchema = z.object({
  message: z.string().describe('Mensagem enviada pelo usuário'),
});

/**
 * Schema de saída do agente de exemplo.
 */
const ExampleOutputSchema = z.object({
  response: z.string().describe('Resposta gerada pelo agente'),
});

/**
 * Flow de exemplo que ilustra como criar um agente com Genkit.
 * Substitua este agente pelos seus casos de uso reais.
 */
export const exampleAgentFlow = ai.defineFlow(
  {
    name: 'exampleAgentFlow',
    inputSchema: ExampleInputSchema,
    outputSchema: ExampleOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      prompt: input.message,
      output: { schema: ExampleOutputSchema },
    });

    if (!output) {
      throw new Error('Nenhuma resposta gerada pelo modelo.');
    }

    return output;
  },
);
