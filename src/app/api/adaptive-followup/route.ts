import { NextRequest, NextResponse } from 'next/server';
import { generateAdaptiveFollowup } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { chapterTitle, blockerDescription, profile } = await req.json();

    if (!chapterTitle || !blockerDescription) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const response = await generateAdaptiveFollowup(chapterTitle, blockerDescription, profile);
    return NextResponse.json({ response });
  } catch (error) {
    console.error('Adaptive followup API error:', error);
    return NextResponse.json(
      { error: 'Failed', response: 'Start smaller: pick one moment today to practice.' },
      { status: 500 }
    );
  }
}
