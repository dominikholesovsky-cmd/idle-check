import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/ghost/Navbar";
import { Footer } from "@/components/ghost/Footer";
import { LandingView, type LandingSubmit } from "@/components/ghost/LandingView";
import { ScanningView } from "@/components/ghost/ScanningView";
import { FreePreviewView } from "@/components/ghost/FreePreviewView";
import { ReportView } from "@/components/ghost/ReportView";
import {
  detectMarketplace,
  generateIssues,
  generateRecalls,
  parseVehicle,
} from "@/lib/ghost/procedural";
import type { Issue, Recall, Vehicle } from "@/lib/ghost/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Idle Check — Inspect any used car listing before you go see it" },
      {
        name: "description",
        content:
          "Paste any used car listing. Get the inspection checklist, repair cost ranges, NHTSA recalls, and a ready-to-send negotiation message — in seconds.",
      },
      { property: "og:title", content: "Idle Check — Used car listing inspector" },
      {
        property: "og:description",
        content:
          "Paste any listing. Get the inspection checklist, repair costs, and negotiation script — before you drive out to see it.",
      },
    ],
  }),
  component: Index,
});

type Phase = "landing" | "scanning" | "preview" | "report";

export interface AnalysisState {
  vehicle: Vehicle;
  marketplace: string;
  askingPrice: number;
  issues: Issue[];
  recalls: Recall[];
  timestamp: number;
}

const STORAGE_KEY = "idle-check-history";
const MAX_HISTORY = 10;

function loadHistory(): AnalysisState[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToHistory(entry: AnalysisState) {
  try {
    const prev = loadHistory();
    const next = [entry, ...prev].slice(0, MAX_HISTORY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable — silently skip
  }
}

function Index() {
  const [phase, setPhase] = useState<Phase>("landing");
  const [analysis, setAnalysis] = useState<AnalysisState | null>(null);
  const [history, setHistory] = useState<AnalysisState[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const handleAnalyze = (data: LandingSubmit) => {
    const vehicle = parseVehicle({
      text: data.manualText,
      make: data.make,
      model: data.model,
      year: data.year,
    });
    const marketplace = detectMarketplace(data.manualText);
    const issues = generateIssues(vehicle);
    const recalls = generateRecalls(vehicle);
    const entry: AnalysisState = {
      vehicle,
      marketplace,
      askingPrice: data.askingPrice,
      issues,
      recalls,
      timestamp: Date.now(),
    };
    setAnalysis(entry);
    saveToHistory(entry);
    setHistory(loadHistory());
    setPhase("scanning");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleScanDone = () => {
    setPhase("preview");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUnlock = () => {
    setPhase("report");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNewReport = () => {
    setPhase("landing");
    setAnalysis(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLoadHistory = (entry: AnalysisState) => {
    setAnalysis(entry);
    setPhase("report");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      <Navbar
        onLogoClick={phase !== "landing" ? handleNewReport : undefined}
        showNewReport={phase === "report"}
        onNewReport={handleNewReport}
      />
      <main className="relative z-10 flex-1">
        {phase === "landing" && (
          <LandingView
            onSubmit={handleAnalyze}
            history={history}
            onLoadHistory={handleLoadHistory}
          />
        )}
        {phase === "scanning" && <ScanningView onDone={handleScanDone} />}
        {phase === "preview" && analysis && (
          <FreePreviewView
            vehicle={analysis.vehicle}
            issues={analysis.issues}
            onUnlock={handleUnlock}
          />
        )}
        {phase === "report" && analysis && (
          <ReportView
            vehicle={analysis.vehicle}
            marketplace={analysis.marketplace}
            askingPrice={analysis.askingPrice}
            issues={analysis.issues}
            recalls={analysis.recalls}
            onNewReport={handleNewReport}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}