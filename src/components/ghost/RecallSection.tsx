import type { Recall } from "@/lib/ghost/types";

export function RecallSection({ recalls }: { recalls: Recall[] }) {
  return (
    <section className="mt-10 rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-[0_2px_24px_rgba(0,0,0,0.18)] sm:p-6">
      <h2 className="font-condensed text-sm font-semibold uppercase tracking-[0.14em] text-white">
        Official Recall Records
      </h2>
      <p className="mt-1 text-[13px] text-zinc-400">
        Sourced directly from the NHTSA database — these are federally documented safety issues for
        this exact make, model, and year.
      </p>

      <div className="mt-5 overflow-hidden rounded-lg border border-zinc-800">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-zinc-900 font-condensed text-[11px] uppercase tracking-wider text-zinc-300">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Recall Date</th>
              <th className="px-4 py-2.5 font-semibold">Component</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {recalls.map((r) => (
              <tr key={r.id} className="bg-zinc-950">
                <td className="px-4 py-3 font-mono text-[12px] tabular-nums text-zinc-300">
                  {r.date}
                </td>
                <td className="px-4 py-3 text-zinc-300">{r.component}</td>
                <td className="px-4 py-3">
                  <span
                    className={`font-condensed text-[11px] font-semibold uppercase tracking-wider ${
                      r.status === "Open" ? "text-red-400" : "text-emerald-400"
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

      <p className="mt-3 text-[11px] text-zinc-400">
        Recall data is pulled from the NHTSA public database. Always verify current recall status at
        nhtsa.gov.
      </p>
    </section>
  );
}
