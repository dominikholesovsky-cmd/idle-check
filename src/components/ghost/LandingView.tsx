import { useState, useEffect, useRef, type ReactNode } from "react";
import { ChevronDown, ChevronRight, Clock } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { CarIllustration } from "./CarIllustration";
import { MISSING_CAR_MAILTO, PRICE_USD } from "@/lib/ghost/constants";
import type { AnalysisState } from "@/routes/index";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    global: {
      fetch: (url, options) =>
        fetch(url, { ...options, signal: AbortSignal.timeout(10000) }),
    },
  }
);

export interface LandingSubmit {
  manualText: string;
  make: string;
  model: string;
  year: string;
  askingPrice: number;
  engineType?: string;
  mileage?: string;
  vin?: string;
}

interface Make { id: number; slug: string; display_name: string; }
interface Model { id: number; slug: string; display_name: string; }
interface Engine { id: number; display_name: string; }

interface LandingViewProps {
  onSubmit: (data: LandingSubmit) => void;
  history: AnalysisState[];
  onLoadHistory: (entry: AnalysisState) => void;
}

// Plain text wordmarks. Drop official SVG logos into `logo` later; never hand-draw them.
const MARKETPLACES: { name: string; logo?: ReactNode }[] = [
  { name: "Facebook Marketplace" },
  { name: "eBay Motors" },
  { name: "Craigslist" },
  { name: "AutoTrader" },
  { name: "OfferUp" },
  { name: "CarGurus" },
];

const HOW_IT_WORKS: { title: string; body: string; icon: ReactNode }[] = [
  {
    title: "1 · Paste the listing",
    body: "The VIN fills in the rest.",
    icon: (
      <>
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h4" />
      </>
    ),
  },
  {
    title: "2 · See 3 findings free",
    body: "Known weak points for that model and year.",
    icon: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </>
    ),
  },
  {
    title: `3 · Unlock for $${PRICE_USD.toFixed(2)}`,
    body: "Full findings, red flags, verdict and a message for the seller.",
    icon: (
      <>
        <rect x="4" y="11" width="16" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 7.5-2" />
      </>
    ),
  },
];

const LABEL =
  "block font-condensed text-[13px] font-semibold uppercase tracking-[0.08em] text-text-2";
const FIELD =
  "w-full rounded-field border border-input-border bg-white px-3.5 text-ink placeholder:text-muted-text transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";
const HINT = "mt-1.5 text-[13px] leading-[1.4] text-muted-text";
const PRIMARY_BTN =
  "flex h-14 w-full items-center justify-center gap-2 rounded-field bg-primary text-[17px] font-bold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
const TEXT_LINK =
  "inline-flex min-h-[44px] items-center rounded text-[15px] font-semibold text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
const ACCENT_LINK =
  "font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// Two-seat cars get the roadster artwork on the confirmed-car card; everything else the sedan.
function bodyFor(model: string): "roadster" | "sedan" {
  return /(mx-?5|miata|\bz[34]\b|s2000|boxster|spider|roadster|\bslk\b)/i.test(model) ? "roadster" : "sedan";
}

