"use client";

import Link from "next/link";
import { FormEvent, useState, useSyncExternalStore } from "react";
import {
  clearApiKey,
  hasStoredApiKey,
  saveApiKey,
  subscribeApiKey,
} from "@/lib/keystore";

function getSnapshot(): boolean {
  return hasStoredApiKey();
}

function getServerSnapshot(): boolean {
  return false;
}

export default function KeyPage() {
  const hasKey = useSyncExternalStore(
    subscribeApiKey,
    getSnapshot,
    getServerSnapshot
  );
  const [value, setValue] = useState("");
  const [status, setStatus] = useState("");

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    const clean = value.trim();
    if (!clean) return;

    await saveApiKey(clean);
    setValue("");
    setStatus("saved and encrypted in this browser.");
    setTimeout(() => setStatus(""), 2500);
  }

  function handleRemove() {
    clearApiKey();
    setValue("");
    setStatus("removed.");
    setTimeout(() => setStatus(""), 2000);
  }

  return (
    <section className="py-10 space-y-10">
      <div className="space-y-2">
        <p className="text-[11px] tracking-[0.22em] uppercase text-[#FF5A36] font-medium">
          BYOK
        </p>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl sm:text-4xl font-medium tracking-tight text-[#14161A]">
          Your{" "}
          <span className="font-[family-name:var(--font-cursive)] italic font-normal text-4xl sm:text-5xl">
            API key.
          </span>
        </h1>
      </div>

      <div className="border-t border-[#E4DED2] pt-8 space-y-8">
        <p className="text-sm text-[#4F5053] leading-relaxed max-w-xl">
          Your Google AI Studio key is encrypted in this browser with Web Crypto
          (AES-GCM) and sent only to Google. It never touches our servers.
        </p>

        <form onSubmit={handleSave} className="space-y-4 max-w-xl">
          <div className="flex items-baseline gap-6">
            <input
              type="password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={
                hasKey ? "••••••••••••••••••••••••" : "Paste your Gemini API key…"
              }
              autoComplete="off"
              spellCheck={false}
              className="flex-1 bg-transparent border-0 border-b border-[#E4DED2] focus:border-[#FF5A36] pb-2 text-lg text-[#14161A] placeholder:text-[#9AA0A6] focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!value.trim()}
              className="word-action text-base disabled:opacity-40"
            >
              save
            </button>
          </div>

          <div className="flex flex-wrap items-baseline gap-6 text-sm text-[#727376]">
            <span>{hasKey ? "status: encrypted locally" : "status: no key set"}</span>
            {hasKey && (
              <button
                type="button"
                onClick={handleRemove}
                className="word-action"
              >
                remove
              </button>
            )}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="word-action"
            >
              get a key
            </a>
            <Link href="/app" className="word-action">
              speak
            </Link>
          </div>

          {status && <p className="text-sm text-[#FF5A36]">{status}</p>}
        </form>
      </div>
    </section>
  );
}
