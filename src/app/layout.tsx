import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OLT Optical Report Generator | OneSky',
  description: 'Multi-Brand OLT Optical Loss Report Generator & Diagnostic Center',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#080d1a] text-slate-100 antialiased selection:bg-sky-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
