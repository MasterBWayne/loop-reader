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
  tags?: string[];
  is_implemented?: boolean;
  implemented_at?: string;
  created_at: string;
}

export interface FlashbackResponseRecord {
  id: string;
  user_id: string;
  book_id: string;
  chapter_number: number;
  response_type: string;
  ai_reframe?: string;
  created_at: string;
}

export interface WeeklyInsightRecord {
  id: string;
  week_date: string;
  insight_text: string;
  linked_book_id?: string;
  linked_chapter_number?: number;
  created_at: string;
}

export async function saveReflection(userId: string, bookId: string, chapterNumber: number, questionText: string, answerText: string, tags: string[] = []): Promise<boolean> {
  try {
    const { error } = await supabase.from('chapter_reflections').upsert({
      user_id: userId,
      book_id: bookId,
      chapter_number: chapterNumber,
      question_text: questionText,
      answer_text: answerText,
      tags: tags,
    }, { onConflict: 'user_id,book_id,chapter_number' });
    if (error) { console.error('Save reflection error:', error.message); return false; }
    return true;
  } catch { return false; }
}

export async function loadReflections(userId: string, bookId: string): Promise<ReflectionRecord[]> {
  try {
    const { data, error } = await supabase
      .from('chapter_reflections')
      .select('chapter_number, question_text, answer_text, tags, is_implemented, implemented_at, created_at')
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

// ── Commitments (Accountability Loop) ──────────────────────────────────

export interface CommitmentRecord {
  id?: string;
  user_id: string;
  book_id: string;
  chapter_number: number;
  commitment_text: string;
  due_date: string;
  followed_up: boolean;
  outcome?: string;
  created_at?: string;
}

export async function saveCommitment(userId: string, bookId: string, chapterNumber: number, commitmentText: string, dueDate: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('commitments').upsert({
      user_id: userId,
      book_id: bookId,
      chapter_number: chapterNumber,
      commitment_text: commitmentText,
      due_date: dueDate,
      followed_up: false,
    }, { onConflict: 'user_id,book_id,chapter_number' });
    if (error) { console.error('Save commitment error:', error.message); return false; }
    return true;
  } catch { return false; }
}

export async function loadPendingCommitments(userId: string): Promise<CommitmentRecord[]> {
  try {
    const { data, error } = await supabase
      .from('commitments')
      .select('*')
      .eq('user_id', userId)
      .eq('followed_up', false)
      .lte('due_date', new Date().toISOString())
      .order('due_date');
    if (error || !data) return [];
    return data;
  } catch { return []; }
}

export async function markCommitmentFollowedUp(userId: string, bookId: string, chapterNumber: number, outcome: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('commitments')
      .update({ followed_up: true, outcome })
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .eq('chapter_number', chapterNumber);
    if (error) { console.error('Update commitment error:', error.message); return false; }
    return true;
  } catch { return false; }
}

export async function loadCommitment(userId: string, bookId: string, chapterNumber: number): Promise<CommitmentRecord | null> {
  try {
    const { data, error } = await supabase
      .from('commitments')
      .select('*')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .eq('chapter_number', chapterNumber)
      .maybeSingle();
    if (error || !data) return null;
    return data;
  } catch { return null; }
}

export async function loadAllCommitments(userId: string): Promise<CommitmentRecord[]> {
  try {
    const { data, error } = await supabase
      .from('commitments')
      .select('*')
      .eq('user_id', userId);
    if (error || !data) return [];
    return data;
  } catch { return []; }
}

// ── Journey Tab Upgrades ────────────────────────────────────────────────

export async function loadWeeklyInsight(userId: string, weekDate: string): Promise<WeeklyInsightRecord | null> {
  try {
    const { data, error } = await supabase
      .from('weekly_insights')
      .select('*')
      .eq('user_id', userId)
      .eq('week_date', weekDate)
      .maybeSingle();
    if (error || !data) return null;
    return data;
  } catch { return null; }
}

export async function saveWeeklyInsight(userId: string, weekDate: string, insightText: string, linkedBookId?: string, linkedChapterNumber?: number): Promise<boolean> {
  try {
    const { error } = await supabase.from('weekly_insights').upsert({
      user_id: userId,
      week_date: weekDate,
      insight_text: insightText,
      linked_book_id: linkedBookId,
      linked_chapter_number: linkedChapterNumber,
    }, { onConflict: 'user_id,week_date' });
    if (error) { console.error('Save insight error:', error.message); return false; }
    return true;
  } catch { return false; }
}

