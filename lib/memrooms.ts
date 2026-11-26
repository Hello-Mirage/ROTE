export interface MemroomKeywords {
  subjects: string[];
  verbs: string[];
  timing: string[];
  date: string[];
}

export interface Memroom {
  id: string;
  keywords: MemroomKeywords;
  transcript: string;
  createdAt: string;
}

export interface MemroomMatch {
  room: Memroom;
  matchedKeywords: string[];
  score: number;
}

const STORAGE_KEY = "rote_memrooms_v1";
const CHANGE_EVENT = "rote-memrooms-change";

function normalizeList(items: string[]): string[] {
  const seen = new Set<string>();
  for (const item of items) {
    const clean = item.trim().toLowerCase();
    if (clean) seen.add(clean);
  }
  return Array.from(seen);
}

export function normalizeKeywords(kw: Partial<MemroomKeywords>): MemroomKeywords {
  return {
    subjects: normalizeList(kw.subjects ?? []),
    verbs: normalizeList(kw.verbs ?? []),
    timing: normalizeList(kw.timing ?? []),
    date: normalizeList(kw.date ?? []),
  };
}

export function loadMemrooms(): Memroom[] {
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

export function addMemroom(
  transcript: string,
  keywords: Partial<MemroomKeywords>
): Memroom {
  const room: Memroom = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    keywords: normalizeKeywords(keywords),
    transcript: transcript.trim(),
    createdAt: new Date().toISOString(),
  };
  const existing = loadMemrooms();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([room, ...existing]));
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return room;
}

export function deleteMemroom(id: string): Memroom[] {
  const next = loadMemrooms().filter((r) => r.id !== id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return next;
}

export function clearMemrooms(): void {
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeMemrooms(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function flattenKeywords(kw: MemroomKeywords): string[] {
  return [...kw.subjects, ...kw.verbs, ...kw.timing, ...kw.date];
}

function termsMatch(queryTerm: string, roomTerm: string): boolean {
  if (queryTerm === roomTerm) return true;
  if (queryTerm.length >= 3 && roomTerm.includes(queryTerm)) return true;
  if (roomTerm.length >= 3 && queryTerm.includes(roomTerm)) return true;
  return false;
}

/**
 * Match extracted query keywords against Memrooms locally.
 * Only rooms with at least one matching keyword are returned.
 */
export function matchMemrooms(
  queryKeywords: MemroomKeywords,
  rooms: Memroom[]
): MemroomMatch[] {
  const qTerms = flattenKeywords(normalizeKeywords(queryKeywords));
  if (qTerms.length === 0) return [];

  const matches: MemroomMatch[] = [];

  for (const room of rooms) {
    const rTerms = flattenKeywords(room.keywords);
    const matched = new Set<string>();

    for (const q of qTerms) {
      for (const r of rTerms) {
        if (termsMatch(q, r)) {
          matched.add(r);
        }
      }
    }

    if (matched.size > 0) {
      matches.push({
        room,
        matchedKeywords: Array.from(matched),
        score: matched.size,
      });
    }
  }

  return matches.sort((a, b) => b.score - a.score);
}
