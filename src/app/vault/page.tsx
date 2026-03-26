'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getCurrentUser, supabase, loadAllReflections, loadAllCommitments } from '@/lib/supabase';
import { BOOKS } from '@/data/books';

// ── Types ────────────────────────────────────────────────────────────────────

interface InsightEntry {
  id: string;
  source: 'exercise' | 'commitment' | 'coaching';
  bookId: string;
  bookTitle: string;
  chapterNumber: number;
  chapterTitle: string;
  content: string;
  date: string;
  created_at: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function resolveChapterTitle(bookId: string, chapterNumber: number): string {
  const book = BOOKS.find(b => b.id === bookId);
  if (!book) return `Chapter ${chapterNumber}`;
  const ch = book.chapters.find(c => c.number === chapterNumber);
  return ch?.title || `Chapter ${chapterNumber}`;
}

function resolveBookTitle(bookId: string): string {
  return BOOKS.find(b => b.id === bookId)?.title || bookId;
}

const SOURCE_STYLES: Record<InsightEntry['source'], { label: string; bg: string; text: string }> = {
  exercise:   { label: 'Exercise',   bg: 'bg-gold/10',        text: 'text-gold' },
  commitment: { label: 'Commitment', bg: 'bg-blue-500/10',    text: 'text-blue-400' },
  coaching:   { label: 'Coaching',   bg: 'bg-purple-500/10',  text: 'text-purple-400' },
};

// ── Component ────────────────────────────────────────────────────────────────

export default function VaultPage() {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<InsightEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeBook, setActiveBook] = useState<string | null>(null);

  // ── Debounce search ────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ── Load data ──────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const user = await getCurrentUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const uid = user.id;
      const entries: InsightEntry[] = [];

      // Fetch all three sources in parallel
      const [reflections, commitments, coachingRes] = await Promise.all([
        loadAllReflections(uid),
        loadAllCommitments(uid),
        supabase
          .from('coaching_messages')
          .select('*')
          .eq('user_id', uid)
          .eq('role', 'assistant')
          .order('created_at', { ascending: false })
          .limit(100),
      ]);

      // Map reflections
      for (const r of reflections) {
        entries.push({
          id: `refl-${r.book_id}-${r.chapter_number}`,
          source: 'exercise',
          bookId: r.book_id,
          bookTitle: resolveBookTitle(r.book_id),
          chapterNumber: r.chapter_number,
          chapterTitle: resolveChapterTitle(r.book_id, r.chapter_number),
          content: r.answer_text,
          date: formatDate(r.created_at),
          created_at: r.created_at,
        });
      }

      // Map commitments
      for (const c of commitments) {
        entries.push({
          id: `comm-${c.book_id}-${c.chapter_number}`,
          source: 'commitment',
          bookId: c.book_id,
          bookTitle: resolveBookTitle(c.book_id),
          chapterNumber: c.chapter_number,
          chapterTitle: resolveChapterTitle(c.book_id, c.chapter_number),
          content: c.commitment_text,
          date: formatDate(c.created_at || ''),
          created_at: c.created_at || '',
        });
      }

      // Map coaching messages
      const msgs = coachingRes.data || [];
      for (const m of msgs) {
        entries.push({
          id: `coach-${m.id}`,
          source: 'coaching',
          bookId: m.book_id,
          bookTitle: resolveBookTitle(m.book_id),
          chapterNumber: m.chapter_number,
          chapterTitle: resolveChapterTitle(m.book_id, m.chapter_number),
          content: m.content,
          date: formatDate(m.created_at || ''),
          created_at: m.created_at || '',
        });
      }

