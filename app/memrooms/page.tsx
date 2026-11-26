"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import {
  clearMemrooms,
  deleteMemroom,
  loadMemrooms,
  subscribeMemrooms,
  type Memroom,
} from "@/lib/memrooms";

const EMPTY_ROOMS: Memroom[] = [];
let cachedRaw: string | null = null;
let cachedRooms: Memroom[] = EMPTY_ROOMS;

function getSnapshot(): Memroom[] {
  const raw = window.localStorage.getItem("rote_memrooms_v1");
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedRooms = loadMemrooms();
  }
  return cachedRooms;
}

function getServerSnapshot(): Memroom[] {
  return EMPTY_ROOMS;
}

export default function MemroomsPage() {
  const rooms = useSyncExternalStore(
    subscribeMemrooms,
    getSnapshot,
    getServerSnapshot
  );

  return (
    <section className="py-10 space-y-10">
      <div className="flex items-baseline justify-between">
        <div className="space-y-2">
          <p className="text-[11px] tracking-[0.22em] uppercase text-[#FF5A36] font-medium">
            Memory Pool
          </p>
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl sm:text-4xl font-medium tracking-tight text-[#14161A]">
            Your{" "}
            <span className="font-[family-name:var(--font-cursive)] italic font-normal text-4xl sm:text-5xl">
              memrooms.
            </span>
          </h1>
        </div>

        {rooms.length > 0 && (
          <button
            type="button"
            onClick={() => clearMemrooms()}
            className="word-action text-sm text-[#727376]"
          >
            clear all
          </button>
        )}
      </div>

      {rooms.length === 0 ? (
        <div className="border-t border-[#E4DED2] pt-8 space-y-4">
          <p className="text-[#727376]">No memrooms yet.</p>
          <Link href="/" className="word-action text-sm text-[#FF5A36]">
            speak
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-[#E4DED2] border-t border-[#E4DED2]">
          {rooms.map((room) => (
            <article key={room.id} className="py-6 space-y-4">
              <div className="space-y-1 text-xs text-[#727376]">
                {room.keywords.subjects.length > 0 && (
                  <p>
                    <span className="uppercase tracking-[0.14em] text-[#FF5A36]">
                      subjects
                    </span>{" "}
                    · {room.keywords.subjects.join(", ")}
                  </p>
                )}
                {room.keywords.verbs.length > 0 && (
                  <p>
                    <span className="uppercase tracking-[0.14em] text-[#4F5053]">
                      verbs
                    </span>{" "}
                    · {room.keywords.verbs.join(", ")}
                  </p>
                )}
                {room.keywords.timing.length > 0 && (
                  <p>
                    <span className="uppercase tracking-[0.14em] text-[#4F5053]">
                      timing
                    </span>{" "}
                    · {room.keywords.timing.join(", ")}
                  </p>
                )}
                {room.keywords.date.length > 0 && (
                  <p>
                    <span className="uppercase tracking-[0.14em] text-[#4F5053]">
                      date
                    </span>{" "}
                    · {room.keywords.date.join(", ")}
                  </p>
                )}
              </div>

              <p className="text-lg leading-relaxed text-[#14161A] whitespace-pre-wrap">
                {room.transcript}
              </p>

              <div className="flex items-baseline justify-between text-xs text-[#727376]">
                <time dateTime={room.createdAt}>
                  {new Date(room.createdAt).toLocaleString()}
                </time>
                <button
                  type="button"
                  onClick={() => deleteMemroom(room.id)}
                  className="word-action text-sm"
                >
                  delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
