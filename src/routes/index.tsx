import { useState, useEffect, useRef } from "react";
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
import { verifyStripeSession } from "@/lib/api/verifyStripeSession";
import { saveReport } from "@/lib/api/saveReport";
import { sendReportEmail } from "@/lib/api/sendReportEmail";
import { loadReportBySession } from "@/lib/api/loadReportBySession";
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
  listingText?: string;
  engineType?: string;
  shareId?: string;
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

const RESOLVED_PROMISE = Promise.resolve();

function Index() {
  const [phase, setPhase] = useState<Phase>("landing");
  const [analysis, setAnalysis] = useState<AnalysisState | null>(null);
  const [history, setHistory] = useState<AnalysisState[]>([]);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [animationReady, setAnimationReady] = useState(false);
  const [claudePromise, setClaudePromise] = useState<Promise<void>>(RESOLVED_PROMISE);
  const [claudeError, setClaudeError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [shareId, setShareId] = useState<string | null>(null);
  const pendingEntryRef = useRef<AnalysisState | null>(null);
  const activeSessionRef = useRef<{ sessionId: string; entry: AnalysisState } | null>(null);
  const pendingShareIdRef = useRef<string | null>(null);

  useEffect(() => { setHistory(loadHistory()); }, []);

  // Scanning → preview po animaci
  useEffect(() => {
    if (animationReady && pendingEntryRef.current) {
      const entry = pendingEntryRef.current;
      pendingEntryRef.current = null;
      setAnalysis(entry);
      saveToHistory(entry);
      setHistory(loadHistory());
      setPhase("preview");
      window.scrollTo({ top: 0 });
    }
  }, [animationReady]);

  // Po Stripe redirectu — zavolej Claude API
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const reportId = params.get("report_id");

    if (!sessionId || !reportId) return;

    void (async () => {
      // Guard: Supabase check — report already saved (refresh, revisit, cross-device)
      try {
        const existing = await loadReportBySession({ data: { sessionId } });
        if (existing?.shareId) {
          window.location.replace(`/report/${existing.shareId}`);
          return;
        }
      } catch {
        // Non-fatal — proceed with Claude
      }

      window.history.replaceState({}, "", "/");

      const hist = loadHistory();
      const entry = hist.find((e) => e.reportId === reportId);
      if (!entry) {
        console.error("Entry not found:", reportId);
        return;
      }

      console.log("Starting Claude for reportId:", reportId);

      // Ověř platbu přes Stripe API před voláním Claude
      try {
        const verification = await verifyStripeSession({ data: { sessionId } });
        if (!verification.paid) {
          console.error("Payment not verified for session:", sessionId);
          return;
        }
      } catch (err) {
        console.error("Stripe session verification failed:", err);
        return;
      }

      updateHistoryEntry(reportId, { unlocked: true });
      setAnalysis({ ...entry, unlocked: true });
      setPhase("unlocking");
      setClaudeError(false);
      window.scrollTo({ top: 0 });

      // Store context so retry can re-use same session + entry
      activeSessionRef.current = { sessionId, entry };

      const promise = analyzeVehicle({
        data: {
          listingText: entry.listingText ?? "",
          make: entry.vehicle.make,
          model: entry.vehicle.model,
          year: entry.vehicle.year,
          engineType: entry.engineType,
          mileage: entry.vehicle.mileage,
          askingPrice: entry.askingPrice,
          sessionId,
        },
      })
        .then(async (aiResult) => {
          console.log("Claude done, issues:", aiResult.issues.length);
          if (aiResult.issues.length > 0) {
            const newRecommendation = generateRecommendation(
              entry.vehicle,
              aiResult.issues,
              entry.askingPrice
            );
            const upgraded: AnalysisState = {
              ...entry,
              unlocked: true,
              issues: aiResult.issues,
              sellerRedFlags: aiResult.sellerRedFlags,
              marketValueNote: aiResult.marketValueNote,
              recommendation: newRecommendation,
            };
            setAnalysis(upgraded);
            updateHistoryEntry(reportId, {
              unlocked: true,
              issues: aiResult.issues,
              sellerRedFlags: aiResult.sellerRedFlags,
              marketValueNote: aiResult.marketValueNote,
              recommendation: newRecommendation,
            });
            try {
              const saved = await saveReport({ data: { sessionId, reportJson: upgraded as unknown as Record<string, unknown> } });
              pendingShareIdRef.current = saved.id;
              setShareId(saved.id);
              updateHistoryEntry(reportId, { shareId: saved.id });
              void sendReportEmail({ data: { sessionId, reportJson: upgraded as unknown as Record<string, unknown>, shareId: saved.id } });
            } catch (err) {
              console.error("Save failed:", err);
            }
          } else {
            console.log("0 issues from Claude, keeping procedural");
            setAnalysis((prev) => prev ? { ...prev, unlocked: true } : prev);
          }
        })
        .catch((err) => {
          console.error("Claude error:", err);
          setClaudeError(true);
        });

      setClaudePromise(promise);
    })();
  }, []);

  const handleAnalyze = async (data: LandingSubmit) => {
    setAnalyzeError(null);
    setAnimationReady(false);
    pendingEntryRef.current = null;

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
      const recallResult = await fetchRecalls({
        data: {
          vin: data.vin,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
        },
      });

      let recalls: Recall[] = [];
      let recallSource: AnalysisState["recallSource"] = "procedural";

      if (recallResult.recalls.length > 0) {
        recalls = recallResult.recalls;
        recallSource = recallResult.source as "vin" | "nhtsa";
      } else {
        recalls = generateRecalls(vehicle);
      }

      const issues = generateIssues(vehicle);
      const recommendation = generateRecommendation(vehicle, issues, data.askingPrice);

      pendingEntryRef.current = {
        vehicle, marketplace, askingPrice: data.askingPrice,
        issues, recalls, recommendation,
        timestamp: Date.now(), reportId,
        unlocked: false, recallSource,
        listingText: data.manualText,
        engineType: data.engineType,
      };

    } catch (err) {
      console.error("Analysis failed:", err);
      const issues = generateIssues(vehicle);
      const recalls = generateRecalls(vehicle);
      const recommendation = generateRecommendation(vehicle, issues, data.askingPrice);

      pendingEntryRef.current = {
        vehicle, marketplace, askingPrice: data.askingPrice,
        issues, recalls, recommendation,
        timestamp: Date.now(), reportId,
        unlocked: false, recallSource: "procedural",
        listingText: data.manualText,
        engineType: data.engineType,
      };
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

  const handleRetry = () => {
    const ctx = activeSessionRef.current;
    if (!ctx) return;
    const { sessionId, entry } = ctx;
    setClaudeError(false);
    setRetryCount((c) => c + 1);

    const promise = analyzeVehicle({
      data: {
        listingText: entry.listingText ?? "",
        make: entry.vehicle.make,
        model: entry.vehicle.model,
        year: entry.vehicle.year,
        engineType: entry.engineType,
        mileage: entry.vehicle.mileage,
        askingPrice: entry.askingPrice,
        sessionId,
        forceRetry: true,
      },
    })
      .then(async (aiResult) => {
        if (aiResult.issues.length > 0) {
          const newRecommendation = generateRecommendation(entry.vehicle, aiResult.issues, entry.askingPrice);
          const upgraded: AnalysisState = {
            ...entry,
            unlocked: true,
            issues: aiResult.issues,
            sellerRedFlags: aiResult.sellerRedFlags,
            marketValueNote: aiResult.marketValueNote,
            recommendation: newRecommendation,
          };
          setAnalysis(upgraded);
          updateHistoryEntry(entry.reportId, {
            unlocked: true,
            issues: aiResult.issues,
            sellerRedFlags: aiResult.sellerRedFlags,
            marketValueNote: aiResult.marketValueNote,
            recommendation: newRecommendation,
          });
          try {
            const saved = await saveReport({ data: { sessionId, reportJson: upgraded as unknown as Record<string, unknown> } });
            pendingShareIdRef.current = saved.id;
            setShareId(saved.id);
            updateHistoryEntry(entry.reportId, { shareId: saved.id });
            void sendReportEmail({ data: { sessionId, reportJson: upgraded as unknown as Record<string, unknown>, shareId: saved.id } });
          } catch (err) {
            console.error("Save failed:", err);
          }
        } else {
          setAnalysis((prev) => prev ? { ...prev, unlocked: true } : prev);
        }
      })
      .catch((err) => {
        console.error("Retry failed:", err);
        setClaudeError(true);
      });

    setClaudePromise(promise);
  };

  const goHome = () => {
    setPhase("landing");
    setAnalysis(null);
    setAnalyzeError(null);
    setAnimationReady(false);
    setClaudePromise(RESOLVED_PROMISE);
    setClaudeError(false);
    setRetryCount(0);
    setShareId(null);
    pendingEntryRef.current = null;
    activeSessionRef.current = null;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-[#f5f4f0] text-zinc-950">
      <Navbar onNewReport={phase !== "landing" ? goHome : undefined} />
      <main className="relative z-10 flex-1">
        {phase === "landing" && (
          <LandingView
            onSubmit={handleAnalyze}
            history={history}
            onLoadHistory={(rawEntry) => {
              const valid = validateAndMigrateEntry(rawEntry);
              if (valid) {
                setAnalysis(valid);
                setShareId(valid.shareId ?? null);
                setPhase(valid.unlocked ? "report" : "preview");
                window.scrollTo({ top: 0 });
              }
            }}
          />
        )}

        {phase === "scanning" && (
          <ScanningView
            onDone={() => setAnimationReady(true)}
            apiReady={true}
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
              const sid = pendingShareIdRef.current;
              pendingShareIdRef.current = null;
              if (sid) {
                window.location.replace(`/report/${sid}`);
              } else {
                // Fallback: no shareId (0 issues case or save failed)
                setPhase("report");
                window.scrollTo({ top: 0 });
              }
            }}
            claudePromise={claudePromise}
            hasError={claudeError}
            onRetry={handleRetry}
            retryCount={retryCount}
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
            shareId={shareId ?? undefined}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}