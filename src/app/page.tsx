'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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

function BookCard({ book, progress, onSelect }: { book: Book; progress: ChapterProgress; onSelect: () => void }) {
  const chaptersRead = Object.keys(progress).length;
  return (
    <button onClick={onSelect} className="group w-full text-left rounded-2xl overflow-hidden border border-white/10 hover:border-gold/30 transition-all duration-300 bg-white/[0.03] hover:bg-white/[0.06]">
      {/* Cover placeholder */}
      <div className={`h-36 bg-gradient-to-br ${book.coverColor} relative flex items-end p-4`}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10">
          <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">{book.category}</span>
          <h3 className="text-lg font-bold text-white leading-tight" style={{ fontFamily: "'Lora', serif" }}>{book.title}</h3>
          <p className="text-[11px] text-white/50 mt-0.5">by {book.author}</p>
        </div>
      </div>
      <div className="p-4">
        <p className="text-xs text-white/40 leading-relaxed line-clamp-2 mb-3">{book.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/25">{book.chapters.length} ch &middot; {book.readTime}</span>
            {chaptersRead > 0 && (
              <span className="text-[10px] text-gold/50 bg-gold/10 px-1.5 py-0.5 rounded">{chaptersRead}/{book.chapters.length}</span>
            )}
          </div>
          <span className="text-[11px] text-gold/70 font-medium group-hover:text-gold transition-colors">
            {chaptersRead > 0 ? 'Continue \u2192' : 'Read \u2192'}
          </span>
        </div>
      </div>
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
              // Clean URL
              window.history.replaceState({}, '', '/');
              return;
            }
          }
        }
      }

      setAppState('landing');

      // Listen for auth state changes (login/logout) and reload data
      const { data: { subscription } } = (await import('@/lib/supabase')).supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          setUserId(session.user.id);
          // Reload intake for new user
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

    // Search
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

    // Category filter
    if (categoryFilter !== 'All') {
      books = books.filter(b => b.category === categoryFilter);
    }

    // Sort
    switch (sortBy) {
      case 'az': books.sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'newest': books.sort((a, b) => b.bookNumber - a.bookNumber); break;
      case 'featured': books.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)); break;
    }

    return books;
  }, [searchQuery, categoryFilter, sortBy]);

  const featuredBooks = useMemo(() => BOOKS.filter(b => b.featured), []);
  const visibleBooks = filteredBooks.slice(0, visibleCount);
  const hasMore = visibleCount < filteredBooks.length;

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
    // Save reading bookmark for resume
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
  const isSearching = searchQuery.trim() || categoryFilter !== 'All';

  return (
    <main className="min-h-screen bg-navy text-white">
      {/* Nav */}
      <nav className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gold rounded flex items-center justify-center text-navy font-bold text-sm" style={{ fontFamily: "'Lora', serif" }}>A</div>
          <span className="text-sm font-medium tracking-wide text-white/80">THE ARCHITECT METHOD</span>
        </div>
        <div className="flex items-center gap-3">
          {intake && (
            <a href="/profile" className="text-[11px] text-white/30 hover:text-gold transition-colors hidden sm:block">
              Edit Profile
            </a>
          )}
          <UserProfile user={user} onSignOut={handleSignOut} />
        </div>
      </nav>

      {/* Upgrade banner */}
      {intake && user && isAnonymousUser(user) && (
        <div className="max-w-6xl mx-auto px-6 mb-4">
          <div className="rounded-xl overflow-hidden"><UpgradeBanner user={user} /></div>
        </div>
      )}

      {/* Header */}
      <div className="max-w-6xl mx-auto px-6 pt-8 pb-6">
        <p className="text-gold text-xs font-semibold tracking-[0.2em] uppercase mb-3">The Architect Method</p>
        <h1 className="text-3xl font-bold leading-tight mb-2" style={{ fontFamily: "'Lora', serif" }}>Library</h1>
        <p className="text-sm text-white/40 max-w-lg">Each book is a different lens on the same truth. The AI companion adapts to you across every book.</p>
      </div>

      {/* Featured (only when not searching) */}
      {!isSearching && featuredBooks.length > 0 && (
        <div className="max-w-6xl mx-auto px-6 mb-8">
          <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">Featured</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featuredBooks.map(book => (
              <button key={book.id} onClick={() => handleSelectBook(book)} className="group relative overflow-hidden rounded-2xl border border-white/10 hover:border-gold/30 transition-all">
                <div className={`h-44 bg-gradient-to-br ${book.coverColor} p-6 flex flex-col justify-end relative`}>
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
                  <div className="relative z-10">
                    <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">{book.category}</span>
                    <h3 className="text-2xl font-bold text-white leading-tight" style={{ fontFamily: "'Lora', serif" }}>{book.title}</h3>
                    <p className="text-xs text-white/50 mt-1">by {book.author} &middot; {book.chapters.length} chapters</p>
                    <p className="text-xs text-white/40 mt-2 line-clamp-1">{book.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search + Filters */}
      <div className="max-w-6xl mx-auto px-6 mb-6">
        {/* Search bar */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setVisibleCount(BOOKS_PER_PAGE); }}
              placeholder="Search by title, author, or topic..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white/90 placeholder:text-white/25 outline-none focus:border-gold/40 transition-colors"
            />
          </div>
          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white/60 outline-none focus:border-gold/40 appearance-none cursor-pointer"
          >
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="az">A-Z</option>
          </select>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setCategoryFilter('All'); setVisibleCount(BOOKS_PER_PAGE); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${categoryFilter === 'All' ? 'bg-gold/20 text-gold border border-gold/30' : 'bg-white/5 text-white/40 border border-white/10 hover:border-white/20'}`}
          >All</button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => { setCategoryFilter(cat); setVisibleCount(BOOKS_PER_PAGE); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${categoryFilter === cat ? 'bg-gold/20 text-gold border border-gold/30' : 'bg-white/5 text-white/40 border border-white/10 hover:border-white/20'}`}
            >{cat}</button>
          ))}
        </div>
      </div>

      {/* Book grid */}
      <div className="max-w-6xl mx-auto px-6 pb-12">
        {isSearching && (
          <p className="text-xs text-white/30 mb-4">{filteredBooks.length} book{filteredBooks.length !== 1 ? 's' : ''} found</p>
        )}

        {visibleBooks.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-white/30 text-sm">No books match your search.</p>
            <button onClick={() => { setSearchQuery(''); setCategoryFilter('All'); }} className="text-xs text-gold/60 hover:text-gold mt-2 transition-colors">Clear filters</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleBooks.map(book => (
                <BookCard key={book.id} book={book} progress={allProgress[book.id] || {}} onSelect={() => handleSelectBook(book)} />
              ))}
            </div>

            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setVisibleCount(v => v + BOOKS_PER_PAGE)}
                  className="text-xs text-gold/60 hover:text-gold border border-gold/20 hover:border-gold/40 px-6 py-2 rounded-lg transition-colors"
                >
                  Show more
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Features footer */}
      <div className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: '\uD83D\uDCD6', title: 'Read at your pace', desc: 'Choose guided (1/day) or free reading for each book.' },
            { icon: '\uD83E\uDD16', title: 'AI companion', desc: 'Ask questions, get personalized insights for each book.' },
            { icon: '\uD83D\uDD04', title: 'Knows you deeply', desc: 'Your profile makes every book more relevant over time.' },
          ].map((f, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="text-xl mb-2">{f.icon}</div>
              <h3 className="font-semibold text-xs mb-1">{f.title}</h3>
              <p className="text-[11px] text-white/50 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
