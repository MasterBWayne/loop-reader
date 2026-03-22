'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  getCurrentUser, 
  loadUserProfile, 
  isAnonymousUser, 
  loadPendingCommitments, 
  hasCheckedInThisWeek, 
  loadChapterProgress, 
  saveMaintenanceCheckin,
  type UserProfileData,
  type CommitmentRecord 
} from '@/lib/supabase';
import { BOOKS, type Book } from '@/data/books';
import { MaintenanceCard } from '@/components/MaintenanceCard';

export default function TodayPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [lastBook, setLastBook] = useState<Book | null>(null);
  const [commitments, setCommitments] = useState<CommitmentRecord[]>([]);
  const [maintenance, setMaintenance] = useState<{ book: Book; chapterIdx: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
      let uid = currentUser?.id;
      if (uid) {
        const p = await loadUserProfile(uid);
        if (p) setProfile(p);

        try {
          const comms = await loadPendingCommitments(uid);
          setCommitments(comms || []);
        } catch (err) {
          console.error('Failed to load commitments', err);
        }

        try {
          // Find a maintenance book
          const progressRecords = await loadChapterProgress(uid);
          const bookProgress = progressRecords || [];

          for (const book of BOOKS) {
            const contentChapters = book.chapters.filter(c => c.content && !c.content.startsWith('Coming soon'));
            const isComplete = contentChapters.length > 0 && bookProgress.length >= contentChapters.length;
            if (!isComplete) continue;

            const checkedIn = await hasCheckedInThisWeek(uid, book.id);
            if (checkedIn) continue;

            const weekNum = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
            const chapterIdx = weekNum % contentChapters.length;
            setMaintenance({ book, chapterIdx });
            break; // just show one
          }
        } catch (err) {
          console.error('Failed to load maintenance', err);
        }
      }

      try {
        const lastBookId = localStorage.getItem('loop-reader-last-book');
        if (lastBookId) {
          const b = BOOKS.find(x => x.id === lastBookId);
          if (b) setLastBook(b);
        } else {
          setLastBook(BOOKS[0]);
        }
      } catch {}

      setLoading(false);
    }
    init();
  }, []);

  const displayName = profile?.display_name || (user && !isAnonymousUser(user) && user.email ? user.email.split('@')[0] : '');

  return (
    <main className="min-h-screen bg-navy text-ink pb-24">
      {/* Top Bar */}
      <nav className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto relative">
        <Link href="/profile" className="flex items-center justify-center w-[36px] h-[36px] rounded-full border border-gold bg-navy shrink-0 z-10">
          {displayName ? (
            <span className="text-gold font-bold text-sm">
              {displayName.charAt(0).toUpperCase()}
            </span>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C97D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          )}
        </Link>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-sm font-medium tracking-wide text-ink/80" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Loop Reader</span>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-xl mx-auto px-6 pt-6 space-y-8">
        {/* Greeting */}
        <div>
          <h1 className="text-3xl font-bold leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Good morning{displayName ? `, ${displayName}` : ''}
          </h1>
          <p className="text-ink/50 text-sm mt-1">Here is your focus for today.</p>
        </div>

        {/* Reading Goal */}
        <div className="bg-ink/5 border border-ink/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C97D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span className="text-xs font-semibold text-gold uppercase tracking-widest">Today's Focus</span>
          </div>
          <p className="text-ink/90 font-medium mb-1">
            Read 1 chapter of {lastBook ? lastBook.title : 'your book'}
          </p>
          <Link href="/?resume=true" className="inline-block mt-3 text-xs bg-gold/10 text-gold px-4 py-2 rounded-lg font-medium hover:bg-gold/20 transition-colors">
            Continue Reading &rarr;
          </Link>
        </div>

        {/* Pending Commitments */}
        <div>
          <h2 className="text-sm font-semibold text-ink/40 uppercase tracking-widest mb-3">Action Items</h2>
          {loading ? (
            <div className="text-ink/20 text-sm">Loading...</div>
          ) : commitments.length > 0 ? (
            <div className="space-y-3">
              {commitments.map(c => (
                <div key={c.id || c.chapter_number} className="bg-ink/5 border border-ink/10 rounded-xl p-4 flex gap-3">
                  <div className="mt-0.5 w-4 h-4 rounded-full border border-gold/50 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-ink/90 leading-relaxed">{c.commitment_text}</p>
                    <p className="text-[10px] text-ink/40 mt-1">Due {new Date(c.due_date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-ink/5 border border-ink/10 rounded-xl p-5 text-center">
              <p className="text-ink/50 text-sm italic">"Knowledge is only potential power. Action is power."</p>
              <p className="text-ink/30 text-[10px] mt-2">You have no pending commitments.</p>
            </div>
          )}
        </div>

        {/* Maintenance */}
        {maintenance && (
          <div>
            <h2 className="text-sm font-semibold text-ink/40 uppercase tracking-widest mb-3">Check-in</h2>
            <MaintenanceCard
              bookTitle={maintenance.book.title}
              chapterTitle={maintenance.book.chapters.filter(c => c.content && !c.content.startsWith('Coming soon'))[maintenance.chapterIdx].title}
              chapterNumber={maintenance.book.chapters.filter(c => c.content && !c.content.startsWith('Coming soon'))[maintenance.chapterIdx].number}
              onSubmit={async (rating, reflection) => {
                let aiResponse = '';
                try {
                  const res = await fetch('/api/maintenance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      chapterTitle: maintenance.book.chapters.filter(c => c.content && !c.content.startsWith('Coming soon'))[maintenance.chapterIdx].title,
                      rating,
                      reflection,
                      profile
                    }),
                  });
                  const data = await res.json();
                  aiResponse = data.response || '';
                } catch {}
                if (user?.id) {
                  await saveMaintenanceCheckin(
                    user.id, 
                    maintenance.book.id, 
                    maintenance.book.chapters.filter(c => c.content && !c.content.startsWith('Coming soon'))[maintenance.chapterIdx].number, 
                    rating, 
                    reflection, 
                    aiResponse
                  );
                }
                return aiResponse;
              }}
              onDismiss={() => setMaintenance(null)}
            />
          </div>
        )}
      </div>
    </main>
  );
}