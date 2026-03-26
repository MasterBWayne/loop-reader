'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase, getCurrentUser } from '@/lib/supabase';

interface AuthorBook {
  id: string;
  title: string;
  status: 'processing' | 'live' | 'draft' | 'removed';
  created_at: string;
}

export default function AuthorDashboard() {
  const [books, setBooks] = useState<AuthorBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const user = await getCurrentUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }
      const { data, error } = await supabase
        .from('books')
        .select('id, title, status, created_at')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });

      if (data) setBooks(data as AuthorBook[]);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-navy flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-navy text-ink">
      <nav className="px-6 py-4 flex items-center justify-between max-w-4xl mx-auto">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gold rounded flex items-center justify-center text-ink font-bold text-sm" style={{ fontFamily: "'Lora', serif" }}>A</div>
          <span className="text-sm font-medium tracking-wide text-ink/80">THE ARCHITECT METHOD</span>
        </Link>
        <Link href="/" className="text-xs text-ink/40 hover:text-ink/70 transition-colors flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5m7 7-7-7 7-7"/></svg>
          Library
        </Link>
      </nav>

      <div className="max-w-4xl mx-auto px-6 pt-12 pb-24">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-ink/90" style={{ fontFamily: "'Lora', serif" }}>Author Dashboard</h1>
            <p className="text-ink/50 text-sm">Manage your published books and view insights.</p>
          </div>
          <Link
            href="/author/upload"
            className="inline-flex items-center justify-center gap-2 bg-gold hover:bg-gold-light text-ink font-semibold px-6 py-3 rounded-xl transition-colors shrink-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Upload Your Book
          </Link>
        </div>

        {books.length === 0 ? (
          <div className="text-center py-20 border border-ink/10 rounded-2xl bg-ink/5">
            <div className="w-16 h-16 bg-ink/5 rounded-full flex items-center justify-center mx-auto mb-4 text-ink/20">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
            </div>
            <h3 className="text-lg font-medium text-ink/80 mb-2">No books yet</h3>
            <p className="text-sm text-ink/40 max-w-sm mx-auto mb-6">Upload your first book and let our AI create a companion experience for your readers.</p>
            <Link
              href="/author/upload"
              className="inline-flex text-sm text-gold hover:text-gold-light transition-colors font-medium"
            >
              Start publishing &rarr;
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map(book => (
              <div key={book.id} className="bg-ink/5 border border-ink/10 rounded-2xl p-6 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-bold text-ink/90 line-clamp-2" style={{ fontFamily: "'Lora', serif" }}>{book.title}</h3>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md shrink-0 ml-4 ${
                    book.status === 'live' ? 'bg-green-500/20 text-green-400' :
                    book.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-ink/10 text-ink/50'
                  }`}>
                    {book.status}
                  </span>
                </div>
                
                {/* Placeholder Stats */}
                <div className="grid grid-cols-2 gap-4 mt-auto pt-6 border-t border-ink/10">
                  <div>
                    <p className="text-[10px] text-ink/40 uppercase tracking-wider mb-1">Readers</p>
                    <p className="text-lg font-medium text-ink/90">0</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-ink/40 uppercase tracking-wider mb-1">Completion</p>
                    <p className="text-lg font-medium text-ink/90">0%</p>
                  </div>
                </div>

                {book.status === 'live' && (
                  <div className="mt-6">
                    <Link
                      href={`/book/${book.id}`}
                      className="text-[11px] text-gold hover:text-gold-light transition-colors flex items-center gap-1"
                    >
                      View in Library &rarr;
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
