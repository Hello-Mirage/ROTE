import { GoogleGenAI, Type } from "@google/genai";

export const maxDuration = 60;

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    return Response.json(
      { error: "Missing GEMINI_API_KEY in .env" },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const audio = formData.get("audio");

    if (!(audio instanceof Blob) || audio.size === 0) {
      return Response.json(
        { error: "No audio received" },
        { status: 400 }
      );
    }

    const arrayBuffer = await audio.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");
    const rawMime = audio.type || "audio/webm";
    const mimeType = rawMime.split(";")[0] || "audio/webm";

    const now = new Date();
    const currentDate = now.toISOString().slice(0, 10);
    const currentWeekday = now.toLocaleDateString("en-US", { weekday: "long" });
    const currentTime = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { apiVersion: "v1beta" },
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType,
            data: base64Audio,
          },
        },
        `Transcribe the spoken audio accurately into plain text with natural punctuation.
Also extract concise lowercase keywords for a memory room index across four categories:
- subjects: main people, topics, objects, or entities mentioned
- verbs: main actions or events mentioned (base/infinitive or spoken form)
- timing: any times of day, durations, or time expressions mentioned (include "${currentTime}" if no specific time is spoken)
- date: any dates or days mentioned (resolve relative dates against today: ${currentWeekday}, ${currentDate}; include "${currentDate}" and "${currentWeekday.toLowerCase()}" if relevant)

If no speech is audible, return an empty string for text and empty arrays for all keyword categories.`,
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            keywords: {
              type: Type.OBJECT,
              properties: {
                subjects: { type: Type.ARRAY, items: { type: Type.STRING } },
                verbs: { type: Type.ARRAY, items: { type: Type.STRING } },
                timing: { type: Type.ARRAY, items: { type: Type.STRING } },
                date: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["subjects", "verbs", "timing", "date"],
            },
          },
          required: ["text", "keywords"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}") as {
      text?: string;
      keywords?: {
        subjects?: string[];
        verbs?: string[];
        timing?: string[];
        date?: string[];
      };
    };

    const text = (parsed.text ?? "").trim();
    const keywords = {
      subjects: parsed.keywords?.subjects ?? [],
      verbs: parsed.keywords?.verbs ?? [],
      timing: parsed.keywords?.timing ?? [],
      date: parsed.keywords?.date ?? [],
    };

    return Response.json({ text, keywords });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to transcribe audio";
    return Response.json({ error: message }, { status: 500 });
  }
}
