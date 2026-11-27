"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { organizeNotesDirect, transcribeAudioDirect } from "@/lib/gemini";
import { hasStoredApiKey } from "@/lib/keystore";
import { addMemroom, type MemroomKeywords } from "@/lib/memrooms";
import { saveNote, updateNoteTopics } from "@/lib/notes";

type Status = "idle" | "recording" | "transcribing";

const SPEECH_THRESHOLD = 0.015;
const SILENCE_DURATION_MS = 1100;
const MIN_CHUNK_DURATION_MS = 600;
const AUTO_STOP_SILENCE_MS = 6000;

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
    return "audio/webm;codecs=opus";
  }
  if (MediaRecorder.isTypeSupported("audio/webm")) {
    return "audio/webm";
  }
  if (MediaRecorder.isTypeSupported("audio/mp4")) {
    return "audio/mp4";
  }
  return "";
}

function emptyKeywords(): MemroomKeywords {
  return { subjects: [], verbs: [], timing: [], date: [] };
}

function mergeKeywords(a: MemroomKeywords, b: MemroomKeywords): MemroomKeywords {
  return {
    subjects: Array.from(new Set([...a.subjects, ...b.subjects])),
    verbs: Array.from(new Set([...a.verbs, ...b.verbs])),
    timing: Array.from(new Set([...a.timing, ...b.timing])),
    date: Array.from(new Set([...a.date, ...b.date])),
  };
}

