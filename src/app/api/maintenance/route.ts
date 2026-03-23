import { NextRequest, NextResponse } from 'next/server';
import { generateMaintenanceResponse } from '@/lib/gemini';
import { loadIntakeServer } from '@/lib/server-supabase';

export async function POST(req: NextRequest) {
  try {
    const { chapterTitle, rating, reflection, profile, userId } = await req.json();

    if (!chapterTitle || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Feature 2: Load intake from Supabase for personalized maintenance response
    const serverIntake = await loadIntakeServer(userId);

    const response = await generateMaintenanceResponse(
      chapterTitle,
      rating,
      reflection || '',
      profile,
      serverIntake || undefined
    );

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Maintenance response error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response', response: '' },
      { status: 500 }
    );
  }
}
