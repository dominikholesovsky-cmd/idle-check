import { useState, useMemo } from "react";
import { Clock, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NhtsaStatus } from "./NhtsaStatus";
import type { AnalysisState } from "@/routes/index";

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

interface LandingViewProps {
  onSubmit: (data: LandingSubmit) => void;
  history: AnalysisState[];
  onLoadHistory: (entry: AnalysisState) => void;
}

const VEHICLE_DB: Record<string, Record<string, string[]>> = {
  Toyota: {
    "Supra": ["2JZ-GE (NA)", "2JZ-GTE (Turbo)", "1JZ-GTE (Turbo)", "B58 (Turbo, 2020+)"],
    "Corolla": ["1ZZ-FE (NA)", "2ZZ-GE (NA)", "2ZR-FE (NA)"],
    "Camry": ["2AR-FE (NA)", "2GR-FE V6 (NA)", "A25A-FXS Hybrid"],
    "Celica": ["2ZZ-GE (NA)", "1ZZ-FE (NA)", "3S-GTE (Turbo)"],
    "MR2": ["3S-GTE (Turbo)", "5S-FE (NA)", "1ZZ-FE (NA)"],
    "86 / GR86": ["FA20 (NA)", "FA24 (NA, 2022+)"],
    "Tacoma": ["2TR-FE (NA)", "1GR-FE V6 (NA)", "2GR-FKS V6 (NA)"],
    "Tundra": ["1UR-FE V8 (NA)", "2UR-GSE V8 (NA)"],
    "4Runner": ["1GR-FE V6 (NA)", "2GR-FKS V6 (NA)", "5VZ-FE V6 (NA)"],
    "Land Cruiser": ["1FZ-FE (NA)", "2UZ-FE V8 (NA)", "3UR-FBE V8 (NA)"],
    "Prius": ["2ZR-FXE Hybrid", "TNGA Hybrid (2023+)"],
  },
  Honda: {
    "S2000": ["F20C (NA)", "F22C (NA)"],
    "Civic": ["B16A (NA)", "B18C (NA)", "D16 (NA)", "K20A (NA)", "K20C Turbo", "L15B Turbo"],
    "Accord": ["K24 (NA)", "J30 V6 (NA)", "J35 V6 (NA)", "K20C Turbo"],
    "Integra": ["B18C (NA)", "B18C Type R (NA)", "K24 Turbo (2023+)"],
    "Prelude": ["H22A (NA)", "H23A (NA)", "F22B (NA)"],
    "CR-V": ["K24 (NA)", "L15B Turbo"],
    "NSX": ["C30A (NA)", "C32B (NA)", "Sport Hybrid (2017+)"],
    "Fit": ["L13A (NA)", "L15A (NA)"],
  },
  Nissan: {
    "350Z": ["VQ35DE (NA)", "VQ35HR (NA)"],
    "370Z": ["VQ37VHR (NA)"],
    "GT-R": ["VR38DETT Twin-Turbo"],
    "Silvia S13": ["SR20DET (Turbo)", "CA18DET (Turbo)"],
    "Silvia S14": ["SR20DET (Turbo)"],
    "Silvia S15": ["SR20DET (Turbo)"],
    "Skyline R32": ["RB20DET (Turbo)", "RB26DETT Twin-Turbo"],
    "Skyline R33": ["RB25DET (Turbo)", "RB26DETT Twin-Turbo"],
    "Skyline R34": ["RB25DET NEO (Turbo)", "RB26DETT Twin-Turbo"],
    "Altima": ["QR25DE (NA)", "VQ35DE (NA)", "KR20DDET Turbo"],
    "Sentra": ["QG18DE (NA)", "SR20DE (NA)", "VC-Turbo"],
    "Frontier": ["VQ40DE V6 (NA)", "KA24DE (NA)"],
    "Pathfinder": ["VQ35DE V6 (NA)", "VQ40DE V6 (NA)"],
  },
  Mazda: {
    "MX-5 Miata (NA)": ["1.6 B6 (NA)", "1.8 BP (NA)"],
    "MX-5 Miata (NB)": ["1.8 BP (NA)", "1.8 BP Turbo (Mazdaspeed)"],
    "MX-5 Miata (NC)": ["2.0 LF-VE (NA)"],
    "MX-5 Miata (ND)": ["2.0 P5-VPS (NA)"],
    "RX-7 FC": ["13B-T Turbo (Single)", "13B-TDET Twin-Turbo"],
    "RX-7 FD": ["13B-REW Twin-Turbo"],
    "RX-8": ["13B-MSP RENESIS (NA)"],
    "Mazdaspeed3": ["L3-VDT (Turbo)"],
    "Mazda3": ["LF-VE (NA)", "P5-VPS (NA)"],
    "Mazda6": ["LF-VE (NA)", "PY-VPTS (NA)"],
    "CX-5": ["PE-VPS (NA)", "PY-VPTS (NA)", "SH-VPTS Diesel Turbo"],
  },
  Subaru: {
    "WRX": ["EJ205 Turbo", "EJ255 Turbo", "EJ257 Turbo", "FA20DIT Turbo", "FA24F Turbo"],
    "WRX STI": ["EJ207 Turbo", "EJ257 Turbo"],
    "Impreza": ["EJ15 (NA)", "EJ20 (NA)", "FB20 (NA)"],
    "BRZ": ["FA20 (NA)", "FA24 (NA, 2022+)"],
    "Legacy": ["EJ25 (NA)", "EZ30 H6 (NA)", "FA24 Turbo"],
    "Outback": ["EJ25 (NA)", "FB25 (NA)", "FA24 Turbo"],
    "Forester": ["EJ20 Turbo", "EJ25 (NA)", "FB20 (NA)", "FA24 Turbo"],
  },
  Mitsubishi: {
    "Lancer Evolution I–III": ["4G63T Turbo"],
    "Lancer Evolution IV–VI": ["4G63T Turbo"],
    "Lancer Evolution VII–IX": ["4G63T Turbo"],
    "Lancer Evolution X": ["4B11T Turbo"],
    "Eclipse (1G/2G)": ["4G63T Turbo", "4G63 (NA)", "6G72 V6 (NA)"],
    "Eclipse (3G/4G)": ["4G69 (NA)", "6G72 V6 (NA)"],
    "3000GT": ["6G72 NA", "6G72 Twin-Turbo VR-4"],
  },
  BMW: {
    "E30 (3 Series)": ["M20B25 (NA)", "M42B18 (NA)", "S14B23 M3 (NA)"],
    "E36 (3 Series)": ["M50B25 (NA)", "M52B28 (NA)", "S52B32 M3 (NA)"],
    "E46 (3 Series)": ["M54B30 (NA)", "M43B19 (NA)", "S54B32 M3 (NA)"],
    "E90/E92 (3 Series)": ["N52B30 (NA)", "N54B30 Twin-Turbo", "N55B30 Turbo", "S65B40 M3 V8"],
    "F30 (3 Series)": ["B46B20 Turbo", "B58B30 Turbo"],
    "E39 (5 Series)": ["M54B30 (NA)", "M62B44 V8 (NA)", "S62B50 M5 V8"],
    "Z3": ["M44B19 (NA)", "M52B28 (NA)", "S54B32 M (NA)"],
    "Z4": ["N52B30 (NA)", "N54B30 Turbo", "B58B30 Turbo"],
    "M2": ["N55B30 Turbo", "S55B30 Twin-Turbo", "S58B30 Twin-Turbo"],
    "M3 / M4": ["S55B30 Twin-Turbo", "S58B30 Twin-Turbo", "S54B32 E46 (NA)"],
  },
  "Mercedes-Benz": {
    "C-Class (W202)": ["M111 (NA)", "M104 (NA)"],
    "C-Class (W203)": ["M271 Turbo", "M272 V6 (NA)"],
    "C-Class (W204)": ["M271 Turbo", "M272 V6 (NA)", "M156 AMG V8"],
    "E-Class (W210)": ["M112 V6 (NA)", "M113 V8 (NA)"],
    "E-Class (W211)": ["M272 V6 (NA)", "M273 V8 (NA)"],
    "SLK": ["M111 Turbo", "M272 V6 (NA)"],
    "C63 AMG": ["M156 V8 (NA)", "M177 Twin-Turbo"],
    "A45 AMG": ["M133 Turbo", "M139 Turbo (2020+)"],
  },
  Audi: {
    "A3 / S3 / RS3": ["EA888 2.0T Turbo", "2.5 TFSI RS3 5cyl Turbo", "1.8T Turbo"],
    "A4 / S4 / RS4": ["2.0T TFSI Turbo", "3.0T Supercharged V6", "2.9T Twin-Turbo V6", "1.8T B5 Turbo"],
    "TT": ["1.8T Turbo", "3.2 VR6 (NA)", "2.5 TFSI RS 5cyl Turbo"],
    "R8": ["4.2 FSI V8 (NA)", "5.2 FSI V10 (NA)"],
  },
  Volkswagen: {
    "Golf GTI (Mk4)": ["1.8T AUM (150hp)", "1.8T BAM (180hp)"],
    "Golf GTI (Mk5)": ["BPY 2.0T FSI Turbo"],
    "Golf GTI (Mk6)": ["CCZA 2.0T TSI Turbo"],
    "Golf GTI (Mk7/7.5)": ["IS20 2.0T TSI Turbo"],
    "Golf R (Mk7)": ["IS38 2.0T TSI Turbo"],
    "Golf GTI (Mk8)": ["EA888 evo4 2.0T Turbo"],
    "Jetta": ["1.8T Turbo", "2.5 BGP (NA)", "1.4 TSI Turbo"],
  },
  Porsche: {
    "911 (996)": ["3.4 M96 (NA)", "3.6 M96 (NA)", "3.6 Twin-Turbo"],
    "911 (997)": ["3.6 MA1 (NA)", "3.8 MA1 (NA)", "3.6 Twin-Turbo", "3.8 GT3 (NA)"],
    "911 (991)": ["3.4 MA1 (NA)", "3.8 MA1 (NA)", "3.8 Turbo", "4.0 GT3 (NA)"],
    "Boxster / Cayman (986)": ["2.5 M96 (NA)", "2.7 M96 (NA)", "3.2 S (NA)"],
    "Boxster / Cayman (987)": ["2.7 MA1 (NA)", "3.4 Cayman S (NA)"],
  },
  Ford: {
    "Mustang (SN95)": ["4.6 2V SOHC (NA)", "4.6 4V Cobra (NA)", "5.0 HO (NA)"],
    "Mustang (S197)": ["4.0 V6 (NA)", "4.6 3V (NA)", "5.0 Coyote (NA)", "5.4 Shelby SC"],
    "Mustang (S550)": ["2.3 EcoBoost Turbo", "5.0 Coyote (NA)", "5.2 Voodoo (NA)", "5.2 Predator SC"],
    "Focus ST": ["EcoBoost 2.0T Turbo"],
    "Focus RS": ["EcoBoost 2.3T Turbo"],
    "F-150": ["5.0 Coyote V8 (NA)", "3.5 EcoBoost TT", "2.7 EcoBoost TT", "5.4 Triton V8"],
    "Bronco": ["2.3 EcoBoost Turbo", "2.7 EcoBoost TT"],
  },
  Chevrolet: {
    "Camaro (4th gen)": ["LT1 5.7 V8 (NA)", "LT4 5.7 V8 (NA)", "3.8 V6 SC"],
    "Camaro (5th gen)": ["LS3 6.2 V8 (NA)", "LSA 6.2 SC"],
    "Camaro (6th gen)": ["LT1 6.2 V8 (NA)", "LT4 6.2 SC", "2.0T Turbo"],
    "Corvette C5": ["LS1 5.7 V8 (NA)", "LS6 5.7 V8 (NA)"],
    "Corvette C6": ["LS2 6.0 V8 (NA)", "LS3 6.2 V8 (NA)", "LS9 6.2 SC ZR1"],
    "Corvette C7": ["LT1 6.2 V8 (NA)", "LT4 6.2 SC Z06"],
    "Silverado": ["5.3 EcoTec3 V8", "6.2 EcoTec3 V8", "2.7T Turbo", "3.0 Duramax Diesel"],
  },
  Dodge: {
    "Challenger": ["5.7 HEMI V8 (NA)", "6.4 392 HEMI V8 (NA)", "6.2 Hellcat SC", "3.6 Pentastar V6"],
    "Charger": ["5.7 HEMI V8 (NA)", "6.4 392 HEMI V8 (NA)", "6.2 Hellcat SC"],
    "Viper": ["8.0 V10 (NA)", "8.4 V10 (NA)"],
  },
  Jeep: {
    "Wrangler TJ": ["4.0 AMC I6 (NA)", "2.5 I4 (NA)"],
    "Wrangler JK": ["3.8 EGH V6 (NA)", "3.6 Pentastar V6 (NA)"],
    "Wrangler JL": ["3.6 Pentastar V6 (NA)", "2.0T Turbo", "3.0 EcoDiesel Turbo", "6.4 392 HEMI V8"],
    "Grand Cherokee": ["5.7 HEMI V8 (NA)", "6.4 SRT HEMI (NA)", "3.6 V6 (NA)", "6.2 Trackhawk SC"],
  },
  Hyundai: {
    "Genesis Coupe": ["2.0T Theta II Turbo", "3.8 Lambda V6 (NA)"],
    "Veloster N": ["2.0T Gamma Turbo"],
    "Veloster Turbo": ["1.6T Gamma Turbo"],
    "Elantra N": ["2.0T Theta II Turbo"],
    "Sonata": ["2.4 Theta II (NA)", "2.0T Theta II Turbo"],
  },
  Kia: {
    "Stinger": ["2.0T Theta II Turbo", "3.3T Lambda Twin-Turbo"],
    "Optima / K5": ["2.4 Theta II (NA)", "2.0T Theta II Turbo"],
    "Soul": ["1.6 Gamma (NA)", "2.0 NU (NA)", "1.6T Gamma Turbo"],
  },
  Lexus: {
    "IS300 / IS200": ["1G-FE I6 (NA)", "2JZ-GE I6 (NA)"],
    "IS F": ["2UR-GSE V8 (NA)"],
    "IS 350": ["2GR-FSE V6 (NA)", "2GR-FKS V6 (NA)"],
    "SC300 / SC400": ["2JZ-GE (NA)", "1UZ-FE V8 (NA)"],
    "RC F / GS F": ["2UR-GSE V8 (NA)"],
  },
  Infiniti: {
    "G35": ["VQ35DE (NA)", "VQ35HR (NA)"],
    "G37": ["VQ37VHR (NA)"],
    "Q50 / Q60": ["VQ37VHR (NA)", "VR30DDTT Twin-Turbo"],
    "Q60 Red Sport": ["VR30DDTT Twin-Turbo"],
  },
  Acura: {
    "RSX Type-S": ["K20A2 (NA)", "K20Z1 (NA)"],
    "NSX (NA1)": ["C30A (NA)", "C32B (NA)"],
    "Integra Type R": ["B18C5 (NA)"],
    "TL Type-S": ["J32A3 V6 (NA)"],
  },
};

