import { Lock, CreditCard, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Issue, Vehicle } from "@/lib/ghost/types";

function SeverityPill({ severity }: { severity: Issue["severity"] }) {
  const cls =
    severity === "HIGH"
      ? "bg-primary text-primary-foreground"
      : severity === "MED"
      ? "bg-amber-500 text-white"
      : "bg-zinc-700 text-zinc-300";
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
  paymentError,
}: {
  vehicle: Vehicle;
  issues: Issue[];
  onUnlock: () => void;
  paymentError?: string | null;
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
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Here's what we found.
        </h2>
        <p className="mt-3 text-[15px] text-zinc-400">
          We flagged 3 issues on this vehicle at no charge. The full report includes{" "}
          <span className="font-semibold text-white">{lockedCount}</span> additional findings
          with repair cost ranges, severity ratings, and your ready-to-send negotiation message.
        </p>
      </div>

      {/* 3 Free items */}
      <ul className="mt-8 divide-y divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-900 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        {free.map((issue) => (
          <li key={issue.id} className="flex items-start gap-4 p-4 sm:p-5">
            <SeverityPill severity={issue.severity} />
            <div className="min-w-0 flex-1">
              <div className="font-condensed text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                {issue.category}
              </div>
              <div className="mt-0.5 text-[15px] font-medium text-white">{issue.label}</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-400">
                {issue.explanation}
              </p>
            </div>
            <Lock className="mt-1 h-4 w-4 shrink-0 text-primary" />
          </li>
        ))}
      </ul>

      {/* Locked items — subtle, readable enough to tease */}
      <div className="relative mt-3 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
        <ul className="divide-y divide-zinc-800">
          {peek.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between px-4 py-3 opacity-40 select-none"
              style={{ filter: "blur(3px)" }}
            >
              <div className="flex items-center gap-3">
                <SeverityPill severity={p.severity} />
                <span className="text-[14px] font-medium text-white">{p.label}</span>
              </div>
              <span className="font-mono text-[13px] font-semibold text-zinc-400">
                $— – $—
              </span>
            </li>
          ))}
        </ul>
        {/* Gradient fade at bottom */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-zinc-900 to-transparent" />
        {/* Centered label */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="rounded-full border border-zinc-700 bg-zinc-950/95 px-4 py-2 font-condensed text-xs font-semibold uppercase tracking-wider text-white shadow-sm">
            {lockedCount} more findings locked
          </span>
        </div>
      </div>

      {/* Payment error banner */}
      {paymentError && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-red-800/40 bg-red-950/40 px-4 py-3 text-[13px] text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          {paymentError}
        </div>
      )}

      {/* Unlock card */}
      <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)] sm:p-8">
        <div className="text-center">
          <h3 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Unlock the full report
          </h3>
          <p className="mx-auto mt-3 max-w-md text-[15px] text-zinc-400">
            Every finding with repair cost ranges, severity levels, and a negotiation message
            written for this exact car and this exact asking price.
          </p>
          <div className="mt-6 font-sans text-5xl font-extrabold tracking-tight text-white">
            $4.99
          </div>
        </div>
        <Button
          onClick={onUnlock}
          className="cta-active mt-6 h-14 w-full bg-red-700 text-base font-semibold text-white shadow-[0_2px_12px_rgba(178,34,34,0.3)] hover:bg-red-600 disabled:bg-red-900 disabled:text-white/50 disabled:opacity-100"
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Unlock Full Report — $4.99
        </Button>
        <p className="mt-3 text-center text-[12px] text-zinc-400">
          One-time payment. No subscription. Works for this listing only.
        </p>
        <p className="mt-1 text-center text-[11px] text-zinc-400">
          Credit Card · Apple Pay · Google Pay
        </p>
      </div>
    </section>
  );
}
