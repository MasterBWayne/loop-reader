'use client';

import React, { useState } from 'react';
import { X, BookOpen, Sparkles, Lock, CheckCircle, ArrowRight } from 'lucide-react';
import { redirectToCheckout, isStripeConfigured, PRICING } from '@/lib/stripe';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail?: string;
  bookTitle?: string;
  chapterTitle?: string;
}

export default function PaywallModal({ isOpen, onClose, userId, userEmail, bookTitle, chapterTitle }: PaywallModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [loading, setLoading] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState(userEmail || '');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const stripeReady = isStripeConfigured();

  if (!isOpen) return null;

  const handleCheckout = async () => {
    setLoading(true);
    try {
      await redirectToCheckout(selectedPlan, userId, userEmail);
    } catch (e) {
      console.error('[Paywall] Checkout failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleWaitlist = () => {
    // For now, just log it — will wire to Supabase/Beehiiv later
    console.log('[Waitlist] Email submitted:', waitlistEmail);
    setWaitlistSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative bg-[#F4F8F0] dark:bg-[#0C120A] rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors z-10"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="px-6 pt-8 pb-4 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20 flex items-center justify-center">
            <Lock size={24} className="text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 font-[Lora]">
            Keep going
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-2 leading-relaxed">
            {bookTitle
              ? <>You&apos;ve finished the free chapters of <span className="font-semibold text-stone-700 dark:text-stone-300">{bookTitle}</span>. Unlock the full journey.</>
              : <>Unlock all chapters, AI coaching, and your full transformation path.</>
            }
          </p>
        </div>

        {/* Features */}
        <div className="px-6 pb-4">
          <div className="space-y-2.5">
            {[
              'All chapters across every book',
              'AI coaching companion',
              'Spaced repetition & check-ins',
              'Personal transformation score',
              'Weekly synthesis reports',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                <span className="text-sm text-stone-600 dark:text-stone-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {stripeReady ? (
          <>
            {/* Plan selector */}
            <div className="px-6 pb-4 space-y-2.5">
              <button
                onClick={() => setSelectedPlan('annual')}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                  selectedPlan === 'annual'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-900/20'
                    : 'border-stone-200 dark:border-stone-700 hover:border-stone-300'
                }`}
              >
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-stone-800 dark:text-stone-100">Annual</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Save {PRICING.annual.savings}</span>
                  </div>
                  <span className="text-xs text-stone-500 dark:text-stone-400">{PRICING.annual.price}{PRICING.annual.period}</span>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedPlan === 'annual' ? 'border-amber-500 bg-amber-500' : 'border-stone-300'
                }`}>
                  {selectedPlan === 'annual' && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </button>

              <button
                onClick={() => setSelectedPlan('monthly')}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                  selectedPlan === 'monthly'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-900/20'
                    : 'border-stone-200 dark:border-stone-700 hover:border-stone-300'
                }`}
              >
                <div className="text-left">
                  <span className="text-sm font-bold text-stone-800 dark:text-stone-100">Monthly</span>
                  <br />
                  <span className="text-xs text-stone-500 dark:text-stone-400">{PRICING.monthly.price}{PRICING.monthly.period}</span>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedPlan === 'monthly' ? 'border-amber-500 bg-amber-500' : 'border-stone-300'
                }`}>
                  {selectedPlan === 'monthly' && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </button>
            </div>

            {/* CTA */}
            <div className="px-6 pb-8">
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-[#A86820] hover:bg-[#965c1c] text-white font-bold text-sm transition-all shadow-lg shadow-amber-200/30 dark:shadow-amber-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span className="animate-pulse">Processing...</span>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Unlock Full Access
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
              <p className="text-[11px] text-stone-400 text-center mt-3">Cancel anytime. 7-day money-back guarantee.</p>
            </div>
          </>
        ) : (
          /* Waitlist fallback when Stripe isn't configured */
          <div className="px-6 pb-8">
            {waitlistSubmitted ? (
              <div className="text-center py-4">
                <CheckCircle size={32} className="text-emerald-500 mx-auto mb-3" />
                <p className="text-sm font-semibold text-stone-700 dark:text-stone-200">You&apos;re on the list!</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">We&apos;ll email you when Pro launches.</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-stone-500 dark:text-stone-400 text-center mb-3">Pro launching soon — join the waitlist for early access.</p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm text-stone-700 dark:text-stone-200 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-amber-200"
                  />
                  <button
                    onClick={handleWaitlist}
                    disabled={!waitlistEmail.includes('@')}
                    className="px-5 py-3 rounded-xl bg-[#A86820] text-white font-bold text-sm disabled:opacity-50 transition-all"
                  >
                    Notify Me
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
