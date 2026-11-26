"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { addMemroom, type MemroomKeywords } from "@/lib/memrooms";
import { saveNote } from "@/lib/notes";

type Status = "idle" | "recording" | "transcribing";

export default function Home() {
  const [status, setStatus] = useState<Status>("idle");
  const [transcript, setTranscript] = useState("");
  const [lastKeywords, setLastKeywords] = useState<MemroomKeywords | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  async function startRecording() {
    setError("");
    setSaved(false);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Microphone is not available in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "";

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        if (blob.size === 0) {
          setStatus("idle");
          return;
        }

        setStatus("transcribing");

        try {
          const formData = new FormData();
          formData.append("audio", blob, "speech.webm");

          const res = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();

          if (!res.ok) {
            setError(data.error || "Transcription failed.");
          } else if (data.text) {
            setTranscript((prev) =>
              prev ? `${prev}\n\n${data.text}` : data.text
            );
            const kw: MemroomKeywords = data.keywords ?? {
              subjects: [],
              verbs: [],
              timing: [],
              date: [],
            };
            addMemroom(data.text, kw);
            setLastKeywords(kw);
          }
        } catch {
          setError("Could not reach transcription service.");
        } finally {
          setStatus("idle");
        }
      };

      recorderRef.current = recorder;
      recorder.start();
      setStatus("recording");
    } catch {
      setError("Microphone permission denied.");
      setStatus("idle");
    }
  }

  function stopRecording() {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  }

  async function handleCopy() {
    if (!transcript) return;
    await navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleSave() {
    if (!transcript) return;
    saveNote(transcript);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function handleClear() {
    setTranscript("");
    setLastKeywords(null);
    setError("");
    setSaved(false);
    setCopied(false);
  }

  const keywordSummary = lastKeywords
    ? [
        ...lastKeywords.subjects,
        ...lastKeywords.verbs,
        ...lastKeywords.timing,
        ...lastKeywords.date,
      ].filter(Boolean)
    : [];

  return (
    <section className="flex-1 flex flex-col justify-center py-12">
      <div className="space-y-10">
        <div className="space-y-4">
          <p className="text-[11px] tracking-[0.22em] uppercase text-[#FF5A36] font-medium">
            Just R O T E it down
          </p>

          <div className="flex items-baseline gap-6">
            {status === "idle" && (
              <button
                type="button"
                onClick={startRecording}
                className="word-action font-[family-name:var(--font-space-grotesk)] text-5xl sm:text-6xl font-medium tracking-tight text-[#14161A]"
              >
                speak
              </button>
            )}

            {status === "recording" && (
              <div className="flex items-baseline gap-8">
                <span className="font-[family-name:var(--font-space-grotesk)] text-5xl sm:text-6xl font-medium tracking-tight text-[#FF5A36] inline-flex items-center gap-4">
                  listening
                  <span
                    aria-hidden="true"
                    className="inline-block w-2.5 h-2.5 rounded-full bg-[#FF5A36]"
                  />
                </span>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="word-action font-[family-name:var(--font-space-grotesk)] text-2xl sm:text-3xl font-medium tracking-tight text-[#727376]"
                >
                  stop
                </button>
              </div>
            )}

            {status === "transcribing" && (
              <span className="font-[family-name:var(--font-space-grotesk)] text-5xl sm:text-6xl font-medium tracking-tight text-[#727376]">
                transcribing…
              </span>
            )}
          </div>
        </div>

        <div className="border-t border-[#E4DED2] pt-8 space-y-6">
          {transcript ? (
            <p className="text-xl sm:text-2xl leading-relaxed text-[#14161A] whitespace-pre-wrap">
              {transcript}
            </p>
          ) : (
            <p className="text-lg text-[#9AA0A6]">
              Your words will appear here.
            </p>
          )}

          {keywordSummary.length > 0 && (
            <p className="text-xs text-[#727376]">
              memroom:{" "}
              <span className="text-[#4F5053]">
                {keywordSummary.join(" · ")}
              </span>
            </p>
          )}

          {error && <p className="text-sm text-[#FF5A36]">{error}</p>}

          {transcript && (
            <div className="flex items-baseline gap-6 text-sm text-[#727376]">
              <button
                type="button"
                onClick={handleCopy}
                className="word-action"
              >
                {copied ? "copied" : "copy"}
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="word-action"
              >
                {saved ? "saved" : "save"}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="word-action"
              >
                clear
              </button>
              <Link href="/chat" className="word-action text-[#FF5A36]">
                ask chat
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
