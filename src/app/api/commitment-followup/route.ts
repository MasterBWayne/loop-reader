import { NextRequest, NextResponse } from 'next/server';
import { generateCommitmentFollowUp } from '@/lib/gemini';
import { loadIntakeServer } from '@/lib/server-supabase';

export async function POST(req: NextRequest) {
  try {
    const { commitmentText, chapterTitle, outcomeText, profile, userId } = await req.json();

    if (!commitmentText || !outcomeText) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Feature 2: Load intake from Supabase for personalized follow-up
    const serverIntake = await loadIntakeServer(userId);

    const response = await generateCommitmentFollowUp(
      commitmentText,
      chapterTitle || '',
      outcomeText,
      profile,
      serverIntake || undefined
    );

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Commitment follow-up error:', error);
    return NextResponse.json(
      { error: 'Failed to generate follow-up', response: '' },
      { status: 500 }
    );
  }
}
