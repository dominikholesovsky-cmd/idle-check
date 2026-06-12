import { useEffect, useRef, useState } from "react";

const UNLOCK_LINES = [
  "Verifying payment with Stripe...",
  "Payment confirmed.",
  "Decrypting full analysis...",
  "Loading repair cost breakdown...",
  "Calculating negotiation leverage...",
  "Preparing your negotiation script...",
  "Report unlocked.",
];

export function PaymentLoadingView({
  onDone,
  claudePromise,
}: {
  onDone: () => void;
  claudePromise: Promise<void>;
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

  // Poslouchej na Claude Promise
  useEffect(() => {
    claudePromise.then(() => {
      console.log("claudePromise resolved");
      setClaudeDone(true);
    }).catch(() => {
      console.log("claudePromise rejected — using procedural");
      setClaudeDone(true);
    });
  }, [claudePromise]);

  // Typewriter animace
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

  // Přejdi na report až jsou hotové obě podmínky
  useEffect(() => {
    if (animDone && claudeDone && !firedRef.current) {
      firedRef.current = true;
      console.log("Both done — calling onDone");
      const t = setTimeout(() => onDoneRef.current(), 400);
      return () => clearTimeout(t);
    }
  }, [animDone, claudeDone]);

  const waiting = animDone && !claudeDone;
  const isFinalLine = (s: string) => s === "Report unlocked.";

  return (
    <section className="view-fade-in relative z-10 mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 bg-[#f5f4f0] min-h-screen">
      <div className="rounded-xl border border-border bg-[#0a0a0a] p-6 font-mono text-sm shadow-2xl sm:p-8">
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
    </section>
  );
}