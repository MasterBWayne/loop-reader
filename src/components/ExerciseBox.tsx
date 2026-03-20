'use client';

import { useState } from 'react';

interface ExerciseBoxProps {
  question: string;
  existingAnswer?: string;
  onSubmit: (answer: string) => void;
  loading: boolean;
}

export function ExerciseBox({ question, existingAnswer, onSubmit, loading }: ExerciseBoxProps) {
  const [answer, setAnswer] = useState(existingAnswer || '');
  const [submitted, setSubmitted] = useState(!!existingAnswer);

  const handleSubmit = () => {
    if (!answer.trim()) return;
    setSubmitted(true);
    onSubmit(answer.trim());
  };

  return (
    <div className="mt-12 mb-8">
      <div className="bg-gradient-to-br from-gold/5 to-amber-900/5 border border-gold/15 rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 bg-gold/15 rounded-lg flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
          </div>
          <span className="text-[11px] font-semibold text-gold/60 uppercase tracking-widest">Your reflection</span>
        </div>

        <p className="text-base font-medium text-ink/90 mb-5 leading-relaxed" style={{ fontFamily: "'Lora', serif" }}>
          {question}
        </p>

        {submitted && !loading ? (
          <div className="bg-white/60 border border-border rounded-xl p-4">
            <p className="text-sm text-ink/70 leading-relaxed whitespace-pre-wrap" style={{ fontFamily: "'Lora', serif" }}>{answer}</p>
            <button
              onClick={() => setSubmitted(false)}
              className="text-[11px] text-muted hover:text-ink mt-3 transition-colors"
            >
              Edit response
            </button>
          </div>
        ) : (
          <>
            <textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="Write your response here..."
              rows={5}
              disabled={loading}
              className="w-full bg-white/70 border border-border rounded-xl px-4 py-3.5 text-sm text-ink/80 placeholder:text-ink/25 outline-none focus:border-gold/40 transition-colors resize-none leading-relaxed disabled:opacity-50"
              style={{ fontFamily: "'Lora', serif" }}
            />
            <div className="flex items-center justify-between mt-4">
              <p className="text-[10px] text-muted/50">Your response is private and shapes future chapters</p>
              <button
                onClick={handleSubmit}
                disabled={!answer.trim() || loading}
                className="flex items-center gap-2 bg-gold/90 hover:bg-gold disabled:bg-ink/10 disabled:text-ink/30 text-navy font-semibold px-5 py-2.5 rounded-xl transition-all text-sm"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Save & Continue
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
