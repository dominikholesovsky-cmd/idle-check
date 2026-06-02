import { useMemo, useState } from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  onNewReport,
}: {
  vehicle: Vehicle;
  marketplace: string;
  askingPrice: number;
  issues: Issue[];
  recalls: Recall[];
  onNewReport: () => void;
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

  const total = checkedIssues.reduce(
    (sum, i) => sum + Math.round((i.costMin + i.costMax) / 2),
    0,
  );
  const suggestedOffer = Math.max(0, Math.round(askingPrice - total * 0.65));

  // Mark HIGH severity issues as recommended to check
  const recommendedIds = useMemo(
    () => new Set(issues.filter((i) => i.severity === "HIGH").map((i) => i.id)),
    [issues],
  );

  const yearStr = vehicle.year ? `${vehicle.year} ` : "";
  const trimStr = vehicle.trim ? ` (${vehicle.trim})` : "";
  const mileageStr = vehicle.mileage != null ? ` · ${vehicle.mileage.toLocaleString()} mi` : "";
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
              {yearStr}{vehicle.make} {vehicle.model}{trimStr}
              <span className="font-normal text-muted-foreground">
                {mileageStr}{mpStr}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-condensed text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Asking Price
              </div>
              <div className="font-mono text-xl font-bold tabular-nums">
                ${askingPrice.toLocaleString()}
              </div>
            </div>
            <Button
              onClick={onNewReport}
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 border-border font-condensed text-xs font-semibold uppercase tracking-wider hover:border-primary hover:text-primary"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              New Report
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Checklist */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-condensed text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Inspection Checklist
            </h2>
            {recommendedIds.size > 0 && (
              <span className="font-condensed text-[11px] text-muted-foreground">
                <span className="inline-block h-2 w-2 rounded-full bg-primary mr-1.5 align-middle" />
                {recommendedIds.size} recommended to check
              </span>
            )}
          </div>
          <InspectionChecklist
            issues={issues}
            checked={checked}
            onToggle={toggle}
            recommendedIds={recommendedIds}
          />
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