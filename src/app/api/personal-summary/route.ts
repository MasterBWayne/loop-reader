import { NextRequest, NextResponse } from 'next/server';
import { generatePersonalSummary } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { bookTitle, reflections, checkins, profile } = await req.json();

    if (!bookTitle) {
      return NextResponse.json({ error: 'Missing book title' }, { status: 400 });
    }

    const summary = await generatePersonalSummary(
      bookTitle,
      reflections || [],
      checkins || [],
      profile
    );

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Personal summary API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary', summary: '' },
      { status: 500 }
    );
  }
}
