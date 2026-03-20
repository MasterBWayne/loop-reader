'use client';

import { useState, useRef, useEffect } from 'react';

interface Chapter {
  number: number;
  title: string;
  content: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ReaderLayoutProps {
  chapters: Chapter[];
  bookTitle: string;
}

export function ReaderLayout({ chapters, bookTitle }: ReaderLayoutProps) {
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  const chapter = chapters[currentChapter];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus chat input when panel opens
  useEffect(() => {
    if (showChat) {
      setTimeout(() => chatInputRef.current?.focus(), 300);
    }
  }, [showChat]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    // Simulated AI response (will be replaced with real API call)
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `That's a great question. Let me think about this in the context of "${chapter.title}"...\n\nThe key insight here connects to what you're reading about — the pattern of reaching for the next thing before fully absorbing where you are now.\n\n*What specifically about this resonated with you?*`,
        },
      ]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Render markdown-lite (bold, italic, line breaks)
  const renderText = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.trim() === '') return <br key={i} />;

      // Headers
      if (line.startsWith('**') && line.endsWith('**')) {
        return <h3 key={i} className="text-lg font-semibold mt-8 mb-3 text-ink">{line.slice(2, -2)}</h3>;
      }

      // Italic lines (exercises)
      if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**')) {
        return <p key={i} className="italic text-muted my-4 pl-4 border-l-2 border-gold/30">{line.slice(1, -1)}</p>;
      }

      return <p key={i} className="mb-4 leading-[1.85]">{line}</p>;
    });
  };

  const renderChatText = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.trim() === '') return <br key={i} />;
      // Inline italic
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

  return (
    <div className="h-screen flex flex-col bg-cream">
      {/* Top bar */}
      <header className="bg-navy px-4 py-3 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNav(!showNav)}
            className="text-white/60 hover:text-white transition-colors p-1"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>
          <div>
            <p className="text-xs text-gold/80 font-medium tracking-wide">{bookTitle}</p>
            <p className="text-sm text-white/90 font-medium">Chapter {chapter.number}: {chapter.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Progress */}
          <span className="text-xs text-white/40 mr-2 hidden sm:block">
            {currentChapter + 1} of {chapters.length}
          </span>

          {/* AI Companion toggle */}
          <button
            onClick={() => setShowChat(!showChat)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showChat
                ? 'bg-gold text-navy'
                : 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            AI Companion
          </button>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Chapter navigation sidebar */}
        {showNav && (
          <>
            <div className="fixed inset-0 bg-black/20 z-20 md:hidden" onClick={() => setShowNav(false)} />
            <aside className="absolute md:relative left-0 top-0 bottom-0 w-64 bg-navy-light border-r border-white/10 z-20 overflow-y-auto">
              <div className="p-4">
                <p className="text-xs text-gold/60 font-semibold tracking-[0.15em] uppercase mb-4">Chapters</p>
                <div className="space-y-1">
                  {chapters.map((ch, i) => (
                    <button
                      key={ch.number}
                      onClick={() => { setCurrentChapter(i); setShowNav(false); }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        i === currentChapter
                          ? 'bg-gold/15 text-gold font-medium'
                          : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                      }`}
                    >
                      <span className="text-xs opacity-50 mr-2">{ch.number}.</span>
                      {ch.title}
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          </>
        )}

        {/* Reader panel */}
        <div className={`flex-1 overflow-y-auto reader-scroll transition-all duration-300 ${showChat ? 'hidden md:block' : ''}`}>
          <article className="max-w-2xl mx-auto px-6 md:px-12 py-12">
            {/* Chapter header */}
            <div className="mb-12">
              <p className="text-xs text-muted font-semibold tracking-[0.15em] uppercase mb-3">Chapter {chapter.number}</p>
              <h1 className="text-3xl md:text-4xl font-bold text-ink leading-tight" style={{ fontFamily: "'Lora', serif" }}>
                {chapter.title}
              </h1>
              <div className="w-12 h-0.5 bg-gold mt-6" />
            </div>

            {/* Chapter content */}
            <div className="text-base text-ink/80" style={{ fontFamily: "'Lora', serif" }}>
              {renderText(chapter.content)}
            </div>

            {/* Chapter navigation */}
            <div className="mt-16 pt-8 border-t border-border flex items-center justify-between">
              <button
                onClick={() => setCurrentChapter(Math.max(0, currentChapter - 1))}
                disabled={currentChapter === 0}
                className="flex items-center gap-2 text-sm font-medium text-muted hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5m7 7-7-7 7-7"/></svg>
                Previous
              </button>

              <span className="text-xs text-muted">
                {currentChapter + 1} / {chapters.length}
              </span>

              <button
                onClick={() => setCurrentChapter(Math.min(chapters.length - 1, currentChapter + 1))}
                disabled={currentChapter === chapters.length - 1}
                className="flex items-center gap-2 text-sm font-medium text-muted hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
              </button>
            </div>
          </article>
        </div>

        {/* AI Companion panel */}
        {showChat && (
          <div className={`flex flex-col bg-navy-light border-l border-white/10 z-10 w-full md:w-[380px] lg:w-[420px] shrink-0`}>
            {/* Chat header */}
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-gold/20 rounded-full flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2"><path d="M12 2a7 7 0 0 1 7 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 0 1 7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white/90">AI Companion</p>
                  <p className="text-[10px] text-white/40">Reading Chapter {chapter.number}</p>
                </div>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="text-white/40 hover:text-white/70 transition-colors p-1 md:hidden"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto reader-scroll px-4 py-4 space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`animate-message-in ${msg.role === 'user' ? 'flex justify-end' : ''}`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[90%] ${
                      msg.role === 'user'
                        ? 'bg-gold/20 text-gold-light rounded-br-md'
                        : 'bg-white/5 text-white/80 rounded-bl-md'
                    }`}
                  >
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

            {/* Input */}
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
              <p className="text-[10px] text-white/20 text-center mt-2">
                AI responses are personalized to your journey
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
