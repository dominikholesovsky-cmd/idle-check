import type { Category } from "./types";
import rx7 from "./mazda-rx7.slots.json";

export type CarCrop = "full" | "front";
export type ZoneName = Category | "overflow";

export interface CarImageEntry {
  src: string;
  alt: string;
  /** Intrinsic size of the file (for the width and height attributes). */
  width: number;
  height: number;
  /** Coordinate system of the slots: x / aspect[0], y / aspect[1] of the image. */
  aspect: [number, number];
  facing: "left" | "right";
  /** The mobile "front" crop: the left part of the image. imageWidthPercent is the img width inside it. */
  mobileCrop: { width: number; height: number; imageWidthPercent: number };
  pinSizePx: { desktop: number; mobile: number };
  /** Pin slots per zone, in the order they are used. */
  zones: Record<ZoneName, [number, number][]>;
}

const RX7: CarImageEntry = {
  src: "/images/cars/mazda-rx7.png",
  alt: "Illustration of a car",
  width: 1100,
  height: 329,
  aspect: rx7.aspect as [number, number],
  facing: rx7.facing as "left" | "right",
  mobileCrop: rx7.mobileCrop,
  pinSizePx: rx7.pinSizePx,
  zones: rx7.zones as Record<ZoneName, [number, number][]>,
};

// Model-specific drawings are checked first once any exist (see design-handoff/assets/cars/README.md).
const MODEL_ENTRIES: { make: RegExp; match: RegExp; image: CarImageEntry }[] = [];

/**
 * The picture for a vehicle: the single RX-7 line drawing for every make and model. Model-specific
 * entries (checked first) can be added to MODEL_ENTRIES later.
 */
export function carImageFor(vehicle: { make?: string; model?: string }): CarImageEntry {
  const make = (vehicle.make ?? "").trim();
  const model = (vehicle.model ?? "").trim();
  const specific = MODEL_ENTRIES.find((e) => e.make.test(make) && e.match.test(model));
  if (specific) return specific.image;
  return RX7;
}

/** The RX-7 drawing and the three fixed sample pins of the landing page sample card. */
export const RX7_SAMPLE = {
  image: RX7,
  // These are the app's real free-preview findings for an RX-7 (generateIssues in src/lib/ghost/procedural.ts).
  findings: rx7.landingSample.pins as {
    n: number;
    severity: "HIGH" | "MED" | "LOW";
    x: number;
    y: number;
    title: string;
    chip: string;
    cost: string;
    why: string;
  }[],
};

/** Position of a slot as percentages of the CarImage container for the given crop. */
export function carPinPercent(
  entry: CarImageEntry,
  x: number,
  y: number,
  crop: CarCrop,
): { left: number; top: number } {
  const w = crop === "front" ? entry.mobileCrop.width : entry.aspect[0];
  const h = crop === "front" ? entry.mobileCrop.height : entry.aspect[1];
  return { left: (x / w) * 100, top: (y / h) * 100 };
}
