import { NextRequest, NextResponse } from 'next/server';
import { evaluateActiveRecall } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { userResponse, chapterTitle, chapterContent, exerciseQuestion } = await req.json();

    if (!userResponse || !chapterTitle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await evaluateActiveRecall(
      userResponse,
      chapterTitle,
      chapterContent || '',
      exerciseQuestion
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Active recall API error:', error);
    return NextResponse.json(
      { understood: true, feedback: 'Thanks for reflecting.', missed: '' },
      { status: 500 }
    );
  }
}
