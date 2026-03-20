'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { ReaderLayout } from '@/components/ReaderLayout';
import { IntakeForm, type IntakeAnswers } from '@/components/IntakeForm';
import { BOOKS, CATEGORIES, type Book, type BookCategory } from '@/data/books';
import { PaceSelector, type ReadingPace } from '@/components/PaceSelector';
import {
  ensureAnonymousUser,
  getCurrentUser,
  saveIntake,
  loadIntake,
  saveChapterProgress,
  loadChapterProgress,
  loadUserProfile,
  isAnonymousUser,
  type ChapterProgressRecord,
  type UserProfileData,
} from '@/lib/supabase';
import { UserProfile, UpgradeBanner } from '@/components/UserProfile';

type AppState = 'loading' | 'landing' | 'intake' | 'pace-select' | 'reading';
type SortOption = 'featured' | 'newest' | 'az';

const STORAGE_KEY_INTAKE = 'loop-reader-intake';
const STORAGE_KEY_PROGRESS = 'loop-reader-progress';
const STORAGE_KEY_PACE = 'loop-reader-pace';
const BOOKS_PER_PAGE = 12;

interface ChapterProgress {
  [chapterNumber: number]: { unlockedAt: string; firstOpenedAt?: string };
}

function getLocalIntake(): IntakeAnswers | null {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_INTAKE) || 'null'); } catch { return null; }
}
function getLocalProgress(bookId: string): ChapterProgress {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(`${STORAGE_KEY_PROGRESS}-${bookId}`) || '{}'); } catch { return {}; }
}
function supabaseProgressToLocal(records: ChapterProgressRecord[]): ChapterProgress {
  const r: ChapterProgress = {};
  for (const rec of records) r[rec.chapter_number] = { unlockedAt: rec.unlocked_at, firstOpenedAt: rec.first_opened_at || undefined };
  return r;
}
function isChapterUnlocked(cn: number, progress: ChapterProgress, pace?: ReadingPace): boolean {
  if (pace === 'free') return true;
  if (cn === 1) return true;
  const prev = progress[cn - 1];
  if (!prev?.firstOpenedAt) return false;
  return new Date() >= new Date(new Date(prev.firstOpenedAt).getTime() + 86400000);
}
function getUnlockDate(cn: number, progress: ChapterProgress): Date | null {
  if (cn === 1) return null;
  const prev = progress[cn - 1];
  if (!prev?.firstOpenedAt) return null;
  return new Date(new Date(prev.firstOpenedAt).getTime() + 86400000);
}

// ── Book Card ──────────────────────────────────────────────────────────────

function BookCard({ book, progress, onSelect, isHorizontal = false }: { book: Book; progress: ChapterProgress; onSelect: () => void, isHorizontal?: boolean }) {
  const chaptersRead = Object.keys(progress).length;
  const contentChapters = book.chapters.filter(c => c.content && !c.content.startsWith('Coming soon'));
  const total = contentChapters.length > 0 ? contentChapters.length : book.chapters.length;
  const percent = total > 0 ? Math.min(100, Math.round((chaptersRead / total) * 100)) : 0;
  
  return (
    <button onClick={onSelect} className={`flex flex-col gap-2 text-left group shrink-0 ${isHorizontal ? 'w-36 snap-start' : 'w-full'}`}>
      <div className={`aspect-square w-full rounded-md bg-gradient-to-br ${book.coverColor} relative p-3 flex flex-col justify-end overflow-hidden shadow-sm`}>
        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
        <h3 className="relative z-10 text-white font-bold leading-tight line-clamp-3 text-sm drop-shadow-md" style={{ fontFamily: "'Lora', serif" }}>
          {book.title}
        </h3>
        {chaptersRead > 0 && (
          <div className="absolute bottom-0 left-0 h-[3px] bg-white/20 w-full">
            <div className="h-full bg-gold" style={{ width: `${percent}%` }} />
          </div>
        )}
      </div>
      <div>
        <p className="text-xs text-white/60 truncate">{book.author}</p>
        <p className="text-[10px] text-white/40 mt-0.5">
          {chaptersRead > 0 ? `Ch ${chaptersRead} of ${total}` : `${total} chapters`}
        </p>
      </div>
    </button>
  );
}

