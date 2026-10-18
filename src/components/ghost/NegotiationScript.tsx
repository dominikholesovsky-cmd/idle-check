import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { round100 } from "@/lib/ghost/report";
import type { Issue, Vehicle } from "@/lib/ghost/types";

interface ScriptInput {
  vehicle: Vehicle;
  askingPrice: number;
  checkedIssues: Issue[];
  /** Already rounded by ReportView (one offer calculation for the whole report). */
  repairTotal: number;
  suggestedOffer: number;
}

// The message generator. Kept as it was; only the presentation changed.
export function buildNegotiationScript({
  vehicle, askingPrice, checkedIssues, repairTotal, suggestedOffer,
}: ScriptInput): string {
  const repairRounded = repairTotal;
  const offerRounded = suggestedOffer;
  const askingRounded = round100(askingPrice);

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
      ? `I did some research before reaching out — at this mileage, ${issuesSentence} are pretty common on these. Getting those sorted would run around $${repairRounded.toLocaleString("en-US")} at a shop.`
      : `I did some research before reaching out and the listing looks solid on paper.`;
  const close =
    checkedIssues.length > 0
      ? `I'd be comfortable at $${offerRounded.toLocaleString("en-US")} cash. Would that work for you? Happy to come take a look this week if so.`
      : `I'd be comfortable at $${askingRounded.toLocaleString("en-US")} cash. Would that work for you? Happy to come take a look this week if so.`;

  return `${opener}\n\n${middle}\n\n${close}`;
}

export function CopyMessageButton({
  script,
  label,
  variant,
  className = "",
}: {
  script: string;
  label: string;
  variant: "primary" | "outline";
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

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

  const look =
    variant === "primary"
      ? "h-[52px] border-0 bg-primary text-white hover:bg-primary-hover"
      : "h-12 border border-input-border bg-white text-ink hover:border-primary";

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`flex w-full items-center justify-center gap-2 rounded-field text-base font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${look} ${
        copied ? "!border-[#cfe5d8] !bg-[#e9f4ee] !text-[#1d6b43]" : ""
      } ${className}`}
    >
      {copied ? <Check aria-hidden="true" className="h-[18px] w-[18px]" /> : <Copy aria-hidden="true" className="h-[18px] w-[18px]" />}
      {copied ? "Copied — good luck out there." : label}
    </button>
  );
}

// Outgoing message bubble. `panel` renders without its own card (inside the offer card).
export function NegotiationScript({
  variant = "card",
  ...input
}: ScriptInput & { variant?: "card" | "panel" }) {
  const script = buildNegotiationScript(input);
  const paragraphs = script.split("\n\n");

  const body = (
    <>
      <h2 className="font-condensed text-[15px] font-bold uppercase tracking-[0.12em]">Message to the seller</h2>
      <p className={`text-[13px] text-muted-text ${variant === "card" ? "mb-3 mt-1" : "mb-2.5"}`}>
        Updates as you tick findings.
      </p>
      <div className="rounded-[14px] border border-card-border bg-page p-3.5" aria-live="polite">
        <div className="flex justify-end">
          <div className="max-w-[94%] rounded-[16px_16px_4px_16px] bg-primary px-3.5 py-3 text-sm leading-[1.55] text-white">
            {paragraphs.map((p, i) => (
              <p key={i} className={i === 0 ? "" : "mt-2.5"}>{p}</p>
            ))}
          </div>
        </div>
      </div>
      <CopyMessageButton
        script={script}
        label="Copy message"
        variant={variant === "card" ? "outline" : "primary"}
        className="mt-4"
      />
    </>
  );

  if (variant === "panel") return <div>{body}</div>;
  return (
    <section className="rounded-card border border-card-border bg-white p-[18px]">
      {body}
    </section>
  );
}
