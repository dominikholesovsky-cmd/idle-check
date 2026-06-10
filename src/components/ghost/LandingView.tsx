import { useState, useEffect } from "react";
import { Clock, ChevronRight, ChevronDown } from "lucide-react";
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
        className={`w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-8 text-[14px] transition-colors focus:border-primary focus:outline-none ${
          disabled || loading ? "cursor-not-allowed opacity-40" : "cursor-pointer"
        } ${!value ? "text-muted-foreground" : "text-foreground"}`}
      >
        <option value="" disabled>
          {loading ? "Loading..." : placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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

  // Load makes on mount
  useEffect(() => {
    supabase
      .from("makes")
      .select("id, slug, display_name")
      .order("display_name")
      .then(({ data }) => {
        setMakes(data ?? []);
        setLoadingMakes(false);
      });
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

  return (
    <section className="view-fade-in relative z-10 mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-20">

      {/* Hero */}
      <div>
        <h1
          className="font-sans text-[64px] font-extrabold leading-[0.95] tracking-tight sm:text-[96px]"
          style={{ letterSpacing: "-2px" }}
        >
          IDLE CHECK
        </h1>
        <p className="mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Paste any listing. Get the inspection checklist, repair costs, and negotiation script — before you drive out to see it.
        </p>
        <div className="mt-5 h-[2px] w-[60px] bg-primary" />
      </div>

      {/* Recent Reports */}
      {history.length > 0 && (
        <div className="mt-10">
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-condensed text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
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
                    <span className="block text-[14px] font-medium text-foreground">
                      {entry.vehicle.year} {entry.vehicle.make} {entry.vehicle.model}
                      {entry.vehicle.trim ? ` (${entry.vehicle.trim})` : ""}
                    </span>
                    <span className="block text-[12px] text-muted-foreground">
                      ${entry.askingPrice.toLocaleString()} · {entry.marketplace} · {timeAgo(entry.timestamp)}
                    </span>
                  </div>
                  <ChevronRight className="ml-3 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-12 space-y-5">

        {/* Vehicle details card */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <label className="mb-4 block font-condensed text-xs font-semibold uppercase tracking-[0.12em] text-foreground">
            Vehicle Details
          </label>
          <div className="space-y-3">

            {/* Make + Model */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block font-condensed text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Make
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
                <label className="mb-1.5 block font-condensed text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Model
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

            {/* Engine */}
            <div>
              <label className="mb-1.5 block font-condensed text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Engine
              </label>
              <Select
                value={engineType}
                onChange={setEngineType}
                options={engines.map((e) => ({ value: e.display_name, label: e.display_name }))}
                placeholder={model ? "Select engine..." : "Select model first"}
                disabled={!model}
                loading={loadingEngines}
              />
            </div>

            {/* Year + Mileage */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block font-condensed text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Year *
                </label>
                <Input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="e.g. 2004"
                  min={1970}
                  max={2026}
                  className="transition-colors focus-visible:border-primary focus-visible:ring-0"
                />
              </div>
              <div>
                <label className="mb-1.5 block font-condensed text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Mileage
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value)}
                    placeholder="e.g. 87000"
                    min={0}
                    max={999999}
                    className="pr-8 transition-colors focus-visible:border-primary focus-visible:ring-0"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-condensed text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    mi
                  </span>
                </div>
              </div>
            </div>

            {/* VIN */}
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <label className="block font-condensed text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  VIN
                  <span className="ml-1.5 font-normal normal-case tracking-normal text-muted-foreground/70">
                    — optional, enables NHTSA recall lookup
                  </span>
                </label>
                <NhtsaStatus />
              </div>
              <Input
                value={vin}
                onChange={(e) =>
                  setVin(e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, ""))
                }
                placeholder="e.g. JN1AZ4EH0FM123456"
                maxLength={17}
                className="font-mono text-[13px] tracking-wider transition-colors focus-visible:border-primary focus-visible:ring-0"
              />
              {vin.length > 0 && vin.length !== 17 && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {17 - vin.length} characters remaining
                </p>
              )}
              {vin.length === 17 && (
                <p className="mt-1 text-[11px] text-emerald-600">✓ Valid VIN length</p>
              )}
            </div>
          </div>
        </div>

        {/* Listing text */}
        <div>
          <label className="mb-2 block font-condensed text-xs font-semibold uppercase tracking-[0.12em] text-foreground">
            Listing Text
            <span className="ml-1.5 font-normal normal-case tracking-normal text-muted-foreground">
              — optional but recommended
            </span>
          </label>
          <Textarea
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="Paste the full listing description here. Copy everything the seller wrote — the more detail you give us, the deeper we can dig. Condition notes, what they mention and what they suspiciously don't mention — it all matters."
            className="min-h-[160px] resize-y p-5 text-[15px] leading-relaxed shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-colors focus-visible:border-primary focus-visible:ring-0"
            maxLength={8000}
          />
          <p className="mt-2 text-[12px] text-muted-foreground">
            Works with listings from Facebook Marketplace, Craigslist, OfferUp, eBay Motors, AutoTrader, or anywhere else.
          </p>
        </div>

        {/* Asking price */}
        <div>
          <label className="mb-2 block font-condensed text-xs font-semibold uppercase tracking-[0.12em] text-foreground">
            Asking Price ($ USD) <span className="text-primary">*</span>
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-base font-semibold text-muted-foreground">
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
              className="h-12 pl-9 font-mono text-base transition-colors focus-visible:border-primary focus-visible:ring-0"
            />
          </div>
        </div>

        {error && (
          <p className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary">
            {error}
          </p>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="cta-active h-14 w-full bg-primary text-base font-semibold uppercase tracking-wide text-primary-foreground shadow-[0_2px_12px_rgba(178,34,34,0.18)] transition hover:bg-primary/90"
        >
          Run Inspection Analysis
        </Button>

        <p className="text-center text-[13px] text-muted-foreground">
          Your first 3 red flags are always free — no account required.
        </p>
      </div>
    </section>
  );
}