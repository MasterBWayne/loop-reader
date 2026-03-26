'use client';
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from './supabase';
import { connectUser, grantConsent, getProfile, writeObservation } from './soulGraph';

interface SoulGraphCtx {
  email: string | null;
  sgUserId: string | null;
  consented: boolean;
  consentPending: boolean;
  acceptConsent: () => Promise<void>;
  declineConsent: () => void;
  track: (eventType: string, rawSignal: Record<string, unknown>) => Promise<void>;
  loading: boolean;
  /** Confirmed insights from the Soul Graph profile */
  insights: Array<{ category: string; label: string; confidence: number }>;
}

const SoulGraphContext = createContext<SoulGraphCtx>({
  email: null,
  sgUserId: null,
  consented: false,
  consentPending: false,
  acceptConsent: async () => {},
  declineConsent: () => {},
  track: async () => {},
  loading: true,
  insights: [],
});

export const useSoulGraph = () => useContext(SoulGraphContext);

export function SoulGraphProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [sgUserId, setSgUserId] = useState<string | null>(null);
  const [consented, setConsented] = useState(false);
  const [consentPending, setConsentPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<Array<{ category: string; label: string; confidence: number }>>([]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.email) { setLoading(false); return; }

        const userEmail = session.user.email;
        if (cancelled) return;
        setEmail(userEmail);

        const sgId = await connectUser(userEmail);
        if (cancelled || !sgId) { setLoading(false); return; }
        setSgUserId(sgId);

        const profile = await getProfile(sgId);
        const hasConsent = !!profile?.consent_given;
        setConsented(hasConsent);

        // Load confirmed insights from profile
        if (hasConsent && profile?.confirmed_insights) {
          setInsights(profile.confirmed_insights);
        }

        const answered = sessionStorage.getItem('rk_sg_consent_answered');
        if (!hasConsent && !answered) {
          setConsentPending(true);
        }
      } catch {
        // Silent fail — soul graph is optional
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) {
        setEmail(session.user.email);
        connectUser(session.user.email).then(sgId => {
          if (sgId) {
            setSgUserId(sgId);
            getProfile(sgId).then(p => {
              setConsented(!!p?.consent_given);
              if (p?.confirmed_insights) setInsights(p.confirmed_insights);
            });
          }
        });
      } else {
        setEmail(null);
        setSgUserId(null);
        setConsented(false);
        setInsights([]);
      }
    });

    return () => { cancelled = true; subscription.unsubscribe(); };
  }, []);

  const acceptConsent = useCallback(async () => {
    if (!sgUserId) return;
    await grantConsent(sgUserId);
    setConsented(true);
    setConsentPending(false);
    sessionStorage.setItem('rk_sg_consent_answered', '1');
  }, [sgUserId]);

  const declineConsent = useCallback(() => {
    setConsentPending(false);
    sessionStorage.setItem('rk_sg_consent_answered', '1');
  }, []);

  const track = useCallback(async (eventType: string, rawSignal: Record<string, unknown>) => {
    if (!sgUserId || !consented) return;
    await writeObservation(sgUserId, eventType, rawSignal);
  }, [sgUserId, consented]);

  return (
    <SoulGraphContext.Provider value={{
      email, sgUserId, consented, consentPending,
      acceptConsent, declineConsent, track, loading, insights,
    }}>
      {children}
    </SoulGraphContext.Provider>
  );
}

// ─── Consent Banner Component ──────────────────────────────────────────────

export function SoulGraphConsentBanner() {
  const { consentPending, acceptConsent, declineConsent } = useSoulGraph();

  if (!consentPending) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-message-in">
      <div className="bg-white rounded-2xl shadow-lg border border-sage-pale p-5 max-w-md mx-auto">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-sage-pale rounded-xl flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4A7A3A" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm" style={{ fontFamily: "'Lora', serif", color: '#1A2E14' }}>
              Growth Profile
            </h3>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: '#3D5A2E' }}>
              ReadKindled can build a personal growth profile from your reading patterns. 
              This helps personalize coaching across all your apps. Your data stays private.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={acceptConsent}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
                style={{ background: '#A86820' }}
              >
                Enable
              </button>
              <button
                onClick={declineConsent}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={{ color: '#3D5A2E', background: '#E8F0E4' }}
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
