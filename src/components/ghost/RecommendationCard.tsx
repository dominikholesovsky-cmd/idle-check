import { CheckCircle, AlertTriangle, XCircle, Clock, Wrench, Eye } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Issue, ReportRecommendation, Urgency } from "@/lib/ghost/types";

const URGENCY_CONFIG: Record<Urgency, { icon: typeof Clock; color: string; accent: string }> = {
  Immediate: { icon: XCircle, color: "text-primary", accent: "border-l-primary" },
  Soon: { icon: Wrench, color: "text-amber-600", accent: "border-l-amber-500" },
  Monitor: { icon: Eye, color: "text-zinc-300", accent: "border-l-zinc-600" },
};

const VERDICT_CONFIG = {
  buy: { icon: CheckCircle, color: "text-emerald-600", accent: "border-l-emerald-500", label: "Good Buy" },
  negotiate: { icon: AlertTriangle, color: "text-amber-600", accent: "border-l-amber-500", label: "Negotiate" },
  walkaway: { icon: XCircle, color: "text-primary", accent: "border-l-primary", label: "Walk Away" },
};

export function RecommendationCard({
  recommendation,
  issues = [],
}: {
  recommendation?: ReportRecommendation;
  issues?: Issue[];
}) {
  if (!recommendation || !recommendation.verdict) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 text-center text-sm text-zinc-300">
        Generating recommendation details...
      </div>
    );
  }

  const currentVerdict = recommendation.verdict || "negotiate";
  const vc = VERDICT_CONFIG[currentVerdict] || VERDICT_CONFIG.negotiate;
  const VIcon = vc.icon;

  return (
    <div className="space-y-6">
      <div className={`rounded-xl border border-border border-l-4 ${vc.accent} bg-card p-5 sm:p-6`}>
        <div className="flex items-start gap-4">
          <VIcon className={`mt-0.5 h-5 w-5 shrink-0 ${vc.color}`} />
          <div>
            <div className={`font-condensed text-[10px] font-semibold uppercase tracking-wider ${vc.color}`}>
              {vc.label}
            </div>
            <h3 className="mt-1 text-lg font-extrabold tracking-tight text-white">
              {recommendation.headline || "No Headline Provided"}
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed text-zinc-300">
              {recommendation.summary || "No details available."}
            </p>
          </div>
        </div>
      </div>

      {Array.isArray(recommendation.roadmap) && recommendation.roadmap.length > 0 && (
        <div>
          <h3 className="mb-3 font-condensed text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-300">
            Maintenance Roadmap
          </h3>
          <Accordion type="multiple" defaultValue={[]} className="space-y-2">
            {recommendation.roadmap.map((group, idx) => {
              if (!group) return null;
              const urg = group.urgency || "Monitor";
              const cfg = URGENCY_CONFIG[urg] || URGENCY_CONFIG.Monitor;
              const Icon = cfg.icon;
              const groupIssues = Array.isArray(issues)
                ? issues.filter((i) => group.issueIds?.includes(i?.id))
                : [];
              const value = `${urg}-${idx}`;

              return (
                <AccordionItem
                  key={value}
                  value={value}
                  className={`rounded-lg border border-border border-l-4 ${cfg.accent} bg-card px-4`}
                >
                  <AccordionTrigger className="py-3 text-left hover:no-underline">
                    <div className="flex w-full items-center justify-between gap-3 pr-2">
                      <span className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${cfg.color}`} />
                        <span className={`font-condensed text-xs font-semibold uppercase tracking-wider ${cfg.color}`}>
                          {group.label || "Notice"}
                        </span>
                      </span>
                      <span className="font-mono text-[11px] text-zinc-300">
                        {groupIssues.length} {groupIssues.length === 1 ? "item" : "items"}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-3 text-[12px] text-zinc-300">{group.reason}</p>
                    {groupIssues.length > 0 && (
                      <ul className="divide-y divide-zinc-800 rounded-md border border-zinc-800">
                        {groupIssues.map((issue) => (
                          <li key={issue.id} className="flex items-center justify-between px-3 py-2.5">
                            <span className="text-[13px] font-medium text-white">{issue.label}</span>
                            <span className="font-mono text-[12px] text-zinc-300">
                              ${issue.costMin?.toLocaleString() || 0} – ${issue.costMax?.toLocaleString() || 0}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      )}
    </div>
  );
}
