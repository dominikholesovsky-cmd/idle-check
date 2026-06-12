import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Issue, Vehicle } from "@/lib/ghost/types";

function roundHundred(n: number): number {
  return Math.round(n / 100) * 100;
}

export function NegotiationScript({
  vehicle,
  askingPrice,
  checkedIssues,
  repairTotal,
  suggestedOffer,
}: {
  vehicle: Vehicle;
  askingPrice: number;
  checkedIssues: Issue[];
  repairTotal: number;
  suggestedOffer: number;
}) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const repairRounded = roundHundred(repairTotal);
  const offerRounded = roundHundred(suggestedOffer);
  const askingRounded = roundHundred(askingPrice);

  const yearStr = vehicle.year ? `${vehicle.year} ` : "";
  const modelStr = `${yearStr}${vehicle.make} ${vehicle.model}`.trim();
  const issueNames = checkedIssues.map((i) => i.label.toLowerCase());
  const issuesSentence =
    checkedIssues.length === 0
      ? ""
      : checkedIssues.length === 1
      ? issueNames[0]
      : checkedIssues.length === 2
      ? `${issueNames[0]} and ${issueNames[1]}`
      : `${issueNames.slice(0, -1).join(", ")}, and ${issueNames[issueNames.length - 1]}`;

  const opener = `Hey! I came across your ${modelStr} listing and I've actually been looking at a few of these.`;
  const middle =
    checkedIssues.length > 0
      ? `I did some research before reaching out — at this mileage, ${issuesSentence} are pretty common on these. Getting those sorted would run around $${repairRounded.toLocaleString()} at a shop.`
      : `I did some research before reaching out and the listing looks solid on paper.`;
  const close =
    checkedIssues.length > 0
      ? `I'd be comfortable at $${offerRounded.toLocaleString()} cash. Would that work for you? Happy to come take a look this week if so.`
      : `I'd be comfortable at $${askingRounded.toLocaleString()} cash. Would that work for you? Happy to come take a look this week if so.`;

  const script = `${opener}\n\n${middle}\n\n${close}`;

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
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-[0_2px_24px_rgba(0,0,0,0.18)] sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-condensed text-sm font-semibold uppercase tracking-[0.12em] text-white">
            Negotiation Script
          </h3>
          <p className="mt-1 text-xs text-zinc-300">
            Auto-generated. Updates live as you check inspection items.
          </p>
        </div>
        <div className="text-right">
          <div className="font-condensed text-[11px] uppercase tracking-wider text-zinc-300">
            Your Cash Offer
          </div>
          <div className="font-mono text-2xl font-bold tabular-nums text-primary">
            ${offerRounded.toLocaleString()}
          </div>
        </div>
      </div>
      <Textarea
        readOnly
        value={script}
        className="mt-4 min-h-56 resize-none border-zinc-700 bg-zinc-900 text-zinc-200 placeholder:text-zinc-500 text-[14px] leading-relaxed focus-visible:border-primary focus-visible:ring-0"
      />
      <Button
        onClick={handleCopy}
        className={`cta-active mt-4 h-12 w-full text-sm font-semibold tracking-wide transition-colors ${
          copied
            ? "bg-green-600 text-white hover:bg-green-600"
            : "bg-red-700 text-white hover:bg-red-600"
        }`}
      >
        {copied ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            Copied — good luck out there.
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