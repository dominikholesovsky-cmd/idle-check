import { useEffect, useMemo, useState } from "react";
import { PlusCircle, AlertTriangle, TrendingUp, Shield, ShieldCheck, FileDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
  const [activeSection, setActiveSection] = useState<string>("verdict");

  useEffect(() => {
    const ids = ["section-verdict", "section-issues", "section-negotiation", "section-recalls"];
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(visible.target.id.replace("section-", ""));
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: [0, 0.25, 0.5, 1] }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(`section-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
  const vehicleName = `${yearStr}${vehicle.make} ${vehicle.model}${trimStr}`.trim();

  const recallBadge = recallSource === "vin"
    ? { label: "Live NHTSA · VIN verified", Icon: ShieldCheck, color: "text-emerald-600" }
    : recallSource === "nhtsa"
    ? { label: "Live NHTSA · Make/Model/Year", Icon: Shield, color: "text-emerald-600" }
    : { label: "Estimated recall data", Icon: Shield, color: "text-muted-foreground" };

  const exportPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const BG = "#ffffff";
    const ACCENT = "#b22222";
    const WHITE = "#111111";
    const MUTED = "#6b7280";

    const paintBg = () => {
      doc.setFillColor(BG);
      doc.rect(0, 0, pageW, pageH, "F");
    };
    paintBg();

    // Header
    doc.setTextColor(ACCENT);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("IDLE // CHECK REPORT", 40, 60);

    doc.setTextColor(WHITE);
    doc.setFontSize(14);
    doc.text(vehicleName || "Vehicle Report", 40, 84);

    doc.setTextColor(MUTED);
    doc.setFontSize(10);
    const dateStr = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    doc.text(`${dateStr}${mileageStr ? ` · ${mileageStr}` : ""} · Asked on ${marketplace || "Unknown"} · $${displayPrice.toLocaleString()}`, 40, 102);

    doc.setDrawColor(ACCENT);
    doc.setLineWidth(1.5);
    doc.line(40, 116, pageW - 40, 116);

    // Verdict
    let y = 144;
    doc.setTextColor(ACCENT);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`VERDICT · ${safeRecommendation.verdict.toUpperCase()}`, 40, y);
    y += 18;
    doc.setTextColor(WHITE);
    doc.setFontSize(13);
    const headlineLines = doc.splitTextToSize(safeRecommendation.headline || "", pageW - 80);
    doc.text(headlineLines, 40, y);
    y += headlineLines.length * 16 + 6;
    doc.setTextColor(MUTED);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const summaryLines = doc.splitTextToSize(safeRecommendation.summary || "", pageW - 80);
    doc.text(summaryLines, 40, y);
    y += summaryLines.length * 13 + 14;

    const tableTheme = {
      headStyles: { fillColor: ACCENT, textColor: WHITE, fontStyle: "bold" as const },
      bodyStyles: { fillColor: "#f9f9f9", textColor: "#111111" },
      alternateRowStyles: { fillColor: "#f3f3f3" },
      styles: { font: "helvetica", fontSize: 9, cellPadding: 6, lineColor: "#e5e5e5", lineWidth: 0.3 },
      margin: { left: 40, right: 40 },
    };

    // Issues
    if (issues.length) {
      doc.setTextColor(ACCENT);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("DETECTED ISSUES", 40, y);
      y += 8;
      autoTable(doc, {
        startY: y,
        head: [["Issue", "Severity", "Cost Range"]],
        body: issues.map((i) => [i.label, i.severity, `$${i.costMin.toLocaleString()} – $${i.costMax.toLocaleString()}`]),
        ...tableTheme,
        didDrawPage: () => paintBg(),
      });
      y = (doc as any).lastAutoTable.finalY + 20;
    }

    // Red Flags
    if (hasRedFlags) {
      if (y > pageH - 120) { doc.addPage(); paintBg(); y = 60; }
      doc.setTextColor(ACCENT);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("SELLER RED FLAGS", 40, y);
      y += 14;
      doc.setTextColor(WHITE);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      sellerRedFlags!.forEach((flag) => {
        const lines = doc.splitTextToSize(`• ${flag}`, pageW - 80);
        if (y + lines.length * 13 > pageH - 60) { doc.addPage(); paintBg(); y = 60; }
        doc.text(lines, 40, y);
        y += lines.length * 13 + 4;
      });
      y += 8;
    }

    // Generic inspection checklist
    const checklist: Record<string, string[]> = {
      "Exterior": ["Paint consistency & overspray", "Panel gaps even on all sides", "Rust on rocker panels & wheel arches", "Tire tread & uneven wear", "Windshield chips / cracks"],
      "Under Hood": ["Oil level & color (not milky)", "Coolant level & color", "Belt cracks & tension", "Battery terminals clean", "No fluid leaks on engine block"],
      "Interior": ["Warning lights on ignition", "AC blows cold within 30s", "All windows / locks / mirrors", "Seat wear vs claimed mileage", "Odors: smoke, mildew, fuel"],
      "Test Drive": ["Cold start without rough idle", "Smooth acceleration through gears", "Brakes straight, no pulsing", "Steering centered, no pull", "No vibration at 60+ mph"],
      "Under Car": ["No fresh oil / coolant drips", "Exhaust intact, no rust holes", "CV boots not torn", "Suspension bushings not cracked", "Frame: no welds or kinks"],
    };
    if (y > pageH - 180) { doc.addPage(); paintBg(); y = 60; }
    doc.setTextColor(ACCENT);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("INSPECTION CHECKLIST", 40, y);
    y += 8;
    autoTable(doc, {
      startY: y,
      head: [["Area", "Check"]],
      body: Object.entries(checklist).flatMap(([area, items]) =>
        items.map((it, idx) => [idx === 0 ? area : "", it])
      ),
      ...tableTheme,
      didDrawPage: () => paintBg(),
    });
    y = (doc as any).lastAutoTable.finalY + 20;

    // Recalls
    if (recalls.length) {
      if (y > pageH - 120) { doc.addPage(); paintBg(); y = 60; }
      doc.setTextColor(ACCENT);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("RECALLS", 40, y);
      y += 8;
      autoTable(doc, {
        startY: y,
        head: [["Date", "Component", "Status"]],
        body: recalls.map((r) => [r.date, r.component, r.status]),
        ...tableTheme,
        didDrawPage: () => paintBg(),
      });
      y = (doc as any).lastAutoTable.finalY + 20;
    }

    // Footer on every page
    const total = doc.getNumberOfPages();
    for (let p = 1; p <= total; p++) {
      doc.setPage(p);
      doc.setTextColor(MUTED);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(
        "Generated by Idle Check · Always verify with a licensed mechanic",
        pageW / 2,
        pageH - 24,
        { align: "center" }
      );
      doc.text(`${p} / ${total}`, pageW - 40, pageH - 24, { align: "right" });
    }

    const fname = `idle-check-${(vehicleName || "report").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`;
    doc.save(fname);
  };

  const navItems = [
    { id: "verdict", label: "Verdict" },
    { id: "issues", label: "Issues" },
    { id: "negotiation", label: "Negotiation" },
    { id: "recalls", label: "Recalls" },
  ];

  return (
    <>
      {/* Fixed scroll progress bar (top) */}
      <div
        className="fixed left-0 right-0 top-0 z-50 h-[3px] bg-transparent"
        aria-hidden
      >
        <div
          className="h-full origin-left bg-gradient-to-r from-primary/70 to-primary shadow-[0_0_12px_rgba(220,38,38,0.6)] transition-[width] duration-150 ease-out"
          style={{ width: `${scrollProgress * 100}%` }}
        />
      </div>

      {/* Fixed left sidebar (desktop only) */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[200px] border-r border-border bg-card lg:block">
        {/* Vertical progress bar on left edge */}
        <div className="absolute left-0 top-0 h-full w-[3px] bg-transparent" aria-hidden>
          <div
            className="w-full bg-primary shadow-[0_0_12px_rgba(220,38,38,0.5)] transition-[height] duration-150 ease-out"
            style={{ height: `${scrollProgress * 100}%` }}
          />
        </div>
        <div className="flex h-full flex-col px-5 py-6">
          <div className="font-condensed text-sm font-bold uppercase tracking-[0.18em] text-primary">
            IDLE CHECK
          </div>
          <nav className="mt-10 flex flex-col gap-1">
            {navItems.map((item) => {
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`flex items-center border-l-2 py-2 pl-3 text-left font-condensed text-[12px] font-semibold uppercase tracking-[0.14em] transition-colors ${
                    active
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      <div className="lg:pl-[200px]">
      <section className="view-fade-in relative z-10 mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        {/* Status bar */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-condensed text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Full Report Unlocked
              </div>
              <div className="mt-1 text-base font-bold sm:text-lg">
                {vehicleName}
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
                onClick={exportPdf}
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 border-border font-condensed text-xs font-semibold uppercase tracking-wider hover:border-primary hover:text-primary"
              >
                <FileDown className="h-3.5 w-3.5" />
                Export PDF
              </Button>
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

        {/* Verdict */}
        <RecommendationCard recommendation={safeRecommendation} issues={issues} />

        {/* Market value */}
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

        {/* Red flags */}
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

        {/* Checklist + Budget sidebar */}
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
          <aside className="lg:sticky lg:top-6 lg:self-start">
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

        {/* Negotiation */}
        <div className="mx-auto w-full max-w-3xl">
          <NegotiationScript
            vehicle={vehicle}
            askingPrice={displayPrice}
            checkedIssues={checkedIssues}
            repairTotal={grandTotal}
            suggestedOffer={suggestedOffer}
          />
        </div>

        {/* Recalls */}
        <div>
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
        </div>
      </section>
    </>
  );
}
