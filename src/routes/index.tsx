import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/ghost/Navbar";
import { Footer } from "@/components/ghost/Footer";
import { LandingView, type LandingSubmit } from "@/components/ghost/LandingView";
import { ScanningView } from "@/components/ghost/ScanningView";
import { FreePreviewView } from "@/components/ghost/FreePreviewView";
import { ReportView } from "@/components/ghost/ReportView";
import {
  detectMarketplace, generateIssues, generateRecalls,
  generateRecommendation, parseVehicle,
} from "@/lib/ghost/procedural";
import type { Issue, Recall, ReportRecommendation, Vehicle } from "@/lib/ghost/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Idle Check — Inspect any used car listing before you go see it" },
      { name: "description", content: "Paste any used car listing. Get the inspection checklist, repair cost ranges, NHTSA recalls, and a ready-to-send negotiation message — in seconds." },
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
  recommendation: ReportRecommendation;
  timestamp: number;
}

const STORAGE_KEY = "idle-check-history";

// Pomocná funkce, která zkontroluje a případně opraví starou strukturu z localStorage
function validateAndMigrateEntry(entry: any): AnalysisState | null {
  if (!entry || !entry.vehicle) return null;

  // Pokud chybí recommendation nebo v něm chybí klíč verdict, vygenerujeme ho znovu za běhu
  if (!entry.recommendation || !entry.recommendation.verdict) {
    try {
      const issues = entry.issues || [];
      const askingPrice = entry.askingPrice || 0;
      entry.recommendation = generateRecommendation(entry.vehicle, issues, askingPrice);
    } catch (err) {
      // Bezpečný fallback struktury, pokud by i generování selhalo
      entry.recommendation = {
        verdict: "negotiate",
        headline: "Review Needed",
        summary: "Please regenerate this report to view current recommendations.",
        roadmap: []
      };
    }
  }

  // Zajistíme, že pole nebudou undefined
  if (!Array.isArray(entry.issues)) entry.issues = [];
  if (!Array.isArray(entry.recalls)) entry.recalls = [];

  return entry as AnalysisState;
}

function loadHistory(): AnalysisState[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Projedeme historii a opravíme poškozené nebo staré záznamy
    return parsed
      .map(validateAndMigrateEntry)
      .filter((entry): entry is AnalysisState => entry !== null);
  } catch { 
    return []; 
  }
}

function saveToHistory(entry: AnalysisState) {
  try {
    const prev = loadHistory();
    // Uložíme pouze vyčištěná data
    const updated = [entry, ...prev].slice(0, 10);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
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
      text: data.manualText, make: data.make, model: data.model,
      year: data.year, engineType: data.engineType,
      mileage: data.mileage, vin: data.vin,
    });
    const marketplace = detectMarketplace(data.manualText);
    const issues = generateIssues(vehicle) || [];
    const recalls = generateRecalls(vehicle) || [];
    const recommendation = generateRecommendation(vehicle, issues, data.askingPrice);
    
    const entry: AnalysisState = {
      vehicle, marketplace, askingPrice: data.askingPrice,
      issues, recalls, recommendation, timestamp: Date.now(),
    };
    
    setAnalysis(entry);
    saveToHistory(entry);
    setHistory(loadHistory());
    setPhase("scanning");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goHome = () => { 
    setPhase("landing"); 
    setAnalysis(null); 
    window.scrollTo({ top: 0, behavior: "smooth" }); 
  };

  const handleLoadHistory = (rawEntry: any) => {
    // Před načtením z historie data striktně zvalidujeme a opravíme
    const validEntry = validateAndMigrateEntry(rawEntry);
    if (validEntry) {
      setAnalysis(validEntry);
      setPhase("report");
      window.scrollTo({ top: 0 });
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      <Navbar
        onLogoClick={phase !== "landing" ? goHome : undefined}
        showNewReport={phase === "report"}
        onNewReport={goHome}
      />
      <main className="relative z-10 flex-1">
        {phase === "landing" && (
          <LandingView 
            onSubmit={handleAnalyze} 
            history={history} 
            onLoadHistory={handleLoadHistory} 
          />
        )}
        
        {phase === "scanning" && (
          <ScanningView onDone={() => { setPhase("preview"); window.scrollTo({ top: 0 }); }} />
        )}
        
        {phase === "preview" && analysis && (
          <FreePreviewView 
            vehicle={analysis.vehicle} 
            issues={analysis.issues} 
            onUnlock={() => { setPhase("report"); window.scrollTo({ top: 0 }); }} 
          />
        )}
        
        {phase === "report" && analysis && (
          <ReportView
            vehicle={analysis.vehicle}
            marketplace={analysis.marketplace}
            askingPrice={analysis.askingPrice}
            issues={analysis.issues}
            recalls={analysis.recalls}
            recommendation={analysis.recommendation}
            onNewReport={goHome}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}