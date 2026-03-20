'use client';

import { useState } from 'react';

export type ReadingPace = 'guided' | 'free';

interface PaceSelectorProps {
  bookTitle: string;
  onSelect: (pace: ReadingPace) => void;
}

export function PaceSelector({ bookTitle, onSelect }: PaceSelectorProps) {
  const [selected, setSelected] = useState<ReadingPace | null>(null);

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md">
        <p className="text-xs text-gold/60 font-semibold tracking-[0.15em] uppercase mb-3 text-center">Before you begin</p>
        <h1 className="text-2xl font-bold text-white text-center mb-2" style={{ fontFamily: "'Lora', serif" }}>
          How do you want to read?
        </h1>
        <p className="text-sm text-white/40 text-center mb-10">
          Choose a pace for <span className="text-white/60">{bookTitle}</span>. You can change this later.
        </p>

        <div className="space-y-3">
          {/* Guided */}
          <button
            onClick={() => setSelected('guided')}
            className={`w-full text-left rounded-2xl border-2 p-5 transition-all duration-200 ${
              selected === 'guided'
                ? 'border-gold bg-gold/5'
                : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                selected === 'guided' ? 'bg-gold/20' : 'bg-white/5'
              }`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={selected === 'guided' ? '#c9a84c' : '#6b6b80'} strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div>
                <h3 className={`font-semibold text-sm mb-1 ${selected === 'guided' ? 'text-gold' : 'text-white/80'}`}>
                  Guided pace
                </h3>
                <p className="text-xs text-white/40 leading-relaxed">
                  One chapter unlocks each day so you have time to apply what you learn. Designed for deep absorption, not speed.
                </p>
              </div>
            </div>
          </button>

          {/* Free */}
          <button
            onClick={() => setSelected('free')}
            className={`w-full text-left rounded-2xl border-2 p-5 transition-all duration-200 ${
              selected === 'free'
                ? 'border-gold bg-gold/5'
                : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                selected === 'free' ? 'bg-gold/20' : 'bg-white/5'
              }`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={selected === 'free' ? '#c9a84c' : '#6b6b80'} strokeWidth="1.5">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              </div>
              <div>
                <h3 className={`font-semibold text-sm mb-1 ${selected === 'free' ? 'text-gold' : 'text-white/80'}`}>
                  Read freely
                </h3>
                <p className="text-xs text-white/40 leading-relaxed">
                  All chapters unlocked from the start. Read at your own speed, in any order.
                </p>
              </div>
            </div>
          </button>
        </div>

        <button
          onClick={() => selected && onSelect(selected)}
          disabled={!selected}
          className="w-full mt-8 bg-gold hover:bg-gold-light disabled:bg-white/10 disabled:text-white/30 text-navy font-semibold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
        >
          Start reading
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  );
}
