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
    
    if (error) {
      console.error('loadIntake Supabase error:', error.message);
      return null;
    }
    
    if (!data?.intake_completed && !data?.intake_struggle) {
      return null;
    }

    return {
      struggle: data.intake_struggle || '',
      duration: data.intake_duration || '',
      impact: data.intake_impact || '',
      tried: data.intake_tried || '',
      vision: data.intake_vision || '',
    };
  } catch (err) {
    console.error('loadIntake exception:', err);
    return null;
  }
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

export async function ensureHabitsSeeded(bookId: string, habits: { habitText: string; frequency: string }[]): Promise<HabitRecord[]> {
  try {
    // Check if already seeded
    const { data: existing } = await supabase
      .from('habits')
      .select('*')
      .eq('book_id', bookId)
      .order('sort_order');
    if (existing && existing.length > 0) return existing;

    // Seed habits
    const rows = habits.map((h, i) => ({
      book_id: bookId,
      habit_text: h.habitText,
      frequency: h.frequency,
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

// ── Exercise Responses (Active Recall) ────────────────────────────────

export interface ExerciseResponseRecord {
  id?: string;
  user_id: string;
  book_id: string;
  chapter_number: number;
  type: string;
  prompt_text?: string;
  response_text: string;
  ai_feedback?: { understood: boolean; feedback: string; missed: string };
  created_at?: string;
}

export async function saveExerciseResponse(
  userId: string,
  bookId: string,
  chapterNumber: number,
  exerciseType: string,
  responseText: string,
  promptText?: string,
  aiFeedback?: { understood: boolean; feedback: string; missed: string }
): Promise<boolean> {
  try {
    const { error } = await supabase.from('exercise_responses').insert({
      user_id: userId,
      book_id: bookId,
      chapter_number: chapterNumber,
      type: exerciseType,
      prompt_text: promptText,
      response_text: responseText,
      ai_feedback: aiFeedback,
    });
    if (error) { console.error('Save exercise response error:', error.message); return false; }
    return true;
  } catch { return false; }
}

export async function loadExerciseResponses(userId: string, bookId: string): Promise<ExerciseResponseRecord[]> {
  try {
    const { data, error } = await supabase
      .from('exercise_responses')
      .select('*')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .order('created_at');
    if (error || !data) return [];
    return data;
  } catch { return []; }
}

// ── Personal Book Summaries (Living Summary) ─────────────────────────

export interface PersonalSummaryRecord {
  id?: string;
  user_id: string;
  book_id: string;
  summary_text: string;
  generated_at: string;
  response_count: number;
}

export async function savePersonalSummary(
  userId: string,
  bookId: string,
  summaryText: string,
  responseCount: number
): Promise<boolean> {
  try {
    const { error } = await supabase.from('personal_book_summaries').upsert({
      user_id: userId,
      book_id: bookId,
      summary_text: summaryText,
      generated_at: new Date().toISOString(),
      response_count: responseCount,
    }, { onConflict: 'user_id,book_id' });
    if (error) { console.error('Save personal summary error:', error.message); return false; }
    return true;
  } catch { return false; }
}

export async function loadPersonalSummary(userId: string, bookId: string): Promise<PersonalSummaryRecord | null> {
  try {
    const { data, error } = await supabase
      .from('personal_book_summaries')
      .select('*')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .maybeSingle();
    if (error || !data) return null;
    return data;
  } catch { return null; }
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

// ── Reading Session Tracking ──────────────────────────────────────────

export interface ReadingSessionRecord {
  id?: string;
  user_id: string;
  book_id: string;
  chapter_number: number;
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;
  reading_speed_wpm?: number;
  completion_percentage?: number;
}

export async function startReadingSession(
  userId: string,
  bookId: string,
  chapterNumber: number
): Promise<string | null> {
  try {
    const { data, error } = await supabase.from('reading_sessions').insert({
      user_id: userId,
      book_id: bookId,
      chapter_number: chapterNumber,
      started_at: new Date().toISOString(),
    }).select('id').single();
    if (error || !data) { console.error('Start reading session error:', error?.message); return null; }
    return data.id;
  } catch { return null; }
}

export async function endReadingSession(
  sessionId: string,
  durationSeconds: number,
  readingSpeedWpm?: number,
  completionPercentage?: number
): Promise<boolean> {
  try {
    const { error } = await supabase.from('reading_sessions').update({
      ended_at: new Date().toISOString(),
      duration_seconds: durationSeconds,
      reading_speed_wpm: readingSpeedWpm || null,
      completion_percentage: completionPercentage || 100,
    }).eq('id', sessionId);
    if (error) { console.error('End reading session error:', error.message); return false; }
    return true;
  } catch { return false; }
}

export async function loadReadingSessions(
  userId: string,
  bookId: string
): Promise<ReadingSessionRecord[]> {
  try {
    const { data, error } = await supabase
      .from('reading_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .order('started_at', { ascending: false });
    if (error || !data) return [];
    return data;
  } catch { return []; }
}

export async function getChapterReadingTime(
  userId: string,
  bookId: string,
  chapterNumber: number
): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('reading_sessions')
      .select('duration_seconds')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .eq('chapter_number', chapterNumber)
      .not('duration_seconds', 'is', null)
      .order('started_at', { ascending: false })
      .limit(1);
    if (error || !data || data.length === 0) return null;
    return data[0].duration_seconds;
  } catch { return null; }
}

// ── Coaching Message History ──────────────────────────────────────────

export interface CoachingMessageRecord {
  id?: string;
  user_id: string;
  book_id: string;
  chapter_number: number;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

export async function saveCoachingMessage(
  userId: string,
  bookId: string,
  chapterNumber: number,
  role: 'user' | 'assistant',
  content: string
): Promise<boolean> {
  try {
    const { error } = await supabase.from('coaching_messages').insert({
      user_id: userId,
      book_id: bookId,
      chapter_number: chapterNumber,
      role,
      content,
    });
    if (error) { console.error('Save coaching message error:', error.message); return false; }
    return true;
  } catch { return false; }
}

export async function loadCoachingMessages(
  userId: string,
  bookId: string,
  limit: number = 20
): Promise<CoachingMessageRecord[]> {
  try {
    const { data, error } = await supabase
      .from('coaching_messages')
      .select('*')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    // Return in chronological order
    return data.reverse();
  } catch { return []; }
}

// ── Reading Streak ──────────────────────────────────────────────────────

export async function updateReadingStreak(userId: string): Promise<number> {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get current streak data
    const { data: user, error } = await supabase
      .from('users')
      .select('streak_count, last_read_date')
      .eq('id', userId)
      .single();

    if (error || !user) {
      // User might not have these columns yet; try to set them
      await supabase.from('users').update({
        streak_count: 1,
        last_read_date: today,
      }).eq('id', userId);
      return 1;
    }

    const lastRead = user.last_read_date;
    let newStreak = user.streak_count || 0;

    if (lastRead === today) {
      // Already read today, no change
      return newStreak;
    }

    if (lastRead) {
      const lastDate = new Date(lastRead);
      const todayDate = new Date(today);
      const diffMs = todayDate.getTime() - lastDate.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours <= 48) {
        // Within 48 hours — increment streak
        newStreak += 1;
      } else {
        // More than 48h gap — reset streak
        newStreak = 1;
      }
    } else {
      // First reading ever
      newStreak = 1;
    }

    await supabase.from('users').update({
      streak_count: newStreak,
      last_read_date: today,
    }).eq('id', userId);

    return newStreak;
  } catch { return 0; }
}

export async function getReadingStreak(userId: string): Promise<{ streakCount: number; lastReadDate: string | null }> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('streak_count, last_read_date')
      .eq('id', userId)
      .single();

    if (error || !data) return { streakCount: 0, lastReadDate: null };

    // Check if streak is still valid (not expired past 48h)
    if (data.last_read_date) {
      const lastDate = new Date(data.last_read_date);
      const now = new Date();
      const diffHours = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);
      if (diffHours > 48) {
        // Streak expired — reset
        await supabase.from('users').update({
          streak_count: 0,
        }).eq('id', userId);
        return { streakCount: 0, lastReadDate: data.last_read_date };
      }
    }

    return {
      streakCount: data.streak_count || 0,
      lastReadDate: data.last_read_date || null,
    };
  } catch { return { streakCount: 0, lastReadDate: null }; }
}


// ── Spaced Repetition Review Cards ─────────────────────────────────────

export interface ReviewCard {
  id?: string;
  user_id: string;
  book_id: string;
  chapter_number: number;
  question: string;
  correct_answer: string;
  interval_days: number;     // current interval: 1, 3, 7, 21, 60
  next_review_at: string;    // ISO date
  ease_factor: number;       // multiplier (default 2.5)
  review_count: number;
  last_reviewed_at?: string;
  created_at?: string;
}

const INTERVALS = [1, 3, 7, 21, 60]; // days between reviews

export async function createReviewCards(
  userId: string, bookId: string, chapterNumber: number, cards: { question: string; correct_answer: string }[]
): Promise<boolean> {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextReview = tomorrow.toISOString();

    const rows = cards.map(c => ({
      user_id: userId,
      book_id: bookId,
      chapter_number: chapterNumber,
      question: c.question,
      correct_answer: c.correct_answer,
      interval_days: 1,
      next_review_at: nextReview,
      ease_factor: 2.5,
      review_count: 0,
    }));

    const { error } = await supabase.from('review_cards').insert(rows);
    if (error) { console.error('Create review cards error:', error.message); return false; }
    return true;
  } catch { return false; }
}

