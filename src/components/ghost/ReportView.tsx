import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, FileDown, Flag, Share2, Check, X, Mail, Link } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { RepairCostTracker } from "./RepairCostTracker";
import { NegotiationScript, CopyMessageButton, buildNegotiationScript } from "./NegotiationScript";
import { RecallSection } from "./RecallSection";
import { RecommendationCard } from "./RecommendationCard";
import { PriceRuler } from "./PriceRuler";
import { FindingsCar } from "./FindingsCar";
import { FindingsList } from "./FindingsList";
import { generateRecommendation } from "@/lib/ghost/procedural";
import { assignPins, bodyStyleFor, computeOffer, sortFindings } from "@/lib/ghost/report";
import type { Issue, Recall, ReportRecommendation, Vehicle } from "@/lib/ghost/types";

function usd(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

// HIGH-severity findings start ticked, so the budget and offer are not $0 on first view.
function defaultChecked(issues: Issue[]): Set<string> {
  return new Set(issues.filter((i) => i.severity === "HIGH").map((i) => i.id));
}

const ACTION_BTN =
  "inline-flex h-11 w-11 items-center justify-center gap-2 rounded-lg border border-card-border bg-white font-condensed text-sm font-semibold uppercase tracking-[0.06em] text-ink transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:w-auto lg:px-4";

export function ReportView({
  vehicle, marketplace, askingPrice, issues = [], recalls = [],
  recommendation, onNewReport,
  sellerRedFlags, marketValueNote, marketValueLow, marketValueHigh, recallSource,
  shareId, isSharedView, isDemo, saveError, onRetrySave, savedToEmail,
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
  marketValueLow?: number;
  marketValueHigh?: number;
  recallSource?: "vin" | "nhtsa" | "procedural" | "none";
  shareId?: string;
  isSharedView?: boolean;
  isDemo?: boolean;
  saveError?: boolean;
  onRetrySave?: () => void;
  /** True when the report is saved under an email. The address itself is never shown here. */
  savedToEmail?: boolean;
}) {
  const [checked, setChecked] = useState<Set<string>>(() => defaultChecked(issues));
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedInsta, setCopiedInsta] = useState(false);
  // Shared by the car pins and the list rows (hover, focus or tap).
  const [activeFinding, setActiveFinding] = useState<number | null>(null);
  const [jump, setJump] = useState<{ n: number; nonce: number } | null>(null);
  const jumpTo = (n: number) => setJump({ n, nonce: Date.now() });

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

  // Findings in display order (HIGH, MED, LOW). The position is the finding number.
  const sortedIssues = useMemo(() => sortFindings(Array.isArray(issues) ? issues : []), [issues]);

  // Re-tick the HIGH findings whenever the set of findings changes
  const issuesKey = sortedIssues.map((i) => i.id).join("|");
  useEffect(() => {
    setChecked(defaultChecked(sortedIssues));
  }, [issuesKey]);

  const checkedIssues = useMemo(
    () => sortedIssues.filter((i) => checked.has(i.id)),
    [sortedIssues, checked],
  );

  // One offer calculation for the whole report
  const { partsTotal, repairTotal, suggestedOffer } = computeOffer(checkedIssues, askingPrice || 0);

  const pins = useMemo(
    () => assignPins(sortedIssues, bodyStyleFor({ model: vehicle?.model ?? "" })),
    [sortedIssues, vehicle?.model],
  );

  const safeRecommendation = useMemo(() => {
    if (recommendation && recommendation.verdict) return recommendation;
    return generateRecommendation(vehicle, issues, askingPrice);
  }, [recommendation, vehicle, issues, askingPrice]);

  if (!vehicle) {
    return (
      <div className="p-8 text-center text-muted-text">
        Loading vehicle data...
      </div>
    );
  }

  const yearStr = vehicle.year ? `${vehicle.year} ` : "";
  const trimStr = vehicle.trim ? ` (${vehicle.trim})` : "";
  const mileageStr = vehicle.mileage != null ? `${vehicle.mileage.toLocaleString("en-US")} mi` : "";
  const displayPrice = askingPrice || 0;
  const hasRedFlags = Array.isArray(sellerRedFlags) && sellerRedFlags.length > 0;
  const hasMarketNote = marketValueNote && marketValueNote.trim().length > 0;
  const vehicleName = `${yearStr}${vehicle.make} ${vehicle.model}${trimStr}`.trim();

  const recallBadge =
    recallSource === "vin"
      ? { label: "Live NHTSA · VIN verified", verified: true }
      : recallSource === "nhtsa"
      ? { label: "Live NHTSA · Make/Model/Year", verified: true }
      : { label: "Estimated recall data", verified: false };

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
    const verdictKey = safeRecommendation.verdict?.toUpperCase() || "—";
    const verdictLabel = verdictKey === "WALKAWAY" ? "WALK AWAY" : verdictKey;
    const badgeColors: Record<string, [number,number,number]> = {
      "BUY": [29,107,67], "NEGOTIATE": [234,88,12], "WALKAWAY": [179,34,40],
    };
    const badgeColor = badgeColors[verdictKey] ?? [107,114,128];
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

      const firstSentence = (text: string): string => {
        const m = text.match(/^[^.!?]+[.!?]/);
        return m ? m[0].trim() : text;
      };

      // col widths: checkbox(16) + text(auto fills remaining) + notes(72)
      autoTable(doc, {
        startY: y,
        head: [["", "What to Check", "Notes"]],
        body: sortedIssues.map((i) => {
          const label = i.label;
          const note = i.explanation ? firstSentence(i.explanation) : "";
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
    const offerRounded = suggestedOffer;
    const yearStr2 = vehicle.year ? `${vehicle.year} ` : "";
    const modelStr = `${yearStr2}${vehicle.make} ${vehicle.model}`.trim();
    // Only include issues that have a real repair cost (costMin > 0 OR costMax > 0)
    const pricedIssues = issues.filter((i) => (i.partsCostMin > 0 || i.partsCostMax > 0));
    const pricedTotal = pricedIssues.reduce(
      (s, i) => s + Math.round(((i.partsCostMin + i.partsCostMax) / 2) + i.labourHours * 120), 0
    );
    const pricedRounded = Math.round(pricedTotal / 100) * 100;
    const issueNames = issues.map((i) => i.label.toLowerCase());
    const issuesSentence = issues.length === 0 ? ""
      : issues.length === 1 ? issueNames[0]
      : issues.length === 2 ? `${issueNames[0]} and ${issueNames[1]}`
      : `${issueNames.slice(0, -1).join(", ")}, and ${issueNames[issueNames.length - 1]}`;
    const opener = `Hey! I came across your ${modelStr} listing and I've actually been looking at a few of these.`;
    const middle = issues.length === 0
      ? `I did some research before reaching out and the listing looks solid on paper.`
      : pricedIssues.length > 0
      ? `I did some research before reaching out — at this mileage, ${issuesSentence} are pretty common on these. Getting those sorted would run around $${pricedRounded.toLocaleString()} at a shop.`
      : `I did some research before reaching out — at this mileage, ${issuesSentence} are worth having a mechanic look over before committing. Several items need professional inspection before I can commit to a price.`;
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

  const shareUrl = shareId ? `${typeof window !== "undefined" ? window.location.origin : "https://idle-check.com"}/report/${shareId}` : "";

  // Derived text for the offer and budget blocks
  const n = checkedIssues.length;
  const allHigh = n > 0 && checkedIssues.every((i) => i.severity === "HIGH");
  const tickedText = n === 0
    ? "No repairs ticked"
    : `${n} ${allHigh ? "high-priority " : ""}${n === 1 ? "repair" : "repairs"} ticked`;
  const script = buildNegotiationScript({
    vehicle, askingPrice: displayPrice, checkedIssues, repairTotal, suggestedOffer,
  });

  const marketplaceShown = marketplace && marketplace.trim().toLowerCase() !== "the listing" ? marketplace : "";
  const metaTop = [vehicle.engineType, mileageStr].filter(Boolean).join(" · ");
  const metaBottom = [marketplaceShown, `Asking ${usd(displayPrice)}`].filter(Boolean).join(" · ");

  const rulerProps = {
    offer: suggestedOffer,
    asking: displayPrice,
    marketLow: marketValueLow,
    marketHigh: marketValueHigh,
    note: hasMarketNote ? marketValueNote : undefined,
  };

  const offerHeader = (
    <>
      <div className="font-condensed text-sm font-bold uppercase tracking-[0.12em] text-text-2">Suggested cash offer</div>
      <div className="mt-1.5 font-mono text-[44px] font-bold leading-none text-primary" aria-live="polite">
        {usd(suggestedOffer)}
      </div>
      <p className="mt-2 text-sm text-muted-text">Asking {usd(displayPrice)} · {tickedText}</p>
    </>
  );

  const redFlags = hasRedFlags && (
    <section
      aria-label="Seller red flags"
      className="rounded-card border border-primary-tint-border bg-primary-tint p-[18px] lg:px-5 lg:py-[18px]"
    >
      <h2 className="font-condensed text-[15px] font-bold uppercase tracking-[0.12em] text-primary-ink">
        {sellerRedFlags!.length} seller red {sellerRedFlags!.length === 1 ? "flag" : "flags"}
      </h2>
      <ul className="mt-3 flex flex-col gap-3">
        {sellerRedFlags!.map((flag, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary-tint-border bg-white text-primary-ink">
              <Flag aria-hidden="true" className="h-3.5 w-3.5" />
            </span>
            <span className="pt-[3px] text-[15px] leading-[1.45] text-[#2b2b2a]">{flag}</span>
          </li>
        ))}
      </ul>
    </section>
  );

  return (
    <>
      {/* Fixed scroll progress bar */}
      <div className="fixed left-0 right-0 top-0 z-50 h-[3px] bg-transparent" aria-hidden>
        <div
          className="h-full origin-left bg-primary transition-[width] duration-150 ease-out motion-reduce:transition-none"
          style={{ width: `${scrollProgress * 100}%` }}
        />
      </div>

      <div
        className="relative z-10 min-h-screen text-ink"
        style={{
          backgroundColor: "#f5f4f0",
          backgroundImage: "radial-gradient(circle, #c8c4bc 0.8px, transparent 0.8px)",
          backgroundSize: "20px 20px",
        }}
      >
        <div className="mx-auto max-w-[1120px] px-4 pb-10 pt-[18px] lg:px-6 lg:pt-7">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-x-6">

            {/* Title block */}
            <header className="flex items-start justify-between gap-3 lg:col-span-2 lg:items-end lg:gap-8 lg:pb-1">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-[26px] items-center rounded-full border border-card-border bg-chip px-2.5 font-condensed text-xs font-bold uppercase tracking-[0.12em] text-primary">
                    Full report
                  </span>
                  {isDemo && (
                    <span className="rounded border border-card-border bg-white px-1.5 py-0.5 font-mono text-xs font-semibold uppercase tracking-wider text-muted-text">
                      Demo
                    </span>
                  )}
                </div>
                <h1 className="mt-3 font-condensed text-[34px] font-bold uppercase leading-none tracking-[0.01em] lg:text-5xl">
                  {vehicleName}
                </h1>
                <p className="mt-2 font-mono text-[13px] leading-[1.6] text-muted-text lg:hidden">
                  {metaTop && <>{metaTop}<br /></>}
                  {metaBottom}
                </p>
                <p className="mt-2.5 hidden font-mono text-sm text-muted-text lg:block">
                  {[vehicle.engineType, mileageStr, marketplaceShown].filter(Boolean).join(" · ")}
                </p>
                {vehicle.vin && (
                  <p className="mt-1 font-mono text-xs text-muted-text">VIN: {vehicle.vin}</p>
                )}
                {savedToEmail && (
                  <span className="mt-3 inline-flex h-7 items-center gap-1.5 rounded-full border border-success-border bg-success-bg px-3 text-[13px] font-semibold text-success">
                    <Mail aria-hidden="true" className="h-3.5 w-3.5" />
                    Saved to your email
                  </span>
                )}
              </div>

              <div className="flex shrink-0 flex-col items-end gap-3">
                <div className="flex gap-2">
                  {shareId && (
                    <button type="button" onClick={() => setShowShareModal(true)} aria-label="Share report" className={ACTION_BTN}>
                      <Share2 aria-hidden="true" className="h-[18px] w-[18px]" />
                      <span className="hidden lg:inline">Share</span>
                    </button>
                  )}
                  <button type="button" onClick={exportPdf} aria-label="Download PDF" className={ACTION_BTN}>
                    <FileDown aria-hidden="true" className="h-[18px] w-[18px]" />
                    <span className="hidden lg:inline">PDF</span>
                  </button>
                </div>
                <div className="hidden text-right lg:block">
                  <div className="font-condensed text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-text">Asking price</div>
                  <div className="mt-1 font-mono text-[28px] font-bold">{usd(displayPrice)}</div>
                </div>
              </div>
            </header>

            {saveError && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 lg:col-span-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle aria-hidden="true" className="h-4 w-4 shrink-0 text-amber-600" />
                  <span role="alert" className="text-[13px] text-amber-800">
                    Couldn't generate a shareable link — your report is still valid, refresh to retry.
                  </span>
                </div>
                {onRetrySave && (
                  <Button
                    onClick={onRetrySave}
                    variant="outline"
                    size="sm"
                    className="h-11 border-amber-300 font-condensed text-xs font-semibold uppercase tracking-wider text-amber-800 hover:bg-amber-100"
                  >
                    Retry
                  </Button>
                )}
              </div>
            )}

            {/* Hero. On mobile these are plain siblings (car, verdict, offer); on desktop the verdict
                sits left and the car and red flags stack on the right. */}
            <div className="contents lg:col-span-2 lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-x-6 lg:gap-y-4">
              <div className="lg:col-start-2 lg:row-start-1">
                <FindingsCar
                  body={bodyStyleFor({ model: vehicle.model })}
                  pins={pins}
                  findings={sortedIssues}
                  active={activeFinding}
                  onActive={setActiveFinding}
                  onJump={jumpTo}
                />
              </div>

              <div className="lg:col-start-1 lg:row-span-2 lg:row-start-1">
                <RecommendationCard recommendation={safeRecommendation}>
                  <div className="mt-5 hidden lg:block">
                    <h3 className="font-condensed text-[13px] font-bold uppercase tracking-[0.12em] text-text-2">
                      Your offer vs. the market
                    </h3>
                    <PriceRuler {...rulerProps} />
                  </div>
                </RecommendationCard>
              </div>

              {/* Mobile offer card */}
              <section aria-label="Suggested offer" className="rounded-card border-2 border-primary bg-white p-[18px] lg:hidden">
                {offerHeader}
                <div className="mt-5">
                  <h3 className="font-condensed text-[13px] font-bold uppercase tracking-[0.12em] text-text-2">
                    Your offer vs. the market
                  </h3>
                  <PriceRuler {...rulerProps} />
                </div>
                <div className="mt-3.5 border-t border-card-border pt-3.5">
                  <RepairCostTracker partsTotal={partsTotal} repairTotal={repairTotal} />
                </div>
                <CopyMessageButton script={script} label="Copy message to seller" variant="primary" className="mt-4" />
              </section>

              {/* Desktop red flags sit under the car */}
              {hasRedFlags && <div className="hidden lg:col-start-2 lg:row-start-2 lg:block">{redFlags}</div>}
            </div>

            {/* Main row: findings on the left, offer and recalls in a sticky column on desktop */}
            <div className="contents lg:col-span-2 lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-x-6">
              <div className="flex min-w-0 flex-col gap-4">
                {hasRedFlags && <div className="lg:hidden">{redFlags}</div>}
                <FindingsList
                  findings={sortedIssues}
                  checked={checked}
                  onToggle={toggle}
                  active={activeFinding}
                  onActive={setActiveFinding}
                  jump={jump}
                />
              </div>

              <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
                {/* Desktop offer card: offer, budget, message */}
                <section aria-label="Suggested offer" className="hidden rounded-card border-2 border-primary bg-white p-[22px] lg:block">
                  {offerHeader}
                  <div className="mt-3.5 border-t border-card-border pt-3.5">
                    <RepairCostTracker partsTotal={partsTotal} repairTotal={repairTotal} />
                  </div>
                  <div className="mt-4">
                    <NegotiationScript
                      variant="panel"
                      vehicle={vehicle}
                      askingPrice={displayPrice}
                      checkedIssues={checkedIssues}
                      repairTotal={repairTotal}
                      suggestedOffer={suggestedOffer}
                    />
                  </div>
                </section>
                <div className="mt-2 lg:hidden">
                  <NegotiationScript
                    vehicle={vehicle}
                    askingPrice={displayPrice}
                    checkedIssues={checkedIssues}
                    repairTotal={repairTotal}
                    suggestedOffer={suggestedOffer}
                  />
                </div>
                <RecallSection recalls={recalls} badge={recallBadge} className="" />
              </aside>
            </div>

            <p className="border-t border-card-border pt-4 text-[13px] leading-[1.5] text-muted-text lg:col-span-2 lg:mt-4 lg:text-sm">
              Estimates are for informational purposes. Always have a licensed mechanic inspect the car before you buy.
            </p>
          </div>
        </div>
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
