'use client';
import { useState } from 'react';

interface MidBookCheckInProps {
  bookTitle: string;
  chapterProgress: number; // 0-1
  onSubmit: (data: { mood: number; reflection: string }) => void;
  onDismiss: () => void;
}

const MOODS = [
  { value: 1, emoji: '😔', label: 'Struggling' },
  { value: 2, emoji: '😐', label: 'Meh' },
  { value: 3, emoji: '🤔', label: 'Processing' },
  { value: 4, emoji: '😊', label: 'Growing' },
  { value: 5, emoji: '🔥', label: 'Fired up' },
];

export function MidBookCheckIn({ bookTitle, chapterProgress, onSubmit, onDismiss }: MidBookCheckInProps) {
  const [mood, setMood] = useState<number>(0);
  const [reflection, setReflection] = useState('');

  const pct = Math.round(chapterProgress * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-message-in">
      <div className="bg-warm-gray rounded-3xl shadow-xl w-full max-w-sm overflow-hidden border border-border">
        {/* Header */}
        <div className="bg-sage-pale/30 px-6 py-5 border-b border-border">
          <p className="text-[10px] font-bold uppercase tracking-widest text-sage mb-1">Halfway Check-in</p>
          <h3 className="text-lg font-semibold text-ink" style={{ fontFamily: "'Lora', serif" }}>
            How's it landing?
          </h3>
          <p className="text-xs text-muted mt-1">
            You're {pct}% through <em>{bookTitle}</em>
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* Mood picker */}
          <div>
            <p className="text-xs font-medium text-muted mb-3">How are you feeling right now?</p>
            <div className="flex justify-between gap-1">
              {MOODS.map(m => (
                <button
                  key={m.value}
                  onClick={() => setMood(m.value)}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl transition-all ${
                    mood === m.value
                      ? 'bg-gold/15 border-2 border-gold scale-105'
                      : 'border-2 border-transparent hover:bg-cream'
                  }`}
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <span className={`text-[9px] font-medium ${mood === m.value ? 'text-gold' : 'text-muted'}`}>
                    {m.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Optional reflection */}
          <div>
            <p className="text-xs font-medium text-muted mb-2">
              Anything standing out so far? <span className="text-muted-soft">(optional)</span>
            </p>
            <textarea
              value={reflection}
              onChange={e => setReflection(e.target.value)}
              placeholder="A concept that hit home, something you disagree with, a question forming..."
              className="w-full min-h-[80px] bg-input-bg border border-border rounded-xl px-3 py-2.5 text-sm text-ink placeholder:text-muted-soft outline-none focus:border-gold/50 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onDismiss}
              className="flex-1 py-3 text-xs font-semibold text-muted hover:text-ink rounded-xl border border-border hover:bg-cream transition-colors"
            >
              Skip
            </button>
            <button
              onClick={() => mood > 0 && onSubmit({ mood, reflection })}
              disabled={mood === 0}
              className="flex-1 py-3 text-xs font-semibold text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: mood > 0 ? '#A86820' : '#ccc' }}
            >
              Save Check-in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Check-in trigger logic ────────────────────────────────

const CHECKIN_STORAGE_KEY = 'rk-midbook-checkins';

/** Returns true if user should see mid-book check-in for this book */
export function shouldShowMidBookCheckIn(bookId: string, chaptersRead: number, totalChapters: number): boolean {
  if (totalChapters < 4) return false; // too short for mid-book
  const pct = chaptersRead / totalChapters;
  if (pct < 0.4 || pct > 0.7) return false; // only in 40-70% window

  // Check if already shown
  try {
    const shown: string[] = JSON.parse(localStorage.getItem(CHECKIN_STORAGE_KEY) || '[]');
    return !shown.includes(bookId);
  } catch {
    return true;
  }
}

/** Mark that check-in was shown (so it doesn't repeat) */
export function markCheckInShown(bookId: string): void {
  try {
    const shown: string[] = JSON.parse(localStorage.getItem(CHECKIN_STORAGE_KEY) || '[]');
    if (!shown.includes(bookId)) {
      shown.push(bookId);
      localStorage.setItem(CHECKIN_STORAGE_KEY, JSON.stringify(shown));
    }
  } catch { /* silent */ }
}
