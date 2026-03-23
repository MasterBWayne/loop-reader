import { NextRequest, NextResponse } from 'next/server';
import { generateCompanionResponse } from '@/lib/gemini';
import { supabaseAdmin, loadIntakeServer } from '@/lib/server-supabase';

const MONTHLY_LIMIT = 100;

async function checkAndIncrementUsage(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  try {
    // Get current usage
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('ai_messages_this_month, ai_messages_month_reset')
      .eq('id', userId)
      .single();

    if (error || !user) {
      // User doesn't exist in users table yet — allow and don't track
      return { allowed: true, remaining: MONTHLY_LIMIT };
    }

    // Check if we need to reset the monthly counter
    const resetDate = new Date(user.ai_messages_month_reset);
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let currentCount = user.ai_messages_this_month || 0;

    if (resetDate < currentMonthStart) {
      // New month — reset counter
      currentCount = 0;
      await supabaseAdmin
        .from('users')
        .update({
          ai_messages_this_month: 1,
          ai_messages_month_reset: currentMonthStart.toISOString(),
        })
        .eq('id', userId);
      return { allowed: true, remaining: MONTHLY_LIMIT - 1 };
    }

    if (currentCount >= MONTHLY_LIMIT) {
      return { allowed: false, remaining: 0 };
    }

    // Increment
    await supabaseAdmin
      .from('users')
      .update({ ai_messages_this_month: currentCount + 1 })
      .eq('id', userId);

    return { allowed: true, remaining: MONTHLY_LIMIT - currentCount - 1 };
  } catch (err) {
    console.error('Usage check error:', err);
    // On error, allow the message (don't block UX for tracking failures)
    return { allowed: true, remaining: MONTHLY_LIMIT };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { message, chapterTitle, chapterContent, chatHistory, intake, userId, profile } = await req.json();

    if (!message || !chapterTitle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check usage cap
    if (userId) {
      const { allowed, remaining } = await checkAndIncrementUsage(userId);
      if (!allowed) {
        return NextResponse.json({
          response: "You've reached your monthly limit of 100 AI companion messages. Your limit resets at the start of next month.\n\n*Upgrade for unlimited conversations.*",
          limitReached: true,
          remaining: 0,
        });
      }
    }

    // Feature 2: Load intake from Supabase (authoritative) with client fallback
    const serverIntake = await loadIntakeServer(userId, intake);

    const response = await generateCompanionResponse(
      chapterTitle,
      chapterContent || '',
      message,
      chatHistory || [],
      serverIntake || undefined,
      profile
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
