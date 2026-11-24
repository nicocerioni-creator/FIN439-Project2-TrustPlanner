import type { Metadata, Viewport } from 'next';
import { Geist, Newsreader } from 'next/font/google';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });
const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
  display: 'swap',
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: 'Trust support planner',
  icons: { icon: '/icon.svg' },
  description:
    'College-first family trust payment planning. Educational and research use only; not investment advice.',
};

export const viewport: Viewport = {
  themeColor: '#0a1d33',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${newsreader.variable}`}>
      <body>{children}</body>
    </html>
  );
}
