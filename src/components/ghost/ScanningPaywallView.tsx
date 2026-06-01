import { useEffect, useState } from "react";
import { Check, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

const SCAN_LINES = [
  "Bypassing marketplace firewalls...",
  "Extracting vehicle metadata from URL...",
  "Parsing seller description for hidden red flags...",
  "Cross-referencing US parts database (RockAuto, FCP Euro)...",
  "Calculating local US labor rates ($120/hr)...",
  "Compiling negotiation protocol...",
];

export function ScanningPaywallView({ onUnlock }: { onUnlock: () => void }) {
  const [stage, setStage] = useState<"scanning" | "paywall">("scanning");
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    if (stage !== "scanning") return;
    const interval = setInterval(() => {
      setVisibleLines((v) => {
        if (v >= SCAN_LINES.length) {
          clearInterval(interval);
          setTimeout(() => setStage("paywall"), 400);
          return v;
        }
        return v + 1;
      });
    }, 650);
    return () => clearInterval(interval);
  }, [stage]);

  return (
    <section className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Blurred fake report preview behind */}
      <div className="pointer-events-none absolute inset-0 -z-10 select-none overflow-hidden px-4 py-12 opacity-60 blur-md sm:px-6">
        <FakeReportPreview />
      </div>

      {stage === "scanning" ? (
        <div className="mx-auto max-w-2xl rounded-xl border border-border bg-[#0a0a0a] p-6 font-mono text-sm text-green-400 shadow-2xl sm:p-8">
          <div className="mb-4 flex items-center gap-2 border-b border-white/10 pb-3 text-xs uppercase tracking-wider text-white/60">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
            <span className="ml-3">ghost-inspector // scan.sh</span>
          </div>
          <div className="space-y-2">
            {SCAN_LINES.slice(0, visibleLines).map((line, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-green-500">$</span>
                <span>{line}</span>
              </div>
            ))}
            {visibleLines < SCAN_LINES.length && (
              <div className="flex gap-2">
                <span className="text-green-500">$</span>
                <span className="inline-block h-4 w-2 animate-pulse bg-green-400" />
              </div>
            )}
          </div>
        </div>
      ) : (
        <Paywall onUnlock={onUnlock} />
      )}
    </section>
  );
}

function FakeReportPreview() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="h-16 rounded-lg border border-border bg-card" />
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 rounded-lg border border-border bg-card" />
        ))}
      </div>
      <div className="h-64 rounded-lg border border-border bg-card" />
      <div className="h-40 rounded-lg border border-border bg-card" />
    </div>
  );
}

function Paywall({ onUnlock }: { onUnlock: () => void }) {
  const [selected, setSelected] = useState<"single" | "hunter">("hunter");

  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-2xl sm:p-10">
      <div className="text-center">
        <p className="font-mono text-[11px] uppercase tracking-wider text-primary">Report Ready</p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
          Unlock Your Inspection Protocol
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your 47-point inspection, repair budget, and negotiation script are ready.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Tier
          id="single"
          title="Single Listing Scan"
          price="$14.99"
          subtitle="One-time purchase for this car"
          features={["Full inspection checklist", "Repair cost calculator", "Negotiation script"]}
          selected={selected === "single"}
          onSelect={() => setSelected("single")}
        />
        <Tier
          id="hunter"
          title="Car Hunter Pass"
          price="$29.99"
          subtitle="30 days unlimited scans"
          features={["Everything in Single", "Unlimited listings", "Priority US labor rates"]}
          selected={selected === "hunter"}
          onSelect={() => setSelected("hunter")}
          badge="Best Value"
        />
      </div>

      <div className="mt-8 space-y-3">
        <Button
          onClick={onUnlock}
          className="h-12 w-full bg-primary text-sm font-semibold uppercase tracking-wide text-primary-foreground hover:bg-primary/90"
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Pay with Credit Card
        </Button>
        <Button
          onClick={onUnlock}
          variant="outline"
          className="h-12 w-full border-foreground bg-foreground text-sm font-semibold uppercase tracking-wide text-background hover:bg-foreground/90 hover:text-background"
        >
           Pay
        </Button>
        <p className="text-center text-[11px] text-muted-foreground">
          Secure checkout · Mock transaction for demo
        </p>
      </div>
    </div>
  );
}

function Tier({
  title, price, subtitle, features, selected, onSelect, badge,
}: {
  id: string;
  title: string;
  price: string;
  subtitle: string;
  features: string[];
  selected: boolean;
  onSelect: () => void;
  badge?: string;
}) {
  return (
    <button
      onClick={onSelect}
      className={`relative rounded-xl border p-5 text-left transition ${
        selected ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-foreground/40"
      }`}
    >
      {badge && (
        <span className="absolute -top-2 right-4 rounded-full bg-primary px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
          {badge}
        </span>
      )}
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-2 font-mono text-3xl font-bold">{price}</div>
      <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>
      <ul className="mt-4 space-y-1.5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs text-foreground">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </button>
  );
}
