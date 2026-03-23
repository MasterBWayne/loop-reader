'use client';

import { useState, useEffect } from 'react';
import { loadReflections, loadMaintenanceCheckins, loadPersonalSummary, savePersonalSummary } from '@/lib/supabase';

interface PersonalSummaryViewProps {
  bookId: string;
  bookTitle: string;
  userId: string;
  coverColor: string;
  onClose: () => void;
  userProfile?: any;
}

export function PersonalSummaryView({
  bookId,
  bookTitle,
  userId,
  coverColor,
  onClose,
  userProfile,
}: PersonalSummaryViewProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [responseCount, setResponseCount] = useState(0);

  const fetchSummary = async (forceRegenerate = false) => {
    if (forceRegenerate) setRegenerating(true);
    else setLoading(true);

    try {
      // Check for cached summary first (unless regenerating)
      if (!forceRegenerate) {
        const cached = await loadPersonalSummary(userId, bookId);
        if (cached?.summary_text) {
          setSummary(cached.summary_text);
          setResponseCount(cached.response_count);
          setLoading(false);
          return;
        }
      }

      // Load all data for this book
      const [reflections, checkins] = await Promise.all([
        loadReflections(userId, bookId),
        loadMaintenanceCheckins(userId, bookId),
      ]);

      const totalResponses = reflections.length + checkins.length;
      setResponseCount(totalResponses);

      if (totalResponses === 0) {
        setSummary(null);
        setLoading(false);
        setRegenerating(false);
        return;
      }

      // Generate via API
      const res = await fetch('/api/personal-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookTitle,
          reflections: reflections.map(r => ({
            chapter_number: r.chapter_number,
            question_text: r.question_text,
            answer_text: r.answer_text,
          })),
          checkins: checkins.map(c => ({
            chapter_number: c.chapter_number,
            rating: c.rating,
            reflection: c.reflection,
          })),
          profile: userProfile,
        }),
      });
      const data = await res.json();

      if (data.summary) {
        setSummary(data.summary);
        // Cache it
        await savePersonalSummary(userId, bookId, data.summary, totalResponses);
      }
    } catch (err) {
      console.error('Personal summary error:', err);
    }

    setLoading(false);
    setRegenerating(false);
  };

  useEffect(() => { fetchSummary(); }, [userId, bookId]);

  const renderText = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.trim() === '') return <br key={i} />;
      const parts = line.split(/(\*[^*]+\*)/g);
      return (
        <p key={i} className="mb-3 last:mb-0">
          {parts.map((part, j) => {
            if (part.startsWith('*') && part.endsWith('*')) {
              return <em key={j} className="text-gold/80">{part.slice(1, -1)}</em>;
            }
            return <span key={j}>{part}</span>;
          })}
        </p>
      );
    });
  };

  // Parse the coverColor to extract a usable gradient or color
  const bgAccent = coverColor.includes('from-')
    ? `bg-gradient-to-br ${coverColor}`
    : '';
  const bgStyle = !coverColor.includes('from-')
    ? { background: `linear-gradient(135deg, ${coverColor}22, ${coverColor}08)` }
    : {};

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[85vh] bg-navy-light border border-ink/10 rounded-2xl overflow-hidden flex flex-col animate-message-in">
        {/* Header with book accent */}
        <div
          className={`px-6 py-5 ${bgAccent} relative`}
          style={bgStyle}
        >
          <div className="absolute inset-0 bg-navy/70" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gold/60 font-semibold tracking-[0.15em] uppercase mb-1">Your Story</p>
              <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                My {bookTitle}
              </h2>
            </div>
            <button onClick={onClose} className="text-ink/40 hover:text-white transition-colors p-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto reader-scroll px-6 py-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin mb-4" />
              <p className="text-sm text-ink/50">Compiling your story with this book...</p>
            </div>
          ) : !summary ? (
            <div className="text-center py-16">
              <p className="text-lg text-ink/60 mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                No reflections yet
              </p>
              <p className="text-sm text-ink/40">
                Complete some chapter exercises to generate your personal summary.
              </p>
            </div>
          ) : (
            <>
              <div className="text-base text-ink/80 leading-[1.85]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                {renderText(summary)}
              </div>

              <div className="mt-6 pt-4 border-t border-ink/10 flex items-center justify-between">
                <p className="text-[10px] text-ink/30">
                  Based on {responseCount} response{responseCount !== 1 ? 's' : ''}
                </p>
                <button
                  onClick={() => fetchSummary(true)}
                  disabled={regenerating}
                  className="flex items-center gap-2 text-xs text-gold/60 hover:text-gold transition-colors disabled:opacity-40"
                >
                  {regenerating ? (
                    <>
                      <div className="w-3 h-3 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                      </svg>
                      Regenerate
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
