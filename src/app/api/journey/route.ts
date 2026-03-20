import { NextRequest, NextResponse } from 'next/server';
import { generateJourneySummary } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { bookTitle, reflections, profile } = await req.json();
    if (!bookTitle || !reflections?.length) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    const summary = await generateJourneySummary(bookTitle, reflections, profile);
    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Journey API error:', error);
    return NextResponse.json({ error: 'Failed', summary: '' }, { status: 500 });
  }
}
