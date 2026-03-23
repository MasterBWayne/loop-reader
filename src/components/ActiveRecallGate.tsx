'use client';

import { useState } from 'react';
import { MicButton } from './MicButton';

interface ActiveRecallGateProps {
  chapterTitle: string;
  chapterNumber: number;
  onPass: () => void;
  onReRead: () => void;
  bookId: string;
  userId?: string;
  chapterContent: string;
  exerciseQuestion?: string;
}

export function ActiveRecallGate({
  chapterTitle,
  chapterNumber,
  onPass,
  onReRead,
  bookId,
  userId,
  chapterContent,
  exerciseQuestion,
}: ActiveRecallGateProps) {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ understood: boolean; feedback: string; missed: string } | null>(null);

  const wordCount = response.trim().split(/\s+/).filter(Boolean).length;
  const isValid = wordCount >= 20;

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);

    try {
      const res = await fetch('/api/active-recall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userResponse: response.trim(),
          chapterTitle,
          chapterContent,
          exerciseQuestion,
        }),
      });
      const data = await res.json();
      setResult(data);

      // Save to exercise_responses
      if (userId) {
        const { saveExerciseResponse } = await import('@/lib/supabase');
        await saveExerciseResponse(
          userId,
          bookId,
          chapterNumber,
          'active-recall',
          response.trim(),
          `Recall the main idea of Ch. ${chapterNumber}: ${chapterTitle}`,
          data
        );
      }
    } catch {
      setResult({ understood: true, feedback: 'Thanks for reflecting on this chapter.', missed: '' });
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-navy/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-navy-light border border-ink/10 rounded-2xl p-6 md:p-8 animate-message-in">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gold/15 rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C97D2E" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <path d="M12 17h.01" />
            </svg>
          </div>
          <span className="text-[11px] font-semibold text-gold/60 uppercase tracking-widest">Active Recall</span>
        </div>

        <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Ch. {chapterNumber}: {chapterTitle}
        </h2>

        {!result ? (
          <>
            <p className="text-sm text-ink/70 mb-5 leading-relaxed" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Before moving on — explain the main idea of this chapter in your own words, as if telling a friend. <span className="text-ink/40">(minimum 20 words)</span>
            </p>

            <div className="relative">
              <textarea
                value={response}
                onChange={e => {
                  setResponse(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                placeholder="The main idea of this chapter is..."
                disabled={loading}
                className="w-full min-h-[120px] bg-ink/5 border border-ink/15 rounded-xl px-4 py-3.5 pb-10 text-sm text-ink/80 placeholder:text-ink/25 outline-none focus:border-gold/40 transition-colors resize-none leading-relaxed disabled:opacity-50"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              />
              {!loading && (
                <MicButton
                  currentText={response}
                  onTextChange={setResponse}
                  className="absolute bottom-2 right-2"
                />
              )}
            </div>

            <div className="flex items-center justify-between mt-4">
              <span className={`text-[11px] ${isValid ? 'text-emerald-500' : 'text-ink/30'}`}>
                {wordCount}/20 words
              </span>
              <button
                onClick={handleSubmit}
                disabled={!isValid || loading}
                className="flex items-center gap-2 bg-gold/90 hover:bg-gold disabled:bg-ink/10 disabled:text-ink/30 text-ink font-semibold px-5 py-2.5 rounded-xl transition-all text-sm"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
                    Evaluating...
                  </>
                ) : (
                  'Submit'
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="animate-message-in">
            {result.understood ? (
              <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-xl p-5 mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                  <span className="text-sm font-semibold text-emerald-400">You got it.</span>
                </div>
                <p className="text-sm text-ink/70 leading-relaxed" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  {result.feedback}
                </p>
              </div>
            ) : (
              <div className="bg-amber-900/20 border border-amber-500/20 rounded-xl p-5 mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" /></svg>
                  <span className="text-sm font-semibold text-amber-400">Almost there</span>
                </div>
                <p className="text-sm text-ink/70 leading-relaxed mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  {result.feedback}
                </p>
                {result.missed && (
                  <p className="text-sm text-amber-300/80 leading-relaxed" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    Core idea you missed: <em>{result.missed}</em>
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center gap-3">
              {result.understood ? (
                <button
                  onClick={onPass}
                  className="flex-1 bg-gold/90 hover:bg-gold text-ink font-semibold py-3 rounded-xl transition-all text-sm"
                >
                  Continue to next chapter
                </button>
              ) : (
                <>
                  <button
                    onClick={onReRead}
                    className="flex-1 bg-ink/10 hover:bg-ink/15 text-ink/70 font-medium py-3 rounded-xl transition-all text-sm"
                  >
                    Re-read chapter
                  </button>
                  <button
                    onClick={() => { setResult(null); setResponse(''); }}
                    className="flex-1 bg-gold/90 hover:bg-gold text-ink font-semibold py-3 rounded-xl transition-all text-sm"
                  >
                    Try again
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
