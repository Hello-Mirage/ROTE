import { GoogleGenAI } from "@google/genai";

export const maxDuration = 60;

interface MemroomInput {
  keywords: {
    subjects: string[];
    verbs: string[];
    timing: string[];
    date: string[];
  };
  transcript: string;
  createdAt: string;
}

interface ChatTurnInput {
  question: string;
  answer: string;
}

interface ChatRequest {
  message: string;
  memrooms?: MemroomInput[];
  history?: ChatTurnInput[];
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    return Response.json(
      { error: "Missing GEMINI_API_KEY in .env" },
      { status: 500 }
    );
  }

  try {
    const body = (await request.json()) as ChatRequest;
    const message = body.message?.trim();

    if (!message) {
      return Response.json({ error: "Empty message" }, { status: 400 });
    }

    const memrooms = body.memrooms ?? [];
    const history = body.history ?? [];

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

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { apiVersion: "v1beta" },
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are ROTE AI, a calm, helpful personal assistant with access to the user's Memrooms (voice transcripts indexed by subjects, verbs, timing, and date).
Talk naturally and conversationally. You can greet the user, chat, and answer general questions normally.
When the user asks about anything they said, recorded, or noted, use the Memrooms and chat history below to answer accurately. Only say you don't have a memory if they specifically ask about a past recording that isn't in the Memrooms.
Keep your replies clear, natural, and concise.

Memrooms:
${memroomsBlock}

Chat history:
${historyBlock}

User: ${message}`,
    });

    return Response.json({ reply: (response.text ?? "").trim() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Chat request failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
