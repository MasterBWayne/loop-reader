'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { IntakeAnswers } from './IntakeForm';
import { ExerciseBox } from './ExerciseBox';
import { HabitTracker } from './HabitTracker';
import { MicButton } from './MicButton';
import { saveReflection, loadReflections, loadChapterReflection, saveCommitment, loadCommitment, loadPendingCommitments, markCommitmentFollowedUp, type ReflectionRecord, type CommitmentRecord } from '@/lib/supabase';
import { ActiveRecallGate } from './ActiveRecallGate';
import { PersonalSummaryView } from './PersonalSummaryView';

interface Chapter {
  number: number;
  title: string;
  content: string;
  exerciseQuestion?: string;
}

interface ChapterProgress {
  [chapterNumber: number]: {
    unlockedAt: string;
    firstOpenedAt?: string;
  };
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ReaderLayoutProps {
  chapters: Chapter[];
  bookTitle: string;
  intake: IntakeAnswers;
  progress: ChapterProgress;
  onChapterOpen: (chapterNumber: number) => void;
  isChapterUnlocked: (chapterNumber: number, progress: ChapterProgress) => boolean;
  getUnlockDate: (chapterNumber: number, progress: ChapterProgress) => Date | null;
  onBackToLibrary?: () => void;
  user?: any;
  onSignOut?: () => void;
  pace?: 'guided' | 'free';
  userProfile?: any;
  coverColor?: string;
}

export function ReaderLayout({
  chapters,
  bookTitle,
  intake,
  progress,
  onChapterOpen,
  isChapterUnlocked,
  getUnlockDate,
  onBackToLibrary,
  user,
  onSignOut,
  pace,
  userProfile,
  coverColor,
}: ReaderLayoutProps) {
  const [currentChapter, setCurrentChapter] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [activeTab, setActiveTab] = useState<'chapters' | 'practice'>('chapters');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Welcome. I'm your companion for *${bookTitle}*.\n\nAs you read, you can ask me anything — about the concepts, how they apply to your situation, or what a passage really means.\n\nI'm not here to give generic advice. I'm here to help you think.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [personalizedIntro, setPersonalizedIntro] = useState<string | null>(null);
  const [introLoading, setIntroLoading] = useState(false);
  const [reflections, setReflections] = useState<Record<number, string>>({});
  const [exerciseLoading, setExerciseLoading] = useState(false);
  const [showJourney, setShowJourney] = useState(false);
  const [commitments, setCommitments] = useState<Record<number, string>>({});
  const [pendingFollowUp, setPendingFollowUp] = useState<CommitmentRecord | null>(null);
  const [followUpInput, setFollowUpInput] = useState('');
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [followUpDismissed, setFollowUpDismissed] = useState(false);
  const [journeySummary, setJourneySummary] = useState<string | null>(null);
  const [journeyLoading, setJourneyLoading] = useState(false);
  // Feature 1: Active Recall Gate
  const [showRecallGate, setShowRecallGate] = useState(false);
  const [recallChapter, setRecallChapter] = useState<number | null>(null);
  // Feature 4: Living Summary
  const [showPersonalSummary, setShowPersonalSummary] = useState(false);

  const bookId = bookTitle.toLowerCase().replace(/\s+/g, '-');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  const chapter = chapters[currentChapter];
  const unlocked = isChapterUnlocked(chapter.number, progress);

  // Load reflections from Supabase + localStorage fallback
  useEffect(() => {
    // Always load from localStorage first (instant)
    try {
      const key = `loop-reader-reflections-${bookId}`;
      const stored = JSON.parse(localStorage.getItem(key) || '{}');
      if (Object.keys(stored).length > 0) {
        setReflections(prev => ({ ...prev, ...stored }));
      }
    } catch {}

    // Then load from Supabase (authoritative, overwrites)
    if (user?.id) {
      loadReflections(user.id, bookId).then(records => {
        const map: Record<number, string> = {};
        for (const r of records) map[r.chapter_number] = r.answer_text;
        if (Object.keys(map).length > 0) {
          setReflections(map);
          // Sync to localStorage
          try {
            const key = `loop-reader-reflections-${bookId}`;
            localStorage.setItem(key, JSON.stringify(map));
          } catch {}
        }
      });

      // Load pending commitments for follow-up banner
      loadPendingCommitments(user.id).then(pending => {
        if (pending.length > 0) {
          setPendingFollowUp(pending[0]);
        }
      });

      // Load commitments for current book
      try {
        const localCommitments = JSON.parse(localStorage.getItem(`loop-reader-commitments-${bookId}`) || '{}');
        if (Object.keys(localCommitments).length > 0) setCommitments(localCommitments);
      } catch {}
    }
  }, [user?.id, bookId]);

  // Track chapter open + fetch personalized intro
  useEffect(() => {
    if (unlocked) {
      onChapterOpen(chapter.number);
      fetchPersonalizedIntro();
      
      // Fetch specific reflection for this chapter on mount to ensure textarea prepopulates
      if (user?.id && chapter.number) {
        loadChapterReflection(user.id, bookId, chapter.number).then(answer => {
          if (answer) {
            setReflections(prev => ({ ...prev, [chapter.number]: answer }));
            // Also sync to localStorage
            try {
              const key = `loop-reader-reflections-${bookId}`;
              const stored = JSON.parse(localStorage.getItem(key) || '{}');
              stored[chapter.number] = answer;
              localStorage.setItem(key, JSON.stringify(stored));
            } catch {}
          }
        });
      }
    } else {
      setPersonalizedIntro(null);
    }
  }, [currentChapter, unlocked, user?.id, bookId, chapter.number]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (showChat) {
      setTimeout(() => chatInputRef.current?.focus(), 300);
    }
  }, [showChat]);

