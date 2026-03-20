import { NextRequest, NextResponse } from 'next/server';
import { generateReflectionResponse, categorizeReflectionTags } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { chapterTitle, questionText, answerText, profile } = await req.json();
    if (!chapterTitle || !answerText) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    const response = await generateReflectionResponse(chapterTitle, questionText, answerText, profile);
    // Fetch tags async but we can wait for it here
    const tags = await categorizeReflectionTags(answerText);
    return NextResponse.json({ response, tags });
  } catch (error) {
    console.error('Reflection API error:', error);
    return NextResponse.json({ error: 'Failed', response: '', tags: [] }, { status: 500 });
  }
}
