import { CarImage } from "./CarImage";
import type { Pin } from "@/lib/ghost/report";
import { carPinPercent, type CarCrop, type CarImageEntry } from "@/lib/ghost/carImages";
import type { Issue, Severity } from "@/lib/ghost/types";

function usd(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

const PIN_COLOR: Record<Severity, string> = {
  HIGH: "bg-sev-high text-sev-high-fg",
  MED: "bg-sev-med text-sev-med-fg",
  LOW: "bg-sev-low text-sev-low-fg",
};

function costLine(issue: Issue): string {
  return `${usd(issue.partsCostMin)}–${Math.round(issue.partsCostMax).toLocaleString("en-US")} parts · ${issue.labourHours} h labor`;
}

// The car image (full on desktop, the "front" crop on mobile), with a numbered pin per finding. Pin numbers match the
// findings list. Desktop: hover or focus a pin for a tooltip, click to jump to the finding.
// Mobile: tap a pin to see its description in the caption bar; "Details" jumps to the finding.
export function FindingsCar({
  image,
  pins,
  findings,
  active,
  onActive,
  onJump,
}: {
  image: CarImageEntry;
  pins: Pin[];
  /** Findings in display order, so findings[n - 1] is finding n. */
  findings: Issue[];
  /** Finding highlighted by hover, focus or tap. */
  active: number | null;
  onActive: (n: number | null) => void;
  onJump: (n: number) => void;
}) {
  // On mobile the first finding is selected until the user picks another one.
  const captionN = active ?? 1;
  const caption = findings[captionN - 1];

  const renderPins = (crop: CarCrop) =>
    pins.map((pin) => {
      const issue = findings[pin.number - 1];
      if (!issue) return null;
      const pos = carPinPercent(image, pin.x, pin.y, crop);
      const fullLeft = (pin.x / image.aspect[0]) * 100;
      const isActive = active === pin.number;
      // Mobile only: the default selection gets the ring until the user taps something.
      const defaultRing = active === null && pin.number === 1;
      // Tooltips stay inside the card. The image cars face left, so pins in the left 30% align to
      // the pin's left edge. Pins in the right 35% align to the right edge.
      const alignLeft = fullLeft < 30;
      const alignRight = fullLeft > 65;
      return (
        <button
          key={`${crop}-${pin.number}`}
          type="button"
          data-n={pin.number}
          aria-label={`Finding ${pin.number}: ${issue.label}`}
          onMouseEnter={() => onActive(pin.number)}
          onMouseLeave={() => onActive(null)}
          onFocus={() => onActive(pin.number)}
          onBlur={() => onActive(null)}
          onClick={() => handlePinClick(pin.number)}
          style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
          className={`group absolute z-[1] inline-flex h-6 w-6 lg:h-[26px] lg:w-[26px] -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-2 border-white p-0 font-condensed text-sm font-bold transition-shadow before:absolute before:-inset-1 before:content-[''] hover:z-[6] hover:shadow-[0_0_0_3px_#121212] focus-visible:z-[6] focus-visible:shadow-[0_0_0_3px_#121212] focus-visible:outline-none motion-reduce:transition-none ${PIN_COLOR[pin.severity]} ${
            isActive ? "z-[6] shadow-[0_0_0_3px_#121212]" : defaultRing ? "z-[5] shadow-[0_0_0_3px_#121212] lg:z-[1] lg:shadow-none" : ""
          }`}
        >
          {pin.number}
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute bottom-[calc(100%+12px)] z-[9] hidden w-[236px] rounded-[10px] border border-input-border bg-white px-3 py-2.5 text-left font-sans text-[13px] font-normal leading-[1.35] text-ink shadow-[0_8px_20px_rgba(18,18,18,0.14)] lg:group-hover:block lg:group-focus-visible:block ${
              alignLeft ? "-left-2.5" : alignRight ? "-right-2.5" : "left-1/2 -translate-x-1/2"
            }`}
          >
            <span className="flex items-center gap-2">
              <span className={`inline-flex h-[22px] items-center rounded px-2 font-condensed text-xs font-bold tracking-[0.08em] ${PIN_COLOR[issue.severity]}`}>
                {issue.severity}
              </span>
              <strong className="text-sm leading-tight">{issue.label}</strong>
            </span>
            <span className="mt-1.5 block font-mono text-xs text-text-2">{costLine(issue)}</span>
            <span className="mt-1 block text-xs text-muted-text">Click to jump to the finding</span>
          </span>
        </button>
      );
    });

  const handlePinClick = (n: number) => {
    if (window.matchMedia("(min-width: 1024px)").matches) onJump(n);
    else onActive(n);
  };

  return (
    <section
      aria-label="Findings on the car"
      className="rounded-[18px] border border-panel-border bg-panel px-3.5 pb-3.5 pt-3.5 lg:px-[18px] lg:pb-3.5 lg:pt-4"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-condensed text-[13px] font-bold uppercase tracking-[0.12em] text-text-2">
          Findings on the car
        </h2>
        <span className="text-[13px] text-muted-text">
          <span className="lg:hidden">Tap a pin</span>
          <span className="hidden lg:inline">Hover a pin</span>
        </span>
      </div>

      {/* Desktop: full image with 44px of free space above for tooltips. Mobile: the front crop. */}
      <div className="mt-2 lg:mt-11">
        <CarImage image={image} crop="front" className="lg:hidden" loading="eager">
          {renderPins("front")}
        </CarImage>
        <CarImage image={image} crop="full" className="hidden lg:block" loading="eager">
          {renderPins("full")}
        </CarImage>
      </div>

      {/* Mobile caption bar for the selected pin */}
      {caption && (
        <div
          aria-live="polite"
          className="mt-2.5 flex items-center gap-3 rounded-xl border border-panel-border bg-white py-2 pl-3 pr-1 lg:hidden"
        >
          <span
            aria-hidden="true"
            className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-condensed text-sm font-bold ${PIN_COLOR[caption.severity]}`}
          >
            {captionN}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold leading-tight">{caption.label}</div>
            <div className="mt-0.5 font-mono text-xs text-muted-text">{costLine(caption)}</div>
          </div>
          <button
            type="button"
            onClick={() => onJump(captionN)}
            className="inline-flex min-h-[44px] items-center rounded-lg px-2 text-sm font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Details
          </button>
        </div>
      )}

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[13px] text-text-2">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-sev-high" /> High
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-sev-med" /> Medium
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-input-border" /> Low
        </span>
        <span className="text-muted-text">
          Numbers match the <span className="lg:hidden">list</span>
          <span className="hidden lg:inline">findings</span> below.
        </span>
      </div>
    </section>
  );
}
