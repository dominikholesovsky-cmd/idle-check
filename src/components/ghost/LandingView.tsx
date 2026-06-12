import { useState, useEffect } from "react";
import { Clock, ChevronRight, ChevronDown, CheckCircle2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NhtsaStatus } from "./NhtsaStatus";
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

function Select({
  value, onChange, options, placeholder, disabled, loading,
}: {
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
        className={`w-full appearance-none rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 pr-8 text-[14px] text-white transition-colors focus:border-primary focus:outline-none ${
          disabled || loading ? "cursor-not-allowed opacity-40" : "cursor-pointer"
        } ${!value ? "text-zinc-500" : "text-white"}`}
      >
        <option value="" disabled>
          {loading ? "Loading..." : placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
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
  const [error, setError] = useState<string | null>(null);

  const [vinLoading, setVinLoading] = useState(false);
  const [vinError, setVinError] = useState<string | null>(null);
  const [pendingVinDecode, setPendingVinDecode] = useState<{ model: string; year: string } | null>(null);
  const [vinDecoded, setVinDecoded] = useState(false);

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
    }
    if (nhtsaYear) setYear(nhtsaYear);
    setVinDecoded(true);
  }, [models, loadingModels, pendingVinDecode]);

  const decodeVin = async (rawVin: string) => {
    setVinError(null);
    setVinDecoded(false);
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
        handleMakeChange(matchedMake.display_name);
        setPendingVinDecode({ model: nhtsaModel, year: nhtsaYear });
      } else {
        if (nhtsaYear) setYear(nhtsaYear);
        setVinError(`"${nhtsaMake}" not in our database — select make/model manually.`);
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
  const canSubmit = priceValid && !!hasVehicleBase;

  const handleSubmit = () => {
    if (!hasVehicleBase) { setError("Select Make, Model, and enter Year."); return; }
    if (!priceValid) { setError("Asking price is required to generate your negotiation offer."); return; }
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

  const decodedSummary = vinDecoded && make && model && year
    ? `${year} ${make} ${model}`
    : null;

  return (
    <section className="view-fade-in relative z-10 mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-20 bg-zinc-950 text-white">

      {/* Hero */}
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="font-condensed text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
            Free preview · No account required
          </span>
        </div>
        <h1
          className="font-sans text-[64px] font-extrabold leading-[0.92] tracking-tight sm:text-[96px]"
          style={{ letterSpacing: "-2px" }}
        >
          IDLE<br />CHECK
        </h1>
        <p className="mt-5 max-w-xl text-base text-zinc-400 sm:text-lg">
          Know what you're buying before you show up. Inspection checklist, repair costs, NHTSA recalls, and a negotiation script — in seconds.
        </p>

        {/* Social proof */}
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
          {[
            "200+ known failure points",
            "Live NHTSA recall data",
            "Negotiation script included",
          ].map((item) => (
            <span key={item} className="flex items-center gap-1.5 text-[12px] text-zinc-400">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary/70" />
              {item}
            </span>
          ))}
        </div>

        <div className="mt-5 h-[2px] w-[60px] bg-primary" />
      </div>

      {/* Recent Reports */}
      {history.length > 0 && (
        <div className="mt-10">
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-zinc-400" />
            <span className="font-condensed text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
              Recent Reports
            </span>
          </div>
          <ul className="space-y-2">
            {history.slice(0, 5).map((entry, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => onLoadHistory(entry)}
                  className="group flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:border-primary/40"
                >
                  <div>
                    <span className="block text-[14px] font-medium text-zinc-200">
                      {entry.vehicle.year} {entry.vehicle.make} {entry.vehicle.model}
                      {entry.vehicle.trim ? ` (${entry.vehicle.trim})` : ""}
                    </span>
                    <span className="block text-[12px] text-zinc-400">
                      ${entry.askingPrice.toLocaleString()} · {entry.marketplace} · {timeAgo(entry.timestamp)}
                    </span>
                  </div>
                  <ChevronRight className="ml-3 h-4 w-4 shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-12 space-y-5">

        {/* Main form card */}
        <div className="rounded-xl border border-border bg-card shadow-[0_2px_16px_rgba(0,0,0,0.07)]">

          {/* VIN — primary entry */}
          <div className="p-5 pb-4">
            <div className="mb-1 flex items-center justify-between gap-3">
              <label className="block font-condensed text-xs font-semibold uppercase tracking-[0.12em] text-zinc-200">
                Vehicle Identification Number (VIN)
              </label>
              <NhtsaStatus />
            </div>
            <p className="mb-3 text-[12px] text-zinc-400">
              Have a VIN? Start here — we'll fill in make, model, and year automatically.
            </p>
            <div className="relative">
              <Input
                value={vin}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "");
                  setVin(val);
                  setVinError(null);
                  setVinDecoded(false);
                  if (val.length === 17) decodeVin(val);
                }}
                onBlur={() => {
                  if (vin.length === 17 && !vinDecoded) decodeVin(vin);
                }}
                placeholder="e.g. JN1AZ4EH0FM123456"
                maxLength={17}
                className="h-12 border-zinc-700 bg-zinc-900 font-mono text-[14px] tracking-widest text-white placeholder:text-zinc-500 transition-colors focus-visible:border-primary focus-visible:ring-0"
                disabled={vinLoading}
              />
              {vinLoading && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg className="h-4 w-4 animate-spin text-zinc-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                </span>
              )}
            </div>

            {/* VIN feedback */}
            {vin.length > 0 && vin.length < 17 && !vinLoading && (
              <p className="mt-1.5 text-[11px] text-zinc-400">
                {17 - vin.length} more characters
              </p>
            )}
            {decodedSummary && !vinError && (
              <div className="mt-2 flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-[12px] font-medium text-emerald-600">{decodedSummary} decoded</span>
              </div>
            )}
            {vinError && (
              <p className="mt-1.5 text-[11px] text-primary">{vinError}</p>
            )}
            <p className="mt-2 text-[11px] text-zinc-500">
              Found on the dashboard (driver's side), door jamb sticker, or insurance card.
            </p>
          </div>

          {/* Divider */}
          <div className="mx-5 border-t border-border" />

          {/* Vehicle detail fields — always visible */}
          <div className="space-y-3 px-5 pb-5 pt-4">

            {/* Make + Model */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block font-condensed text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Make <span className="text-primary">*</span>
                </label>
                <Select
                  value={make}
                  onChange={handleMakeChange}
                  options={makes.map((m) => ({ value: m.display_name, label: m.display_name }))}
                  placeholder="Select make..."
                  loading={loadingMakes}
                />
              </div>
              <div>
                <label className="mb-1.5 block font-condensed text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Model <span className="text-primary">*</span>
                </label>
                <Select
                  value={model}
                  onChange={handleModelChange}
                  options={models.map((m) => ({ value: m.display_name, label: m.display_name }))}
                  placeholder={make ? "Select model..." : "Select make first"}
                  disabled={!make}
                  loading={loadingModels}
                />
              </div>
            </div>

            {/* Year + Mileage */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block font-condensed text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Year <span className="text-primary">*</span>
                </label>
                <Input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="e.g. 2004"
                  min={1970}
                  max={2026}
                  className="border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500 transition-colors focus-visible:border-primary focus-visible:ring-0"
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 font-condensed text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Mileage
                  <span className="rounded px-1 py-px font-condensed text-[9px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600">Recommended</span>
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value)}
                    placeholder="e.g. 87000"
                    min={0}
                    max={999999}
                    className="border-zinc-700 bg-zinc-900 pr-8 text-white placeholder:text-zinc-500 transition-colors focus-visible:border-primary focus-visible:ring-0"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-condensed text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    mi
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-zinc-500">Affects wear estimates significantly</p>
              </div>
            </div>

            {/* Engine */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 font-condensed text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Engine
                <span className="rounded px-1 py-px font-condensed text-[9px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600">Recommended</span>
              </label>
              <Select
                value={engineType}
                onChange={setEngineType}
                options={engines.map((e) => ({ value: e.display_name, label: e.display_name }))}
                placeholder={model ? "Select engine..." : "Select model first"}
                disabled={!model}
                loading={loadingEngines}
              />
              <p className="mt-1 text-[10px] text-zinc-500">Required for accurate repair costs</p>
            </div>

          </div>
        </div>

        {/* Asking price */}
        <div>
          <label className="mb-2 block font-condensed text-xs font-semibold uppercase tracking-[0.12em] text-zinc-200">
            Asking Price (USD) <span className="text-primary">*</span>
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-base font-semibold text-zinc-400">
              $
            </span>
            <Input
              type="number"
              value={askingPrice}
              onChange={(e) => setAskingPrice(e.target.value)}
              placeholder="12,500"
              min={0}
              max={1_000_000}
              step={100}
              className="h-12 border-zinc-700 bg-zinc-900 pl-9 font-mono text-base text-white placeholder:text-zinc-500 transition-colors focus-visible:border-primary focus-visible:ring-0"
            />
          </div>
        </div>

        {/* Listing text */}
        <div>
          <label className="mb-2 block font-condensed text-xs font-semibold uppercase tracking-[0.12em] text-zinc-200">
            Listing Text
            <span className="ml-1.5 font-normal normal-case tracking-normal text-zinc-400">
              — optional but recommended
            </span>
          </label>
          <Textarea
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="Paste the full listing description here. The more detail you give us, the deeper we can dig — condition notes, what the seller mentions and what they suspiciously don't."
            className="min-h-[140px] resize-y border-zinc-700 bg-zinc-900 p-4 text-[14px] leading-relaxed text-white placeholder:text-zinc-500 shadow-[0_2px_12px_rgba(0,0,0,0.3)] transition-colors focus-visible:border-primary focus-visible:ring-0"
            maxLength={8000}
          />
          <p className="mt-1.5 text-[11px] text-zinc-400">
            Works with Facebook Marketplace, Craigslist, OfferUp, eBay Motors, AutoTrader, and more.
          </p>
        </div>

        {error && (
          <p className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary">
            {error}
          </p>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="cta-active h-14 w-full bg-red-700 text-base font-semibold uppercase tracking-wide text-white shadow-[0_4px_20px_rgba(178,34,34,0.35)] transition hover:bg-red-600 disabled:bg-red-950 disabled:text-red-800 disabled:opacity-100"
        >
          Run Inspection Analysis
        </Button>

        <p className="text-center text-[12px] text-zinc-400">
          First 3 issues always free · Full report $4.99 · No account required
        </p>
      </div>
    </section>
  );
}