export async function loadAllReflections(userId: string): Promise<(ReflectionRecord & { book_id: string })[]> {
  try {
    const { data, error } = await supabase
      .from('chapter_reflections')
      .select('book_id, chapter_number, question_text, answer_text, tags, is_implemented, implemented_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data;
  } catch { return []; }
}

export async function saveFlashbackResponse(userId: string, bookId: string, chapterNumber: number, responseType: 'yes' | 'not_yet' | 'help', aiReframe?: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('flashback_responses').upsert({
      user_id: userId,
      book_id: bookId,
      chapter_number: chapterNumber,
      response_type: responseType,
      ai_reframe: aiReframe,
    }, { onConflict: 'user_id,book_id,chapter_number' });
    
    if (responseType === 'yes') {
      await supabase.from('chapter_reflections')
        .update({ is_implemented: true, implemented_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('book_id', bookId)
        .eq('chapter_number', chapterNumber);
    }
    
    if (error) { console.error('Save flashback error:', error.message); return false; }
    return true;
  } catch { return false; }
}

// ── Maintenance Mode ───────────────────────────────────────────────────

export interface MaintenanceCheckin {
  id?: string;
  user_id: string;
  book_id: string;
  chapter_number: number;
  week_date: string;
  rating: number;
  reflection?: string;
  ai_response?: string;
}

export async function saveMaintenanceCheckin(userId: string, bookId: string, chapterNumber: number, rating: number, reflection: string, aiResponse: string): Promise<boolean> {
  const weekDate = getWeekDate();
  try {
    const { error } = await supabase.from('maintenance_checkins').upsert({
      user_id: userId,
      book_id: bookId,
      chapter_number: chapterNumber,
      week_date: weekDate,
      rating,
      reflection: reflection || null,
      ai_response: aiResponse || null,
    }, { onConflict: 'user_id,book_id,week_date' });
    if (error) { console.error('Save maintenance checkin error:', error.message); return false; }
    return true;
  } catch { return false; }
}

export async function loadMaintenanceCheckins(userId: string, bookId: string): Promise<MaintenanceCheckin[]> {
  try {
    const { data, error } = await supabase
      .from('maintenance_checkins')
      .select('*')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .order('week_date', { ascending: false })
      .limit(10);
    if (error || !data) return [];
    return data;
  } catch { return []; }
}

export async function hasCheckedInThisWeek(userId: string, bookId: string): Promise<boolean> {
  const weekDate = getWeekDate();
  try {
    const { data } = await supabase
      .from('maintenance_checkins')
      .select('id')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .eq('week_date', weekDate)
      .maybeSingle();
    return !!data;
  } catch { return false; }
}

function getWeekDate(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
}

// ── Habit Tracker ──────────────────────────────────────────────────────

export interface HabitRecord {
  id: string;
  book_id: string;
  habit_text: string;
  frequency: string;
  sort_order: number;
}

export interface HabitCompletionRecord {
  habit_id: string;
  completed_date: string;
}

export async function ensureHabitsSeeded(bookId: string, habits: string[]): Promise<HabitRecord[]> {
  try {
    // Check if already seeded
    const { data: existing } = await supabase
      .from('habits')
      .select('*')
      .eq('book_id', bookId)
      .order('sort_order');
    if (existing && existing.length > 0) return existing;

    // Seed habits
    const rows = habits.map((text, i) => ({
      book_id: bookId,
      habit_text: text,
      frequency: 'weekly',
      sort_order: i,
    }));
    const { data, error } = await supabase.from('habits').insert(rows).select();
    if (error) { console.error('Seed habits error:', error.message); return []; }
    return data || [];
  } catch { return []; }
}

export async function loadHabits(bookId: string): Promise<HabitRecord[]> {
  try {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('book_id', bookId)
      .order('sort_order');
    if (error || !data) return [];
    return data;
  } catch { return []; }
}

export async function loadHabitCompletions(userId: string, habitIds: string[]): Promise<HabitCompletionRecord[]> {
  if (habitIds.length === 0) return [];
  // Load completions for this week
  const weekStart = getWeekDate();
  const weekEnd = new Date(new Date(weekStart).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  try {
    const { data, error } = await supabase
      .from('habit_completions')
      .select('habit_id, completed_date')
      .eq('user_id', userId)
      .in('habit_id', habitIds)
      .gte('completed_date', weekStart)
      .lt('completed_date', weekEnd);
    if (error || !data) return [];
    return data;
  } catch { return []; }
}

export async function toggleHabitCompletion(userId: string, habitId: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  try {
    // Check if already completed today
    const { data: existing } = await supabase
      .from('habit_completions')
      .select('id')
      .eq('user_id', userId)
      .eq('habit_id', habitId)
      .eq('completed_date', today)
      .maybeSingle();

    if (existing) {
      // Un-complete
      await supabase.from('habit_completions').delete().eq('id', existing.id);
      return false;
    } else {
      // Complete
      await supabase.from('habit_completions').insert({
        user_id: userId,
        habit_id: habitId,
        completed_date: today,
      });
      return true;
    }
  } catch { return false; }
}

export async function getHabitStreak(userId: string, habitId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('habit_completions')
      .select('completed_date')
      .eq('user_id', userId)
      .eq('habit_id', habitId)
      .order('completed_date', { ascending: false })
      .limit(30);
    if (error || !data || data.length === 0) return 0;

    // Count consecutive weeks with at least one completion
    let streak = 0;
    const now = new Date();
    for (let w = 0; w < 12; w++) {
      const weekStart = new Date(now.getTime() - w * 7 * 24 * 60 * 60 * 1000);
      const day = weekStart.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      const monday = new Date(weekStart);
      monday.setDate(monday.getDate() + mondayOffset);
      const mondayStr = monday.toISOString().split('T')[0];
      const sundayStr = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const hasCompletion = data.some(d => d.completed_date >= mondayStr && d.completed_date <= sundayStr);
      if (hasCompletion) streak++;
      else break;
    }
    return streak;
  } catch { return 0; }
}

// ── Chapter Progress ───────────────────────────────────────────────────

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

export async function loadChapterReflection(userId: string, bookId: string, chapterNumber: number): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('chapter_reflections')
      .select('answer_text')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .eq('chapter_number', chapterNumber)
      .single();
    if (error || !data) return null;
    return data.answer_text;
  } catch { return null; }
}
