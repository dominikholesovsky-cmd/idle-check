import type { Issue } from "@/lib/ghost/types";

const LABOUR_RATE = 120;

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
  const grandTotal = partsTotal + labourTotal;
  const suggestedOffer = Math.max(0, Math.round(askingPrice - grandTotal * 0.65));
  const count = checkedIssues.length;

  return (
    <div className="rounded-xl border border-border bg-foreground p-5 text-background shadow-[0_2px_16px_rgba(0,0,0,0.12)]">
      <div className="font-condensed text-[11px] font-semibold uppercase tracking-[0.14em] text-background/60">
        Estimated US Repair Budget
      </div>

      {/* Grand total */}
      <div className="mt-2 font-mono text-3xl font-bold tabular-nums sm:text-4xl">
        ${grandTotal.toLocaleString()}
      </div>
      <div className="mt-1 font-condensed text-[11px] uppercase tracking-wider text-background/60">
        {count} {count === 1 ? "item" : "items"} flagged
      </div>

      {/* Breakdown */}
      {count > 0 && (
        <div className="mt-4 space-y-2 border-t border-background/15 pt-4">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-background/70">Parts only</span>
            <span className="font-mono font-semibold text-background">
              ${partsTotal.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-background/70">
              Avg labour
              <span className="ml-1 font-condensed text-[10px] uppercase tracking-wider text-background/50">
                @ ${LABOUR_RATE}/hr
              </span>
            </span>
            <span className="font-mono font-semibold text-background">
              ${labourTotal.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-background/15 pt-2 text-[14px]">
            <span className="font-semibold text-background">Total estimate</span>
            <span className="font-mono font-bold text-background">
              ${grandTotal.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Suggested offer */}
      <div className="mt-4 border-t border-background/15 pt-3 text-[13px] text-background/70">
        Suggested opening offer:{" "}
        <span className="font-mono font-semibold text-background">
          ${suggestedOffer.toLocaleString()}
        </span>
      </div>
    </div>
  );
}