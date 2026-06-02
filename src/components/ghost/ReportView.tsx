import { useMemo, useState } from "react";
import { InspectionChecklist } from "./InspectionChecklist";
import { RepairCostTracker } from "./RepairCostTracker";
import { NegotiationScript } from "./NegotiationScript";
import { RecallSection } from "./RecallSection";
import type { Issue, Recall, Vehicle } from "@/lib/ghost/types";

export function ReportView({
  vehicle,
  marketplace,
  askingPrice,
  issues,
  recalls,
}: {
  vehicle: Vehicle;
  marketplace: string;
  askingPrice: number;
  issues: Issue[];
  recalls: Recall[];
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
  // Use midpoint of cost range
  const total = checkedIssues.reduce(
    (sum, i) => sum + Math.round((i.costMin + i.costMax) / 2),
    0,
  );
  const suggestedOffer = Math.max(0, Math.round(askingPrice - total * 0.65));

  const yearStr = vehicle.year ? `${vehicle.year} ` : "";
  const trimStr = vehicle.trim ? ` (${vehicle.trim})` : "";
  const mileageStr =
    vehicle.mileage != null ? ` · ${vehicle.mileage.toLocaleString()} mi` : "";
  const mpStr = ` · Asked on ${marketplace}`;

  return (
    <section className="view-fade-in relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Top Status Bar */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)] sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-condensed text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              Full Report Unlocked
            </div>
            <div className="mt-1 text-base font-bold sm:text-lg">
              {yearStr}
              {vehicle.make} {vehicle.model}
              {trimStr}
              <span className="font-normal text-muted-foreground">
                {mileageStr}
                {mpStr}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-condensed text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
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
          <h2 className="mb-4 font-condensed text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Inspection Checklist
          </h2>
          <InspectionChecklist issues={issues} checked={checked} onToggle={toggle} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <RepairCostTracker
            total={total}
            count={checkedIssues.length}
            suggestedOffer={suggestedOffer}
          />
          <NegotiationScript
            vehicle={vehicle}
            askingPrice={askingPrice}
            checkedIssues={checkedIssues}
            repairTotal={total}
            suggestedOffer={suggestedOffer}
          />
        </div>
      </div>

      <RecallSection recalls={recalls} />
    </section>
  );
}
