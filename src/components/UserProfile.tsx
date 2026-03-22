'use client';

import { useState, useRef, useEffect } from 'react';
import { signOut, linkWithGoogle, isAnonymousUser } from '@/lib/supabase';

interface UserProfileProps {
  user: {
    id: string;
    email?: string | null;
    user_metadata?: { full_name?: string; avatar_url?: string; name?: string };
    is_anonymous?: boolean;
  } | null;
  onSignOut: () => void;
}

export function UserProfile({ user, onSignOut }: UserProfileProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!user) return null;

  const isAnon = isAnonymousUser(user);
  const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'Anonymous';
  const avatar = user.user_metadata?.avatar_url;
  const initial = (name[0] || 'A').toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    onSignOut();
  };

  const handleUpgrade = async () => {
    await linkWithGoogle();
  };

  if (isAnon) {
    return (
      <a
        href="/login"
        className="flex items-center gap-1.5 text-[11px] text-ink/40 hover:text-gold transition-colors px-2 py-1 rounded-lg hover:bg-ink/5"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        Sign in
      </a>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-ink/5 transition-colors"
      >
        {avatar ? (
          <img src={avatar} alt="" className="w-6 h-6 rounded-full" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center text-[10px] font-bold text-gold">
            {initial}
          </div>
        )}
        <span className="text-xs text-ink/60 hidden sm:block max-w-[120px] truncate">{name}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-navy-light border border-ink/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-message-in">
          <div className="px-4 py-3 border-b border-ink/10">
            <p className="text-sm font-medium text-ink/90 truncate">{name}</p>
            {user.email && <p className="text-[11px] text-ink/40 truncate">{user.email}</p>}
          </div>
          <div className="p-2">
            <a
              href="/author"
              className="w-full text-left px-3 py-2 text-xs text-ink/50 hover:text-ink/80 hover:bg-ink/5 rounded-lg transition-colors flex items-center gap-2 mb-1"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
              Author Dashboard
            </a>
            <button
              onClick={handleSignOut}
              className="w-full text-left px-3 py-2 text-xs text-ink/50 hover:text-ink/80 hover:bg-ink/5 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Banner prompting anonymous users to save their progress */
export function UpgradeBanner({ user }: { user: { is_anonymous?: boolean } | null }) {
  const [dismissed, setDismissed] = useState(false);

  if (!user || !isAnonymousUser(user) || dismissed) return null;

  const handleUpgrade = async () => {
    await linkWithGoogle();
  };

  return (
    <div className="bg-gold/10 border border-gold/20 px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C97D2E" strokeWidth="2" className="shrink-0"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <p className="text-xs text-gold/80 truncate">
          Save your progress permanently
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleUpgrade}
          className="bg-gold hover:bg-gold-light text-ink font-semibold text-[11px] px-3 py-1.5 rounded-lg transition-colors"
        >
          Sign in with Google
        </button>
        <a
          href="/login"
          className="text-[11px] text-gold/50 hover:text-gold/80 transition-colors"
        >
          Email
        </a>
        <button
          onClick={() => setDismissed(true)}
          className="text-ink/20 hover:text-ink/50 transition-colors p-0.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
    </div>
  );
}
