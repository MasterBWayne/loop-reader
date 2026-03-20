'use client';

import { useState, useEffect, useCallback } from 'react';
import { loadHabits, loadHabitCompletions, toggleHabitCompletion, ensureHabitsSeeded, getHabitStreak, type HabitRecord } from '@/lib/supabase';
import { getHabitsForBook } from '@/data/habits';

interface HabitTrackerProps {
  bookId: string;
  bookTitle: string;
  userId: string;
}

interface HabitWithState extends HabitRecord {
  completedToday: boolean;
  completionsThisWeek: number;
  streak: number;
}

export function HabitTracker({ bookId, bookTitle, userId }: HabitTrackerProps) {
  const [habits, setHabits] = useState<HabitWithState[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    // Ensure habits are seeded
    const habitDefs = getHabitsForBook(bookId);
    if (habitDefs.length === 0) { setLoading(false); return; }

    let records = await loadHabits(bookId);
    if (records.length === 0) {
      records = await ensureHabitsSeeded(bookId, habitDefs);
    }
    if (records.length === 0) { setLoading(false); return; }

    const ids = records.map(r => r.id);
    const completions = await loadHabitCompletions(userId, ids);
    const today = new Date().toISOString().split('T')[0];

    const withState: HabitWithState[] = await Promise.all(
      records.map(async (h) => {
        const myCompletions = completions.filter(c => c.habit_id === h.id);
        const streak = await getHabitStreak(userId, h.id);
        return {
          ...h,
          completedToday: myCompletions.some(c => c.completed_date === today),
          completionsThisWeek: myCompletions.length,
          streak,
        };
      })
    );

    setHabits(withState);
    setLoading(false);
  }, [bookId, userId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleToggle = async (habitId: string) => {
    const completed = await toggleHabitCompletion(userId, habitId);
    setHabits(prev => prev.map(h => {
      if (h.id !== habitId) return h;
      return {
        ...h,
        completedToday: completed,
        completionsThisWeek: completed ? h.completionsThisWeek + 1 : Math.max(0, h.completionsThisWeek - 1),
      };
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted">
        <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <div className="text-center py-12 text-muted text-sm">
        No practice habits for this book yet.
      </div>
    );
  }

  const completedCount = habits.filter(h => h.completedToday).length;

  return (
    <div className="max-w-2xl mx-auto px-6 md:px-12 py-8">
      <div className="mb-6">
        <p className="text-xs text-muted font-semibold tracking-[0.15em] uppercase mb-2">Weekly Practice</p>
        <h2 className="text-xl font-bold text-ink" style={{ fontFamily: "'Lora', serif" }}>
          {bookTitle}
        </h2>
        <div className="flex items-center gap-3 mt-3">
          <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-gold rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / habits.length) * 100}%` }}
            />
          </div>
          <span className="text-xs text-muted font-medium">{completedCount}/{habits.length} today</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {habits.map(habit => (
          <button
            key={habit.id}
            onClick={() => handleToggle(habit.id)}
            className={`text-left w-full flex items-start gap-3 p-4 rounded-xl border transition-all ${
              habit.completedToday
                ? 'bg-gold/5 border-gold/20'
                : 'bg-white/50 border-border hover:border-gold/30'
            }`}
          >
            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
              habit.completedToday
                ? 'bg-gold border-gold'
                : 'border-border'
            }`}>
              {habit.completedToday && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth="3" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm leading-relaxed ${habit.completedToday ? 'text-ink/50 line-through' : 'text-ink/80'}`} style={{ fontFamily: "'Lora', serif" }}>
                {habit.habit_text}
              </p>
              <div className="flex items-center gap-3 mt-2">
                {habit.streak > 0 && (
                  <span className="text-[10px] text-gold font-semibold flex items-center gap-1">
                    🔥 {habit.streak}w streak
                  </span>
                )}
                {habit.completionsThisWeek > 0 && (
                  <span className="text-[10px] text-muted">
                    {habit.completionsThisWeek}x this week
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      <p className="text-center text-[10px] text-muted/40 mt-6">
        Tap to check off. Streaks count weekly. The Architect notices.
      </p>
    </div>
  );
}
