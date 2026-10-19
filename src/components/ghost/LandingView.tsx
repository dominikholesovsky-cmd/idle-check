import { useState, useEffect, useRef, type KeyboardEvent, type ReactNode, type Ref } from "react";
import { ChevronDown } from "lucide-react";
import { SamplePreviewCard } from "./SamplePreviewCard";
import { CarImage } from "./CarImage";
import { MyReportsSection } from "./MyReportsSection";
import { getSupabase } from "@/lib/supabaseBrowser";
import { MARKETING_CONSENT_TEXT, MISSING_CAR_MAILTO, PRICE_USD } from "@/lib/ghost/constants";
import type { AnalysisState } from "@/routes/index";

const supabase = { from: (table: string) => getSupabase().from(table) };

export interface LandingSubmit {
  manualText: string;
  make: string;
  model: string;
  year: string;
  askingPrice: number;
  engineType?: string;
  mileage?: string;
  vin?: string;
  email: string;
  marketingOptIn: boolean;
}

interface Make { id: number; slug: string; display_name: string; }
interface Model { id: number; slug: string; display_name: string; }
interface Engine { id: number; display_name: string; }

interface LandingViewProps {
  onSubmit: (data: LandingSubmit) => void;
  history: AnalysisState[];
  onLoadHistory: (entry: AnalysisState) => void;
}

type Mode = "vin" | "manual";

// What a mode remembers while the other one is active.
interface CarSnapshot {
  make: string;
  makeId: number | null;
  model: string;
  modelId: number | null;
  year: string;
  engineType: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    title: "Paste the listing",
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
    title: "See 3 findings free",
    body: "Known weak points for that model and year.",
    icon: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </>
    ),
  },
  {
    title: `Unlock for $${PRICE_USD.toFixed(2)}`,
    body: "Full findings, red flags, verdict and a message for the seller.",
    icon: (
      <>
        <rect x="4" y="11" width="16" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 7.5-2" />
      </>
    ),
  },
];

const HERO_CHECKS = ["Live NHTSA recall data", "Negotiation script included", "First 3 findings free"];

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
const STEP_LABEL =
  "font-condensed text-[13px] font-bold uppercase tracking-[0.12em] text-primary";

