import { NextRequest, NextResponse } from 'next/server';
import { generateReviewCards } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { chapterTitle, chapterContent, exerciseQuestion } = await req.json();

    if (!chapterTitle || !chapterContent) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const cards = await generateReviewCards(
      chapterTitle,
      chapterContent,
      exerciseQuestion || ''
    );

    return NextResponse.json({ cards });
  } catch (error) {
    console.error('Review cards API error:', error);
    return NextResponse.json({ cards: [] }, { status: 500 });
  }
}
