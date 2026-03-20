import { NextRequest, NextResponse } from 'next/server';
import { generateWeeklyInsight } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { reflections } = await req.json();
    if (!reflections?.length) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    
    // We expect { bookTitle, chapterTitle, answer_text } for each reflection
    const data = await generateWeeklyInsight(reflections);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Insight API error:', error);
    return NextResponse.json({ error: 'Failed', insight: '' }, { status: 500 });
  }
}
