import { useEffect, useMemo, useState } from "react";
import { PlusCircle, AlertTriangle, TrendingUp, Shield, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InspectionChecklist } from "./InspectionChecklist";
import { RepairCostTracker } from "./RepairCostTracker";
import { NegotiationScript } from "./NegotiationScript";
import { RecallSection } from "./RecallSection";
import { RecommendationCard } from "./RecommendationCard";
import { generateRecommendation } from "@/lib/ghost/procedural";
import type { Issue, Recall, ReportRecommendation, Vehicle } from "@/lib/ghost/types";

type TabId = "verdict" | "checklist" | "budget" | "negotiation" | "recalls";

export function ReportView({
  vehicle, marketplace, askingPrice, issues = [], recalls = [],
  recommendation, onNewReport,
  sellerRedFlags, marketValueNote, recallSource,
}: {
  vehicle: Vehicle;
  marketplace: string;
  askingPrice: number;
  issues: Issue[];
  recalls: Recall[];
  recommendation?: ReportRecommendation;
  onNewReport: () => void;
  sellerRedFlags?: string[];
  marketValueNote?: string;
  recallSource?: "vin" | "nhtsa" | "procedural" | "none";
}) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<TabId>("verdict");
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setScrollProgress(max > 0 ? Math.min(1, Math.max(0, h.scrollTop / max)) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const toggle = (id: string) => setChecked((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const checkedIssues = useMemo(() => {
    return Array.isArray(issues) ? issues.filter((i) => checked.has(i.id)) : [];
  }, [issues, checked]);

  const partsTotal = checkedIssues.reduce(
    (s, i) => s + Math.round(((i.partsCostMin || 0) + (i.partsCostMax || 0)) / 2), 0
  );
  const labourTotal = checkedIssues.reduce(
    (s, i) => s + Math.round((i.labourHours || 0) * 120), 0
  );
  const grandTotal = partsTotal + labourTotal;
  const suggestedOffer = Math.max(0, Math.round((askingPrice || 0) - grandTotal * 0.65));

  const recommendedIds = useMemo(() => {
    return Array.isArray(issues)
      ? new Set(issues.filter((i) => i.severity === "HIGH").map((i) => i.id))
      : new Set<string>();
  }, [issues]);

  const safeRecommendation = useMemo(() => {
    if (recommendation && recommendation.verdict) return recommendation;
    return generateRecommendation(vehicle, issues, askingPrice);
  }, [recommendation, vehicle, issues, askingPrice]);

  if (!vehicle) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading vehicle data...
      </div>
    );
  }

  const yearStr = vehicle.year ? `${vehicle.year} ` : "";
  const trimStr = vehicle.trim ? ` (${vehicle.trim})` : "";
  const mileageStr = vehicle.mileage != null ? `${vehicle.mileage.toLocaleString()} mi` : "";
  const displayPrice = askingPrice || 0;
  const hasRedFlags = Array.isArray(sellerRedFlags) && sellerRedFlags.length > 0;
  const hasMarketNote = marketValueNote && marketValueNote.trim().length > 0;

  const recallBadge = recallSource === "vin"
    ? { label: "Live NHTSA · VIN verified", Icon: ShieldCheck, color: "text-emerald-600" }
    : recallSource === "nhtsa"
    ? { label: "Live NHTSA · Make/Model/Year", Icon: Shield, color: "text-emerald-600" }
    : { label: "Estimated recall data", Icon: Shield, color: "text-muted-foreground" };

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: "verdict", label: "Verdict" },
    { id: "checklist", label: "Checklist", count: issues.length },
    { id: "budget", label: "Repair Budget" },
    { id: "negotiation", label: "Negotiation" },
    { id: "recalls", label: "Recalls", count: recalls.length },
  ];

  return (
    <section className="view-fade-in relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">

      {/* Status bar */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-condensed text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Full Report Unlocked
            </div>
            <div className="mt-1 text-base font-bold sm:text-lg">
              {yearStr}{vehicle.make} {vehicle.model}{trimStr}
              {vehicle.engineType && (
                <span className="ml-2 font-condensed text-[13px] font-normal text-muted-foreground">
                  {vehicle.engineType}
                </span>
              )}
            </div>
            <div className="mt-0.5 text-[12px] text-muted-foreground">
              {mileageStr && <>{mileageStr} · </>}Asked on {marketplace || "Unknown"}
              {vehicle.vin && <span className="ml-2 font-mono text-[11px]">VIN: {vehicle.vin}</span>}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-condensed text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Asking Price
              </div>
              <div className="font-mono text-xl font-bold tabular-nums">
                ${displayPrice.toLocaleString()}
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

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabId)} className="mt-4">
        <div className="sticky top-[64px] z-30 -mx-1 rounded-xl border border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="overflow-x-auto p-1">
            <TabsList className="h-auto w-full justify-start gap-1 bg-transparent p-0">
              {tabs.map((t) => (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                  className="whitespace-nowrap rounded-md px-3 py-2 font-condensed text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-none"
                >
                  {t.label}
                  {t.count != null && t.count > 0 && (
                    <span className="ml-1.5 font-mono text-[10px] opacity-70">· {t.count}</span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <div className="relative h-px overflow-hidden rounded-b-xl bg-border/40">
            <div
              className="h-full origin-left bg-gradient-to-r from-transparent via-primary/70 to-primary shadow-[0_0_12px_rgba(220,38,38,0.55)] transition-[width] duration-150 ease-out"
              style={{ width: `${scrollProgress * 100}%` }}
              aria-hidden
            />
          </div>
        </div>

        {/* VERDICT */}
        <TabsContent value="verdict" className="mt-6 space-y-5 focus-visible:outline-none">
          <RecommendationCard recommendation={safeRecommendation} issues={issues} />

          {hasMarketNote && (
            <div className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <span className="font-condensed text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Market Value
                </span>
                <p className="mt-0.5 text-[13px] leading-relaxed text-foreground">{marketValueNote}</p>
              </div>
            </div>
          )}

          {hasRedFlags && (
            <div className="rounded-xl border border-border border-l-4 border-l-primary bg-card p-4 sm:p-5">
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-primary" />
                <h2 className="font-condensed text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  Seller Red Flags · {sellerRedFlags!.length} detected
                </h2>
              </div>
              <ul className="space-y-1.5">
                {sellerRedFlags!.map((flag, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span className="text-[13px] leading-relaxed text-foreground">{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </TabsContent>

        {/* CHECKLIST */}
        <TabsContent value="checklist" className="mt-6 focus-visible:outline-none">
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-condensed text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Inspection Checklist
                </h2>
                {recommendedIds.size > 0 && (
                  <span className="font-condensed text-[11px] text-muted-foreground">
                    <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-primary align-middle" />
                    {recommendedIds.size} recommended
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
            <aside className="lg:sticky lg:top-[140px] lg:self-start">
              <RepairCostTracker
                issues={issues}
                checked={checked}
                askingPrice={displayPrice}
              />
              <p className="mt-2 px-1 text-[11px] text-muted-foreground">
                Tip: click a category to expand. Tick items to update the budget.
              </p>
            </aside>
          </div>
        </TabsContent>

        {/* BUDGET */}
        <TabsContent value="budget" className="mt-6 focus-visible:outline-none">
          <div className="grid gap-6 lg:grid-cols-2">
            <RepairCostTracker
              issues={issues}
              checked={checked}
              askingPrice={displayPrice}
            />
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-condensed text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                What you've flagged
              </h3>
              {checkedIssues.length === 0 ? (
                <p className="mt-3 text-[13px] text-muted-foreground">
                  Nothing flagged yet. Go to the Checklist tab and tick the items you want to budget for.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-border">
                  {checkedIssues.map((i) => (
                    <li key={i.id} className="flex items-center justify-between gap-3 py-2.5">
                      <span className="text-[13px] text-foreground">{i.label}</span>
                      <span className="font-mono text-[12px] tabular-nums text-muted-foreground">
                        ${i.costMin.toLocaleString()} – ${i.costMax.toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </TabsContent>

        {/* NEGOTIATION */}
        <TabsContent value="negotiation" className="mt-6 focus-visible:outline-none">
          <div className="mx-auto max-w-2xl">
            <NegotiationScript
              vehicle={vehicle}
              askingPrice={displayPrice}
              checkedIssues={checkedIssues}
              repairTotal={grandTotal}
              suggestedOffer={suggestedOffer}
            />
          </div>
        </TabsContent>

        {/* RECALLS */}
        <TabsContent value="recalls" className="mt-6 focus-visible:outline-none">
          <div className="mb-3 flex items-center gap-2">
            <recallBadge.Icon className={`h-3.5 w-3.5 ${recallBadge.color}`} />
            <span className={`font-condensed text-[10px] font-semibold uppercase tracking-wider ${recallBadge.color}`}>
              {recallBadge.label}
            </span>
          </div>
          {recalls.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              No recall records found for this vehicle.
            </div>
          ) : (
            <RecallSection recalls={recalls} />
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}
