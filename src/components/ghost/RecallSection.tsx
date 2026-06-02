import type { Recall } from "@/lib/ghost/types";

export function RecallSection({ recalls }: { recalls: Recall[] }) {
  return (
    <section className="mt-10 rounded-xl border border-border bg-card p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] sm:p-6">
      <h2 className="font-condensed text-sm font-semibold uppercase tracking-[0.14em]">
        Official Recall Records
      </h2>
      <p className="mt-1 text-[13px] text-muted-foreground">
        Sourced directly from the NHTSA database — these are federally documented safety issues for
        this exact make, model, and year.
      </p>

      <div className="mt-5 overflow-hidden rounded-lg border border-border">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-secondary/60 font-condensed text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Recall Date</th>
              <th className="px-4 py-2.5 font-semibold">Component</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {recalls.map((r) => (
              <tr key={r.id} className="bg-card">
                <td className="px-4 py-3 font-mono text-[12px] tabular-nums text-foreground/80">
                  {r.date}
                </td>
                <td className="px-4 py-3">{r.component}</td>
                <td className="px-4 py-3">
                  <span
                    className={`font-condensed text-[11px] font-semibold uppercase tracking-wider ${
                      r.status === "Open" ? "text-primary" : "text-emerald-700"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[11px] text-muted-foreground">
        Recall data is pulled from the NHTSA public database. Always verify current recall status at
        nhtsa.gov.
      </p>
    </section>
  );
}
