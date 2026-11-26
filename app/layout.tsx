import type { Metadata } from "next";
import { Instrument_Serif, Inter, Outfit, Space_Grotesk } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-cursive",
  weight: "400",
  style: "italic",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-brand",
  weight: ["600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "ROTE AI — Just R O T E it down.",
    template: "%s — ROTE AI",
  },
  description:
    "Minimal voice-to-text and personal AI memory pool. Speak freely, transcribe cleanly, and ask your Memrooms anything.",
  keywords: [
    "ROTE AI",
    "Rote",
    "speech to text",
    "voice notes",
    "AI memory",
    "Memrooms",
  ],
  openGraph: {
    title: "ROTE AI — Just R O T E it down.",
    description:
      "Minimal voice-to-text and personal AI memory pool. Speak freely, transcribe cleanly, and ask your Memrooms anything.",
    url: "/",
    siteName: "ROTE AI",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "ROTE AI — Just R O T E it down.",
    description:
      "Minimal voice-to-text and personal AI memory pool.",
  },
  robots: {
    index: true,
    follow: true,
  },
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
      className={`${inter.variable} ${spaceGrotesk.variable} ${instrumentSerif.variable} ${outfit.variable} h-full`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-[#F2EEE6] text-[#14161A]"
      >
        <header className="w-full max-w-3xl mx-auto px-6 pt-10 pb-6 h-20 flex items-baseline justify-between shrink-0">
          <Link
            href="/"
            className="no-underline inline-flex items-baseline gap-1.5 group leading-none"
          >
            <span className="font-[family-name:var(--font-brand)] text-base tracking-[0.18em] uppercase font-bold text-[#14161A] group-hover:text-[#FF5A36] transition-colors">
              R O T E
            </span>
            <span className="font-[family-name:var(--font-cursive)] italic text-xl leading-none text-[#FF5A36]">
              ai
            </span>
          </Link>

          <nav className="flex items-baseline gap-6 text-sm font-semibold text-[#FF5A36]">
            <Link href="/" className="no-underline hover:text-[#14161A] transition-colors">
              speak
            </Link>
            <Link href="/chat" className="no-underline hover:text-[#14161A] transition-colors">
              chat
            </Link>
            <Link href="/memrooms" className="no-underline hover:text-[#14161A] transition-colors">
              memrooms
            </Link>
            <Link href="/notes" className="no-underline hover:text-[#14161A] transition-colors">
              notes
            </Link>
            <Link href="/about" className="no-underline hover:text-[#14161A] transition-colors">
              about
            </Link>
          </nav>
        </header>

        <main className="flex-1 w-full max-w-3xl mx-auto px-6 pb-12 flex flex-col">
          {children}
        </main>

        <footer className="w-full max-w-3xl mx-auto px-6 pb-10 pt-4 flex items-center gap-2 text-xs text-[#727376]">
          <span>made by</span>
          <a
            href="https://terminalabs.live"
            target="_blank"
            rel="noopener noreferrer"
            className="word-action inline-flex items-center gap-1.5"
          >
            <Image
              src="/terminalabs-logo.jpg"
              alt="terminaLABS"
              width={16}
              height={16}
              className="w-4 h-4 object-cover rounded-[2px]"
            />
            <span>terminaLABS</span>
          </a>
        </footer>
      </body>
    </html>
  );
}
