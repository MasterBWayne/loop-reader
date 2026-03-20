'use client';

import { useEffect, useState } from 'react';
import { BOOKS } from '@/data/books';

export default function ReadingPage() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check localStorage for last read book
    const lastBook = localStorage.getItem('loop-reader-last-book');

    if (lastBook) {
      const book = BOOKS.find(b => b.id === lastBook);
      if (book) {
        // Redirect to main page which handles the reading state
        // For now, just go to library — the main page handles book selection
        window.location.href = '/';
        return;
      }
    }

    setChecking(false);
  }, []);

  if (checking) {
    return (
      <main className="min-h-screen bg-navy flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-navy text-white flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6b6b80" strokeWidth="1.5">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
        </div>
        <h1 className="text-xl font-bold mb-2" style={{ fontFamily: "'Lora', serif" }}>Nothing open yet</h1>
        <p className="text-sm text-white/40 mb-6">Pick a book from the library to start reading.</p>
        <a href="/" className="inline-flex items-center gap-2 bg-gold hover:bg-gold-light text-navy font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm">
          Browse Library
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
        </a>
      </div>
    </main>
  );
}
