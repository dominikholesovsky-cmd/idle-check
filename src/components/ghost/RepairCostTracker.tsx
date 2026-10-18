import { LABOUR_RATE, round100 } from "@/lib/ghost/report";

function usd(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

// Presentational only: the totals come from ReportView (one calculation for the whole report).
// Sits inside another card.
export function RepairCostTracker({
  partsTotal,
  repairTotal,
}: {
  partsTotal: number;
  repairTotal: number;
}) {
  const partsRounded = Math.min(repairTotal, round100(partsTotal));
  const labourRounded = repairTotal - partsRounded; // parts + labor always add up to the total
  const partsPct = repairTotal > 0 ? (partsRounded / repairTotal) * 100 : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-condensed text-[13px] font-bold uppercase tracking-[0.12em] text-text-2">
          Repair budget
        </span>
        <span className="font-mono text-[22px] font-bold">
          {repairTotal > 0 ? "~" : ""}{usd(repairTotal)}
        </span>
      </div>

      {repairTotal > 0 ? (
        <>
          <div className="mt-3 flex h-2 overflow-hidden rounded bg-card-border" aria-hidden="true">
            <span className="bg-primary" style={{ width: `${partsPct}%` }} />
            <span className="bg-ink" style={{ width: `${100 - partsPct}%` }} />
          </div>
          <div className="mt-2 flex justify-between gap-3 text-[13px] text-text-2">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary" />
              Parts ~{usd(partsRounded)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-ink" />
              Labor ~{usd(labourRounded)}
            </span>
          </div>
          <p className="mt-1.5 text-[13px] text-muted-text">Labor at ${LABOUR_RATE}/h. Shops vary.</p>
        </>
      ) : (
        <p className="mt-2 text-[13px] text-muted-text">Tick findings to build your repair budget.</p>
      )}
    </div>
  );
}
