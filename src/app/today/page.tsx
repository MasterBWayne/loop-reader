'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  getCurrentUser, 
  loadUserProfile, 
  isAnonymousUser, 
  loadPendingCommitments, 
  hasCheckedInThisWeek, 
  loadChapterProgress, 
  saveMaintenanceCheckin,
  getReadingStreak,
  getDueReviewCards,
  updateReviewCard,
  getReviewStats,
  type UserProfileData,
  type CommitmentRecord,
  type ReviewCard,
} from '@/lib/supabase';
import { BOOKS, type Book } from '@/data/books';
import { MaintenanceCard } from '@/components/MaintenanceCard';

export default function TodayPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [lastBook, setLastBook] = useState<Book | null>(null);
  const [commitments, setCommitments] = useState<CommitmentRecord[]>([]);
  const [maintenance, setMaintenance] = useState<{ book: Book; chapterIdx: number } | null>(null);
  const [loading, setLoading] = useState(true);

  // Streak
  const [streak, setStreak] = useState(0);
  const [readToday, setReadToday] = useState(false);

  // Review cards
  const [dueCards, setDueCards] = useState<ReviewCard[]>([]);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [cardAnimating, setCardAnimating] = useState(false);
  const [reviewStats, setReviewStats] = useState({ total: 0, due: 0, mastered: 0 });
  const [reviewComplete, setReviewComplete] = useState(false);

  // Progress
  const [chaptersRead, setChaptersRead] = useState(0);
  const [booksStarted, setBooksStarted] = useState(0);

  useEffect(() => {
    async function init() {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
      let uid = currentUser?.id;
      if (uid) {
        const [p, streakData, cards, stats, comms] = await Promise.all([
          loadUserProfile(uid),
          getReadingStreak(uid),
          getDueReviewCards(uid, 10),
          getReviewStats(uid),
          loadPendingCommitments(uid).catch(() => []),
        ]);

        if (p) setProfile(p);
        setStreak(streakData.streakCount);
        setDueCards(cards);
        setReviewStats(stats);
        setCommitments(comms || []);

        // Check if read today
        if (streakData.lastReadDate) {
          const today = new Date().toISOString().split('T')[0];
          setReadToday(streakData.lastReadDate === today);
        }

        // Chapter progress
        try {
          const progressRecords = await loadChapterProgress(uid);
          const bookProgress = progressRecords || [];
          setChaptersRead(bookProgress.length);
          const bookIds = new Set(bookProgress.map((r: any) => r.book_id));
          setBooksStarted(bookIds.size);

          // Find maintenance book
          for (const book of BOOKS) {
            const contentChapters = book.chapters.filter(c => c.content && !c.content.startsWith('Coming soon'));
            const isComplete = contentChapters.length > 0 && bookProgress.filter((r: any) => r.book_id === book.id).length >= contentChapters.length;
            if (!isComplete) continue;
            const checkedIn = await hasCheckedInThisWeek(uid, book.id);
            if (checkedIn) continue;
            const weekNum = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
            const chapterIdx = weekNum % contentChapters.length;
            setMaintenance({ book, chapterIdx });
            break;
          }
        } catch {}
      }

      try {
        const lastBookId = localStorage.getItem('loop-reader-last-book');
        if (lastBookId) {
          const b = BOOKS.find(x => x.id === lastBookId);
          if (b) setLastBook(b);
        } else {
          setLastBook(BOOKS[0]);
        }
      } catch {}

      setLoading(false);
    }
    init();
  }, []);

  const handleCardResponse = useCallback(async (remembered: boolean) => {
    const card = dueCards[currentCardIdx];
    if (!card?.id) return;

    setCardAnimating(true);
    await updateReviewCard(card.id, remembered);

    setTimeout(() => {
      if (currentCardIdx < dueCards.length - 1) {
        setCurrentCardIdx(prev => prev + 1);
        setShowAnswer(false);
      } else {
        setReviewComplete(true);
      }
      setCardAnimating(false);
    }, 300);
  }, [dueCards, currentCardIdx]);

  const displayName = profile?.display_name || (user && !isAnonymousUser(user) && user.email ? user.email.split('@')[0] : '');

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Daily tasks completed count
  const dailyTasks = [
    readToday,
    reviewComplete || dueCards.length === 0,
    commitments.length === 0,
  ];
  const tasksComplete = dailyTasks.filter(Boolean).length;
  const totalTasks = dailyTasks.length;

  if (loading) {
    return (
      <main className="min-h-screen bg-navy flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </main>
    );
  }

  const currentCard = dueCards[currentCardIdx];
  const cardBook = currentCard ? BOOKS.find(b => b.id === currentCard.book_id) : null;
  const cardChapter = cardBook?.chapters.find(c => c.number === currentCard?.chapter_number);

  return (
    <main className="min-h-screen bg-navy text-ink pb-24">
      {/* Top Bar */}
      <nav className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto relative">
        <Link href="/profile" className="flex items-center justify-center w-[36px] h-[36px] rounded-full border border-gold bg-navy shrink-0 z-10">
          {displayName ? (
            <span className="text-gold font-bold text-sm">{displayName.charAt(0).toUpperCase()}</span>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C97D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          )}
        </Link>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-sm font-medium tracking-wide text-ink/80" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Loop Reader</span>
        </div>
        {/* Streak badge */}
        {streak > 0 && (
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 rounded-full px-3 py-1.5 z-10">
            <span className="text-base">🔥</span>
            <span className="text-xs font-bold text-orange-300">{streak}</span>
          </div>
        )}
        {streak === 0 && <div className="w-[36px]" />}
      </nav>

      <div className="max-w-xl mx-auto px-6 pt-4 space-y-6">
        {/* Greeting + Progress Ring */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              {greeting}{displayName ? `, ${displayName}` : ''}
            </h1>
            <p className="text-ink/50 text-sm mt-1">
              {tasksComplete === totalTasks ? 'All done for today ✨' : `${tasksComplete}/${totalTasks} daily tasks complete`}
            </p>
          </div>
          {/* Mini progress ring */}
          <div className="relative w-12 h-12 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-ink/10" />
              <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="4" fill="transparent"
                className="text-gold transition-all duration-700 ease-out"
                strokeDasharray={113} strokeDashoffset={113 - (tasksComplete / totalTasks) * 113} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-bold text-ink/60">{tasksComplete}/{totalTasks}</span>
            </div>
          </div>
        </div>

        {/* Streak Card — prominent when active or motivating when at 0 */}
        <div className={`rounded-2xl p-5 border ${streak > 0 ? 'bg-gradient-to-br from-orange-500/10 to-amber-500/5 border-orange-500/20' : 'bg-ink/5 border-ink/10'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${streak > 0 ? 'bg-orange-500/20' : 'bg-ink/10'}`}>
                {streak > 0 ? '🔥' : '📖'}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {streak > 0 ? `${streak} day streak` : 'Start your streak'}
                </p>
                <p className="text-[11px] text-ink/40 mt-0.5">
                  {readToday ? 'You read today ✓' : streak > 0 ? 'Read today to keep it alive' : 'Read 1 chapter to begin'}
                </p>
              </div>
            </div>
            {!readToday && (
              <Link href="/?resume=true" className="text-xs bg-gold/10 text-gold px-4 py-2 rounded-lg font-semibold hover:bg-gold/20 transition-colors">
                Read →
              </Link>
            )}
          </div>
          {/* Streak milestones */}
          {streak > 0 && (
            <div className="flex gap-2 mt-4">
              {[3, 7, 14, 30].map(milestone => (
                <div key={milestone} className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold ${streak >= milestone ? 'bg-orange-500/20 text-orange-300' : 'bg-ink/5 text-ink/30'}`}>
                  {streak >= milestone ? '✓' : '○'} {milestone}d
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Review Cards — Spaced Repetition */}
        {dueCards.length > 0 && !reviewComplete && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-ink/40 uppercase tracking-widest">Review</h2>
              <span className="text-[10px] text-ink/30 font-medium">{currentCardIdx + 1} of {dueCards.length}</span>
            </div>
            <div className={`bg-[#1A1A1A] border border-[#333] rounded-2xl overflow-hidden transition-opacity duration-300 ${cardAnimating ? 'opacity-50' : 'opacity-100'}`}>
              {/* Card header */}
              <div className="px-5 pt-4 pb-2 flex items-center gap-2">
                <span className="text-sm">🧠</span>
                <span className="text-[10px] font-semibold text-ink/30 uppercase tracking-widest">
                  {cardBook?.title} · Ch {currentCard?.chapter_number}
                </span>
              </div>

              {/* Question */}
              <div className="px-5 pb-4">
                <p className="text-sm text-white font-medium leading-relaxed" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  {currentCard?.question}
                </p>
              </div>

              {/* Answer reveal */}
              {!showAnswer ? (
                <div className="px-5 pb-5">
                  <button
                    onClick={() => setShowAnswer(true)}
                    className="w-full bg-ink/10 hover:bg-ink/15 text-ink/60 hover:text-white text-sm font-semibold py-3 rounded-xl transition-colors"
                  >
                    Show Answer
                  </button>
                </div>
              ) : (
                <div className="border-t border-ink/10">
                  <div className="px-5 py-4">
                    <p className="text-[10px] font-semibold text-gold/50 uppercase tracking-widest mb-2">Answer</p>
                    <p className="text-sm text-ink/70 leading-relaxed" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                      {currentCard?.correct_answer}
                    </p>
                  </div>
                  <div className="px-5 pb-5 flex gap-3">
                    <button
                      onClick={() => handleCardResponse(false)}
                      className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold py-3 rounded-xl transition-colors"
                    >
                      Didn't know ✗
                    </button>
                    <button
                      onClick={() => handleCardResponse(true)}
                      className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-semibold py-3 rounded-xl transition-colors"
                    >
                      Got it ✓
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Review complete state */}
        {reviewComplete && dueCards.length > 0 && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 text-center">
            <span className="text-2xl">🎯</span>
            <p className="text-sm font-semibold text-emerald-400 mt-2">Review complete!</p>
            <p className="text-[11px] text-ink/40 mt-1">
              {reviewStats.mastered > 0 && `${reviewStats.mastered} cards mastered · `}
              {reviewStats.total} total cards in your deck
            </p>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-ink/5 border border-ink/10 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-white">{chaptersRead}</p>
            <p className="text-[10px] text-ink/40 font-medium mt-0.5">Chapters</p>
          </div>
          <div className="bg-ink/5 border border-ink/10 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-white">{booksStarted}</p>
            <p className="text-[10px] text-ink/40 font-medium mt-0.5">Books</p>
          </div>
          <div className="bg-ink/5 border border-ink/10 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-white">{reviewStats.mastered}</p>
            <p className="text-[10px] text-ink/40 font-medium mt-0.5">Mastered</p>
          </div>
        </div>

        {/* Reading Goal */}
        {!readToday && (
          <div className="bg-ink/5 border border-ink/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C97D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span className="text-xs font-semibold text-gold uppercase tracking-widest">Today's Focus</span>
            </div>
            <p className="text-ink/90 font-medium mb-1">
              Read 1 chapter of {lastBook ? lastBook.title : 'your book'}
            </p>
            <Link href="/?resume=true" className="inline-block mt-3 text-xs bg-gold/10 text-gold px-4 py-2 rounded-lg font-medium hover:bg-gold/20 transition-colors">
              Continue Reading →
            </Link>
          </div>
        )}

        {/* Pending Commitments */}
        {commitments.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-ink/40 uppercase tracking-widest mb-3">Action Items</h2>
            <div className="space-y-3">
              {commitments.slice(0, 3).map(c => {
                const book = BOOKS.find(b => b.id === c.book_id);
                return (
                  <div key={c.id || c.chapter_number} className="bg-ink/5 border border-ink/10 rounded-xl p-4 flex gap-3">
                    <div className="mt-0.5 w-4 h-4 rounded-full border border-gold/50 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-ink/90 leading-relaxed">{c.commitment_text}</p>
                      <p className="text-[10px] text-ink/40 mt-1">
                        {book?.title} · Due {new Date(c.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              {commitments.length > 3 && (
                <Link href="/journey" className="block text-center text-xs text-gold hover:underline py-2">
                  +{commitments.length - 3} more in Journey →
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Maintenance */}
        {maintenance && (
          <div>
            <h2 className="text-sm font-semibold text-ink/40 uppercase tracking-widest mb-3">Check-in</h2>
            <MaintenanceCard
              bookTitle={maintenance.book.title}
              chapterTitle={maintenance.book.chapters.filter(c => c.content && !c.content.startsWith('Coming soon'))[maintenance.chapterIdx].title}
              chapterNumber={maintenance.book.chapters.filter(c => c.content && !c.content.startsWith('Coming soon'))[maintenance.chapterIdx].number}
              onSubmit={async (rating, reflection) => {
                let aiResponse = '';
                try {
                  const res = await fetch('/api/maintenance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      chapterTitle: maintenance.book.chapters.filter(c => c.content && !c.content.startsWith('Coming soon'))[maintenance.chapterIdx].title,
                      rating,
                      reflection,
                      profile
                    }),
                  });
                  const data = await res.json();
                  aiResponse = data.response || '';
                } catch {}
                if (user?.id) {
                  await saveMaintenanceCheckin(
                    user.id, 
                    maintenance.book.id, 
                    maintenance.book.chapters.filter(c => c.content && !c.content.startsWith('Coming soon'))[maintenance.chapterIdx].number, 
                    rating, 
                    reflection, 
                    aiResponse
                  );
                }
                return aiResponse;
              }}
              onDismiss={() => setMaintenance(null)}
            />
          </div>
        )}

        {/* Empty state when nothing pending */}
        {readToday && commitments.length === 0 && dueCards.length === 0 && !maintenance && (
          <div className="bg-ink/5 border border-ink/10 rounded-xl p-8 text-center">
            <span className="text-3xl">✨</span>
            <p className="text-sm font-semibold text-white mt-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              You're all caught up
            </p>
            <p className="text-[11px] text-ink/40 mt-1.5 max-w-xs mx-auto">
              Come back tomorrow for new review cards and your next chapter.
            </p>
            <Link href="/" className="inline-block mt-4 text-xs text-gold hover:underline">
              Browse Library →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
