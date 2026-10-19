import { createFileRoute, Link } from "@tanstack/react-router";
import { getSupabase } from "@/lib/supabaseBrowser";
import { ReportView } from "@/components/ghost/ReportView";
import { Footer } from "@/components/ghost/Footer";
import { Navbar } from "@/components/ghost/Navbar";
import type { AnalysisState } from "@/routes/index";

export const Route = createFileRoute("/report/$id")({
  head: () => ({
    meta: [{ title: "Shared Report — Idle Check" }],
  }),
  loader: async ({ params }) => {
    const { data, error } = await getSupabase()
      .from("reports")
      .select("report_json")
      .eq("id", params.id)
      .single();

    if (error || !data) return { report: null };
    return { report: data.report_json as AnalysisState };
  },
  validateSearch: (search: Record<string, unknown>): { from?: "my-reports" } =>
    search.from === "my-reports" ? { from: "my-reports" } : {},
  component: SharedReport,
});

function SharedReport() {
  const { report } = Route.useLoaderData();
  const { id } = Route.useParams();
  const { from } = Route.useSearch();
  const backProps = {
    showBack: true,
    backLabel: (from === "my-reports" ? "My reports" : "Home") as "My reports" | "Home",
    onBack: () => { window.location.href = from === "my-reports" ? "/#my-reports" : "/"; },
  };

  if (!report) {
    return (
      <div className="relative flex min-h-screen flex-col bg-background text-foreground">
        <Navbar {...backProps} onNewReport={() => { window.location.href = "/"; }} />
        <main className="flex flex-1 items-center justify-center px-4">
          <div className="text-center">
            <p className="text-lg font-semibold">Report not found</p>
            <p className="mt-1 text-sm text-muted-foreground">This link may have expired or is invalid.</p>
            <Link to="/" className="mt-4 inline-block text-sm text-primary hover:underline">
              ← Back to Idle Check
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      <Navbar {...backProps} onNewReport={() => { window.location.href = "/"; }} />
      <main className="relative z-10 flex-1">
        <ReportView
          vehicle={report.vehicle}
          marketplace={report.marketplace}
          askingPrice={report.askingPrice}
          issues={report.issues ?? []}
          recalls={report.recalls ?? []}
          recommendation={report.recommendation}
          sellerRedFlags={report.sellerRedFlags}
          marketValueNote={report.marketValueNote}
          savedToEmail={report.savedToEmail}
          marketValueLow={report.marketValueLow}
          marketValueHigh={report.marketValueHigh}
          recallSource={report.recallSource}
          onNewReport={() => { window.location.href = "/"; }}
          shareId={id}
          isSharedView
        />
      </main>
      <Footer />
    </div>
  );
}
