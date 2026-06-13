import { useEffect, useMemo, useState } from "react";
import { PlusCircle, AlertTriangle, TrendingUp, Shield, ShieldCheck, FileDown, Share2, Check, X, Mail, Link } from "lucide-react";
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
  shareId, isSharedView, isDemo,
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
  shareId?: string;
  isSharedView?: boolean;
  isDemo?: boolean;
}) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState<string>("verdict");
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedInsta, setCopiedInsta] = useState(false);

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
      <div className="p-8 text-center text-zinc-500">
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
    : { label: "Estimated recall data", Icon: Shield, color: "text-zinc-400" };

  const exportPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const ACCENT = "#b22222";
    const TEXT = "#111111";
    const MUTED = "#6b7280";

    const tableTheme = {
      headStyles: { fillColor: ACCENT, textColor: "#ffffff", fontStyle: "bold" as const },
      bodyStyles: { fillColor: "#f9f9f9", textColor: TEXT },
      alternateRowStyles: { fillColor: "#f3f3f3" },
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 6,
        lineColor: "#e5e5e5" as unknown as number,
        lineWidth: 0.3,
        textColor: TEXT,
      },
      margin: { left: 40, right: 40 },
    };

    // Header
    doc.setTextColor(ACCENT);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("IDLE // CHECK REPORT", 40, 60);

    doc.setTextColor(TEXT);
    doc.setFontSize(14);
    doc.text(vehicleName || "Vehicle Report", 40, 84);

    doc.setTextColor(MUTED);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const dateStr = new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
    doc.text(
      `${dateStr}${mileageStr ? ` · ${mileageStr}` : ""} · Asked on ${marketplace || "Unknown"} · $${displayPrice.toLocaleString()}`,
      40, 102
    );

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

    doc.setTextColor(TEXT);
    doc.setFontSize(13);
    const headlineLines = doc.splitTextToSize(safeRecommendation.headline || "", pageW - 80);
    doc.text(headlineLines, 40, y);
    y += headlineLines.length * 16 + 6;

    doc.setTextColor(MUTED);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const summaryLines = doc.splitTextToSize(safeRecommendation.summary || "", pageW - 80);
    doc.text(summaryLines, 40, y);
    y += summaryLines.length * 13 + 20;

    // Issues table
    if (issues.length) {
      doc.setTextColor(ACCENT);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("DETECTED ISSUES", 40, y);
      y += 8;
      autoTable(doc, {
        startY: y,
        head: [["Issue", "Severity", "Cost Range"]],
        body: issues.map((i) => [
          i.label,
          i.severity,
          `$${i.costMin.toLocaleString()} – $${i.costMax.toLocaleString()}`,
        ]),
        ...tableTheme,
      });
      y = (doc as any).lastAutoTable.finalY + 24;
    }

    // Red Flags
    if (hasRedFlags) {
      if (y > pageH - 120) { doc.addPage(); y = 60; }
      doc.setTextColor(ACCENT);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("SELLER RED FLAGS", 40, y);
      y += 16;
      doc.setTextColor(TEXT);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      sellerRedFlags!.forEach((flag) => {
        const lines = doc.splitTextToSize(`• ${flag}`, pageW - 80);
        if (y + lines.length * 13 > pageH - 60) { doc.addPage(); y = 60; }
        doc.text(lines, 40, y);
        y += lines.length * 13 + 4;
      });
      y += 16;
    }

    // Market value note
    if (hasMarketNote) {
      if (y > pageH - 80) { doc.addPage(); y = 60; }
      doc.setTextColor(ACCENT);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("MARKET VALUE", 40, y);
      y += 16;
      doc.setTextColor(TEXT);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const mvLines = doc.splitTextToSize(marketValueNote!, pageW - 80);
      doc.text(mvLines, 40, y);
      y += mvLines.length * 13 + 20;
    }

    // Inspection checklist
    const checklist: Record<string, string[]> = {
      "Exterior": ["Paint consistency & overspray", "Panel gaps even on all sides", "Rust on rocker panels & wheel arches", "Tire tread & uneven wear", "Windshield chips / cracks"],
      "Under Hood": ["Oil level & color (not milky)", "Coolant level & color", "Belt cracks & tension", "Battery terminals clean", "No fluid leaks on engine block"],
      "Interior": ["Warning lights on ignition", "AC blows cold within 30s", "All windows / locks / mirrors", "Seat wear vs claimed mileage", "Odors: smoke, mildew, fuel"],
      "Test Drive": ["Cold start without rough idle", "Smooth acceleration through gears", "Brakes straight, no pulsing", "Steering centered, no pull", "No vibration at 60+ mph"],
      "Under Car": ["No fresh oil / coolant drips", "Exhaust intact, no rust holes", "CV boots not torn", "Suspension bushings not cracked", "Frame: no welds or kinks"],
    };
    if (y > pageH - 180) { doc.addPage(); y = 60; }
    doc.setTextColor(ACCENT);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("PRE-PURCHASE INSPECTION CHECKLIST", 40, y);
    y += 8;
    autoTable(doc, {
      startY: y,
      head: [["Area", "Check"]],
      body: Object.entries(checklist).flatMap(([area, items]) =>
        items.map((it, idx) => [idx === 0 ? area : "", it])
      ),
      ...tableTheme,
    });
    y = (doc as any).lastAutoTable.finalY + 24;

    // Recalls
    if (recalls.length) {
      if (y > pageH - 120) { doc.addPage(); y = 60; }
      doc.setTextColor(ACCENT);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("NHTSA RECALLS", 40, y);
      y += 8;
      autoTable(doc, {
        startY: y,
        head: [["Date", "Component", "Status"]],
        body: recalls.map((r) => [r.date, r.component, r.status]),
        ...tableTheme,
      });
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

  const shareUrl = shareId ? `${typeof window !== "undefined" ? window.location.origin : "https://idle-check.com"}/report/${shareId}` : "";

  return (
    <>
      {/* Fixed scroll progress bar */}
      <div className="fixed left-0 right-0 top-0 z-50 h-[3px] bg-transparent" aria-hidden>
        <div
          className="h-full origin-left bg-gradient-to-r from-primary/70 to-primary shadow-[0_0_12px_rgba(220,38,38,0.6)] transition-[width] duration-150 ease-out"
          style={{ width: `${scrollProgress * 100}%` }}
        />
      </div>

      {/* Fixed left sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[200px] border-r border-gray-200 bg-[#f5f4f0] lg:block">
        <div className="absolute left-0 top-0 h-full w-[3px] bg-transparent" aria-hidden>
          <div
            className="w-full bg-primary shadow-[0_0_12px_rgba(220,38,38,0.5)] transition-[height] duration-150 ease-out"
            style={{ height: `${scrollProgress * 100}%` }}
          />
        </div>
        <div className="flex h-full flex-col px-5 py-6">
          <button
            type="button"
            onClick={onNewReport}
            className="font-condensed text-sm font-bold uppercase tracking-[0.18em] text-primary transition-opacity hover:opacity-70"
          >
            IDLE CHECK
          </button>
          <nav className="mt-10 flex flex-col gap-1">
            {navItems.map((item) => {
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`flex items-center border-l-2 py-2 pl-3 text-left font-condensed text-[12px] font-semibold uppercase tracking-[0.14em] transition-colors ${
                    active
                      ? "border-red-700 text-red-700"
                      : "border-transparent text-zinc-600 hover:text-zinc-900"
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
          <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-condensed text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    Full Report Unlocked
                  </span>
                  {isDemo && (
                    <span className="rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-zinc-400">
                      Demo
                    </span>
                  )}
                </div>
                <div className="mt-1 text-base font-bold text-zinc-900 sm:text-lg">
                  {vehicleName}
                  {vehicle.engineType && (
                    <span className="ml-2 font-condensed text-[13px] font-normal text-zinc-500">
                      {vehicle.engineType}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-[12px] text-zinc-500">
                  {mileageStr && <>{mileageStr} · </>}Asked on {marketplace || "Unknown"}
                  {vehicle.vin && <span className="ml-2 font-mono text-[11px]">VIN: {vehicle.vin}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="font-condensed text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    Asking Price
                  </div>
                  <div className="font-mono text-xl font-bold tabular-nums text-zinc-900">
                    ${displayPrice.toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {shareId && (
                    <Button
                      onClick={() => setShowShareModal(true)}
                      variant="outline"
                      size="sm"
                      className="h-9 gap-1.5 border-gray-200 font-condensed text-xs font-semibold uppercase tracking-wider hover:border-primary hover:text-primary"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      Share
                    </Button>
                  )}
                  <Button
                    onClick={exportPdf}
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5 border-gray-200 font-condensed text-xs font-semibold uppercase tracking-wider hover:border-primary hover:text-primary"
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    Export PDF
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Verdict */}
          <div id="section-verdict">
            <RecommendationCard recommendation={safeRecommendation} issues={issues} />
          </div>

          {/* Market value */}
          {hasMarketNote && (
            <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
              <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
              <div>
                <span className="font-condensed text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Market Value
                </span>
                <p className="mt-0.5 text-[13px] leading-relaxed text-zinc-900">{marketValueNote}</p>
              </div>
            </div>
          )}

          {/* Red flags */}
          {hasRedFlags && (
            <div className="rounded-xl border border-gray-200 border-l-4 border-l-red-700 bg-white p-4 sm:p-5">
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
                    <span className="text-[13px] leading-relaxed text-zinc-900">{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Checklist + Budget */}
          <div id="section-issues" className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-condensed text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Inspection Checklist
                </h2>
                {recommendedIds.size > 0 && (
                  <span className="font-condensed text-[11px] text-zinc-500">
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
              <p className="mt-2 px-1 text-[11px] text-zinc-500">
                Tip: click a category to expand. Tick items to update the budget.
              </p>
            </aside>
          </div>

          {/* Negotiation */}
          <div id="section-negotiation" className="mx-auto w-full max-w-3xl">
            <NegotiationScript
              vehicle={vehicle}
              askingPrice={displayPrice}
              checkedIssues={checkedIssues}
              repairTotal={grandTotal}
              suggestedOffer={suggestedOffer}
            />
          </div>

          {/* Recalls */}
          <div id="section-recalls">
            <div className="mb-3 flex items-center gap-2">
              <recallBadge.Icon className={`h-3.5 w-3.5 ${recallBadge.color}`} />
              <span className={`font-condensed text-[10px] font-semibold uppercase tracking-wider ${recallBadge.color}`}>
                {recallBadge.label}
              </span>
            </div>
            {recalls.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-zinc-500">
                No recall records found for this vehicle.
              </div>
            ) : (
              <RecallSection recalls={recalls} />
            )}
          </div>

        </section>
      </div>

      {/* Share modal */}
      {showShareModal && shareId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-gray-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <p className="font-condensed text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Share Report</p>
                <p className="mt-0.5 text-sm font-semibold text-zinc-900">{vehicleName}</p>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-gray-100 hover:text-zinc-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Options */}
            <div className="space-y-2 p-4">

              {/* Copy link */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl).then(() => {
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  });
                }}
                className="flex w-full items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-gray-50"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                  {copiedLink ? <Check className="h-4 w-4 text-emerald-500" /> : <Link className="h-4 w-4 text-primary" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{copiedLink ? "Copied!" : "Copy link"}</p>
                  <p className="text-[11px] text-zinc-500">Share via any app or message</p>
                </div>
              </button>

              {/* Email */}
              <a
                href={`mailto:?subject=${encodeURIComponent("Check this car — Idle Check report")}&body=${encodeURIComponent(`I ran this listing through Idle Check and thought you'd want to see the results:\n\n${shareUrl}`)}`}
                className="flex w-full items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-gray-50"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Email</p>
                  <p className="text-[11px] text-zinc-500">Opens your email app</p>
                </div>
              </a>

              {/* Copy for Instagram */}
              <button
                onClick={() => {
                  const text = `Check out this car inspection 👉 ${shareUrl}`;
                  navigator.clipboard.writeText(text).then(() => {
                    setCopiedInsta(true);
                    setTimeout(() => setCopiedInsta(false), 2000);
                  });
                }}
                className="flex w-full items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-gray-50"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                  {copiedInsta
                    ? <Check className="h-4 w-4 text-emerald-500" />
                    : <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                  }
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{copiedInsta ? "Copied!" : "Copy for Instagram"}</p>
                  <p className="text-[11px] text-zinc-500">Paste into DM or story caption</p>
                </div>
              </button>

            </div>
          </div>
        </div>
      )}
    </>
  );
}