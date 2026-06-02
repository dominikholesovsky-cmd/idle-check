import { useEffect, useState } from "react";

const SCAN_LINES = [
  "Reading listing text...",
  "Extracting vehicle identity — make, model, year, trim...",
  "Scanning seller language for evasive patterns...",
  "Pulling NHTSA recall records for this model year...",
  "Matching against known failure patterns for this platform...",
  "Estimating US repair costs at $120/hr labor rate...",
  "Drafting your negotiation opening...",
  "Report ready.",
];

export function ScanningView({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [done, setDone] = useState(false);

  // Typewriter effect
  useEffect(() => {
    if (done) return;
    if (lineIdx >= SCAN_LINES.length) {
      setDone(true);
      return;
    }
    const line = SCAN_LINES[lineIdx];
    if (charIdx <= line.length) {
      const t = setTimeout(() => {
        setCurrent(line.slice(0, charIdx));
        setCharIdx((c) => c + 1);
      }, 18);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setVisible((v) => [...v, line]);
      setCurrent("");
      setCharIdx(0);
      setLineIdx((i) => i + 1);
    }, 400);
    return () => clearTimeout(t);
  }, [lineIdx, charIdx, done]);

  // Transition to next view after done
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(onDone, 600);
    return () => clearTimeout(t);
  }, [done]);

  const isFinalLine = (s: string) => s.trim() === "Report ready.";

  return (
    <section className="view-fade-in relative z-10 mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="rounded-xl border border-border bg-[#0a0a0a] p-6 font-mono text-sm shadow-2xl sm:p-8">
        <div className="mb-4 flex items-center gap-2 border-b border-white/10 pb-3 text-xs uppercase tracking-wider text-white/60">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
          <span className="ml-3">idle-check // analysis.sh</span>
        </div>
        <div className="space-y-2">
          {visible.map((line, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-green-500">$</span>
              <span className={isFinalLine(line) ? "text-[#B22222]" : "text-green-400"}>
                {line}
              </span>
            </div>
          ))}
          {!done && (
            <div className="flex gap-2">
              <span className="text-green-500">$</span>
              <span className="text-green-400">
                {current}
                <span className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-green-400 align-middle" />
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}