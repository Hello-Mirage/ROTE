"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { organizeNotesDirect } from "@/lib/gemini";
import { hasStoredApiKey } from "@/lib/keystore";
import {
  deleteNote,
  loadNotes,
  updateNoteTopics,
  type RoteNote,
} from "@/lib/notes";

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
  const [organizing, setOrganizing] = useState(false);
  const autoRanRef = useRef(false);

  const organizeNotes = useCallback(async (targetNotes: RoteNote[]) => {
    if (targetNotes.length === 0 || !hasStoredApiKey()) return;
    setOrganizing(true);
    try {
      const map = await organizeNotesDirect(
        targetNotes.map((n) => ({ id: n.id, text: n.text }))
      );
      if (Object.keys(map).length > 0) {
        updateNoteTopics(map);
      }
    } catch {
      // Silent fallback: notes remain visible under General
    } finally {
      setOrganizing(false);
    }
  }, []);

  useEffect(() => {
    if (autoRanRef.current || notes.length === 0 || !hasStoredApiKey()) return;
    const uncategorized = notes.filter((n) => !n.topic);
    if (uncategorized.length === 0) return;

    autoRanRef.current = true;
    organizeNotesDirect(notes.map((n) => ({ id: n.id, text: n.text })))
      .then((map) => {
        if (Object.keys(map).length > 0) {
          updateNoteTopics(map);
        }
      })
      .catch(() => {});
  }, [notes]);

  async function handleCopy(note: RoteNote) {
    await navigator.clipboard.writeText(note.text);
    setCopiedId(note.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  function handleDelete(id: string) {
    deleteNote(id);
  }

  // Group notes by topic preserving most-recent-first order
  const grouped = notes.reduce<Record<string, RoteNote[]>>((acc, note) => {
    const key = note.topic || "General";
    if (!acc[key]) acc[key] = [];
    acc[key].push(note);
    return acc;
  }, {});
  const topics = Object.keys(grouped);

  return (
    <section className="py-10 space-y-10">
      <div className="flex items-baseline justify-between gap-4">
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

        {notes.length > 0 && (
          <button
            type="button"
            disabled={organizing}
            onClick={() => void organizeNotes(notes)}
            className="word-action text-sm disabled:opacity-40"
          >
            {organizing ? "organizing…" : "organize"}
          </button>
        )}
      </div>

      {notes.length === 0 ? (
        <div className="border-t border-[#E4DED2] pt-8 space-y-4">
          <p className="text-[#727376]">Nothing roted down yet.</p>
          <Link href="/" className="word-action text-sm">
            speak
          </Link>
        </div>
      ) : (
        <div className="space-y-10 border-t border-[#E4DED2] pt-8">
          {topics.map((topic) => (
            <div key={topic} className="space-y-2">
              <h2 className="font-[family-name:var(--font-cursive)] italic text-2xl text-[#FF5A36]">
                {topic}
              </h2>

              <div className="divide-y divide-[#E4DED2] border-t border-[#E4DED2]">
                {grouped[topic].map((note) => (
                  <article key={note.id} className="py-5 space-y-3">
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
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
