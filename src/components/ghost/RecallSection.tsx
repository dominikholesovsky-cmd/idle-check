import type { Recall } from "@/lib/ghost/types";

function sentenceCase(text: string): string {
  const t = text.toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// Recall records card. `badge` is the live-data note (e.g. "Live NHTSA · VIN verified").
// `className` defaults to the top margin the SEO pages rely on.
export function RecallSection({
  recalls,
  badge,
  className = "mt-10",
}: {
  recalls: Recall[];
  badge?: { label: string; verified: boolean };
  className?: string;
}) {
  return (
    <section
      aria-label="NHTSA recalls"
      className={`rounded-card border border-card-border bg-white p-[18px] lg:p-[22px] ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-condensed text-[15px] font-bold uppercase tracking-[0.12em]">
          NHTSA recalls · {recalls.length}
        </h2>
        {badge && (
          <span className={`text-right text-xs ${badge.verified ? "text-success" : "text-muted-text"}`}>
            {badge.label}
          </span>
        )}
      </div>

      {recalls.length === 0 ? (
        <p className="mt-3 border-t border-card-border pt-3 text-sm text-muted-text">
          No recall records found for this vehicle.
        </p>
      ) : (
        <ul>
          {recalls.map((r) => {
            const open = r.status === "Open";
            return (
              <li key={r.id} className="mt-3 border-t border-card-border pt-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[15px] font-semibold">{sentenceCase(r.component || "Unknown")}</span>
                  <span
                    className={`inline-flex h-[22px] shrink-0 items-center rounded px-2 font-condensed text-xs font-bold uppercase tracking-[0.08em] ${
                      open ? "bg-primary-tint text-primary-ink" : "bg-success-bg text-success"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
                <p className="mt-1 font-mono text-xs text-muted-text">{r.date}</p>
                {r.description && (
                  <p className="mt-1.5 text-sm leading-[1.45] text-text-2">{r.description}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-3 text-xs text-muted-text">
        Recall data is pulled from the NHTSA public database. Always verify current recall status at nhtsa.gov.
      </p>
    </section>
  );
}
