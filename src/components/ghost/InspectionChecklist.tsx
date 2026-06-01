import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import type { Category, Issue } from "@/lib/ghost/types";

const CATEGORIES: Category[] = [
  "Engine & Drivetrain",
  "Chassis & Suspension",
  "Body & Electrical",
];

export function InspectionChecklist({
  issues,
  checked,
  onToggle,
}: {
  issues: Issue[];
  checked: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <Accordion type="multiple" defaultValue={CATEGORIES} className="space-y-3">
      {CATEGORIES.map((cat) => {
        const items = issues.filter((i) => i.category === cat);
        return (
          <AccordionItem
            key={cat}
            value={cat}
            className="rounded-lg border border-border bg-card px-4"
          >
            <AccordionTrigger className="py-4 text-left hover:no-underline">
              <div className="flex w-full items-center justify-between gap-3 pr-2">
                <span className="text-sm font-semibold uppercase tracking-wide">{cat}</span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {items.length} CHECKS
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="divide-y divide-border">
                {items.map((issue) => {
                  const isChecked = checked.has(issue.id);
                  return (
                    <li key={issue.id} className="flex items-center gap-3 py-3">
                      <Checkbox
                        id={issue.id}
                        checked={isChecked}
                        onCheckedChange={() => onToggle(issue.id)}
                        className="data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                      />
                      <label
                        htmlFor={issue.id}
                        className={`flex-1 cursor-pointer text-sm ${
                          isChecked ? "text-foreground" : "text-foreground/80"
                        }`}
                      >
                        {issue.label}
                      </label>
                      <span className="font-mono text-sm font-semibold tabular-nums">
                        ${issue.cost.toLocaleString()}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
