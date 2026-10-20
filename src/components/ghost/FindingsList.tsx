import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { URGENCY_LABEL } from "@/lib/ghost/report";
import type { Issue, Severity } from "@/lib/ghost/types";

function usd(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

const SEV = {
  HIGH: { badge: "bg-sev-high text-sev-high-fg", pill: "bg-sev-high text-sev-high-fg" },
  MED: { badge: "bg-sev-med text-sev-med-fg", pill: "bg-sev-med text-sev-med-fg" },
  LOW: { badge: "bg-sev-low text-sev-low-fg", pill: "bg-sev-low text-sev-low-fg" },
} as const satisfies Record<Severity, { badge: string; pill: string }>;

function firstHighId(findings: Issue[]): string | undefined {
  return findings.find((f) => f.severity === "HIGH")?.id;
}

// Flat list of findings, already sorted. Each row: checkbox, number badge (same number and colour
// as the pin on the car), severity, urgency, title, parts range and labour. The first HIGH finding
// starts expanded.
export function FindingsList({
  findings,
  checked,
  onToggle,
  active,
  onActive,
  jump,
  impacts,
}: {
  findings: Issue[];
  checked: Set<string>;
  onToggle: (id: string) => void;
  /** Finding highlighted by hover, focus or tap anywhere (list rows and car pins share it). */
  active: number | null;
  onActive: (n: number | null) => void;
  /** Ask the list to scroll to a finding, expand it and focus it. */
  jump: { n: number; nonce: number } | null;
  /** Idle Score points each finding costs, by issue id. Chips show from 0.5 points up. */
  impacts?: Record<string, number>;
}) {
  const uid = useId();
  const key = findings.map((f) => f.id).join("|");
  const [open, setOpen] = useState<Set<string>>(() => {
    const id = firstHighId(findings);
    return new Set(id ? [id] : []);
  });

  useEffect(() => {
    const id = firstHighId(findings);
    setOpen(new Set(id ? [id] : []));
  }, [key]);

  // Read through a ref so the effect only reacts to a new jump request, not to every re-sort.
  const findingsRef = useRef(findings);
  findingsRef.current = findings;

  useEffect(() => {
    if (!jump) return;
    const issue = findingsRef.current[jump.n - 1];
    if (!issue) return;
    setOpen((prev) => new Set(prev).add(issue.id));
    const frame = requestAnimationFrame(() => {
      const row = document.getElementById(`${uid}-row-${issue.id}`);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      row?.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
      row?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [jump, uid]);

  const toggleOpen = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  return (
    <section aria-label="Findings">
      <div className="mt-6 flex items-baseline justify-between gap-4 lg:mb-0 lg:mt-2">
        <h2 className="font-condensed text-[15px] font-bold uppercase tracking-[0.12em] lg:text-[17px]">
          {findings.length} {findings.length === 1 ? "finding" : "findings"}
        </h2>
        <span className="text-[13px] text-muted-text lg:text-sm">
          Tick what you'd fix<span className="hidden lg:inline"> to update your offer</span>
        </span>
      </div>

      <ul className="mt-2.5 overflow-hidden rounded-card border border-card-border bg-white">
        {findings.map((issue, idx) => {
          const n = idx + 1;
          const isOpen = open.has(issue.id);
          const boxId = `${uid}-box-${issue.id}`;
          const panelId = `${uid}-panel-${issue.id}`;
          const parts = issue.parts ?? [];
          const range = `${usd(issue.partsCostMin)}–${Math.round(issue.partsCostMax).toLocaleString("en-US")}`;
          const hours = `${issue.labourHours} h labor`;
          const sev = SEV[issue.severity] ?? SEV.LOW;

          return (
            <li
              key={issue.id}
              id={`${uid}-row-${issue.id}`}
              data-n={n}
              tabIndex={-1}
              onMouseEnter={() => onActive(n)}
              onMouseLeave={() => onActive(null)}
              onFocus={() => onActive(n)}
              onBlur={() => onActive(null)}
              className={`border-b border-card-border outline-none transition-colors last:border-b-0 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary motion-reduce:transition-none ${
                active === n ? "bg-row-highlight" : ""
              }`}
            >
              <div className="flex items-start gap-3 px-4 py-3.5 lg:gap-3.5 lg:px-5 lg:py-[18px]">
                <input
                  id={boxId}
                  type="checkbox"
                  checked={checked.has(issue.id)}
                  onChange={() => onToggle(issue.id)}
                  className="mt-[3px] h-[22px] w-[22px] shrink-0 cursor-pointer accent-primary lg:mt-1"
                />
                <span
                  aria-hidden="true"
                  className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-condensed text-sm font-bold lg:h-[30px] lg:w-[30px] lg:text-[15px] ${sev.badge}`}
                >
                  {n}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className={`inline-flex h-[22px] items-center rounded px-2 font-condensed text-xs font-bold tracking-[0.08em] ${sev.pill}`}>
                      {issue.severity}
                    </span>
                    <span className="text-xs uppercase tracking-[0.06em] text-muted-text">
                      {URGENCY_LABEL[issue.urgency] ?? URGENCY_LABEL.Monitor}
                    </span>
                    {(impacts?.[issue.id] ?? 0) >= 0.5 && (
                      <span className="inline-flex h-[22px] items-center rounded-full border border-card-border bg-white px-2 font-mono text-xs font-bold text-primary">
                        −{Math.round(impacts![issue.id])} pts
                      </span>
                    )}
                  </div>
                  <label
                    htmlFor={boxId}
                    className="mt-1.5 block cursor-pointer text-[17px] font-semibold leading-tight lg:text-lg"
                  >
                    <span className="sr-only">Finding {n}: </span>
                    {issue.label}
                  </label>
                  <p className="mt-1 font-mono text-[13px] text-text-2 lg:hidden">
                    Parts {range} · {hours}
                  </p>
                </div>
                <div className="hidden shrink-0 text-right lg:block">
                  <div className="font-mono text-[15px] font-bold">{range}</div>
                  <div className="mt-0.5 font-mono text-xs text-muted-text">parts · {hours}</div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleOpen(issue.id)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  aria-label={`${isOpen ? "Hide" : "Show"} details for ${issue.label}`}
                  className="-my-2.5 -mr-2.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-text hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:-mr-3"
                >
                  <ChevronDown
                    aria-hidden="true"
                    className={`h-5 w-5 transition-transform motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
              </div>

              {isOpen && (
                <div id={panelId} className="px-4 pb-4 lg:ml-[76px] lg:mr-8 lg:px-0 lg:pb-5">
                  <p className="text-[15px] leading-[1.5] text-text-2">{issue.explanation}</p>
                  {parts.length > 0 && (
                    <ul className="mt-3 grid gap-2.5 lg:grid-cols-2">
                      {parts.map((part, i) => (
                        <li
                          key={i}
                          className="flex justify-between gap-3 rounded-[10px] border border-card-border px-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-semibold">{part.name}</div>
                            <div className="mt-0.5 font-mono text-xs text-muted-text">
                              {part.partNumber ? `#${part.partNumber} · ` : ""}
                              {part.source}
                              {part.url && (
                                <>
                                  {" · "}
                                  <a
                                    href={part.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary underline-offset-2 hover:underline"
                                  >
                                    View listing
                                  </a>
                                </>
                              )}
                            </div>
                          </div>
                          {part.priceUsd != null && (
                            <span className="shrink-0 font-mono text-sm font-bold">
                              ${part.priceUsd.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
