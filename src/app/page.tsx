'use client';

import { useState, useEffect } from 'react';
import { ReaderLayout } from '@/components/ReaderLayout';
import { IntakeForm, type IntakeAnswers } from '@/components/IntakeForm';

// Demo book content — will be replaced with Supabase data
const DEMO_CHAPTERS = [
  {
    number: 1,
    title: 'The 95% Illusion',
    content: `You've done everything right.

The degree. The career. The apartment. The body. The travel. The friends. You checked every box that was supposed to make life feel complete.

And yet here you are at 2am, staring at the ceiling, wondering why it still doesn't feel like enough.

This is the 95% illusion — the belief that if you just accomplish the next thing, fill the next gap, optimize the next system, the restlessness will finally stop.

It won't.

Not because something is wrong with you. But because the last 5% isn't a checklist item. It can't be earned, optimized, or hacked. It requires something most high performers have never learned to do: stop performing.

**The Pattern**

Think about the last time you felt genuinely at peace. Not the dopamine hit of a completed project. Not the relief of a crisis averted. Actual peace — the kind where your mind goes quiet and you don't reach for your phone to fill the silence.

If you're struggling to remember, that's the signal.

High performers develop a specific addiction: the addiction to progress. Every problem is a puzzle. Every emotion is data. Every relationship is a system to optimize. And for a long time, this works. It gets you further than most people will ever go.

But eventually you hit a wall that systems can't solve. A loneliness that productivity can't fill. A hunger that achievement can't satisfy.

That wall is the entrance to the last 5%.

**The Uncomfortable Truth**

The things that got you to 95% — discipline, optimization, relentless execution — are precisely the things blocking the final 5%.

You can't optimize your way into love.
You can't discipline yourself into meaning.
You can't execute your way into peace.

This isn't a productivity problem. It's an identity problem. You've built your entire sense of self around being the person who figures things out. The person who handles it. The person who doesn't need help.

And now you're stuck — because the next level requires becoming someone who can receive, who can surrender, who can sit in uncertainty without immediately trying to solve it.

**Your First Exercise**

Before you turn to the next chapter, sit with this question for sixty seconds. Don't answer it. Don't analyze it. Just let it land:

*What would I do with my time if I had nothing left to prove?*

Write whatever comes up. Don't edit it. Don't judge it. This is the starting point.`,
  },
  {
    number: 2,
    title: 'You Are Not The Roommate',
    content: `There's a voice in your head that never stops talking.

It narrates your day. It judges your decisions. It replays conversations from three years ago and rehearses ones that haven't happened yet. It tells you that you should have said something different, done something better, been someone else.

Michael Singer calls this voice "the roommate."

Imagine you had an actual roommate who talked to you the way your mind talks to you. Someone who followed you everywhere, commenting on everything, criticizing every choice, catastrophizing every outcome.

You'd move out.

But you can't move out of your own head — so most people do something worse. They believe the roommate is them.

**The Separation**

The most important distinction you'll ever make is this: you are not your thoughts. You are the one who hears them.

Read that again.

You are not the voice. You are the awareness behind the voice. You are the space in which thoughts arise, exist briefly, and dissolve — if you let them.

The problem isn't that the voice exists. The problem is that you've been taking orders from it for your entire life.

It says "you're not good enough" and you believe it, so you overwork.
It says "they'll leave you" and you believe it, so you over-function.
It says "you need to control this" and you believe it, so you build another system.

**The Practice**

The practice isn't complicated. It's just hard.

When the voice speaks, notice it. Don't argue with it. Don't try to replace it with a positive affirmation. Don't analyze why it's saying what it's saying.

Just notice.

"Ah, the roommate is talking again."

That's it. That tiny gap between the thought and your awareness of the thought is everything. In that gap lives your freedom.

Every time you notice without engaging, the gap gets wider. The voice gets quieter. Not because you silenced it — but because you stopped giving it your attention, which is the only fuel it has.

**Why This Matters For The 95%**

Your restlessness, your inability to feel satisfied, your constant drive for more — these aren't character traits. They're the roommate's script.

The roommate is terrified of stillness because stillness means it loses power. So it keeps you busy. It keeps you optimizing. It keeps you in the future or the past — anywhere but here, right now, where you might discover that you're already whole.

The last 5% begins the moment you stop obeying the voice and start observing it.

*Exercise: For the next 24 hours, every time you catch yourself in a mental spiral — judgment, worry, comparison — simply say internally: "I notice I'm thinking." Nothing more. Count how many times this happens. The number will surprise you.*`,
  },
  {
    number: 3,
    title: 'The Approval Addiction',
    content: `Coming soon.

This chapter explores the roots of people-pleasing and the unconscious drive to earn love through usefulness.

*This chapter will be available when the book launches.*`,
  },
  {
    number: 4,
    title: 'The Fair Exchange Audit',
    content: `Coming soon.

*This chapter will be available when the book launches.*`,
  },
  {
    number: 5,
    title: 'Dissolving the Charge',
    content: `Coming soon.

*This chapter will be available when the book launches.*`,
  },
  {
    number: 6,
    title: 'The Optimization Trap',
    content: `Coming soon.

*This chapter will be available when the book launches.*`,
  },
  {
    number: 7,
    title: 'Breaking Anxious Attachment',
    content: `Coming soon.

*This chapter will be available when the book launches.*`,
  },
  {
    number: 8,
    title: 'The Q1 Matrix',
    content: `Coming soon.

*This chapter will be available when the book launches.*`,
  },
];

