'use client';

import { useState } from 'react';

interface MaintenanceCardProps {
  bookTitle: string;
  chapterTitle: string;
  chapterNumber: number;
  onSubmit: (rating: number, reflection: string) => Promise<string>; // returns AI response
  onDismiss: () => void;
}

export function MaintenanceCard({ bookTitle, chapterTitle, chapterNumber, onSubmit, onDismiss }: MaintenanceCardProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [reflection, setReflection] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (rating === null) return;
    setLoading(true);
    const response = await onSubmit(rating, reflection);
    setAiResponse(response);
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-br from-violet-50/80 to-indigo-50/50 border border-violet-200/50 rounded-2xl p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">📖</span>
          <span className="text-[10px] font-semibold text-violet-600/70 uppercase tracking-widest">Weekly check-in</span>
        </div>
        <button onClick={onDismiss} className="text-violet-300 hover:text-violet-500 text-xs">Later</button>
      </div>

      <p className="text-xs text-muted mb-1">{bookTitle}</p>
      <p className="text-sm font-medium text-ink/80 mb-4" style={{ fontFamily: "'Lora', serif" }}>
        Ch. {chapterNumber}: {chapterTitle} — Did you practice this principle this week?
      </p>

      {aiResponse ? (
        <div className="bg-white/60 border border-violet-200/30 rounded-xl p-4">
          <p className="text-sm text-ink/70 italic leading-relaxed" style={{ fontFamily: "'Lora', serif" }}>
            {aiResponse}
          </p>
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-1">
              {Array.from({ length: 10 }, (_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${i < (rating || 0) ? 'bg-violet-500' : 'bg-violet-200/50'}`}
                />
              ))}
            </div>
            <span className="text-[10px] text-violet-500 font-semibold">{rating}/10</span>
          </div>
          <button onClick={onDismiss} className="mt-3 text-[11px] text-violet-400 hover:text-violet-600">
            Done ✓
          </button>
        </div>
      ) : (
        <>
          {/* Rating selector */}
          <div className="flex items-center gap-1.5 mb-4">
            {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                onClick={() => setRating(n)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                  rating === n
                    ? 'bg-violet-500 text-white shadow-sm'
                    : rating !== null && n <= rating
                    ? 'bg-violet-200 text-violet-700'
                    : 'bg-white/60 text-ink/30 hover:bg-violet-100/50'
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          {/* Optional reflection */}
          <input
            type="text"
            value={reflection}
            onChange={e => setReflection(e.target.value)}
            placeholder="One sentence — what happened? (optional)"
            className="w-full bg-white/60 border border-violet-200/30 rounded-xl px-4 py-2.5 text-sm text-ink/70 placeholder:text-ink/20 outline-none focus:border-violet-300 transition-colors mb-3"
            style={{ fontFamily: "'Lora', serif" }}
          />

          <button
            onClick={handleSubmit}
            disabled={rating === null || loading}
            className="w-full py-2.5 bg-violet-500/90 hover:bg-violet-500 disabled:bg-ink/10 disabled:text-ink/30 text-white font-semibold rounded-xl transition-all text-sm"
          >
            {loading ? 'Reflecting...' : 'Submit check-in'}
          </button>
        </>
      )}
    </div>
  );
}
