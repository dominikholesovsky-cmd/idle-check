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
        <div className="mt-4 space-y-2 border-t border-border pt-4">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-muted-foreground">Parts only</span>
            <span className="font-mono font-semibold text-foreground">
              ${partsTotal.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-muted-foreground">
              Avg labour
              <span className="ml-1 font-condensed text-[10px] uppercase tracking-wider text-muted-foreground/70">
                @ ${LABOUR_RATE}/hr
              </span>
            </span>
            <span className="font-mono font-semibold text-foreground">
              ${labourTotal.toLocaleString()}
            </span>
          </div>
        </div>
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
