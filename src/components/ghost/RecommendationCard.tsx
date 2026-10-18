import { useState, type ReactNode } from "react";
import type { ReportRecommendation } from "@/lib/ghost/types";

const VERDICT_PILL: Record<ReportRecommendation["verdict"], { label: string; className: string }> = {
  buy: { label: "BUY", className: "bg-[#1d6b43] text-white" },
  negotiate: { label: "NEGOTIATE", className: "bg-sev-med text-sev-med-fg" },
  walkaway: { label: "WALK AWAY", className: "bg-primary text-white" },
};

// Verdict pill, headline and summary. `children` renders below (the desktop ruler and copy button).
export function RecommendationCard({
  recommendation,
  children,
}: {
  recommendation?: ReportRecommendation;
  children?: ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!recommendation || !recommendation.verdict) {
    return (
      <section className="rounded-card border border-card-border bg-white p-5 text-center text-sm text-muted-text">
        Generating recommendation details...
      </section>
    );
  }

  const pill = VERDICT_PILL[recommendation.verdict] ?? VERDICT_PILL.negotiate;
  const summary = recommendation.summary || "No details available.";
  // The summary is clamped to 3 lines on mobile; only offer the toggle when it can overflow.
  const longSummary = summary.length > 150;

  return (
    <section
      aria-label="Verdict"
      className="rounded-card border border-card-border bg-white p-[18px] lg:rounded-hero lg:p-[26px]"
    >
      <span
        className={`inline-flex h-[26px] items-center rounded px-2.5 font-condensed text-sm font-bold tracking-[0.1em] ${pill.className}`}
      >
        {pill.label}
      </span>
      <h2 className="mt-3 text-[25px] font-bold leading-[1.2]">
        {recommendation.headline || "No headline provided"}
      </h2>
      <p
        id="verdict-summary"
        className={`mt-2.5 text-[15px] leading-[1.55] text-text-2 ${
          expanded ? "" : "line-clamp-3 lg:line-clamp-none"
        }`}
      >
        {summary}
      </p>
      {longSummary && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls="verdict-summary"
          className="mt-0.5 inline-flex min-h-[44px] items-center rounded text-[15px] font-semibold text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:hidden"
        >
          {expanded ? "Show less" : "Read full verdict"}
        </button>
      )}
      {children}
    </section>
  );
}
