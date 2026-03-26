'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase, ensureAnonymousUser } from '@/lib/supabase';
import { BOOKS } from '@/data/books';

export default function TokenAccessPage() {
  const params = useParams();
  const token = params.token as string;
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'error'>('loading');
  const [bookId, setBookId] = useState<string | null>(null);

  useEffect(() => {
    async function validateToken() {
      try {
        // Look up token
        const { data, error } = await supabase
          .from('access_tokens')
          .select('id, book_id, used_at, user_id')
          .eq('token', token)
          .single();

        if (error || !data) {
          setStatus('invalid');
          return;
        }

        // Check book exists in our catalog
        const book = BOOKS.find(b => b.id === data.book_id);
        if (!book) {
          setStatus('invalid');
          return;
        }

        setBookId(data.book_id);

        // Ensure user session
        const userId = await ensureAnonymousUser();

        // Mark token as used + associate with user
        if (!data.used_at && userId) {
          await supabase
            .from('access_tokens')
            .update({ used_at: new Date().toISOString(), user_id: userId })
            .eq('id', data.id);
        }

        // Store book access grant in localStorage for the main app to read
        try {
          const grants = JSON.parse(localStorage.getItem('loop-reader-grants') || '{}');
          grants[data.book_id] = { token, grantedAt: new Date().toISOString() };
          localStorage.setItem('loop-reader-grants', JSON.stringify(grants));
        } catch {}

        setStatus('valid');

        // Redirect to main app after brief delay
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } catch {
        setStatus('error');
      }
    }

    if (token) validateToken();
  }, [token]);

  return (
    <main className="min-h-screen bg-navy flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
          {status === 'loading' && (
            <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          )}
          {status === 'valid' && (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C97D2E" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          )}
          {(status === 'invalid' || status === 'error') && (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          )}
        </div>

        {status === 'loading' && (
          <>
            <h1 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Lora', serif" }}>Activating your access...</h1>
            <p className="text-sm text-ink/40">Verifying your link</p>
          </>
        )}

        {status === 'valid' && (
          <>
            <h1 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Lora', serif" }}>You're in.</h1>
            <p className="text-sm text-ink/40">Redirecting to your library...</p>
          </>
        )}

        {status === 'invalid' && (
          <>
            <h1 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Lora', serif" }}>Invalid link</h1>
            <p className="text-sm text-ink/40 mb-6">This access link isn't valid or has expired.</p>
            <a href="/" className="text-sm text-gold hover:text-gold-light transition-colors">Go to library</a>
          </>
        )}

        {status === 'error' && (
          <>
            <h1 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Lora', serif" }}>Something went wrong</h1>
            <p className="text-sm text-ink/40 mb-6">Please try again or contact support.</p>
            <a href="/" className="text-sm text-gold hover:text-gold-light transition-colors">Go to library</a>
          </>
        )}
      </div>
    </main>
  );
}