export async function getDueReviewCards(userId: string, limit = 5): Promise<ReviewCard[]> {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('review_cards')
      .select('*')
      .eq('user_id', userId)
      .lte('next_review_at', now)
      .order('next_review_at', { ascending: true })
      .limit(limit);
    if (error || !data) return [];
    return data;
  } catch { return []; }
}

export async function updateReviewCard(
  cardId: string, remembered: boolean
): Promise<boolean> {
  try {
    // Fetch current card
    const { data: card, error: fetchErr } = await supabase
      .from('review_cards')
      .select('*')
      .eq('id', cardId)
      .single();
    if (fetchErr || !card) return false;

    let newInterval: number;
    let newEase = card.ease_factor;

    if (remembered) {
      // Move to next interval level
      const currentIdx = INTERVALS.indexOf(card.interval_days);
      const nextIdx = Math.min((currentIdx >= 0 ? currentIdx : 0) + 1, INTERVALS.length - 1);
      newInterval = INTERVALS[nextIdx];
      newEase = Math.min(card.ease_factor + 0.1, 3.0);
    } else {
      // Reset to 1 day
      newInterval = 1;
      newEase = Math.max(card.ease_factor - 0.2, 1.5);
    }

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + newInterval);

    const { error } = await supabase.from('review_cards').update({
      interval_days: newInterval,
      next_review_at: nextReview.toISOString(),
      ease_factor: newEase,
      review_count: (card.review_count || 0) + 1,
      last_reviewed_at: new Date().toISOString(),
    }).eq('id', cardId);

    if (error) { console.error('Update review card error:', error.message); return false; }
    return true;
  } catch { return false; }
}

export async function getReviewStats(userId: string): Promise<{ total: number; due: number; mastered: number }> {
  try {
    const { data: all, error: e1 } = await supabase
      .from('review_cards')
      .select('id, next_review_at, interval_days')
      .eq('user_id', userId);
    if (e1 || !all) return { total: 0, due: 0, mastered: 0 };

    const now = new Date().toISOString();
    const due = all.filter(c => c.next_review_at <= now).length;
    const mastered = all.filter(c => c.interval_days >= 60).length;
    return { total: all.length, due, mastered };
  } catch { return { total: 0, due: 0, mastered: 0 }; }
}

export async function hasReviewCardsForChapter(userId: string, bookId: string, chapterNumber: number): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('review_cards')
      .select('id')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .eq('chapter_number', chapterNumber)
      .limit(1);
    if (error) return false;
    return (data?.length || 0) > 0;
  } catch { return false; }
}

