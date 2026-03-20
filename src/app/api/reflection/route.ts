import { NextRequest, NextResponse } from 'next/server';
import { generateReflectionResponse } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { chapterTitle, questionText, answerText, profile } = await req.json();
    if (!chapterTitle || !answerText) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    const response = await generateReflectionResponse(chapterTitle, questionText, answerText, profile);
    return NextResponse.json({ response });
  } catch (error) {
    console.error('Reflection API error:', error);
    return NextResponse.json({ error: 'Failed', response: '' }, { status: 500 });
  }
}
