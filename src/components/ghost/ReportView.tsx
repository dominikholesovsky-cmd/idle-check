import { useMemo, useState } from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InspectionChecklist } from "./InspectionChecklist";
import { RepairCostTracker } from "./RepairCostTracker";
import { NegotiationScript } from "./NegotiationScript";
import { RecallSection } from "./RecallSection";
import { RecommendationCard } from "./RecommendationCard";
import { generateRecommendation } from "@/lib/ghost/procedural";
import type { Issue, Recall, ReportRecommendation, Vehicle } from "@/lib/ghost/types";

export function ReportView({
  vehicle, marketplace, askingPrice, issues = [], recalls = [], recommendation, onNewReport,
}: {
  vehicle: Vehicle; marketplace: string; askingPrice: number;
  issues: Issue[]; recalls: Recall[];
  recommendation?: ReportRecommendation; // PŘIDÁN OTAZNÍK PRO VYŠŠÍ BEZPEČNOST TYPU
  onNewReport: () => void;
}) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (id: string) => setChecked((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  // Bezpečné filtrování s fallbackem na prázdné pole
  const checkedIssues = useMemo(() => {
    return Array.isArray(issues) ? issues.filter((i) => checked.has(i.id)) : [];
  }, [issues, checked]);

  const partsTotal = checkedIssues.reduce((s, i) => s + Math.round(((i.partsCostMin || 0) + (i.partsCostMax || 0)) / 2), 0);
  const labourTotal = checkedIssues.reduce((s, i) => s + Math.round((i.labourHours || 0) * 120), 0);
  const grandTotal = partsTotal + labourTotal;
  const suggestedOffer = Math.max(0, Math.round((askingPrice || 0) - grandTotal * 0.65));

  const recommendedIds = useMemo(() => {
    return Array.isArray(issues) ? new Set(issues.filter((i) => i.severity === "HIGH").map((i) => i.id)) : new Set<string>();
  }, [issues]);

  // ŽIVÁ POJISTKA: Pokud z historie nebo API nedorazilo recommendation, za běhu ho dopočítáme
  const safeRecommendation = useMemo(() => {
    if (recommendation && recommendation.verdict) {
      return recommendation;
    }
    return generateRecommendation(vehicle, issues, askingPrice);
  }, [recommendation, vehicle, issues, askingPrice]);

  // Bezpečné ošetření chybějícího objektu vehicle
  if (!vehicle) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading vehicle data...
      </div>
    );
  }

  const yearStr = vehicle.year ? `${vehicle.year} ` : "";
  const trimStr = vehicle.trim ? ` (${vehicle.trim})` : "";
  const mileageStr = vehicle.mileage != null ? ` · ${vehicle.mileage.toLocaleString()} mi` : "";
  const displayPrice = askingPrice || 0;

  return (
    <section className="view-fade-in relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">

      {/* Status bar */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)] sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-condensed text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Full Report Unlocked</div>
            <div className="mt-1 text-base font-bold sm:text-lg">
              {yearStr}{vehicle.make} {vehicle.model}{trimStr}
              {vehicle.engineType && <span className="ml-2 font-condensed text-[13px] font-normal text-muted-foreground">{vehicle.engineType}</span>}
              <span className="font-normal text-muted-foreground">{mileageStr} · Asked on {marketplace || "Unknown"}</span>
            </div>
            {vehicle.vin && (
              <div className="mt-1 font-mono text-[11px] text-muted-foreground">VIN: {vehicle.vin}</div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-condensed text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Asking Price</div>
              <div className="font-mono text-xl font-bold tabular-nums">${displayPrice.toLocaleString()}</div>
            </div>
            <Button onClick={onNewReport} variant="outline" size="sm"
              className="h-9 gap-1.5 border-border font-condensed text-xs font-semibold uppercase tracking-wider hover:border-primary hover:text-primary">
              <PlusCircle className="h-3.5 w-3.5" />
              New Report
            </Button>
          </div>
        </div>
      </div>

      {/* Recommendation — NYNÍ POUŽÍVÁ BEZPEČNOU STRUKTURU */}
      <RecommendationCard recommendation={safeRecommendation} issues={issues} />

      {/* Main grid */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-condensed text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Inspection Checklist</h2>
            {recommendedIds.size > 0 && (
              <span className="font-condensed text-[11px] text-muted-foreground">
                <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-primary align-middle" />
                {recommendedIds.size} recommended to check
              </span>
            )}
          </div>
          <InspectionChecklist issues={issues} checked={checked} onToggle={toggle} recommendedIds={recommendedIds} />
        </div>

        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <RepairCostTracker issues={issues} checked={checked} askingPrice={displayPrice} />
          <NegotiationScript
            vehicle={vehicle} askingPrice={displayPrice}
            checkedIssues={checkedIssues} repairTotal={grandTotal} suggestedOffer={suggestedOffer}
          />
        </div>
      </div>

      <RecallSection recalls={recalls} />
    </section>
  );
}