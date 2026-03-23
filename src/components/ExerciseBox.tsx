'use client';

import { useState, useEffect } from 'react';
import { MicButton } from './MicButton';

interface ExerciseBoxProps {
  question: string;
  existingAnswer?: string;
  existingCommitment?: string;
  onSubmit: (answer: string) => void;
  onCommitmentSubmit?: (commitment: string) => void;
  loading: boolean;
}

export function ExerciseBox({ question, existingAnswer, existingCommitment, onSubmit, onCommitmentSubmit, loading }: ExerciseBoxProps) {
  const [answer, setAnswer] = useState(existingAnswer || '');
  const [submitted, setSubmitted] = useState(!!existingAnswer);
  const [showCommitment, setShowCommitment] = useState(false);
  const [commitment, setCommitment] = useState(existingCommitment || '');
  const [commitmentSaved, setCommitmentSaved] = useState(!!existingCommitment);

  // Sync when existingAnswer arrives asynchronously (e.g. Supabase load)
  useEffect(() => {
    if (existingAnswer && !answer) {
      setAnswer(existingAnswer);
      setSubmitted(true);
    }
  }, [existingAnswer]);

  useEffect(() => {
    if (existingCommitment && !commitment) {
      setCommitment(existingCommitment);
      setCommitmentSaved(true);
    }
  }, [existingCommitment]);

  const handleSubmit = () => {
    if (!answer.trim()) return;
    setSubmitted(true);
    onSubmit(answer.trim());
    // Show commitment prompt after a brief delay
    if (!existingCommitment) {
      setTimeout(() => setShowCommitment(true), 1500);
    }
  };

  const handleCommitmentSubmit = () => {
    if (!commitment.trim() || !onCommitmentSubmit) return;
    setCommitmentSaved(true);
    onCommitmentSubmit(commitment.trim());
  };

  return (
    <div className="mt-12 mb-8" style={{ marginTop: '32px' }}>
      <div className="bg-[#252525] border border-[rgba(201,125,46,0.3)] rounded-xl py-5 px-6 border-l-[3px] border-l-[#C97D2E]">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 bg-[rgba(201,125,46,0.15)] rounded-lg flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C97D2E" strokeWidth="2" strokeLinecap="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
          </div>
          <span className="text-[11px] font-semibold text-[#999999] uppercase tracking-[0.1em]">Your reflection</span>
        </div>

        <p className="text-[15px] font-medium text-[#F5C87A] mb-5 leading-relaxed italic" style={{ fontFamily: "var(--rk-font-heading)" }}>
          {question}
        </p>

        {submitted && !loading ? (
          <div className="bg-[#2A2A2A] border border-[rgba(255,255,255,0.12)] rounded-lg p-4">
            <p className="text-sm text-[#E8E8E8] leading-relaxed whitespace-pre-wrap" style={{ fontFamily: "var(--rk-font-body)" }}>{answer}</p>
            <button
              onClick={() => setSubmitted(false)}
              className="text-[11px] text-[#999999] hover:text-[#E8E8E8] mt-3 transition-colors"
            >
              Edit response
            </button>
          </div>
        ) : (
          <>
            <div className="relative">
              <textarea
                value={answer}
                onChange={e => {
                  setAnswer(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                placeholder="Write your response here..."
                disabled={loading}
                className="w-full min-h-[120px] bg-[#2A2A2A] border border-[rgba(255,255,255,0.12)] rounded-lg px-4 py-3.5 pb-10 text-sm text-[#E8E8E8] placeholder:text-[#666666] outline-none focus:border-[#C97D2E] transition-colors resize-none leading-relaxed disabled:opacity-50 overflow-y-auto"
                style={{ fontFamily: "var(--rk-font-body)" }}
              />
              {!loading && (
                <MicButton
                  currentText={answer}
                  onTextChange={setAnswer}
                  className="absolute bottom-2 right-2"
                />
              )}
            </div>
            <div className="flex items-center justify-between mt-4">
              <p className="text-[10px] text-[#666666]">Your response is private and shapes future chapters</p>
              <button
                onClick={handleSubmit}
                disabled={!answer.trim() || loading}
                className="flex items-center gap-2 bg-[#C97D2E] hover:bg-[#F5C87A] disabled:bg-[#2A2A2A] disabled:text-[#666666] text-[#111111] font-semibold px-5 py-2.5 rounded-xl transition-all text-sm"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#111111]/30 border-t-[#111111] rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Save & Continue
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Commitment prompt — appears after saving answer */}
      {submitted && showCommitment && !commitmentSaved && onCommitmentSubmit && (
        <div className="mt-4 bg-[#1A2E1A] border border-emerald-800/40 rounded-xl p-6 animate-message-in">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🎯</span>
            <span className="text-[11px] font-semibold text-emerald-400/80 uppercase tracking-[0.1em]">Make it real</span>
          </div>
          <p className="text-sm text-[#E8E8E8]/70 mb-4 leading-relaxed" style={{ fontFamily: "var(--rk-font-heading)" }}>
            When will you apply this? Set a specific intention:
          </p>
          <p className="text-xs text-[#999999] mb-3 italic">
            "I will [action] with [person/situation] on [day]."
          </p>
          <div className="relative">
            <textarea
              value={commitment}
              onChange={e => setCommitment(e.target.value)}
              placeholder="e.g. I will mirror my partner's words tonight when they tell me about their day"
              rows={2}
              className="w-full bg-[#2A2A2A] border border-emerald-800/30 rounded-lg px-4 py-3 pb-10 text-sm text-[#E8E8E8] placeholder:text-[#666666] outline-none focus:border-emerald-400/50 transition-colors resize-none leading-relaxed"
              style={{ fontFamily: "var(--rk-font-body)" }}
            />
            <MicButton
              currentText={commitment}
              onTextChange={setCommitment}
              className="absolute bottom-2 right-2"
            />
          </div>
          <div className="flex items-center justify-between mt-3">
            <button onClick={() => setShowCommitment(false)} className="text-[11px] text-[#999999] hover:text-[#E8E8E8] transition-colors">
              Skip for now
            </button>
            <button
              onClick={handleCommitmentSubmit}
              disabled={!commitment.trim()}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-[#2A2A2A] disabled:text-[#666666] text-white font-semibold px-5 py-2.5 rounded-xl transition-all text-sm"
            >
              Set intention
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* Saved commitment display */}
      {commitmentSaved && commitment && (
        <div className="mt-4 bg-[#1A2E1A]/50 border border-emerald-800/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">🎯</span>
            <span className="text-[10px] font-semibold text-emerald-400/60 uppercase tracking-[0.1em]">Your commitment</span>
          </div>
          <p className="text-sm text-[#E8E8E8]/70 italic" style={{ fontFamily: "var(--rk-font-heading)" }}>"{commitment}"</p>
          <p className="text-[10px] text-[#666666] mt-2">The Architect will check in on this tomorrow.</p>
        </div>
      )}
    </div>
  );
}
