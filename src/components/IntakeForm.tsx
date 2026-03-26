'use client';

import { useState } from 'react';
import { MicButton } from './MicButton';

export type ReadingStyle = 'direct' | 'warm' | 'balanced';

export interface IntakeAnswers {
  struggle: string;
  duration: string;
  impact: string;
  tried: string;
  vision: string;
  readingStyle?: ReadingStyle;
}

const QUESTIONS = [
  {
    key: 'struggle' as const,
    label: 'What\'s your biggest struggle right now?',
    placeholder: 'The thing that keeps coming back, no matter what you do...',
    hint: 'Be specific. Not "stress"  --  what kind of stress? About what?',
  },
  {
    key: 'duration' as const,
    label: 'How long have you been dealing with this?',
    placeholder: 'A few months, years, as long as I can remember...',
    hint: 'There\'s no wrong answer. This helps us understand your pattern.',
  },
  {
    key: 'impact' as const,
    label: 'How is it impacting your life?',
    placeholder: 'My relationships, my sleep, my ability to be present...',
    hint: 'Where do you feel it most  --  work, relationships, health, sense of self?',
  },
  {
    key: 'tried' as const,
    label: 'What have you already tried?',
    placeholder: 'Therapy, journaling, meditation, self-help books, just pushing through...',
    hint: 'This isn\'t a test. Knowing what hasn\'t worked tells us what might.',
  },
  {
    key: 'vision' as const,
    label: 'What does your ideal life look like?',
    placeholder: 'I want to wake up without dread. I want to feel like enough...',
    hint: 'Don\'t censor yourself. Paint the picture.',
  },
];

interface IntakeFormProps {
  onComplete: (answers: IntakeAnswers) => void;
  onSkip?: () => void;
}

export function IntakeForm({ onComplete, onSkip }: IntakeFormProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<IntakeAnswers>({
    struggle: '',
    duration: '',
    impact: '',
    tried: '',
    vision: '',
    readingStyle: undefined,
  });
  const [isTransitioning, setIsTransitioning] = useState(false);

  const TOTAL_STEPS = QUESTIONS.length + 1; // +1 for reading style
  const isStyleStep = step === QUESTIONS.length;
  const question = isStyleStep ? null : QUESTIONS[step];
  const currentAnswer = isStyleStep ? (answers.readingStyle || '') : (question ? answers[question.key] : '');
  const isLast = step === TOTAL_STEPS - 1;

  const handleNext = () => {
    if (!currentAnswer.trim()) return;

    if (isLast) {
      onComplete(answers);
      return;
    }

    setIsTransitioning(true);
    setTimeout(() => {
      setStep(s => s + 1);
      setIsTransitioning(false);
    }, 200);
  };

  const handleBack = () => {
    if (step === 0) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setStep(s => s - 1);
      setIsTransitioning(false);
    }, 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleNext();
    }
  };

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6">
      {/* Progress */}
      <div className="w-full max-w-md mb-12">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-ink/30 font-medium">Step {step + 1} of {TOTAL_STEPS}</span>
          <span className="text-xs text-gold/60 font-medium">{Math.round(((step + 1) / TOTAL_STEPS) * 100)}%</span>
        </div>
        <div className="h-1 bg-ink/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gold rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div
        className={`w-full max-w-md transition-all duration-200 ${
          isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
        }`}
      >
        <p className="text-xs text-gold/70 font-semibold tracking-[0.15em] uppercase mb-4">{isStyleStep ? 'Almost done' : 'Before we begin'}</p>

        {isStyleStep ? (
          <>
            <h2 className="text-2xl font-semibold text-heading mb-3 leading-snug" style={{ fontFamily: "'Lora', serif" }}>
              How do you prefer to be coached?
            </h2>
            <p className="text-sm text-muted mb-6">This adjusts how the AI talks to you throughout every book.</p>
            <div className="space-y-3">
              {([
                { value: 'direct' as const, emoji: '🎯', label: 'Direct and practical', desc: '"Here\'s what to do — no hand-holding."' },
                { value: 'warm' as const, emoji: '🤗', label: 'Gentle and reflective', desc: '"Let\'s explore what\'s underneath together."' },
                { value: 'balanced' as const, emoji: '⚖️', label: 'Mix of both', desc: '"Read the room — sometimes push, sometimes hold."' },
              ]).map(style => (
                <button
                  key={style.value}
                  onClick={() => setAnswers({ ...answers, readingStyle: style.value })}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                    answers.readingStyle === style.value
                      ? 'border-gold bg-gold/10 shadow-sm'
                      : 'border-border hover:border-muted bg-warm-gray/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{style.emoji}</span>
                    <div>
                      <p className="font-semibold text-sm text-ink">{style.label}</p>
                      <p className="text-xs text-muted mt-0.5">{style.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : question ? (
          <>
            <h2 className="text-2xl font-semibold text-heading mb-3 leading-snug" style={{ fontFamily: "'Lora', serif" }}>
              {question.label}
            </h2>
            <p className="text-sm text-muted mb-8">{question.hint}</p>
            <div className="relative">
              <textarea
                value={currentAnswer}
                onChange={(e) => {
                  setAnswers({ ...answers, [question.key]: e.target.value });
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                onKeyDown={handleKeyDown}
                placeholder={question.placeholder}
                autoFocus
                className="w-full min-h-[120px] bg-input-bg border border-border rounded-xl px-4 py-3.5 pb-10 text-sm text-ink placeholder:text-muted-soft outline-none focus:border-gold/60 transition-colors resize-none leading-relaxed overflow-y-auto"
              />
              <MicButton 
                currentText={currentAnswer} 
                onTextChange={(newText) => setAnswers({ ...answers, [question.key]: newText })} 
                className="absolute bottom-2 right-2" 
              />
            </div>
          </>
        ) : null}

        <div className="flex items-center justify-between mt-6">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className="text-sm text-ink/30 hover:text-ink/60 disabled:opacity-0 disabled:cursor-default transition-colors"
          >
            ← Back
          </button>

          <button
            onClick={handleNext}
            disabled={!currentAnswer.trim()}
            className="flex items-center gap-2 bg-gold hover:bg-gold-light disabled:bg-ink/10 disabled:text-ink/30 text-ink font-semibold px-6 py-2.5 rounded-lg transition-all text-sm"
          >
            {isLast ? 'Start Reading' : 'Continue'}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
          </button>
        </div>

        {!isLast && (
          <p className="text-[10px] text-ink/20 text-center mt-8">⌘ + Enter to continue</p>
        )}

        {onSkip && (
          <button
            onClick={onSkip}
            className="block mx-auto mt-6 text-xs text-ink/30 hover:text-ink/50 transition-colors"
          >
            Skip for now &rarr;
          </button>
        )}
      </div>
    </div>
  );
}
