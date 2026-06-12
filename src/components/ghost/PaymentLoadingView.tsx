import { useEffect, useRef, useState } from "react";
import { AlertCircle, RotateCcw, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const UNLOCK_LINES = [
  "Verifying payment with Stripe...",
  "Payment confirmed.",
  "Decrypting full analysis...",
  "Loading repair cost breakdown...",
  "Calculating negotiation leverage...",
  "Preparing your negotiation script...",
  "Report unlocked.",
];

const SUPPORT_EMAIL = "idlecheckapp@gmail.com";

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
  const [visible, setVisible] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [animDone, setAnimDone] = useState(false);
  const [claudeDone, setClaudeDone] = useState(false);
  const firedRef = useRef(false);
  const onDoneRef = useRef(onDone);

  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  useEffect(() => {
    claudePromise.then(() => {
      setClaudeDone(true);
    }).catch(() => {
      setClaudeDone(true);
    });
  }, [claudePromise]);

  // Typewriter animation
  useEffect(() => {
    if (animDone) return;
    if (lineIdx >= UNLOCK_LINES.length) { setAnimDone(true); return; }
    const line = UNLOCK_LINES[lineIdx];
    if (charIdx <= line.length) {
      const t = setTimeout(() => {
        setCurrent(line.slice(0, charIdx));
        setCharIdx((c) => c + 1);
      }, 22);
      return () => clearTimeout(t);
    }
    const delay = line === "Payment confirmed." ? 600 : 350;
    const t = setTimeout(() => {
      setVisible((v) => [...v, line]);
      setCurrent("");
      setCharIdx(0);
      setLineIdx((i) => i + 1);
    }, delay);
    return () => clearTimeout(t);
  }, [lineIdx, charIdx, animDone]);

  // Transition to report only when both done AND no error
  useEffect(() => {
    if (animDone && claudeDone && !hasError && !firedRef.current) {
      firedRef.current = true;
      const t = setTimeout(() => onDoneRef.current(), 400);
      return () => clearTimeout(t);
    }
  }, [animDone, claudeDone, hasError]);

  const waiting = animDone && !claudeDone;
  const showError = animDone && claudeDone && hasError;
  const isPermanent = retryCount >= 1;
  const isFinalLine = (s: string) => s === "Report unlocked.";

  return (
    <section className="view-fade-in relative z-10 mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 bg-[#f5f4f0] min-h-screen">
      <div className="rounded-xl border border-zinc-800 bg-[#0a0a0a] p-6 font-mono text-sm shadow-2xl sm:p-8">
        <div className="mb-4 flex items-center gap-2 border-b border-white/10 pb-3 text-xs uppercase tracking-wider text-white/60">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
          <span className="ml-3">idle-check // unlock.sh</span>
        </div>
        <div className="space-y-2">
          {visible.map((line, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-green-500">$</span>
              <span className={
                isFinalLine(line) ? "text-[#B22222]" :
                line === "Payment confirmed." ? "text-emerald-400" :
                "text-green-400"
              }>
                {line}
              </span>
            </div>
          ))}
          {!animDone && (
            <div className="flex gap-2">
              <span className="text-green-500">$</span>
              <span className="text-green-400">
                {current}
                <span className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-green-400 align-middle" />
              </span>
            </div>
          )}
          {waiting && (
            <div className="flex gap-2">
              <span className="text-green-500">$</span>
              <span className="flex items-center gap-1 text-yellow-400/80">
                Finalizing your report
                <span className="inline-flex gap-[3px] ml-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-yellow-400/80 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-yellow-400/80 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-yellow-400/80 animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Error state — shown below terminal after animation completes */}
      {showError && (
        <div className="view-fade-in mt-6 rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div className="flex-1">
              {isPermanent ? (
                <>
                  <p className="font-semibold text-zinc-900">Analysis failed twice — we'll refund your payment.</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    Something is wrong on our end. Reply to your receipt or email us and we'll refund you within 24 hours.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-zinc-900">Analysis failed — please try again.</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    The AI analysis didn't complete. Your payment was captured. One retry is available at no extra charge.
                  </p>
                </>
              )}
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=Idle Check analysis failed`}
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-red-700 hover:underline"
              >
                <Mail className="h-3.5 w-3.5" />
                {SUPPORT_EMAIL}
              </a>
            </div>
          </div>
          {!isPermanent && (
            <Button
              onClick={onRetry}
              className="mt-4 w-full bg-red-800 text-white hover:bg-red-700"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Try again
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
