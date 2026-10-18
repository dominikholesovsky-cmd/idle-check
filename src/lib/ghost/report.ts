import type { Category, Issue, Severity, Urgency, Vehicle } from "./types";

export const LABOUR_RATE = 120;

export function round100(n: number): number {
  return Math.round(n / 100) * 100;
}

/** HIGH, then MED, then LOW. Ties keep the original order. The position is the finding number. */
export function sortFindings(issues: Issue[]): Issue[] {
  const rank: Record<Severity, number> = { HIGH: 0, MED: 1, LOW: 2 };
  return issues
    .map((issue, index) => ({ issue, index }))
    .sort((a, b) => rank[a.issue.severity] - rank[b.issue.severity] || a.index - b.index)
    .map((x) => x.issue);
}

export const URGENCY_LABEL: Record<Urgency, string> = {
  Immediate: "Fix before buying",
  Soon: "Within 3 months",
  Monitor: "Keep an eye on",
};

export interface Offer {
  partsTotal: number;
  labourTotal: number;
  /** round100(parts + labour) */
  repairTotal: number;
  /** max(0, round100(asking - 0.65 * repairTotal)) */
  suggestedOffer: number;
}

/** The one offer calculation for the whole report. */
export function computeOffer(checkedIssues: Issue[], askingPrice: number): Offer {
  const partsTotal = checkedIssues.reduce(
    (s, i) => s + Math.round(((i.partsCostMin || 0) + (i.partsCostMax || 0)) / 2), 0,
  );
  const labourTotal = checkedIssues.reduce(
    (s, i) => s + Math.round((i.labourHours || 0) * LABOUR_RATE), 0,
  );
  const repairTotal = round100(partsTotal + labourTotal);
  const suggestedOffer = Math.max(0, round100((askingPrice || 0) - 0.65 * repairTotal));
  return { partsTotal, labourTotal, repairTotal, suggestedOffer };
}

// ─── Car illustration pins ───────────────────────────────────────────────────

export type BodyStyle = "roadster" | "sedan";

export function bodyStyleFor(vehicle: Pick<Vehicle, "model">): BodyStyle {
  return /miata|mx-?5|s2000|z[34]\b|boxster|slk|solstice|mr-?2|4c|r8/i.test(vehicle.model ?? "")
    ? "roadster"
    : "sedan";
}

type Slots = Record<Category, [number, number][]>;

// Positions in the 520x224 viewBox of the car SVGs (from design-handoff/assets/pin-slots.json).
const PIN_SLOTS: Record<BodyStyle, Slots> = {
  sedan: {
    "Engine & Drivetrain": [[424, 134], [396, 129], [368, 124], [340, 120], [457, 155]],
    "Chassis & Suspension": [[386, 150], [388, 178], [142, 150], [142, 178]],
    "Body & Electrical": [[300, 142], [205, 100], [210, 142], [100, 134]],
  },
  roadster: {
    "Engine & Drivetrain": [[420, 139], [392, 134], [364, 128], [338, 123], [457, 156]],
    "Chassis & Suspension": [[382, 150], [382, 178], [140, 150], [140, 178]],
    "Body & Electrical": [[222, 86], [276, 140], [92, 150], [100, 126]],
  },
};

/** The mobile report crops the car to this window. */
export const MOBILE_CROP = { x: 236, y: 64, width: 252, height: 150 };

export function inMobileCrop(x: number, y: number): boolean {
  return (
    x >= MOBILE_CROP.x && x <= MOBILE_CROP.x + MOBILE_CROP.width &&
    y >= MOBILE_CROP.y && y <= MOBILE_CROP.y + MOBILE_CROP.height
  );
}

export interface Pin {
  /** Finding number: position in the sorted list, starting at 1. */
  number: number;
  severity: Severity;
  x: number;
  y: number;
}

/**
 * Takes findings already sorted with `sortFindings`. Each finding takes the next free slot
 * of its category zone. A finding without a free slot gets no pin and stays in the list.
 */
export function assignPins(sortedFindings: Issue[], body: BodyStyle): Pin[] {
  const used: Record<string, number> = {};
  const pins: Pin[] = [];
  sortedFindings.forEach((issue, i) => {
    const slots = PIN_SLOTS[body][issue.category] ?? [];
    const next = used[issue.category] ?? 0;
    if (next >= slots.length) return;
    used[issue.category] = next + 1;
    const [x, y] = slots[next];
    pins.push({ number: i + 1, severity: issue.severity, x, y });
  });
  return pins;
}
