import { NextRequest, NextResponse } from 'next/server';
import { generateMaintenanceResponse } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { chapterTitle, rating, reflection, profile } = await req.json();

    if (!chapterTitle || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const response = await generateMaintenanceResponse(
      chapterTitle,
      rating,
      reflection || '',
      profile
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
