import { useEffect, useState } from "react";
import { BAND_COLORS, bandFor, type ScoreResult, type Verdict } from "@/lib/ghost/scoring";

const VERDICT_PILL: Record<Verdict, { label: string; className: string }> = {
  buy: { label: "BUY", className: "bg-[#1d6b43] text-white" },
  negotiate: { label: "NEGOTIATE", className: "bg-sev-med text-sev-med-fg" },
  walkaway: { label: "WALK AWAY", className: "bg-primary text-white" },
};

const RADIUS = 59;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // 370.7

const SECTION_LABEL = "font-condensed text-[13px] font-bold uppercase tracking-[0.12em] text-text-2";

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** The ring with the number. Animates from empty only when the user has not asked for reduced motion. */
export function ScoreRing({ score, band, size = 136 }: { score: number; band: ScoreResult["band"]; size?: number }) {
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? score : 0));
  useEffect(() => {
    if (prefersReducedMotion()) {
      setShown(score);
      return;
    }
    const frame = requestAnimationFrame(() => setShown(score));
    return () => cancelAnimationFrame(frame);
  }, [score]);
  const dash = (Math.max(0, Math.min(100, shown)) / 100) * CIRCUMFERENCE;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 136 136"
        role="img"
        aria-label={`Idle Score ${score} out of 100`}
        style={{ display: "block", transform: "rotate(-90deg)" }}
      >
        <circle cx="68" cy="68" r={RADIUS} fill="none" stroke="#e5e4e2" strokeWidth="12" />
        <circle
          cx="68"
          cy="68"
          r={RADIUS}
          fill="none"
          stroke={BAND_COLORS[band].bg}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
          className="transition-[stroke-dasharray] duration-700 ease-out motion-reduce:transition-none"
        />
      </svg>
      <div aria-hidden="true" className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-[46px] font-bold leading-none">{score}</span>
        <span className="mt-0.5 text-xs text-muted-text">out of 100</span>
      </div>
    </div>
  );
}

// Idle Score card: ring, band and verdict pills, confidence, "at your offer", six bars, biggest drivers.
// Everything is read from the score object, so the verdict pill can never disagree with the number.
export function ScoreCard({
  score,
  atOffer,
}: {
  score: ScoreResult;
  /** The score at the suggested offer. Shown only when it is a real, lower price. */
  atOffer?: { price: number; result: ScoreResult } | null;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const verdict = VERDICT_PILL[score.verdict];
  const band = BAND_COLORS[score.band];
  const unknown = score.dimensions.filter((d) => !d.known).map((d) => d.label.toLowerCase());
  const drivers = score.drivers.filter((d) => d.points >= 0.5).slice(0, 4);
  const delta = atOffer ? atOffer.result.score - score.score : 0;

  return (
    <section
      aria-label="Idle Score"
      className="order-0 rounded-card border border-card-border bg-white p-[18px] lg:rounded-hero lg:p-6"
    >
      <div className="flex flex-wrap items-center gap-x-9 gap-y-5">
        <div className="flex items-center gap-[22px]">
          <ScoreRing score={score.score} band={score.band} />
          <div className="min-w-0">
            <div className={SECTION_LABEL}>Idle Score</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span
                className="inline-flex h-6 items-center rounded px-[9px] font-condensed text-[13px] font-bold uppercase tracking-[0.08em]"
                style={{ backgroundColor: band.bg, color: band.fg }}
              >
                {score.bandLabel}
              </span>
              <span
                className={`inline-flex h-6 items-center rounded px-[9px] font-condensed text-[13px] font-bold uppercase tracking-[0.08em] ${verdict.className}`}
              >
                {verdict.label}
              </span>
            </div>
            <div
              className={`mt-2.5 text-sm ${score.confidence === "high" ? "text-success" : "text-[#7a4a00]"}`}
            >
              {score.confidence === "high" && "High confidence"}
              {score.confidence === "medium" && "Medium confidence"}
              {score.confidence === "low" &&
                `Low confidence${unknown.length ? `: no data for ${unknown.join(", ")}` : ""}`}
            </div>
            {atOffer && delta !== 0 && (
              <div className="mt-1.5 text-sm leading-[1.4] text-text-2">
                At your offer of ${Math.round(atOffer.price).toLocaleString("en-US")}:{" "}
                <strong
                  className="font-mono"
                  style={{ color: BAND_COLORS[bandFor(atOffer.result.score).band].bg }}
                >
                  {atOffer.result.score}
                </strong>{" "}
                <span className={`font-semibold ${delta > 0 ? "text-success" : "text-primary-ink"}`}>
                  {delta > 0 ? "+" : "−"}
                  {Math.abs(delta)}
                </span>
              </div>
            )}
          </div>
        </div>

        <ul className="flex min-w-0 flex-1 basis-[300px] flex-col gap-2.5">
          {score.dimensions.map((d) => {
            const value = d.known && d.score !== null ? Math.round(d.score) : null;
            const color = value !== null ? BAND_COLORS[bandFor(value).band].bg : undefined;
            const showNote = hovered === d.key || pinned === d.key || value === null;
            return (
              <li key={d.key}>
                <div
                  role="img"
                  aria-label={value !== null ? `${d.label} ${value} out of 100` : `${d.label} not available`}
                  tabIndex={0}
                  onMouseEnter={() => setHovered(d.key)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(d.key)}
                  onBlur={() => setHovered(null)}
                  onClick={() => setPinned((p) => (p === d.key ? null : d.key))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setPinned((p) => (p === d.key ? null : d.key));
                    }
                  }}
                  className="flex min-h-[28px] cursor-pointer items-center gap-2.5 rounded outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="w-[116px] shrink-0 text-sm text-text-2 lg:w-32">{d.label}</span>
                  <div
                    className={`h-2 flex-1 overflow-hidden rounded ${
                      value === null ? "border border-dashed border-input-border bg-transparent" : "bg-card-border"
                    }`}
                  >
                    {value !== null && (
                      <div className="h-full rounded" style={{ width: `${value}%`, backgroundColor: color }} />
                    )}
                  </div>
                  <span className="w-[30px] text-right font-mono text-sm font-bold">{value ?? "n/a"}</span>
                </div>
                {showNote && <p className="mt-0.5 text-[13px] leading-[1.4] text-muted-text">{d.note}</p>}
              </li>
            );
          })}
        </ul>
      </div>

      {drivers.length > 0 && (
        <div className="mt-[18px] border-t border-card-border pt-4">
          <h3 className={SECTION_LABEL}>What costs you points</h3>
          <ul className="mt-2.5 flex flex-wrap gap-2">
            {drivers.map((d) => (
              <li
                key={`${d.kind}-${d.key}`}
                className="inline-flex min-h-8 items-center gap-2 rounded-full border border-card-border bg-white px-3 py-1 text-sm leading-[1.2]"
              >
                {d.label}
                <strong className="font-mono text-[13px] text-primary">−{Math.round(d.points)}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
