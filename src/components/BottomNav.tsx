'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const TABS = [
  {
    href: '/',
    label: 'Library',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#c9a84c' : '#6b6b80'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
      </svg>
    ),
  },
  {
    href: '/reading',
    label: 'Reading',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#c9a84c' : '#6b6b80'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
  },
  {
    href: '/journey',
    label: 'Journey',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#c9a84c' : '#6b6b80'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
  {
    href: '/today',
    label: 'Today',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#c9a84c' : '#6b6b80'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const [isReading, setIsReading] = useState(false);

  // Detect reading state from localStorage flag (set by page.tsx when entering/leaving reader)
  useEffect(() => {
    const check = () => {
      try {
        setIsReading(localStorage.getItem('loop-reader-is-reading') === 'true');
      } catch {}
    };
    check();
    // Listen for storage changes from the same page
    window.addEventListener('storage', check);
    // Also poll briefly for same-tab changes
    const interval = setInterval(check, 500);
    return () => {
      window.removeEventListener('storage', check);
      clearInterval(interval);
    };
  }, []);

  // Also detect /read/ token routes
  const onReadRoute = pathname.startsWith('/read/');
  const activelyReading = isReading || onReadRoute;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-navy border-t border-white/10 safe-area-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto px-2 py-1.5" style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}>
        {TABS.map(tab => {
          let isActive: boolean;
          if (activelyReading) {
            // When reading, only "Reading" is active
            isActive = tab.href === '/reading';
          } else if (tab.href === '/') {
            isActive = pathname === '/' || pathname === '/library';
          } else {
            isActive = pathname.startsWith(tab.href);
          }
          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={() => {
                if (tab.href === '/' && pathname === '/') {
                  window.dispatchEvent(new Event('navigate-library'));
                }
              }}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[60px] ${
                isActive ? 'bg-gold/10' : 'hover:bg-white/5'
              }`}
            >
              {tab.icon(isActive)}
              <span className={`text-[10px] font-medium ${isActive ? 'text-gold' : 'text-white/40'}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
