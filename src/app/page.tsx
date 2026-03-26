'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { ReaderLayout } from '@/components/ReaderLayout';
import { IntakeForm, type IntakeAnswers } from '@/components/IntakeForm';
import { BOOKS, CATEGORIES, type Book, type BookCategory } from '@/data/books';
import { PaceSelector, type ReadingPace } from '@/components/PaceSelector';
import { BOOK_COVERS } from '@/data/covers';
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
import { ReadingStreak } from '@/components/ReadingStreak';
import { useSoulGraph } from '@/lib/SoulGraphProvider';
import { trackBookStarted, trackChapterCompleted } from '@/lib/soulGraph';
import { useBookCovers } from '@/hooks/useBookCovers';

type AppState = 'loading' | 'landing' | 'intake' | 'pace-select' | 'reading' | 'purchase';
type SortOption = 'featured' | 'newest' | 'az';

const STORAGE_KEY_INTAKE = 'loop-reader-intake';
const STORAGE_KEY_PROGRESS = 'loop-reader-progress';
const STORAGE_KEY_PACE = 'loop-reader-pace';
const BOOKS_PER_PAGE = 15;

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

function BookCard({ book, progress, onSelect, isHorizontal = false, googleCoverUrl }: { book: Book; progress: ChapterProgress; onSelect: () => void, isHorizontal?: boolean, googleCoverUrl?: string }) {
  const chaptersRead = Object.keys(progress).length;
  const contentChapters = book.chapters.filter(c => c.content && !c.content.startsWith('Coming soon'));
  const total = contentChapters.length > 0 ? contentChapters.length : book.chapters.length;
  const percent = total > 0 ? Math.min(100, Math.round((chaptersRead / total) * 100)) : 0;
  
  const coverBg = BOOK_COVERS[book.id] || book.coverColor;
  const isCssValue = coverBg?.startsWith('linear-gradient') || coverBg?.startsWith('radial-gradient') || coverBg?.startsWith('#');
  const coverUrl = googleCoverUrl || book.coverImage;

  return (
    <button onClick={onSelect} className={`flex flex-col gap-1 text-left group shrink-0 ${isHorizontal ? 'w-28 snap-start' : 'w-full'}`}>
      <div className="aspect-square w-full rounded-md relative overflow-hidden shadow-md shadow-black/40"
           style={!coverUrl && isCssValue ? { background: coverBg } : undefined}>
        {coverUrl ? (
          <img src={coverUrl} alt={book.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        ) : (
          !isCssValue && <div className={`absolute inset-0 bg-gradient-to-br ${coverBg}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
        <div className="absolute inset-0 group-hover:bg-white/5 transition-colors" />
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <h3 className="text-white font-bold leading-tight line-clamp-2 text-[11px] drop-shadow-lg" style={{ fontFamily: "'Lora', serif" }}>
            {book.title}
          </h3>
        </div>
        {chaptersRead > 0 && (
          <div className="absolute bottom-0 left-0 h-[2px] w-full bg-black/30">
            <div className="h-full bg-gold rounded-r-full" style={{ width: `${percent}%` }} />
          </div>
        )}
      </div>
      <div className="px-0.5">
        <p className="text-[10px] text-muted truncate">{book.author}</p>
      </div>
    </button>
  );
}

function JumpBackInCard({ book, onSelect, googleCoverUrl }: { book: Book; onSelect: () => void; googleCoverUrl?: string }) {
  const coverBg = BOOK_COVERS[book.id] || book.coverColor;
  const isCssValue = coverBg?.startsWith('linear-gradient') || coverBg?.startsWith('radial-gradient') || coverBg?.startsWith('#');
  const coverUrl = googleCoverUrl || book.coverImage;
  return (
    <button onClick={onSelect} className="flex items-center gap-2.5 bg-warm-gray hover:bg-navy-light rounded-lg overflow-hidden transition-colors text-left w-full h-14 pr-3 group">
      <div className="w-14 h-14 shrink-0 opacity-90 group-hover:opacity-100 transition-opacity relative"
           style={!coverUrl && isCssValue ? { background: coverBg } : undefined}>
        {coverUrl ? (
          <img src={coverUrl} alt={book.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          !isCssValue && <div className={`w-full h-full bg-gradient-to-br ${coverBg}`} />
        )}
      </div>
      <span className="font-semibold text-[13px] text-ink leading-tight line-clamp-2" style={{ fontFamily: "'Lora', serif" }}>{book.title}</span>
    </button>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────

export default function Home() {
  const { sgUserId, track } = useSoulGraph();
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

  const [supabaseBooks, setSupabaseBooks] = useState<Book[]>([]);

  // ── Google Books covers (legal cover images) ─────────────────────────
  const allBooksForCovers = useMemo(() => [...BOOKS, ...supabaseBooks], [supabaseBooks]);
  const googleCovers = useBookCovers(allBooksForCovers);

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
        console.log('Intake loaded from Supabase:', loadedIntake);
        const profile = await loadUserProfile(uid);
        if (profile) setUserProfile(profile);
      }
      if (!loadedIntake) {
        loadedIntake = getLocalIntake();
        console.log('Intake loaded from localStorage fallback:', loadedIntake);
      }
      if (loadedIntake) {
        setIntake(loadedIntake);
        localStorage.setItem(STORAGE_KEY_INTAKE, JSON.stringify(loadedIntake));
      }

      let fetchedSupabaseBooks: Book[] = [];
      try {
        const { supabase } = await import('@/lib/supabase');
        const { data: dbBooks } = await supabase
          .from('books')
          .select('*, book_chapters(chapter_number, title, content, exercise_question)')
          .eq('status', 'live')
          .eq('is_author_upload', true);
          
        if (dbBooks && dbBooks.length > 0) {
          fetchedSupabaseBooks = dbBooks.map((db: any) => ({
            id: db.id,
            title: db.title,
            subtitle: db.subtitle || '',
            author: db.author,
            bookNumber: 1000, 
            description: db.description || '',
            readTime: '2-3 hours',
            category: (db.category as BookCategory) || 'Self-Help',
            tags: [],
            featured: false,
            coverColor: db.cover_color || 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
            price: db.price,
            is_author_upload: true,
            chapters: (db.book_chapters || []).sort((a: any, b: any) => a.chapter_number - b.chapter_number).map((ch: any) => ({
              number: ch.chapter_number,
              title: ch.title,
              content: ch.content,
              exerciseQuestion: ch.exercise_question
            }))
          }));
          setSupabaseBooks(fetchedSupabaseBooks);
        }
      } catch (err) {
        console.error('Failed to fetch author books:', err);
      }

      const allCombinedBooks = [...BOOKS, ...fetchedSupabaseBooks];

      const progressMap: Record<string, ChapterProgress> = {};
      if (uid) {
        const records = await loadChapterProgress(uid);
        if (records.length > 0) {
          const converted = supabaseProgressToLocal(records);
          for (const book of allCombinedBooks) {
            progressMap[book.id] = converted;
            localStorage.setItem(`${STORAGE_KEY_PROGRESS}-${book.id}`, JSON.stringify(converted));
          }
        }
      }
      for (const book of allCombinedBooks) {
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
          const book = allCombinedBooks.find(b => b.id === lastBookId);
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

      if (!loadedIntake) {
        const skipped = localStorage.getItem('rk_intake_skipped');
        if (skipped) {
          console.log('Intake skipped previously. Going to library.');
          setAppState('landing');
        } else {
          console.log('No intake found in DB or localStorage. Showing intake form.');
          setAppState('intake');
        }
      } else {
        console.log('Intake found, proceeding to landing.');
        setAppState('landing');
      }

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
    let books = [...BOOKS, ...supabaseBooks];
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
    localStorage.removeItem('rk_intake_skipped');
    if (userId) saveIntake(userId, answers);
    if (selectedBook) {
      setAppState('pace-select');
    } else {
      setAppState('landing');
    }
  }, [userId, selectedBook]);

  const handleIntakeSkip = useCallback(() => {
    localStorage.setItem('rk_intake_skipped', 'true');
    setAppState('landing');
  }, []);

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
    if (book.price && book.price > 0 && book.is_author_upload && book.author !== userProfile?.display_name) {
      setAppState('purchase');
      return;
    }
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
      // Soul Graph: track book started
      if (sgUserId) {
        trackBookStarted(sgUserId, {
          book_id: book.id,
          book_title: book.title,
          category: book.category,
        });
      }
    }
    setAppState('reading');
  }, [intake, allProgress, userId, paceMap, userProfile, sgUserId]);

  const handleChapterOpen = useCallback((chapterNumber: number) => {
    if (!selectedBook) return;
    try {
      localStorage.setItem('loop-reader-last-book', selectedBook.id);
      localStorage.setItem('loop-reader-last-chapter', String(chapterNumber));
    } catch {}
    setProgress(prev => {
      const updated = { ...prev };
      const isNew = !updated[chapterNumber];
      if (!updated[chapterNumber]) updated[chapterNumber] = { unlockedAt: new Date().toISOString() };
      if (!updated[chapterNumber].firstOpenedAt) updated[chapterNumber].firstOpenedAt = new Date().toISOString();
      localStorage.setItem(`${STORAGE_KEY_PROGRESS}-${selectedBook.id}`, JSON.stringify(updated));
      setAllProgress(p => ({ ...p, [selectedBook.id]: updated }));
      if (userId) saveChapterProgress(userId, selectedBook.id, chapterNumber);
      // Soul Graph: track chapter completion (only first open counts)
      if (isNew && sgUserId) {
        const ch = selectedBook.chapters.find(c => c.number === chapterNumber);
        trackChapterCompleted(sgUserId, {
          book_id: selectedBook.id,
          book_title: selectedBook.title,
          chapter_number: chapterNumber,
          chapter_title: ch?.title || `Chapter ${chapterNumber}`,
        });
      }
      return updated;
    });
  }, [selectedBook, userId, sgUserId]);

  const handleBackToLibrary = () => { setAppState('landing'); setSelectedBook(null); };
  const handleSignOut = () => { setUser(null); setIntake(null); window.location.reload(); };

  // ── Render states ─────────────────────────────────────────────────────
  if (appState === 'loading') {
    return (
      <main className="min-h-screen bg-navy flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 bg-gold rounded flex items-center justify-center text-white font-bold text-sm" style={{ fontFamily: "'Lora', serif" }}>A</div>
          <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        </div>
      </main>
    );
  }

  if (appState === 'intake') return <IntakeForm onComplete={handleIntakeComplete} onSkip={handleIntakeSkip} />;
  if (appState === 'pace-select' && selectedBook) return <PaceSelector bookTitle={selectedBook.title} onSelect={handlePaceSelect} />;

  if (appState === 'purchase' && selectedBook) {
    return (
      <main className="min-h-screen bg-navy flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-navy-light border border-ink/10 rounded-2xl p-8 text-center relative overflow-hidden">
          <button onClick={() => setAppState('landing')} className="absolute top-4 right-4 text-ink/40 hover:text-ink/80 p-2"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
          
          <div className="w-20 h-28 mx-auto mb-6 rounded shadow-lg flex items-end justify-center pb-4 relative" style={{ background: BOOK_COVERS[selectedBook.id] || selectedBook.coverColor }}>
             <h3 className="relative z-10 text-white font-bold leading-tight line-clamp-2 text-[10px] text-center px-2 drop-shadow-md" style={{ fontFamily: "'Lora', serif" }}>{selectedBook.title}</h3>
          </div>
          
          <h2 className="text-2xl font-bold text-ink mb-2" style={{ fontFamily: "'Lora', serif" }}>{selectedBook.title}</h2>
          <p className="text-sm text-ink/50 mb-1">By {selectedBook.author}</p>
          <p className="text-[11px] text-gold/80 uppercase tracking-wider font-semibold mb-6">Companion Experience</p>
          
          <p className="text-ink/80 text-sm leading-relaxed mb-8 bg-ink/5 p-4 rounded-xl text-left">
            Unlock the full book along with its AI-generated companion experience, featuring chapter summaries, reflection exercises, and core lessons.
          </p>
          
          <a
            href="https://gumroad.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full bg-gold hover:bg-gold-light text-white font-semibold px-6 py-4 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
          >
            Buy Now for ${(selectedBook.price! / 100).toFixed(2)}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
        </div>
      </main>
    );
  }

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
        coverColor={selectedBook.coverColor}
      />
    );
  }

  // ── Library ───────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-navy text-ink pb-24">
      {/* 1. Top bar: Avatar + Search */}
      <div className="px-4 pt-6 pb-2 flex items-center gap-3 max-w-xl mx-auto sticky top-0 bg-navy/95 backdrop-blur z-20">
        <Link href="/profile" className="flex items-center justify-center w-8 h-8 rounded-full border border-gold bg-navy shrink-0">
          {user && !isAnonymousUser(user) && user.email ? (
            <span className="text-gold font-bold text-xs">{user.email.charAt(0).toUpperCase()}</span>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C97D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          )}
        </Link>
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input
            type="text"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setVisibleCount(BOOKS_PER_PAGE); }}
            placeholder="Search books..."
            className="w-full bg-ink/10 rounded-md pl-9 pr-4 py-1.5 text-sm text-ink placeholder:text-muted/40 outline-none focus:bg-ink/15 transition-colors"
          />
        </div>
        <div className="shrink-0 flex items-center z-10">
          <UserProfile user={user} onSignOut={handleSignOut} />
        </div>
      </div>

      <div className="max-w-xl mx-auto mt-2">
        {/* Reading streak badge */}
        {userId && (
          <div className="px-4 mb-4">
            <ReadingStreak userId={userId} />
          </div>
        )}

        {/* Upgrade banner */}
        {intake && user && isAnonymousUser(user) && (
          <div className="px-4 mb-6">
            <div className="rounded-md overflow-hidden"><UpgradeBanner user={user} /></div>
          </div>
        )}

        {/* Intake skipped nudge */}
        {!intake && (
          <div className="px-4 mb-6">
            <div className="flex items-center justify-between bg-ink/5 border border-ink/10 rounded-lg px-4 py-3">
              <p className="text-xs text-ink/50">Complete your reading profile for personalized recommendations</p>
              <button
                onClick={() => setAppState('intake')}
                className="text-xs text-gold font-medium whitespace-nowrap ml-3 hover:text-gold-light transition-colors"
              >
                Set up now &rarr;
              </button>
            </div>
          </div>
        )}

        {!isSearching && (
          <>
            {/* 2. Jump back in */}
            {recentBooks.length > 0 && (
              <div className="px-4 mb-8">
                <h2 className="text-lg font-bold mb-3" style={{ fontFamily: "'Lora', serif" }}>Jump back in</h2>
                <div className="grid grid-cols-2 gap-2.5">
                  {recentBooks.map(book => (
                    <JumpBackInCard key={book.id} book={book} onSelect={() => handleSelectBook(book)} googleCoverUrl={googleCovers.get(book.id)} />
                  ))}
                </div>
              </div>
            )}

            {/* 3. Continue Reading */}
            {startedBooks.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold px-4 mb-3" style={{ fontFamily: "'Lora', serif" }}>Continue Reading</h2>
                <div className="flex overflow-x-auto gap-3 px-4 pb-2 scrollbar-hide snap-x scroll-smooth">
                  {startedBooks.map(book => (
                    <BookCard key={book.id} book={book} progress={allProgress[book.id] || {}} onSelect={() => handleSelectBook(book)} isHorizontal googleCoverUrl={googleCovers.get(book.id)} />
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
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap snap-start transition-colors ${categoryFilter === 'All' ? 'bg-gold text-white' : 'bg-navy-light text-ink'}`}
            >All</button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => { setCategoryFilter(cat); setVisibleCount(BOOKS_PER_PAGE); }}
                className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap snap-start transition-colors ${categoryFilter === cat ? 'bg-gold text-white' : 'bg-navy-light text-ink'}`}
              >{cat}</button>
            ))}
          </div>
        </div>

        {/* 5. All Books Grid */}
        <div className="px-4">
          {!isSearching && <h2 className="text-lg font-bold mb-3" style={{ fontFamily: "'Lora', serif" }}>All Books</h2>}
          {isSearching && <p className="text-xs text-ink/40 mb-4">{filteredBooks.length} results</p>}
          
          {visibleBooks.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-ink/40 text-sm">No books match your search.</p>
              <button onClick={() => { setSearchQuery(''); setCategoryFilter('All'); }} className="text-xs text-gold mt-2 font-medium">Clear filters</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2.5">
                {visibleBooks.map(book => (
                  <BookCard key={book.id} book={book} progress={allProgress[book.id] || {}} onSelect={() => handleSelectBook(book)} googleCoverUrl={googleCovers.get(book.id)} />
                ))}
              </div>

              {hasMore && (
                <div className="text-center mt-8">
                  <button
                    onClick={() => setVisibleCount(v => v + BOOKS_PER_PAGE)}
                    className="text-xs text-ink border border-ink/20 px-6 py-2 rounded-full font-medium"
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
