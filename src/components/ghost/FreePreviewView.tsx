import { Lock, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Issue, Vehicle } from "@/lib/ghost/types";

function SeverityPill({ severity }: { severity: Issue["severity"] }) {
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

export function FreePreviewView({
  vehicle,
  issues,
  onUnlock,
}: {
  vehicle: Vehicle;
  issues: Issue[];
  onUnlock: () => void;
}) {
  const free = issues.slice(0, 3);
  const lockedCount = Math.max(0, issues.length - free.length);
  const peek = issues.slice(3, 7);

  const yearStr = vehicle.year ? `${vehicle.year} ` : "";

  return (
    <section className="view-fade-in relative z-10 mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div>
        <p className="font-condensed text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Free preview — {yearStr}{vehicle.make} {vehicle.model}
        </p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Here's what we found.
        </h2>
        <p className="mt-3 text-[15px] text-muted-foreground">
          We flagged 3 issues on this vehicle at no charge. The full report includes{" "}
          <span className="font-semibold text-foreground">{lockedCount}</span> additional findings
          with repair cost ranges, severity ratings, and your ready-to-send negotiation message.
        </p>
      </div>

      {/* 3 Free items */}
      <ul className="mt-8 divide-y divide-border rounded-xl border border-border bg-card shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        {free.map((issue) => (
          <li key={issue.id} className="flex items-start gap-4 p-4 sm:p-5">
            <SeverityPill severity={issue.severity} />
            <div className="min-w-0 flex-1">
              <div className="font-condensed text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {issue.category}
              </div>
              <div className="mt-0.5 text-[15px] font-medium text-foreground">{issue.label}</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                {issue.explanation}
              </p>
            </div>
            <Lock className="mt-1 h-4 w-4 shrink-0 text-primary" />
          </li>
        ))}
      </ul>

      {/* Blurred stack */}
      <div className="relative mt-6">
        <div className="space-y-2 opacity-50" style={{ filter: "blur(16px)" }}>
          {peek.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
            >
              <span className="text-sm">{p.label}</span>
              <span className="font-mono text-sm">$$$ – $$$</span>
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="rounded-full border border-border bg-background/90 px-3 py-1.5 font-condensed text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {lockedCount} more findings in full report
          </span>
        </div>
      </div>

      {/* Unlock card */}
      <div className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)] sm:p-8">
        <div className="text-center">
          <h3 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Unlock the full report
          </h3>
          <p className="mx-auto mt-3 max-w-md text-[15px] text-muted-foreground">
            Every finding with repair cost ranges, severity levels, and a negotiation message written
            for this exact car and this exact asking price.
          </p>
          <div className="mt-6 font-sans text-5xl font-extrabold tracking-tight text-foreground">
            $9.99
          </div>
        </div>

        <Button
          onClick={onUnlock}
          className="cta-active mt-6 h-14 w-full bg-primary text-base font-semibold text-primary-foreground shadow-[0_2px_12px_rgba(178,34,34,0.18)] hover:bg-primary/90"
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Unlock Full Report — $9.99
        </Button>

        <p className="mt-3 text-center text-[12px] text-muted-foreground">
          One-time payment. No subscription. Works for this listing only.
        </p>
        <p className="mt-1 text-center text-[11px] text-muted-foreground">
          Credit Card · Apple Pay · Google Pay
        </p>
      </div>
    </section>
  );
}
