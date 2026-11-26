import { loadApiKey } from "@/lib/keystore";
import type { Memroom, MemroomKeywords } from "@/lib/memrooms";

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

async function requireKey(): Promise<string> {
  const key = await loadApiKey();
  if (!key) {
    throw new Error("MISSING_KEY");
  }
  return key;
}

async function callGemini(
  body: Record<string, unknown>,
  apiKey: string
): Promise<string> {
  const res = await fetch(GEMINI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    error?: { message?: string };
  };

  if (!res.ok) {
    throw new Error(data.error?.message || "Gemini API request failed.");
  }

  return (
    data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim() ?? ""
  );
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function transcribeAudioDirect(
  blob: Blob,
  rawMime: string
): Promise<{ text: string; keywords: MemroomKeywords }> {
  const apiKey = await requireKey();
  const base64Audio = await blobToBase64(blob);
  const mimeType = rawMime.split(";")[0] || "audio/webm";

  const now = new Date();
  const currentDate = now.toISOString().slice(0, 10);
  const currentWeekday = now.toLocaleDateString("en-US", { weekday: "long" });
  const currentTime = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const rawText = await callGemini(
    {
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Audio,
              },
            },
            {
              text: `Transcribe the spoken audio accurately into plain text with natural punctuation.
Also extract concise lowercase keywords for a memory room index across four categories:
- subjects: main people, topics, objects, or entities mentioned
- verbs: main actions or events mentioned
- timing: any times of day, durations, or time expressions mentioned (include "${currentTime}" if no specific time is spoken)
- date: any dates or days mentioned (resolve relative dates against today: ${currentWeekday}, ${currentDate}; include "${currentDate}" and "${currentWeekday.toLowerCase()}" if relevant)

If no speech is audible, return an empty string for text and empty arrays for all keyword categories.`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            text: { type: "STRING" },
            keywords: {
              type: "OBJECT",
              properties: {
                subjects: { type: "ARRAY", items: { type: "STRING" } },
                verbs: { type: "ARRAY", items: { type: "STRING" } },
                timing: { type: "ARRAY", items: { type: "STRING" } },
                date: { type: "ARRAY", items: { type: "STRING" } },
              },
              required: ["subjects", "verbs", "timing", "date"],
            },
          },
          required: ["text", "keywords"],
        },
      },
    },
    apiKey
  );

  const parsed = JSON.parse(rawText || "{}") as {
    text?: string;
    keywords?: Partial<MemroomKeywords>;
  };

  return {
    text: (parsed.text ?? "").trim(),
    keywords: {
      subjects: parsed.keywords?.subjects ?? [],
      verbs: parsed.keywords?.verbs ?? [],
      timing: parsed.keywords?.timing ?? [],
      date: parsed.keywords?.date ?? [],
    },
  };
}

export async function chatWithMemroomsDirect(
  message: string,
  memrooms: Memroom[],
  history: { question: string; answer: string }[]
): Promise<string> {
  const apiKey = await requireKey();

  const memroomsBlock =
    memrooms.length > 0
      ? memrooms
          .map((room, i) => {
            const k = room.keywords;
            return [
              `[Memroom ${i + 1} | recorded: ${room.createdAt}]`,
              `subjects: ${k.subjects.join(", ") || "none"}`,
              `verbs: ${k.verbs.join(", ") || "none"}`,
              `timing: ${k.timing.join(", ") || "none"}`,
              `date: ${k.date.join(", ") || "none"}`,
              `transcript: ${room.transcript}`,
            ].join("\n");
          })
          .join("\n\n")
      : "No memrooms recorded yet.";

  const historyBlock =
    history.length > 0
      ? history
          .map((t) => `User: ${t.question}\nROTE AI: ${t.answer}`)
          .join("\n\n")
      : "None";

  return callGemini(
    {
      contents: [
        {
          parts: [
            {
              text: `You are ROTE AI, a calm, helpful personal assistant with access to the user's Memrooms (voice transcripts indexed by subjects, verbs, timing, and date).
Talk naturally and conversationally. You can greet the user, chat, and answer general questions normally.
When the user asks about anything they said, recorded, or noted, use the Memrooms and chat history below to answer accurately. Only say you don't have a memory if they specifically ask about a past recording that isn't in the Memrooms.
Keep your replies clear, natural, and concise.

Memrooms:
${memroomsBlock}

Chat history:
${historyBlock}

User: ${message}`,
            },
          ],
        },
      ],
    },
    apiKey
  );
}

export async function organizeNotesDirect(
  notes: { id: string; text: string }[]
): Promise<Record<string, string>> {
  if (notes.length === 0) return {};
  const apiKey = await requireKey();

  const notesBlock = notes
    .map((n) => `id: ${n.id}\ntext: ${n.text}`)
    .join("\n\n");

  const rawText = await callGemini(
    {
      contents: [
        {
          parts: [
            {
              text: `Assign a short, clean 1-2 word topic label (Title Case, e.g., "Work", "Ideas", "Personal", "Meetings", "Health", "Shopping", "Reminders") to each note below.
Group related notes under the exact same topic name whenever they belong together.

Notes:
${notesBlock}`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            topics: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  id: { type: "STRING" },
                  topic: { type: "STRING" },
                },
                required: ["id", "topic"],
              },
            },
          },
          required: ["topics"],
        },
      },
    },
    apiKey
  );

  const parsed = JSON.parse(rawText || "{}") as {
    topics?: { id: string; topic: string }[];
  };

  const map: Record<string, string> = {};
  for (const item of parsed.topics ?? []) {
    if (item.id && item.topic) {
      map[item.id] = item.topic.trim();
    }
  }
  return map;
}
