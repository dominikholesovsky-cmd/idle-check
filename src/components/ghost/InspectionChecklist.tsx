import { useState } from "react";
import { ChevronDown, ExternalLink, Package } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import type { Category, Issue, IssuePart, Severity } from "@/lib/ghost/types";

const CATEGORIES: Category[] = [
  "Engine & Drivetrain",
  "Chassis & Suspension",
  "Body & Electrical",
];

const SOURCE_COLORS: Record<IssuePart["source"], string> = {
  RockAuto: "text-blue-400",
  "eBay Motors": "text-amber-400",
  "OEM Dealer": "text-emerald-400",
  Estimated: "text-zinc-300",
};

function SeverityPill({ severity }: { severity: Severity }) {
  const cls =
    severity === "HIGH"
      ? "bg-red-700 text-white"
      : severity === "MED"
      ? "bg-amber-500 text-white"
      : "bg-zinc-700 text-zinc-200";
  return (
    <span
      className={`inline-flex h-5 min-w-[42px] items-center justify-center rounded-sm px-1.5 font-condensed text-[10px] font-semibold uppercase tracking-wider ${cls}`}
    >
      {severity}
    </span>
  );
}

function PartsSection({ parts }: { parts: IssuePart[] }) {
  if (!parts || parts.length === 0) return null;
  return (
    <div className="mt-3 rounded-lg border border-zinc-700 bg-zinc-900 p-3">
      <div className="mb-2 flex items-center gap-1.5">
        <Package className="h-3 w-3 text-zinc-300" />
        <span className="font-condensed text-[10px] font-semibold uppercase tracking-wider text-zinc-300">
          Parts & Pricing
        </span>
      </div>
      <ul className="space-y-2">
        {parts.map((part, i) => (
          <li key={i} className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-medium text-white">
                  {part.name}
                </span>
                {part.partNumber && (
                  <span className="font-mono text-[11px] text-zinc-300">
                    #{part.partNumber}
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-2">
                <span className={`font-condensed text-[11px] font-semibold uppercase tracking-wider ${SOURCE_COLORS[part.source]}`}>
                  {part.source}
                </span>
                {part.url && (
                  <a
                    href={part.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 font-condensed text-[11px] text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View listing
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>
            </div>
            {part.priceUsd != null && (
              <span className="shrink-0 font-mono text-[13px] font-semibold tabular-nums text-white">
                ${part.priceUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Row({
  issue,
  isChecked,
  isRecommended,
  onToggle,
}: {
  issue: Issue;
  isChecked: boolean;
  isRecommended: boolean;
  onToggle: () => void;
}) {
  const [open, setOpen] = useState(false);
  const hasParts = Array.isArray(issue.parts) && issue.parts.length > 0;

  return (
    <li className={`py-3 ${isRecommended && !isChecked ? "bg-red-950/20" : ""}`}>
      <div className="flex items-center gap-3">
        <SeverityPill severity={issue.severity} />
        <Checkbox
          id={issue.id}
          checked={isChecked}
          onCheckedChange={onToggle}
          className="data-[state=checked]:border-primary data-[state=checked]:bg-primary"
        />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 items-center justify-between gap-3 text-left"
        >
          <span className="flex items-center gap-2">
            <span className={`text-[14px] ${isChecked ? "text-white" : "text-zinc-300"}`}>
              {issue.label}
            </span>
            {isRecommended && (
              <span className="inline-flex items-center rounded-sm bg-primary/10 px-1.5 py-0.5 font-condensed text-[10px] font-semibold uppercase tracking-wider text-primary">
                Recommended
              </span>
            )}
            {hasParts && !open && (
              <span className="inline-flex items-center gap-1 rounded-sm bg-blue-500/10 px-1.5 py-0.5 font-condensed text-[10px] font-semibold uppercase tracking-wider text-blue-400">
                <Package className="h-2.5 w-2.5" />
                {issue.parts!.length} {issue.parts!.length === 1 ? "part" : "parts"}
              </span>
            )}
          </span>
          <span className="flex items-center gap-2 shrink-0">
            <span className="font-mono text-[13px] font-semibold tabular-nums">
              ${issue.partsCostMin.toLocaleString()} – ${issue.partsCostMax.toLocaleString()}
              <span className="ml-1 font-condensed text-[10px] font-normal uppercase tracking-wider text-zinc-300">parts</span>
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 text-zinc-300 transition-transform ${
                open ? "rotate-180" : ""
              }`}
            />
          </span>
        </button>
      </div>

      {open && (
        <div className="mt-2 pl-[78px] pr-2 view-fade-in">
          <p className="text-[13px] leading-relaxed text-zinc-300">
            {issue.explanation}
          </p>
          {hasParts && <PartsSection parts={issue.parts!} />}
          <div className="mt-2 flex items-center gap-4 text-[11px] text-zinc-300">
            <span>
              Parts: <span className="font-mono font-semibold text-white">
                ${issue.partsCostMin.toLocaleString()} – ${issue.partsCostMax.toLocaleString()}
              </span>
            </span>
            <span>
              Labour: <span className="font-mono font-semibold text-white">
                {issue.labourHours}h @ $120/hr
              </span>
            </span>
          </div>
        </div>
      )}
    </li>
  );
}

export function InspectionChecklist({
  issues,
  checked,
  onToggle,
  recommendedIds,
}: {
  issues: Issue[];
  checked: Set<string>;
  onToggle: (id: string) => void;
  recommendedIds: Set<string>;
}) {
  return (
    <Accordion type="multiple" defaultValue={[]} className="space-y-3">
      {CATEGORIES.map((cat) => {
        const items = issues.filter((i) => i.category === cat);
        const recCount = items.filter((i) => recommendedIds.has(i.id)).length;
        const partsCount = items.filter(
          (i) => Array.isArray(i.parts) && i.parts.length > 0
        ).length;

        return (
          <AccordionItem
            key={cat}
            value={cat}
            className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 shadow-[0_2px_24px_rgba(0,0,0,0.18)]"
          >
            <AccordionTrigger className="py-4 text-left hover:no-underline">
              <div className="flex w-full items-center justify-between gap-3 pr-2">
                <span className="flex items-center gap-2">
                  <span className="font-condensed text-sm font-semibold uppercase tracking-[0.12em]">
                    {cat}
                  </span>
                  {recCount > 0 && (
                    <span className="rounded-sm bg-primary/10 px-1.5 py-0.5 font-condensed text-[10px] font-semibold uppercase tracking-wider text-primary">
                      {recCount} recommended
                    </span>
                  )}
                  {partsCount > 0 && (
                    <span className="rounded-sm bg-blue-500/10 px-1.5 py-0.5 font-condensed text-[10px] font-semibold uppercase tracking-wider text-blue-400">
                      {partsCount} with pricing
                    </span>
                  )}
                </span>
                <span className="font-mono text-[11px] text-zinc-300">
                  {items.length} CHECKS
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="divide-y divide-zinc-800">
                {items.map((issue) => (
                  <Row
                    key={issue.id}
                    issue={issue}
                    isChecked={checked.has(issue.id)}
                    isRecommended={recommendedIds.has(issue.id)}
                    onToggle={() => onToggle(issue.id)}
                  />
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}