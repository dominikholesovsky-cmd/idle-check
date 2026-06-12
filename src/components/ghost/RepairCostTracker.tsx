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
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
      <div className="font-condensed text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-300">
        Estimated US Repair Budget
      </div>
      <div className="mt-2 font-mono text-3xl font-bold tabular-nums text-white sm:text-4xl">
        ${grandTotal.toLocaleString()}
      </div>
      <div className="mt-1 font-condensed text-[11px] uppercase tracking-wider text-zinc-300">
        {count} {count === 1 ? "item" : "items"} flagged
      </div>

      {count > 0 && (
        <div className="mt-4 space-y-3 border-t border-zinc-800 pt-4">
          <div className="flex items-start justify-between gap-3 text-[13px]">
            <div>
              <span className="font-medium text-white">Parts only</span>
              <p className="mt-0.5 text-[11px] text-zinc-300">
                Sourced from RockAuto / eBay Motors
              </p>
            </div>
            <span className="shrink-0 font-mono font-semibold text-white">
              ~${partsRounded.toLocaleString()}
            </span>
          </div>
          <div className="flex items-start justify-between gap-3 text-[13px]">
            <div>
              <span className="font-medium text-zinc-300">Labour estimate</span>
              <p className="mt-0.5 text-[11px] text-zinc-300">
                @ ${LABOUR_RATE}/hr · varies by shop
              </p>
            </div>
            <span className="shrink-0 font-mono font-semibold text-zinc-300">
              ~${labourRounded.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-zinc-800 pt-2 text-[13px]">
            <span className="font-medium text-white">Total estimate</span>
            <span className="font-mono font-bold text-white">
              ~${grandTotal.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {count === 0 && (
        <p className="mt-4 text-[12px] text-zinc-300">
          Tick items in the checklist to build your repair budget.
        </p>
      )}

      <div className="mt-4 border-t border-zinc-800 pt-3 text-[13px] text-zinc-300">
        Suggested opening offer:{" "}
        <span className="font-mono font-semibold text-white">
          ${suggestedOffer.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
