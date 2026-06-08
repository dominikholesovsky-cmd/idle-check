import { useEffect, useState } from "react";
import { pingNhtsa } from "@/lib/api/pingNhtsa";

type Status = "checking" | "live" | "offline";

export function NhtsaStatus({ className = "" }: { className?: string }) {
  const [status, setStatus] = useState<Status>("checking");
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    pingNhtsa()
      .then((r) => {
        if (cancelled) return;
        setLatency(r.latency);
        setStatus(r.ok ? "live" : "offline");
      })
      .catch(() => {
        if (!cancelled) setStatus("offline");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const config =
    status === "live"
      ? { dot: "bg-emerald-500", ring: "bg-emerald-500/30", label: `NHTSA LIVE${latency ? ` · ${latency}ms` : ""}`, text: "text-emerald-700" }
      : status === "offline"
      ? { dot: "bg-zinc-400", ring: "bg-zinc-400/20", label: "NHTSA OFFLINE", text: "text-zinc-500" }
      : { dot: "bg-zinc-300", ring: "bg-zinc-300/30", label: "CHECKING NHTSA…", text: "text-muted-foreground" };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-condensed text-[10px] font-semibold uppercase tracking-wider ${config.text} ${className}`}
      title={status === "live" ? "Live connection to NHTSA recall database" : "Cannot reach NHTSA right now"}
    >
      <span className="relative inline-flex h-1.5 w-1.5">
        {status === "live" && (
          <span className={`absolute inset-0 inline-flex animate-ping rounded-full ${config.ring}`} />
        )}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${config.dot}`} />
      </span>
      {config.label}
    </span>
  );
}
