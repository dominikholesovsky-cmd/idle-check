import { useMemo, useState } from "react";
import { InspectionChecklist } from "./InspectionChecklist";
import { RepairCostTracker } from "./RepairCostTracker";
import { NegotiationScript } from "./NegotiationScript";
import type { Issue, Vehicle } from "@/lib/ghost/types";

export function ReportView({
  vehicle,
  marketplace,
  askingPrice,
  issues,
}: {
  vehicle: Vehicle;
  marketplace: string;
  askingPrice: number;
  issues: Issue[];
}) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const checkedIssues = useMemo(
    () => issues.filter((i) => checked.has(i.id)),
    [issues, checked],
  );
  const total = checkedIssues.reduce((sum, i) => sum + i.cost, 0);

  const yearStr = vehicle.year ? `${vehicle.year} ` : "";

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Top Status Bar */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-primary">
              Analysis Ready
            </div>
            <div className="mt-1 text-base font-bold sm:text-lg">
              {yearStr}{vehicle.make} {vehicle.model}
            </div>
            <div className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Detected via {marketplace}
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Asking Price
            </div>
            <div className="font-mono text-xl font-bold tabular-nums">
              ${askingPrice.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Checklist */}
        <div>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Procedural Inspection Checklist
          </h2>
          <InspectionChecklist issues={issues} checked={checked} onToggle={toggle} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <RepairCostTracker total={total} count={checkedIssues.size} />
          <NegotiationScript
            vehicle={vehicle}
            askingPrice={askingPrice}
            checkedIssues={checkedIssues}
            repairTotal={total}
          />
        </div>
      </div>
    </section>
  );
}
