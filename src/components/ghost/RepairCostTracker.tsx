export function RepairCostTracker({ total, count }: { total: number; count: number }) {
  return (
    <div className="rounded-xl border border-border bg-foreground p-5 text-background shadow-lg">
      <div className="font-mono text-[11px] uppercase tracking-wider text-background/60">
        Estimated US Repair & Parts Budget
      </div>
      <div className="mt-2 font-mono text-3xl font-bold tabular-nums sm:text-4xl">
        ${total.toLocaleString()}
      </div>
      <div className="mt-2 font-mono text-[11px] uppercase tracking-wider text-background/60">
        {count} {count === 1 ? "item" : "items"} flagged · $120/hr labor
      </div>
    </div>
  );
}
