import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/ghost/Navbar";
import { Footer } from "@/components/ghost/Footer";
import { LandingView, type LandingSubmit } from "@/components/ghost/LandingView";
import { ScanningPaywallView } from "@/components/ghost/ScanningPaywallView";
import { ReportView } from "@/components/ghost/ReportView";
import { detectMarketplace, generateIssues, parseVehicle } from "@/lib/ghost/procedural";
import type { Issue, Vehicle } from "@/lib/ghost/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ghost Inspector — AI Used Car Listing Analyzer" },
      {
        name: "description",
        content:
          "Scrape any US vehicle listing with AI. Get an instant inspection checklist, repair cost layout, and negotiation script.",
      },
      { property: "og:title", content: "Ghost Inspector — AI Used Car Listing Analyzer" },
      {
        property: "og:description",
        content:
          "Scrape any US vehicle listing with AI. Get an instant inspection checklist, repair cost layout, and negotiation script.",
      },
    ],
  }),
  component: Index,
});

type Phase = "landing" | "scanning" | "report";

interface AnalysisState {
  vehicle: Vehicle;
  marketplace: string;
  askingPrice: number;
  issues: Issue[];
}

function Index() {
  const [phase, setPhase] = useState<Phase>("landing");
  const [analysis, setAnalysis] = useState<AnalysisState | null>(null);

  const handleAnalyze = (data: LandingSubmit) => {
    const vehicle = parseVehicle({
      url: data.url,
      text: data.manualText,
      make: data.make,
      model: data.model,
      year: data.year,
    });
    const marketplace = detectMarketplace(data.url);
    const issues = generateIssues(vehicle);
    setAnalysis({ vehicle, marketplace, askingPrice: data.askingPrice, issues });
    setPhase("scanning");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUnlock = () => {
    setPhase("report");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1">
        {phase === "landing" && <LandingView onSubmit={handleAnalyze} />}
        {phase === "scanning" && <ScanningPaywallView onUnlock={handleUnlock} />}
        {phase === "report" && analysis && (
          <ReportView
            vehicle={analysis.vehicle}
            marketplace={analysis.marketplace}
            askingPrice={analysis.askingPrice}
            issues={analysis.issues}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}
