import { CheckCircle, AlertTriangle, XCircle, Clock, Wrench, Eye } from "lucide-react";
import type { Issue, ReportRecommendation, Urgency } from "@/lib/ghost/types";

const URGENCY_CONFIG: Record<Urgency, {
  icon: typeof Clock;
  color: string;
  bg: string;
  border: string;
}> = {
  Immediate: { icon: XCircle, color: "text-primary", bg: "bg-primary/5", border: "border-primary/20" },
  Soon: { icon: Wrench, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  Monitor: { icon: Eye, color: "text-zinc-500", bg: "bg-zinc-50", border: "border-zinc-200" },
};

const VERDICT_CONFIG = {
  buy: {
    icon: CheckCircle,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    label: "Good Buy",
  },
  negotiate: {
    icon: AlertTriangle,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    label: "Negotiate",
  },
  walkaway: {
    icon: XCircle,
    color: "text-primary",
    bg: "bg-primary/5",
    border: "border-primary/20",
    label: "Walk Away",
  },
};

export function RecommendationCard({
  recommendation,
  issues = [],
}: {
  recommendation?: ReportRecommendation; // Přidán otazník pro maximální bezpečnost typu
  issues?: Issue[];
}) {
  // 1. ABSOLUTNÍ OCHRANA: Pokud cokoliv chybí, komponenta bezpečně vykreslí fallback a k .verdict vůbec nepřistoupí
  if (!recommendation || !recommendation.verdict) {
    return (
      <div className="mt-10 space-y-4">
        <h2 className="font-condensed text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Overall Recommendation
        </h2>
        <div className="rounded-xl border border-border bg-card p-5 text-center text-sm text-muted-foreground">
          Generating recommendation details...
        </div>
      </div>
    );
  }

  // 2. BEZPEČNÉ VOLÁNÍ: Inicializace konfigurace probíhá až ZA ověřením existence dat
  const currentVerdict = recommendation.verdict || "negotiate";
  const vc = VERDICT_CONFIG[currentVerdict] || VERDICT_CONFIG.negotiate;
  const VIcon = vc.icon;

  return (
    <div className="mt-10 space-y-4">
      <h2 className="font-condensed text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Overall Recommendation
      </h2>

      {/* Verdict card */}
      <div className={`rounded-xl border ${vc.border} ${vc.bg} p-5 sm:p-6`}>
        <div className="flex items-start gap-4">
          <VIcon className={`mt-0.5 h-6 w-6 shrink-0 ${vc.color}`} />
          <div>
            <div className={`font-condensed text-xs font-semibold uppercase tracking-wider ${vc.color}`}>
              {vc.label}
            </div>
            <h3 className="mt-1 text-lg font-extrabold tracking-tight text-foreground">
              {recommendation.headline || "No Headline Provided"}
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
              {recommendation.summary || "No details available."}
            </p>
          </div>
        </div>
      </div>

      {/* Maintenance roadmap */}
      {Array.isArray(recommendation.roadmap) && recommendation.roadmap.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] sm:p-6">
          <h3 className="font-condensed text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Maintenance Roadmap
          </h3>
          <div className="mt-4 space-y-5">
            {recommendation.roadmap.map((group) => {
              if (!group) return null;
              
              const currentUrgency = group.urgency || "Monitor";
              const cfg = URGENCY_CONFIG[currentUrgency] || URGENCY_CONFIG.Monitor;
              const Icon = cfg.icon;
              const groupIssues = Array.isArray(issues) 
                ? issues.filter((i) => group.issueIds?.includes(i?.id))
                : [];

              return (
                <div key={group.urgency || Math.random().toString()}>
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${cfg.color}`} />
                    <span className={`font-condensed text-xs font-semibold uppercase tracking-wider ${cfg.color}`}>
                      {group.label || "Notice"}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] text-muted-foreground">{group.reason}</p>
                  
                  {groupIssues.length > 0 && (
                    <ul className={`mt-3 divide-y divide-border rounded-lg border ${cfg.border} ${cfg.bg} overflow-hidden`}>
                      {groupIssues.map((issue) => (
                        <li key={issue.id} className="flex items-center justify-between px-4 py-2.5">
                          <span className="text-[13px] font-medium text-foreground">{issue.label}</span>
                          <span className="font-mono text-[12px] text-muted-foreground">
                            ${issue.costMin?.toLocaleString() || 0} – ${issue.costMax?.toLocaleString() || 0}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}