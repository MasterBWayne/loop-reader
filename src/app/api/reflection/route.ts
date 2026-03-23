import { NextRequest, NextResponse } from 'next/server';
import { generateReflectionResponse, categorizeReflectionTags } from '@/lib/gemini';
import { loadIntakeServer } from '@/lib/server-supabase';

export async function POST(req: NextRequest) {
  try {
    const { chapterTitle, questionText, answerText, profile, userId } = await req.json();
    if (!chapterTitle || !answerText) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    // Feature 2: Load intake from Supabase for personalized response
    const serverIntake = await loadIntakeServer(userId);
    const response = await generateReflectionResponse(chapterTitle, questionText, answerText, profile, serverIntake || undefined);
    // Fetch tags async but we can wait for it here
    const tags = await categorizeReflectionTags(answerText);
    return NextResponse.json({ response, tags });
  } catch (error) {
    console.error('Reflection API error:', error);
    return NextResponse.json({ error: 'Failed', response: '', tags: [] }, { status: 500 });
  }
}
