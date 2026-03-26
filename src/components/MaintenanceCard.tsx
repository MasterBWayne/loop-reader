'use client';

import { useState } from 'react';

const NEGATIVE_SIGNALS = ['no', 'forgot', 'did not', "didn't", "haven't", 'skipped', "haven't tried", 'nothing', 'not really', 'barely', 'failed'];

interface MaintenanceCardProps {
  bookTitle: string;
  chapterTitle: string;
  chapterNumber: number;
  onSubmit: (rating: number, reflection: string) => Promise<string>;
  onBlockerSubmit?: (blocker: string) => Promise<string>;
  onDismiss: () => void;
}

function detectNegative(text: string): boolean {
  const lower = text.toLowerCase();
  return NEGATIVE_SIGNALS.some(signal => lower.includes(signal));
}

export function MaintenanceCard({ bookTitle, chapterTitle, chapterNumber, onSubmit, onBlockerSubmit, onDismiss }: MaintenanceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [reflection, setReflection] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  const [showBlockerInput, setShowBlockerInput] = useState(false);
  const [blockerText, setBlockerText] = useState('');
  const [blockerLoading, setBlockerLoading] = useState(false);
  const [adaptiveResponse, setAdaptiveResponse] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (rating === null) return;
    setLoading(true);

    const isNegative = (rating <= 3) || (reflection.trim() && detectNegative(reflection));

    if (isNegative && onBlockerSubmit) {
      setShowBlockerInput(true);
      setLoading(false);
      return;
    }

    const response = await onSubmit(rating, reflection);
    setAiResponse(response);
    setLoading(false);
  };

  const handleBlockerSubmit = async () => {
    if (!blockerText.trim() || !onBlockerSubmit) return;
    setBlockerLoading(true);
    await onSubmit(rating!, reflection);
    const response = await onBlockerSubmit(blockerText.trim());
    setAdaptiveResponse(response);
    setBlockerLoading(false);
  };

  // Collapsed state — subtle pill
  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold/8 border border-gold/10 hover:bg-gold/12 hover:border-gold/20 transition-all mb-4 w-full text-left group"
      >
        <span className="text-sm">📖</span>
        <span className="text-xs text-muted group-hover:text-ink/70 transition-colors">
          Weekly check-in — {bookTitle}, Ch. {chapterNumber}
        </span>
        <svg className="w-3.5 h-3.5 text-muted/50 ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
      </button>
    );
  }

  return (
    <div className="bg-gold/5 border border-gold/10 rounded-2xl p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">📖</span>
          <span className="text-[10px] font-semibold text-gold/60 uppercase tracking-widest">Weekly check-in</span>
        </div>
        <button onClick={onDismiss} className="text-muted/50 hover:text-muted text-xs transition-colors">Later</button>
      </div>

      <p className="text-xs text-muted mb-1">{bookTitle}</p>
      <p className="text-sm font-medium text-ink/80 mb-4" style={{ fontFamily: "'Lora', serif" }}>
        Ch. {chapterNumber}: {chapterTitle} — Did you practice this principle this week?
      </p>

      {/* Adaptive follow-up for blockers */}
      {adaptiveResponse ? (
        <div className="animate-message-in">
          <div className="bg-gold/8 border border-gold/15 rounded-xl p-4 mb-3">
            <p className="text-[10px] font-semibold text-gold/60 uppercase tracking-widest mb-2">Adjusted Practice</p>
            <p className="text-sm text-ink/70 leading-relaxed" style={{ fontFamily: "'Lora', serif" }}>
              {adaptiveResponse}
            </p>
          </div>
          <button onClick={onDismiss} className="text-[11px] text-muted hover:text-ink/60 transition-colors">
            Got it ✓
          </button>
        </div>
      ) : showBlockerInput ? (
        <div className="animate-message-in">
          <p className="text-sm text-ink/80 font-medium mb-3" style={{ fontFamily: "'Lora', serif" }}>
            What got in the way? Understanding the blocker is the next step.
          </p>
          <textarea
            value={blockerText}
            onChange={e => setBlockerText(e.target.value)}
            placeholder="I didn't get to it because..."
            rows={2}
            disabled={blockerLoading}
            className="w-full bg-white/60 border border-border rounded-xl px-4 py-3 text-sm text-ink/80 placeholder:text-muted/40 outline-none focus:border-gold/40 transition-colors resize-none leading-relaxed disabled:opacity-50 mb-3"
            style={{ fontFamily: "'Lora', serif" }}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowBlockerInput(false); }}
              className="text-[11px] text-muted hover:text-ink transition-colors"
            >
              Skip
            </button>
            <button
              onClick={handleBlockerSubmit}
              disabled={!blockerText.trim() || blockerLoading}
              className="flex-1 py-2.5 bg-gold hover:bg-gold/90 disabled:bg-border disabled:text-muted text-white font-semibold rounded-xl transition-all text-sm"
            >
              {blockerLoading ? 'Getting you a smaller step...' : 'Share what happened'}
            </button>
          </div>
        </div>
      ) : aiResponse ? (
        <div className="bg-white/60 border border-border rounded-xl p-4">
          <p className="text-sm text-ink/70 italic leading-relaxed" style={{ fontFamily: "'Lora', serif" }}>
            {aiResponse}
          </p>
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-1">
              {Array.from({ length: 10 }, (_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${i < (rating || 0) ? 'bg-gold' : 'bg-border'}`}
                />
              ))}
            </div>
            <span className="text-[10px] text-gold font-semibold">{rating}/10</span>
          </div>
          <button onClick={onDismiss} className="mt-3 text-[11px] text-muted hover:text-ink/60 transition-colors">
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
                    ? 'bg-gold text-white shadow-sm'
                    : rating !== null && n <= rating
                    ? 'bg-gold/30 text-gold'
                    : 'bg-white/60 text-muted/40 hover:bg-gold/10'
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
            className="w-full bg-white/60 border border-border rounded-xl px-4 py-2.5 text-sm text-ink/80 placeholder:text-muted/40 outline-none focus:border-gold/40 transition-colors mb-3"
            style={{ fontFamily: "'Lora', serif" }}
          />

          <button
            onClick={handleSubmit}
            disabled={rating === null || loading}
            className="w-full py-2.5 bg-gold hover:bg-gold/90 disabled:bg-border disabled:text-muted text-white font-semibold rounded-xl transition-all text-sm"
          >
            {loading ? 'Reflecting...' : 'Submit check-in'}
          </button>
        </>
      )}
    </div>
  );
}
