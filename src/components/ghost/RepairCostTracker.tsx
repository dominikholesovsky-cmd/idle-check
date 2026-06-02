export function RepairCostTracker({
  total,
  count,
  suggestedOffer,
}: {
  total: number;
  count: number;
  suggestedOffer: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-foreground p-5 text-background shadow-[0_2px_16px_rgba(0,0,0,0.12)]">
      <div className="font-condensed text-[11px] font-semibold uppercase tracking-[0.14em] text-background/60">
        Estimated US Repair & Parts Budget
      </div>
      <div className="mt-2 font-mono text-3xl font-bold tabular-nums sm:text-4xl">
        ${total.toLocaleString()}
      </div>
      <div className="mt-2 font-condensed text-[11px] uppercase tracking-wider text-background/60">
        {count} {count === 1 ? "item" : "items"} flagged · $120/hr labor
      </div>
      <div className="mt-4 border-t border-background/15 pt-3 text-[13px] text-background/70">
        Suggested opening offer:{" "}
        <span className="font-mono font-semibold text-background">
          ${suggestedOffer.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
