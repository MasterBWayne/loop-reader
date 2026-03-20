import { NextRequest, NextResponse } from 'next/server';
import { generatePersonalizedIntro } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { chapterTitle, chapterContent, intake, profile } = await req.json();

    if (!chapterTitle || !intake?.struggle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const intro = await generatePersonalizedIntro(
      chapterTitle,
      chapterContent || '',
      intake,
      profile
    );

    return NextResponse.json({ intro });
  } catch (error) {
    console.error('Personalization error:', error);
    return NextResponse.json(
      { error: 'Failed to generate personalized intro', intro: '' },
      { status: 500 }
    );
  }
}
