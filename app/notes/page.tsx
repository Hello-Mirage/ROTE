"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { deleteNote, loadNotes, type RoteNote } from "@/lib/notes";

const EMPTY_NOTES: RoteNote[] = [];
let cachedRaw: string | null = null;
let cachedNotes: RoteNote[] = EMPTY_NOTES;

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("rote-notes-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("rote-notes-change", callback);
  };
}

function getSnapshot(): RoteNote[] {
  const raw = window.localStorage.getItem("rote_notes_v1");
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedNotes = loadNotes();
  }
  return cachedNotes;
}

function getServerSnapshot(): RoteNote[] {
  return EMPTY_NOTES;
}

export default function NotesPage() {
  const notes = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function handleCopy(note: RoteNote) {
    await navigator.clipboard.writeText(note.text);
    setCopiedId(note.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  function handleDelete(id: string) {
    deleteNote(id);
    window.dispatchEvent(new Event("rote-notes-change"));
  }

  return (
    <section className="py-10 space-y-10">
      <div className="space-y-2">
        <p className="text-[11px] tracking-[0.22em] uppercase text-[#FF5A36] font-medium">
          Notes
        </p>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl sm:text-4xl font-medium tracking-tight text-[#14161A]">
          Everything you{" "}
          <span className="font-[family-name:var(--font-cursive)] italic font-normal text-4xl sm:text-5xl">
            said.
          </span>
        </h1>
      </div>

      {notes.length === 0 ? (
        <div className="border-t border-[#E4DED2] pt-8 space-y-4">
          <p className="text-[#727376]">Nothing roted down yet.</p>
          <Link href="/" className="word-action text-sm text-[#FF5A36]">
            speak
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-[#E4DED2] border-t border-[#E4DED2]">
          {notes.map((note) => (
            <article key={note.id} className="py-6 space-y-4">
              <p className="text-lg leading-relaxed text-[#14161A] whitespace-pre-wrap">
                {note.text}
              </p>
              <div className="flex items-baseline justify-between text-xs text-[#727376]">
                <time dateTime={note.createdAt}>
                  {new Date(note.createdAt).toLocaleString()}
                </time>
                <div className="flex items-baseline gap-5 text-sm">
                  <button
                    type="button"
                    onClick={() => handleCopy(note)}
                    className="word-action"
                  >
                    {copiedId === note.id ? "copied" : "copy"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(note.id)}
                    className="word-action"
                  >
                    delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
