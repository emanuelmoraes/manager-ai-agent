import { NextRequest, NextResponse } from 'next/server';
import { getProviderKeys, saveProviderKeys } from '@/lib/config/providers';

export async function GET() {
  try {
    const keys = getProviderKeys();
    // Return only a boolean indicator for security, don't expose actual keys
    const status = {
      google: !!keys.google,
      openai: !!keys.openai,
      anthropic: !!keys.anthropic,
    };
    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // We only accept valid provider keys
    const newKeys = {
      google: body.google,
      openai: body.openai,
      anthropic: body.anthropic,
    };

    saveProviderKeys(newKeys);
    
    if (newKeys.google) process.env.GEMINI_API_KEY = newKeys.google;
    if (newKeys.openai) process.env.OPENAI_API_KEY = newKeys.openai;
    if (newKeys.anthropic) process.env.ANTHROPIC_API_KEY = newKeys.anthropic;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
