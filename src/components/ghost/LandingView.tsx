import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export interface LandingSubmit {
  url: string;
  manualText: string;
  make: string;
  model: string;
  year: string;
  askingPrice: number;
}

export function LandingView({ onSubmit }: { onSubmit: (data: LandingSubmit) => void }) {
  const [url, setUrl] = useState("");
  const [manualText, setManualText] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [askingPrice, setAskingPrice] = useState("");
  const [openManual, setOpenManual] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasListingData = url.trim().length > 0 || manualText.trim().length > 0 || (make.trim() && model.trim() && year.trim());
  const priceNum = Number(askingPrice);
  const priceValid = askingPrice !== "" && !Number.isNaN(priceNum) && priceNum > 0 && priceNum <= 1_000_000;
  const canSubmit = hasListingData && priceValid;

  const handleSubmit = () => {
    if (!hasListingData) {
      setError("Provide a listing URL, paste listing text, or fill in Make / Model / Year.");
      return;
    }
    if (!priceValid) {
      setError("Asking price is required to generate your negotiation offer.");
      return;
    }
    setError(null);
    onSubmit({ url, manualText, make, model, year, askingPrice: priceNum });
  };

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-20">
      {/* Hero */}
      <div className="text-center">
        <h1 className="text-4xl font-black tracking-tight sm:text-6xl">GHOST INSPECTOR</h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Scrape any US vehicle listing with AI. Get an instant inspection checklist, repair cost layout,
          and negotiation script.
        </p>
        <p className="mt-6 font-mono text-[11px] uppercase tracking-wider text-muted-foreground sm:text-xs">
          Supports: Facebook Marketplace <span className="mx-1.5">|</span> Craigslist
          <span className="mx-1.5">|</span> OfferUp <span className="mx-1.5">|</span> eBay Motors
        </p>
      </div>

      {/* Main Input */}
      <div className="mt-10 space-y-5">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-foreground">
            Marketplace Listing URL
          </label>
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste US Marketplace Listing URL here..."
            className="h-12 font-mono text-sm"
            maxLength={500}
          />
        </div>

        <Collapsible open={openManual} onOpenChange={setOpenManual}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border border-border bg-secondary/40 px-4 py-3 text-left text-sm font-medium transition hover:bg-secondary">
            <span>Or paste listing text / specifications manually (Recommended for 100% accuracy)</span>
            <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${openManual ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <Textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Paste the full listing description here including year, make, model, mileage, and any seller notes..."
              className="min-h-32 font-mono text-sm"
              maxLength={5000}
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Manual Override Row */}
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-foreground">
            Manual Vehicle Override
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input value={make} onChange={(e) => setMake(e.target.value)} placeholder="Make" maxLength={50} />
            <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Model" maxLength={50} />
            <Input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="Year"
              min={1950}
              max={2026}
            />
          </div>
        </div>

        {/* Asking Price (Mandatory) */}
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-foreground">
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
              className="h-12 pl-9 font-mono text-base"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm font-medium text-primary">{error}</p>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="h-14 w-full bg-primary text-base font-semibold uppercase tracking-wide text-primary-foreground hover:bg-primary/90"
        >
          Analyze Listing & Generate Protocol
        </Button>
      </div>
    </section>
  );
}
