/**
 * Stripe integration for ReadKindled paywall.
 * 
 * Env vars needed:
 * - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
 * - STRIPE_SECRET_KEY (server-side only, for webhook)
 * - STRIPE_WEBHOOK_SECRET (server-side only)
 * 
 * If NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set, paywall falls back to waitlist mode.
 */

import { loadStripe, Stripe } from '@stripe/stripe-js';

// ── Config ──
const STRIPE_PK = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
const PRICE_MONTHLY = process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY || '';
const PRICE_ANNUAL = process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL || '';

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!STRIPE_PK) return Promise.resolve(null);
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PK);
  }
  return stripePromise;
}

export const isStripeConfigured = (): boolean => !!STRIPE_PK;

export async function redirectToCheckout(plan: 'monthly' | 'annual', userId: string, userEmail?: string): Promise<void> {
  const stripe = await getStripe();
  if (!stripe) {
    console.error('[Stripe] Not configured — cannot redirect to checkout');
    return;
  }

  const priceId = plan === 'monthly' ? PRICE_MONTHLY : PRICE_ANNUAL;
  if (!priceId) {
    console.error(`[Stripe] No price ID for ${plan} plan`);
    return;
  }

  // Use Stripe Checkout via initEmbeddedCheckout is not needed here.
  // For simple redirect, use the Checkout Sessions API via a server route.
  // Fallback: construct the URL manually for Stripe Payment Links or use fetch to /api/create-checkout
  try {
    const res = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId, userId, userEmail }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      console.error('[Stripe] No checkout URL returned:', data.error);
    }
  } catch (err) {
    console.error('[Stripe] Checkout redirect failed:', err);
  }
}

// ── Plan helpers ──

export type UserPlan = 'free' | 'pro';

export function isProUser(plan?: string | null): boolean {
  return plan === 'pro';
}

/**
 * Free tier: chapters where week <= 1 (first 2 chapters of each book typically).
 * Pro tier: all chapters.
 */
export function canAccessChapter(plan: UserPlan, chapterNumber: number, totalChapters: number): boolean {
  if (plan === 'pro') return true;
  // Free: first 2 chapters of any book
  return chapterNumber <= 2;
}

export const PRICING = {
  monthly: { price: '$7.99', period: '/month' },
  annual: { price: '$59.99', period: '/year', savings: '37%' },
} as const;
