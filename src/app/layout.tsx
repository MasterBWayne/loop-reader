import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Loop Reader — The Architect Method',
  description: 'Your personalized self-development reading experience with AI companion.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-stone-50 text-stone-900">
        {children}
      </body>
    </html>
  );
}
