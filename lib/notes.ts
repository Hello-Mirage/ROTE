export interface RoteNote {
  id: string;
  text: string;
  createdAt: string;
}

const STORAGE_KEY = "rote_notes_v1";

export function loadNotes(): RoteNote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveNote(text: string): RoteNote {
  const note: RoteNote = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    text,
    createdAt: new Date().toISOString(),
  };
  const existing = loadNotes();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([note, ...existing]));
  return note;
}

export function deleteNote(id: string): RoteNote[] {
  const next = loadNotes().filter((n) => n.id !== id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