function Select({
  id, value, onChange, options, placeholder, disabled, loading,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
        className={`${FIELD} mt-1.5 h-[52px] appearance-none pr-9 text-[17px] ${
          disabled || loading ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        } ${!value ? "text-muted-text" : "text-ink"}`}
      >
        <option value="" disabled>
          {loading ? "Loading..." : placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 mt-[3px] h-4 w-4 -translate-y-1/2 text-muted-text"
      />
    </div>
  );
}

function SamplePin({ label, left, top, topLg }: { label: string; left: string; top: string; topLg: string }) {
  return (
    <span
      className={`absolute inline-flex h-[26px] -translate-x-1/2 -translate-y-1/2 items-center whitespace-nowrap rounded-full border border-input-border bg-white px-2.5 text-[13px] font-semibold lg:h-[30px] lg:px-3 lg:text-sm ${left} ${top} ${topLg}`}
    >
      {label}
    </span>
  );
}

// Static marketing content. Intentionally not driven by props or state.
function SampleCard({ className = "" }: { className?: string }) {
  return (
    <section
      aria-label="Sample report"
      className={`rounded-[18px] border border-panel-border bg-panel p-3.5 lg:rounded-hero lg:p-[22px] ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex h-6 items-center rounded-full border border-panel-border bg-white px-[9px] font-condensed text-xs font-bold uppercase tracking-[0.12em] lg:h-[26px] lg:px-2.5">
          Sample report
        </span>
        <span className="font-mono text-xs text-text-2 lg:text-[13px]">
          2003 Mazda MX-5 Miata<span className="hidden lg:inline"> · 80,000 mi</span>
        </span>
      </div>

      <div className="relative mt-1.5 aspect-[520/224] w-full lg:mt-2.5">
        <CarIllustration body="roadster" className="h-full w-full" />
        <SamplePin label="Rust check" left="left-[17.7%]" top="top-[40%]" topLg="lg:top-[32.1%]" />
        <SamplePin label="Soft top" left="left-[42.7%]" top="top-[13%]" topLg="lg:top-[11.6%]" />
        <SamplePin label="Timing chain" left="left-[76.9%]" top="top-[40%]" topLg="lg:top-[31.3%]" />
      </div>

      {/* Mobile stats strip */}
      <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 rounded-xl border border-panel-border bg-white px-3 py-2.5 lg:hidden">
        <span className="inline-flex h-[22px] items-center rounded bg-sev-med px-2 font-condensed text-xs font-bold tracking-[0.08em] text-sev-med-fg">
          NEGOTIATE
        </span>
        <span className="font-mono text-[13px] font-bold">$2,290–5,220 repairs</span>
        <span className="text-[13px] text-muted-text">· 5 red flags</span>
      </div>

      {/* Desktop stats */}
      <div className="mt-3.5 hidden grid-cols-3 overflow-hidden rounded-card-sm border border-panel-border bg-white lg:grid">
        <div className="px-4 py-3.5">
          <div className="font-condensed text-xs font-semibold uppercase tracking-[0.1em] text-muted-text">Verdict</div>
          <span className="mt-2 inline-flex h-6 items-center rounded bg-sev-med px-2 font-condensed text-[13px] font-bold tracking-[0.08em] text-sev-med-fg">
            NEGOTIATE
          </span>
        </div>
        <div className="border-l border-card-border px-4 py-3.5">
          <div className="font-condensed text-xs font-semibold uppercase tracking-[0.1em] text-muted-text">Repairs</div>
          <div className="mt-2 font-mono text-sm font-bold">$2,290–5,220</div>
        </div>
        <div className="border-l border-card-border px-4 py-3.5">
          <div className="font-condensed text-xs font-semibold uppercase tracking-[0.1em] text-muted-text">Red flags</div>
          <div className="mt-1.5 font-mono text-xl font-bold">5</div>
        </div>
      </div>
      <p className="mx-0.5 mt-2.5 hidden text-[13px] text-muted-text lg:block">
        Output from a real test listing. Yours takes about a minute.
      </p>
    </section>
  );
}

export function LandingView({ onSubmit, history, onLoadHistory }: LandingViewProps) {
  const [makes, setMakes] = useState<Make[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [engines, setEngines] = useState<Engine[]>([]);

  const [loadingMakes, setLoadingMakes] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingEngines, setLoadingEngines] = useState(false);

  const [selectedMakeId, setSelectedMakeId] = useState<number | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [engineType, setEngineType] = useState("");
  const [year, setYear] = useState("");
  const [mileage, setMileage] = useState("");
  const [vin, setVin] = useState("");
  const [askingPrice, setAskingPrice] = useState("");
  const [manualText, setManualText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [vinLoading, setVinLoading] = useState(false);
  const [vinError, setVinError] = useState<string | null>(null);
  const [pendingVinDecode, setPendingVinDecode] = useState<{ model: string; year: string } | null>(null);
  const [vinDecoded, setVinDecoded] = useState(false);
  const [vinDecodeResult, setVinDecodeResult] = useState<{ make: string; model: string; year: string } | null>(null);

  const [step, setStep] = useState<1 | 2>(1);
  const [manualOpen, setManualOpen] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const vinRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const prevStep = useRef(step);

  // Step change: scroll the card into view and move focus to its first field.
  useEffect(() => {
    if (prevStep.current === step) return;
    prevStep.current = step;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    cardRef.current?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
    (step === 1 ? vinRef : priceRef).current?.focus({ preventScroll: true });
  }, [step]);

  // Load makes on mount (with retry)
  useEffect(() => {
    let retries = 0;
    const fetchMakes = async () => {
      const { data, error } = await supabase
        .from("makes")
        .select("id, slug, display_name")
        .order("display_name");
      if (error && retries < 3) {
        retries++;
        setTimeout(fetchMakes, 1000 * retries);
        return;
      }
      setMakes(data ?? []);
      setLoadingMakes(false);
    };
    fetchMakes();
  }, []);

  // Load models when make changes
  useEffect(() => {
    if (!selectedMakeId) { setModels([]); return; }
    setLoadingModels(true);
    setModels([]);
    setEngines([]);
    supabase
      .from("models")
      .select("id, slug, display_name")
      .eq("make_id", selectedMakeId)
      .order("display_name")
      .then(({ data }) => {
        setModels(data ?? []);
        setLoadingModels(false);
      });
  }, [selectedMakeId]);

  // Load engines when model changes
  useEffect(() => {
    if (!selectedModelId) { setEngines([]); return; }
    setLoadingEngines(true);
    setEngines([]);
    supabase
      .from("engines")
      .select("id, display_name")
      .eq("model_id", selectedModelId)
      .order("horsepower", { ascending: false })
      .then(({ data }) => {
        setEngines(data ?? []);
        setLoadingEngines(false);
      });
  }, [selectedModelId]);

  // Apply pending VIN decode once models finish loading
  useEffect(() => {
    if (!pendingVinDecode || loadingModels || models.length === 0) return;
    const { model: nhtsaModel, year: nhtsaYear } = pendingVinDecode;
    setPendingVinDecode(null);

    const matched = models.find(
      (m) => m.display_name.toLowerCase() === nhtsaModel.toLowerCase()
    );
    if (matched) {
      handleModelChange(matched.display_name);
      setVinDecoded(true);
    } else {
      // Step 2 has no model picker, so send the user to the manual pickers instead of a dead end.
      setVinDecodeResult(null);
      setVinError(`"${nhtsaModel}" not in our database — select model manually.`);
      setManualOpen(true);
    }
    if (nhtsaYear) setYear(nhtsaYear);
  }, [models, loadingModels, pendingVinDecode]);

  const decodeVin = async (rawVin: string) => {
    setVinError(null);
    setVinDecoded(false);
    setVinDecodeResult(null);
    setVinLoading(true);
    try {
      const res = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${rawVin}?format=json`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (!res.ok) throw new Error("NHTSA API unavailable");
      const json = await res.json();

      const get = (variable: string) =>
        (json.Results as { Variable: string; Value: string | null }[]).find(
          (r) => r.Variable === variable
        )?.Value ?? "";

      const nhtsaMake = get("Make");
      const nhtsaModel = get("Model");
      const nhtsaYear = get("Model Year");
      const errorCode = get("Error Code");

      if (errorCode !== "0" || !nhtsaMake || !nhtsaModel) {
        setVinError("VIN not found — check for typos or enter vehicle details manually.");
        setVinLoading(false);
        return;
      }

      const matchedMake = makes.find(
        (m) => m.display_name.toLowerCase() === nhtsaMake.toLowerCase()
      );

      if (matchedMake) {
        // Show green feedback immediately from NHTSA data — independent of model loading
        setVinDecodeResult({ make: nhtsaMake, model: nhtsaModel, year: nhtsaYear });
        handleMakeChange(matchedMake.display_name);
        setPendingVinDecode({ model: nhtsaModel, year: nhtsaYear });
      } else {
        if (nhtsaYear) setYear(nhtsaYear);
        setVinError(`"${nhtsaMake}" not in our database — select make/model manually.`);
        setManualOpen(true);
      }
    } catch {
      setVinError("Could not decode VIN — check your connection and try again.");
    } finally {
      setVinLoading(false);
    }
  };

  const handleMakeChange = (val: string) => {
    const found = makes.find((m) => m.display_name === val);
    setMake(val);
    setSelectedMakeId(found?.id ?? null);
    setModel("");
    setSelectedModelId(null);
    setEngineType("");
  };

  const handleModelChange = (val: string) => {
    const found = models.find((m) => m.display_name === val);
    setModel(val);
    setSelectedModelId(found?.id ?? null);
    setEngineType("");
  };

  const priceNum = Number(askingPrice);
  const priceValid = askingPrice !== "" && !Number.isNaN(priceNum) && priceNum > 0 && priceNum <= 1_000_000;
  const hasVehicleBase = make && model && year;
  const canContinue = !!hasVehicleBase && !vinLoading;

  const goToStep2 = () => {
    if (!canContinue) return;
    setError(null);
    setStep(2);
  };

  const handleSubmit = () => {
    if (!hasVehicleBase) { setError("Select Make, Model, and enter Year."); return; }
    if (!priceValid) {
      setError("Asking price is required to generate your negotiation offer.");
      priceRef.current?.focus();
      return;
    }
    setError(null);
    onSubmit({
      manualText: manualText.trim() || `${year} ${make} ${model} ${engineType}`.trim(),
      make, model, year,
      askingPrice: priceNum,
      engineType: engineType || undefined,
      mileage: mileage || undefined,
      vin: vin || undefined,
    });
  };

  const decodedSummary = vinDecodeResult
    ? `${vinDecodeResult.year} ${vinDecodeResult.make} ${vinDecodeResult.model}`.trim()
    : null;
  const decodedByVin = vinDecoded && !!vinDecodeResult;
  const carName = `${year} ${make} ${model}`.trim();

  const recentReports = history.length > 0 && (
    <section
      aria-label="Recent reports"
      className="mt-4 rounded-card border border-card-border bg-white p-3.5"
    >
      <div className="mb-2 flex items-center gap-2 px-1">
        <Clock aria-hidden="true" className="h-3.5 w-3.5 text-muted-text" />
        <h2 className="font-condensed text-[13px] font-bold uppercase tracking-[0.12em] text-muted-text">
          Recent Reports
        </h2>
      </div>
      <ul className="space-y-1.5">
        {history.slice(0, 5).map((entry, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => onLoadHistory(entry)}
              className="group flex min-h-[44px] w-full items-center justify-between rounded-lg border border-card-border bg-white px-3 py-2 text-left transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className="min-w-0">
                <span className="block text-[15px] font-medium text-ink">
                  {entry.vehicle.year} {entry.vehicle.make} {entry.vehicle.model}
                  {entry.vehicle.trim ? ` (${entry.vehicle.trim})` : ""}
                </span>
                <span className="block text-[13px] text-muted-text">
                  ${entry.askingPrice.toLocaleString()} · {entry.marketplace} · {timeAgo(entry.timestamp)}
                </span>
              </span>
              <ChevronRight
                aria-hidden="true"
                className="ml-3 h-4 w-4 shrink-0 text-muted-text transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
              />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );

  const stepHeader = (
    <div className="flex items-center justify-between">
      <span className="font-condensed text-[13px] font-bold uppercase tracking-[0.12em] text-primary">
        Step {step} of 2
      </span>
      <div className="flex gap-1.5" aria-hidden="true">
        <span className="h-1 w-9 rounded-sm bg-primary lg:w-10" />
        <span className={`h-1 w-9 rounded-sm lg:w-10 ${step === 2 ? "bg-primary" : "bg-card-border"}`} />
      </div>
    </div>
  );

  const vinDescribedBy = ["vin-help", vinError ? "vin-error" : decodedSummary ? "vin-status" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      className="relative z-10 min-h-screen text-ink"
      style={{
        backgroundColor: "#f5f4f0",
        backgroundImage: "radial-gradient(circle, #c8c4bc 0.8px, transparent 0.8px)",
        backgroundSize: "20px 20px",
      }}
    >
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {step === 1 ? "Step 1 of 2: the car" : "Step 2 of 2: the listing"}
      </p>

      {step === 1 ? (
        <div className="mx-auto max-w-[1120px] px-4 pb-10 pt-5 lg:px-6 lg:pt-10">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,540px)] lg:gap-x-12 lg:gap-y-0">

            {/* Hero */}
            <div className="lg:col-start-1 lg:row-start-1">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex h-7 items-center rounded-full border border-card-border bg-chip px-3 font-condensed text-[13px] font-bold uppercase tracking-[0.12em] text-primary">
                  Free preview · No account
                </span>
                <a
                  href="/?demo=true"
                  className="inline-flex h-11 items-center rounded-lg border border-card-border bg-white px-3.5 font-condensed text-sm font-semibold uppercase tracking-[0.06em] text-ink transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Sample report
                </a>
              </div>
              <h1 className="mt-3 font-condensed text-[34px] font-bold uppercase leading-none tracking-[0.005em] lg:mt-[18px] lg:text-[56px] lg:leading-[0.98]">
                Know what you're buying before you show up
              </h1>
              <p className="mt-2.5 max-w-[480px] text-[15px] leading-[1.45] text-muted-text lg:mt-4 lg:text-lg lg:leading-normal">
                Paste a used car listing. Get repair costs, NHTSA recalls and a negotiation script
                <span className="hidden lg:inline"> before you drive out to see it</span>.
              </p>
            </div>

            <SampleCard className="lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-center" />

            {/* Step 1 card */}
            <div className="lg:col-start-1 lg:row-start-2 lg:mt-[26px]">
              <div
                ref={cardRef}
                className="scroll-mt-20 rounded-card border border-card-border bg-white p-[18px] lg:p-6"
              >
                {stepHeader}
                <label htmlFor="vin" className="mt-3 block text-xl font-bold lg:mt-3.5">
                  Have a VIN? Start here.
                </label>
                <p className="mt-0.5 text-[15px] leading-[1.45] text-muted-text">
                  We'll fill in make, model and year automatically.
                </p>

                <div className="mt-3 grid lg:mt-3.5 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-x-2.5">
                  <div className="relative">
                    <input
                      id="vin"
                      ref={vinRef}
                      value={vin}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "");
                        setVin(val);
                        setVinError(null);
                        setVinDecoded(false);
                        if (val.length === 17) decodeVin(val);
                      }}
                      onBlur={() => {
                        if (vin.length === 17 && !vinDecoded && !vinLoading) decodeVin(vin);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          goToStep2();
                        }
                      }}
                      placeholder="e.g. JN1AZ4EH0FM123456"
                      maxLength={17}
                      autoComplete="off"
                      autoCapitalize="characters"
                      spellCheck={false}
                      aria-describedby={vinDescribedBy}
                      aria-invalid={vinError ? true : undefined}
                      className={`${FIELD} h-14 pr-11 font-mono text-base tracking-[0.04em] lg:tracking-[0.06em] ${
                        vinError
                          ? "border-primary"
                          : decodedSummary
                          ? "border-success"
                          : ""
                      }`}
                    />
                    {vinLoading && (
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
                        <svg
                          aria-hidden="true"
                          className="h-4 w-4 animate-spin text-muted-text motion-reduce:animate-none"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                      </span>
                    )}
                  </div>

                  <div className="lg:col-span-2 lg:row-start-2" id="vin-help">
                    <p className={HINT}>
                      Found on the dashboard (driver's side), door jamb sticker, or insurance card.
                    </p>
                    {vinLoading && (
                      <p role="status" className="mt-1.5 text-[13px] font-medium text-muted-text">
                        Checking VIN…
                      </p>
                    )}
                    {vin.length > 0 && vin.length < 17 && !vinLoading && (
                      <p className="mt-1 text-[13px] text-muted-text">{17 - vin.length} more characters</p>
                    )}
                    {decodedSummary && !vinError && (
                      <p id="vin-status" role="status" className="mt-1.5 text-[13px] font-semibold text-success">
                        ✓ {decodedSummary} decoded
                      </p>
                    )}
                    {vinError && (
                      <p id="vin-error" role="alert" className="mt-1.5 text-[13px] font-semibold text-primary-ink">
                        ✗ {vinError}
                      </p>
                    )}
                  </div>

                  {manualOpen && (
                    <div id="manual-pickers" className="mt-3.5 grid gap-3.5 lg:col-span-2 lg:row-start-3 lg:grid-cols-2">
                      <div>
                        <label htmlFor="make" className={LABEL}>Make</label>
                        <Select
                          id="make"
                          value={make}
                          onChange={handleMakeChange}
                          options={makes.map((m) => ({ value: m.display_name, label: m.display_name }))}
                          placeholder="Select make..."
                          loading={loadingMakes}
                        />
                      </div>
                      <div>
                        <label htmlFor="model" className={LABEL}>Model</label>
                        <Select
                          id="model"
                          value={model}
                          onChange={handleModelChange}
                          options={models.map((m) => ({ value: m.display_name, label: m.display_name }))}
                          placeholder={make ? "Select model..." : "Select make first"}
                          disabled={!make}
                          loading={loadingModels}
                        />
                      </div>
                      <div>
                        <label htmlFor="year" className={LABEL}>Year</label>
                        <input
                          id="year"
                          type="number"
                          inputMode="numeric"
                          value={year}
                          onChange={(e) => setYear(e.target.value)}
                          placeholder="e.g. 2004"
                          min={1970}
                          max={2026}
                          className={`${FIELD} mt-1.5 h-[52px] text-[17px]`}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={goToStep2}
                    disabled={!canContinue}
                    className={`${PRIMARY_BTN} mt-3.5 ${
                      manualOpen
                        ? "lg:col-span-2 lg:row-start-4"
                        : "lg:col-start-2 lg:row-start-1 lg:mt-0 lg:w-auto lg:px-[26px]"
                    }`}
                  >
                    Continue
                    <svg
                      aria-hidden="true"
                      width="18" height="18" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </button>
                </div>

                <div className="mt-1.5 flex flex-col items-center gap-x-[22px] lg:mt-2 lg:flex-row lg:flex-wrap lg:items-center">
                  <button
                    type="button"
                    onClick={() => setManualOpen((v) => !v)}
                    aria-expanded={manualOpen}
                    aria-controls="manual-pickers"
                    className={TEXT_LINK}
                  >
                    {manualOpen ? "Use a VIN instead" : "No VIN? Pick make and model"}
                  </button>
                  <p className="inline-flex min-h-[44px] flex-wrap items-center justify-center gap-x-1 text-center text-sm leading-[1.4] text-muted-text lg:justify-start lg:text-left lg:text-[15px]">
                    Missing your car or engine?{" "}
                    <a href={MISSING_CAR_MAILTO} className={ACCENT_LINK}>Let us know</a>
                  </p>
                </div>
              </div>
              {recentReports}
            </div>
          </div>

          {/* Works with */}
          <section className="mt-[22px] lg:mt-9 lg:flex lg:flex-wrap lg:items-center lg:justify-center lg:gap-x-[30px] lg:gap-y-2.5 lg:border-y lg:border-card-border lg:py-[18px]">
            <h2 className="font-condensed text-[13px] font-bold uppercase tracking-[0.12em] text-muted-text">
              Works with listings from
            </h2>
            <ul className="mt-2.5 flex flex-wrap gap-x-[18px] gap-y-2 lg:contents">
              {MARKETPLACES.map((m) => (
                <li key={m.name} className="text-[17px] font-bold text-[#6f6e6a] lg:text-xl">
                  {m.logo ?? m.name}
                </li>
              ))}
            </ul>
          </section>

          {/* How it works */}
          <section className="mt-6 lg:mt-7">
            <h2 className="font-condensed text-[15px] font-bold uppercase tracking-[0.12em] lg:sr-only">
              How it works
            </h2>
            <ol className="mt-2.5 overflow-hidden rounded-card-sm border border-card-border bg-white lg:mt-0 lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:border-0 lg:bg-transparent">
              {HOW_IT_WORKS.map((item) => (
                <li
                  key={item.title}
                  className="flex items-center gap-3 border-b border-card-border px-3.5 py-3 last:border-b-0 lg:gap-3.5 lg:rounded-card-sm lg:border lg:bg-white lg:px-5 lg:py-[18px] lg:last:border-b"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-chip text-primary lg:h-[46px] lg:w-[46px]">
                    <svg
                      aria-hidden="true"
                      className="h-5 w-5 lg:h-[22px] lg:w-[22px]"
                      viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    >
                      {item.icon}
                    </svg>
                  </span>
                  <div>
                    <div className="text-base font-semibold lg:text-lg">{item.title}</div>
                    <div className="mt-px text-[13px] leading-[1.4] text-muted-text lg:mt-0.5 lg:text-sm">{item.body}</div>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      ) : (
        <div className="mx-auto max-w-[560px] px-4 pb-10 pt-5 lg:pt-10">
          <div ref={cardRef} className="scroll-mt-20">
            {stepHeader}
            <h1 className="mt-2.5 font-condensed text-[32px] font-bold uppercase leading-none tracking-[0.01em]">
              Now the listing
            </h1>
          </div>

          {/* Confirmed car */}
          <div className="mt-4 flex items-center gap-3 rounded-card-sm border border-card-border bg-white px-3.5 py-3">
            <div className="w-[92px] shrink-0 rounded-[10px] bg-panel px-1.5 py-1">
              <CarIllustration body={bodyFor(model)} className="h-full w-full" decorative />
            </div>
            <div className="min-w-0 flex-1">
              {decodedByVin && (
                <div className="flex items-center gap-[5px] text-[13px] text-success">
                  <svg
                    aria-hidden="true"
                    width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <path d="m5 12 5 5 9-10" />
                  </svg>
                  Decoded from your VIN
                </div>
              )}
              <div className="mt-0.5 text-[17px] font-bold leading-[1.2]">{carName}</div>
              {engineType && (
                <div className="mt-px font-mono text-xs text-muted-text">{engineType}</div>
              )}
            </div>
            <button type="button" onClick={() => setStep(1)} className={`${TEXT_LINK} text-sm`}>
              Change
            </button>
          </div>

          {/* Step 2 form */}
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="mt-4 rounded-card border border-card-border bg-white p-[18px]"
          >
            <div>
              <label htmlFor="price" className={LABEL}>Asking price (USD)</label>
              <div className="relative">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 mt-[3px] -translate-y-1/2 font-mono text-[17px] text-muted-text"
                >
                  $
                </span>
                <input
                  id="price"
                  ref={priceRef}
                  type="number"
                  inputMode="decimal"
                  value={askingPrice}
                  onChange={(e) => setAskingPrice(e.target.value)}
                  placeholder="12,500"
                  min={0}
                  max={1_000_000}
                  step={100}
                  aria-invalid={error && !priceValid ? true : undefined}
                  className={`${FIELD} mt-1.5 h-[52px] pl-8 font-mono text-[17px]`}
                />
              </div>
            </div>

            <div className="mt-3.5">
              <label htmlFor="mileage" className={LABEL}>Mileage</label>
              <div className="relative">
                <input
                  id="mileage"
                  type="number"
                  inputMode="numeric"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  placeholder="e.g. 87000"
                  min={0}
                  max={999999}
                  aria-describedby="mileage-help"
                  className={`${FIELD} mt-1.5 h-[52px] pr-10 text-[17px]`}
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3.5 top-1/2 mt-[3px] -translate-y-1/2 font-condensed text-[13px] font-semibold uppercase tracking-wider text-muted-text"
                >
                  mi
                </span>
              </div>
              <p id="mileage-help" className={HINT}>Affects wear estimates significantly.</p>
            </div>

            <div className="mt-3.5">
              <label htmlFor="engine" className={LABEL}>Engine</label>
              <Select
                id="engine"
                value={engineType}
                onChange={setEngineType}
                options={engines.map((e) => ({ value: e.display_name, label: e.display_name }))}
                placeholder={model ? "Select engine..." : "Select model first"}
                disabled={!model}
                loading={loadingEngines}
              />
              <p className={HINT}>
                Needed for accurate repair costs. Missing your engine?{" "}
                <a href={MISSING_CAR_MAILTO} className={ACCENT_LINK}>Let us know</a>
              </p>
            </div>

            <div className="mt-3.5">
              <label htmlFor="listing" className={LABEL}>
                Listing text{" "}
                <span className="font-medium normal-case tracking-[0.02em] text-muted-text">
                  · optional but recommended
                </span>
              </label>
              <textarea
                id="listing"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Paste the full listing description here. The more detail you give us, the deeper we can dig — condition notes, what the seller mentions and what they suspiciously don't."
                maxLength={8000}
                aria-describedby="listing-help"
                className={`${FIELD} mt-1.5 min-h-[120px] resize-y py-3.5 text-base leading-[1.4]`}
              />
              <p id="listing-help" className={HINT}>
                Works with Facebook Marketplace, Craigslist, OfferUp, eBay Motors, AutoTrader and more.
              </p>
            </div>

            {error && (
              <p
                role="alert"
                className="mt-4 rounded-lg border border-primary-tint-border bg-primary-tint px-4 py-2.5 text-sm font-medium text-primary-ink"
              >
                {error}
              </p>
            )}

            <button type="submit" className={`${PRIMARY_BTN} mt-[18px]`}>
              Run free inspection
            </button>
            <p className="mt-2.5 text-center text-[13px] text-muted-text">
              First 3 findings free · Full report ${PRICE_USD.toFixed(2)} · No account required
            </p>
          </form>

          {recentReports}
        </div>
      )}
    </section>
  );
}
