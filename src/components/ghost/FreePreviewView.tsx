import { CreditCard, AlertCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Issue, Vehicle } from "@/lib/ghost/types";

function SeverityPill({ severity }: { severity: Issue["severity"] }) {
  const cls =
    severity === "HIGH"
      ? "bg-red-700 text-white"
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
    <section className="view-fade-in relative z-10 mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 bg-[#f5f4f0] min-h-screen text-zinc-900">
      <div>
        <p className="font-condensed text-xs font-semibold uppercase tracking-[0.16em] text-red-700">
          Free preview — {yearStr}{vehicle.make} {vehicle.model}
        </p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Here's what we found.
        </h2>
        <p className="mt-3 text-[15px] text-zinc-600">
          We flagged 3 issues on this vehicle at no charge. The full report includes{" "}
          <span className="font-semibold text-zinc-900">{lockedCount}</span> additional findings
          with repair cost ranges, severity ratings, and your ready-to-send negotiation message.
        </p>
      </div>

      {/* 3 Free items */}
      <ul className="mt-8 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
        {free.map((issue) => (
          <li key={issue.id} className="flex items-start gap-4 p-4 sm:p-5">
            <SeverityPill severity={issue.severity} />
            <div className="min-w-0 flex-1">
              <div className="font-condensed text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                {issue.category}
              </div>
              <div className="mt-0.5 text-[15px] font-medium text-zinc-900">{issue.label}</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-600">
                {issue.explanation}
              </p>
            </div>
            <Lock className="mt-1 h-4 w-4 shrink-0 text-primary" />
          </li>
        ))}
      </ul>

      {/* Locked peek + unlock overlay — single block */}
      <div className="relative mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {/* Blurred rows */}
        <ul className="divide-y divide-gray-100">
          {peek.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between px-4 py-3 select-none"
              style={{ filter: "blur(2px)", opacity: 0.45 }}
            >
              <div className="flex items-center gap-3">
                <SeverityPill severity={p.severity} />
                <span className="text-[14px] font-medium text-zinc-900">{p.label}</span>
              </div>
              <span className="font-mono text-[13px] font-semibold text-zinc-500">
                $— – $—
              </span>
            </li>
          ))}
        </ul>

        {/* Frosted overlay with CTA */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl backdrop-blur-[2px] bg-white/60 px-6 py-6">
          <p className="font-condensed text-sm font-semibold uppercase tracking-wider text-zinc-700">
            🔒 {lockedCount} more findings locked
          </p>
          <div className="font-sans text-3xl font-extrabold tracking-tight text-zinc-900">
            $4.99
          </div>
          <Button
            onClick={onUnlock}
            className="cta-active h-12 w-full max-w-xs rounded-xl bg-red-800 text-base font-semibold text-white shadow-md hover:bg-red-700"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Unlock Full Report
          </Button>
          <p className="text-center text-[11px] text-zinc-500">
            One-time payment · No subscription · Apple Pay &amp; Card
          </p>
        </div>
      </div>

      {/* Payment error */}
      {paymentError && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          {paymentError}
        </div>
      )}
    </section>
  );
}
