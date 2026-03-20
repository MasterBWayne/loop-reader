import { NextRequest, NextResponse } from 'next/server';
import { generateFlashbackReframe } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { answerText } = await req.json();
    if (!answerText) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    
    const data = await generateFlashbackReframe(answerText);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Flashback API error:', error);
    return NextResponse.json({ error: 'Failed', reframe: '', microStep: '' }, { status: 500 });
  }
}
