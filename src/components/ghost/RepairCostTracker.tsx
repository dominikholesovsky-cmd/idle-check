import type { Issue } from "@/lib/ghost/types";

const LABOUR_RATE = 120;

function roundHundred(n: number): number {
  return Math.round(n / 100) * 100;
}

export function RepairCostTracker({
  issues,
  checked,
  askingPrice,
}: {
  issues: Issue[];
  checked: Set<string>;
  askingPrice: number;
}) {
  const checkedIssues = issues.filter((i) => checked.has(i.id));
  const partsTotal = checkedIssues.reduce(
    (s, i) => s + Math.round((i.partsCostMin + i.partsCostMax) / 2), 0,
  );
  const labourTotal = checkedIssues.reduce(
    (s, i) => s + Math.round(i.labourHours * LABOUR_RATE), 0,
  );
  const grandTotal = roundHundred(partsTotal + labourTotal);
  const partsRounded = roundHundred(partsTotal);
  const labourRounded = roundHundred(labourTotal);
  const suggestedOffer = Math.max(0, roundHundred(askingPrice - grandTotal * 0.65));
  const count = checkedIssues.length;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="font-condensed text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Estimated US Repair Budget
      </div>
      <div className="mt-2 font-mono text-3xl font-bold tabular-nums text-foreground sm:text-4xl">
        ${grandTotal.toLocaleString()}
      </div>
      <div className="mt-1 font-condensed text-[11px] uppercase tracking-wider text-muted-foreground">
        {count} {count === 1 ? "item" : "items"} flagged
      </div>

      {count > 0 && (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <div className="flex items-start justify-between gap-3 text-[13px]">
            <div>
              <span className="font-medium text-foreground">Parts only</span>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Sourced from RockAuto / eBay Motors
              </p>
            </div>
            <span className="shrink-0 font-mono font-semibold text-foreground">
              ~${partsRounded.toLocaleString()}
            </span>
          </div>
          <div className="flex items-start justify-between gap-3 text-[13px]">
            <div>
              <span className="font-medium text-muted-foreground">Labour estimate</span>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                @ ${LABOUR_RATE}/hr · varies by shop
              </p>
            </div>
            <span className="shrink-0 font-mono font-semibold text-muted-foreground">
              ~${labourRounded.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-2 text-[13px]">
            <span className="font-medium text-foreground">Total estimate</span>
            <span className="font-mono font-bold text-foreground">
              ~${grandTotal.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {count === 0 && (
        <p className="mt-4 text-[12px] text-muted-foreground">
          Tick items in the checklist to build your repair budget.
        </p>
      )}

      <div className="mt-4 border-t border-border pt-3 text-[13px] text-muted-foreground">
        Suggested opening offer:{" "}
        <span className="font-mono font-semibold text-foreground">
          ${suggestedOffer.toLocaleString()}
        </span>
      </div>
    </div>
  );
}