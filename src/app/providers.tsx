'use client';

import { ThemeProvider } from 'next-themes';
import { SoulGraphProvider, SoulGraphConsentBanner } from '@/lib/SoulGraphProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem={false}>
      <SoulGraphProvider>
        {children}
        <SoulGraphConsentBanner />
      </SoulGraphProvider>
    </ThemeProvider>
  );
}