export default function SpeakAppPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [transcript, setTranscript] = useState("");
  const [lastKeywords, setLastKeywords] = useState<MemroomKeywords | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const vadTimerRef = useRef<number | null>(null);
  const isRecordingRef = useRef(false);
  const hasSpokenRef = useRef(false);
  const chunkStartRef = useRef(0);
  const silenceStartRef = useRef<number | null>(null);
  const lastSpeechAtRef = useRef(0);
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const sessionTextRef = useRef("");
  const sessionKwRef = useRef<MemroomKeywords>(emptyKeywords());

  function cleanupAudio() {
    if (vadTimerRef.current !== null) {
      window.clearInterval(vadTimerRef.current);
      vadTimerRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  useEffect(() => {
    return () => {
      isRecordingRef.current = false;
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
      cleanupAudio();
    };
  }, []);

  async function transcribeBlob(blob: Blob, mime: string) {
    return transcribeAudioDirect(blob, mime);
  }

  function startChunkRecorder(stream: MediaStream, mimeType: string) {
    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);
    const chunks: Blob[] = [];
    const hadSpeech = { value: false };

    hasSpokenRef.current = false;
    chunkStartRef.current = Date.now();
    silenceStartRef.current = null;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      const shouldTranscribe = hadSpeech.value || hasSpokenRef.current;
      const actualMime = recorder.mimeType || mimeType || "audio/webm";
      const blob = new Blob(chunks, { type: actualMime });

      if (!shouldTranscribe || blob.size === 0) {
        return;
      }

      const fetchPromise = transcribeBlob(blob, actualMime);
      queueRef.current = queueRef.current.then(async () => {
        try {
          const data = await fetchPromise;
          const chunkText = (data.text ?? "").trim();
          if (!chunkText) return;

          setTranscript((prev) => (prev ? `${prev} ${chunkText}` : chunkText));
          sessionTextRef.current = sessionTextRef.current
            ? `${sessionTextRef.current} ${chunkText}`
            : chunkText;

          if (data.keywords) {
            sessionKwRef.current = mergeKeywords(
              sessionKwRef.current,
              data.keywords
            );
            setLastKeywords(sessionKwRef.current);
          }
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not reach transcription service."
          );
        }
      });
    };

    const originalStop = recorder.stop.bind(recorder);
    recorder.stop = () => {
      hadSpeech.value = hasSpokenRef.current;
      originalStop();
    };

    recorderRef.current = recorder;
    recorder.start();
  }

  async function startRecording() {
    setError("");
    setSaved(false);
    sessionTextRef.current = "";
    sessionKwRef.current = emptyKeywords();
    queueRef.current = Promise.resolve();

    if (!hasStoredApiKey()) {
      setError("MISSING_KEY");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Microphone is not available in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      isRecordingRef.current = true;
      lastSpeechAtRef.current = Date.now();

      const mimeType = pickMimeType();
      startChunkRecorder(stream, mimeType);
      setStatus("recording");

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;

      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        audioCtxRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 1024;
        source.connect(analyser);

        const dataArray = new Float32Array(analyser.fftSize);

        vadTimerRef.current = window.setInterval(() => {
          if (!isRecordingRef.current) return;

          analyser.getFloatTimeDomainData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i] * dataArray[i];
          }
          const rms = Math.sqrt(sum / dataArray.length);
          const now = Date.now();

          if (rms >= SPEECH_THRESHOLD) {
            hasSpokenRef.current = true;
            silenceStartRef.current = null;
            lastSpeechAtRef.current = now;
          } else {
            if (now - lastSpeechAtRef.current >= AUTO_STOP_SILENCE_MS) {
              void stopRecording();
              return;
            }

            if (hasSpokenRef.current) {
              if (silenceStartRef.current === null) {
                silenceStartRef.current = now;
              } else if (
                now - silenceStartRef.current >= SILENCE_DURATION_MS &&
                now - chunkStartRef.current >= MIN_CHUNK_DURATION_MS
              ) {
                const current = recorderRef.current;
                if (current && current.state === "recording") {
                  current.stop();
                  startChunkRecorder(stream, mimeType);
                }
              }
            }
          }
        }, 100);
      }
    } catch {
      cleanupAudio();
      isRecordingRef.current = false;
      setError("Microphone permission denied.");
      setStatus("idle");
    }
  }

  async function stopRecording() {
    isRecordingRef.current = false;

    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    cleanupAudio();

    setStatus("transcribing");
    await queueRef.current;

    if (sessionTextRef.current) {
      addMemroom(sessionTextRef.current, sessionKwRef.current);
      setLastKeywords(sessionKwRef.current);
    }

    setStatus("idle");
  }

  async function handleCopy() {
    if (!transcript) return;
    await navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleSave() {
    if (!transcript) return;
    const note = saveNote(transcript);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);

    organizeNotesDirect([{ id: note.id, text: note.text }])
      .then((map) => {
        if (Object.keys(map).length > 0) {
          updateNoteTopics(map);
        }
      })
      .catch(() => {});
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
    <section className="flex-1 flex flex-col py-10">
      <div className="space-y-10">
        <div className="space-y-4">
          <p className="text-[11px] tracking-[0.22em] uppercase text-[#FF5A36] font-medium">
            Voice
          </p>

          <div className="flex items-baseline gap-6">
            {status === "idle" && (
              <button
                type="button"
                onClick={startRecording}
                className="word-action font-[family-name:var(--font-space-grotesk)] text-5xl sm:text-6xl font-normal tracking-tight text-[#14161A]"
              >
                Speak
              </button>
            )}

            {status === "recording" && (
              <div className="flex items-baseline gap-8">
                <span className="font-[family-name:var(--font-cursive)] italic text-6xl sm:text-7xl tracking-tight text-[#FF5A36] inline-flex items-center gap-4">
                  listening
                  <span
                    aria-hidden="true"
                    className="inline-block w-2.5 h-2.5 rounded-full bg-[#FF5A36]"
                  />
                </span>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="word-action font-[family-name:var(--font-space-grotesk)] text-2xl sm:text-3xl font-normal tracking-tight text-[#727376]"
                >
                  Stop
                </button>
              </div>
            )}

            {status === "transcribing" && (
              <span className="font-[family-name:var(--font-cursive)] italic text-6xl sm:text-7xl tracking-tight text-[#727376]">
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

          {error === "MISSING_KEY" ? (
            <p className="text-sm text-[#FF5A36]">
              Add your Google AI Studio{" "}
              <Link href="/key" className="word-action">
                key
              </Link>{" "}
              first.
            </p>
          ) : (
            error && <p className="text-sm text-[#FF5A36]">{error}</p>
          )}

          {transcript && (
            <div className="flex items-baseline gap-6 text-sm text-[#727376]">
              <button
                type="button"
                onClick={handleCopy}
                className="word-action"
              >
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="word-action"
              >
                {saved ? "Saved" : "Save"}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="word-action"
              >
                Clear
              </button>
              <Link href="/chat" className="word-action text-[#FF5A36]">
                Ask chat
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
