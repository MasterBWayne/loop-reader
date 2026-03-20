'use client';

import { useState, useRef, useEffect } from 'react';
import type { IntakeAnswers } from './IntakeForm';

interface Chapter {
  number: number;
  title: string;
  content: string;
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
}: ReaderLayoutProps) {
  const [currentChapter, setCurrentChapter] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [showNav, setShowNav] = useState(false);
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  const chapter = chapters[currentChapter];
  const unlocked = isChapterUnlocked(chapter.number, progress);

  // Track chapter open + fetch personalized intro
  useEffect(() => {
    if (unlocked) {
      onChapterOpen(chapter.number);
      fetchPersonalizedIntro();
    } else {
      setPersonalizedIntro(null);
    }
  }, [currentChapter, unlocked]);

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

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
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
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
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
          <button onClick={() => setShowNav(!showNav)} className="text-white/60 hover:text-white transition-colors p-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>
          <div>
            <p className="text-xs text-gold/80 font-medium tracking-wide">{bookTitle}</p>
            <p className="text-sm text-white/90 font-medium">Ch. {chapter.number}: {chapter.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40 mr-2 hidden sm:block">{currentChapter + 1} of {chapters.length}</span>
          <button
            onClick={() => setShowChat(!showChat)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${showChat ? 'bg-gold text-navy' : 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white'}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            AI Companion
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Chapter nav sidebar */}
        {showNav && (
          <>
            <div className="fixed inset-0 bg-black/20 z-20 md:hidden" onClick={() => setShowNav(false)} />
            <aside className="absolute md:relative left-0 top-0 bottom-0 w-64 bg-navy-light border-r border-white/10 z-20 overflow-y-auto">
              <div className="p-4">
                {onBackToLibrary && (
                  <button
                    onClick={onBackToLibrary}
                    className="flex items-center gap-2 text-xs text-white/40 hover:text-white/70 mb-4 transition-colors"
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
                            ? 'text-white/20 cursor-not-allowed'
                            : i === currentChapter
                            ? 'bg-gold/15 text-gold font-medium'
                            : 'text-white/50 hover:text-white/80 hover:bg-white/5'
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
                          <span className="text-[10px] text-white/15 ml-5 block mt-0.5">
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

        {/* Reader panel */}
        <div className={`flex-1 overflow-y-auto reader-scroll transition-all duration-300 ${showChat ? 'hidden md:block' : ''}`}>
          {unlocked ? (
            <article className="max-w-2xl mx-auto px-6 md:px-12 py-12">
              {/* Personalized intro */}
              {(personalizedIntro || introLoading) && (
                <div className="mb-10 bg-gold/5 border border-gold/15 rounded-2xl px-6 py-5">
                  <p className="text-[10px] text-gold/60 font-semibold tracking-[0.15em] uppercase mb-2">For you</p>
                  {introLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <div className="w-4 h-4 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                      Personalizing this chapter for you...
                    </div>
                  ) : (
                    <p className="text-sm text-ink/70 leading-relaxed italic" style={{ fontFamily: "'Lora', serif" }}>
                      {personalizedIntro}
                    </p>
                  )}
                </div>
              )}

              {/* Chapter header */}
              <div className="mb-12">
                <p className="text-xs text-muted font-semibold tracking-[0.15em] uppercase mb-3">Chapter {chapter.number}</p>
                <h1 className="text-3xl md:text-4xl font-bold text-ink leading-tight" style={{ fontFamily: "'Lora', serif" }}>
                  {chapter.title}
                </h1>
                <div className="w-12 h-0.5 bg-gold mt-6" />
              </div>

              {/* Content */}
              <div className="text-base text-ink/80" style={{ fontFamily: "'Lora', serif" }}>
                {renderText(chapter.content)}
              </div>

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
              <div className="w-16 h-16 bg-white/80 border border-border rounded-2xl flex items-center justify-center mb-6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b6b80" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <h2 className="text-xl font-semibold text-ink mb-2" style={{ fontFamily: "'Lora', serif" }}>
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

        {/* AI Companion panel */}
        {showChat && (
          <div className="flex flex-col bg-navy-light border-l border-white/10 z-10 w-full md:w-[380px] lg:w-[420px] shrink-0">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-gold/20 rounded-full flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2"><path d="M12 2a7 7 0 0 1 7 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 0 1 7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white/90">AI Companion</p>
                  <p className="text-[10px] text-white/40">Reading Ch. {chapter.number}</p>
                </div>
              </div>
              <button onClick={() => setShowChat(false)} className="text-white/40 hover:text-white/70 transition-colors p-1 md:hidden">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto reader-scroll px-4 py-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`animate-message-in ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[90%] ${
                    msg.role === 'user'
                      ? 'bg-gold/20 text-gold-light rounded-br-md'
                      : 'bg-white/5 text-white/80 rounded-bl-md'
                  }`}>
                    {renderChatText(msg.content)}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="animate-message-in">
                  <div className="bg-white/5 rounded-2xl rounded-bl-md px-4 py-3 inline-flex gap-1.5">
                    <div className="w-2 h-2 bg-white/30 rounded-full typing-dot" />
                    <div className="w-2 h-2 bg-white/30 rounded-full typing-dot" />
                    <div className="w-2 h-2 bg-white/30 rounded-full typing-dot" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-white/10">
              <div className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-2.5">
                <input
                  ref={chatInputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about this chapter..."
                  className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/30 outline-none"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="text-gold hover:text-gold-light disabled:text-white/20 disabled:cursor-not-allowed transition-colors p-1"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                </button>
              </div>
              <p className="text-[10px] text-white/20 text-center mt-2">Personalized to your journey</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
