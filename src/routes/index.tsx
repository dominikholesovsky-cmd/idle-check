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
const ADMIN_BYPASS_CODE = "adminsef_135";

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

// ─── Demo mode ────────────────────────────────────────────────────────────────
const DEMO_ANALYSIS: AnalysisState = {
  vehicle: { make: "BMW", model: "330i", year: 2018, mileage: 94000, engineType: "2.0L I4 Turbo B48 248hp", vin: "WBA8E9G50JNU12345" },
  marketplace: "Facebook Marketplace",
  askingPrice: 18500,
  reportId: "demo-report",
  timestamp: Date.now(),
  unlocked: true,
  sellerRedFlags: [
    "Seller mentions 'just serviced' without providing receipts",
    "Asking price 12% above market average for this mileage and year",
    "Listed for 3 weeks with multiple price drops — suggests known issues",
  ],
  marketValueNote: "2018 BMW 330i with 94k miles typically sells for $16,200–$17,800 in this condition. Asking price of $18,500 is above market — use repair findings to justify offer of $15,500–$16,000.",
  recallSource: "nhtsa",
  recalls: [
    { id: "demo-recall-1", component: "ENGINE AND ENGINE COOLING", description: "The fuel injector may crack causing fuel leakage which increases the risk of fire.", date: "2019-03-15", status: "Remedied" },
  ],
  recommendation: {
    verdict: "negotiate",
    headline: "Negotiate Hard — Real Mechanical Concerns Found",
    summary: "This 2018 BMW 330i has several known weak points for the B48 engine platform that need addressing. The high-pressure fuel pump and timing chain tensioner are the critical items — both are documented issues on this engine family at this mileage. Total estimated repair exposure of $3,780–$7,900 gives you serious negotiating leverage. Open at $15,500 and justify every dollar with the inspection findings.",
    roadmap: [
      { urgency: "Immediate", label: "Fuel Pump + Timing Chain", reason: "Both are documented failure points on the B48 at this mileage — address before purchase or negotiate cost off price.", issueIds: ["hpfp_failure", "timing_chain_tensioner"] },
      { urgency: "Soon", label: "Valve Cover Gasket + Cooling System", reason: "Oil leak and coolant component age — budget $900–$1,600 within the first 6 months.", issueIds: ["valve_cover_gasket", "coolant_system"] },
      { urgency: "Monitor", label: "Brakes + Plugs", reason: "Maintenance items — verify service history and address at next service interval.", issueIds: ["brake_fluid", "spark_plugs"] },
    ],
  },
  issues: [
    { id: "hpfp_failure", label: "High-Pressure Fuel Pump Failure", category: "Engine & Drivetrain", severity: "HIGH", costMin: 800, costMax: 1400, partsCostMin: 425, partsCostMax: 600, labourHours: 3, urgency: "Immediate", explanation: "The N20/B48 engine family has a documented HPFP weakness. Symptoms include hard starts, rough idle, and hesitation under load. At 94k miles this is overdue for inspection.", parts: [{ name: "High-Pressure Fuel Pump", partNumber: "13-51-7-616-170", priceUsd: 450, source: "OEM Dealer" }, { name: "Fuel Pump Seal Kit", partNumber: "13-53-7-619-293", priceUsd: 60, source: "RockAuto" }] },
    { id: "timing_chain_tensioner", label: "Timing Chain Tensioner Wear", category: "Engine & Drivetrain", severity: "HIGH", costMin: 1200, costMax: 2200, partsCostMin: 515, partsCostMax: 820, labourHours: 7, urgency: "Immediate", explanation: "B48 engines have known timing chain tensioner issues before 100k miles. A cold-start rattle in the first 2–3 seconds is the key symptom. Ignoring this leads to chain slap and potential catastrophic engine damage.", parts: [{ name: "Timing Chain Kit", partNumber: "11-31-8-604-154", priceUsd: 550, source: "OEM Dealer" }, { name: "Chain Tensioner", partNumber: "11-31-7-590-955", priceUsd: 120, source: "RockAuto" }] },
    { id: "valve_cover_gasket", label: "Valve Cover Gasket Oil Leak", category: "Engine & Drivetrain", severity: "MED", costMin: 400, costMax: 700, partsCostMin: 85, partsCostMax: 130, labourHours: 2.5, urgency: "Soon", explanation: "BMW N20/B48 valve cover gaskets harden and crack between 80k–100k miles. Look for oil residue on top of the engine and a burning oil smell after driving.", parts: [{ name: "Valve Cover Gasket Set", partNumber: "11-12-7-570-764", priceUsd: 95, source: "OEM Dealer" }] },
    { id: "control_arm_bushings", label: "Front Control Arm Bushings", category: "Chassis & Suspension", severity: "MED", costMin: 600, costMax: 1100, partsCostMin: 290, partsCostMax: 420, labourHours: 2.5, urgency: "Soon", explanation: "F30 control arm bushings typically wear out between 80k–120k miles. Symptoms are vague steering, clunking over bumps, and uneven tire wear. Full front control arm replacement recommended.", parts: [{ name: "Front Control Arm Left", partNumber: "31-10-6-862-755", priceUsd: 175, source: "OEM Dealer" }, { name: "Front Control Arm Right", partNumber: "31-10-6-862-756", priceUsd: 175, source: "OEM Dealer" }] },
    { id: "coolant_system", label: "Coolant System Inspection", category: "Engine & Drivetrain", severity: "MED", costMin: 500, costMax: 900, partsCostMin: 120, partsCostMax: 180, labourHours: 3, urgency: "Soon", explanation: "BMW plastic coolant components — expansion tank, thermostat housing, water pump — are known failure points after 80k miles. Proactive replacement prevents roadside breakdowns.", parts: [{ name: "Expansion Tank", partNumber: "17-13-7-640-729", priceUsd: 75, source: "RockAuto" }, { name: "Thermostat", partNumber: "11-53-7-603-798", priceUsd: 65, source: "RockAuto" }] },
    { id: "brake_fluid", label: "Brake Fluid Service", category: "Engine & Drivetrain", severity: "LOW", costMin: 80, costMax: 150, partsCostMin: 20, partsCostMax: 30, labourHours: 0.5, urgency: "Monitor", explanation: "BMW recommends brake fluid replacement every 2 years regardless of mileage. Ask seller for service records. Fresh fluid costs $80–$150 at a shop.", parts: [] },
    { id: "spark_plugs", label: "Spark Plug Replacement", category: "Engine & Drivetrain", severity: "LOW", costMin: 200, costMax: 350, partsCostMin: 80, partsCostMax: 120, labourHours: 1, urgency: "Monitor", explanation: "At 94k miles spark plugs are likely original. BMW recommends replacement at 60k mile intervals. Fresh plugs improve fuel economy and throttle response.", parts: [{ name: "Spark Plug Set (4x)", partNumber: "12-12-0-037-607", priceUsd: 95, source: "OEM Dealer" }] },
  ],
};

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
  const [isDemo, setIsDemo] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const pendingEntryRef = useRef<AnalysisState | null>(null);
  const activeSessionRef = useRef<{ sessionId: string; entry: AnalysisState } | null>(null);
  const pendingShareIdRef = useRef<string | null>(null);
  const pendingSaveRef = useRef<{ sessionId: string; reportId: string; reportJson: Record<string, unknown> } | null>(null);

  // Bonus feature (email) must never block UX — 1 retry with a 3s delay, then just log.
  const attemptSendEmail = async (
    sessionId: string,
    reportJson: Record<string, unknown>,
    shareId: string,
    attempt = 1,
  ): Promise<void> => {
    try {
      await sendReportEmail({ data: { sessionId, reportJson, shareId } });
    } catch (err) {
      console.error(`sendReportEmail failed (attempt ${attempt}):`, err);
      if (attempt === 1) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        await attemptSendEmail(sessionId, reportJson, shareId, attempt + 1);
      }
    }
  };

  const attemptSaveAndEmail = async (
    sessionId: string,
    reportId: string,
    reportJson: Record<string, unknown>,
  ) => {
    pendingSaveRef.current = { sessionId, reportId, reportJson };
    try {
      const saved = await saveReport({ data: { sessionId, reportJson } });
      pendingSaveRef.current = null;
      pendingShareIdRef.current = saved.id;
      setShareId(saved.id);
      setSaveError(false);
      updateHistoryEntry(reportId, { shareId: saved.id });
      void attemptSendEmail(sessionId, reportJson, saved.id);
    } catch (err) {
      console.error("Save failed:", err);
      setSaveError(true);
    }
  };

  const handleRetrySave = () => {
    const pending = pendingSaveRef.current;
    if (!pending) return;
    void attemptSaveAndEmail(pending.sessionId, pending.reportId, pending.reportJson);
  };

  // Shared by the post-Stripe effect and handleRetry — builds the upgraded report
  // from Claude's result, persists it locally, then saves + emails it.
  const handleSuccessfulAnalysis = (
    entry: AnalysisState,
    sessionId: string,
    reportId: string,
    aiResult: { issues: Issue[]; sellerRedFlags?: string[]; marketValueNote?: string },
  ) => {
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
      void attemptSaveAndEmail(sessionId, reportId, upgraded as unknown as Record<string, unknown>);
    } else {
      console.log("0 issues from Claude, keeping procedural");
      setAnalysis((prev) => prev ? { ...prev, unlocked: true } : prev);
    }
  };

  useEffect(() => { setHistory(loadHistory()); }, []);

  // Demo mode: ?demo=true skips Stripe and loads pre-built report
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("demo") === "true") {
      setIsDemo(true);
      setAnalysis(DEMO_ANALYSIS);
      setPhase("report");
      window.scrollTo({ top: 0 });
    }
  }, []);

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

    const adminCode = params.get("admin");
    const bypassReportId = params.get("report_id");

    if (adminCode === ADMIN_BYPASS_CODE && bypassReportId) {
      window.history.replaceState({}, "", "/");
      const hist = loadHistory();
      const entry = hist.find((e) => e.reportId === bypassReportId);
      if (!entry) {
        console.error("Admin bypass: entry not found:", bypassReportId);
        return;
      }

      console.log("Admin bypass active — skipping Stripe verification");
      updateHistoryEntry(bypassReportId, { unlocked: true });
      setAnalysis({ ...entry, unlocked: true });
      setPhase("unlocking");
      setClaudeError(false);
      window.scrollTo({ top: 0 });

      const fakeSessionId = `admin-bypass-${Date.now()}`;
      activeSessionRef.current = { sessionId: fakeSessionId, entry };

      const promise = analyzeVehicle({
        data: {
          listingText: entry.listingText ?? "",
          make: entry.vehicle.make,
          model: entry.vehicle.model,
          year: entry.vehicle.year,
          engineType: entry.engineType,
          mileage: entry.vehicle.mileage,
          askingPrice: entry.askingPrice,
          sessionId: fakeSessionId,
        },
      })
        .then((aiResult) => {
          handleSuccessfulAnalysis(entry, fakeSessionId, bypassReportId, aiResult);
        })
        .catch((err) => {
          console.error("Admin bypass Claude error:", err);
          setClaudeError(true);
        });

      setClaudePromise(promise);
      return;
    }

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
          handleSuccessfulAnalysis(entry, sessionId, reportId, aiResult);
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
        handleSuccessfulAnalysis(entry, sessionId, entry.reportId, aiResult);
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
    setSaveError(false);
    pendingEntryRef.current = null;
    activeSessionRef.current = null;
    pendingSaveRef.current = null;
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
            isDemo={isDemo}
            saveError={saveError}
            onRetrySave={handleRetrySave}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}