function Select({
  id, value, onChange, options, placeholder, disabled, loading, selectRef,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  disabled?: boolean;
  loading?: boolean;
  selectRef?: Ref<HTMLSelectElement>;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        ref={selectRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
        className={`${FIELD} mt-1.5 h-[52px] appearance-none pr-9 text-base lg:h-14 ${
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
  const [email, setEmail] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [vinLoading, setVinLoading] = useState(false);
  const [vinError, setVinError] = useState<string | null>(null);
  const [pendingVinDecode, setPendingVinDecode] = useState<{ model: string; year: string } | null>(null);
  const [vinDecoded, setVinDecoded] = useState(false);
  const [vinDecodeResult, setVinDecodeResult] = useState<{ make: string; model: string; year: string } | null>(null);

  const [step, setStep] = useState<1 | 2>(1);
  const [mode, setMode] = useState<Mode>("vin");
  const modeRef = useRef<Mode>("vin");
  // The make/model/year state above is the "active" car. Each mode parks its own car here
  // while the other mode is showing, so switching back and forth loses nothing.
  const parkedCars = useRef<Partial<Record<Mode, CarSnapshot>>>({});

  const cardRef = useRef<HTMLDivElement>(null);
  const vinRef = useRef<HTMLInputElement>(null);
  const makeRef = useRef<HTMLSelectElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const tabRefs = useRef<Record<Mode, HTMLButtonElement | null>>({ vin: null, manual: null });
  const prevStep = useRef(step);

  // Step change: scroll the card into view and move focus to its first field.
  useEffect(() => {
    if (prevStep.current === step) return;
    prevStep.current = step;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    cardRef.current?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
    const first = step === 2 ? priceRef.current : modeRef.current === "vin" ? vinRef.current : makeRef.current;
    first?.focus({ preventScroll: true });
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
      setVinDecodeResult(null);
      setVinError(`"${nhtsaModel}" not in our database — use "No VIN" to select model manually.`);
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
      // The user may have switched to "No VIN" while this was in flight. Do not overwrite that car.
      if (modeRef.current !== "vin") return;

      const get = (variable: string) =>
        (json.Results as { Variable: string; Value: string | null }[]).find(
          (r) => r.Variable === variable
        )?.Value ?? "";

      const nhtsaMake = get("Make");
      const nhtsaModel = get("Model");
      const nhtsaYear = get("Model Year");
      const errorCode = get("Error Code");

      if (errorCode !== "0" || !nhtsaMake || !nhtsaModel) {
        setVinError("VIN not found — check for typos or use \"No VIN\" to enter vehicle details manually.");
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
        setVinError(`"${nhtsaMake}" not in our database — use "No VIN" to select make/model manually.`);
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

  const switchMode = (next: Mode, focusTab = false) => {
    if (next === mode) return;
    parkedCars.current[mode] = {
      make, makeId: selectedMakeId, model, modelId: selectedModelId, year, engineType,
    };
    const snap = parkedCars.current[next];
    setMake(snap?.make ?? "");
    setSelectedMakeId(snap?.makeId ?? null);
    setModel(snap?.model ?? "");
    setSelectedModelId(snap?.modelId ?? null);
    setYear(snap?.year ?? "");
    setEngineType(snap?.engineType ?? "");
    setPendingVinDecode(null);
    modeRef.current = next;
    setMode(next);
    if (focusTab) tabRefs.current[next]?.focus();
  };

  const handleTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "Home" || e.key === "End") {
      e.preventDefault();
      switchMode(e.key === "ArrowLeft" || e.key === "Home" ? "vin" : "manual", true);
    }
  };

  const priceNum = Number(askingPrice);
  const priceValid = askingPrice !== "" && !Number.isNaN(priceNum) && priceNum > 0 && priceNum <= 1_000_000;
  const hasVehicleBase = make && model && year;
  // VIN mode needs a successful decode; manual mode needs make, model and year.
  const canContinue = !!hasVehicleBase && !vinLoading && (mode === "manual" || vinDecoded);

  const goToStep2 = () => {
    if (!canContinue) return;
    setError(null);
    setStep(2);
  };

  const handleSubmit = () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!hasVehicleBase) { setError("Select Make, Model, and enter Year."); return; }
    if (!priceValid) {
      setError("Asking price is required to generate your negotiation offer.");
      priceRef.current?.focus();
      return;
    }
    if (!cleanEmail) {
      setError(null);
      setEmailError("Enter your email to get your report link.");
      emailRef.current?.focus();
      return;
    }
    if (cleanEmail.length > 254 || !EMAIL_RE.test(cleanEmail)) {
      setError(null);
      setEmailError("Enter a valid email address.");
      emailRef.current?.focus();
      return;
    }
    setError(null);
    setEmailError(null);
    onSubmit({
      manualText: manualText.trim() || `${year} ${make} ${model} ${engineType}`.trim(),
      make, model, year,
      askingPrice: priceNum,
      engineType: engineType || undefined,
      mileage: mileage || undefined,
      vin: mode === "vin" ? vin || undefined : undefined,
      email: cleanEmail,
      marketingOptIn,
    });
  };

  const decodedSummary = vinDecodeResult
    ? `${vinDecodeResult.year} ${vinDecodeResult.make} ${vinDecodeResult.model}`.trim()
    : null;
  const decodedByVin = mode === "vin" && vinDecoded && !!vinDecodeResult;
  const carName = `${year} ${make} ${model}`.trim();

  const stepHeader = (
    <div className="flex items-center gap-3.5">
      <span className={STEP_LABEL}>Step {step} of 2</span>
      <div className="flex gap-1.5" aria-hidden="true">
        <span className="h-1 w-9 rounded-sm bg-primary lg:w-10" />
        <span className={`h-1 w-9 rounded-sm lg:w-10 ${step === 2 ? "bg-primary" : "bg-card-border"}`} />
      </div>
    </div>
  );

  const missingLink = (
    <p className="flex flex-wrap items-center justify-center gap-x-1 text-sm text-muted-text lg:justify-start">
      Missing your car or engine?{" "}
      <a href={MISSING_CAR_MAILTO} className={`${ACCENT_LINK} inline-flex min-h-[44px] items-center`}>
        Let us know
      </a>
    </p>
  );

  const continueButton = (extra: string) => (
    <button
      type="button"
      onClick={goToStep2}
      disabled={!canContinue}
      className={`${PRIMARY_BTN} ${extra}`}
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
  );

  const vinDescribedBy = ["vin-help", vinError ? "vin-error" : decodedSummary ? "vin-status" : ""]
    .filter(Boolean)
    .join(" ");

  const modeSwitch = (
    <div
      role="tablist"
      aria-label="How do you want to identify the car?"
      onKeyDown={handleTabKey}
      className="flex gap-1 rounded-xl bg-chip p-1"
    >
      {([["vin", "I have a VIN"], ["manual", "No VIN"]] as const).map(([value, label]) => {
        const selected = mode === value;
        return (
          <button
            key={value}
            ref={(el) => { tabRefs.current[value] = el; }}
            type="button"
            role="tab"
            id={`mode-tab-${value}`}
            aria-selected={selected}
            aria-controls="mode-panel"
            tabIndex={selected ? 0 : -1}
            onClick={() => switchMode(value)}
            className={`h-11 flex-1 whitespace-nowrap rounded-[9px] px-3.5 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              selected
                ? "bg-white font-bold text-primary shadow-[0_0_0_1px_var(--card-border)]"
                : "font-semibold text-text-2"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );

  const vinPanel = (
    <div className="mt-4 lg:mt-[18px] lg:flex lg:flex-wrap lg:items-end lg:gap-x-3.5 lg:gap-y-3">
      <div className="min-w-0 lg:flex-1 lg:basis-[420px]">
        <label htmlFor="vin" className="block text-xl font-bold lg:text-lg">
          Have a VIN? Start here.
        </label>
        <p className="mt-0.5 text-[15px] leading-[1.45] text-muted-text lg:text-sm">
          We'll fill in make, model and year automatically.
        </p>
        <div className="relative mt-3 lg:mt-2">
          <input
            id="vin"
            ref={vinRef}
            value={vin}
            onChange={(e) => {
              const val = e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "");
              setVin(val);
              setVinError(null);
              setVinDecoded(false);
              setVinDecodeResult(null);
              if (val.length === 17) decodeVin(val);
            }}
            onBlur={() => {
              if (vin.length === 17 && !vinDecoded && !vinLoading && !vinError) decodeVin(vin);
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
            className={`${FIELD} h-14 pr-11 font-mono text-base tracking-[0.04em] ${
              vinError ? "border-primary" : decodedSummary ? "border-success" : ""
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
      </div>
      {continueButton("mt-4 lg:mt-0 lg:w-auto lg:px-[26px]")}
      <div className="lg:basis-full" id="vin-help">
        <p className={`${HINT} lg:mt-0`}>
          Found on the dashboard (driver's side), door jamb sticker, or insurance card.
        </p>
        {vinLoading && (
          <p role="status" className="mt-1.5 text-[13px] font-medium text-muted-text">Checking VIN…</p>
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
    </div>
  );

  const manualPanel = (
    <div className="mt-4 lg:mt-[18px]">
      <h2 className="text-xl font-bold lg:text-lg">Pick your car.</h2>
      <p className="mt-0.5 text-[15px] leading-[1.45] text-muted-text lg:text-sm">
        Choose make, model and year.
      </p>
      <div className="mt-3 grid gap-3 lg:mt-3.5 lg:flex lg:flex-wrap lg:items-end lg:gap-x-3.5">
        <div className="lg:flex-1 lg:basis-[200px]">
          <label htmlFor="make" className={LABEL}>Make</label>
          <Select
            id="make"
            selectRef={makeRef}
            value={make}
            onChange={handleMakeChange}
            options={makes.map((m) => ({ value: m.display_name, label: m.display_name }))}
            placeholder="Select make..."
            loading={loadingMakes}
          />
        </div>
        <div className="lg:flex-[1.3_1_240px]">
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
        <div className="lg:flex-[0_1_140px]">
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
            className={`${FIELD} mt-1.5 h-[52px] text-base lg:h-14`}
          />
        </div>
        {continueButton("mt-1 lg:mt-0 lg:w-auto lg:px-[26px]")}
      </div>
    </div>
  );

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
        <>
          {/* Hero band: full bleed on desktop */}
          <div className="lg:border-b lg:border-panel-border lg:bg-panel">
            <div className="mx-auto max-w-[1200px] px-4 pt-5 lg:flex lg:flex-wrap lg:items-center lg:gap-x-14 lg:gap-y-10 lg:px-12 lg:pb-20 lg:pt-[52px]">
              <div className="lg:min-w-0 lg:flex-1 lg:basis-[440px]">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex h-7 items-center rounded-full border border-card-border bg-chip px-3 font-condensed text-[13px] font-bold uppercase tracking-[0.12em] text-primary lg:border-panel-border lg:bg-white">
                    Free preview · No account
                  </span>
                </div>
                <h1 className="mt-3 font-condensed text-[34px] font-bold uppercase leading-none tracking-[0.005em] lg:mt-[18px] lg:text-[62px] lg:leading-[0.98]">
                  Know what you're buying before you show up
                </h1>
                <p className="mt-2.5 max-w-[500px] text-[15px] leading-[1.45] text-muted-text lg:mt-4 lg:text-[19px] lg:leading-normal lg:text-text-2">
                  Paste a used car listing. Get repair costs, NHTSA recalls and a negotiation script
                  <span className="hidden lg:inline"> before you drive out to see it</span>.
                </p>
                <ul className="mt-5 hidden flex-wrap gap-x-[22px] gap-y-2 text-[15px] text-text-2 lg:flex">
                  {HERO_CHECKS.map((c) => (
                    <li key={c} className="flex items-center gap-2">
                      <svg
                        aria-hidden="true"
                        className="text-primary"
                        width="18" height="18" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
                      >
                        <path d="m5 12 5 5 9-10" />
                      </svg>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
              <SamplePreviewCard className="mt-4 lg:mt-0 lg:min-w-0 lg:flex-[1_1_560px]" />
            </div>
          </div>

          <div className="mx-auto max-w-[1200px] px-4 pb-10 lg:px-12">
            {/* Step 1 card: overlaps the band on desktop */}
            <div className="relative mt-4 lg:-mt-14 lg:mx-auto lg:max-w-[1104px]">
              <div
                ref={cardRef}
                className="scroll-mt-20 rounded-card border border-card-border bg-white p-[18px] lg:rounded-[20px] lg:px-7 lg:py-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3.5">
                  {stepHeader}
                  <div className="w-full lg:w-[340px]">{modeSwitch}</div>
                </div>
                <div id="mode-panel" role="tabpanel" aria-labelledby={`mode-tab-${mode}`}>
                  {mode === "vin" ? vinPanel : manualPanel}
                </div>
                <div className="mt-1.5 lg:mt-2">{missingLink}</div>
              </div>
              <MyReportsSection history={history} onOpen={onLoadHistory} />
            </div>

            {/* Works with */}
            <section className="mt-[22px] lg:mt-11 lg:flex lg:flex-wrap lg:items-center lg:justify-center lg:gap-x-8 lg:gap-y-2.5 lg:border-y lg:border-card-border lg:py-[18px]">
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
            <section className="mt-6 lg:mt-11">
              <h2 className="font-condensed text-[15px] font-bold uppercase tracking-[0.12em] lg:text-[17px]">
                How it works
              </h2>
              <ol className="mt-2.5 overflow-hidden rounded-card-sm border border-card-border bg-white lg:mt-3.5 lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:rounded-none lg:border-0 lg:bg-transparent">
                {HOW_IT_WORKS.map((item, i) => (
                  <li
                    key={item.title}
                    className="flex items-center gap-3 border-b border-card-border px-3.5 py-3 last:border-b-0 lg:block lg:rounded-card lg:border lg:bg-white lg:p-6 lg:last:border-b"
                  >
                    <span className="flex items-center gap-3.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-chip text-primary lg:h-[52px] lg:w-[52px]">
                        <svg
                          aria-hidden="true"
                          className="h-5 w-5 lg:h-6 lg:w-6"
                          viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        >
                          {item.icon}
                        </svg>
                      </span>
                      <span aria-hidden="true" className="hidden font-mono text-[34px] font-bold text-[#c8c4bc] lg:inline">
                        {i + 1}
                      </span>
                    </span>
                    <div className="lg:mt-3.5">
                      <div className="text-base font-semibold lg:text-xl">
                        <span className="lg:hidden">{i + 1} · </span>
                        {item.title}
                      </div>
                      <div className="mt-px text-[13px] leading-[1.4] text-muted-text lg:mt-1 lg:text-[15px] lg:leading-[1.45]">
                        {item.body}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </>
      ) : (
        <div className="mx-auto max-w-[1100px] px-4 pb-10 pt-5 lg:px-12 lg:pt-9">
          <div ref={cardRef} className="scroll-mt-20">
            {stepHeader}
            <h1 className="mt-2.5 font-condensed text-[32px] font-bold uppercase leading-none tracking-[0.01em] lg:text-[44px]">
              Now the listing
            </h1>
          </div>

          <div className="mt-4 lg:mt-[22px] lg:flex lg:flex-wrap lg:items-start lg:gap-x-9 lg:gap-y-7 lg:rounded-[20px] lg:border lg:border-card-border lg:bg-white lg:p-7">
            {/* Confirmed car */}
            <aside className="flex items-center gap-3 rounded-card-sm border border-card-border bg-white px-3.5 py-3 lg:block lg:min-w-[260px] lg:flex-[0_1_320px] lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0">
              <div className="w-[112px] shrink-0 rounded-[10px] bg-panel px-1.5 py-1.5 lg:w-full lg:rounded-[18px] lg:border lg:border-panel-border lg:p-[18px]">
                <CarImage crop="front" className="lg:hidden" />
                <CarImage crop="full" className="hidden lg:block" />
              </div>
              <div className="min-w-0 flex-1 lg:mt-3.5 lg:rounded-card-sm lg:border lg:border-card-border lg:bg-white lg:px-4 lg:py-3.5">
                {decodedByVin && (
                  <div className="flex items-center gap-[5px] text-[13px] text-success lg:gap-1.5">
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
                <div className="mt-0.5 text-[17px] font-bold leading-[1.2] lg:mt-1 lg:text-[19px]">{carName}</div>
                {engineType && (
                  <div className="mt-px font-mono text-xs text-muted-text lg:mt-0.5 lg:text-[13px]">{engineType}</div>
                )}
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className={`${TEXT_LINK} mt-1 hidden lg:inline-flex`}
                >
                  Change car
                </button>
              </div>
              <button type="button" onClick={() => setStep(1)} className={`${TEXT_LINK} text-sm lg:hidden`}>
                Change
              </button>
            </aside>

            {/* Step 2 form */}
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="mt-4 rounded-card border border-card-border bg-white p-[18px] lg:mt-0 lg:min-w-0 lg:flex-[1_1_560px] lg:rounded-none lg:border-0 lg:p-0"
            >
              <div className="lg:grid lg:grid-cols-3 lg:gap-3.5">
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

                <div className="mt-3.5 lg:mt-0">
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

                <div className="mt-3.5 lg:mt-0">
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
              </div>

              <div className="mt-3.5 lg:mt-4">
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
                  className={`${FIELD} mt-1.5 min-h-[120px] resize-y py-3.5 text-base leading-[1.4] lg:min-h-[130px]`}
                />
                <p id="listing-help" className={HINT}>
                  Works with Facebook Marketplace, Craigslist, OfferUp, eBay Motors, AutoTrader and more.
                </p>
              </div>

              {/* Email */}
              <div className="mt-4 lg:mt-5 lg:border-t lg:border-card-border lg:pt-5">
                <div className="lg:flex lg:flex-wrap lg:items-end lg:gap-3.5">
                  <div className="lg:min-w-0 lg:flex-1 lg:basis-[320px]">
                    <label htmlFor="email" className={LABEL}>
                      Your email{" "}
                      <span className="font-medium normal-case tracking-[0.02em] text-muted-text">· required</span>
                    </label>
                    <input
                      id="email"
                      ref={emailRef}
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError(null);
                      }}
                      placeholder="you@example.com"
                      aria-describedby={emailError ? "email-error email-help" : "email-help"}
                      aria-invalid={emailError ? true : undefined}
                      className={`${FIELD} mt-1.5 h-[52px] text-base lg:h-14 ${emailError ? "border-primary" : ""}`}
                    />
                  </div>
                  <button type="submit" className={`${PRIMARY_BTN} hidden lg:flex lg:w-auto lg:px-[26px]`}>
                    Run free inspection
                  </button>
                </div>
                {emailError && (
                  <p id="email-error" role="alert" className="mt-1.5 text-[13px] font-semibold text-primary-ink">
                    {emailError}
                  </p>
                )}
                <p id="email-help" className={`${HINT} lg:mt-2`}>
                  We'll send your report link here. Reports you unlock are saved under this email.
                </p>
                <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-sm leading-[1.4] text-text-2">
                  <input
                    type="checkbox"
                    checked={marketingOptIn}
                    onChange={(e) => setMarketingOptIn(e.target.checked)}
                    className="mt-0.5 h-[22px] w-[22px] shrink-0 cursor-pointer accent-primary"
                  />
                  {MARKETING_CONSENT_TEXT}
                </label>
              </div>

              {error && (
                <p
                  role="alert"
                  className="mt-4 rounded-lg border border-primary-tint-border bg-primary-tint px-4 py-2.5 text-sm font-medium text-primary-ink"
                >
                  {error}
                </p>
              )}

              <button type="submit" className={`${PRIMARY_BTN} mt-[18px] lg:hidden`}>
                Run free inspection
              </button>
              <p className="mt-2.5 text-center text-[13px] leading-[1.4] text-muted-text lg:mt-3 lg:text-left">
                First 3 findings free · Full report ${PRICE_USD.toFixed(2)} · No account required
                <br className="lg:hidden" />
                <span className="hidden lg:inline">. </span>
                By continuing you agree to the{" "}
                <a href="/privacy" className="text-text-2 underline underline-offset-2">Privacy Policy</a> and{" "}
                <a href="/terms" className="text-text-2 underline underline-offset-2">Terms</a>.
              </p>
            </form>
          </div>

        </div>
      )}
    </section>
  );
}
