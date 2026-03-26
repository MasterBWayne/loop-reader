import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const GEMINI_KEY = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    if (!GEMINI_KEY) return NextResponse.json({ error: 'AI not configured' }, { status: 500 });

    const { reflections, exerciseCount, chaptersRead, booksActive } = await req.json();

    if (!reflections || reflections.length === 0) {
      return NextResponse.json({
        synthesis: "Not enough activity this week to generate a synthesis. Keep reading — even one chapter a day gives the AI enough to spot your patterns.",
        generated: true,
      });
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });

    const prompt = `You are a reading coach analyzing a reader's week. Summarize their patterns in EXACTLY 3 sentences.

This week they:
- Read ${chaptersRead} chapters across ${booksActive} book(s)
- Completed ${exerciseCount} exercises
- Their reflections/exercise responses this week:
${reflections.map((r: string, i: number) => `${i + 1}. "${r}"`).join('\n')}

RULES:
1. Sentence 1: The dominant theme or pattern you see across their reflections (what are they really working through?)
2. Sentence 2: A specific insight or shift you notice — quote their own words if powerful
3. Sentence 3: One thing to watch or lean into next week — practical, warm, specific to them
- Write like a sharp friend, not a therapist
- Under 80 words total
- No generic self-help language`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: { temperature: 0.7, maxOutputTokens: 200 },
    });

    const text = response.text || 'Could not generate synthesis.';

    return NextResponse.json({ synthesis: text, generated: true });
  } catch (e: any) {
    console.error('Weekly synthesis error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
