import { NextRequest, NextResponse } from 'next/server';
import { getProviderKeys, saveProviderKeys } from '@/lib/config/providers';

export async function GET() {
  try {
    const keys = await getProviderKeys();
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
    const { google, openai, anthropic } = await req.json();
    
    // We only accept valid provider keys
    await saveProviderKeys({ google, openai, anthropic });
    
    if (google) process.env.GEMINI_API_KEY = google;
    if (openai) process.env.OPENAI_API_KEY = openai;
    if (anthropic) process.env.ANTHROPIC_API_KEY = anthropic;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
