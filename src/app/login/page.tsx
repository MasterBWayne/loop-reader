'use client';

import { useState } from 'react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '@/lib/supabase';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  const handleGoogle = async () => {
    setError('');
    await signInWithGoogle();
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'signup') {
      const { error: err } = await signUpWithEmail(email, password);
      if (err) {
        setError(err.message);
      } else {
        setConfirmSent(true);
      }
    } else {
      const { error: err } = await signInWithEmail(email, password);
      if (err) {
        setError(err.message);
      } else {
        window.location.href = '/';
      }
    }
    setLoading(false);
  };

  if (confirmSent) {
    return (
      <main className="min-h-screen bg-navy flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Lora', serif" }}>Check your email</h1>
          <p className="text-sm text-white/50">We sent a confirmation link to <span className="text-gold">{email}</span>. Click it to activate your account.</p>
          <a href="/" className="inline-block mt-8 text-xs text-white/30 hover:text-white/60 transition-colors">Back to reading</a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-navy flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-8 h-8 bg-gold rounded flex items-center justify-center text-navy font-bold text-sm" style={{ fontFamily: "'Lora', serif" }}>A</div>
          <span className="text-sm font-medium tracking-wide text-white/80">THE ARCHITECT METHOD</span>
        </div>

        <h1 className="text-2xl font-bold text-white text-center mb-2" style={{ fontFamily: "'Lora', serif" }}>
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="text-sm text-white/40 text-center mb-8">
          {mode === 'login' ? 'Sign in to access your reading progress' : 'Save your progress and personalization permanently'}
        </p>

        {/* Google button */}
        <button
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-white/95 text-navy font-medium py-3 rounded-xl transition-colors text-sm mb-4"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-white/30">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/90 placeholder:text-white/25 outline-none focus:border-gold/40 transition-colors"
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            required
            minLength={6}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/90 placeholder:text-white/25 outline-none focus:border-gold/40 transition-colors"
          />

          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold hover:bg-gold-light disabled:bg-white/10 text-navy font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            {loading ? 'Loading...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        {/* Toggle mode */}
        <p className="text-center text-xs text-white/30 mt-6">
          {mode === 'login' ? (
            <>No account? <button onClick={() => { setMode('signup'); setError(''); }} className="text-gold hover:text-gold-light transition-colors">Sign up</button></>
          ) : (
            <>Already have an account? <button onClick={() => { setMode('login'); setError(''); }} className="text-gold hover:text-gold-light transition-colors">Sign in</button></>
          )}
        </p>

        <a href="/" className="block text-center mt-6 text-xs text-white/20 hover:text-white/40 transition-colors">
          Continue reading without an account
        </a>
      </div>
    </main>
  );
}
