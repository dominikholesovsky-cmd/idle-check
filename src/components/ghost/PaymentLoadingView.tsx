import { useEffect, useRef, useState } from "react";
import { AlertCircle, RotateCcw, Mail } from "lucide-react";
import { LoadingLayout, type LoadingStep } from "./LoadingLayout";
import { PRICE_USD, SUPPORT_EMAIL } from "@/lib/ghost/constants";

const LISTING_READ_MS = 800; // "Reading the listing text" completes on a timer
const TAIL_STEP_MS = 300;    // the last three steps complete quickly once the AI step is done
const DONE_DELAY_MS = 400;

const LABELS = [
  "Verifying payment",
  "Reading the listing text",
  "Finding model-specific issues",
  "Pricing parts and labor",
  "Writing your negotiation script",
  "Saving your report link",
];
const AI_IDX = 2;

export function PaymentLoadingView({
  onDone,
  claudePromise,
  hasError,
  onRetry,
  retryCount = 0,
}: {
  onDone: () => void;
  claudePromise: Promise<void>;
  hasError: boolean;
  onRetry: () => void;
  retryCount?: number;
}) {
  // The promise that has settled. Comparing it with the current `claudePromise`
  // means a retry (new promise) is never treated as already finished.
  const [settled, setSettled] = useState<Promise<void> | null>(null);
  const [listingRead, setListingRead] = useState(false);
  const [tailDone, setTailDone] = useState(0); // 0 to 3
  const firedRef = useRef(false);
  const onDoneRef = useRef(onDone);

  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  useEffect(() => {
    let cancelled = false;
    const mark = () => { if (!cancelled) setSettled(claudePromise); };
    claudePromise.then(mark, mark);
    return () => { cancelled = true; };
  }, [claudePromise]);

  useEffect(() => {
    const t = setTimeout(() => setListingRead(true), LISTING_READ_MS);
    return () => clearTimeout(t);
  }, []);

  const aiSettled = settled === claudePromise;
  const aiDone = aiSettled && !hasError && listingRead;

  // Last three steps advance only after the AI step is done
  useEffect(() => {
    if (!aiDone || tailDone >= 3) return;
    const t = setTimeout(() => setTailDone((c) => c + 1), TAIL_STEP_MS);
    return () => clearTimeout(t);
  }, [aiDone, tailDone]);

  // Redirect only when every step, including the last, is complete
  useEffect(() => {
    if (!aiDone || tailDone < 3) return;
    const t = setTimeout(() => {
      if (firedRef.current) return;
      firedRef.current = true;
      onDoneRef.current();
    }, DONE_DELAY_MS);
    return () => clearTimeout(t);
  }, [aiDone, tailDone]);

  const steps: LoadingStep[] = LABELS.map((label, i) => {
    if (i === 0) return { label, state: "done", tag: `$${PRICE_USD.toFixed(2)}` };
    if (i === 1) {
      return listingRead
        ? { label, state: "done", tag: "Done" }
        : { label, state: "active", tag: "Working" };
    }
    if (i === AI_IDX) {
      if (hasError) return { label, state: "error", tag: "Failed" };
      if (aiDone) return { label, state: "done", tag: "Done" };
      if (listingRead) return { label, state: "active", tag: "AI" };
      return { label, state: "pending" };
    }
    const tailIdx = i - AI_IDX - 1;
    if (tailIdx < tailDone) return { label, state: "done", tag: "Done" };
    if (tailIdx === tailDone && aiDone) return { label, state: "active", tag: "Working" };
    return { label, state: "pending" };
  });

  const doneCount = steps.filter((s) => s.state === "done").length;
  const allDone = doneCount === LABELS.length;
  const activeLabel = steps.find((s) => s.state === "active")?.label ?? LABELS[AI_IDX];
  const liveMessage = hasError
    ? "Analysis failed"
    : allDone
    ? "Report ready"
    : `Step ${Math.min(doneCount + 1, LABELS.length)} of ${LABELS.length}: ${activeLabel}`;

  const isPermanent = retryCount >= 1;

  return (
    <LoadingLayout
      pill={
        <>
          <svg
            aria-hidden="true"
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="m5 12 5 5 9-10" />
          </svg>
          Payment confirmed
        </>
      }
      pillClassName="border-success-border bg-success-bg text-success"
      title="Building your full report"
      progressLabel="Report progress"
      stepLabel={`Step ${Math.min(doneCount + 1, LABELS.length)} of ${LABELS.length}`}
      timeLabel="Usually under 30 seconds"
      steps={steps}
      dense
      liveMessage={liveMessage}
    >
      {hasError ? (
        <div role="alert" className="mt-4 rounded-card-sm border border-card-border bg-white p-5">
          <div className="flex items-start gap-3">
            <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              {isPermanent ? (
                <>
                  <p className="font-semibold text-ink">Analysis failed twice — we'll refund your payment.</p>
                  <p className="mt-1 text-sm text-muted-text">
                    Something is wrong on our end. Reply to your receipt or email us and we'll refund you within 24 hours.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-ink">Analysis failed — please try again.</p>
                  <p className="mt-1 text-sm text-muted-text">
                    The AI analysis didn't complete. Your payment was captured. One retry is available at no extra charge.
                  </p>
                </>
              )}
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=Idle Check analysis failed`}
                className="mt-1 inline-flex min-h-[44px] items-center gap-1.5 rounded text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Mail aria-hidden="true" className="h-3.5 w-3.5" />
                {SUPPORT_EMAIL}
              </a>
            </div>
          </div>
          {!isPermanent && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-field bg-primary text-base font-bold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
              Try again
            </button>
          )}
        </div>
      ) : (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-card-border bg-white px-4 py-3.5">
          <svg
            aria-hidden="true"
            className="mt-px shrink-0"
            width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="#646360" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
          </svg>
          <p className="text-sm leading-[1.45] text-text-2">
            Keep this tab open. We'll also email a link to the report to the address you paid with.
          </p>
        </div>
      )}
    </LoadingLayout>
  );
}
