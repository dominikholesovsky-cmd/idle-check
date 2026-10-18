import { CarIllustration } from "./CarIllustration";
import { CAR_CROP, CAR_CROP_VIEWBOX, pinPercent, type BodyStyle, type Pin } from "@/lib/ghost/report";

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
  return (
    <section
      aria-label="Findings on the car"
      className="flex flex-col justify-center rounded-[18px] border border-panel-border bg-panel p-3.5 lg:rounded-hero lg:p-[18px]"
    >
      <h2 className="font-condensed text-[13px] font-bold uppercase tracking-[0.12em] text-text-2">
        Findings on the car
      </h2>

      <div className="relative mt-1 w-full" style={{ aspectRatio: `${CAR_CROP.width} / ${CAR_CROP.height}` }}>
        <CarIllustration body={body} viewBox={CAR_CROP_VIEWBOX} className="h-full w-full" decorative />
        {pins.map((p) => {
          const pos = pinPercent(p);
          return <PinBadge key={p.number} pin={p} left={pos.left} top={pos.top} />;
        })}
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
