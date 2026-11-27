"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const whatRoteIs = [
  {
    num: "01",
    title: "Carry it",
    body: "Use it as a normal pen. Nothing extra to wear.",
  },
  {
    num: "02",
    title: "It records",
    body: "The built-in mic captures your voice.",
  },
  {
    num: "03",
    title: "Listen later",
    body: "Recordings go to your phone to hear later.",
  },
];

const voiceCommands = [
  {
    command: "“Wake up”",
    body: "Rote stays awake and records every voice it hears, until you tell it to stop.",
  },
  {
    command: "“Stop”",
    body: "Rote goes back to its normal mode.",
  },
];

const summaryPoints = [
  {
    title: "Always with you",
    body: "It is a pen, so you already carry it.",
  },
  {
    title: "On your phone",
    body: "Listen back at the end of the day.",
  },
];

export default function LandingPage() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;

    const update = () => {
      const y = window.scrollY;
      const p = Math.min(1, Math.max(0, y / 260));
      setProgress(p);
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Desktop scroll transform: horizontal centered -> rotated on the right side, lower-middle
  const rotateDeg = -90 * progress;
  const translateX = 215 * progress;
  const translateY = 76 * progress;
  const scale = 1 - 0.12 * progress;

  return (
    <div ref={stageRef} className="py-10 space-y-20">
      {/* Hero */}
      <section className="space-y-6">
        <p className="text-[11px] tracking-[0.22em] uppercase text-[#FF5A36] font-medium">
          Introducing
        </p>

        <h1 className="text-4xl sm:text-6xl tracking-tight text-[#14161A] leading-[1.08]">
          <span className="font-[family-name:var(--font-brand)] font-bold">
            R O T E
          </span>{" "}
          <span className="font-[family-name:var(--font-cursive)] italic text-[#FF5A36]">
            ace
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-[#4F5053] max-w-xl leading-relaxed">
          A pen with a built-in microphone that records your voice and sends it
          to your phone.
        </p>

        <div className="pt-2 flex flex-wrap items-baseline gap-6 text-base">
          <Link href="/app" className="word-action">
            Go to the rote ai
          </Link>
          <Link href="/key" className="word-action text-sm">
            Add api key
          </Link>
        </div>

        {/* Mobile horizontal pen */}
        <div className="pt-8 lg:hidden">
          <img
            src="/rote-pen.png"
            alt="ROTE ace pen"
            className="w-full max-w-md mx-auto h-auto mix-blend-multiply select-none"
          />
        </div>
      </section>

      {/* Desktop sticky pen + left-side slide info */}
      <div className="relative">
        {/* Sticky pen stage on desktop */}
        <div className="hidden lg:block sticky top-[44vh] z-10 pointer-events-none h-0">
          <div className="flex justify-center">
            <img
              src="/rote-pen.png"
              alt="ROTE ace pen"
              style={{
                transform: `translate3d(${translateX}px, ${translateY}px, 0) rotate(${rotateDeg}deg) scale(${scale})`,
                transformOrigin: "center center",
              }}
              className="w-[460px] h-auto mix-blend-multiply select-none will-change-transform"
            />
          </div>
        </div>

        {/* Left-hand slide sections */}
        <div className="space-y-24 lg:w-[60%] lg:pt-36">
          {/* Slide 2: What Rote Is */}
          <section className="space-y-8 border-t border-[#E4DED2] pt-10">
            <div className="space-y-3">
              <p className="text-[11px] tracking-[0.22em] uppercase text-[#FF5A36] font-medium">
                What Rote Is
              </p>
              <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl sm:text-4xl font-medium tracking-tight text-[#14161A]">
                A pen with a{" "}
                <span className="font-[family-name:var(--font-cursive)] italic font-normal text-4xl sm:text-5xl">
                  microphone.
                </span>
              </h2>
              <p className="text-base text-[#4F5053] leading-relaxed">
                Rote looks and writes like an ordinary pen. Inside is a tiny
                microphone that records your voice.
              </p>
            </div>

            <div className="divide-y divide-[#E4DED2] border-t border-b border-[#E4DED2]">
              {whatRoteIs.map((item) => (
                <div
                  key={item.num}
                  className="py-5 grid grid-cols-[2.5rem_1fr] gap-4 items-baseline"
                >
                  <span className="font-[family-name:var(--font-space-grotesk)] text-sm text-[#FF5A36] font-medium">
                    {item.num}
                  </span>
                  <div className="space-y-1">
                    <h3 className="font-[family-name:var(--font-space-grotesk)] text-lg font-medium text-[#14161A]">
                      {item.title}
                    </h3>
                    <p className="text-sm text-[#4F5053] leading-relaxed">
                      {item.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Slide 4: Voice Commands */}
          <section className="space-y-8 border-t border-[#E4DED2] pt-10">
            <div className="space-y-3">
              <p className="text-[11px] tracking-[0.22em] uppercase text-[#FF5A36] font-medium">
                Voice Commands
              </p>
              <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl sm:text-4xl font-medium tracking-tight text-[#14161A]">
                Stay awake when you{" "}
                <span className="font-[family-name:var(--font-cursive)] italic font-normal text-4xl sm:text-5xl">
                  need to.
                </span>
              </h2>
              <p className="text-base text-[#4F5053] leading-relaxed">
                Two spoken commands give you control. Useful for meetings,
                lectures, interviews and conversations.
              </p>
            </div>

            <div className="divide-y divide-[#E4DED2] border-t border-b border-[#E4DED2]">
              {voiceCommands.map((item) => (
                <div key={item.command} className="py-5 space-y-1">
                  <h3 className="font-[family-name:var(--font-cursive)] italic text-2xl text-[#FF5A36]">
                    {item.command}
                  </h3>
                  <p className="text-sm text-[#4F5053] leading-relaxed">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Slide 5: In Short */}
          <section className="space-y-8 border-t border-[#E4DED2] pt-10">
            <div className="space-y-3">
              <p className="text-[11px] tracking-[0.22em] uppercase text-[#FF5A36] font-medium">
                In Short
              </p>
              <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl sm:text-4xl font-medium tracking-tight text-[#14161A]">
                Hear everything you{" "}
                <span className="font-[family-name:var(--font-cursive)] italic font-normal text-4xl sm:text-5xl">
                  said.
                </span>
              </h2>
            </div>

            <div className="divide-y divide-[#E4DED2] border-t border-b border-[#E4DED2]">
              {summaryPoints.map((item) => (
                <div key={item.title} className="py-5 space-y-1">
                  <h3 className="font-[family-name:var(--font-space-grotesk)] text-lg font-medium text-[#14161A]">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[#4F5053] leading-relaxed">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2 space-y-4">
              <p className="text-2xl text-[#14161A]">
                <span className="font-[family-name:var(--font-cursive)] italic">
                  Just
                </span>{" "}
                <span className="font-[family-name:var(--font-brand)] font-bold">
                  R O T E
                </span>{" "}
                <span className="font-[family-name:var(--font-cursive)] italic">
                  it down.
                </span>
              </p>
              <div>
                <Link href="/app" className="word-action text-base">
                  Go to the rote ai
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
