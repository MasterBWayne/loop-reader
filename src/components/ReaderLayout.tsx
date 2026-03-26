'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { IntakeAnswers } from './IntakeForm';
import { ExerciseBox } from './ExerciseBox';
import { HabitTracker } from './HabitTracker';
import { MicButton } from './MicButton';
import {
  saveReflection, loadReflections, loadChapterReflection,
  saveCommitment, loadCommitment, loadPendingCommitments, markCommitmentFollowedUp,
  startReadingSession, endReadingSession, getChapterReadingTime,
  saveCoachingMessage, loadCoachingMessages,
  updateReadingStreak,
  createReviewCards, hasReviewCardsForChapter,
  type ReflectionRecord, type CommitmentRecord,
} from '@/lib/supabase';
import { ActiveRecallGate } from './ActiveRecallGate';
import { PersonalSummaryView } from './PersonalSummaryView';
import { ExerciseHistory } from './ExerciseHistory';
import { useSoulGraph } from '@/lib/SoulGraphProvider';
import { trackExerciseCompleted } from '@/lib/soulGraph';

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
  const { sgUserId } = useSoulGraph();
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

  // Week 3-4: Reading Session Tracking
  const [readingSessionId, setReadingSessionId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [chapterReadTime, setChapterReadTime] = useState<number | null>(null);
  const [showReadTimeToast, setShowReadTimeToast] = useState(false);

  // Week 3-4: Coaching Message History
  const [coachingHistoryLoaded, setCoachingHistoryLoaded] = useState(false);

  // Week 3-4: Exercise Response History (tab in nav)
  const [showExerciseHistory, setShowExerciseHistory] = useState(false);

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

      // Load pending commitments for follow-up banner (current book only)
      loadPendingCommitments(user.id).then(pending => {
        const bookPending = pending.filter(c => c.book_id === bookId);
        if (bookPending.length > 0) {
          setPendingFollowUp(bookPending[0]);
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

        // Load previous reading time for this chapter
        getChapterReadingTime(user.id, bookId, chapter.number).then(seconds => {
          setChapterReadTime(seconds);
        });
      }
    } else {
      setPersonalizedIntro(null);
    }
  }, [currentChapter, unlocked, user?.id, bookId, chapter.number]);

  // Week 3-4: Reading Session Tracking — start/stop session on chapter change
  useEffect(() => {
    if (!user?.id || !unlocked) return;

    // End previous session
    if (readingSessionId && sessionStartTime) {
      const durationSec = Math.round((Date.now() - sessionStartTime) / 1000);
      if (durationSec > 5) { // only save sessions > 5 seconds
        const wordCount = chapter.content ? chapter.content.split(/\s+/).length : 0;
        const wpm = durationSec > 0 && wordCount > 0 ? Math.round((wordCount / durationSec) * 60) : undefined;
        endReadingSession(readingSessionId, durationSec, wpm, 100);
      }
    }

    // Start new session
    setSessionStartTime(Date.now());
    setShowReadTimeToast(false);
    startReadingSession(user.id, bookId, chapter.number).then(id => {
      setReadingSessionId(id);
    });

    // Update reading streak
    updateReadingStreak(user.id);

    // Cleanup: end session on unmount
    return () => {
      // We capture in the effect cleanup, but sessionId may be stale
      // The next render will handle ending the session
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChapter, user?.id, bookId, unlocked]);

  // Week 3-4: Load coaching message history on mount
  useEffect(() => {
    if (!user?.id || coachingHistoryLoaded) return;
    loadCoachingMessages(user.id, bookId, 20).then(history => {
      if (history.length > 0) {
        const historyMessages: Message[] = history.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));
        // Prepend history before the welcome message, then add welcome
        setMessages(prev => {
          const welcome = prev[0]; // Keep the welcome message
          return [...historyMessages, welcome];
        });
      }
      setCoachingHistoryLoaded(true);
    });
  }, [user?.id, bookId, coachingHistoryLoaded]);

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

    // Soul Graph: track exercise completion
    if (sgUserId) {
      trackExerciseCompleted(sgUserId, {
        book_id: bookId,
        chapter_number: chapter.number,
        exercise_type: 'reflection',
        response_word_count: answer.split(/\s+/).length,
      });
    }

    // Generate spaced repetition review cards (fire and forget)
    if (user?.id && chapter.content) {
      hasReviewCardsForChapter(user.id, bookId, chapter.number).then(async (exists) => {
        if (exists) return;
        try {
          const res = await fetch('/api/review-cards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chapterTitle: chapter.title,
              chapterContent: chapter.content,
              exerciseQuestion: chapter.exerciseQuestion,
            }),
          });
          const data = await res.json();
          if (data.cards?.length > 0) {
            await createReviewCards(user.id, bookId, chapter.number, data.cards);
          }
        } catch (e) { console.error('Review card generation error:', e); }
      });
    }

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

    // Persist user message to coaching_messages
    if (user?.id) {
      saveCoachingMessage(user.id, bookId, chapter.number, 'user', userMsg);
    }

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

      // Persist assistant response to coaching_messages
      if (user?.id && data.response) {
        saveCoachingMessage(user.id, bookId, chapter.number, 'assistant', data.response);
      }
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

    // End current reading session and show toast
    if (readingSessionId && sessionStartTime && user?.id) {
      const durationSec = Math.round((Date.now() - sessionStartTime) / 1000);
      if (durationSec > 5) {
        const wordCount = chapter.content ? chapter.content.split(/\s+/).length : 0;
        const wpm = durationSec > 0 && wordCount > 0 ? Math.round((wordCount / durationSec) * 60) : undefined;
        endReadingSession(readingSessionId, durationSec, wpm, 100);
        setChapterReadTime(durationSec);
        setShowReadTimeToast(true);
        setTimeout(() => setShowReadTimeToast(false), 5000);
      }
      setReadingSessionId(null);
      setSessionStartTime(null);
    }

    setCurrentChapter(index);
    setShowNav(false);
    setPersonalizedIntro(null);
    setShowExerciseHistory(false);
  };

  const renderText = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.trim() === '') return <br key={i} />;
      if (line.startsWith('**') && line.endsWith('**')) {
        return <h3 key={i} className="text-base font-semibold mt-6 mb-3 text-heading">{line.slice(2, -2)}</h3>;
      }
      if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**')) {
        return <p key={i} className="italic text-muted my-4 pl-4 border-l-2 border-gold/30">{line.slice(1, -1)}</p>;
      }
      return <p key={i} className="mb-5 leading-[1.8]">{line}</p>;
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
    <div className="h-screen flex flex-col bg-[#111111]">
      {/* Top bar */}
      <header className="bg-[#111111] border-b border-[rgba(255,255,255,0.06)] px-4 py-3 flex items-center justify-between shrink-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowNav(!showNav)} className="text-[#999999] hover:text-[#E8E8E8] transition-colors p-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>
          <div>
            <p className="text-xs text-gold/80 font-medium tracking-wide">{bookTitle}</p>
            <p className="text-sm text-[#E8E8E8] font-medium">Ch. {chapter.number}: {chapter.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#666666] mr-2 hidden sm:block">{currentChapter + 1} of {chapters.length}</span>
          {/* Feature 4: Living Summary button */}
          {user?.id && (
            <button
              onClick={() => setShowPersonalSummary(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[rgba(255,255,255,0.05)] text-[#999999] hover:bg-[rgba(255,255,255,0.1)] hover:text-[#E8E8E8] transition-all hidden sm:flex"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
              My {bookTitle.length > 15 ? bookTitle.slice(0, 15) + '...' : bookTitle}
            </button>
          )}
          <button
            onClick={() => setShowChat(!showChat)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${showChat ? 'bg-gold text-[#111111]' : 'bg-[rgba(255,255,255,0.05)] text-[#999999] hover:bg-[rgba(255,255,255,0.1)] hover:text-[#E8E8E8]'}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            AI Companion
          </button>
        </div>
      </header>

      {/* Tab switcher: Chapters | Practice | My Responses */}
      <div className="bg-[#111111] border-b border-[rgba(255,255,255,0.08)] px-4 flex gap-1 shrink-0">
        <button
          onClick={() => { setActiveTab('chapters'); setShowExerciseHistory(false); }}
          className={`px-4 py-2 text-xs font-medium transition-all border-b-2 ${
            activeTab === 'chapters' && !showExerciseHistory
              ? 'text-gold border-gold'
              : 'text-[#999999] border-transparent hover:text-[#E8E8E8]'
          }`}
        >
          Chapters
        </button>
        <button
          onClick={() => { setActiveTab('practice'); setShowExerciseHistory(false); }}
          className={`px-4 py-2 text-xs font-medium transition-all border-b-2 ${
            activeTab === 'practice'
              ? 'text-gold border-gold'
              : 'text-[#999999] border-transparent hover:text-[#E8E8E8]'
          }`}
        >
          Practice
        </button>
        {user?.id && (
          <button
            onClick={() => { setShowExerciseHistory(true); setActiveTab('chapters'); }}
            className={`px-4 py-2 text-xs font-medium transition-all border-b-2 ${
              showExerciseHistory
                ? 'text-gold border-gold'
                : 'text-[#999999] border-transparent hover:text-[#E8E8E8]'
            }`}
          >
            My Responses
          </button>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Chapter nav sidebar */}
        {showNav && (
          <>
            <div className="fixed inset-0 bg-black/20 z-20 md:hidden" onClick={() => setShowNav(false)} />
            <aside className="absolute md:relative left-0 top-0 bottom-0 w-64 bg-[#1C1C1C] border-r border-[rgba(255,255,255,0.08)] z-20 overflow-y-auto">
              <div className="p-4">
                {onBackToLibrary && (
                  <button
                    onClick={onBackToLibrary}
                    className="flex items-center gap-2 text-xs text-gold hover:text-gold-light mb-4 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5m7 7-7-7 7-7"/></svg>
                    Back to Library
                  </button>
                )}
                <p className="text-[11px] text-[#999999] font-semibold tracking-[0.1em] uppercase mb-4">Chapters</p>
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
                            ? 'text-[#999999]/30 cursor-not-allowed'
                            : i === currentChapter
                            ? 'bg-[rgba(201,125,46,0.15)] text-gold font-medium'
                            : 'text-[#999999] hover:text-[#E8E8E8] hover:bg-[rgba(255,255,255,0.05)]'
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
          <div className={`flex-1 overflow-y-auto reader-scroll bg-[#111111] ${showChat ? 'hidden md:block' : ''}`}>
            <HabitTracker bookId={bookId} bookTitle={bookTitle} userId={user.id} />
          </div>
        )}
        {activeTab === 'practice' && !user?.id && (
          <div className="flex-1 flex items-center justify-center bg-[#111111] text-[#999999] text-sm">
            Sign in to track your practice habits.
          </div>
        )}

        {/* Exercise Response History panel */}
        {showExerciseHistory && user?.id && (
          <div className={`flex-1 overflow-y-auto reader-scroll bg-[#111111] ${showChat ? 'hidden md:block' : ''}`}>
            <div className="max-w-[740px] mx-auto">
              <ExerciseHistory userId={user.id} bookId={bookId} chapters={chapters} />
            </div>
          </div>
        )}

        {/* Reading time toast */}
        {showReadTimeToast && chapterReadTime && chapterReadTime > 5 && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#252525] border border-gold/30 rounded-xl px-5 py-3 shadow-lg animate-message-in flex items-center gap-2">
            <span className="text-lg">📖</span>
            <span className="text-sm text-[#E8E8E8]">
              You read that in <span className="text-gold font-semibold">
                {chapterReadTime >= 60 
                  ? `${Math.floor(chapterReadTime / 60)} min${chapterReadTime >= 120 ? 's' : ''}`
                  : `${chapterReadTime} sec`}
              </span>
            </span>
            <button onClick={() => setShowReadTimeToast(false)} className="text-[#666666] hover:text-[#999999] ml-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        )}

        {/* Reader panel */}
        <div className={`flex-1 overflow-y-auto reader-scroll transition-all duration-300 ${activeTab !== 'chapters' || showExerciseHistory ? 'hidden' : ''} ${showChat ? 'hidden md:block' : ''}`}>
          {unlocked ? (
            <article className="max-w-[740px] mx-auto px-4 md:px-6 py-12">
              {/* Personalized intro — subtle, blends with page */}
              {(personalizedIntro || introLoading) && (
                <div className="mb-8 pl-4 border-l-2 border-gold/20">
                  {introLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted/60">
                      <div className="w-3.5 h-3.5 border-2 border-gold/20 border-t-gold/60 rounded-full animate-spin" />
                      Personalizing...
                    </div>
                  ) : (
                    <p className="text-[15px] text-ink/50 leading-relaxed italic" style={{ fontFamily: "var(--rk-font-heading)" }}>
                      {personalizedIntro}
                    </p>
                  )}
                </div>
              )}

              {/* Chapter header */}
              <div className="mb-8" style={{ marginBottom: '32px' }}>
                <div className="flex items-center gap-3 mb-3">
                  <p className="text-[11px] text-[#999999] font-semibold tracking-[0.1em] uppercase">Chapter {chapter.number}</p>
                  {chapterReadTime && chapterReadTime > 5 && (
                    <span className="text-[10px] text-gold/60 bg-gold/10 px-2 py-0.5 rounded-full">
                      📖 Read in {chapterReadTime >= 60
                        ? `${Math.floor(chapterReadTime / 60)} min${chapterReadTime >= 120 ? 's' : ''}`
                        : `${chapterReadTime} sec`}
                    </span>
                  )}
                </div>
                <h1 className="text-[28px] font-semibold text-heading leading-[1.3]" style={{ fontFamily: "var(--rk-font-heading)" }}>
                  {chapter.title}
                </h1>
                <div className="w-12 h-[3px] bg-gold mt-6 rounded-full" />
              </div>

              {/* Content */}
              <div className="text-[17px] text-[#E8E8E8] max-w-[680px]" style={{ fontFamily: "var(--rk-font-body)", lineHeight: '1.8' }}>
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

              {/* Commitment follow-up — only on the chapter it belongs to */}
              {pendingFollowUp && !followUpDismissed && pendingFollowUp.chapter_number === chapter.number && (
                <div className="mt-10 bg-[#252525] border border-[rgba(201,125,46,0.3)] rounded-xl p-5 pl-7 border-l-[3px] border-l-gold animate-message-in">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎯</span>
                      <span className="text-[11px] font-semibold text-[#999999] uppercase tracking-[0.1em]">Check-in</span>
                    </div>
                    <button onClick={() => setFollowUpDismissed(true)} className="text-[#999999] hover:text-[#E8E8E8] text-xs">Later</button>
                  </div>
                  <p className="text-sm text-[#E8E8E8]/70 mb-2" style={{ fontFamily: "var(--rk-font-heading)" }}>
                    You committed: <em className="text-gold-light">"{pendingFollowUp.commitment_text}"</em>
                  </p>
                  <p className="text-sm text-[#E8E8E8] font-medium mb-3" style={{ fontFamily: "var(--rk-font-heading)" }}>
                    What happened?
                  </p>
                  <textarea
                    value={followUpInput}
                    onChange={e => setFollowUpInput(e.target.value)}
                    placeholder="I did it / I didn't get to it because..."
                    rows={2}
                    disabled={followUpLoading}
                    className="w-full bg-[#2A2A2A] border border-[rgba(255,255,255,0.12)] rounded-lg px-4 py-3 text-sm text-[#E8E8E8] placeholder:text-[#666666] outline-none focus:border-gold transition-colors resize-none leading-relaxed disabled:opacity-50"
                    style={{ fontFamily: "var(--rk-font-heading)" }}
                  />
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={handleFollowUpSubmit}
                      disabled={!followUpInput.trim() || followUpLoading}
                      className="flex items-center gap-2 bg-gold hover:bg-gold-light disabled:bg-[#2A2A2A] disabled:text-[#666666] text-[#111111] font-semibold px-5 py-2.5 rounded-xl transition-all text-sm"
                    >
                      {followUpLoading ? (
                        <div className="w-4 h-4 border-2 border-[#111111]/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        'Share what happened'
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Chapter navigation */}
              <div className="mt-16 pt-8 border-t border-[rgba(255,255,255,0.08)] flex items-center justify-between">
                <button
                  onClick={() => navigateChapter(Math.max(0, currentChapter - 1))}
                  disabled={currentChapter === 0}
                  className="flex items-center gap-2 text-sm font-medium text-[#999999] hover:text-[#E8E8E8] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5m7 7-7-7 7-7"/></svg>
                  Previous
                </button>
                <span className="text-xs text-[#999999]">{currentChapter + 1} / {chapters.length}</span>
                {currentChapter < chapters.length - 1 ? (
                  isChapterUnlocked(chapters[currentChapter + 1].number, progress) ? (
                    <button
                      onClick={() => navigateChapter(currentChapter + 1)}
                      className="flex items-center gap-2 text-sm font-medium text-[#999999] hover:text-[#E8E8E8] transition-colors"
                    >
                      Next
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                    </button>
                  ) : (
                    <span className="text-xs text-[#666666] flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      {(() => {
                        const d = getUnlockDate(chapters[currentChapter + 1].number, progress);
                        return d ? formatUnlockDate(d) : 'Read this chapter first';
                      })()}
                    </span>
                  )
                ) : (
                  <span className="text-xs text-[#666666]">Final chapter</span>
                )}
              </div>
            </article>
          ) : (
            /* Locked chapter state */
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <div className="w-16 h-16 bg-[#1C1C1C] border border-[rgba(255,255,255,0.08)] rounded-2xl flex items-center justify-center mb-6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666666" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <h2 className="text-xl font-semibold text-heading mb-2" style={{ fontFamily: "var(--rk-font-heading)" }}>
                Chapter {chapter.number} is locked
              </h2>
              <p className="text-sm text-[#999999] max-w-sm">
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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          <div className="flex flex-col bg-[#1C1C1C] border-l border-[rgba(255,255,255,0.08)] z-10 w-full md:w-[380px] lg:w-[420px] shrink-0">
            <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-[rgba(201,125,46,0.15)] rounded-full flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C97D2E" strokeWidth="2"><path d="M12 2a7 7 0 0 1 7 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 0 1 7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#E8E8E8]">AI Companion</p>
                  <p className="text-[10px] text-[#666666]">Reading Ch. {chapter.number}</p>
                </div>
              </div>
              <button onClick={() => setShowChat(false)} className="text-[#666666] hover:text-[#E8E8E8] transition-colors p-1 md:hidden">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto reader-scroll px-4 py-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`animate-message-in ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[90%] ${
                    msg.role === 'user'
                      ? 'bg-[rgba(201,125,46,0.15)] text-gold-light rounded-br-md'
                      : 'bg-[#252525] text-[#E8E8E8]/80 rounded-bl-md'
                  }`}>
                    {renderChatText(msg.content)}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="animate-message-in">
                  <div className="bg-[#252525] rounded-2xl rounded-bl-md px-4 py-3 inline-flex gap-1.5">
                    <div className="w-2 h-2 bg-[#999999]/30 rounded-full typing-dot" />
                    <div className="w-2 h-2 bg-[#999999]/30 rounded-full typing-dot" />
                    <div className="w-2 h-2 bg-[#999999]/30 rounded-full typing-dot" />
                  </div>
                </div>
              )}

              {/* Journey summary */}
              {showJourney && (
                <div className="animate-message-in">
                  <div className="bg-[rgba(201,125,46,0.12)] border border-[rgba(201,125,46,0.25)] rounded-2xl px-5 py-4">
                    <p className="text-[11px] font-semibold text-[#999999] uppercase tracking-[0.1em] mb-2">Your Journey</p>
                    {journeyLoading ? (
                      <div className="flex items-center gap-2 text-sm text-[#999999]">
                        <div className="w-4 h-4 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                        Compiling your journey...
                      </div>
                    ) : (
                      <div className="text-sm text-[#E8E8E8]/80 leading-relaxed">
                        {renderChatText(journeySummary || '')}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-[rgba(255,255,255,0.08)]">
              <div className="flex items-center gap-2 bg-[#2A2A2A] rounded-lg px-4 py-2.5 border border-[rgba(255,255,255,0.12)] focus-within:border-gold transition-colors">
                <input
                  ref={chatInputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={limitReached ? "Monthly limit reached" : "Ask about this chapter..."}
                  disabled={limitReached}
                  className="flex-1 bg-transparent text-sm text-[#E8E8E8] placeholder:text-[#666666] outline-none disabled:opacity-40"
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
                  className="text-gold hover:text-gold-light disabled:text-[#666666] disabled:cursor-not-allowed transition-colors p-1"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                </button>
              </div>
              <p className="text-[10px] text-[#666666] text-center mt-2">Personalized to your journey</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
