'use client';

import { useState, useEffect } from 'react';
import { getReadingStreak } from '@/lib/supabase';

interface ReadingStreakProps {
  userId: string;
  refreshTrigger?: number; // increment to force refresh
}

export function ReadingStreak({ userId, refreshTrigger }: ReadingStreakProps) {
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    getReadingStreak(userId).then(({ streakCount }) => {
      setStreak(streakCount);
      setLoading(false);
    });
  }, [userId, refreshTrigger]);

  if (loading || streak === 0) return null;

  return (
    <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 rounded-full px-3 py-1.5 animate-message-in">
      <span className="text-base">🔥</span>
      <span className="text-xs font-semibold text-orange-300">
        {streak} day streak
      </span>
    </div>
  );
}
