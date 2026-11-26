import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ROTE AI",
  description: "Just R O T E it down.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable} h-full`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-[#F2EEE6] text-[#14161A]"
      >
        <header className="w-full max-w-3xl mx-auto px-6 pt-10 pb-6 flex items-baseline justify-between">
          <Link
            href="/"
            className="word-action font-[family-name:var(--font-space-grotesk)] text-sm tracking-[0.22em] uppercase font-medium text-[#14161A]"
          >
            ROTE AI
          </Link>

          <nav className="flex items-baseline gap-6 text-sm text-[#727376]">
            <Link href="/chat" className="word-action">
              chat
            </Link>
            <Link href="/memrooms" className="word-action">
              memrooms
            </Link>
            <Link href="/notes" className="word-action">
              notes
            </Link>
            <Link href="/about" className="word-action">
              about
            </Link>
          </nav>
        </header>

        <main className="flex-1 w-full max-w-3xl mx-auto px-6 pb-20 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
