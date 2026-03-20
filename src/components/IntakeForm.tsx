'use client';

import { useState } from 'react';
import { MicButton } from './MicButton';

export interface IntakeAnswers {
  struggle: string;
  duration: string;
  impact: string;
  tried: string;
  vision: string;
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
}

export function IntakeForm({ onComplete }: IntakeFormProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<IntakeAnswers>({
    struggle: '',
    duration: '',
    impact: '',
    tried: '',
    vision: '',
  });
  const [isTransitioning, setIsTransitioning] = useState(false);

  const question = QUESTIONS[step];
  const currentAnswer = answers[question.key];
  const isLast = step === QUESTIONS.length - 1;

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
          <span className="text-xs text-white/30 font-medium">Question {step + 1} of {QUESTIONS.length}</span>
          <span className="text-xs text-gold/60 font-medium">{Math.round(((step + 1) / QUESTIONS.length) * 100)}%</span>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gold rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div
        className={`w-full max-w-md transition-all duration-200 ${
          isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
        }`}
      >
        <p className="text-xs text-gold/70 font-semibold tracking-[0.15em] uppercase mb-4">Before we begin</p>
        <h2
          className="text-2xl font-semibold text-white mb-3 leading-snug"
          style={{ fontFamily: "'Lora', serif" }}
        >
          {question.label}
        </h2>
        <p className="text-sm text-white/40 mb-8">{question.hint}</p>

        <div className="relative">
          <textarea
            value={currentAnswer}
            onChange={(e) => setAnswers({ ...answers, [question.key]: e.target.value })}
            onKeyDown={handleKeyDown}
            placeholder={question.placeholder}
            autoFocus
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 pb-10 text-sm text-white/90 placeholder:text-white/25 outline-none focus:border-gold/40 transition-colors resize-none leading-relaxed"
          />
          <MicButton 
            currentText={currentAnswer} 
            onTextChange={(newText) => setAnswers({ ...answers, [question.key]: newText })} 
            className="absolute bottom-2 right-2" 
          />
        </div>

        <div className="flex items-center justify-between mt-6">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className="text-sm text-white/30 hover:text-white/60 disabled:opacity-0 disabled:cursor-default transition-colors"
          >
            ← Back
          </button>

          <button
            onClick={handleNext}
            disabled={!currentAnswer.trim()}
            className="flex items-center gap-2 bg-gold hover:bg-gold-light disabled:bg-white/10 disabled:text-white/30 text-navy font-semibold px-6 py-2.5 rounded-lg transition-all text-sm"
          >
            {isLast ? 'Start Reading' : 'Continue'}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
          </button>
        </div>

        {!isLast && (
          <p className="text-[10px] text-white/20 text-center mt-8">⌘ + Enter to continue</p>
        )}
      </div>
    </div>
  );
}
