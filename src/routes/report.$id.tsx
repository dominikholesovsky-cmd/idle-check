import { createFileRoute, Link } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { ReportView } from "@/components/ghost/ReportView";
import { Footer } from "@/components/ghost/Footer";
import { Navbar } from "@/components/ghost/Navbar";
import type { AnalysisState } from "@/routes/index";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

export const Route = createFileRoute("/report/$id")({
  head: () => ({
    meta: [{ title: "Shared Report — Idle Check" }],
  }),
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("reports")
      .select("report_json")
      .eq("id", params.id)
      .single();

    if (error || !data) return { report: null };
    return { report: data.report_json as AnalysisState };
  },
  component: SharedReport,
});

function SharedReport() {
  const { report } = Route.useLoaderData();
  const { id } = Route.useParams();

  if (!report) {
    return (
      <div className="relative flex min-h-screen flex-col bg-background text-foreground">
        <Navbar />
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
      <Navbar />
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
