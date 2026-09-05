import { NextResponse } from 'next/server';

export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Responde a requisições pre-flight OPTIONS de navegadores externos
 */
export function handleCorsPreflight(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/**
 * Retorna uma resposta JSON incluindo os headers CORS adequados
 */
export function jsonResponseWithCors(data: unknown, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...corsHeaders,
      ...(init?.headers || {}),
    },
  });
}
