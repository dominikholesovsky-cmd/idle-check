import type { Recall } from "@/lib/ghost/types";

export function RecallSection({ recalls }: { recalls: Recall[] }) {
  return (
    <section className="mt-10 rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
      <h2 className="font-condensed text-sm font-semibold uppercase tracking-[0.14em] text-zinc-900">
        Official Recall Records
      </h2>
      <p className="mt-1 text-[13px] text-zinc-500">
        Sourced directly from the NHTSA database — these are federally documented safety issues for
        this exact make, model, and year.
      </p>

      <div className="mt-5 overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-gray-50 font-condensed text-[11px] uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Recall Date</th>
              <th className="px-4 py-2.5 font-semibold">Component</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {recalls.map((r) => (
              <tr key={r.id} className="bg-white">
                <td className="px-4 py-3 font-mono text-[12px] tabular-nums text-zinc-600">
                  {r.date}
                </td>
                <td className="px-4 py-3 text-zinc-700">{r.component}</td>
                <td className="px-4 py-3">
                  <span
                    className={`font-condensed text-[11px] font-semibold uppercase tracking-wider ${
                      r.status === "Open" ? "text-red-600" : "text-emerald-600"
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
