import Link from "next/link";

const steps = [
  {
    num: "01",
    title: "Speak normally",
    body: "Capture thoughts the moment they happen, without friction.",
  },
  {
    num: "02",
    title: "Words, not noise",
    body: "Speech turns directly into clean, readable text.",
  },
  {
    num: "03",
    title: "Always yours",
    body: "Keep what matters in your notes and leave the rest behind.",
  },
];

export default function AboutPage() {
  return (
    <section className="py-12 space-y-12">
      <div className="space-y-3">
        <p className="text-[11px] tracking-[0.22em] uppercase text-[#FF5A36] font-medium">
          Introducing Rote
        </p>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-4xl sm:text-5xl font-medium tracking-tight text-[#14161A]">
          Just R O T E it down.
        </h1>
        <p className="text-[#4F5053] text-lg max-w-xl leading-relaxed">
          Speak freely. Rote listens and writes it down cleanly.
        </p>
      </div>

      <div className="divide-y divide-[#E4DED2] border-t border-b border-[#E4DED2]">
        {steps.map((step) => (
          <div
            key={step.num}
            className="py-6 grid grid-cols-[3rem_1fr] gap-4 items-baseline"
          >
            <span className="font-[family-name:var(--font-space-grotesk)] text-sm text-[#FF5A36] font-medium">
              {step.num}
            </span>
            <div className="space-y-1">
              <h2 className="font-[family-name:var(--font-space-grotesk)] text-lg font-medium text-[#14161A]">
                {step.title}
              </h2>
              <p className="text-sm text-[#4F5053] leading-relaxed">
                {step.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div>
        <Link href="/" className="word-action text-sm text-[#FF5A36]">
          speak
        </Link>
      </div>
    </section>
  );
}
