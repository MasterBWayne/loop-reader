import type { Metadata } from 'next';
import './globals.css';
import { BottomNav } from '@/components/BottomNav';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Loop Reader — The Architect Method',
  description: 'Your personalized self-development reading experience with AI companion.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <Providers>
          <div className="pb-20">{children}</div>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
