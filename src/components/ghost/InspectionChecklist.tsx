import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import type { Category, Issue, Severity } from "@/lib/ghost/types";

const CATEGORIES: Category[] = [
  "Engine & Drivetrain",
  "Chassis & Suspension",
  "Body & Electrical",
];

function SeverityPill({ severity }: { severity: Severity }) {
  const cls =
    severity === "HIGH"
      ? "bg-primary text-primary-foreground"
      : severity === "MED"
      ? "bg-amber-500 text-white"
      : "bg-zinc-200 text-zinc-700";
  return (
    <span
      className={`inline-flex h-5 min-w-[42px] items-center justify-center rounded-sm px-1.5 font-condensed text-[10px] font-semibold uppercase tracking-wider ${cls}`}
    >
      {severity}
    </span>
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
  return (
    <li className={`py-3 ${isRecommended && !isChecked ? "bg-primary/[0.03]" : ""}`}>
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
            <span className={`text-[14px] ${isChecked ? "text-foreground" : "text-foreground/85"}`}>
              {issue.label}
            </span>
            {isRecommended && (
              <span className="inline-flex items-center rounded-sm bg-primary/10 px-1.5 py-0.5 font-condensed text-[10px] font-semibold uppercase tracking-wider text-primary">
                Recommended
              </span>
            )}
          </span>
          <span className="flex items-center gap-2 shrink-0">
            <span className="font-mono text-[13px] font-semibold tabular-nums">
              ${issue.costMin.toLocaleString()} – ${issue.costMax.toLocaleString()}
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${
                open ? "rotate-180" : ""
              }`}
            />
          </span>
        </button>
      </div>
      {open && (
        <p className="mt-2 pl-[78px] pr-2 text-[13px] leading-relaxed text-muted-foreground view-fade-in">
          {issue.explanation}
        </p>
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
        return (
          <AccordionItem
            key={cat}
            value={cat}
            className="rounded-lg border border-border bg-card px-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
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
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {items.length} CHECKS
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="divide-y divide-border">
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