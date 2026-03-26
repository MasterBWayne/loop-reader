'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, loadReadingSessions, loadExerciseResponses, supabase } from '@/lib/supabase';
import { BOOKS } from '@/data/books';

interface OutcomeStats {
  totalSessions: number;
  totalMinutes: number;
  exercisesCompleted: number;
  exercisesTotal: number;
  chaptersCompleted: number;
  reflectionsCount: number;
}

function OutcomeContent() {
  const searchParams = useSearchParams();
  const bookId = searchParams.get('book');

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<OutcomeStats | null>(null);
  const [coachMessage, setCoachMessage] = useState<string | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  const book = BOOKS.find(b => b.id === bookId);

  useEffect(() => {
    async function load() {
      if (!bookId || !book) {
        setLoading(false);
        return;
      }

      const user = await getCurrentUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch all data in parallel
      const [sessions, exercises, reflectionsRes] = await Promise.all([
        loadReadingSessions(user.id, bookId),
        loadExerciseResponses(user.id, bookId),
        supabase
          .from('chapter_reflections')
          .select('chapter_number')
          .eq('user_id', user.id)
          .eq('book_id', bookId),
      ]);

      const completedSessions = sessions.filter(s => s.duration_seconds);
      const totalMinutes = Math.round(
        completedSessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / 60
      );

      const reflections = reflectionsRes.data || [];

      setStats({
        totalSessions: completedSessions.length,
        totalMinutes,
        exercisesCompleted: exercises.length,
        exercisesTotal: book.chapters.filter(c => c.exerciseQuestion).length,
        chaptersCompleted: book.chapters.length,
        reflectionsCount: reflections.length,
      });

      setLoading(false);

      // Trigger entrance animation after data loads
      requestAnimationFrame(() => {
        setAnimateIn(true);
      });

      // Generate coach congratulation message
      setCoachLoading(true);
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              {
                role: 'user',
                content: `The reader just finished the book "${book.title}" by ${book.author}. They completed ${completedSessions.length} reading sessions over ${totalMinutes} minutes, and answered ${exercises.length} exercises. Write a brief, warm, personal congratulation (2-3 sentences). Be encouraging but not over-the-top. Reference the book title. End with one forward-looking sentence about applying what they learned.`,
              },
            ],
          }),
        });
        const data = await res.json();
        if (data.response || data.content) {
          setCoachMessage(data.response || data.content);
        }
      } catch {
        // Fallback to static message
        setCoachMessage(
          `Finishing "${book.title}" is a real accomplishment. The ideas you engaged with across ${book.chapters.length} chapters are now part of how you think. The real work begins now -- carrying these insights into your daily life.`
        );
      } finally {
        setCoachLoading(false);
      }
    }

    load();
  }, [bookId, book]);

  // Book not found
  if (!bookId || !book) {
    return (
      <main className="min-h-screen bg-[var(--rk-bg)] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div
            className="w-16 h-16 bg-[var(--rk-bg-surface)] rounded-2xl flex items-center justify-center mx-auto mb-6"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--rk-text-muted)" strokeWidth="1.5">
              <path d="M12 9v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h2
            className="text-lg font-semibold mb-2"
            style={{ fontFamily: 'var(--rk-font-heading)', color: 'var(--rk-text)' }}
          >
            Book not found
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--rk-text-secondary)' }}>
            We couldn&apos;t find the book you&apos;re looking for. Head back to the library to pick your next read.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[var(--rk-accent)] hover:bg-[var(--rk-accent-hover)] text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            Back to Library
          </Link>
        </div>
      </main>
    );
  }

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--rk-bg)] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </main>
    );
  }

  const statItems = stats
    ? [
        {
          label: 'Sessions',
          value: stats.totalSessions,
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          ),
        },
        {
          label: 'Minutes Read',
          value: stats.totalMinutes,
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          ),
        },
        {
          label: 'Exercises',
          value: `${stats.exercisesCompleted}/${stats.exercisesTotal}`,
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          ),
        },
      ]
    : [];

  return (
    <main className="min-h-screen bg-[var(--rk-bg)]" style={{ color: 'var(--rk-text)' }}>
      <div className="max-w-2xl mx-auto px-6 py-12 pb-24">

        {/* ── Celebration Header ─────────────────────────────────── */}
        <div
          className={`text-center mb-10 transition-all duration-700 ease-out ${
            animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          {/* Trophy icon */}
          <div className="w-20 h-20 bg-[var(--rk-accent-pale)] rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--rk-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
          </div>

          <h1
            className="text-3xl font-bold mb-3 leading-tight"
            style={{ fontFamily: 'var(--rk-font-heading)', color: 'var(--rk-text)' }}
          >
            You finished{' '}
            <span style={{ color: 'var(--rk-accent)' }}>
              {book.title}
            </span>
          </h1>
          <p
            className="text-base"
            style={{ fontFamily: 'var(--rk-font-heading)', color: 'var(--rk-text-secondary)' }}
          >
            Here&apos;s what changed.
          </p>
        </div>

        {/* ── Stats Row ──────────────────────────────────────────── */}
        {stats && (
          <div
            className={`grid grid-cols-3 gap-3 mb-10 transition-all duration-700 ease-out delay-200 ${
              animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            {statItems.map((item, i) => (
              <div
                key={i}
                className="rounded-2xl p-5 text-center border"
                style={{
                  backgroundColor: 'var(--rk-bg-card)',
                  borderColor: 'var(--rk-border)',
                  boxShadow: 'var(--rk-shadow-sm)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: 'var(--rk-accent-pale)', color: 'var(--rk-accent)' }}
                >
                  {item.icon}
                </div>
                <div
                  className="text-2xl font-bold mb-1"
                  style={{ fontFamily: 'var(--rk-font-heading)', color: 'var(--rk-text)' }}
                >
                  {item.value}
                </div>
                <div
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--rk-text-muted)' }}
                >
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Coach Congratulation ───────────────────────────────── */}
        <div
          className={`rounded-2xl p-6 mb-6 border transition-all duration-700 ease-out delay-[400ms] ${
            animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
          style={{
            backgroundColor: 'var(--rk-bg-card)',
            borderColor: 'var(--rk-border)',
            boxShadow: 'var(--rk-shadow-sm)',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{ fontFamily: 'var(--rk-font-heading)', backgroundColor: 'var(--rk-accent)' }}
            >
              RK
            </div>
            <div>
              <h3
                className="text-sm font-semibold"
                style={{ color: 'var(--rk-text)' }}
              >
                Your Coach
              </h3>
              <p className="text-[11px]" style={{ color: 'var(--rk-text-muted)' }}>
                ReadKindled
              </p>
            </div>
          </div>

          {coachLoading ? (
            <div className="flex items-center gap-3 py-4">
              <div className="flex gap-1.5">
                <div className="typing-dot w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--rk-text-muted)' }} />
                <div className="typing-dot w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--rk-text-muted)' }} />
                <div className="typing-dot w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--rk-text-muted)' }} />
              </div>
              <span className="text-xs" style={{ color: 'var(--rk-text-muted)' }}>
                Crafting your message...
              </span>
            </div>
          ) : coachMessage ? (
            <p
              className="text-sm leading-relaxed whitespace-pre-wrap"
              style={{ fontFamily: 'var(--rk-font-heading)', color: 'var(--rk-text-secondary)' }}
            >
              {coachMessage}
            </p>
          ) : (
            <p
              className="text-sm leading-relaxed"
              style={{ fontFamily: 'var(--rk-font-heading)', color: 'var(--rk-text-secondary)' }}
            >
              Finishing &ldquo;{book.title}&rdquo; is a real accomplishment. The ideas you engaged
              with across {book.chapters.length} chapters are now part of how you think. The real
              work begins now &mdash; carrying these insights into your daily life.
            </p>
          )}
        </div>

        {/* ── What Happens Next ──────────────────────────────────── */}
        <div
          className={`rounded-2xl p-6 mb-10 border transition-all duration-700 ease-out delay-[600ms] ${
            animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
          style={{
            backgroundColor: 'var(--rk-bg-surface)',
            borderColor: 'var(--rk-border)',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--rk-app-accent-pale)', color: 'var(--rk-app-accent)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <h3
              className="text-sm font-semibold"
              style={{ color: 'var(--rk-text)' }}
            >
              What happens next
            </h3>
          </div>

          <ul className="space-y-3">
            {[
              'We\'ll check in on your commitments from each chapter to see how you\'re applying what you learned.',
              'Your reflections and exercises are saved in your Journey -- revisit them anytime.',
              'Spaced-repetition review cards will surface key ideas at optimal intervals so they stick.',
              'When you\'re ready, pick your next book from the library and keep building.',
            ].map((text, i) => (
              <li key={i} className="flex items-start gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold"
                  style={{ backgroundColor: 'var(--rk-app-accent-pale)', color: 'var(--rk-app-accent)' }}
                >
                  {i + 1}
                </div>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--rk-text-secondary)' }}
                >
                  {text}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Actions ────────────────────────────────────────────── */}
        <div
          className={`flex flex-col sm:flex-row items-center justify-center gap-3 transition-all duration-700 ease-out delay-[800ms] ${
            animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 text-white font-semibold px-8 py-3 rounded-xl transition-colors text-sm w-full sm:w-auto"
            style={{ backgroundColor: 'var(--rk-accent)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--rk-accent-hover)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--rk-accent)')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Back to Library
          </Link>
          <Link
            href="/journey"
            className="inline-flex items-center justify-center gap-2 font-semibold px-8 py-3 rounded-xl transition-colors text-sm border w-full sm:w-auto"
            style={{
              color: 'var(--rk-text-secondary)',
              borderColor: 'var(--rk-border-strong)',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--rk-bg-surface)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            View Your Journey
          </Link>
        </div>

      </div>
    </main>
  );
}

export default function OutcomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--rk-bg)] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        </div>
      }
    >
      <OutcomeContent />
    </Suspense>
  );
}
