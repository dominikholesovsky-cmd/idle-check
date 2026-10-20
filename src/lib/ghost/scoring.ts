/**
 * Idle Score: one number from 0 to 100 for a used-car deal. 100 is the best possible deal.
 *
 * Pure TypeScript, no imports, no I/O. Safe to run in the browser and on the server.
 * Same input always gives the same output. Bump SCORE_VERSION when weights or curves change.
 *
 * Six dimensions (weights add up to 100):
 *   price    25  asking price against the market range
 *   repairs  25  expected repair money against the asking price
 *   risk     20  severity and urgency of the findings, independent of money
 *   seller   15  red flags found in the listing
 *   wear     10  age and mileage
 *   recalls   5  open NHTSA recalls
 * A dimension whose data is missing is left out and the remaining weights are rescaled,
 * and the confidence level drops.
 */

export const SCORE_VERSION = 1;

export type Severity = "HIGH" | "MED" | "LOW";
export type Urgency = "Immediate" | "Soon" | "Monitor";
export type DimensionKey = "price" | "repairs" | "risk" | "seller" | "wear" | "recalls";
export type Band = "excellent" | "good" | "fair" | "weak" | "poor";
export type Verdict = "buy" | "negotiate" | "walkaway";
export type Confidence = "high" | "medium" | "low";

export interface ScoreIssue {
  id: string;
  label?: string;
  severity: Severity;
  urgency?: Urgency;
  costMin: number;
  costMax: number;
}
export interface ScoreRecall {
  status?: string;
  component?: string;
  description?: string;
}
export interface ScoreInput {
  askingPrice: number;
  year?: number | null;
  mileage?: number | null;
  issues: ScoreIssue[];
  recalls?: ScoreRecall[];
  /** false when recall data is only an estimate, not from NHTSA */
  recallsKnown?: boolean;
  /** undefined means the listing text was not analysed, so the seller dimension is skipped */
  sellerRedFlags?: string[];
  hasListingText?: boolean;
  marketValueLow?: number | null;
  marketValueHigh?: number | null;
  vinDecoded?: boolean;
  /** injectable for tests; defaults to the current year */
  currentYear?: number;
}

export interface Dimension {
  key: DimensionKey;
  label: string;
  /** nominal weight out of 100 */
  weight: number;
  /** 0 to 100, null when unknown */
  score: number | null;
  known: boolean;
  /** one short human sentence explaining the number */
  note: string;
  /** points lost from the overall score because of this dimension (0 when unknown) */
  pointsLost: number;
}
export interface Driver {
  kind: "dimension" | "issue";
  key: DimensionKey | string;
  label: string;
  /** points taken off the overall score, positive number */
  points: number;
}
export interface ScoreResult {
  version: number;
  /** final score, 0 to 100, after caps */
  score: number;
  /** weighted score of the known dimensions, before missing-data blending and caps */
  rawScore: number;
  band: Band;
  bandLabel: string;
  verdict: Verdict;
  confidence: Confidence;
  dimensions: Dimension[];
  /** biggest reasons the score is not 100, sorted by points */
  drivers: Driver[];
  /** points each issue costs, keyed by issue id */
  issueImpacts: Record<string, number>;
  cap: { limit: number; reason: string } | null;
}

/* ------------------------------ helpers ------------------------------ */

const WEIGHTS: Record<DimensionKey, number> = { price: 25, repairs: 25, risk: 20, seller: 15, wear: 10, recalls: 5 };
const LABELS: Record<DimensionKey, string> = {
  price: "Price vs. market",
  repairs: "Repair cost",
  risk: "Mechanical risk",
  seller: "Seller and listing",
  wear: "Age and mileage",
  recalls: "Recalls",
};

const clamp = (n: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, n));
const num = (n: unknown, fallback = 0) => (typeof n === "number" && Number.isFinite(n) ? n : fallback);
const round1 = (n: number) => Math.round(n * 10) / 10;

