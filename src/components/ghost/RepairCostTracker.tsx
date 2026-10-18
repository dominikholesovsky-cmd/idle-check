import { LABOUR_RATE, round100 } from "@/lib/ghost/report";

// Presentational only: the totals and the offer come from ReportView (one calculation).
export function RepairCostTracker({
  count,
  partsTotal,
  repairTotal,
  suggestedOffer,
  embedded = false,
}: {
  count: number;
  partsTotal: number;
  repairTotal: number;
  suggestedOffer: number;
  embedded?: boolean;
}) {
  const partsRounded = Math.min(repairTotal, round100(partsTotal));
  const labourRounded = repairTotal - partsRounded; // parts + labour always add up to the total
  const grandTotal = repairTotal;

  return (
    <div className={embedded ? "" : "rounded-xl border border-gray-200 bg-white p-5"}>
      <div className="font-condensed text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
        Estimated US Repair Budget
      </div>
      <div className="mt-2 font-mono text-3xl font-bold tabular-nums text-zinc-900 sm:text-4xl">
        ${grandTotal.toLocaleString()}
      </div>
      <div className="mt-1 font-condensed text-[11px] uppercase tracking-wider text-zinc-500">
        {count} {count === 1 ? "item" : "items"} flagged
      </div>

      {count > 0 && (
        <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
          <div className="flex items-start justify-between gap-3 text-[13px]">
            <div>
              <span className="font-medium text-zinc-900">Parts only</span>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                Sourced from RockAuto / eBay Motors
              </p>
            </div>
            <span className="shrink-0 font-mono font-semibold text-zinc-900">
              ~${partsRounded.toLocaleString()}
            </span>
          </div>
          <div className="flex items-start justify-between gap-3 text-[13px]">
            <div>
              <span className="font-medium text-zinc-600">Labour estimate</span>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                @ ${LABOUR_RATE}/hr · varies by shop
              </p>
            </div>
            <span className="shrink-0 font-mono font-semibold text-zinc-600">
              ~${labourRounded.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-gray-100 pt-2 text-[13px]">
            <span className="font-medium text-zinc-900">Total estimate</span>
            <span className="font-mono font-bold text-zinc-900">
              ~${grandTotal.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {count === 0 && (
        <p className="mt-4 text-[12px] text-zinc-500">
          Tick items in the checklist to build your repair budget.
        </p>
      )}

      <div className="mt-4 border-t border-gray-100 pt-3 text-[13px] text-zinc-500">
        Suggested opening offer:{" "}
        <span className="font-mono font-semibold text-zinc-900">
          ${suggestedOffer.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
