"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { loadMemrooms } from "@/lib/memrooms";

interface ChatTurn {
  id: string;
  question: string;
  answer: string;
}

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const message = input.trim();
    if (!message || busy) return;

    setError("");
    setBusy(true);
    setInput("");

    try {
      const memrooms = loadMemrooms();
      const history = turns.map((t) => ({
        question: t.question,
        answer: t.answer,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          memrooms,
          history,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not get answer.");
        return;
      }

      setTurns((prev) => [
        ...prev,
        {
          id: `${Date.now()}`,
          question: message,
          answer: data.reply || "",
        },
      ]);
    } catch {
      setError("Could not reach chat service.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex-1 flex flex-col justify-between py-12 gap-12">
      <div className="space-y-10">
        <div className="space-y-2">
          <p className="text-[11px] tracking-[0.22em] uppercase text-[#FF5A36] font-medium">
            Memroom Chat
          </p>
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl sm:text-4xl font-medium tracking-tight text-[#14161A]">
            Ask your memory pool.
          </h1>
        </div>

        {turns.length === 0 ? (
          <div className="border-t border-[#E4DED2] pt-8 space-y-3 text-sm text-[#727376]">
            <p>Ask anything about what you have said.</p>
            <p>
              <Link href="/" className="word-action text-[#FF5A36]">
                speak
              </Link>{" "}
              to add a memory, or inspect{" "}
              <Link href="/memrooms" className="word-action text-[#14161A]">
                memrooms
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E4DED2] border-t border-[#E4DED2]">
            {turns.map((turn) => (
              <article key={turn.id} className="py-6 space-y-3">
                <p className="font-[family-name:var(--font-space-grotesk)] text-lg text-[#14161A]">
                  {turn.question}
                </p>
                <p className="text-base leading-relaxed text-[#4F5053] whitespace-pre-wrap">
                  {turn.answer}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-[#E4DED2] pt-6 space-y-3"
      >
        <div className="flex items-baseline gap-6">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about anything you said…"
            disabled={busy}
            className="flex-1 bg-transparent border-0 border-b border-[#E4DED2] focus:border-[#FF5A36] pb-2 text-lg text-[#14161A] placeholder:text-[#9AA0A6] focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="word-action font-[family-name:var(--font-space-grotesk)] text-lg font-medium text-[#14161A] disabled:opacity-40"
          >
            {busy ? "thinking…" : "send"}
          </button>
        </div>

        {error && <p className="text-sm text-[#FF5A36]">{error}</p>}
      </form>
    </section>
  );
}
