import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/ghost/Navbar";
import { Footer } from "@/components/ghost/Footer";
import { LandingView, type LandingSubmit } from "@/components/ghost/LandingView";
import { ScanningView } from "@/components/ghost/ScanningView";
import { FreePreviewView } from "@/components/ghost/FreePreviewView";
import { ReportView } from "@/components/ghost/ReportView";
import { PaymentLoadingView } from "@/components/ghost/PaymentLoadingView";
import { analyzeVehicle } from "@/lib/api/analyzeVehicle";
import { fetchRecalls } from "@/lib/api/fetchRecalls";
import { createCheckoutSession } from "@/lib/api/createCheckoutSession";
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

type Phase = "landing" | "scanning" | "preview" | "unlocking" | "report";

export interface AnalysisState {
  vehicle: Vehicle;
  marketplace: string;
  askingPrice: number;
  issues: Issue[];
  recalls: Recall[];
  recommendation: ReportRecommendation;
  timestamp: number;
  reportId: string;
  unlocked: boolean;
  sellerRedFlags?: string[];
  marketValueNote?: string;
  recallSource?: "vin" | "nhtsa" | "procedural" | "none";
}

const STORAGE_KEY = "idle-check-history";

function generateReportId(): string {
  return `report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function validateAndMigrateEntry(entry: any): AnalysisState | null {
  if (!entry || !entry.vehicle) return null;
  if (!entry.recommendation || !entry.recommendation.verdict) {
    try {
      entry.recommendation = generateRecommendation(entry.vehicle, entry.issues || [], entry.askingPrice || 0);
    } catch {
      entry.recommendation = { verdict: "negotiate", headline: "Review Needed", summary: "Please regenerate this report.", roadmap: [] };
    }
  }
  if (!Array.isArray(entry.issues)) entry.issues = [];
  if (!Array.isArray(entry.recalls)) entry.recalls = [];
  if (!entry.reportId) entry.reportId = generateReportId();
  if (entry.unlocked === undefined) entry.unlocked = true;
  if (Array.isArray(entry.recalls)) {
    entry.recalls = entry.recalls.map((r: any) => ({
      ...r,
      date: r.date === "Invalid Date" ? "Unknown" : r.date,
    }));
  }
  return entry as AnalysisState;
}

function loadHistory(): AnalysisState[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(validateAndMigrateEntry).filter((e): e is AnalysisState => e !== null);
  } catch { return []; }
}

function saveToHistory(entry: AnalysisState) {
  try {
    const prev = loadHistory();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...prev].slice(0, 10)));
  } catch {}
}

function updateHistoryEntry(reportId: string, updates: Partial<AnalysisState>) {
  try {
    const prev = loadHistory();
    const updated = prev.map((e) => e.reportId === reportId ? { ...e, ...updates } : e);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

function Index() {
  const [phase, setPhase] = useState<Phase>("landing");
  const [analysis, setAnalysis] = useState<AnalysisState | null>(null);
  const [history, setHistory] = useState<AnalysisState[]>([]);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  useEffect(() => { setHistory(loadHistory()); }, []);

  // Handle Stripe redirect — show unlocking animation instead of jumping straight to report
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const reportId = params.get("report_id");

    if (sessionId && reportId) {
      window.history.replaceState({}, "", "/");

      const hist = loadHistory();
      const entry = hist.find((e) => e.reportId === reportId);
      if (entry) {
        const unlocked = { ...entry, unlocked: true };
        updateHistoryEntry(reportId, { unlocked: true });
        setAnalysis(unlocked);
        setPhase("unlocking");
        window.scrollTo({ top: 0 });
      }
    }
  }, []);

  const handleAnalyze = async (data: LandingSubmit) => {
    setAnalyzeError(null);

    const vehicle = parseVehicle({
      text: data.manualText, make: data.make, model: data.model,
      year: data.year, engineType: data.engineType,
      mileage: data.mileage, vin: data.vin,
    });
    const marketplace = detectMarketplace(data.manualText);
    const reportId = generateReportId();

    setPhase("scanning");
    window.scrollTo({ top: 0, behavior: "smooth" });

    try {
      const [aiResult, recallResult] = await Promise.allSettled([
        analyzeVehicle({
          data: {
            listingText: data.manualText,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            engineType: data.engineType,
            mileage: vehicle.mileage,
            askingPrice: data.askingPrice,
          },
        }),
        fetchRecalls({
          data: {
            vin: data.vin,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
          },
        }),
      ]);

      let issues: Issue[] = [];
      let sellerRedFlags: string[] = [];
      let marketValueNote = "";

      if (aiResult.status === "fulfilled" && aiResult.value.issues.length > 0) {
        issues = aiResult.value.issues;
        sellerRedFlags = aiResult.value.sellerRedFlags;
        marketValueNote = aiResult.value.marketValueNote;
      } else {
        issues = generateIssues(vehicle);
      }

      let recalls: Recall[] = [];
      let recallSource: AnalysisState["recallSource"] = "procedural";

      if (recallResult.status === "fulfilled" && recallResult.value.recalls.length > 0) {
        recalls = recallResult.value.recalls;
        recallSource = recallResult.value.source as "vin" | "nhtsa";
      } else {
        recalls = generateRecalls(vehicle);
      }

      const recommendation = generateRecommendation(vehicle, issues, data.askingPrice);

      const entry: AnalysisState = {
        vehicle, marketplace, askingPrice: data.askingPrice,
        issues, recalls, recommendation,
        timestamp: Date.now(),
        reportId,
        unlocked: false,
        sellerRedFlags,
        marketValueNote,
        recallSource,
      };

      setAnalysis(entry);
      saveToHistory(entry);
      setHistory(loadHistory());

    } catch (err) {
      console.error("Analysis failed:", err);
      const issues = generateIssues(vehicle);
      const recalls = generateRecalls(vehicle);
      const recommendation = generateRecommendation(vehicle, issues, data.askingPrice);

      const entry: AnalysisState = {
        vehicle, marketplace, askingPrice: data.askingPrice,
        issues, recalls, recommendation,
        timestamp: Date.now(),
        reportId,
        unlocked: false,
        recallSource: "procedural",
      };

      setAnalysis(entry);
      saveToHistory(entry);
      setHistory(loadHistory());
    }
  };

  const handleUnlock = async () => {
    if (!analysis) return;

    const vehicleLabel = `${analysis.vehicle.year ?? ""} ${analysis.vehicle.make} ${analysis.vehicle.model}`.trim();

    try {
      const result = await createCheckoutSession({
        data: {
          vehicleLabel,
          reportId: analysis.reportId,
          successUrl: window.location.origin,
          cancelUrl: window.location.origin,
        },
      });

      if (result?.sessionUrl) {
        window.location.href = result.sessionUrl;
      }
    } catch (err) {
      console.error("Stripe checkout failed:", err);
      setAnalyzeError("Payment unavailable. Please try again.");
    }
  };

  const goHome = () => {
    setPhase("landing");
    setAnalysis(null);
    setAnalyzeError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
            onLoadHistory={(rawEntry) => {
              const valid = validateAndMigrateEntry(rawEntry);
              if (valid) {
                setAnalysis(valid);
                setPhase(valid.unlocked ? "report" : "preview");
                window.scrollTo({ top: 0 });
              }
            }}
          />
        )}

        {phase === "scanning" && (
          <ScanningView
            onDone={() => {
              setPhase("preview");
              window.scrollTo({ top: 0 });
            }}
          />
        )}

        {phase === "preview" && analysis && (
          <FreePreviewView
            vehicle={analysis.vehicle}
            issues={analysis.issues}
            onUnlock={handleUnlock}
            paymentError={analyzeError}
          />
        )}

        {phase === "unlocking" && analysis && (
          <PaymentLoadingView
            onDone={() => {
              setPhase("report");
              window.scrollTo({ top: 0 });
            }}
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
            sellerRedFlags={analysis.sellerRedFlags}
            marketValueNote={analysis.marketValueNote}
            recallSource={analysis.recallSource}
            onNewReport={goHome}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}