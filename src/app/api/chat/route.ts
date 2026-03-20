import { NextRequest, NextResponse } from 'next/server';
import { generateCompanionResponse } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { message, chapterTitle, chapterContent, chatHistory, intake } = await req.json();

    if (!message || !chapterTitle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const response = await generateCompanionResponse(
      chapterTitle,
      chapterContent || '',
      message,
      chatHistory || [],
      intake
    );

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response', response: "Something went wrong. Try again in a moment." },
      { status: 500 }
    );
  }
}