function JumpBackInCard({ book, onSelect }: { book: Book; onSelect: () => void }) {
  return (
    <button onClick={onSelect} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 rounded-md overflow-hidden transition-colors text-left w-full h-14 pr-2 group">
      <div className={`w-14 h-14 bg-gradient-to-br ${book.coverColor} shrink-0 shadow-inner opacity-90 group-hover:opacity-100 transition-opacity`} />
      <span className="font-semibold text-xs leading-tight line-clamp-2" style={{ fontFamily: "'Lora', serif" }}>{book.title}</span>
    </button>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────

export default function Home() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [intake, setIntake] = useState<IntakeAnswers | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [progress, setProgress] = useState<ChapterProgress>({});
  const [allProgress, setAllProgress] = useState<Record<string, ChapterProgress>>({});
  const [paceMap, setPaceMap] = useState<Record<string, ReadingPace>>({});

  // Library state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<BookCategory | 'All'>('All');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [visibleCount, setVisibleCount] = useState(BOOKS_PER_PAGE);

  // ── Sync reading state to localStorage for BottomNav ─────────────────
  useEffect(() => {
    try {
      localStorage.setItem('loop-reader-is-reading', appState === 'reading' ? 'true' : 'false');
    } catch {}
  }, [appState]);

  useEffect(() => {
    const handleNavLibrary = () => {
      setAppState('landing');
      setSelectedBook(null);
    };
    window.addEventListener('navigate-library', handleNavLibrary);
    return () => window.removeEventListener('navigate-library', handleNavLibrary);
  }, []);

  // ── Init ──────────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const uid = await ensureAnonymousUser();
      setUserId(uid);
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      let loadedIntake: IntakeAnswers | null = null;
      if (uid) {
        loadedIntake = await loadIntake(uid);
        const profile = await loadUserProfile(uid);
        if (profile) setUserProfile(profile);
      }
      if (!loadedIntake) loadedIntake = getLocalIntake();
      if (loadedIntake) {
        setIntake(loadedIntake);
        localStorage.setItem(STORAGE_KEY_INTAKE, JSON.stringify(loadedIntake));
      }

      const progressMap: Record<string, ChapterProgress> = {};
      if (uid) {
        const records = await loadChapterProgress(uid);
        if (records.length > 0) {
          const converted = supabaseProgressToLocal(records);
          for (const book of BOOKS) {
            progressMap[book.id] = converted;
            localStorage.setItem(`${STORAGE_KEY_PROGRESS}-${book.id}`, JSON.stringify(converted));
          }
        }
      }
      for (const book of BOOKS) {
        if (!progressMap[book.id] || Object.keys(progressMap[book.id]).length === 0) {
          progressMap[book.id] = getLocalProgress(book.id);
        }
      }
      setAllProgress(progressMap);
      try { const p = localStorage.getItem(STORAGE_KEY_PACE); if (p) setPaceMap(JSON.parse(p)); } catch {}

      // Check for resume from /reading tab or ?resume=true
      const params = new URLSearchParams(window.location.search);
      const shouldResume = params.get('resume') === 'true';
      if (shouldResume) {
        const lastBookId = localStorage.getItem('loop-reader-last-book');
        if (lastBookId) {
          const book = BOOKS.find(b => b.id === lastBookId);
          if (book && loadedIntake) {
            const bookPace = (() => { try { const pm = localStorage.getItem(STORAGE_KEY_PACE); return pm ? JSON.parse(pm)[lastBookId] : null; } catch { return null; } })();
            const bookProgress = progressMap[lastBookId] || {};
            setSelectedBook(book);
            setProgress(bookProgress);
            if (bookPace) {
              if (Object.keys(bookProgress).length === 0) {
                const init: ChapterProgress = { 1: { unlockedAt: new Date().toISOString(), firstOpenedAt: new Date().toISOString() } };
                setProgress(init);
                setAllProgress(prev => ({ ...prev, [lastBookId]: init }));
              }
              setAppState('reading');
              window.history.replaceState({}, '', '/');
              return;
            }
          }
        }
      }

      setAppState('landing');

      const { data: { subscription } } = (await import('@/lib/supabase')).supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          setUserId(session.user.id);
          const newIntake = await loadIntake(session.user.id);
          if (newIntake) {
            setIntake(newIntake);
            localStorage.setItem(STORAGE_KEY_INTAKE, JSON.stringify(newIntake));
          }
        }
      });
      return () => subscription.unsubscribe();
    }
    init();
  }, []);

  // ── Filtered + sorted books ───────────────────────────────────────────
  const filteredBooks = useMemo(() => {
    let books = [...BOOKS];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      books = books.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.tags.some(t => t.toLowerCase().includes(q)) ||
        b.category.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== 'All') {
      books = books.filter(b => b.category === categoryFilter);
    }
    switch (sortBy) {
      case 'az': books.sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'newest': books.sort((a, b) => b.bookNumber - a.bookNumber); break;
      case 'featured': books.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)); break;
    }
    return books;
  }, [searchQuery, categoryFilter, sortBy]);

  const startedBooks = useMemo(() => {
    return BOOKS.filter(b => Object.keys(allProgress[b.id] || {}).length > 0)
      .sort((a, b) => {
        const aProg = allProgress[a.id];
        const bProg = allProgress[b.id];
        const aMax = Math.max(...Object.values(aProg).map(p => new Date(p.firstOpenedAt || p.unlockedAt || 0).getTime()));
        const bMax = Math.max(...Object.values(bProg).map(p => new Date(p.firstOpenedAt || p.unlockedAt || 0).getTime()));
        return bMax - aMax;
      });
  }, [allProgress]);

  const recentBooks = startedBooks.slice(0, 4);
  const visibleBooks = filteredBooks.slice(0, visibleCount);
  const hasMore = visibleCount < filteredBooks.length;
  const isSearching = searchQuery.trim() || categoryFilter !== 'All';

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleIntakeComplete = useCallback(async (answers: IntakeAnswers) => {
    setIntake(answers);
    localStorage.setItem(STORAGE_KEY_INTAKE, JSON.stringify(answers));
    if (userId) saveIntake(userId, answers);
    if (selectedBook) setAppState('pace-select');
  }, [userId, selectedBook]);

  const handlePaceSelect = useCallback((pace: ReadingPace) => {
    if (!selectedBook) return;
    const updated = { ...paceMap, [selectedBook.id]: pace };
    setPaceMap(updated);
    localStorage.setItem(STORAGE_KEY_PACE, JSON.stringify(updated));
    const bookProgress = allProgress[selectedBook.id] || {};
    if (Object.keys(bookProgress).length === 0) {
      const init: ChapterProgress = { 1: { unlockedAt: new Date().toISOString(), firstOpenedAt: new Date().toISOString() } };
      setProgress(init);
      localStorage.setItem(`${STORAGE_KEY_PROGRESS}-${selectedBook.id}`, JSON.stringify(init));
      setAllProgress(prev => ({ ...prev, [selectedBook.id]: init }));
      if (userId) saveChapterProgress(userId, selectedBook.id, 1);
    } else {
      setProgress(bookProgress);
    }
    setAppState('reading');
  }, [selectedBook, paceMap, allProgress, userId]);

  const handleSelectBook = useCallback((book: Book) => {
    setSelectedBook(book);
    const bookProgress = allProgress[book.id] || {};
    setProgress(bookProgress);
    if (!intake) { setAppState('intake'); return; }
    if (!paceMap[book.id]) { setAppState('pace-select'); return; }
    if (Object.keys(bookProgress).length === 0) {
      const init: ChapterProgress = { 1: { unlockedAt: new Date().toISOString(), firstOpenedAt: new Date().toISOString() } };
      setProgress(init);
      localStorage.setItem(`${STORAGE_KEY_PROGRESS}-${book.id}`, JSON.stringify(init));
      setAllProgress(prev => ({ ...prev, [book.id]: init }));
      if (userId) saveChapterProgress(userId, book.id, 1);
    }
    setAppState('reading');
  }, [intake, allProgress, userId, paceMap]);

  const handleChapterOpen = useCallback((chapterNumber: number) => {
    if (!selectedBook) return;
    try {
      localStorage.setItem('loop-reader-last-book', selectedBook.id);
      localStorage.setItem('loop-reader-last-chapter', String(chapterNumber));
    } catch {}
    setProgress(prev => {
      const updated = { ...prev };
      if (!updated[chapterNumber]) updated[chapterNumber] = { unlockedAt: new Date().toISOString() };
      if (!updated[chapterNumber].firstOpenedAt) updated[chapterNumber].firstOpenedAt = new Date().toISOString();
      localStorage.setItem(`${STORAGE_KEY_PROGRESS}-${selectedBook.id}`, JSON.stringify(updated));
      setAllProgress(p => ({ ...p, [selectedBook.id]: updated }));
      if (userId) saveChapterProgress(userId, selectedBook.id, chapterNumber);
      return updated;
    });
  }, [selectedBook, userId]);

  const handleBackToLibrary = () => { setAppState('landing'); setSelectedBook(null); };
  const handleSignOut = () => { setUser(null); setIntake(null); window.location.reload(); };

  // ── Render states ─────────────────────────────────────────────────────
  if (appState === 'loading') {
    return (
      <main className="min-h-screen bg-navy flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 bg-gold rounded flex items-center justify-center text-navy font-bold text-sm" style={{ fontFamily: "'Lora', serif" }}>A</div>
          <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        </div>
      </main>
    );
  }

  if (appState === 'intake') return <IntakeForm onComplete={handleIntakeComplete} />;
  if (appState === 'pace-select' && selectedBook) return <PaceSelector bookTitle={selectedBook.title} onSelect={handlePaceSelect} />;

  if (appState === 'reading' && selectedBook) {
    return (
      <ReaderLayout
        chapters={selectedBook.chapters}
        bookTitle={selectedBook.title}
        intake={intake!}
        progress={progress}
        onChapterOpen={handleChapterOpen}
        isChapterUnlocked={(cn, p) => isChapterUnlocked(cn, p, paceMap[selectedBook.id])}
        getUnlockDate={paceMap[selectedBook.id] === 'free' ? () => null : getUnlockDate}
        onBackToLibrary={handleBackToLibrary}
        user={user}
        onSignOut={handleSignOut}
        pace={paceMap[selectedBook.id]}
        userProfile={userProfile}
      />
    );
  }

  // ── Library ───────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-navy text-white pb-24">
      {/* 1. Top bar: Avatar + Search */}
      <div className="px-4 pt-6 pb-2 flex items-center gap-3 max-w-xl mx-auto sticky top-0 bg-navy/95 backdrop-blur z-20">
        <Link href="/profile" className="flex items-center justify-center w-8 h-8 rounded-full border border-gold bg-navy shrink-0">
          {user && !isAnonymousUser(user) && user.email ? (
            <span className="text-gold font-bold text-xs">{user.email.charAt(0).toUpperCase()}</span>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          )}
        </Link>
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input
            type="text"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setVisibleCount(BOOKS_PER_PAGE); }}
            placeholder="Search books..."
            className="w-full bg-white/10 rounded-md pl-9 pr-4 py-1.5 text-sm text-white placeholder:text-white/40 outline-none focus:bg-white/15 transition-colors"
          />
        </div>
        <div className="shrink-0 flex items-center z-10">
          <UserProfile user={user} onSignOut={handleSignOut} />
        </div>
      </div>

      <div className="max-w-xl mx-auto mt-2">
        {/* Upgrade banner */}
        {intake && user && isAnonymousUser(user) && (
          <div className="px-4 mb-6">
            <div className="rounded-md overflow-hidden"><UpgradeBanner user={user} /></div>
          </div>
        )}

        {!isSearching && (
          <>
            {/* 2. Jump back in */}
            {recentBooks.length > 0 && (
              <div className="px-4 mb-8">
                <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "'Lora', serif" }}>Jump back in</h2>
                <div className="grid grid-cols-2 gap-2">
                  {recentBooks.map(book => (
                    <JumpBackInCard key={book.id} book={book} onSelect={() => handleSelectBook(book)} />
                  ))}
                </div>
              </div>
            )}

            {/* 3. Continue Reading */}
            {startedBooks.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold px-4 mb-4" style={{ fontFamily: "'Lora', serif" }}>Continue Reading</h2>
                <div className="flex overflow-x-auto gap-3 px-4 pb-2 scrollbar-hide snap-x scroll-smooth">
                  {startedBooks.map(book => (
                    <BookCard key={book.id} book={book} progress={allProgress[book.id] || {}} onSelect={() => handleSelectBook(book)} isHorizontal />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* 4. Category pills */}
        <div className="mb-6">
          <div className="flex overflow-x-auto gap-2 px-4 pb-2 scrollbar-hide snap-x scroll-smooth">
            <button
              onClick={() => { setCategoryFilter('All'); setVisibleCount(BOOKS_PER_PAGE); }}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap snap-start transition-colors ${categoryFilter === 'All' ? 'bg-gold text-navy' : 'bg-white/10 text-white'}`}
            >All</button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => { setCategoryFilter(cat); setVisibleCount(BOOKS_PER_PAGE); }}
                className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap snap-start transition-colors ${categoryFilter === cat ? 'bg-gold text-navy' : 'bg-white/10 text-white'}`}
              >{cat}</button>
            ))}
          </div>
        </div>

        {/* 5. All Books Grid */}
        <div className="px-4">
          {!isSearching && <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "'Lora', serif" }}>All Books</h2>}
          {isSearching && <p className="text-xs text-white/40 mb-4">{filteredBooks.length} results</p>}
          
          {visibleBooks.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-white/40 text-sm">No books match your search.</p>
              <button onClick={() => { setSearchQuery(''); setCategoryFilter('All'); }} className="text-xs text-white mt-2 font-medium">Clear filters</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                {visibleBooks.map(book => (
                  <BookCard key={book.id} book={book} progress={allProgress[book.id] || {}} onSelect={() => handleSelectBook(book)} />
                ))}
              </div>

              {hasMore && (
                <div className="text-center mt-8">
                  <button
                    onClick={() => setVisibleCount(v => v + BOOKS_PER_PAGE)}
                    className="text-xs text-white border border-white/20 px-6 py-2 rounded-full font-medium"
                  >
                    Load more
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
