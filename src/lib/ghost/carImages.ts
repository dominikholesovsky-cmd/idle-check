import type { Category } from "./types";
import rx7Slots from "./mazda-rx7.slots.json";

type Slots = Record<Category, [number, number][]>;

export interface CarImage {
  src: string;
  alt: string;
  /** Intrinsic size of the file (for the width and height attributes). */
  width: number;
  height: number;
  /** Coordinate system of the slots: pins are x / aspect[0], y / aspect[1] of the image. */
  aspect: [number, number];
  facing: "left" | "right";
  slots: Slots;
}

interface CarImageEntry {
  make: RegExp;
  match: RegExp;
  image: CarImage;
}

// Real line drawings for models that have one. Every other model falls back to the generic vector car
// (see bodyStyleFor in report.ts). To add a model, see design-handoff/assets/cars/README.md: put the PNG
// in public/images/cars, its slots JSON next to this file, and add an entry here.
const REGISTRY: CarImageEntry[] = [
  {
    make: /^mazda$/i,
    match: /rx-?7/i,
    image: {
      src: "/images/cars/mazda-rx7.png",
      alt: "Line drawing of a Mazda RX-7 coupe",
      width: 1100,
      height: 329,
      aspect: rx7Slots.aspect as [number, number],
      facing: rx7Slots.facing as "left" | "right",
      slots: rx7Slots.slots as Slots,
    },
  },
];

/** The image for this vehicle, or null. A report never shows an image that does not match the vehicle. */
export function carImageFor(vehicle: { make?: string; model?: string }): CarImage | null {
  const make = (vehicle.make ?? "").trim();
  const model = (vehicle.model ?? "").trim();
  if (!make || !model) return null;
  return REGISTRY.find((e) => e.make.test(make) && e.match.test(model))?.image ?? null;
}

/** The RX-7 drawing, for the landing page sample card (the one place it is shown regardless of vehicle). */
export const RX7_SAMPLE = {
  image: REGISTRY[0].image,
  findings: rx7Slots.sampleFindings as {
    n: number;
    severity: "HIGH" | "MED" | "LOW";
    title: string;
    chip: string;
    cost: string;
    why: string;
  }[],
  /** Pins for the three sample findings, in the image's pixel space. */
  pins: [rx7Slots.slots["Engine & Drivetrain"][0], rx7Slots.slots["Engine & Drivetrain"][1], rx7Slots.slots["Body & Electrical"][0]] as [number, number][],
};
