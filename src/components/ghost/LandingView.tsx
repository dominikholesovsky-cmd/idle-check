import { useState, useMemo } from "react";
import { Clock, ChevronRight, ChevronDown } from "lucide-react";
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
  engineType?: string;
  mileage?: string;
}

interface LandingViewProps {
  onSubmit: (data: LandingSubmit) => void;
  history: AnalysisState[];
  onLoadHistory: (entry: AnalysisState) => void;
}

// ─── Make / Model / Engine database ──────────────────────────────────────────

const VEHICLE_DB: Record<string, Record<string, string[]>> = {
  Toyota: {
    "Supra": ["2JZ-GE (NA)", "2JZ-GTE (Turbo)", "1JZ-GTE (Turbo)", "B58 (Turbo, 2020+)"],
    "Corolla": ["1ZZ-FE (NA)", "2ZZ-GE (NA)", "2NR-FE (NA)", "2ZR-FE (NA)"],
    "Camry": ["2AR-FE (NA)", "2GR-FE V6 (NA)", "A25A-FXS Hybrid", "2AZ-FE (NA)"],
    "Celica": ["2ZZ-GE (NA)", "1ZZ-FE (NA)", "3S-GTE (Turbo)", "5S-FE (NA)"],
    "MR2": ["3S-GTE (Turbo)", "5S-FE (NA)", "1ZZ-FE (NA)", "AW11 4A-GE (NA)"],
    "86 / GR86": ["FA20 (NA)", "FA24 (NA, 2022+)"],
    "Tacoma": ["2TR-FE (NA)", "1GR-FE V6 (NA)", "2GR-FKS V6 (NA)"],
    "Tundra": ["1UR-FE V8 (NA)", "2UR-GSE V8 (NA)", "iForce V6 Hybrid"],
    "4Runner": ["1GR-FE V6 (NA)", "2GR-FKS V6 (NA)", "5VZ-FE V6 (NA)"],
    "Land Cruiser": ["1FZ-FE (NA)", "2UZ-FE V8 (NA)", "3UR-FBE V8 (NA)"],
    "Prius": ["2ZR-FXE Hybrid", "2ZR-FXE Hybrid (Gen 4)", "TNGA Hybrid (2023+)"],
    "Hilux": ["1KD-FTV Diesel (Turbo)", "2GD-FTV Diesel (Turbo)", "2TR-FE (NA)"],
  },
  Honda: {
    "S2000": ["F20C (NA)", "F22C (NA)"],
    "Civic": ["B16A (NA)", "B18C (NA)", "D16 (NA)", "K20A (NA)", "K20C Turbo", "L15B Turbo"],
    "Accord": ["K24 (NA)", "J30 V6 (NA)", "J35 V6 (NA)", "K20C Turbo"],
    "Integra": ["B18C (NA)", "B18C Type R (NA)", "K24 Turbo (2023+)"],
    "Prelude": ["H22A (NA)", "H23A (NA)", "F22B (NA)"],
    "CR-V": ["K24 (NA)", "L15B Turbo", "R20A (NA)"],
    "NSX": ["C30A (NA)", "C32B (NA)", "Sport Hybrid (2017+)"],
    "Fit / Jazz": ["L13A (NA)", "L15A (NA)", "GE8 (NA)"],
    "Odyssey": ["J35 V6 (NA)", "J35Y Hybrid"],
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
    "Sentra": ["QG18DE (NA)", "SR20DE (NA)", "MR20DE (NA)", "VC-Turbo"],
    "Frontier": ["VQ40DE V6 (NA)", "KA24DE (NA)"],
    "Xterra": ["VQ40DE V6 (NA)", "VG33E V6 (NA)"],
    "Pathfinder": ["VQ35DE V6 (NA)", "VQ40DE V6 (NA)"],
  },
  Mazda: {
    "MX-5 Miata (NA)": ["1.6 B6 (NA)", "1.8 BP (NA)"],
    "MX-5 Miata (NB)": ["1.8 BP (NA)", "1.8 BP Turbo (Mazdaspeed)"],
    "MX-5 Miata (NC)": ["2.0 LF-VE (NA)"],
    "MX-5 Miata (ND)": ["2.0 P5-VPS (NA)", "2.0 P5-VPR (NA)"],
    "RX-7 FC": ["13B-T Turbo (Single)", "13B-TDET Turbo (Twin, Turbo II)"],
    "RX-7 FD": ["13B-REW Twin-Turbo"],
    "RX-8": ["13B-MSP RENESIS (NA)"],
    "Mazdaspeed3": ["L3-VDT (Turbo)"],
    "Mazdaspeed6": ["L3-VDT (Turbo)"],
    "Mazda3": ["L3-VE (NA)", "LF-VE (NA)", "P5-VPS (NA)", "L3-VDT Turbo (MS3)"],
    "Mazda6": ["L3-VE (NA)", "LF-VE (NA)", "PY-VPTS (NA)"],
    "CX-5": ["PE-VPS (NA)", "PY-VPTS (NA)", "SH-VPTS Diesel Turbo"],
    "CX-9": ["SkyActiv-G 2.5T Turbo", "3.7 V6 (NA, older)"],
  },
  Subaru: {
    "WRX": ["EJ205 Turbo", "EJ255 Turbo", "EJ257 Turbo", "FA20DIT Turbo", "FA24F Turbo"],
    "WRX STI": ["EJ207 Turbo", "EJ257 Turbo"],
    "Impreza": ["EJ15 (NA)", "EJ16 (NA)", "EJ20 (NA)", "FB20 (NA)"],
    "BRZ": ["FA20 (NA)", "FA24 (NA, 2022+)"],
    "Legacy": ["EJ20 (NA)", "EJ25 (NA)", "EZ30 H6 (NA)", "FA24 Turbo"],
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
    "3000GT / GTO": ["6G72 NA", "6G72 Twin-Turbo VR-4"],
    "Galant VR-4": ["4G63T Turbo"],
  },
  BMW: {
    "E30 (3 Series 82–94)": ["M20B25 (NA)", "M42B18 (NA)", "S14B23 M3 (NA)"],
    "E36 (3 Series 92–99)": ["M50B25 (NA)", "M52B28 (NA)", "S50B30 M3 (NA)", "S52B32 M3 (NA)"],
    "E46 (3 Series 99–06)": ["M54B30 (NA)", "M43B19 (NA)", "S54B32 M3 (NA)"],
    "E90/E92 (3 Series 05–13)": ["N52B30 (NA)", "N54B30 Twin-Turbo", "N55B30 Turbo", "S65B40 M3 V8 (NA)"],
    "F30 (3 Series 12–19)": ["B46B20 Turbo", "B58B30 Turbo", "S58B30 M3 Twin-Turbo"],
    "E39 (5 Series 96–03)": ["M54B30 (NA)", "M62B44 V8 (NA)", "S62B50 M5 V8 (NA)"],
    "E60 (5 Series 04–10)": ["N52B30 (NA)", "N54B30 Turbo", "S85B50 M5 V10 (NA)"],
    "Z3": ["M44B19 (NA)", "M52B28 (NA)", "S54B32 M (NA)"],
    "Z4": ["N52B30 (NA)", "N54B30 Turbo", "B58B30 Turbo"],
    "M2": ["N55B30 Turbo", "S55B30 Twin-Turbo", "S58B30 Twin-Turbo"],
    "M3 / M4": ["S55B30 Twin-Turbo", "S58B30 Twin-Turbo", "S54B32 (E46, NA)"],
  },
  "Mercedes-Benz": {
    "C-Class (W202)": ["M111 (NA)", "M104 (NA)", "M111 Turbo (C230K)"],
    "C-Class (W203)": ["M271 Turbo", "M272 V6 (NA)", "M156 AMG V8 (NA)"],
    "C-Class (W204)": ["M271 Turbo", "M272 V6 (NA)", "M156 AMG V8 (NA)"],
    "E-Class (W210)": ["M112 V6 (NA)", "M113 V8 (NA)", "OM606 Diesel"],
    "E-Class (W211)": ["M272 V6 (NA)", "M273 V8 (NA)", "M156 AMG V8 (NA)"],
    "SLK (R170/R171)": ["M111 Turbo", "M272 V6 (NA)"],
    "SL (R129/R230)": ["M104 (NA)", "M113 V8 (NA)", "M156 AMG V8 (NA)"],
    "A45 AMG": ["M133 Turbo", "M139 Turbo (2020+)"],
    "C63 AMG": ["M156 V8 (NA)", "M177 Twin-Turbo"],
  },
  Audi: {
    "A3 / S3 / RS3": ["EA888 Turbo (1.8T/2.0T)", "2.5 TFSI RS3 Turbo 5cyl", "1.8T AUM/AUQ Turbo"],
    "A4 / S4 / RS4": ["B5 1.8T AEB Turbo", "B6/B7 2.0T BWT Turbo", "B8 2.0T CDNB Turbo", "B5 S4 2.7T Biturbo", "B8 S4 3.0T Supercharged"],
    "TT": ["1.8T Turbo", "3.2 VR6 (NA)", "2.0 TFSI Turbo", "2.5 TFSI RS Turbo 5cyl"],
    "R8": ["4.2 FSI V8 (NA)", "5.2 FSI V10 (NA)", "5.2 FSI Plus V10 (NA)"],
    "A5 / S5": ["2.0 TFSI Turbo", "3.0 TFSI Supercharged V6", "2.9 TFSI RS5 Twin-Turbo"],
  },
  Volkswagen: {
    "Golf GTI (Mk4)": ["AUM 1.8T (150hp)", "BAM 1.8T (180hp)"],
    "Golf GTI (Mk5)": ["BPY 2.0T FSI Turbo"],
    "Golf GTI (Mk6)": ["CCZA 2.0T TSI Turbo"],
    "Golf GTI (Mk7/7.5)": ["IS20 2.0T TSI Turbo", "IS38 2.0T TSI Turbo (Golf R)"],
    "Golf GTI (Mk8)": ["EA888 evo4 2.0T Turbo"],
    "Golf R (Mk6)": ["CDLG 2.0T TSI Turbo"],
    "Golf R (Mk7)": ["IS38 2.0T TSI Turbo"],
    "Jetta": ["1.8T AEB/AWD Turbo", "2.0 AEG (NA)", "2.5 BGP (NA)", "1.4 TSI Turbo"],
    "Passat": ["1.8T Turbo", "2.0T TSI Turbo", "VR6 2.8 (NA)"],
  },
  Porsche: {
    "911 (964)": ["3.6 M64 (NA)", "3.6 M64 Turbo"],
    "911 (993)": ["3.6 M64 (NA)", "3.6 M64 Turbo Twin"],
    "911 (996)": ["3.4 M96 (NA)", "3.6 M96 (NA)", "3.6 Twin-Turbo"],
    "911 (997)": ["3.6 MA1 (NA)", "3.8 MA1 (NA)", "3.6 Twin-Turbo", "3.8 GT3 (NA)"],
    "911 (991)": ["3.4 MA1 (NA)", "3.8 MA1 (NA)", "3.8 Turbo", "4.0 GT3 (NA)"],
    "Boxster / Cayman (986)": ["2.5 M96 (NA)", "2.7 M96 (NA)", "3.2 S M96 (NA)"],
    "Boxster / Cayman (987)": ["2.7 MA1 (NA)", "3.2 S (NA)", "3.4 Cayman S (NA)"],
    "Cayenne": ["3.2 VR6 (NA)", "4.5 V8 (NA)", "4.5 Turbo V8", "3.0 Diesel Turbo"],
  },
  Ford: {
    "Mustang (SN95)": ["4.6 2V SOHC (NA)", "4.6 4V DOHC Cobra (NA)", "5.0 HO (NA)"],
    "Mustang (S197)": ["4.0 V6 (NA)", "4.6 3V (NA)", "5.4 Shelby Supercharged", "5.0 Coyote (NA)"],
    "Mustang (S550)": ["2.3 EcoBoost Turbo", "5.0 Coyote (NA)", "5.2 Voodoo (NA)", "5.2 Predator Supercharged"],
    "Focus ST (Mk3)": ["EcoBoost 2.0T Turbo"],
    "Focus RS (Mk3)": ["EcoBoost 2.3T Turbo"],
    "F-150": ["5.0 Coyote V8 (NA)", "3.5 EcoBoost Twin-Turbo", "2.7 EcoBoost Twin-Turbo", "5.4 Triton V8 (NA)", "Raptor 3.5TT / 5.2SC"],
    "Bronco": ["2.3 EcoBoost Turbo", "2.7 EcoBoost Twin-Turbo"],
    "Ranger": ["2.3 EcoBoost Turbo", "4.0 V6 (NA)"],
  },
  Chevrolet: {
    "Camaro (4th gen)": ["LT1 5.7 V8 (NA)", "LT4 5.7 V8 (NA)", "3.8 V6 Supercharged"],
    "Camaro (5th gen)": ["LS3 6.2 V8 (NA)", "LFX 3.6 V6 (NA)", "LSA 6.2 Supercharged"],
    "Camaro (6th gen)": ["LT1 6.2 V8 (NA)", "LT4 6.2 Supercharged", "2.0T Turbo", "3.6 V6 (NA)"],
    "Corvette C5": ["LS1 5.7 V8 (NA)", "LS6 5.7 V8 (NA)"],
    "Corvette C6": ["LS2 6.0 V8 (NA)", "LS3 6.2 V8 (NA)", "LS9 6.2 Supercharged ZR1"],
    "Corvette C7": ["LT1 6.2 V8 (NA)", "LT4 6.2 Supercharged Z06"],
    "Silverado": ["5.3 EcoTec3 V8", "6.2 EcoTec3 V8", "2.7T Turbo 4cyl", "3.0 Duramax Diesel"],
  },
  Dodge: {
    "Challenger": ["5.7 HEMI V8 (NA)", "6.4 392 HEMI V8 (NA)", "6.2 Supercharged Hellcat", "6.2 SC Demon/Jailbreak", "3.6 Pentastar V6 (NA)"],
    "Charger": ["5.7 HEMI V8 (NA)", "6.4 392 HEMI V8 (NA)", "6.2 Supercharged Hellcat", "3.6 Pentastar V6 (NA)"],
    "Viper": ["8.0 V10 (NA)", "8.4 V10 (NA)", "8.4 V10 ACR (NA)"],
    "Durango": ["5.7 HEMI V8 (NA)", "3.6 Pentastar V6 (NA)"],
  },
  Jeep: {
    "Wrangler TJ": ["4.0 AMC I6 (NA)", "2.5 I4 (NA)"],
    "Wrangler JK": ["3.8 EGH V6 (NA)", "3.6 Pentastar V6 (NA)"],
    "Wrangler JL": ["3.6 Pentastar V6 (NA)", "2.0T Turbo", "3.0 EcoDiesel Turbo", "6.4 392 HEMI V8"],
    "Grand Cherokee": ["5.7 HEMI V8 (NA)", "6.4 SRT HEMI V8 (NA)", "3.6 Pentastar V6 (NA)", "3.0 EcoDiesel Turbo", "6.2 Trackhawk Supercharged"],
  },
  Hyundai: {
    "Genesis Coupe": ["2.0T Theta II Turbo", "3.8 Lambda V6 (NA)"],
    "Veloster N": ["2.0T Gamma Turbo"],
    "Veloster Turbo": ["1.6T Gamma Turbo"],
    "Elantra N": ["2.0T Theta II Turbo"],
    "Elantra": ["1.8 NU (NA)", "2.0 Nu (NA)", "1.4T Kappa Turbo"],
    "Sonata": ["2.4 Theta II (NA)", "2.0T Theta II Turbo", "2.5T Turbo (N Line)"],
  },
  Kia: {
    "Stinger": ["2.0T Theta II Turbo", "3.3T Lambda Twin-Turbo"],
    "Optima / K5": ["2.4 Theta II (NA)", "2.0T Theta II Turbo", "2.5T Turbo (GT)"],
    "Soul": ["1.6 Gamma (NA)", "2.0 NU (NA)", "1.6T Gamma Turbo"],
  },
  Lexus: {
    "IS300 (1G-FE)": ["1G-FE I6 (NA)", "2JZ-GE I6 (NA)"],
    "IS F": ["2UR-GSE V8 (NA)"],
    "IS 350": ["2GR-FSE V6 (NA)", "2GR-FKS V6 (NA)"],
    "SC300 / SC400": ["2JZ-GE (NA)", "1UZ-FE V8 (NA)"],
    "GS300": ["2JZ-GE (NA)", "2GR-FSE V6 (NA)"],
    "RCF / GSF": ["2UR-GSE V8 (NA)"],
  },
  Infiniti: {
    "G35": ["VQ35DE (NA)", "VQ35HR (NA)"],
    "G37": ["VQ37VHR (NA)"],
    "Q50": ["VQ37VHR (NA)", "VR30DDTT Twin-Turbo"],
    "Q60": ["VQ37VHR (NA)", "VR30DDTT Twin-Turbo"],
    "Q60S Red Sport": ["VR30DDTT Twin-Turbo"],
  },
  Acura: {
    "RSX Type-S": ["K20A2 (NA)", "K20Z1 (NA)"],
    "NSX (NA1)": ["C30A (NA)", "C32B (NA)"],
    "NSX (2017+)": ["3.5 V6 Sport Hybrid Twin-Turbo"],
    "TL Type-S": ["J32A3 V6 (NA)"],
    "Integra Type R": ["B18C5 (NA)"],
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

// ─── Simple Select Component ──────────────────────────────────────────────────

function Select({
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-8 text-[14px] transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-0 ${
          disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"
        } ${!value ? "text-muted-foreground" : "text-foreground"}`}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function LandingView({ onSubmit, history, onLoadHistory }: LandingViewProps) {
  // Mode
  const [mode, setMode] = useState<"paste" | "manual">("paste");

  // Listing text
  const [manualText, setManualText] = useState("");

  // Structured fields
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [engineType, setEngineType] = useState("");
  const [year, setYear] = useState("");
  const [mileage, setMileage] = useState("");
  const [askingPrice, setAskingPrice] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Derived options
  const modelOptions = useMemo(() => (make ? Object.keys(VEHICLE_DB[make] ?? {}) : []), [make]);
  const engineOptions = useMemo(
    () => (make && model ? VEHICLE_DB[make]?.[model] ?? [] : []),
    [make, model],
  );

  // Reset cascades
  const handleMakeChange = (v: string) => {
    setMake(v);
    setModel("");
    setEngineType("");
  };
  const handleModelChange = (v: string) => {
    setModel(v);
    setEngineType("");
  };

  // Validation
  const priceNum = Number(askingPrice);
  const priceValid = askingPrice !== "" && !Number.isNaN(priceNum) && priceNum > 0 && priceNum <= 1_000_000;

  const hasVehicleBase = make && model && year;
  const canSubmit = priceValid && (
    mode === "paste"
      ? manualText.trim().length > 0 && hasVehicleBase
      : hasVehicleBase
  );

  const handleSubmit = () => {
    if (mode === "paste" && manualText.trim().length === 0) {
      setError("Paste the listing text to continue.");
      return;
    }
    if (!hasVehicleBase) {
      setError("Select Make, Model, and enter Year.");
      return;
    }
    if (!priceValid) {
      setError("Asking price is required to generate your negotiation offer.");
      return;
    }
    setError(null);
    onSubmit({
      manualText: mode === "paste" ? manualText : `${year} ${make} ${model} ${engineType}`.trim(),
      make,
      model,
      year,
      askingPrice: priceNum,
      engineType: engineType || undefined,
      mileage: mileage || undefined,
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
          Paste any listing. Get the inspection checklist, repair costs, and negotiation script —
          before you drive out to see it.
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

      {/* Main form */}
      <div className="mt-12 space-y-6">

        {/* Mode toggle */}
        <div className="flex rounded-lg border border-border bg-card p-1">
          <button
            type="button"
            onClick={() => setMode("paste")}
            className={`flex-1 rounded-md py-2 text-[13px] font-semibold font-condensed uppercase tracking-wider transition-colors ${
              mode === "paste"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Paste Listing Text
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={`flex-1 rounded-md py-2 text-[13px] font-semibold font-condensed uppercase tracking-wider transition-colors ${
              mode === "manual"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Manual Entry
          </button>
        </div>

        {/* Paste mode — listing textarea */}
        {mode === "paste" && (
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
            <p className="mt-2 text-[12px] text-muted-foreground">
              Works with listings from Facebook Marketplace, Craigslist, OfferUp, eBay Motors, AutoTrader, or anywhere else.
            </p>
          </div>
        )}

        {/* Vehicle details — always visible */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <label className="mb-4 block font-condensed text-xs font-semibold uppercase tracking-[0.12em] text-foreground">
            Vehicle Details
            {mode === "paste" && (
              <span className="ml-2 font-normal normal-case tracking-normal text-muted-foreground">
                — confirm or correct what's in the listing
              </span>
            )}
          </label>

          <div className="space-y-3">
            {/* Row 1: Make + Model */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block font-condensed text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Make
                </label>
                <Select
                  value={make}
                  onChange={handleMakeChange}
                  options={MAKES}
                  placeholder="Select make..."
                />
              </div>
              <div>
                <label className="mb-1.5 block font-condensed text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Model
                </label>
                <Select
                  value={model}
                  onChange={handleModelChange}
                  options={modelOptions}
                  placeholder={make ? "Select model..." : "Select make first"}
                  disabled={!make}
                />
              </div>
            </div>

            {/* Row 2: Engine */}
            <div>
              <label className="mb-1.5 block font-condensed text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Engine
              </label>
              <Select
                value={engineType}
                onChange={setEngineType}
                options={engineOptions}
                placeholder={model ? "Select engine..." : "Select model first"}
                disabled={!model}
              />
            </div>

            {/* Row 3: Year + Mileage */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block font-condensed text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Year
                </label>
                <Input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="e.g. 2004"
                  min={1970}
                  max={2026}
                  className="transition-colors duration-200 focus-visible:border-primary focus-visible:ring-0"
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
                    className="pr-8 transition-colors duration-200 focus-visible:border-primary focus-visible:ring-0"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-condensed text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    mi
                  </span>
                </div>
              </div>
            </div>
          </div>
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
              required
              className="h-12 pl-9 font-mono text-base transition-colors duration-200 focus-visible:border-primary focus-visible:ring-0"
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