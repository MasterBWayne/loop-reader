'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser, supabase } from '@/lib/supabase';
import { BOOKS } from '@/data/books';

interface Reflection {
  book_id: string;
  chapter_number: number;
  question_text: string;
  answer_text: string;
  created_at: string;
}

interface BookGroup {
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  coverColor: string;
  reflections: {
    chapterNumber: number;
    chapterTitle: string;
    question: string;
    answer: string;
    date: string;
  }[];
}

export default function JourneyPage() {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<BookGroup[]>([]);
  const [expandedBook, setExpandedBook] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const user = await getCurrentUser();
      if (!user) { setLoading(false); return; }

      const { data, error } = await supabase
        .from('chapter_reflections')
        .select('book_id, chapter_number, question_text, answer_text, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error || !data || data.length === 0) {
        // Try localStorage fallback
        const localGroups: BookGroup[] = [];
        for (const book of BOOKS) {
          try {
            const stored = JSON.parse(localStorage.getItem(`loop-reader-reflections-${book.id}`) || '{}');
            const entries = Object.entries(stored);
            if (entries.length > 0) {
              localGroups.push({
                bookId: book.id,
                bookTitle: book.title,
                bookAuthor: book.author,
                coverColor: book.coverColor,
                reflections: entries.map(([cn, ans]) => {
                  const ch = book.chapters.find(c => c.number === parseInt(cn));
                  return {
                    chapterNumber: parseInt(cn),
                    chapterTitle: ch?.title || `Chapter ${cn}`,
                    question: ch?.exerciseQuestion || '',
                    answer: ans as string,
                    date: '',
                  };
                }).sort((a, b) => a.chapterNumber - b.chapterNumber),
              });
            }
          } catch {}
        }
        setGroups(localGroups);
        if (localGroups.length > 0) setExpandedBook(localGroups[0].bookId);
        setLoading(false);
        return;
      }

      // Group by book
      const bookMap = new Map<string, Reflection[]>();
      for (const r of data) {
        if (!bookMap.has(r.book_id)) bookMap.set(r.book_id, []);
        bookMap.get(r.book_id)!.push(r);
      }

      const result: BookGroup[] = [];
      for (const [bookId, reflections] of bookMap) {
        const book = BOOKS.find(b => b.id === bookId);
        if (!book) continue;

        result.push({
          bookId,
          bookTitle: book.title,
          bookAuthor: book.author,
          coverColor: book.coverColor,
          reflections: reflections
            .sort((a, b) => a.chapter_number - b.chapter_number)
            .map(r => {
              const ch = book.chapters.find(c => c.number === r.chapter_number);
              return {
                chapterNumber: r.chapter_number,
                chapterTitle: ch?.title || `Chapter ${r.chapter_number}`,
                question: r.question_text,
                answer: r.answer_text,
                date: new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
              };
            }),
        });
      }

      setGroups(result);
      if (result.length > 0) setExpandedBook(result[0].bookId);
      setLoading(false);
    }

    load();
  }, []);

  const totalReflections = groups.reduce((sum, g) => sum + g.reflections.length, 0);

  if (loading) {
    return (
      <main className="min-h-screen bg-navy flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-navy text-white">
      {/* Header */}
      <div className="max-w-3xl mx-auto px-6 pt-8 pb-6">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 bg-gold rounded flex items-center justify-center text-navy font-bold text-sm" style={{ fontFamily: "'Lora', serif" }}>A</div>
          <span className="text-sm font-medium tracking-wide text-white/80">THE ARCHITECT METHOD</span>
        </div>

        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Lora', serif" }}>Your Journey</h1>
        <p className="text-sm text-white/40">
          {totalReflections === 0
            ? 'Complete chapter exercises to build your self-discovery journal.'
            : `${totalReflections} reflection${totalReflections !== 1 ? 's' : ''} across ${groups.length} book${groups.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Empty state */}
      {groups.length === 0 && (
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6b6b80" strokeWidth="1.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-2" style={{ fontFamily: "'Lora', serif" }}>No reflections yet</h2>
          <p className="text-sm text-white/40 max-w-sm mx-auto mb-6">
            Start reading a book and complete the exercise at the end of each chapter. Your answers will appear here as a personal growth journal.
          </p>
          <a href="/" className="inline-flex items-center gap-2 bg-gold hover:bg-gold-light text-navy font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm">
            Browse Library
          </a>
        </div>
      )}

      {/* Book groups */}
      <div className="max-w-3xl mx-auto px-6 pb-24 space-y-4">
        {groups.map(group => {
          const isExpanded = expandedBook === group.bookId;
          return (
            <div key={group.bookId} className="rounded-2xl border border-white/10 overflow-hidden">
              {/* Book header */}
              <button
                onClick={() => setExpandedBook(isExpanded ? null : group.bookId)}
                className="w-full text-left"
              >
                <div className={`bg-gradient-to-r ${group.coverColor} p-4 flex items-center justify-between relative`}>
                  <div className="absolute inset-0 bg-black/30" />
                  <div className="relative z-10 flex items-center gap-3 min-w-0">
                    <div>
                      <h2 className="text-base font-bold text-white leading-tight" style={{ fontFamily: "'Lora', serif" }}>{group.bookTitle}</h2>
                      <p className="text-[11px] text-white/50 mt-0.5">
                        {group.bookAuthor} &middot; {group.reflections.length} reflection{group.reflections.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="relative z-10">
                    <svg
                      width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"
                      className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    >
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                </div>
              </button>

              {/* Reflections */}
              {isExpanded && (
                <div className="bg-navy-light divide-y divide-white/5">
                  {group.reflections.map((r, i) => (
                    <div key={i} className="px-5 py-5">
                      {/* Chapter badge */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-semibold text-gold/60 uppercase tracking-widest">
                          Chapter {r.chapterNumber}: {r.chapterTitle}
                        </span>
                        {r.date && (
                          <span className="text-[10px] text-white/20">{r.date}</span>
                        )}
                      </div>

                      {/* Question */}
                      <p className="text-xs text-white/40 italic mb-2 leading-relaxed" style={{ fontFamily: "'Lora', serif" }}>
                        &ldquo;{r.question}&rdquo;
                      </p>

                      {/* Answer */}
                      <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap" style={{ fontFamily: "'Lora', serif" }}>
                        {r.answer}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
