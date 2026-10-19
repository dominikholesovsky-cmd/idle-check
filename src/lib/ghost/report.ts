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
// Every slot lies inside CAR_CROP: the report always shows the car cropped to that window.
const PIN_SLOTS: Record<BodyStyle, Slots> = {
  sedan: {
    "Engine & Drivetrain": [[424, 134], [396, 129], [368, 124], [457, 155], [340, 120]],
    "Chassis & Suspension": [[384, 152], [388, 178], [290, 176]],
    "Body & Electrical": [[300, 142], [205, 100], [230, 142]],
  },
  roadster: {
    "Engine & Drivetrain": [[420, 139], [392, 134], [364, 128], [457, 156], [338, 123]],
    "Chassis & Suspension": [[382, 150], [382, 178], [290, 176]],
    "Body & Electrical": [[222, 86], [276, 140], [200, 126]],
  },
};

/** The report shows the car cropped to this window on every screen size. */
export const CAR_CROP = { x: 160, y: 74, width: 330, height: 134 };
export const CAR_CROP_VIEWBOX = `${CAR_CROP.x} ${CAR_CROP.y} ${CAR_CROP.width} ${CAR_CROP.height}`;

/** Position of a pin as percentages of the cropped car. */
export function pinPercent(pin: { x: number; y: number }): { left: number; top: number } {
  return {
    left: ((pin.x - CAR_CROP.x) / CAR_CROP.width) * 100,
    top: ((pin.y - CAR_CROP.y) / CAR_CROP.height) * 100,
  };
}

export interface Pin {
  /** Finding number: position in the sorted list, starting at 1. */
  number: number;
  issueId: string;
  severity: Severity;
  x: number;
  y: number;
}

/**
 * Takes findings already sorted with `sortFindings`. Each finding takes the next free slot
 * of its category zone. A finding without a free slot gets no pin and stays in the list.
 */
export function assignPins(sortedFindings: Issue[], bodyOrSlots: BodyStyle | Slots): Pin[] {
  const slotsByCategory = typeof bodyOrSlots === "string" ? PIN_SLOTS[bodyOrSlots] : bodyOrSlots;
  const used: Record<string, number> = {};
  const pins: Pin[] = [];
  sortedFindings.forEach((issue, i) => {
    const slots = slotsByCategory[issue.category] ?? [];
    const next = used[issue.category] ?? 0;
    if (next >= slots.length) return;
    used[issue.category] = next + 1;
    const [x, y] = slots[next];
    pins.push({ number: i + 1, issueId: issue.id, severity: issue.severity, x, y });
  });
  return pins;
}
