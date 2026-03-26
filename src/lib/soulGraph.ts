/**
 * Soul Graph client for ReadKindled
 * Wraps edge function calls. Fails silently — soul graph is optional.
 * Supabase project: gssrlyrulnsmfukofpod
 */

const SG_URL = 'https://gssrlyrulnsmfukofpod.supabase.co';
const SG_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzc3JseXJ1bG5zbWZ1a29mcG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MTM1NjUsImV4cCI6MjA4ODQ4OTU2NX0.uqo6uSWzbjxdaTDgZXdurOsGwUtNoli4PRzlSpuz7aU';
const FN = `${SG_URL}/functions/v1`;

async function post(fn: string, body: Record<string, unknown>) {
  try {
    const res = await fetch(`${FN}/${fn}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SG_KEY}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

async function get(fn: string, params: Record<string, string>) {
  try {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${FN}/${fn}?${qs}`, {
      headers: { Authorization: `Bearer ${SG_KEY}` },
    });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

// ─── Phase 1: Connect user identity ──────────────────────────────────────

export async function connectUser(email: string): Promise<string | null> {
  const r = await post('auth-connect', { email, app_name: 'readkindled', app_user_id: email });
  return r?.soul_graph_id ?? null;
}

// ─── Phase 2: Consent ────────────────────────────────────────────────────

export async function grantConsent(userId: string) {
  return post('consent', { user_id: userId, consent_version: '1.0' });
}

// ─── Phase 3: Read profile ───────────────────────────────────────────────

export async function getProfile(userId: string) {
  return get('profile', { user_id: userId });
}

// ─── Phase 4: Write observations ─────────────────────────────────────────

export async function writeObservation(
  userId: string,
  eventType: string,
  rawSignal: Record<string, unknown>,
) {
  return post('observations', {
    user_id: userId,
    app_name: 'readkindled',
    event_type: eventType,
    raw_signal: rawSignal,
  });
}

// ─── Typed observation helpers for ReadKindled ───────────────────────────

export function trackBookStarted(userId: string, signal: {
  book_id: string; book_title: string; category: string;
}) { return writeObservation(userId, 'book_started', signal); }

export function trackChapterCompleted(userId: string, signal: {
  book_id: string; book_title: string; chapter_number: number;
  chapter_title: string; time_spent_minutes?: number;
}) { return writeObservation(userId, 'chapter_completed', signal); }

export function trackExerciseCompleted(userId: string, signal: {
  book_id: string; chapter_number: number; exercise_type: string;
  response_word_count: number; sentiment_band?: string;
}) { return writeObservation(userId, 'exercise_completed', signal); }

export function trackInsightConfirmed(userId: string, signal: {
  category: string; confidence: number; was_edited: boolean;
  source_book?: string;
}) { return writeObservation(userId, 'insight_confirmed', signal); }

export function trackInsightDismissed(userId: string, signal: {
  category: string; source_book?: string;
}) { return writeObservation(userId, 'insight_dismissed', signal); }

export function trackCoachingSession(userId: string, signal: {
  book_id: string; duration_minutes: number; message_count: number;
  topic?: string;
}) { return writeObservation(userId, 'coaching_session', signal); }

export function trackStreakMilestone(userId: string, signal: {
  streak_days: number; books_completed: number;
}) { return writeObservation(userId, 'streak_milestone', signal); }