  const fetchPersonalizedIntro = async () => {
    if (!intake?.struggle) return;
    setIntroLoading(true);
    setPersonalizedIntro(null);
    try {
      const res = await fetch('/api/personalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterTitle: chapter.title,
          chapterContent: chapter.content,
          intake,
          profile: userProfile,
          userId: user?.id,
          priorReflections: Object.entries(reflections)
            .filter(([cn]) => parseInt(cn) < chapter.number)
            .map(([cn, ans]) => ({ chapter: parseInt(cn), answer: ans })),
        }),
      });
      const data = await res.json();
      if (data.intro) setPersonalizedIntro(data.intro);
    } catch (err) {
      console.error('Personalization failed:', err);
    } finally {
      setIntroLoading(false);
    }
  };

  const handleExerciseSubmit = useCallback(async (answer: string) => {
    if (!chapter.exerciseQuestion) return;
    setExerciseLoading(true);

    setReflections(prev => ({ ...prev, [chapter.number]: answer }));

    // Save to localStorage fallback
    try {
      const key = `loop-reader-reflections-${bookId}`;
      const stored = JSON.parse(localStorage.getItem(key) || '{}');
      stored[chapter.number] = answer;
      localStorage.setItem(key, JSON.stringify(stored));
    } catch {}

    // Get AI response and push to chat
    try {
      const res = await fetch('/api/reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterTitle: chapter.title,
          questionText: chapter.exerciseQuestion,
          answerText: answer,
          profile: userProfile,
          userId: user?.id,
        }),
      });
      const data = await res.json();
      
      // Save to Supabase with tags
      if (user?.id) {
        saveReflection(user.id, bookId, chapter.number, chapter.exerciseQuestion, answer, data.tags || []);
      }

      if (data.response) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        setShowChat(true);
      }
    } catch {
      // Fallback save without tags if API fails
      if (user?.id) {
        saveReflection(user.id, bookId, chapter.number, chapter.exerciseQuestion, answer, []);
      }
    }

    setExerciseLoading(false);

    // Feature 1: Trigger Active Recall Gate after exercise submission
    // Only show if there's a next chapter and current chapter has real content
    if (chapter.content && !chapter.content.startsWith('Coming soon')) {
      setRecallChapter(chapter.number);
      setShowRecallGate(true);
    }

    // Check if this is the last chapter with content
    const lastContentChapter = [...chapters].reverse().find(c => c.content && !c.content.startsWith('Coming soon'));
    if (lastContentChapter && chapter.number === lastContentChapter.number) {
      // Offer journey summary
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `You've completed all available chapters of *${bookTitle}*. Would you like to see your personal journey summary? It compiles your reflections into insights about what you discovered.\n\nType "show my journey" to see it.`,
        }]);
      }, 2000);
    }
  }, [chapter, user, bookId, bookTitle, chapters, userProfile]);

  const handleCommitmentSubmit = useCallback(async (commitmentText: string) => {
    if (!user?.id) return;
    // Due date = 24 hours from now
    const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await saveCommitment(user.id, bookId, chapter.number, commitmentText, dueDate);
    setCommitments(prev => {
      const updated = { ...prev, [chapter.number]: commitmentText };
      try { localStorage.setItem(`loop-reader-commitments-${bookId}`, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, [user, bookId, chapter]);

  const handleFollowUpSubmit = useCallback(async () => {
    if (!pendingFollowUp || !followUpInput.trim() || !user?.id) return;
    setFollowUpLoading(true);
    try {
      // Get AI response to their follow-up
      const res = await fetch('/api/commitment-followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commitmentText: pendingFollowUp.commitment_text,
          chapterTitle: chapters.find(c => c.number === pendingFollowUp.chapter_number)?.title || '',
          outcomeText: followUpInput.trim(),
          profile: userProfile,
          userId: user?.id,
        }),
      });
      const data = await res.json();

      // Mark as followed up in Supabase
      await markCommitmentFollowedUp(user.id, pendingFollowUp.book_id, pendingFollowUp.chapter_number, followUpInput.trim());

      // Show AI response in chat
      if (data.response) {
        setMessages(prev => [...prev, { role: 'assistant', content: `🎯 *Checking in on your commitment:*\n\n${data.response}` }]);
        setShowChat(true);
      }
      setPendingFollowUp(null);
      setFollowUpInput('');
    } catch {}
    setFollowUpLoading(false);
  }, [pendingFollowUp, followUpInput, user, chapters, userProfile]);

  const handleShowJourney = useCallback(async () => {
    setJourneyLoading(true);
    setShowJourney(true);
    try {
      const reflArr = Object.entries(reflections).map(([cn, ans]) => {
        const ch = chapters.find(c => c.number === parseInt(cn));
        return { chapter_number: parseInt(cn), question_text: ch?.exerciseQuestion || '', answer_text: ans };
      }).filter(r => r.answer_text);

      const res = await fetch('/api/journey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookTitle, reflections: reflArr, profile: userProfile }),
      });
      const data = await res.json();
      setJourneySummary(data.summary || 'Could not generate summary.');
    } catch {
      setJourneySummary('Something went wrong generating your summary.');
    }
    setJourneyLoading(false);
  }, [reflections, chapters, bookTitle, userProfile]);

  const [limitReached, setLimitReached] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || limitReached) return;
    const userMsg = input.trim();
    setInput('');

    // Journey trigger
    if (userMsg.toLowerCase().includes('show my journey') || userMsg.toLowerCase().includes('journey summary')) {
      setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
      handleShowJourney();
      return;
    }
    const newMessages = [...messages, { role: 'user' as const, content: userMsg }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          chapterTitle: chapter.title,
          chapterContent: chapter.content,
          chatHistory: newMessages.slice(-8),
          intake,
          userId: user?.id,
          profile: userProfile,
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      if (data.limitReached) setLimitReached(true);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Try again in a moment.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const navigateChapter = (index: number) => {
    const ch = chapters[index];
    if (!isChapterUnlocked(ch.number, progress)) return;
    setCurrentChapter(index);
    setShowNav(false);
    setPersonalizedIntro(null);
  };

  const renderText = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.trim() === '') return <br key={i} />;
      if (line.startsWith('**') && line.endsWith('**')) {
        return <h3 key={i} className="text-lg font-semibold mt-8 mb-3 text-ink">{line.slice(2, -2)}</h3>;
      }
      if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**')) {
        return <p key={i} className="italic text-muted my-4 pl-4 border-l-2 border-gold/30">{line.slice(1, -1)}</p>;
      }
      return <p key={i} className="mb-4 leading-[1.85]">{line}</p>;
    });
  };

  const renderChatText = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.trim() === '') return <br key={i} />;
      const parts = line.split(/(\*[^*]+\*)/g);
      return (
        <p key={i} className="mb-2 last:mb-0">
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

  const formatUnlockDate = (date: Date) => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHrs = Math.ceil(diffMs / (1000 * 60 * 60));
    if (diffHrs <= 0) return 'Available now';
    if (diffHrs <= 24) return `Unlocks in ${diffHrs}h`;
    const diffDays = Math.ceil(diffHrs / 24);
    return `Unlocks in ${diffDays}d`;
  };

  return (
    <div className="h-screen flex flex-col bg-cream">
      {/* Top bar */}
      <header className="bg-navy px-4 py-3 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowNav(!showNav)} className="text-ink/60 hover:text-white transition-colors p-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>
          <div>
            <p className="text-xs text-gold/80 font-medium tracking-wide">{bookTitle}</p>
            <p className="text-sm text-ink/90 font-medium">Ch. {chapter.number}: {chapter.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink/40 mr-2 hidden sm:block">{currentChapter + 1} of {chapters.length}</span>
          {/* Feature 4: Living Summary button */}
          {user?.id && (
            <button
              onClick={() => setShowPersonalSummary(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-ink/10 text-ink/70 hover:bg-ink/15 hover:text-white transition-all hidden sm:flex"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
              My {bookTitle.length > 15 ? bookTitle.slice(0, 15) + '...' : bookTitle}
            </button>
          )}
          <button
            onClick={() => setShowChat(!showChat)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${showChat ? 'bg-gold text-ink' : 'bg-ink/10 text-ink/70 hover:bg-ink/15 hover:text-white'}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            AI Companion
          </button>
        </div>
      </header>

      {/* Tab switcher: Chapters | Practice */}
      <div className="bg-navy border-b border-ink/10 px-4 flex gap-1 shrink-0">
        <button
          onClick={() => setActiveTab('chapters')}
          className={`px-4 py-2 text-xs font-medium transition-all border-b-2 ${
            activeTab === 'chapters'
              ? 'text-gold border-gold'
              : 'text-ink/40 border-transparent hover:text-ink/60'
          }`}
        >
          Chapters
        </button>
        <button
          onClick={() => setActiveTab('practice')}
          className={`px-4 py-2 text-xs font-medium transition-all border-b-2 ${
            activeTab === 'practice'
              ? 'text-gold border-gold'
              : 'text-ink/40 border-transparent hover:text-ink/60'
          }`}
        >
          Practice
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Chapter nav sidebar */}
        {showNav && (
          <>
            <div className="fixed inset-0 bg-black/20 z-20 md:hidden" onClick={() => setShowNav(false)} />
            <aside className="absolute md:relative left-0 top-0 bottom-0 w-64 bg-navy-light border-r border-ink/10 z-20 overflow-y-auto">
              <div className="p-4">
                {onBackToLibrary && (
                  <button
                    onClick={onBackToLibrary}
                    className="flex items-center gap-2 text-xs text-ink/40 hover:text-ink/70 mb-4 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5m7 7-7-7 7-7"/></svg>
                    Back to Library
                  </button>
                )}
                <p className="text-xs text-gold/60 font-semibold tracking-[0.15em] uppercase mb-4">Chapters</p>
                <div className="space-y-1">
                  {chapters.map((ch, i) => {
                    const locked = !isChapterUnlocked(ch.number, progress);
                    const unlockDate = getUnlockDate(ch.number, progress);
                    return (
                      <button
                        key={ch.number}
                        onClick={() => !locked && navigateChapter(i)}
                        disabled={locked}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                          locked
                            ? 'text-ink/20 cursor-not-allowed'
                            : i === currentChapter
                            ? 'bg-gold/15 text-gold font-medium'
                            : 'text-ink/50 hover:text-ink/80 hover:bg-ink/5'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>
                            <span className="text-xs opacity-50 mr-2">{ch.number}.</span>
                            {ch.title}
                          </span>
                          {locked && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-30 shrink-0">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                          )}
                        </div>
                        {locked && unlockDate && (
                          <span className="text-[10px] text-ink/15 ml-5 block mt-0.5">
                            {formatUnlockDate(unlockDate)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>
          </>
        )}

        {/* Practice tab */}
        {activeTab === 'practice' && user?.id && (
          <div className={`flex-1 overflow-y-auto reader-scroll bg-cream ${showChat ? 'hidden md:block' : ''}`}>
            <HabitTracker bookId={bookId} bookTitle={bookTitle} userId={user.id} />
          </div>
        )}
        {activeTab === 'practice' && !user?.id && (
          <div className="flex-1 flex items-center justify-center bg-cream text-muted text-sm">
            Sign in to track your practice habits.
          </div>
        )}

        {/* Reader panel */}
        <div className={`flex-1 overflow-y-auto reader-scroll transition-all duration-300 ${activeTab !== 'chapters' ? 'hidden' : ''} ${showChat ? 'hidden md:block' : ''}`}>
          {unlocked ? (
            <article className="max-w-2xl mx-auto px-6 md:px-12 py-12">
              {/* Commitment follow-up banner */}
              {pendingFollowUp && !followUpDismissed && (
                <div className="mb-6 bg-warm-gray border border-border-strong rounded-2xl p-5 animate-message-in">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎯</span>
                      <span className="text-[11px] font-semibold text-gold/70 uppercase tracking-widest">Check-in</span>
                    </div>
                    <button onClick={() => setFollowUpDismissed(true)} className="text-muted hover:text-ink text-xs">Later</button>
                  </div>
                  <p className="text-sm text-ink/70 mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    You committed: <em>"{pendingFollowUp.commitment_text}"</em>
                  </p>
                  <p className="text-sm text-ink/80 font-medium mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    What happened?
                  </p>
                  <textarea
                    value={followUpInput}
                    onChange={e => setFollowUpInput(e.target.value)}
                    placeholder="I did it / I didn't get to it because..."
                    rows={2}
                    disabled={followUpLoading}
                    className="w-full bg-navy-light border border-border rounded-xl px-4 py-3 text-sm text-ink/80 placeholder:text-muted-soft outline-none focus:border-gold/40 transition-colors resize-none leading-relaxed disabled:opacity-50"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  />
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={handleFollowUpSubmit}
                      disabled={!followUpInput.trim() || followUpLoading}
                      className="flex items-center gap-2 bg-gold hover:bg-gold-light disabled:bg-warm-gray disabled:text-muted-soft text-navy font-semibold px-5 py-2.5 rounded-xl transition-all text-sm"
                    >
                      {followUpLoading ? (
                        <div className="w-4 h-4 border-2 border-ink/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        'Share what happened'
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Personalized intro */}
              {(personalizedIntro || introLoading) && (
                <div className="mb-10 bg-warm-gray border border-gold/15 rounded-2xl px-6 py-5">
                  <p className="text-[10px] text-gold/60 font-semibold tracking-[0.15em] uppercase mb-2">For you</p>
                  {introLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <div className="w-4 h-4 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                      Personalizing this chapter for you...
                    </div>
                  ) : (
                    <p className="text-sm text-ink/70 leading-relaxed italic" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                      {personalizedIntro}
                    </p>
                  )}
                </div>
              )}

              {/* Chapter header */}
              <div className="mb-12">
                <p className="text-xs text-muted font-semibold tracking-[0.15em] uppercase mb-3">Chapter {chapter.number}</p>
                <h1 className="text-3xl md:text-4xl font-bold text-ink leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  {chapter.title}
                </h1>
                <div className="w-12 h-0.5 bg-gold mt-6" />
              </div>

              {/* Content */}
              <div className="text-base text-ink/80" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                {renderText(chapter.content)}
              </div>

              {/* Exercise box */}
              {chapter.exerciseQuestion && (
                <ExerciseBox
                  key={`exercise-${chapter.number}`}
                  question={chapter.exerciseQuestion}
                  existingAnswer={reflections[chapter.number]}
                  existingCommitment={commitments[chapter.number]}
                  onSubmit={handleExerciseSubmit}
                  onCommitmentSubmit={user?.id ? handleCommitmentSubmit : undefined}
                  loading={exerciseLoading}
                />
              )}

              {/* Chapter navigation */}
              <div className="mt-16 pt-8 border-t border-border flex items-center justify-between">
                <button
                  onClick={() => navigateChapter(Math.max(0, currentChapter - 1))}
                  disabled={currentChapter === 0}
                  className="flex items-center gap-2 text-sm font-medium text-muted hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5m7 7-7-7 7-7"/></svg>
                  Previous
                </button>
                <span className="text-xs text-muted">{currentChapter + 1} / {chapters.length}</span>
                {currentChapter < chapters.length - 1 ? (
                  isChapterUnlocked(chapters[currentChapter + 1].number, progress) ? (
                    <button
                      onClick={() => navigateChapter(currentChapter + 1)}
                      className="flex items-center gap-2 text-sm font-medium text-muted hover:text-ink transition-colors"
                    >
                      Next
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                    </button>
                  ) : (
                    <span className="text-xs text-muted/50 flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      {(() => {
                        const d = getUnlockDate(chapters[currentChapter + 1].number, progress);
                        return d ? formatUnlockDate(d) : 'Read this chapter first';
                      })()}
                    </span>
                  )
                ) : (
                  <span className="text-xs text-muted/50">Final chapter</span>
                )}
              </div>
            </article>
          ) : (
            /* Locked chapter state */
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <div className="w-16 h-16 bg-warm-gray border border-border rounded-2xl flex items-center justify-center mb-6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A7A7A7" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <h2 className="text-xl font-semibold text-ink mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Chapter {chapter.number} is locked
              </h2>
              <p className="text-sm text-muted max-w-sm">
                {(() => {
                  const d = getUnlockDate(chapter.number, progress);
                  if (!d) return 'Read the previous chapter to unlock this one.';
                  return `This chapter unlocks ${formatUnlockDate(d).toLowerCase()}. Take time to absorb what you've read.`;
                })()}
              </p>
            </div>
          )}
        </div>

        {/* Floating chat FAB — mobile only, visible when chat is closed */}
        {!showChat && (
          <button
            onClick={() => setShowChat(true)}
            className="fixed bottom-20 right-4 z-40 md:hidden w-14 h-14 bg-gold rounded-full flex items-center justify-center shadow-lg shadow-gold/30 hover:bg-gold-light active:scale-95 transition-all"
            aria-label="Open AI Companion"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1A1410" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        )}

        {/* Feature 1: Active Recall Gate overlay */}
        {showRecallGate && recallChapter !== null && (() => {
          const recallCh = chapters.find(c => c.number === recallChapter);
          if (!recallCh) return null;
          return (
            <ActiveRecallGate
              chapterTitle={recallCh.title}
              chapterNumber={recallCh.number}
              chapterContent={recallCh.content}
              exerciseQuestion={recallCh.exerciseQuestion}
              bookId={bookId}
              userId={user?.id}
              onPass={() => {
                setShowRecallGate(false);
                setRecallChapter(null);
                // Auto-advance to next chapter if available
                const nextIdx = chapters.findIndex(c => c.number === recallChapter) + 1;
                if (nextIdx < chapters.length && isChapterUnlocked(chapters[nextIdx].number, progress)) {
                  navigateChapter(nextIdx);
                }
              }}
              onReRead={() => {
                setShowRecallGate(false);
                setRecallChapter(null);
              }}
            />
          );
        })()}

        {/* Feature 4: Personal Summary overlay */}
        {showPersonalSummary && user?.id && (
          <PersonalSummaryView
            bookId={bookId}
            bookTitle={bookTitle}
            userId={user.id}
            coverColor={coverColor || 'from-amber-600 to-orange-800'}
            onClose={() => setShowPersonalSummary(false)}
            userProfile={userProfile}
          />
        )}

        {/* AI Companion panel */}
        {showChat && (
          <div className="flex flex-col bg-navy-light border-l border-ink/10 z-10 w-full md:w-[380px] lg:w-[420px] shrink-0">
            <div className="px-4 py-3 border-b border-ink/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-gold/20 rounded-full flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C97D2E" strokeWidth="2"><path d="M12 2a7 7 0 0 1 7 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 0 1 7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-ink/90">AI Companion</p>
                  <p className="text-[10px] text-ink/40">Reading Ch. {chapter.number}</p>
                </div>
              </div>
              <button onClick={() => setShowChat(false)} className="text-ink/40 hover:text-ink/70 transition-colors p-1 md:hidden">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto reader-scroll px-4 py-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`animate-message-in ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[90%] ${
                    msg.role === 'user'
                      ? 'bg-gold/20 text-gold-light rounded-br-md'
                      : 'bg-ink/5 text-ink/80 rounded-bl-md'
                  }`}>
                    {renderChatText(msg.content)}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="animate-message-in">
                  <div className="bg-ink/5 rounded-2xl rounded-bl-md px-4 py-3 inline-flex gap-1.5">
                    <div className="w-2 h-2 bg-ink/30 rounded-full typing-dot" />
                    <div className="w-2 h-2 bg-ink/30 rounded-full typing-dot" />
                    <div className="w-2 h-2 bg-ink/30 rounded-full typing-dot" />
                  </div>
                </div>
              )}

              {/* Journey summary */}
              {showJourney && (
                <div className="animate-message-in">
                  <div className="bg-gold/10 border border-gold/20 rounded-2xl px-5 py-4">
                    <p className="text-[10px] font-semibold text-gold/60 uppercase tracking-widest mb-2">Your Journey</p>
                    {journeyLoading ? (
                      <div className="flex items-center gap-2 text-sm text-ink/50">
                        <div className="w-4 h-4 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                        Compiling your journey...
                      </div>
                    ) : (
                      <div className="text-sm text-ink/80 leading-relaxed">
                        {renderChatText(journeySummary || '')}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-ink/10">
              <div className="flex items-center gap-2 bg-ink/5 rounded-xl px-4 py-2.5">
                <input
                  ref={chatInputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={limitReached ? "Monthly limit reached" : "Ask about this chapter..."}
                  disabled={limitReached}
                  className="flex-1 bg-transparent text-sm text-ink/90 placeholder:text-ink/30 outline-none disabled:opacity-40"
                />
                {!limitReached && (
                  <MicButton 
                    currentText={input} 
                    onTextChange={setInput} 
                  />
                )}
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping || limitReached}
                  className="text-gold hover:text-gold-light disabled:text-ink/20 disabled:cursor-not-allowed transition-colors p-1"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                </button>
              </div>
              <p className="text-[10px] text-ink/20 text-center mt-2">Personalized to your journey</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
