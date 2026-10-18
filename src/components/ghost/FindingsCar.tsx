import { CarIllustration } from "./CarIllustration";
import { MOBILE_CROP, inMobileCrop, type BodyStyle, type Pin } from "@/lib/ghost/report";

const FULL_W = 520;
const FULL_H = 224;

const PIN_CLASS = {
  HIGH: "bg-sev-high text-sev-high-fg",
  MED: "bg-sev-med text-sev-med-fg",
  LOW: "bg-sev-low text-sev-low-fg",
} as const;

function PinBadge({ pin, left, top }: { pin: Pin; left: number; top: number }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute inline-flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white font-condensed text-sm font-bold ${PIN_CLASS[pin.severity]}`}
      style={{ left: `${left}%`, top: `${top}%` }}
    >
      {pin.number}
    </span>
  );
}

// Car illustration with a numbered pin per finding. Mobile shows the front half of the car
// (cropped), desktop the whole car. The pin numbers match the findings list.
export function FindingsCar({ body, pins }: { body: BodyStyle; pins: Pin[] }) {
  const cropViewBox = `${MOBILE_CROP.x} ${MOBILE_CROP.y} ${MOBILE_CROP.width} ${MOBILE_CROP.height}`;

  return (
    <section
      aria-label="Findings on the car"
      className="flex flex-col justify-center rounded-[18px] border border-panel-border bg-panel p-3.5 lg:rounded-hero lg:p-[18px]"
    >
      <h2 className="font-condensed text-[13px] font-bold uppercase tracking-[0.12em] text-text-2">
        Findings on the car
      </h2>

      {/* Mobile: cropped */}
      <div className="relative mt-1 w-full lg:hidden" style={{ aspectRatio: `${MOBILE_CROP.width} / ${MOBILE_CROP.height}` }}>
        <CarIllustration body={body} viewBox={cropViewBox} className="h-full w-full" decorative />
        {pins
          .filter((p) => inMobileCrop(p.x, p.y))
          .map((p) => (
            <PinBadge
              key={p.number}
              pin={p}
              left={((p.x - MOBILE_CROP.x) / MOBILE_CROP.width) * 100}
              top={((p.y - MOBILE_CROP.y) / MOBILE_CROP.height) * 100}
            />
          ))}
      </div>

      {/* Desktop: whole car */}
      <div className="relative mt-1 hidden w-full lg:block" style={{ aspectRatio: `${FULL_W} / ${FULL_H}` }}>
        <CarIllustration body={body} className="h-full w-full" decorative />
        {pins.map((p) => (
          <PinBadge key={p.number} pin={p} left={(p.x / FULL_W) * 100} top={(p.y / FULL_H) * 100} />
        ))}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-text-2">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-sev-high" /> High
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-sev-med" /> Medium
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-input-border" /> Low
        </span>
        <span className="text-muted-text">Numbers match the findings below.</span>
      </div>
    </section>
  );
}
