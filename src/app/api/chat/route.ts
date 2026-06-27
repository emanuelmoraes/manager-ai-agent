import { NextRequest, NextResponse } from 'next/server';
import { getProviderKeys } from '@/lib/config/providers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, systemPrompt, provider, model } = body;

    if (!message || !provider || !model) {
      return NextResponse.json({ error: 'Campos message, provider e model são obrigatórios.' }, { status: 400 });
    }

    const keys = getProviderKeys();
    let apiKey = "";
    if (provider === 'google') apiKey = keys.google || process.env.GEMINI_API_KEY || "";
    else if (provider === 'openai') apiKey = keys.openai || "";
    else if (provider === 'anthropic') apiKey = keys.anthropic || "";

    if (!apiKey) {
      return NextResponse.json({
        response: `[Simulado] Olá! Recebi sua mensagem: "${message}". Como a chave de API para o provedor ${provider.toUpperCase()} não está configurada na sessão 'Configurações', estou respondendo em modo de simulação baseado no meu papel. Como posso ajudar com a tarefa?`
      });
    }

    if (provider === 'google') {
      const geminiModel = model.replace('googleai/', '');
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `Instruções do Sistema:\n${systemPrompt}\n\nMensagem do Usuário: ${message}` }]
            }
          ]
        })
      });
      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sem resposta.";
        return NextResponse.json({ response: text });
      } else {
        const errText = await response.text();
        throw new Error(`Google API error: ${errText}`);
      }
    } else if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ]
        })
      });
      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || "";
        return NextResponse.json({ response: text });
      } else {
        const errText = await response.text();
        throw new Error(`OpenAI API error: ${errText}`);
      }
    } else if (provider === 'anthropic') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 4096,
          system: systemPrompt,
          messages: [
            { role: 'user', content: message }
          ]
        })
      });
      if (response.ok) {
        const data = await response.json();
        const text = data.content?.[0]?.text || "";
        return NextResponse.json({ response: text });
      } else {
        const errText = await response.text();
        throw new Error(`Anthropic API error: ${errText}`);
      }
    }

    return NextResponse.json({ error: 'Provedor não suportado.' }, { status: 400 });

  } catch (error: any) {
    console.error('[chat-api] Erro ao processar:', error);
    return NextResponse.json({ error: `Erro no processamento da mensagem: ${error.message}` }, { status: 500 });
  }
}