/** piecewise linear interpolation over sorted [x, y] points, clamped at both ends */
function interp(points: ReadonlyArray<readonly [number, number]>, x: number): number {
  if (x <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i];
    if (x <= x1) {
      const [x0, y0] = points[i - 1];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return points[points.length - 1][1];
}

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

/* ------------------------------ bands and verdict ------------------------------ */

export function bandFor(score: number): { band: Band; label: string } {
  if (score >= 90) return { band: "excellent", label: "Excellent deal" };
  if (score >= 75) return { band: "good", label: "Good deal" };
  if (score >= 60) return { band: "fair", label: "Fair deal" };
  if (score >= 40) return { band: "weak", label: "Weak deal" };
  return { band: "poor", label: "Walk away" };
}
export function verdictFromScore(score: number): Verdict {
  if (score >= 75) return "buy";
  if (score >= 40) return "negotiate";
  return "walkaway";
}
/** design tokens for each band: background and readable text color */
export const BAND_COLORS: Record<Band, { bg: string; fg: string }> = {
  excellent: { bg: "#1d6b43", fg: "#ffffff" },
  good: { bg: "#2f8f5b", fg: "#ffffff" },
  fair: { bg: "#f59e0b", fg: "#121212" },
  weak: { bg: "#e07a1f", fg: "#121212" },
  poor: { bg: "#b32228", fg: "#ffffff" },
};

/* ------------------------------ dimensions ------------------------------ */

function scorePrice(asking: number, low?: number | null, high?: number | null) {
  const lo = num(low, NaN), hi = num(high, NaN);
  if (!(asking > 0) || !(lo > 0) || !(hi >= lo)) return { score: null as number | null, note: "No market range available." };
  let score: number;
  let note: string;
  if (asking < lo * 0.7) {
    score = 80;
    note = `Asking ${money(asking)} is far below the market range ${money(lo)} to ${money(hi)}. Too good to be true can be a warning sign.`;
  } else if (asking <= lo) {
    score = 100;
    note = `Asking ${money(asking)} is at or below the market range ${money(lo)} to ${money(hi)}.`;
  } else if (asking <= hi) {
    score = interp([[lo, 95], [hi, 70]], asking);
    note = `Asking ${money(asking)} is inside the market range ${money(lo)} to ${money(hi)}.`;
  } else {
    score = Math.max(0, 70 - (asking / hi - 1) * 200);
    note = `Asking ${money(asking)} is ${Math.round((asking / hi - 1) * 100)}% above the top of the market range (${money(hi)}).`;
  }
  return { score, note };
}

const EXPOSURE_P: Record<Severity, number> = { HIGH: 0.85, MED: 0.55, LOW: 0.25 };
const REPAIR_CURVE: ReadonlyArray<readonly [number, number]> = [[0, 100], [0.05, 88], [0.1, 70], [0.15, 52], [0.25, 22], [0.35, 0]];

function scoreRepairs(issues: ScoreIssue[], asking: number, reference: number) {
  const exposure: Record<string, number> = {};
  let total = 0;
  for (const i of issues) {
    const lo = Math.max(0, num(i.costMin)), hi = Math.max(lo, num(i.costMax, lo));
    const e = ((lo + hi) / 2) * (EXPOSURE_P[i.severity] ?? 0.4);
    exposure[i.id] = e;
    total += e;
  }
  if (!(reference > 0)) return { score: null as number | null, note: "No asking price.", exposure, total, ratio: 0 };
  const ratio = total / reference;
  const score = interp(REPAIR_CURVE, ratio);
  const note = issues.length
    ? `Expected repair cost about ${money(total)}, ${Math.round(ratio * 100)}% of the car's value.`
    : "No repair findings.";
  return { score, note, exposure, total, ratio };
}

const SEV_W: Record<Severity, number> = { HIGH: 10, MED: 4, LOW: 1 };
const URG_M: Record<Urgency, number> = { Immediate: 1.4, Soon: 1, Monitor: 0.6 };

function scoreRisk(issues: ScoreIssue[]) {
  const per: Record<string, number> = {};
  let w = 0;
  for (const i of issues) {
    const v = (SEV_W[i.severity] ?? 2) * (URG_M[i.urgency ?? "Soon"] ?? 1);
    per[i.id] = v;
    w += v;
  }
  const score = 100 * Math.exp(-w / 35);
  const high = issues.filter((i) => i.severity === "HIGH").length;
  const immediate = issues.filter((i) => i.urgency === "Immediate").length;
  const note = issues.length
    ? `${high} high-severity and ${immediate} urgent finding${immediate === 1 ? "" : "s"} out of ${issues.length}.`
    : "No findings.";
  return { score, note, per, total: w };
}

const SEVERE_FLAG =
  /\b(salvage|rebuilt|rebuild(?:t)? title|branded title|junk title|title (?:issue|problem|wash|washing|missing|not|absent|delay)|no title|lien|odometer|roll(?:ed)? ?back|mileage (?:discrepancy|mismatch|inconsisten\w*)|flood|frame damage|structural damage|stolen|vin (?:mismatch|tamper\w*)|bill of sale only|scam|wire transfer|escrow|deposit (?:before|required|first))\b/i;

function scoreSeller(flags: string[] | undefined, hasText: boolean | undefined) {
  if (flags === undefined && !hasText) return { score: null as number | null, note: "Listing text was not analysed.", severe: false };
  const list = (flags ?? []).filter((f) => typeof f === "string" && f.trim());
  let keep = 1;
  let severe = false;
  for (const f of list) {
    const isSevere = SEVERE_FLAG.test(f);
    severe = severe || isSevere;
    keep *= 1 - (isSevere ? 0.35 : 0.12);
  }
  const score = 100 * keep;
  const note = list.length
    ? `${list.length} red flag${list.length === 1 ? "" : "s"} in the listing${severe ? ", including a serious one" : ""}.`
    : "No red flags found in the listing.";
  return { score, note, severe };
}

const WEAR_CURVE: ReadonlyArray<readonly [number, number]> = [[0, 100], [7000, 96], [10000, 88], [12000, 80], [15000, 62], [20000, 40], [30000, 12], [45000, 0]];

function scoreWear(year: number | null | undefined, mileage: number | null | undefined, currentYear: number) {
  const y = num(year, NaN), m = num(mileage, NaN);
  if (!(m >= 0)) return { score: null as number | null, note: "Mileage not provided." };
  const age = Number.isFinite(y) ? Math.max(1, currentYear - y) : null;
  let score = age ? interp(WEAR_CURVE, m / age) : 70;
  if (m > 120000) score -= Math.min(35, ((m - 120000) / 1000) * 0.25);
  if (age && age > 15) score -= Math.min(15, (age - 15) * 0.8);
  score = clamp(score);
  const note = age
    ? `${Math.round(m).toLocaleString("en-US")} mi over ${age} year${age === 1 ? "" : "s"}, about ${Math.round(m / age).toLocaleString("en-US")} mi a year.`
    : `${Math.round(m).toLocaleString("en-US")} mi, year unknown.`;
  return { score, note };
}

const SAFETY_RECALL = /(fire|air ?bag|brake|steering|fuel (?:leak|line|pump)|stall|seat ?belt|loss of (?:power|control)|crash)/i;
const CLOSED = /(remed|complete|closed|resolved)/i;

function scoreRecalls(recalls: ScoreRecall[] | undefined, known: boolean | undefined) {
  if (known === false) return { score: null as number | null, note: "Recall data is an estimate.", safetyOpen: false };
  const open = (recalls ?? []).filter((r) => !CLOSED.test(r.status ?? ""));
  const safetyOpen = open.some((r) => SAFETY_RECALL.test(`${r.component ?? ""} ${r.description ?? ""}`));
  const score = clamp(100 - open.length * 30);
  const total = (recalls ?? []).length;
  const note = open.length
    ? `${open.length} open recall${open.length === 1 ? "" : "s"}${safetyOpen ? ", including a safety recall" : ""}.`
    : total ? `${total} recall${total === 1 ? "" : "s"} found, all remedied.` : "No recalls found.";
  return { score, note, safetyOpen };
}

/* ------------------------------ main ------------------------------ */

export function computeScore(input: ScoreInput): ScoreResult {
  const asking = num(input.askingPrice);
  const issues = (Array.isArray(input.issues) ? input.issues : []).filter((i) => i && typeof i.id === "string");
  const year = input.currentYear ?? new Date().getFullYear();

  const price = scorePrice(asking, input.marketValueLow, input.marketValueHigh);
  const lo = num(input.marketValueLow, NaN), hi = num(input.marketValueHigh, NaN);
  const marketMid = lo > 0 && hi >= lo ? (lo + hi) / 2 : 0;
  // repairs are compared with what the car is worth, so a lower asking price never lowers this score
  const repairs = scoreRepairs(issues, asking, marketMid > 0 ? marketMid : asking);
  const risk = scoreRisk(issues);
  const seller = scoreSeller(input.sellerRedFlags, input.hasListingText);
  const wear = scoreWear(input.year, input.mileage, year);
  const recalls = scoreRecalls(input.recalls, input.recallsKnown);

  const parts: Record<DimensionKey, { score: number | null; note: string }> = { price, repairs, risk, seller, wear, recalls };
  const keys = Object.keys(WEIGHTS) as DimensionKey[];
  const knownWeight = keys.reduce((s, k) => s + (parts[k].score === null ? 0 : WEIGHTS[k]), 0);

  let raw = 0;
  const dimensions: Dimension[] = keys.map((k) => {
    const s = parts[k].score;
    const known = s !== null;
    const eff = known && knownWeight > 0 ? (WEIGHTS[k] / knownWeight) * 100 : 0;
    const lost = known ? (eff * (100 - (s as number))) / 100 : 0;
    if (known) raw += (eff * (s as number)) / 100;
    return { key: k, label: LABELS[k], weight: WEIGHTS[k], score: known ? Math.round(s as number) : null, known, note: parts[k].note, pointsLost: round1(lost) };
  });
  if (knownWeight === 0) raw = 50;
  // confidence factor: with all data it is 1; with less than 30% of the weights known it is 0 and the score is 50
  const k = clamp((knownWeight / 100 - 0.3) / 0.7, 0, 1);
  const blended = raw * k + 50 * (1 - k);

  // caps: some facts limit the score no matter how good the rest looks
  let cap: ScoreResult["cap"] = null;
  const setCap = (limit: number, reason: string) => { if (!cap || limit < cap.limit) cap = { limit, reason }; };
  if (seller.severe) setCap(39, "Serious red flag in the listing (title, odometer, flood or damage history).");
  if (recalls.safetyOpen) setCap(54, "Open safety recall.");
  if (asking > 0 && marketMid > 0 && asking < num(input.marketValueLow) * 0.7) setCap(74, "Price is far below market. Verify the car exists and the title is clean before you go further.");
  if (repairs.ratio >= 0.35) setCap(30, "Expected repairs are over 35% of the car's value.");

  const score = Math.round(clamp(cap ? Math.min(blended, (cap as { limit: number }).limit) : blended));
  const { band, label } = bandFor(score);

  // issue impacts: spread the repairs and risk losses over the issues that cause them
  const lostOf = (k: DimensionKey) => dimensions.find((d) => d.key === k)?.pointsLost ?? 0;
  const impacts: Record<string, number> = {};
  for (const i of issues) {
    const a = repairs.total > 0 ? (repairs.exposure[i.id] ?? 0) / repairs.total : 0;
    const b = risk.total > 0 ? (risk.per[i.id] ?? 0) / risk.total : 0;
    impacts[i.id] = round1(lostOf("repairs") * a + lostOf("risk") * b);
  }

  const drivers: Driver[] = [];
  for (const d of dimensions) {
    if (d.known && d.pointsLost >= 0.5 && d.key !== "repairs" && d.key !== "risk") drivers.push({ kind: "dimension", key: d.key, label: d.label, points: d.pointsLost });
  }
  for (const i of issues) {
    if ((impacts[i.id] ?? 0) >= 0.5) drivers.push({ kind: "issue", key: i.id, label: i.label ?? i.id, points: impacts[i.id] });
  }
  drivers.sort((x, y) => y.points - x.points);

  const share = knownWeight / 100 + (input.vinDecoded ? 0.05 : 0);
  const confidence: Confidence = share >= 0.9 ? "high" : share >= 0.7 ? "medium" : "low";

  return { version: SCORE_VERSION, score, rawScore: Math.round(raw), band, bandLabel: label, verdict: verdictFromScore(score), confidence, dimensions, drivers, issueImpacts: impacts, cap };
}

/** What the score would be at a different asking price, for example the suggested offer. */
export function scoreAtPrice(input: ScoreInput, price: number): ScoreResult {
  return computeScore({ ...input, askingPrice: price });
}

/** Summary stored in the public report JSON and returned by the saved-reports list. Contains no personal data. */
export function scoreSummary(r: ScoreResult) {
  return { v: r.version, score: r.score, band: r.band, verdict: r.verdict, confidence: r.confidence };
}
