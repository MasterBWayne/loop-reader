'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCurrentUser, supabase, loadAllCommitments, loadPendingCommitments, markCommitmentFollowedUp, loadWeeklyInsight, saveWeeklyInsight, saveFlashbackResponse } from '@/lib/supabase';
import type { CommitmentRecord } from '@/lib/supabase';
import { BOOKS } from '@/data/books';

interface Reflection {
  book_id: string;
  chapter_number: number;
  question_text: string;
  answer_text: string;
  tags?: string[];
  is_implemented?: boolean;
  implemented_at?: string;
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
    tags?: string[];
    is_implemented?: boolean;
    created_at?: string;
  }[];
}

interface WinCard {
  bookId: string;
  bookTitle: string;
  coverColor: string;
  chapterTitle: string;
  what: string;
  dateAchieved: string;
  dateObj: Date;
}

export default function JourneyPage() {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<BookGroup[]>([]);
  const [allReflections, setAllReflections] = useState<Reflection[]>([]);
  const [expandedBook, setExpandedBook] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'reflections' | 'commitments' | 'wins'>('reflections');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  // Feature 1: Credit Score
  const [commitmentsCount, setCommitmentsCount] = useState(0);
  const [implementedCount, setImplementedCount] = useState(0);
  const [streakCount, setStreakCount] = useState(0);

  // Feature 2: Weekly Insight
  const [weeklyInsight, setWeeklyInsight] = useState<{ insight: string; bookId?: string; chapterNumber?: number } | null>(null);

  // Feature 4: Flashback
  const [flashbackReflection, setFlashbackReflection] = useState<{
    bookId: string;
    bookTitle: string;
    chapterNumber: number;
    chapterTitle: string;
    answerText: string;
    date: string;
  } | null>(null);
  const [flashbackState, setFlashbackState] = useState<'idle' | 'loading' | 'success' | 'reframe'>('idle');
  const [flashbackReframe, setFlashbackReframe] = useState<{ reframe: string; microStep: string } | null>(null);

  // Feature 5: Wins
  const [wins, setWins] = useState<WinCard[]>([]);

  // Feature 6: Commitments tab
  const [allCommitmentsRaw, setAllCommitmentsRaw] = useState<CommitmentRecord[]>([]);
  const [pendingCommitments, setPendingCommitments] = useState<CommitmentRecord[]>([]);
  const [completedCommitments, setCompletedCommitments] = useState<CommitmentRecord[]>([]);
  const [checkinInputs, setCheckinInputs] = useState<Record<string, string>>({});
  const [checkinLoading, setCheckinLoading] = useState<Record<string, boolean>>({});
  const [checkinResponses, setCheckinResponses] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const user = await getCurrentUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      // Parallel fetching
      const [reflectionsRes, commitmentsData] = await Promise.all([
        supabase
          .from('chapter_reflections')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        loadAllCommitments(user.id)
      ]);

      const data = reflectionsRes.data;
      if (reflectionsRes.error || !data || data.length === 0) {
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

      setAllReflections(data);

      // Group by book
      const bookMap = new Map<string, Reflection[]>();
      for (const r of data) {
        if (!bookMap.has(r.book_id)) bookMap.set(r.book_id, []);
        bookMap.get(r.book_id)!.push(r);
      }

      const result: BookGroup[] = [];
      const winsList: WinCard[] = [];

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
              
              // Populate wins from implemented reflections
              if (r.is_implemented && r.implemented_at) {
                winsList.push({
                  bookId,
                  bookTitle: book.title,
                  coverColor: book.coverColor,
                  chapterTitle: ch?.title || `Chapter ${r.chapter_number}`,
                  what: "Applied chapter exercise",
                  dateAchieved: new Date(r.implemented_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
                  dateObj: new Date(r.implemented_at)
                });
              }

              return {
                chapterNumber: r.chapter_number,
                chapterTitle: ch?.title || `Chapter ${r.chapter_number}`,
                question: r.question_text,
                answer: r.answer_text,
                date: new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
                tags: r.tags || [],
                is_implemented: r.is_implemented,
                created_at: r.created_at
              };
            }),
        });
      }
      setGroups(result);
      if (result.length > 0) setExpandedBook(result[0].bookId);

      // Populate wins from commitments + commitments tab data
      if (commitmentsData) {
        setAllCommitmentsRaw(commitmentsData);
        setCommitmentsCount(commitmentsData.length);
        
        // Split into pending vs completed for commitments tab
        const now = new Date();
        const pending = commitmentsData.filter(c => !c.followed_up && new Date(c.due_date) <= now);
        const upcoming = commitmentsData.filter(c => !c.followed_up && new Date(c.due_date) > now);
        const completed = commitmentsData.filter(c => c.followed_up);
        setPendingCommitments([...pending, ...upcoming].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()));
        setCompletedCommitments(completed.sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime()));
        
        const followedUp = commitmentsData.filter(c => c.followed_up);
        
        let streak = 0;
        let implemented = 0;
        
        for (const c of commitmentsData) {
          if (c.followed_up && c.outcome && !c.outcome.toLowerCase().includes('not yet') && !c.outcome.toLowerCase().includes("didn't")) {
            implemented++;
            
            // Check if done this week to build streak
            const isThisWeek = new Date(c.due_date).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;
            if (isThisWeek) streak++;

            const book = BOOKS.find(b => b.id === c.book_id);
            const ch = book?.chapters.find(ch => ch.number === c.chapter_number);
            
            winsList.push({
              bookId: c.book_id,
              bookTitle: book?.title || '',
              coverColor: book?.coverColor || 'from-blue-600 to-indigo-600',
              chapterTitle: ch?.title || `Chapter ${c.chapter_number}`,
              what: c.commitment_text,
              dateAchieved: new Date(c.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
              dateObj: new Date(c.due_date)
            });
          }
        }
        setImplementedCount(implemented);
        setStreakCount(streak);
      }

      setWins(winsList.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime()));

      // Feature 2: Weekly Insight Loader
      const getWeekDate = () => {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff)).toISOString().split('T')[0];
      };
      
      const weekDate = getWeekDate();
      const existingInsight = await loadWeeklyInsight(user.id, weekDate);
      
      if (existingInsight) {
        setWeeklyInsight({
          insight: existingInsight.insight_text,
          bookId: existingInsight.linked_book_id,
          chapterNumber: existingInsight.linked_chapter_number
        });
      } else {
        // Generate new if there are recent reflections (last 7 days)
        const recentReflections = data.filter(r => new Date(r.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        if (recentReflections.length > 0) {
          try {
            const mappedRefls = recentReflections.map(r => {
              const b = BOOKS.find(bk => bk.id === r.book_id);
              const c = b?.chapters.find(ch => ch.number === r.chapter_number);
              return {
                bookTitle: b?.title || '',
                chapterTitle: c?.title || '',
                answer_text: r.answer_text
              };
            });
            
            const res = await fetch('/api/journey/insight', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reflections: mappedRefls })
            });
            const insightData = await res.json();
            
            if (insightData.insight) {
              setWeeklyInsight({
                insight: insightData.insight,
                bookId: insightData.linked_book_id,
                chapterNumber: insightData.linked_chapter_number
              });
              await saveWeeklyInsight(
                user.id, 
                weekDate, 
                insightData.insight, 
                insightData.linked_book_id, 
                insightData.linked_chapter_number
              );
            }
          } catch (e) {}
        }
      }

      // Feature 4: Flashback Loader
      const oldReflections = data.filter(r => !r.is_implemented && new Date(r.created_at).getTime() < Date.now() - 30 * 24 * 60 * 60 * 1000);
      if (oldReflections.length > 0) {
        // Just pick a random one for the visit
        const randomRefl = oldReflections[Math.floor(Math.random() * oldReflections.length)];
        const b = BOOKS.find(bk => bk.id === randomRefl.book_id);
        const c = b?.chapters.find(ch => ch.number === randomRefl.chapter_number);
        
        setFlashbackReflection({
          bookId: randomRefl.book_id,
          bookTitle: b?.title || '',
          chapterNumber: randomRefl.chapter_number,
          chapterTitle: c?.title || `Chapter ${randomRefl.chapter_number}`,
          answerText: randomRefl.answer_text,
          date: new Date(randomRefl.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        });
      }

      setLoading(false);
    }

    load();
  }, []);

  const handleFlashbackAction = async (type: 'yes' | 'not_yet' | 'help') => {
    if (!flashbackReflection) return;
    setFlashbackState('loading');
    
    const user = await getCurrentUser();
    if (!user) return;
    
    if (type === 'yes') {
      await saveFlashbackResponse(user.id, flashbackReflection.bookId, flashbackReflection.chapterNumber, 'yes');
      setFlashbackState('success');
    } else if (type === 'not_yet') {
      try {
        const res = await fetch('/api/journey/flashback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answerText: flashbackReflection.answerText })
        });
        const data = await res.json();
        if (data.reframe) {
          setFlashbackReframe(data);
          setFlashbackState('reframe');
          await saveFlashbackResponse(user.id, flashbackReflection.bookId, flashbackReflection.chapterNumber, 'not_yet', data.reframe);
        } else {
          setFlashbackState('idle');
        }
      } catch (e) {
        setFlashbackState('idle');
      }
    } else if (type === 'help') {
      await saveFlashbackResponse(user.id, flashbackReflection.bookId, flashbackReflection.chapterNumber, 'help');
      window.location.href = `/reading?book=${flashbackReflection.bookId}&chapter=${flashbackReflection.chapterNumber}`;
    }
  };

  // Handle commitment check-in submission
  const handleCheckinSubmit = useCallback(async (commitment: CommitmentRecord) => {
    const key = `${commitment.book_id}-${commitment.chapter_number}`;
    const input = checkinInputs[key]?.trim();
    if (!input || !userId) return;

    setCheckinLoading(prev => ({ ...prev, [key]: true }));

    try {
      // Mark as followed up in DB
      await markCommitmentFollowedUp(userId, commitment.book_id, commitment.chapter_number, input);

      // Get AI follow-up response
      const book = BOOKS.find(b => b.id === commitment.book_id);
      const ch = book?.chapters.find(c => c.number === commitment.chapter_number);

      try {
        const res = await fetch('/api/commitment-followup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            commitmentText: commitment.commitment_text,
            chapterTitle: ch?.title || '',
            outcomeText: input,
            userId,
          })
        });
        const data = await res.json();
        if (data.response) {
          setCheckinResponses(prev => ({ ...prev, [key]: data.response }));
        }
      } catch {}

      // Move from pending to completed
      setPendingCommitments(prev => prev.filter(c => !(c.book_id === commitment.book_id && c.chapter_number === commitment.chapter_number)));
      setCompletedCommitments(prev => [{ ...commitment, followed_up: true, outcome: input }, ...prev]);
      setImplementedCount(prev => prev + 1);
    } catch (e) {
      console.error('Check-in submit error:', e);
    } finally {
      setCheckinLoading(prev => ({ ...prev, [key]: false }));
    }
  }, [checkinInputs, userId]);

  const totalReflections = allReflections.length;
  
  // Derived tags
  const allTags = Array.from(new Set(allReflections.flatMap(r => r.tags || []))).filter(Boolean);

  if (loading) {
    return (
      <main className="min-h-screen bg-navy flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </main>
    );
  }

  const implementationRate = commitmentsCount > 0 ? Math.round((implementedCount / commitmentsCount) * 100) : 0;
  const radius = 20;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (implementationRate / 100) * circumference;

  return (
    <main className="min-h-screen bg-navy text-ink">
      {/* Header */}
      <div className="max-w-3xl mx-auto px-6 pt-8 pb-6">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 bg-gold rounded flex items-center justify-center text-ink font-bold text-sm" style={{ fontFamily: "'Cormorant Garamond', serif" }}>A</div>
          <span className="text-sm font-medium tracking-wide text-ink/80">THE ARCHITECT METHOD</span>
        </div>

        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Your Journey</h1>
        
        {/* Tabs */}
        <div className="flex gap-6 border-b border-ink/10 mt-6 mb-6">
          <button 
            onClick={() => setActiveTab('reflections')}
            className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === 'reflections' ? 'text-gold' : 'text-ink/40 hover:text-white'}`}
          >
            Reflections
            {activeTab === 'reflections' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold rounded-t" />}
          </button>
          <button 
            onClick={() => setActiveTab('commitments')}
            className={`pb-3 text-sm font-semibold transition-colors relative flex items-center gap-2 ${activeTab === 'commitments' ? 'text-gold' : 'text-ink/40 hover:text-white'}`}
          >
            Check-ins
            {pendingCommitments.length > 0 && <span className="bg-gold/20 text-gold text-[10px] px-1.5 py-0.5 rounded-md font-bold">{pendingCommitments.length}</span>}
            {activeTab === 'commitments' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold rounded-t" />}
          </button>
          <button 
            onClick={() => setActiveTab('wins')}
            className={`pb-3 text-sm font-semibold transition-colors relative flex items-center gap-2 ${activeTab === 'wins' ? 'text-gold' : 'text-ink/40 hover:text-white'}`}
          >
            Wins Gallery
            {wins.length > 0 && <span className="bg-ink/10 text-white text-[10px] px-1.5 py-0.5 rounded-md">{wins.length}</span>}
            {activeTab === 'wins' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold rounded-t" />}
          </button>
        </div>
      </div>

      {activeTab === 'reflections' && (
        <>
          {/* Feature 1: Credit Score Gauge */}
          <div className="max-w-3xl mx-auto px-6 mb-6">
            <div className="bg-ink/5 rounded-2xl p-5 border border-ink/10 flex items-center gap-5">
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="32" cy="32" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-ink/10" />
                  <circle 
                    cx="32" cy="32" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" 
                    className="text-gold transition-all duration-1000 ease-out" 
                    strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" 
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">{implementationRate}%</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink/80 uppercase tracking-widest mb-1">Behavioral Implementation</h3>
                <p className="text-sm text-ink/50">{implementedCount} of {commitmentsCount} frameworks applied.</p>
                {streakCount > 0 && (
                  <div className="mt-2 inline-flex items-center gap-1.5 bg-gold/10 text-gold px-2 py-1 rounded-md text-[10px] font-bold">
                    <span>🔥 {streakCount} WEEK STREAK</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Feature 2: Weekly Insight */}
          {weeklyInsight && (
            <div className="max-w-3xl mx-auto px-6 mb-8">
              <div className="bg-gradient-to-br from-gold/10 to-transparent rounded-2xl p-5 border border-gold/20">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">💡</span>
                  <h3 className="text-sm font-semibold text-gold tracking-wide">THIS WEEK'S INSIGHT</h3>
                </div>
                <p className="text-sm text-ink/90 leading-relaxed mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  {weeklyInsight.insight}
                </p>
                {weeklyInsight.bookId && weeklyInsight.chapterNumber && (
                  <a 
                    href={`/reading?book=${weeklyInsight.bookId}&chapter=${weeklyInsight.chapterNumber}`}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-gold hover:text-white transition-colors"
                  >
                    Revisit Chapter →
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Feature 4: Flashback Challenge */}
          {flashbackReflection && flashbackState !== 'success' && (
            <div className="max-w-3xl mx-auto px-6 mb-8">
              <div className="bg-ink/5 rounded-2xl border border-ink/10 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-3 opacity-20 text-4xl leading-none font-serif">"</div>
                <div className="p-5 border-b border-ink/10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-semibold text-gold/60 uppercase tracking-widest">
                      Flashback · {flashbackReflection.date}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    {flashbackReflection.bookTitle} · {flashbackReflection.chapterTitle}
                  </h3>
                  <p className="text-sm text-ink/60 italic line-clamp-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    "{flashbackReflection.answerText}"
                  </p>
                </div>
                
                <div className="p-5 bg-black/20">
                  {flashbackState === 'idle' && (
                    <>
                      <p className="text-sm font-medium text-white mb-4 text-center">Have you applied this yet?</p>
                      <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => handleFlashbackAction('yes')} className="bg-ink/10 hover:bg-ink/20 text-white text-xs font-semibold py-2 rounded-lg transition-colors">
                          ✓ Yes, I did it
                        </button>
                        <button onClick={() => handleFlashbackAction('not_yet')} className="bg-ink/5 hover:bg-ink/10 text-ink/60 hover:text-white text-xs font-semibold py-2 rounded-lg transition-colors">
                          ✗ Not yet
                        </button>
                        <button onClick={() => handleFlashbackAction('help')} className="bg-gold/10 hover:bg-gold/20 text-gold text-xs font-semibold py-2 rounded-lg transition-colors">
                          → I need help
                        </button>
                      </div>
                    </>
                  )}
                  {flashbackState === 'loading' && (
                    <div className="flex justify-center py-2">
                      <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                    </div>
                  )}
                  {flashbackState === 'reframe' && flashbackReframe && (
                    <div className="text-center animate-fade-in">
                      <p className="text-sm text-ink/80 mb-3">{flashbackReframe.reframe}</p>
                      <div className="bg-gold/10 border border-gold/20 rounded-xl p-3 inline-block">
                        <p className="text-xs font-bold text-gold uppercase mb-1">Micro-Step for Today</p>
                        <p className="text-sm text-white">{flashbackReframe.microStep}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Feature 3: Toolbelt Filters */}
          {allTags.length > 0 && (
            <div className="max-w-3xl mx-auto px-6 mb-6">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedTag(null)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${selectedTag === null ? 'bg-gold text-ink' : 'bg-ink/10 text-ink/60 hover:bg-ink/20'}`}
                >
                  All ({totalReflections})
                </button>
                {allTags.map(tag => {
                  const count = allReflections.filter(r => r.tags?.includes(tag)).length;
                  return (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${selectedTag === tag ? 'bg-gold text-ink' : 'bg-ink/10 text-ink/60 hover:bg-ink/20'}`}
                    >
                      {tag} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {groups.length === 0 && (
            <div className="max-w-3xl mx-auto px-6 py-16 text-center">
              <div className="w-16 h-16 bg-ink/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6B5744" strokeWidth="1.5">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
              <h2 className="text-lg font-semibold mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>No reflections yet</h2>
              <p className="text-sm text-ink/40 max-w-sm mx-auto mb-6">
                Start reading a book and complete the exercise at the end of each chapter. Your answers will appear here as a personal growth journal.
              </p>
              <a href="/" className="inline-flex items-center gap-2 bg-gold hover:bg-gold-light text-ink font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm">
                Browse Library
              </a>
            </div>
          )}

          {/* Book groups */}
          <div className="max-w-3xl mx-auto px-6 pb-24 space-y-4">
            {groups.map(group => {
              const groupRefls = selectedTag 
                ? group.reflections.filter(r => r.tags?.includes(selectedTag))
                : group.reflections;
                
              if (groupRefls.length === 0) return null;

              const isExpanded = expandedBook === group.bookId || selectedTag !== null;
              return (
                <div key={group.bookId} className="rounded-2xl border border-ink/10 overflow-hidden">
                  {/* Book header */}
                  <button
                    onClick={() => setExpandedBook(isExpanded && !selectedTag ? null : group.bookId)}
                    className="w-full text-left"
                  >
                    <div className={`bg-gradient-to-r ${group.coverColor} p-4 flex items-center justify-between relative`}>
                      <div className="absolute inset-0 bg-black/30" />
                      <div className="relative z-10 flex items-center gap-3 min-w-0">
                        <div>
                          <h2 className="text-base font-bold text-white leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{group.bookTitle}</h2>
                          <p className="text-[11px] text-ink/50 mt-0.5">
                            {group.bookAuthor} &middot; {groupRefls.length} reflection{groupRefls.length !== 1 ? 's' : ''}
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
                      {groupRefls.map((r, i) => (
                        <div key={i} className="px-5 py-5 relative">
                          {/* Chapter badge */}
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-semibold text-gold/60 uppercase tracking-widest">
                              Chapter {r.chapterNumber}: {r.chapterTitle}
                            </span>
                            <div className="flex items-center gap-2">
                              {r.is_implemented && (
                                <span className="bg-green-500/20 text-green-400 text-[10px] px-1.5 py-0.5 rounded-md font-bold">✓ APPLIED</span>
                              )}
                              {r.date && (
                                <span className="text-[10px] text-ink/20">{r.date}</span>
                              )}
                            </div>
                          </div>

                          {/* Question */}
                          <p className="text-xs text-ink/40 italic mb-2 leading-relaxed" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                            &ldquo;{r.question}&rdquo;
                          </p>

                          {/* Answer */}
                          <p className="text-sm text-ink/80 leading-relaxed whitespace-pre-wrap mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                            {r.answer}
                          </p>
                          
                          {/* Tags */}
                          {r.tags && r.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {r.tags.map(t => (
                                <span key={t} className="text-[10px] bg-ink/5 text-ink/40 px-2 py-0.5 rounded-md">{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
      
      {/* Feature 6: Commitments / Check-ins Tab */}
      {activeTab === 'commitments' && (
        <div className="max-w-3xl mx-auto px-6 pb-24">
          {/* Pending Check-ins */}
          {pendingCommitments.length > 0 && (
            <div className="mb-10">
              <h2 className="text-sm font-semibold text-gold/70 uppercase tracking-widest mb-4">Pending Check-ins</h2>
              <div className="space-y-4">
                {pendingCommitments.map(commitment => {
                  const key = `${commitment.book_id}-${commitment.chapter_number}`;
                  const book = BOOKS.find(b => b.id === commitment.book_id);
                  const ch = book?.chapters.find(c => c.number === commitment.chapter_number);
                  const isDue = new Date(commitment.due_date) <= new Date();
                  const aiResponse = checkinResponses[key];

                  return (
                    <div key={key} className="bg-[#1A1A1A] border border-[#333] rounded-xl overflow-hidden">
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🎯</span>
                            <span className="text-[10px] font-semibold text-ink/40 uppercase tracking-widest">
                              {book?.title} · Ch {commitment.chapter_number}
                            </span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isDue ? 'bg-gold/15 text-gold' : 'bg-ink/10 text-ink/40'}`}>
                            {isDue ? 'DUE' : `Due ${new Date(commitment.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}
                          </span>
                        </div>

                        <p className="text-sm text-white font-medium mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                          {ch?.title || `Chapter ${commitment.chapter_number}`}
                        </p>
                        <p className="text-sm text-ink/60 italic mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                          &ldquo;{commitment.commitment_text}&rdquo;
                        </p>

                        {!aiResponse ? (
                          <>
                            <textarea
                              value={checkinInputs[key] || ''}
                              onChange={e => setCheckinInputs(prev => ({ ...prev, [key]: e.target.value }))}
                              placeholder="What happened? Did you do it?"
                              rows={2}
                              disabled={checkinLoading[key]}
                              className="w-full bg-[#252525] border border-[#3A3A3A] rounded-lg px-4 py-3 text-sm text-[#E8E8E8] placeholder:text-[#555] outline-none focus:border-gold/60 transition-colors resize-none leading-relaxed disabled:opacity-50"
                              style={{ fontFamily: "var(--rk-font-body, sans-serif)" }}
                            />
                            <div className="flex justify-end mt-3">
                              <button
                                onClick={() => handleCheckinSubmit(commitment)}
                                disabled={!checkinInputs[key]?.trim() || checkinLoading[key]}
                                className="flex items-center gap-2 bg-gold hover:bg-[#D4882F] disabled:bg-[#2A2A2A] disabled:text-[#555] text-[#111] font-semibold px-5 py-2.5 rounded-xl transition-all text-sm"
                              >
                                {checkinLoading[key] ? (
                                  <div className="w-4 h-4 border-2 border-[#111]/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                  'Check in'
                                )}
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="bg-[#252525] border border-gold/20 rounded-lg p-4 animate-fade-in">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm">💬</span>
                              <span className="text-[10px] font-semibold text-gold/60 uppercase tracking-widest">The Architect</span>
                            </div>
                            <p className="text-sm text-ink/80 leading-relaxed whitespace-pre-wrap" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                              {aiResponse}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Completed Check-ins */}
          {completedCommitments.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-ink/30 uppercase tracking-widest mb-4">Completed</h2>
              <div className="space-y-3">
                {completedCommitments.map(commitment => {
                  const book = BOOKS.find(b => b.id === commitment.book_id);
                  const ch = book?.chapters.find(c => c.number === commitment.chapter_number);

                  return (
                    <div key={`${commitment.book_id}-${commitment.chapter_number}`} className="bg-[#1A1A1A]/60 border border-[#2A2A2A] rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 text-sm">✓</span>
                          <span className="text-[10px] font-semibold text-ink/30 uppercase tracking-widest">
                            {book?.title} · Ch {commitment.chapter_number}
                          </span>
                        </div>
                        <span className="text-[10px] text-ink/20">
                          {new Date(commitment.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-sm text-ink/50 italic mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                        &ldquo;{commitment.commitment_text}&rdquo;
                      </p>
                      {commitment.outcome && (
                        <p className="text-xs text-ink/30 mt-2">
                          <span className="text-ink/40 font-semibold">You said:</span> {commitment.outcome}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {pendingCommitments.length === 0 && completedCommitments.length === 0 && (
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-ink/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🎯</span>
              </div>
              <h2 className="text-lg font-semibold mb-2 text-white" style={{ fontFamily: "'Cormorant Garamond', serif" }}>No commitments yet</h2>
              <p className="text-sm text-ink/50 max-w-xs mx-auto mb-6">
                When you set intentions after chapter exercises, they&apos;ll appear here for follow-up. This is where reading becomes action.
              </p>
              <a href="/" className="inline-flex items-center gap-2 text-gold text-sm font-semibold hover:underline">
                Start reading →
              </a>
            </div>
          )}
        </div>
      )}

      {/* Feature 5: Wins Gallery */}
      {activeTab === 'wins' && (
        <div className="max-w-3xl mx-auto px-6 pb-24">
          {wins.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🏆</span>
              </div>
              <h2 className="text-lg font-semibold mb-2 text-white" style={{ fontFamily: "'Cormorant Garamond', serif" }}>No wins yet</h2>
              <p className="text-sm text-ink/50 max-w-xs mx-auto mb-6">
                Your wins will appear here when you mark commitments as completed or apply what you read. This is your proof of capability.
              </p>
              <button 
                onClick={() => setActiveTab('reflections')}
                className="text-gold text-sm font-semibold hover:underline"
              >
                Go back to Reflections
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {wins.map((win, i) => (
                <div key={i} className="bg-navy-light rounded-2xl border border-gold/20 overflow-hidden relative group">
                  <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${win.coverColor}`} />
                  <div className="p-5 pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-8 h-8 bg-gold/10 rounded-full flex items-center justify-center flex-shrink-0 text-gold">
                        ⭐
                      </div>
                      <span className="text-[10px] text-ink/30 font-medium">{win.dateAchieved}</span>
                    </div>
                    <h3 className="text-[10px] font-bold text-ink/50 uppercase tracking-wider mb-1 line-clamp-1">{win.bookTitle} · {win.chapterTitle}</h3>
                    <p className="text-sm text-ink/90 font-medium leading-relaxed" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                      "{win.what}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
