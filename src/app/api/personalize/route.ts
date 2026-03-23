import { NextRequest, NextResponse } from 'next/server';
import { generatePersonalizedIntro } from '@/lib/gemini';
import { loadIntakeServer } from '@/lib/server-supabase';

export async function POST(req: NextRequest) {
  try {
    const { chapterTitle, chapterContent, intake, profile, priorReflections, userId } = await req.json();

    // Feature 2: Load intake from Supabase (authoritative) with client fallback
    const serverIntake = await loadIntakeServer(userId, intake);

    if (!chapterTitle || !serverIntake?.struggle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const intro = await generatePersonalizedIntro(
      chapterTitle,
      chapterContent || '',
      serverIntake,
      profile,
      priorReflections
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
