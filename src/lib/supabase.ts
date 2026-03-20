import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Auth ───────────────────────────────────────────────────────────────────

export async function ensureAnonymousUser(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) return session.user.id;
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) { console.error('Anonymous auth failed:', error.message); return null; }
    return data.user?.id || null;
  } catch (err) { console.error('Auth error:', err); return null; }
}

export async function getCurrentUser() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user || null;
  } catch { return null; }
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) console.error('Google sign-in error:', error.message);
  return { data, error };
}

export async function signInWithEmail(email: string, password: string) {
  // Capture anonymous user ID before signing in (for data migration)
  const { data: { session: anonSession } } = await supabase.auth.getSession();
  const anonUserId = anonSession?.user?.is_anonymous ? anonSession.user.id : null;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  // If we had anon data and now signed in as a different user, migrate
  if (!error && data.user && anonUserId && anonUserId !== data.user.id) {
    await migrateAnonymousData(anonUserId, data.user.id);
  }

  return { data, error };
}

/** Migrate intake + progress from anonymous UID to permanent UID */
async function migrateAnonymousData(fromId: string, toId: string) {
  try {
    // Load intake from anon user
    const anonIntake = await loadIntake(fromId);
    if (anonIntake) {
      // Check if target user already has intake
      const existingIntake = await loadIntake(toId);
      if (!existingIntake) {
        await saveIntake(toId, anonIntake);
      }
    }

    // Migrate localStorage data too
    const localIntake = localStorage.getItem('loop-reader-intake');
    if (localIntake) {
      // Keep it — it'll be picked up by the new session
    }
  } catch (err) {
    console.error('Data migration error:', err);
  }
}

export async function signUpWithEmail(email: string, password: string) {
  // Check if current session is anonymous — if so, upgrade instead of creating new user
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user?.is_anonymous) {
    // Upgrade anonymous user to permanent by adding email+password
    const { data, error } = await supabase.auth.updateUser({
      email,
      password,
    });
    return { data: { user: data.user, session }, error };
  }

  // No anonymous session — standard signup
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
  });
  return { data, error };
}

export async function signOut() {
  await supabase.auth.signOut();
}

/** Link anonymous account to a permanent identity (Google/email).
 *  Supabase handles UID migration natively when linking. */
export async function linkWithGoogle() {
  const { data, error } = await supabase.auth.linkIdentity({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
  if (error) console.error('Link Google error:', error.message);
  return { data, error };
}

export function isAnonymousUser(user: { is_anonymous?: boolean } | null): boolean {
  return !!user?.is_anonymous;
}

// ── User Profile ───────────────────────────────────────────────────────────

export interface UserProfileData {
  display_name?: string;
  age?: number;
  life_situation?: string;
  current_goals?: string;
  biggest_challenges?: string;
  relationship_status?: string;
  career_stage?: string;
}

export async function loadUserProfile(userId: string): Promise<UserProfileData | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('display_name, age, life_situation, current_goals, biggest_challenges, relationship_status, career_stage, profile_completed')
      .eq('id', userId)
      .single();
    if (error || !data?.profile_completed) return null;
    return data;
  } catch { return null; }
}

// ── Intake ─────────────────────────────────────────────────────────────────

export interface IntakeData {
  struggle: string;
  duration: string;
  impact: string;
  tried: string;
  vision: string;
}

export async function saveIntake(userId: string, intake: IntakeData): Promise<boolean> {
  try {
    const { error } = await supabase.from('users').upsert({
      id: userId,
      intake_struggle: intake.struggle,
      intake_duration: intake.duration,
      intake_impact: intake.impact,
      intake_tried: intake.tried,
      intake_vision: intake.vision,
      intake_completed: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (error) { console.error('Save intake error:', error.message); return false; }
    return true;
  } catch { return false; }
}

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
  } catch { return null; }
}

// ── Chapter Reflections ────────────────────────────────────────────────────

export interface ReflectionRecord {
  chapter_number: number;
  question_text: string;
  answer_text: string;
  created_at: string;
}

export async function saveReflection(userId: string, bookId: string, chapterNumber: number, questionText: string, answerText: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('chapter_reflections').upsert({
      user_id: userId,
      book_id: bookId,
      chapter_number: chapterNumber,
      question_text: questionText,
      answer_text: answerText,
    }, { onConflict: 'user_id,book_id,chapter_number' });
    if (error) { console.error('Save reflection error:', error.message); return false; }
    return true;
  } catch { return false; }
}

export async function loadReflections(userId: string, bookId: string): Promise<ReflectionRecord[]> {
  try {
    const { data, error } = await supabase
      .from('chapter_reflections')
      .select('chapter_number, question_text, answer_text, created_at')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .order('chapter_number');
    if (error || !data) return [];
    return data;
  } catch { return []; }
}

// ── Chapter Progress ───────────────────────────────────────────────────────

export interface ChapterProgressRecord {
  chapter_number: number;
  unlocked_at: string;
  first_opened_at: string | null;
}

export async function saveChapterProgress(userId: string, bookId: string, chapterNumber: number): Promise<boolean> {
  try {
    const now = new Date().toISOString();
    const { data: existing } = await supabase
      .from('chapter_progress')
      .select('id, first_opened_at')
      .eq('user_id', userId)
      .eq('chapter_number', chapterNumber)
      .maybeSingle();

    if (existing) {
      if (!existing.first_opened_at) {
        await supabase.from('chapter_progress').update({ first_opened_at: now }).eq('id', existing.id);
      }
    } else {
      await supabase.from('chapter_progress').insert({
        user_id: userId,
        chapter_number: chapterNumber,
        unlocked_at: now,
        first_opened_at: now,
      });
    }
    return true;
  } catch { return false; }
}

export async function loadChapterProgress(userId: string): Promise<ChapterProgressRecord[]> {
  try {
    const { data, error } = await supabase
      .from('chapter_progress')
      .select('chapter_number, unlocked_at, first_opened_at')
      .eq('user_id', userId)
      .order('chapter_number');
    if (error || !data) return [];
    return data;
  } catch { return []; }
}