type AppState = 'landing' | 'intake' | 'reading';

const STORAGE_KEY_INTAKE = 'loop-reader-intake';
const STORAGE_KEY_PROGRESS = 'loop-reader-progress';

interface ChapterProgress {
  [chapterNumber: number]: {
    unlockedAt: string; // ISO date
    firstOpenedAt?: string;
  };
}

function getStoredIntake(): IntakeAnswers | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY_INTAKE);
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
}

function getStoredProgress(): ChapterProgress {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PROGRESS);
    return stored ? JSON.parse(stored) : {};
  } catch { return {}; }
}

function isChapterUnlocked(chapterNumber: number, progress: ChapterProgress): boolean {
  if (chapterNumber === 1) return true; // Ch1 always unlocked

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

export default function Home() {
  const [appState, setAppState] = useState<AppState>('landing');
  const [intake, setIntake] = useState<IntakeAnswers | null>(null);
  const [progress, setProgress] = useState<ChapterProgress>({});

  // Load persisted state
  useEffect(() => {
    const storedIntake = getStoredIntake();
    const storedProgress = getStoredProgress();
    if (storedIntake) setIntake(storedIntake);
    if (Object.keys(storedProgress).length > 0) setProgress(storedProgress);
  }, []);

  const handleIntakeComplete = (answers: IntakeAnswers) => {
    setIntake(answers);
    localStorage.setItem(STORAGE_KEY_INTAKE, JSON.stringify(answers));

    // Initialize chapter 1 progress
    const initialProgress: ChapterProgress = {
      1: { unlockedAt: new Date().toISOString(), firstOpenedAt: new Date().toISOString() },
    };
    setProgress(initialProgress);
    localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(initialProgress));

    setAppState('reading');
  };

  const handleChapterOpen = (chapterNumber: number) => {
    setProgress(prev => {
      const updated = { ...prev };
      if (!updated[chapterNumber]) {
        updated[chapterNumber] = {
          unlockedAt: new Date().toISOString(),
        };
      }
      if (!updated[chapterNumber].firstOpenedAt) {
        updated[chapterNumber].firstOpenedAt = new Date().toISOString();
      }
      localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(updated));
      return updated;
    });
  };

  const handleStartReading = () => {
    if (intake) {
      setAppState('reading');
    } else {
      setAppState('intake');
    }
  };

  if (appState === 'intake') {
    return <IntakeForm onComplete={handleIntakeComplete} />;
  }

  if (appState === 'reading') {
    return (
      <ReaderLayout
        chapters={DEMO_CHAPTERS}
        bookTitle="Stop Chasing"
        intake={intake!}
        progress={progress}
        onChapterOpen={handleChapterOpen}
        isChapterUnlocked={isChapterUnlocked}
        getUnlockDate={getUnlockDate}
      />
    );
  }

  // Landing page
  return (
    <main className="min-h-screen bg-navy text-white">
      <nav className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gold rounded flex items-center justify-center text-navy font-bold text-sm" style={{ fontFamily: "'Lora', serif" }}>A</div>
          <span className="text-sm font-medium tracking-wide text-white/80">THE ARCHITECT METHOD</span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
        <p className="text-gold text-xs font-semibold tracking-[0.2em] uppercase mb-6">Book One · The Architect Method</p>
        <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6" style={{ fontFamily: "'Lora', serif" }}>
          Stop Chasing
        </h1>
        <p className="text-lg text-white/60 max-w-lg mx-auto leading-relaxed mb-4" style={{ fontFamily: "'Lora', serif" }}>
          How to break free from the loops that keep high performers stuck — and find what the last 5% actually requires.
        </p>
        <p className="text-sm text-white/40 mb-10">8 chapters · ~45 min read · AI companion included</p>

        <button
          onClick={handleStartReading}
          className="inline-flex items-center gap-2 bg-gold hover:bg-gold-light text-navy font-bold px-8 py-3.5 rounded-lg transition-colors text-sm tracking-wide"
        >
          {intake ? 'Continue Reading' : 'Start Reading'}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
        </button>

        {intake && (
          <p className="text-xs text-gold/50 mt-3">Welcome back — your progress is saved</p>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: '📖', title: 'Read at your pace', desc: 'One chapter unlocks per day. No rush. Deep absorption over speed.' },
            { icon: '🤖', title: 'AI companion', desc: 'Ask questions, get personalized insights. Your private thinking partner.' },
            { icon: '🔄', title: 'Personalized to you', desc: 'The AI adapts to your specific situation, not generic advice.' },
          ].map((f, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-sm mb-1.5">{f.title}</h3>
              <p className="text-xs text-white/50 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
