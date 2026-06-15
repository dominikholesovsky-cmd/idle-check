import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, TrendingUp, Shield, ShieldCheck, FileDown, Share2, Check, X, Mail, Link } from "lucide-react";
import { HelpTooltip } from "./HelpTooltip";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { InspectionChecklist } from "./InspectionChecklist";
import { RepairCostTracker } from "./RepairCostTracker";
import { NegotiationScript } from "./NegotiationScript";
import { RecallSection } from "./RecallSection";
import { RecommendationCard, MaintenanceRoadmap } from "./RecommendationCard";
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
    const MARGIN = 48;
    const CONTENT_W = pageW - MARGIN * 2;
    const ACCENT = "#b22222";
    const TEXT = "#111111";
    const MUTED = "#6b7280";
    const LIGHT = "#f5f5f5";
    const BORDER = "#e0e0e0";

    const tableTheme = {
      headStyles: { fillColor: [178, 34, 34] as [number,number,number], textColor: [255,255,255] as [number,number,number], fontStyle: "bold" as const, fontSize: 9 },
      bodyStyles: { fillColor: [255,255,255] as [number,number,number], textColor: [17,17,17] as [number,number,number] },
      alternateRowStyles: { fillColor: [249,249,249] as [number,number,number] },
      styles: { font: "helvetica", fontSize: 9, cellPadding: 7, lineColor: [224,224,224] as [number,number,number], lineWidth: 0.3 },
      margin: { left: MARGIN, right: MARGIN },
      tableLineColor: [224,224,224] as [number,number,number],
      tableLineWidth: 0.3,
    };

    const sectionHeading = (label: string, y: number) => {
      doc.setTextColor(ACCENT);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.text(label, MARGIN, y);
      doc.setDrawColor(ACCENT);
      doc.setLineWidth(0.5);
      doc.line(MARGIN, y + 3, pageW - MARGIN, y + 3);
      return y + 16;
    };

    const ensureSpace = (needed: number, currentY: number): number => {
      if (currentY + needed > pageH - 60) { doc.addPage(); return 56; }
      return currentY;
    };

    // ── HEADER BLOCK ──────────────────────────────────────────────
    // Red top bar
    doc.setFillColor(178, 34, 34);
    doc.rect(0, 0, pageW, 6, "F");

    // Logo
    doc.setTextColor(ACCENT);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("IDLE // CHECK", MARGIN, 38);

    // Report label
    doc.setTextColor(MUTED);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Pre-Purchase Inspection Report", MARGIN, 52);

    // Date right-aligned
    const dateStr = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    doc.text(dateStr, pageW - MARGIN, 38, { align: "right" });

    // Divider
    doc.setDrawColor(...([220,220,220] as [number,number,number]));
    doc.setLineWidth(0.5);
    doc.line(MARGIN, 62, pageW - MARGIN, 62);

    // Vehicle info grid
    const infoY = 80;
    doc.setTextColor(MUTED);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");

    const infoItems: [string, string][] = [
      ["VEHICLE", vehicleName || "—"],
      ["MILEAGE", mileageStr || "—"],
      ["ASKING PRICE", displayPrice ? `$${displayPrice.toLocaleString()}` : "—"],
      ["MARKETPLACE", marketplace || "—"],
      ...(vehicle.vin ? [["VIN", vehicle.vin] as [string,string]] : []),
    ];
    const colW = CONTENT_W / Math.min(infoItems.length, 4);
    infoItems.forEach((item, idx) => {
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      const x = MARGIN + col * colW;
      const y = infoY + row * 30;
      doc.setTextColor(MUTED);
      doc.setFontSize(7);
      doc.text(item[0], x, y);
      doc.setTextColor(TEXT);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(item[1], x, y + 12);
      doc.setFont("helvetica", "normal");
    });

    // Second divider
    const afterHeaderY = infoItems.length > 4 ? infoY + 60 : infoY + 32;
    doc.setDrawColor(...([220,220,220] as [number,number,number]));
    doc.setLineWidth(0.5);
    doc.line(MARGIN, afterHeaderY, pageW - MARGIN, afterHeaderY);

    // ── VERDICT ───────────────────────────────────────────────────
    let y = afterHeaderY + 20;
    y = sectionHeading("VERDICT", y);
    y += 4;

    // Verdict badge
    const verdictLabel = safeRecommendation.verdict?.toUpperCase() || "—";
    const badgeColors: Record<string, [number,number,number]> = {
      "BUY": [22,163,74], "NEGOTIATE": [234,88,12], "SKIP": [185,28,28], "CAUTION": [161,98,7],
    };
    const badgeColor = badgeColors[verdictLabel] ?? [107,114,128];
    doc.setFillColor(...badgeColor);
    doc.roundedRect(MARGIN, y, 72, 18, 3, 3, "F");
    doc.setTextColor(255,255,255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(verdictLabel, MARGIN + 36, y + 12, { align: "center" });

    y += 28;
    doc.setTextColor(TEXT);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    const headlineLines = doc.splitTextToSize(safeRecommendation.headline || "", CONTENT_W);
    doc.text(headlineLines, MARGIN, y);
    y += headlineLines.length * 15 + 6;

    doc.setTextColor(MUTED);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    const summaryLines = doc.splitTextToSize(safeRecommendation.summary || "", CONTENT_W);
    doc.text(summaryLines, MARGIN, y);
    y += summaryLines.length * 13 + 20;

    // ── DETECTED ISSUES ───────────────────────────────────────────
    if (issues.length) {
      y = ensureSpace(60, y);
      y = sectionHeading("DETECTED ISSUES", y);
      const URGENCY_ORDER: Record<string, number> = { Immediate: 0, Soon: 1, Monitor: 2 };
      const sortedIssues = [...issues].sort(
        (a, b) => (URGENCY_ORDER[a.urgency] ?? 3) - (URGENCY_ORDER[b.urgency] ?? 3)
      );
      const drawCheckbox = (data: any) => {
        if (data.column.index === 0 && data.section === "body") {
          const cx = data.cell.x + (data.cell.width - 5) / 2;
          const cy = data.cell.y + (data.cell.height - 5) / 2;
          doc.setDrawColor(100, 100, 100);
          doc.setLineWidth(0.5);
          doc.rect(cx, cy, 5, 5);
        }
      };

      // col widths: Check(16) + #(18) + Issue(auto) + Category(70) + Severity(44) + Urgency(54) + Parts Cost(84) + Labor(38)
      autoTable(doc, {
        startY: y,
        head: [["", "#", "Issue", "Category", "Severity", "Urgency", "Parts Cost", "Labor (h)"]],
        body: sortedIssues.map((i, idx) => [
          "",   // drawn via didDrawCell
          idx + 1,
          i.label,
          i.category,
          i.severity,
          i.urgency,
          `$${i.partsCostMin.toLocaleString()} – $${i.partsCostMax.toLocaleString()}`,
          `${i.labourHours}h`,
        ]),
        columnStyles: {
          0: { cellWidth: 16, halign: "center" as const },
          1: { cellWidth: 18, halign: "center" as const },
          2: { cellWidth: "auto" as const },
          3: { cellWidth: 70 },
          4: { cellWidth: 44, halign: "center" as const },
          5: { cellWidth: 54 },
          6: { cellWidth: 84, halign: "right" as const },
          7: { cellWidth: 38, halign: "right" as const },
        },
        didDrawCell: drawCheckbox,
        ...tableTheme,
        styles: { ...tableTheme.styles, fontSize: 8.5, cellPadding: 5 },
      });
      y = (doc as any).lastAutoTable.finalY + 20;

      // ── PHYSICAL INSPECTION CHECKLIST ─────────────────────────────
      y = ensureSpace(60, y);
      y = sectionHeading("PHYSICAL INSPECTION CHECKLIST", y);
      doc.setTextColor(MUTED);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("Print this page and check items off during your in-person inspection.", MARGIN, y);
      y += 14;

      const truncateWords = (text: string, maxChars: number) => {
        if (text.length <= maxChars) return text;
        const cut = text.slice(0, maxChars).split(" ");
        cut.pop(); // remove partial word
        return cut.join(" ") + "...";
      };

      // col widths: checkbox(16) + text(auto fills remaining) + notes(72)
      autoTable(doc, {
        startY: y,
        head: [["", "What to Check", "Notes"]],
        body: sortedIssues.map((i) => {
          const label = i.label;
          const note = i.explanation ? truncateWords(i.explanation, 120) : "";
          return ["", note ? `${label}\n${note}` : label, ""];
        }),
        columnStyles: {
          0: { cellWidth: 16, halign: "center" as const },
          1: { cellWidth: "auto" as const, overflow: "linebreak" as const, fontSize: 7.5 },
          2: { cellWidth: 72 },
        },
        headStyles: { ...tableTheme.headStyles, fillColor: [60,60,60] as [number,number,number] },
        styles: { ...tableTheme.styles, fontSize: 8, cellPadding: 5 },
        bodyStyles: { ...tableTheme.bodyStyles, minCellHeight: 22 },
        didDrawCell: drawCheckbox,
        margin: { left: MARGIN, right: MARGIN },
      });
      y = (doc as any).lastAutoTable.finalY + 20;
    }

    // ── MAINTENANCE ROADMAP ───────────────────────────────────────
    const urgencyGroups: Record<string, typeof issues> = { Immediate: [], Soon: [], Monitor: [] };
    issues.forEach((i) => { (urgencyGroups[i.urgency] ??= []).push(i); });
    const hasRoadmap = Object.values(urgencyGroups).some((g) => g.length > 0);
    if (hasRoadmap) {
      y = ensureSpace(80, y);
      y = sectionHeading("MAINTENANCE ROADMAP", y);
      const roadmapRows: string[][] = [];
      const urgencyColors: Record<string, [number,number,number]> = {
        Immediate: [185,28,28], Soon: [161,98,7], Monitor: [37,99,235],
      };
      (["Immediate","Soon","Monitor"] as const).forEach((urgency) => {
        const group = urgencyGroups[urgency];
        if (!group?.length) return;
        group.forEach((i, idx) => {
          roadmapRows.push([idx === 0 ? urgency : "", i.label, i.category,
            `$${i.partsCostMin.toLocaleString()} – $${i.partsCostMax.toLocaleString()}`]);
        });
      });
      autoTable(doc, {
        startY: y,
        head: [["Priority", "Item", "Category", "Estimated Cost"]],
        body: roadmapRows,
        columnStyles: {
          0: { cellWidth: 62, fontStyle: "bold" as const },
          3: { cellWidth: 90, halign: "right" as const },
        },
        didDrawCell: (data) => {
          if (data.column.index === 0 && data.section === "body" && data.cell.text[0]) {
            const color = urgencyColors[data.cell.text[0] as string] ?? [107,114,128];
            doc.setTextColor(...color);
          }
        },
        ...tableTheme,
      });
      y = (doc as any).lastAutoTable.finalY + 20;
    }

    // ── RED FLAGS ─────────────────────────────────────────────────
    if (hasRedFlags) {
      y = ensureSpace(60, y);
      y = sectionHeading("SELLER RED FLAGS", y);
      sellerRedFlags!.forEach((flag) => {
        const lines = doc.splitTextToSize(`• ${flag}`, CONTENT_W);
        y = ensureSpace(lines.length * 13, y);
        doc.setTextColor(TEXT);
        doc.setFontSize(9.5);
        doc.setFont("helvetica", "normal");
        doc.text(lines, MARGIN, y);
        y += lines.length * 13 + 3;
      });
      y += 14;
    }

    // ── MARKET VALUE ──────────────────────────────────────────────
    if (hasMarketNote) {
      y = ensureSpace(60, y);
      y = sectionHeading("MARKET VALUE", y);
      doc.setTextColor(TEXT);
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "normal");
      const mvLines = doc.splitTextToSize(marketValueNote!, CONTENT_W);
      doc.text(mvLines, MARGIN, y);
      y += mvLines.length * 13 + 20;
    }

    // ── NHTSA RECALLS ─────────────────────────────────────────────
    if (recalls.length) {
      y = ensureSpace(80, y);
      y = sectionHeading("NHTSA RECALLS", y);
      autoTable(doc, {
        startY: y,
        head: [["Date", "Component", "Consequence", "Status"]],
        body: recalls.map((r) => [r.date || "—", r.component || "—", (r as any).consequence || "—", r.status || "—"]),
        columnStyles: { 2: { cellWidth: 180 } },
        ...tableTheme,
      });
      y = (doc as any).lastAutoTable.finalY + 20;
    }

    // ── NEGOTIATION SCRIPT ────────────────────────────────────────
    y = ensureSpace(100, y);
    y = sectionHeading("NEGOTIATION SCRIPT", y);
    const repairRounded = Math.round(grandTotal / 100) * 100;
    const offerRounded = Math.round(suggestedOffer / 100) * 100;
    const yearStr2 = vehicle.year ? `${vehicle.year} ` : "";
    const modelStr = `${yearStr2}${vehicle.make} ${vehicle.model}`.trim();
    const issueNames = issues.map((i) => i.label.toLowerCase());
    const issuesSentence = issues.length === 0 ? ""
      : issues.length === 1 ? issueNames[0]
      : issues.length === 2 ? `${issueNames[0]} and ${issueNames[1]}`
      : `${issueNames.slice(0, -1).join(", ")}, and ${issueNames[issueNames.length - 1]}`;
    const opener = `Hey! I came across your ${modelStr} listing and I've actually been looking at a few of these.`;
    const middle = issues.length > 0
      ? `I did some research before reaching out — at this mileage, ${issuesSentence} are pretty common on these. Getting those sorted would run around $${repairRounded.toLocaleString()} at a shop.`
      : `I did some research before reaching out and the listing looks solid on paper.`;
    const close = issues.length > 0
      ? `I'd be comfortable at $${offerRounded.toLocaleString()} cash. Would that work for you? Happy to come take a look this week if so.`
      : `I'd be comfortable at $${Math.round(displayPrice / 100) * 100} cash. Would that work for you? Happy to come take a look this week if so.`;
    const script = `${opener}\n\n${middle}\n\n${close}`;
    const BOX_PAD = 10;
    const scriptMaxW = CONTENT_W - BOX_PAD * 2;
    const scriptLines = doc.splitTextToSize(script, scriptMaxW);
    const lineH = 12;
    const boxH = scriptLines.length * lineH + BOX_PAD * 2;
    y = ensureSpace(boxH + 20, y);
    // Script box
    doc.setFillColor(...([249,249,249] as [number,number,number]));
    doc.setDrawColor(...([224,224,224] as [number,number,number]));
    doc.setLineWidth(0.5);
    doc.roundedRect(MARGIN, y - BOX_PAD, CONTENT_W, boxH, 4, 4, "FD");
    doc.setTextColor(TEXT);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(scriptLines, MARGIN + BOX_PAD, y + 2);
    y += boxH + 6;

    // Suggested offer line
    doc.setTextColor(MUTED);
    doc.setFontSize(8.5);
    doc.text(`Suggested opening offer: `, MARGIN, y);
    doc.setTextColor(TEXT);
    doc.setFont("helvetica", "bold");
    doc.text(`$${offerRounded.toLocaleString()}`, MARGIN + 120, y);

    // ── FOOTER ON EVERY PAGE ──────────────────────────────────────
    const total = doc.getNumberOfPages();
    for (let p = 1; p <= total; p++) {
      doc.setPage(p);
      doc.setFillColor(...([248,248,248] as [number,number,number]));
      doc.rect(0, pageH - 36, pageW, 36, "F");
      doc.setDrawColor(...([220,220,220] as [number,number,number]));
      doc.setLineWidth(0.5);
      doc.line(0, pageH - 36, pageW, pageH - 36);
      doc.setTextColor(MUTED);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.text(
        "Generated by Idle Check · idle-check.com · For informational purposes only. Always verify with a licensed mechanic.",
        pageW / 2, pageH - 18, { align: "center" }
      );
      doc.text(`${p} / ${total}`, pageW - MARGIN, pageH - 18, { align: "right" });
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
        <section className="view-fade-in relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">

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

          {/* Verdict — full width */}
          <div id="section-verdict" className="mb-6">
            <RecommendationCard recommendation={safeRecommendation} />
          </div>

          {/* Two-column grid: main content + sidebar */}
          <div className="grid gap-6 lg:grid-cols-3">

            {/* ── Main column ── */}
            <div className="space-y-6 lg:col-span-2">

              {/* Roadmap + Market Value + Red Flags */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
                <div className="mb-4 flex items-center gap-1.5">
                  <h3 className="font-condensed text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    Maintenance Roadmap
                  </h3>
                  <HelpTooltip text="Items grouped by urgency based on this vehicle's condition" />
                </div>
                <MaintenanceRoadmap recommendation={safeRecommendation} issues={issues} />

                {hasMarketNote && (
                  <div className="mt-5 border-t border-gray-100 pt-5">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                      <div>
                        <span className="flex items-center gap-1.5 font-condensed text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                          Market Value
                          <HelpTooltip text="Estimated fair price based on this vehicle's age, mileage, and condition" />
                        </span>
                        <p className="mt-0.5 text-[13px] leading-relaxed text-zinc-900">{marketValueNote}</p>
                      </div>
                    </div>
                  </div>
                )}

                {hasRedFlags && (
                  <div className="mt-5 border-t border-gray-100 pt-5">
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
              </div>

              {/* Inspection Checklist */}
              <div id="section-issues" className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <h2 className="font-condensed text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                      Inspection Checklist
                    </h2>
                    <HelpTooltip text="Check items during your in-person inspection to build a custom repair budget" />
                  </span>
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

            </div>

            {/* ── Sidebar ── */}
            <aside className="space-y-6 lg:col-span-1 lg:sticky lg:top-20 lg:self-start">

              {/* Repair Budget */}
              <RepairCostTracker
                issues={issues}
                checked={checked}
                askingPrice={displayPrice}
              />

              {/* Negotiation Script */}
              <div id="section-negotiation">
                <NegotiationScript
                  vehicle={vehicle}
                  askingPrice={displayPrice}
                  checkedIssues={checkedIssues}
                  repairTotal={grandTotal}
                  suggestedOffer={suggestedOffer}
                />
              </div>

              <p className="px-1 text-[11px] text-zinc-500">
                Tip: tick checklist items to update the repair budget and negotiation offer.
              </p>

            </aside>
          </div>

          {/* Recalls — full width */}
          <div id="section-recalls" className="mt-6">
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