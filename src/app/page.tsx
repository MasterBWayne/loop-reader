'use client';

import { useState, useEffect, useCallback } from 'react';
import { ReaderLayout } from '@/components/ReaderLayout';
import { IntakeForm, type IntakeAnswers } from '@/components/IntakeForm';
import { BOOKS, type Book } from '@/data/books';
import { PaceSelector, type ReadingPace } from '@/components/PaceSelector';
import {
  ensureAnonymousUser,
  getCurrentUser,
  saveIntake,
  loadIntake,
  saveChapterProgress,
  loadChapterProgress,
  isAnonymousUser,
  type ChapterProgressRecord,
} from '@/lib/supabase';
import { UserProfile, UpgradeBanner } from '@/components/UserProfile';

type AppState = 'loading' | 'landing' | 'intake' | 'pace-select' | 'reading';

const STORAGE_KEY_PACE = 'loop-reader-pace';

const STORAGE_KEY_INTAKE = 'loop-reader-intake';
const STORAGE_KEY_PROGRESS = 'loop-reader-progress';

interface ChapterProgress {
  [chapterNumber: number]: {
    unlockedAt: string;
    firstOpenedAt?: string;
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getLocalIntake(): IntakeAnswers | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY_INTAKE);
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
}

function getLocalProgress(bookId: string): ChapterProgress {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PROGRESS}-${bookId}`);
    return stored ? JSON.parse(stored) : {};
  } catch { return {}; }
}

function supabaseProgressToLocal(records: ChapterProgressRecord[]): ChapterProgress {
  const result: ChapterProgress = {};
  for (const r of records) {
    result[r.chapter_number] = {
      unlockedAt: r.unlocked_at,
      firstOpenedAt: r.first_opened_at || undefined,
    };
  }
  return result;
}

function isChapterUnlocked(chapterNumber: number, progress: ChapterProgress, pace?: ReadingPace): boolean {
  if (pace === 'free') return true;
  if (chapterNumber === 1) return true;
  const prevChapter = progress[chapterNumber - 1];
  if (!prevChapter?.firstOpenedAt) return false;
  const openedAt = new Date(prevChapter.firstOpenedAt);
  const unlockTime = new Date(openedAt.getTime() + 24 * 60 * 60 * 1000);
  return new Date() >= unlockTime;
}

function getUnlockDate(chapterNumber: number, progress: ChapterProgress): Date | null {
  if (chapterNumber === 1) return null;
  const prevChapter = progress[chapterNumber - 1];
  if (!prevChapter?.firstOpenedAt) return null;
  return new Date(new Date(prevChapter.firstOpenedAt).getTime() + 24 * 60 * 60 * 1000);
}

// ── Book Card ──────────────────────────────────────────────────────────────

function BookCard({ book, progress, onSelect }: { book: Book; progress: ChapterProgress; onSelect: () => void }) {
  const chaptersRead = Object.keys(progress).length;
  return (
    <button
      onClick={onSelect}
      className="group w-full text-left bg-white/5 hover:bg-white/8 border border-white/10 hover:border-gold/30 rounded-2xl p-6 transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <span className="text-[10px] text-gold/60 font-semibold tracking-[0.15em] uppercase">{book.subtitle}</span>
        {chaptersRead > 0 && (
          <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full">{chaptersRead}/{book.chapters.length} read</span>
        )}
      </div>
      <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-gold transition-colors" style={{ fontFamily: "'Lora', serif" }}>{book.title}</h2>
      <p className="text-sm text-white/50 leading-relaxed mb-4">{book.description}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/30">{book.chapters.length} chapters &middot; {book.readTime}</span>
        <span className="text-xs text-gold/70 font-medium group-hover:text-gold transition-colors flex items-center gap-1">
          {chaptersRead > 0 ? 'Continue' : 'Start reading'}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
        </span>
      </div>
    </button>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────

export default function Home() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [intake, setIntake] = useState<IntakeAnswers | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [progress, setProgress] = useState<ChapterProgress>({});
  const [allProgress, setAllProgress] = useState<Record<string, ChapterProgress>>({});
  const [paceMap, setPaceMap] = useState<Record<string, ReadingPace>>({});

  // ── Init: auth + load data ────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      // 1. Get or create anonymous user
      const uid = await ensureAnonymousUser();
      setUserId(uid);
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      // 2. Try to load intake from Supabase
      let loadedIntake: IntakeAnswers | null = null;
      if (uid) {
        loadedIntake = await loadIntake(uid);
      }

      // 3. Fallback to localStorage
      if (!loadedIntake) {
        loadedIntake = getLocalIntake();
      }

      if (loadedIntake) {
        setIntake(loadedIntake);
        // Also save to localStorage for offline fallback
        localStorage.setItem(STORAGE_KEY_INTAKE, JSON.stringify(loadedIntake));
      }

      // 4. Load chapter progress from Supabase for all books
      const progressMap: Record<string, ChapterProgress> = {};
      if (uid) {
        const records = await loadChapterProgress(uid);
        if (records.length > 0) {
          // For now all progress is stored without book_id distinction
          // so we load it once and share across books
          const converted = supabaseProgressToLocal(records);
          for (const book of BOOKS) {
            progressMap[book.id] = converted;
            localStorage.setItem(`${STORAGE_KEY_PROGRESS}-${book.id}`, JSON.stringify(converted));
          }
        }
      }

      // Fallback: load from localStorage for each book
      for (const book of BOOKS) {
        if (!progressMap[book.id] || Object.keys(progressMap[book.id]).length === 0) {
          progressMap[book.id] = getLocalProgress(book.id);
        }
      }
      setAllProgress(progressMap);

      // Load pace preferences
      try {
        const storedPace = localStorage.getItem(STORAGE_KEY_PACE);
        if (storedPace) setPaceMap(JSON.parse(storedPace));
      } catch {}

      setAppState('landing');
    }

    init();
  }, []);

  // ── Intake complete ───────────────────────────────────────────────────
  const handleIntakeComplete = useCallback(async (answers: IntakeAnswers) => {
    setIntake(answers);
    localStorage.setItem(STORAGE_KEY_INTAKE, JSON.stringify(answers));

    // Save to Supabase (non-blocking)
    if (userId) {
      saveIntake(userId, answers);
    }

    if (selectedBook) {
      // Show pace selector before reading
      setAppState('pace-select');
    }
  }, [userId, selectedBook]);

  // ── Select book ───────────────────────────────────────────────────────
  const handleSelectBook = useCallback((book: Book) => {
    setSelectedBook(book);
    const bookProgress = allProgress[book.id] || {};
    setProgress(bookProgress);

    if (!intake) {
      setAppState('intake');
      return;
    }

    // If no pace chosen for this book yet, show pace selector
    if (!paceMap[book.id]) {
      setAppState('pace-select');
      return;
    }

    // Start reading
    if (Object.keys(bookProgress).length === 0) {
      const initialProgress: ChapterProgress = {
        1: { unlockedAt: new Date().toISOString(), firstOpenedAt: new Date().toISOString() },
      };
      setProgress(initialProgress);
      localStorage.setItem(`${STORAGE_KEY_PROGRESS}-${book.id}`, JSON.stringify(initialProgress));
      setAllProgress(prev => ({ ...prev, [book.id]: initialProgress }));
      if (userId) saveChapterProgress(userId, book.id, 1);
    }
    setAppState('reading');
  }, [intake, allProgress, userId, paceMap]);

  const handlePaceSelect = useCallback((pace: ReadingPace) => {
    if (!selectedBook) return;
    const updated = { ...paceMap, [selectedBook.id]: pace };
    setPaceMap(updated);
    localStorage.setItem(STORAGE_KEY_PACE, JSON.stringify(updated));

    // Initialize chapter 1
    const bookProgress = allProgress[selectedBook.id] || {};
    if (Object.keys(bookProgress).length === 0) {
      const initialProgress: ChapterProgress = {
        1: { unlockedAt: new Date().toISOString(), firstOpenedAt: new Date().toISOString() },
      };
      setProgress(initialProgress);
      localStorage.setItem(`${STORAGE_KEY_PROGRESS}-${selectedBook.id}`, JSON.stringify(initialProgress));
      setAllProgress(prev => ({ ...prev, [selectedBook.id]: initialProgress }));
      if (userId) saveChapterProgress(userId, selectedBook.id, 1);
    }

    setAppState('reading');
  }, [selectedBook, paceMap, allProgress, userId]);

  // ── Chapter open ──────────────────────────────────────────────────────
  const handleChapterOpen = useCallback((chapterNumber: number) => {
    if (!selectedBook) return;
    setProgress(prev => {
      const updated = { ...prev };
      if (!updated[chapterNumber]) {
        updated[chapterNumber] = { unlockedAt: new Date().toISOString() };
      }
      if (!updated[chapterNumber].firstOpenedAt) {
        updated[chapterNumber].firstOpenedAt = new Date().toISOString();
      }
      localStorage.setItem(`${STORAGE_KEY_PROGRESS}-${selectedBook.id}`, JSON.stringify(updated));
      setAllProgress(p => ({ ...p, [selectedBook.id]: updated }));

      // Save to Supabase (non-blocking)
      if (userId) {
        saveChapterProgress(userId, selectedBook.id, chapterNumber);
      }

      return updated;
    });
  }, [selectedBook, userId]);

  const handleBackToLibrary = () => {
    setAppState('landing');
    setSelectedBook(null);
  };

  // ── Loading state ─────────────────────────────────────────────────────
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

  if (appState === 'intake') {
    return <IntakeForm onComplete={handleIntakeComplete} />;
  }

  if (appState === 'pace-select' && selectedBook) {
    return <PaceSelector bookTitle={selectedBook.title} onSelect={handlePaceSelect} />;
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
        onSignOut={() => { setUser(null); setIntake(null); window.location.reload(); }}
        pace={paceMap[selectedBook.id]}
      />
    );
  }

  // ── Landing / Library ─────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-navy text-white">
      <nav className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gold rounded flex items-center justify-center text-navy font-bold text-sm" style={{ fontFamily: "'Lora', serif" }}>A</div>
          <span className="text-sm font-medium tracking-wide text-white/80">THE ARCHITECT METHOD</span>
        </div>
        <UserProfile user={user} onSignOut={() => { setUser(null); setIntake(null); window.location.reload(); }} />
      </nav>

      <div className="max-w-3xl mx-auto px-6 pt-16 pb-12 text-center">
        <p className="text-gold text-xs font-semibold tracking-[0.2em] uppercase mb-6">The Architect Method</p>
        <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4" style={{ fontFamily: "'Lora', serif" }}>Your Library</h1>
        <p className="text-base text-white/50 max-w-md mx-auto leading-relaxed">
          Each book is a different lens on the same truth. Read them in any order. The AI companion adapts to you.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-6 pb-24">
        {/* Upgrade banner for anonymous users who completed intake */}
        {intake && user && isAnonymousUser(user) && (
          <div className="mb-6 rounded-xl overflow-hidden">
            <UpgradeBanner user={user} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {BOOKS.map(book => (
            <BookCard
              key={book.id}
              book={book}
              progress={allProgress[book.id] || {}}
              onSelect={() => handleSelectBook(book)}
            />
          ))}
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: '\uD83D\uDCD6', title: 'Read at your pace', desc: 'One chapter unlocks per day. Deep absorption over speed.' },
            { icon: '\uD83E\uDD16', title: 'AI companion', desc: 'Ask questions, get personalized insights for each book.' },
            { icon: '\uD83D\uDD04', title: 'Personalized to you', desc: 'The AI adapts to your specific situation across all books.' },
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