const MAKES = Object.keys(VEHICLE_DB).sort();

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
  value, onChange, options, placeholder, disabled,
}: {
  value: string; onChange: (v: string) => void;
  options: string[]; placeholder: string; disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-8 text-[14px] transition-colors focus:border-primary focus:outline-none ${
          disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"
        } ${!value ? "text-muted-foreground" : "text-foreground"}`}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

export function LandingView({ onSubmit, history, onLoadHistory }: LandingViewProps) {
  const [manualText, setManualText] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [engineType, setEngineType] = useState("");
  const [year, setYear] = useState("");
  const [mileage, setMileage] = useState("");
  const [vin, setVin] = useState("");
  const [askingPrice, setAskingPrice] = useState("");
  const [error, setError] = useState<string | null>(null);

  const modelOptions = useMemo(() => (make ? Object.keys(VEHICLE_DB[make] ?? {}) : []), [make]);
  const engineOptions = useMemo(() => (make && model ? VEHICLE_DB[make]?.[model] ?? [] : []), [make, model]);

  const handleMakeChange = (v: string) => { setMake(v); setModel(""); setEngineType(""); };
  const handleModelChange = (v: string) => { setModel(v); setEngineType(""); };

  const priceNum = Number(askingPrice);
  const priceValid = askingPrice !== "" && !Number.isNaN(priceNum) && priceNum > 0 && priceNum <= 1_000_000;
  const hasVehicleBase = make && model && year;
  const canSubmit = priceValid && hasVehicleBase;

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
        <h1 className="font-sans text-[64px] font-extrabold leading-[0.95] tracking-tight sm:text-[96px]" style={{ letterSpacing: "-2px" }}>
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
            <span className="font-condensed text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Recent Reports</span>
          </div>
          <ul className="space-y-2">
            {history.slice(0, 5).map((entry, i) => (
              <li key={i}>
                <button type="button" onClick={() => onLoadHistory(entry)}
                  className="group flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:border-primary/40">
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
                <label className="mb-1.5 block font-condensed text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Make</label>
                <Select value={make} onChange={handleMakeChange} options={MAKES} placeholder="Select make..." />
              </div>
              <div>
                <label className="mb-1.5 block font-condensed text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Model</label>
                <Select value={model} onChange={handleModelChange} options={modelOptions}
                  placeholder={make ? "Select model..." : "Select make first"} disabled={!make} />
              </div>
            </div>

            {/* Engine */}
            <div>
              <label className="mb-1.5 block font-condensed text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Engine</label>
              <Select value={engineType} onChange={setEngineType} options={engineOptions}
                placeholder={model ? "Select engine..." : "Select model first"} disabled={!model} />
            </div>

            {/* Year + Mileage */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block font-condensed text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Year *</label>
                <Input type="number" value={year} onChange={(e) => setYear(e.target.value)}
                  placeholder="e.g. 2004" min={1970} max={2026}
                  className="transition-colors focus-visible:border-primary focus-visible:ring-0" />
              </div>
              <div>
                <label className="mb-1.5 block font-condensed text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Mileage</label>
                <div className="relative">
                  <Input type="number" value={mileage} onChange={(e) => setMileage(e.target.value)}
                    placeholder="e.g. 87000" min={0} max={999999}
                    className="pr-8 transition-colors focus-visible:border-primary focus-visible:ring-0" />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-condensed text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">mi</span>
                </div>
              </div>
            </div>

            {/* VIN — optional */}
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
                onChange={(e) => setVin(e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, ""))}
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
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-base font-semibold text-muted-foreground">$</span>
            <Input type="number" value={askingPrice} onChange={(e) => setAskingPrice(e.target.value)}
              placeholder="12,500" min={0} max={1_000_000} step={100}
              className="h-12 pl-9 font-mono text-base transition-colors focus-visible:border-primary focus-visible:ring-0" />
          </div>
        </div>

        {error && (
          <p className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary">{error}</p>
        )}

        <Button onClick={handleSubmit} disabled={!canSubmit}
          className="cta-active h-14 w-full bg-primary text-base font-semibold uppercase tracking-wide text-primary-foreground shadow-[0_2px_12px_rgba(178,34,34,0.18)] transition hover:bg-primary/90">
          Run Inspection Analysis
        </Button>

        <p className="text-center text-[13px] text-muted-foreground">
          Your first 3 red flags are always free — no account required.
        </p>
      </div>
    </section>
  );
}