import type { Issue, Severity, Urgency } from "./types";
import type { CarImageEntry, ZoneName } from "./carImages";

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

// ─── Car image pins ──────────────────────────────────────────────────────────

export interface Pin {
  /** Finding number: position in the sorted list, starting at 1. */
  number: number;
  issueId: string;
  severity: Severity;
  /** Slot position in the image's coordinate system (see CarImageEntry.aspect). */
  x: number;
  y: number;
}

const ZONE_ORDER: ZoneName[] = ["Engine & Drivetrain", "Body & Electrical", "Chassis & Suspension", "overflow"];

/**
 * Takes findings already sorted with `sortFindings`. Each finding takes the next free slot of its category
 * zone (unknown categories count as Body & Electrical). If that zone is full it takes the next free slot of
 * the first zone that has one, in ZONE_ORDER. With nothing free there is no pin and the finding stays in the list.
 */
export function assignPins(sortedFindings: Issue[], image: CarImageEntry): Pin[] {
  const used: Record<string, number> = {};
  const next = (zone: ZoneName): [number, number] | null => {
    const slots = image.zones[zone] ?? [];
    const n = used[zone] ?? 0;
    if (n >= slots.length) return null;
    used[zone] = n + 1;
    return slots[n];
  };
  const pins: Pin[] = [];
  sortedFindings.forEach((issue, i) => {
    const own: ZoneName = image.zones[issue.category as ZoneName] ? (issue.category as ZoneName) : "Body & Electrical";
    let slot = next(own);
    for (let z = 0; !slot && z < ZONE_ORDER.length; z++) slot = next(ZONE_ORDER[z]);
    if (!slot) return;
    pins.push({ number: i + 1, issueId: issue.id, severity: issue.severity, x: slot[0], y: slot[1] });
  });
  return pins;
}
