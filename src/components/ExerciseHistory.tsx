'use client';

import { useState, useEffect } from 'react';
import { loadExerciseResponses, type ExerciseResponseRecord } from '@/lib/supabase';

interface ExerciseHistoryProps {
  userId: string;
  bookId: string;
  chapters: { number: number; title: string }[];
}

interface GroupedResponses {
  chapterNumber: number;
  chapterTitle: string;
  responses: ExerciseResponseRecord[];
}

export function ExerciseHistory({ userId, bookId, chapters }: ExerciseHistoryProps) {
  const [grouped, setGrouped] = useState<GroupedResponses[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!userId || !bookId) return;
    loadExerciseResponses(userId, bookId).then(responses => {
      // Group by chapter
      const map = new Map<number, ExerciseResponseRecord[]>();
      for (const r of responses) {
        const existing = map.get(r.chapter_number) || [];
        existing.push(r);
        map.set(r.chapter_number, existing);
      }

      const result: GroupedResponses[] = [];
      for (const [chapterNumber, resps] of map.entries()) {
        const ch = chapters.find(c => c.number === chapterNumber);
        result.push({
          chapterNumber,
          chapterTitle: ch?.title || `Chapter ${chapterNumber}`,
          responses: resps,
        });
      }
      result.sort((a, b) => a.chapterNumber - b.chapterNumber);
      setGrouped(result);
      setLoading(false);
    });
  }, [userId, bookId, chapters]);

  const toggleExpand = (chapterNumber: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(chapterNumber)) next.delete(chapterNumber);
      else next.add(chapterNumber);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="px-6 py-8">
        <div className="flex items-center gap-2 text-sm text-[#999999]">
          <div className="w-4 h-4 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          Loading your responses...
        </div>
      </div>
    );
  }

  if (grouped.length === 0) {
    return (
      <div className="px-6 py-8 text-center">
        <p className="text-sm text-[#999999]">No exercise responses yet.</p>
        <p className="text-xs text-[#666666] mt-1">Complete chapter exercises to see your history here.</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C97D2E" strokeWidth="2" strokeLinecap="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
        <h3 className="text-base font-semibold text-[#E8E8E8]" style={{ fontFamily: "var(--rk-font-heading)" }}>
          My Responses
        </h3>
        <span className="text-xs text-[#666666] ml-auto">
          {grouped.reduce((acc, g) => acc + g.responses.length, 0)} total
        </span>
      </div>

      {grouped.map(group => (
        <div key={group.chapterNumber} className="bg-[#1C1C1C] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden">
          <button
            onClick={() => toggleExpand(group.chapterNumber)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-[rgba(255,255,255,0.03)] transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs text-gold/60 font-mono">Ch. {group.chapterNumber}</span>
              <span className="text-sm text-[#E8E8E8] font-medium" style={{ fontFamily: "var(--rk-font-heading)" }}>
                {group.chapterTitle}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#666666]">{group.responses.length} response{group.responses.length !== 1 ? 's' : ''}</span>
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666666" strokeWidth="2"
                className={`transition-transform ${expanded.has(group.chapterNumber) ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </button>

          {expanded.has(group.chapterNumber) && (
            <div className="border-t border-[rgba(255,255,255,0.06)] px-4 py-3 space-y-4">
              {group.responses.map((r, i) => (
                <div key={r.id || i} className="space-y-2">
                  {/* Prompt */}
                  {r.prompt_text && (
                    <div className="text-xs text-gold/70 italic">
                      &ldquo;{r.prompt_text}&rdquo;
                    </div>
                  )}

                  {/* User response */}
                  <div className="bg-[#252525] rounded-lg px-3 py-2.5">
                    <p className="text-[10px] text-[#666666] font-semibold uppercase tracking-wide mb-1">Your response</p>
                    <p className="text-sm text-[#E8E8E8]/80 leading-relaxed">{r.response_text}</p>
                  </div>

                  {/* AI Feedback */}
                  {r.ai_feedback && (
                    <div className="bg-[rgba(201,125,46,0.08)] border border-[rgba(201,125,46,0.15)] rounded-lg px-3 py-2.5">
                      <p className="text-[10px] text-gold/60 font-semibold uppercase tracking-wide mb-1">AI Feedback</p>
                      <p className="text-sm text-[#E8E8E8]/70 leading-relaxed">{r.ai_feedback.feedback}</p>
                      {r.ai_feedback.missed && (
                        <p className="text-xs text-[#999999] mt-1.5 italic">Consider: {r.ai_feedback.missed}</p>
                      )}
                    </div>
                  )}

                  {/* Timestamp */}
                  {r.created_at && (
                    <p className="text-[10px] text-[#555555]">
                      {new Date(r.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: 'numeric', minute: '2-digit',
                      })}
                    </p>
                  )}

                  {i < group.responses.length - 1 && (
                    <div className="border-b border-[rgba(255,255,255,0.04)] my-2" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
