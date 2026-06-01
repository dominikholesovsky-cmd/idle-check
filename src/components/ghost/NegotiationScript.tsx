import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Issue, Vehicle } from "@/lib/ghost/types";

export function NegotiationScript({
  vehicle,
  askingPrice,
  checkedIssues,
  repairTotal,
}: {
  vehicle: Vehicle;
  askingPrice: number;
  checkedIssues: Issue[];
  repairTotal: number;
}) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const rawOffer = askingPrice - repairTotal;
  const offer = Math.max(0, rawOffer);
  const walkAway = rawOffer < 0;

  const yearStr = vehicle.year ? `${vehicle.year} ` : "";
  const issuesList =
    checkedIssues.length > 0
      ? checkedIssues.map((i) => i.label).join(", ")
      : "several common wear items for this model and year";

  const script = `Hi — I'm seriously interested in the ${yearStr}${vehicle.make} ${vehicle.model}.

After carefully reviewing the listing, I noted potential concerns I'd want addressed: ${issuesList}.

Based on current US parts pricing and local labor rates ($120/hr), my estimated repair and reconditioning budget comes to $${repairTotal.toLocaleString()}.

Given the listed price of $${askingPrice.toLocaleString()} and the required repairs, I can offer $${offer.toLocaleString()} cash today, ready to pick up this week.${
    walkAway
      ? "\n\nNote: estimated repairs exceed the asking price — I'd recommend re-evaluating the listing or being open to a significantly lower number."
      : ""
  }

Happy to discuss. Thanks for your time.`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      toast.success("Negotiation script copied");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Unable to copy. Please select the text manually.");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide">Negotiation Script</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Auto-generated. Updates live as you check inspection items.
          </p>
        </div>
        <div className="text-right">
          <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Your Cash Offer
          </div>
          <div className="font-mono text-2xl font-bold tabular-nums text-primary">
            ${offer.toLocaleString()}
          </div>
        </div>
      </div>

      <Textarea
        readOnly
        value={script}
        className="mt-4 min-h-56 resize-none font-mono text-xs leading-relaxed"
      />

      <Button
        onClick={handleCopy}
        className={`mt-4 h-11 w-full text-sm font-semibold uppercase tracking-wide transition-colors ${
          copied
            ? "bg-green-600 text-white hover:bg-green-600"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        }`}
      >
        {copied ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            Copied to Clipboard!
          </>
        ) : (
          <>
            <Copy className="mr-2 h-4 w-4" />
            Copy to Clipboard
          </>
        )}
      </Button>
    </div>
  );
}
