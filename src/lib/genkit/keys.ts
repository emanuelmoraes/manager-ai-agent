/**
 * Garante que a variável de ambiente GEMINI_API_KEY (Fonte Única de Verdade)
 * está configurada no ambiente do servidor.
 *
 * Sincroniza o valor internamente para o SDK do Genkit (@genkit-ai/google-genai)
 * caso algum sub-módulo busque por GOOGLE_API_KEY como fallback de nomenclatura.
 *
 * @throws {Error} Se a variável GEMINI_API_KEY não estiver definida ou estiver vazia.
 * @returns {string} A chave da API validada.
 */
export function ensureGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      'A chave de API GEMINI_API_KEY não está configurada nas variáveis de ambiente do servidor.'
    );
  }

  // Alinhamento de nomenclatura para bibliotecas do ecossistema Google AI
  if (!process.env.GOOGLE_API_KEY) {
    process.env.GOOGLE_API_KEY = apiKey;
  }

  return apiKey;
}
