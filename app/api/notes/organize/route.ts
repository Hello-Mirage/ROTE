import { GoogleGenAI, Type } from "@google/genai";

export const maxDuration = 60;

interface NoteInput {
  id: string;
  text: string;
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
    const body = (await request.json()) as { notes?: NoteInput[] };
    const notes = body.notes ?? [];

    if (notes.length === 0) {
      return Response.json({ topics: [] });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { apiVersion: "v1beta" },
    });

    const notesBlock = notes
      .map((n) => `id: ${n.id}\ntext: ${n.text}`)
      .join("\n\n");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Assign a short, clean 1-2 word topic label (Title Case, e.g., "Work", "Ideas", "Personal", "Meetings", "Health", "Shopping", "Reminders") to each note below.
Group related notes under the exact same topic name whenever they belong together.

Notes:
${notesBlock}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  topic: { type: Type.STRING },
                },
                required: ["id", "topic"],
              },
            },
          },
          required: ["topics"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}") as {
      topics?: { id: string; topic: string }[];
    };

    return Response.json({ topics: parsed.topics ?? [] });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to organize notes";
    return Response.json({ error: message }, { status: 500 });
  }
}
