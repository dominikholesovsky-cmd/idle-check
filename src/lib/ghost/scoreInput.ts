import type { Issue, Recall, Vehicle } from "./types";
import { SCORE_VERSION, computeScore, type ScoreInput, type ScoreResult } from "./scoring";

/** The fields of an AnalysisState (or of a stored report_json) that the Idle Score reads. */
export interface ScoreSource {
  vehicle: Pick<Vehicle, "year" | "mileage" | "vin">;
  askingPrice: number;
  issues: Issue[];
  recalls?: Recall[];
  recallSource?: "vin" | "nhtsa" | "procedural" | "none";
  sellerRedFlags?: string[];
  listingText?: string;
  marketValueLow?: number;
  marketValueHigh?: number;
  score?: ScoreResult;
}

export function buildScoreInput(state: ScoreSource): ScoreInput {
  return {
    askingPrice: state.askingPrice,
    year: state.vehicle?.year ?? null,
    mileage: state.vehicle?.mileage ?? null,
    issues: (state.issues ?? []).map((i) => ({
      id: i.id,
      label: i.label,
      severity: i.severity,
      urgency: i.urgency,
      costMin: i.costMin,
      costMax: i.costMax,
    })),
    recalls: (state.recalls ?? []).map((r) => ({ status: r.status, component: r.component, description: r.description })),
    recallsKnown: state.recallSource === "vin" || state.recallSource === "nhtsa",
    sellerRedFlags: Array.isArray(state.sellerRedFlags) ? state.sellerRedFlags : undefined,
    hasListingText: Boolean(state.listingText?.trim()),
    marketValueLow: state.marketValueLow,
    marketValueHigh: state.marketValueHigh,
    vinDecoded: Boolean(state.vehicle?.vin),
  };
}

/** True for a stored score that is complete and not older than the current scoring version. */
export function isCurrentScore(score: unknown): score is ScoreResult {
  const s = score as Partial<ScoreResult> | null | undefined;
  return (
    !!s &&
    typeof s === "object" &&
    typeof s.score === "number" &&
    typeof s.version === "number" &&
    s.version >= SCORE_VERSION &&
    Array.isArray(s.dimensions) &&
    Array.isArray(s.drivers) &&
    typeof s.issueImpacts === "object"
  );
}

/** The stored score if it is current, otherwise a fresh one computed from the stored fields. */
export function ensureScore(state: ScoreSource): ScoreResult {
  return isCurrentScore(state.score) ? state.score : computeScore(buildScoreInput(state));
}
