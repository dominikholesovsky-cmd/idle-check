import { useEffect, useState } from "react";

const SCAN_LINES = [
  "Reading listing text...",
  "Pulling NHTSA recall records...",
  "Matching known failure patterns...",
  "Estimating repair costs...",
  "Report ready.",
];

export function ScanningView({
  onDone,
  apiReady,
}: {
  onDone: () => void;
  apiReady: boolean;
}) {
  const [visible, setVisible] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [animDone, setAnimDone] = useState(false);

  useEffect(() => {
    if (animDone) return;
    if (lineIdx >= SCAN_LINES.length) {
      setAnimDone(true);
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
  }, [lineIdx, charIdx, animDone]);

  useEffect(() => {
    if (animDone && apiReady) {
      const t = setTimeout(onDone, 400);
      return () => clearTimeout(t);
    }
  }, [animDone, apiReady]);

  const waiting = animDone && !apiReady;
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
                Fetching live part prices
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