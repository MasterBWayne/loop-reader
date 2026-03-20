import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Anonymous Auth ─────────────────────────────────────────────────────────

/** Get or create an anonymous user. Returns user ID. */
export async function ensureAnonymousUser(): Promise<string | null> {
  try {
    // Check if there's already a session
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) return session.user.id;

    // Sign in anonymously
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error('Anonymous auth failed:', error.message);
      return null;
    }
    return data.user?.id || null;
  } catch (err) {
    console.error('Auth error:', err);
    return null;
  }
}

/** Get current user ID (null if not authenticated) */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
  } catch {
    return null;
  }
}

// ── Intake Answers ─────────────────────────────────────────────────────────

export interface IntakeData {
  struggle: string;
  duration: string;
  impact: string;
  tried: string;
  vision: string;
}

/** Save intake answers to Supabase users table */
export async function saveIntake(userId: string, intake: IntakeData): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('users')
      .upsert({
        id: userId,
        intake_struggle: intake.struggle,
        intake_duration: intake.duration,
        intake_impact: intake.impact,
        intake_tried: intake.tried,
        intake_vision: intake.vision,
        intake_completed: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (error) {
      console.error('Save intake error:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** Load intake answers from Supabase */
export async function loadIntake(userId: string): Promise<IntakeData | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('intake_struggle, intake_duration, intake_impact, intake_tried, intake_vision, intake_completed')
      .eq('id', userId)
      .single();

    if (error || !data?.intake_completed) return null;

    return {
      struggle: data.intake_struggle || '',
      duration: data.intake_duration || '',
      impact: data.intake_impact || '',
      tried: data.intake_tried || '',
      vision: data.intake_vision || '',
    };
  } catch {
    return null;
  }
}

// ── Chapter Progress ───────────────────────────────────────────────────────

export interface ChapterProgressRecord {
  chapter_number: number;
  unlocked_at: string;
  first_opened_at: string | null;
}

/** Save chapter open event to Supabase */
export async function saveChapterProgress(
  userId: string,
  bookId: string,
  chapterNumber: number
): Promise<boolean> {
  try {
    const now = new Date().toISOString();

    // Try to insert; if exists, update first_opened_at only if null
    const { data: existing } = await supabase
      .from('chapter_progress')
      .select('id, first_opened_at')
      .eq('user_id', userId)
      .eq('chapter_number', chapterNumber)
      .maybeSingle();

    if (existing) {
      // Update first_opened_at if not set
      if (!existing.first_opened_at) {
        await supabase
          .from('chapter_progress')
          .update({ first_opened_at: now })
          .eq('id', existing.id);
      }
    } else {
      // Insert new record
      // Need to look up book UUID from slug — for now use the string ID directly
      await supabase
        .from('chapter_progress')
        .insert({
          user_id: userId,
          chapter_number: chapterNumber,
          unlocked_at: now,
          first_opened_at: now,
        });
    }
    return true;
  } catch {
    return false;
  }
}

/** Load all chapter progress for a user */
export async function loadChapterProgress(
  userId: string
): Promise<ChapterProgressRecord[]> {
  try {
    const { data, error } = await supabase
      .from('chapter_progress')
      .select('chapter_number, unlocked_at, first_opened_at')
      .eq('user_id', userId)
      .order('chapter_number');

    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}
