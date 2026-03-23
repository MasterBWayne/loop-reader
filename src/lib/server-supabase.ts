import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with service role key (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export { supabaseAdmin };

export interface ServerIntakeData {
  struggle: string;
  duration: string;
  impact: string;
  tried: string;
  vision: string;
}

/**
 * Load intake data from Supabase on the server side.
 * Falls back to clientIntake if userId not provided or DB lookup fails.
 */
export async function loadIntakeServer(
  userId?: string,
  clientIntake?: ServerIntakeData
): Promise<ServerIntakeData | null> {
  if (!userId) return clientIntake || null;

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('intake_struggle, intake_duration, intake_impact, intake_tried, intake_vision, intake_completed')
      .eq('id', userId)
      .single();

    if (error || !data?.intake_struggle) return clientIntake || null;

    return {
      struggle: data.intake_struggle || '',
      duration: data.intake_duration || '',
      impact: data.intake_impact || '',
      tried: data.intake_tried || '',
      vision: data.intake_vision || '',
    };
  } catch {
    return clientIntake || null;
  }
}

/**
 * Build the user context preamble to prepend to AI system prompts.
 */
export function buildUserContextPreamble(intake: ServerIntakeData | null): string {
  if (!intake?.struggle) return '';
  return `User context: This person is working on: ${intake.struggle}. Their vision: ${intake.vision}. Impact: ${intake.impact}. Always connect your response to their specific situation.\n\n`;
}
