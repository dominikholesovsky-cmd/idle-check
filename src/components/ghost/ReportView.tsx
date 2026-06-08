import { useEffect, useMemo, useState } from "react";
import { PlusCircle, AlertTriangle, TrendingUp, Shield, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InspectionChecklist } from "./InspectionChecklist";
import { RepairCostTracker } from "./RepairCostTracker";
import { NegotiationScript } from "./NegotiationScript";
import { RecallSection } from "./RecallSection";
import { RecommendationCard } from "./RecommendationCard";
import { generateRecommendation } from "@/lib/ghost/procedural";
import type { Issue, Recall, ReportRecommendation, Vehicle } from "@/lib/ghost/types";

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
  const mileageStr = vehicle.mileage != null ? ` · ${vehicle.mileage.toLocaleString()} mi` : "";
  const displayPrice = askingPrice || 0;
  const hasRedFlags = Array.isArray(sellerRedFlags) && sellerRedFlags.length > 0;
  const hasMarketNote = marketValueNote && marketValueNote.trim().length > 0;

  const recallBadgeConfig = recallSource === "vin"
    ? { label: "Live NHTSA · VIN verified", Icon: ShieldCheck, color: "text-emerald-600" }
    : recallSource === "nhtsa"
    ? { label: "Live NHTSA · Make/Model/Year", Icon: Shield, color: "text-emerald-600" }
    : { label: "Estimated recall data", Icon: Shield, color: "text-muted-foreground" };

  const navItems = [
    { href: "#verdict", label: "Verdict" },
    ...(hasRedFlags ? [{ href: "#red-flags", label: `Red Flags · ${sellerRedFlags.length}` }] : []),
    { href: "#checklist", label: `Checklist${issues.length ? ` · ${issues.length}` : ""}` },
    { href: "#budget", label: "Repair Budget" },
    { href: "#negotiation", label: "Negotiation" },
    { href: "#recalls", label: `Recalls${recalls.length ? ` · ${recalls.length}` : ""}` },
  ];

  return (
    <section className="view-fade-in relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">

      {/* Status bar */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)] sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-condensed text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              Full Report Unlocked
            </div>
            <div className="mt-1 text-base font-bold sm:text-lg">
              {yearStr}{vehicle.make} {vehicle.model}{trimStr}
              {vehicle.engineType && (
                <span className="ml-2 font-condensed text-[13px] font-normal text-muted-foreground">
                  {vehicle.engineType}
                </span>
              )}
              <span className="font-normal text-muted-foreground">
                {mileageStr} · Asked on {marketplace || "Unknown"}
              </span>
            </div>
            {vehicle.vin && (
              <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                VIN: {vehicle.vin}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-condensed text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
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

      {/* Sticky nav */}
      <nav
        aria-label="Report sections"
        className="sticky top-[68px] z-30 mt-4 -mx-1 rounded-xl border border-border bg-card/90 shadow-[0_2px_12px_rgba(0,0,0,0.06)] backdrop-blur supports-[backdrop-filter]:bg-card/70"
      >
        <div className="overflow-x-auto px-1 py-1">
          <ul className="flex min-w-max items-center gap-1 font-condensed text-[11px] font-semibold uppercase tracking-[0.14em]">
            {navItems.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="block whitespace-nowrap rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative h-px overflow-hidden rounded-b-xl bg-border/40">
          <div
            className="h-full origin-left bg-gradient-to-r from-transparent via-primary/70 to-primary shadow-[0_0_12px_rgba(220,38,38,0.55)] transition-[width] duration-150 ease-out"
            style={{ width: `${scrollProgress * 100}%` }}
            aria-hidden
          />
        </div>
      </nav>

      {/* Verdict */}
      <div id="verdict" className="scroll-mt-32">
        <RecommendationCard recommendation={safeRecommendation} issues={issues} />
      </div>

      {/* Market value note */}
      {hasMarketNote && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div>
            <span className="font-condensed text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Market Value
            </span>
            <p className="mt-0.5 text-[13px] leading-relaxed text-foreground">
              {marketValueNote}
            </p>
          </div>
        </div>
      )}

      {/* Seller red flags */}
      {hasRedFlags && (
        <div id="red-flags" className="mt-6 scroll-mt-32">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-primary" />
            <h2 className="font-condensed text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Seller Red Flags · {sellerRedFlags.length} detected
            </h2>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
            <p className="mb-3 text-[12px] text-muted-foreground">
              These phrases or omissions in the listing text suggest the seller may be hiding something or the car has undisclosed issues.
            </p>
            <ul className="space-y-2">
              {sellerRedFlags.map((flag, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="text-[13px] leading-relaxed text-foreground">{flag}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div id="checklist" className="scroll-mt-32">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-condensed text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Inspection Checklist
            </h2>
            {recommendedIds.size > 0 && (
              <span className="font-condensed text-[11px] text-muted-foreground">
                <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-primary align-middle" />
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

        <div className="space-y-6 lg:sticky lg:top-[140px] lg:self-start">
          <div id="budget" className="scroll-mt-32">
            <RepairCostTracker
              issues={issues}
              checked={checked}
              askingPrice={displayPrice}
            />
          </div>
          <div id="negotiation" className="scroll-mt-32">
            <NegotiationScript
              vehicle={vehicle}
              askingPrice={displayPrice}
              checkedIssues={checkedIssues}
              repairTotal={grandTotal}
              suggestedOffer={suggestedOffer}
            />
          </div>
        </div>
      </div>

      {/* Recalls */}
      <div id="recalls" className="scroll-mt-32 mt-10">
        <div className="mb-3 flex items-center gap-2">
          <recallBadgeConfig.Icon className={`h-3.5 w-3.5 ${recallBadgeConfig.color}`} />
          <span className={`font-condensed text-[10px] font-semibold uppercase tracking-wider ${recallBadgeConfig.color}`}>
            {recallBadgeConfig.label}
          </span>
        </div>
        <RecallSection recalls={recalls} />
      </div>

    </section>
  );
}