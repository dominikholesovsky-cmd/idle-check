import { useState, type CSSProperties } from "react";
import { RX7_SAMPLE } from "@/lib/ghost/carImages";

const SEV = {
  HIGH: "bg-sev-high text-sev-high-fg",
  MED: "bg-sev-med text-sev-med-fg",
  LOW: "bg-sev-low text-sev-low-fg",
} as const;

// Desktop label chips and leader lines, in percent of the 1366x480 desktop frame (the image fills the
// top 409px, the rest holds the lower chip). x/y are the chip centre; the leader runs chip -> pin.
const CHIPS = [
  { left: 12.4, top: 22.9 },
  { left: 30.7, top: 7.1 },
  { left: 46.9, top: 91.7 },
];
const LEADERS = "M250 130 L310 163 M440 72 L452 168 M640 338 L640 405";

// Static marketing content: a labeled sample, never driven by the user's vehicle. The three findings
// are the app's real free-preview findings for an RX-7 (see generateIssues in src/lib/ghost/procedural.ts);
// their text and the pin positions come from mazda-rx7.slots.json.
// On mobile it sits in its own panel; on desktop the page band is the panel.
export function SamplePreviewCard({ className = "" }: { className?: string }) {
  const { image, findings } = RX7_SAMPLE;
  const [aw, ah] = image.aspect;
  const [selected, setSelected] = useState(1);
  const caption = findings[selected - 1];
  const counts = {
    HIGH: findings.filter((f) => f.severity === "HIGH").length,
    MED: findings.filter((f) => f.severity === "MED").length,
  };

  return (
    <section
      aria-label="Sample preview"
      className={`rounded-[18px] border border-panel-border bg-panel p-3.5 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex h-6 items-center rounded-full border border-panel-border bg-white px-[9px] font-condensed text-xs font-bold uppercase tracking-[0.12em] lg:h-[26px] lg:px-2.5">
          Sample preview
        </span>
        <span className="text-xs text-text-2 lg:text-[13px]">
          <span className="font-mono">Mazda RX-7</span> ·{" "}
          <span className="lg:hidden">Tap a pin</span>
          <span className="hidden lg:inline">Hover a pin</span>
        </span>
      </div>

      {/* Mobile frame is the image; the desktop frame is taller (1366x480) to hold the lower chip. */}
      <div className="relative mt-2 aspect-[1366/409] w-full lg:mt-2.5 lg:aspect-[1366/480]">
        <img
          src={image.src}
          alt="Line drawing of a Mazda RX-7 coupe"
          width={image.width}
          height={image.height}
          loading="eager"
          className="absolute left-0 top-0 block h-auto w-full"
        />

        {/* Desktop: leader lines and label chips */}
        <svg
          aria-hidden="true"
          viewBox="0 0 1366 480"
          preserveAspectRatio="none"
          className="pointer-events-none absolute left-0 top-0 hidden h-full w-full lg:block"
        >
          <path d={LEADERS} stroke="#121212" strokeWidth="3" fill="none" />
        </svg>
        {findings.map((f, i) => (
          <span
            key={f.chip}
            aria-hidden="true"
            className="pointer-events-none absolute hidden h-8 -translate-x-1/2 -translate-y-1/2 items-center whitespace-nowrap rounded-full border border-input-border bg-white px-3.5 text-[15px] font-semibold lg:inline-flex"
            style={{ left: `${CHIPS[i].left}%`, top: `${CHIPS[i].top}%` }}
          >
            {f.chip}
          </span>
        ))}

        {/* Pins */}
        {findings.map((f, i) => {
          const { x, y } = f;
          const leftPct = (x / aw) * 100;
          const isSelected = selected === f.n;
          return (
            <button
              key={f.n}
              type="button"
              aria-label={`Finding ${f.n}: ${f.title}`}
              onClick={() => setSelected(f.n)}
              onFocus={() => setSelected(f.n)}
              onMouseEnter={() => setSelected(f.n)}
              className={`group absolute top-[var(--top-m)] z-[1] inline-flex lg:top-[var(--top-d)] h-[26px] w-[26px] -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-2 border-white p-0 font-condensed text-sm font-bold transition-shadow before:absolute before:-inset-1 before:content-[''] hover:z-[6] hover:shadow-[0_0_0_3px_#121212] focus-visible:z-[6] focus-visible:shadow-[0_0_0_3px_#121212] focus-visible:outline-none motion-reduce:transition-none lg:h-[30px] lg:w-[30px] ${SEV[f.severity]} ${
                isSelected ? "z-[5] shadow-[0_0_0_3px_#121212] lg:z-[1] lg:shadow-none" : ""
              }`}
              style={
                {
                  left: `${leftPct}%`,
                  // The desktop frame is taller, so the vertical percent differs between the two.
                  "--top-m": `${(y / ah) * 100}%`,
                  "--top-d": `${(y / 480) * 100}%`,
                } as CSSProperties
              }
            >
              {f.n}
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute bottom-[calc(100%+12px)] z-[9] hidden w-[244px] rounded-[10px] border border-input-border bg-white px-3 py-2.5 text-left font-sans text-[13px] font-normal leading-[1.35] text-ink shadow-[0_8px_20px_rgba(18,18,18,0.14)] lg:group-hover:block lg:group-focus-visible:block ${
                  leftPct < 30 ? "-left-2.5" : "left-1/2 -translate-x-1/2"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className={`inline-flex h-5 items-center rounded px-2 font-condensed text-[11px] font-bold tracking-[0.08em] ${SEV[f.severity]}`}>
                    {f.severity}
                  </span>
                  <strong className="text-sm leading-tight">{f.title}</strong>
                </span>
                <span className="mt-1.5 block font-mono text-xs text-text-2">{f.cost}</span>
                <span className="mt-1 block text-xs text-muted-text">{f.why}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Mobile: details of the selected pin, then the totals */}
      {caption && (
        <div className="lg:hidden">
          <div
            aria-live="polite"
            className="mt-2.5 flex items-start gap-2.5 rounded-xl border border-panel-border bg-white px-3 py-2.5"
          >
            <span
              aria-hidden="true"
              className={`inline-flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full font-condensed text-[13px] font-bold ${SEV[caption.severity]}`}
            >
              {caption.n}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex h-5 items-center rounded px-2 font-condensed text-[11px] font-bold tracking-[0.08em] ${SEV[caption.severity]}`}>
                  {caption.severity}
                </span>
                <span className="text-[15px] font-semibold leading-tight">{caption.title}</span>
              </div>
              <div className="mt-1 font-mono text-xs text-text-2">{caption.cost}</div>
              <div className="mt-1 text-[13px] leading-[1.4] text-muted-text">{caption.why}</div>
            </div>
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[13px] text-text-2">
            <span><strong>{findings.length}</strong> free findings</span>
            <span className={`inline-flex h-5 items-center rounded px-2 font-condensed text-[11px] font-bold tracking-[0.08em] ${SEV.HIGH}`}>HIGH</span>
            <span>{counts.HIGH}</span>
            <span className={`inline-flex h-5 items-center rounded px-2 font-condensed text-[11px] font-bold tracking-[0.08em] ${SEV.MED}`}>MED</span>
            <span>{counts.MED}</span>
          </div>
        </div>
      )}

      {/* Desktop stats strip */}
      <div className="mt-3.5 hidden grid-cols-3 overflow-hidden rounded-card-sm border border-panel-border bg-white lg:grid">
        <div className="px-[18px] py-3.5">
          <div className="font-condensed text-xs font-semibold uppercase tracking-[0.1em] text-muted-text">Free findings</div>
          <div className="mt-1.5 font-mono text-[22px] font-bold">{findings.length}</div>
        </div>
        <div className="border-l border-card-border px-[18px] py-3.5">
          <div className="font-condensed text-xs font-semibold uppercase tracking-[0.1em] text-muted-text">High</div>
          <div className="mt-1.5 font-mono text-[22px] font-bold text-primary">{counts.HIGH}</div>
        </div>
        <div className="border-l border-card-border px-[18px] py-3.5">
          <div className="font-condensed text-xs font-semibold uppercase tracking-[0.1em] text-muted-text">Medium</div>
          <div className="mt-1.5 font-mono text-[22px] font-bold text-[#b9770a]">{counts.MED}</div>
        </div>
      </div>
      {/* Mobile: the header has no Sample report link, so it lives here (desktop: header) */}
      <a
        href="/?demo=true"
        className="mt-1.5 inline-flex min-h-[44px] items-center text-[15px] font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:hidden"
      >
        See a full sample report
      </a>
    </section>
  );
}
