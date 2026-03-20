import { NextRequest, NextResponse } from 'next/server';
import { generateCommitmentFollowUp } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { commitmentText, chapterTitle, outcomeText, profile } = await req.json();

    if (!commitmentText || !outcomeText) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const response = await generateCommitmentFollowUp(
      commitmentText,
      chapterTitle || '',
      outcomeText,
      profile
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
