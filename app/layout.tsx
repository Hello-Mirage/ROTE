import type { Metadata, Viewport } from "next";
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
    "ROTE AI is a minimal voice-to-text and personal AI memory pool. Speak freely, transcribe cleanly, and ask your Memrooms anything.",
  applicationName: "ROTE AI",
  authors: [{ name: "terminaLABS", url: "https://terminalabs.live" }],
  creator: "terminaLABS",
  publisher: "terminaLABS",
  keywords: [
    "ROTE AI",
    "Rote",
    "Just ROTE it down",
    "speech to text",
    "voice to text",
    "AI voice notes",
    "AI memory pool",
    "Memrooms",
    "terminaLABS",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "ROTE AI — Just R O T E it down.",
    description:
      "Minimal voice-to-text and personal AI memory pool. Speak freely, transcribe cleanly, and ask your Memrooms anything.",
    url: "/",
    siteName: "ROTE AI",
    type: "website",
    images: [
      {
        url: "/rote-ai-logo.png",
        width: 1024,
        height: 1024,
        alt: "ROTE AI",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "ROTE AI — Just R O T E it down.",
    description:
      "Minimal voice-to-text and personal AI memory pool.",
    images: ["/rote-ai-logo.png"],
  },
  icons: {
    icon: "/rote-ai-logo.png",
    apple: "/rote-ai-logo.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F2EEE6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "ROTE AI",
    url: siteUrl,
    description:
      "Minimal voice-to-text and personal AI memory pool. Speak freely, transcribe cleanly, and ask your Memrooms anything.",
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Any",
    image: `${siteUrl}/rote-ai-logo.png`,
    creator: {
      "@type": "Organization",
      name: "terminaLABS",
      url: "https://terminalabs.live",
    },
  };

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable} ${instrumentSerif.variable} ${outfit.variable} h-full`}
    >
      <body
        suppressHydrationWarning
        className="min-h-dvh flex flex-col bg-[#F2EEE6] text-[#14161A]"
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <header className="w-full max-w-3xl mx-auto px-5 sm:px-6 pt-6 sm:pt-10 pb-4 sm:pb-6 sm:h-20 flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between shrink-0">
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

          <nav className="flex flex-wrap items-baseline gap-x-5 gap-y-2 sm:gap-6 text-sm font-semibold text-[#FF5A36]">
            <Link href="/app" className="no-underline hover:text-[#14161A] transition-colors py-1">
              speak
            </Link>
            <Link href="/chat" className="no-underline hover:text-[#14161A] transition-colors py-1">
              chat
            </Link>
            <Link href="/notes" className="no-underline hover:text-[#14161A] transition-colors py-1">
              notes
            </Link>
            <Link href="/key" className="no-underline hover:text-[#14161A] transition-colors py-1">
              key
            </Link>
            <Link href="/about" className="no-underline hover:text-[#14161A] transition-colors py-1">
              about
            </Link>
          </nav>
        </header>

        <main className="flex-1 w-full max-w-3xl mx-auto px-5 sm:px-6 pb-12 flex flex-col">
          {children}
        </main>

        <footer className="w-full max-w-3xl mx-auto px-5 sm:px-6 pb-8 sm:pb-10 pt-4 flex items-center gap-2 text-xs text-[#727376]">
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
