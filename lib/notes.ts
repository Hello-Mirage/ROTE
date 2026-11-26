export interface RoteNote {
  id: string;
  text: string;
  topic?: string;
  createdAt: string;
}

const STORAGE_KEY = "rote_notes_v1";
const CHANGE_EVENT = "rote-notes-change";

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

export function saveNote(text: string, topic?: string): RoteNote {
  const note: RoteNote = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    text,
    ...(topic ? { topic } : {}),
    createdAt: new Date().toISOString(),
  };
  const existing = loadNotes();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([note, ...existing]));
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return note;
}

export function updateNoteTopics(topicMap: Record<string, string>): RoteNote[] {
  const updated = loadNotes().map((note) =>
    topicMap[note.id] ? { ...note, topic: topicMap[note.id] } : note
  );
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return updated;
}

export function deleteNote(id: string): RoteNote[] {
  const next = loadNotes().filter((n) => n.id !== id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return next;
}