      // Sort by date descending (newest first)
      entries.sort((a, b) => {
        if (!a.created_at) return 1;
        if (!b.created_at) return -1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setInsights(entries);
      setLoading(false);
    }

    init();
  }, []);

  // ── Derive book filter chips ───────────────────────────────────────────
  const bookChips = useMemo(() => {
    const map = new Map<string, { title: string; count: number }>();
    for (const e of insights) {
      const existing = map.get(e.bookId);
      if (existing) {
        existing.count++;
      } else {
        map.set(e.bookId, { title: e.bookTitle, count: 1 });
      }
    }
    return Array.from(map.entries()).map(([id, { title, count }]) => ({ id, title, count }));
  }, [insights]);

  // ── Filter logic ───────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let results = insights;

    if (activeBook) {
      results = results.filter(e => e.bookId === activeBook);
    }

    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      results = results.filter(
        e =>
          e.content.toLowerCase().includes(q) ||
          e.bookTitle.toLowerCase().includes(q) ||
          e.chapterTitle.toLowerCase().includes(q)
      );
    }

    return results;
  }, [insights, activeBook, debouncedQuery]);

  // ── Loading state ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--rk-bg)] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </main>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────
  if (insights.length === 0) {
    return (
      <main className="min-h-screen bg-[var(--rk-bg)] text-ink pb-24">
        <div className="max-w-2xl mx-auto px-6 pt-8">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-ink/50 hover:text-gold transition-colors mb-6">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Library
          </Link>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Lora', serif" }}>
            Insight Vault
          </h1>
        </div>
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <div className="w-16 h-16 bg-ink/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink/30">
              <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-2" style={{ fontFamily: "'Lora', serif" }}>
            Your vault is empty
          </h2>
          <p className="text-sm text-ink/50 max-w-sm mx-auto mb-6">
            Start reading books and completing exercises. Your reflections, commitments, and coaching messages will be collected here as a searchable timeline.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-gold hover:bg-accent-hover text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            Browse Library
          </Link>
        </div>
      </main>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[var(--rk-bg)] text-ink pb-24">
      {/* Header */}
      <div className="max-w-2xl mx-auto px-6 pt-8 pb-2">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-ink/50 hover:text-gold transition-colors mb-6">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Library
        </Link>
        <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: "'Lora', serif" }}>
          Insight Vault
        </h1>
        <p className="text-sm text-ink/50">
          {insights.length} insight{insights.length !== 1 ? 's' : ''} across {bookChips.length} book{bookChips.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Search */}
      <div className="max-w-2xl mx-auto px-6 pt-5 pb-2">
        <div className="relative">
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30 pointer-events-none"
          >
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search insights..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-ink placeholder:text-ink/30 outline-none focus:border-gold/60 transition-colors"
            style={{ fontFamily: "var(--rk-font-body, sans-serif)" }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink/60 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Book filter chips */}
      {bookChips.length > 1 && (
        <div className="max-w-2xl mx-auto px-6 pt-3 pb-1">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => setActiveBook(null)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                activeBook === null
                  ? 'bg-gold text-white'
                  : 'bg-white border border-border text-ink/60 hover:border-gold/40'
              }`}
            >
              All ({insights.length})
            </button>
            {bookChips.map(chip => (
              <button
                key={chip.id}
                onClick={() => setActiveBook(activeBook === chip.id ? null : chip.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
                  activeBook === chip.id
                    ? 'bg-gold text-white'
                    : 'bg-white border border-border text-ink/60 hover:border-gold/40'
                }`}
              >
                {chip.title} ({chip.count})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="max-w-2xl mx-auto px-6 pt-5 space-y-4">
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm text-ink/40">No insights match your search.</p>
            <button
              onClick={() => { setSearchQuery(''); setActiveBook(null); }}
              className="mt-3 text-xs text-gold hover:underline font-semibold"
            >
              Clear filters
            </button>
          </div>
        )}

        {filtered.map(entry => {
          const style = SOURCE_STYLES[entry.source];
          return (
            <div
              key={entry.id}
              className="bg-white border border-border rounded-2xl overflow-hidden"
            >
              {/* Card header */}
              <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${style.bg} ${style.text}`}>
                    {style.label}
                  </span>
                  <span className="text-[10px] text-ink/30 font-medium truncate">
                    {entry.bookTitle}
                  </span>
                </div>
                <span className="text-[10px] text-ink/30 font-medium flex-shrink-0 ml-2">
                  {entry.date}
                </span>
              </div>

              {/* Chapter context */}
              <div className="px-5 pb-1.5">
                <span className="text-[10px] font-semibold text-ink/40 uppercase tracking-widest">
                  Ch {entry.chapterNumber}: {entry.chapterTitle}
                </span>
              </div>

              {/* Content */}
              <div className="px-5 pb-5 pt-1.5">
                <p
                  className="text-sm text-ink/80 leading-relaxed whitespace-pre-wrap"
                  style={{ fontFamily: "'Lora', serif" }}
                >
                  {entry.content}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
