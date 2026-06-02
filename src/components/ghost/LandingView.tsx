import { useState } from "react";
import { Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AnalysisState } from "@/routes/index";

export interface LandingSubmit {
  manualText: string;
  make: string;
  model: string;
  year: string;
  askingPrice: number;
}

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

export function LandingView({ onSubmit, history, onLoadHistory }: LandingViewProps) {
  const [manualText, setManualText] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [askingPrice, setAskingPrice] = useState("");
  const [error, setError] = useState<string | null>(null);

  const hasListingData =
    manualText.trim().length > 0 || (make.trim() && model.trim() && year.trim());
  const priceNum = Number(askingPrice);
  const priceValid =
    askingPrice !== "" && !Number.isNaN(priceNum) && priceNum > 0 && priceNum <= 1_000_000;
  const canSubmit = hasListingData && priceValid;

  const handleSubmit = () => {
    if (!hasListingData) {
      setError("Paste the listing text, or fill in Make / Model / Year.");
      return;
    }
    if (!priceValid) {
      setError("Asking price is required to generate your negotiation offer.");
      return;
    }
    setError(null);
    onSubmit({ manualText, make, model, year, askingPrice: priceNum });
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
          Paste any listing. Get the inspection checklist, repair costs, and negotiation script —
          before you drive out to see it.
        </p>
        <div className="mt-5 h-[2px] w-[60px] bg-primary" />
      </div>

      {/* Recent Reports History */}
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
                  className="group flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-card"
                >
                  <div className="min-w-0">
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

      {/* Main Input */}
      <div className="mt-12 space-y-6">
        <div>
          <label className="mb-2 block font-condensed text-xs font-semibold uppercase tracking-[0.12em] text-foreground">
            Listing Text
          </label>
          <Textarea
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="Paste the full listing description here. Copy everything the seller wrote — the more detail you give us, the deeper we can dig. Year, mileage, condition notes, what they mention and what they suspiciously don't mention — it all matters."
            className="min-h-[180px] resize-y p-5 text-[15px] leading-relaxed shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-colors duration-200 focus-visible:border-primary focus-visible:ring-0"
            maxLength={8000}
          />
        </div>

        <div>
          <label className="mb-2 block font-condensed text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Vehicle details — fill in if not already in the listing text
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input
              value={make}
              onChange={(e) => setMake(e.target.value)}
              placeholder="Make"
              maxLength={50}
              className="transition-colors duration-200 focus-visible:border-primary focus-visible:ring-0"
            />
            <Input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Model"
              maxLength={50}
              className="transition-colors duration-200 focus-visible:border-primary focus-visible:ring-0"
            />
            <Input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="Year"
              min={1950}
              max={2026}
              className="transition-colors duration-200 focus-visible:border-primary focus-visible:ring-0"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block font-condensed text-xs font-semibold uppercase tracking-[0.12em] text-foreground">
            Listing Price / Asking Price ($ USD) <span className="text-primary">*</span>
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
              required
              className="h-12 pl-9 font-mono text-base transition-colors duration-200 focus-visible:border-primary focus-visible:ring-0"
            />
          </div>
        </div>

        {error && <p className="text-sm font-medium text-primary">{error}</p>}

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
        <p className="pt-2 text-center text-[13px] text-muted-foreground">
          Works with listings from Facebook Marketplace, Craigslist, OfferUp, eBay Motors,
          AutoTrader, or anywhere else. Just paste what the seller wrote.
        </p>
      </div>
    </section>
  );
}