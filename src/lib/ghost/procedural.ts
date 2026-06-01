import type { Category, Issue, Vehicle } from "./types";

export function detectMarketplace(url: string): string {
  const u = url.toLowerCase();
  if (u.includes("facebook.com/marketplace") || u.includes("fb.com")) return "Facebook Marketplace";
  if (u.includes("craigslist")) return "Craigslist";
  if (u.includes("offerup")) return "OfferUp";
  if (u.includes("ebay")) return "eBay Motors";
  if (u.trim().length > 0) return "External Listing";
  return "Direct Input";
}

const COMMON_MAKES = [
  "toyota","honda","ford","chevrolet","chevy","nissan","mazda","subaru","hyundai","kia",
  "bmw","audi","mercedes","mercedes-benz","volkswagen","vw","porsche","mini",
  "jeep","ram","dodge","gmc","cadillac","lincoln","buick","chrysler",
  "lexus","acura","infiniti","mitsubishi","volvo","jaguar","land rover","tesla","fiat","alfa romeo"
];

export function parseVehicle(input: {
  url?: string;
  text?: string;
  make?: string;
  model?: string;
  year?: string;
}): Vehicle {
  const manualYear = input.year ? parseInt(input.year, 10) : NaN;
  if (input.make && input.model && !Number.isNaN(manualYear)) {
    return { year: manualYear, make: titleCase(input.make), model: titleCase(input.model) };
  }
  const haystack = `${input.text ?? ""} ${input.url ?? ""}`.toLowerCase();
  const yearMatch = haystack.match(/\b(19[7-9]\d|20[0-2]\d)\b/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : (Number.isNaN(manualYear) ? null : manualYear);

  let make = input.make?.trim() ?? "";
  let model = input.model?.trim() ?? "";

  if (!make) {
    for (const m of COMMON_MAKES) {
      if (haystack.includes(m)) {
        make = m;
        break;
      }
    }
  }
  if (!model && make) {
    // Try grabbing the word after the make
    const re = new RegExp(`${make}\\s+([a-z0-9\\-]+)`, "i");
    const mm = haystack.match(re);
    if (mm) model = mm[1];
  }

  return {
    year: year,
    make: make ? titleCase(make) : "Unknown Make",
    model: model ? titleCase(model) : "Vehicle",
  };
}

function titleCase(s: string): string {
  return s
    .split(/\s+/)
    .map((w) => (w.length <= 3 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()))
    .join(" ");
}

const GERMAN = /\b(bmw|audi|mercedes|mercedes-benz|vw|volkswagen|porsche)\b/i;
const TRUCK = /\b(wrangler|jeep|f-?150|silverado|ram|tacoma|tundra|truck|bronco)\b/i;

let idCounter = 0;
const mk = (label: string, cost: number, category: Category): Issue => ({
  id: `issue-${++idCounter}`,
  label,
  cost,
  category,
});

const GENERIC_POOL: Record<Category, Array<[string, number]>> = {
  "Engine & Drivetrain": [
    ["Spark Plug & Coil Service", 280],
    ["Transmission Fluid Service", 320],
    ["Serpentine Belt Replacement", 220],
    ["Cooling System Flush", 250],
    ["Motor Mount Inspection", 380],
  ],
  "Chassis & Suspension": [
    ["Alignment & Tire Balance", 180],
    ["Sway Bar End Links", 240],
    ["Brake Fluid Flush", 160],
    ["Wheel Bearing Inspection", 420],
    ["Strut Assembly Wear", 700],
  ],
  "Body & Electrical": [
    ["Headlight Restoration", 180],
    ["Door Seal & Weatherstrip", 220],
    ["Battery Load Test", 200],
    ["Paint Correction (Hood/Roof)", 650],
    ["Interior Trim & Switches", 280],
  ],
};

export function generateIssues(vehicle: Vehicle): Issue[] {
  idCounter = 0;
  const issues: Issue[] = [];
  const seen = new Set<string>();
  const push = (i: Issue) => {
    if (seen.has(i.label)) return;
    seen.add(i.label);
    issues.push(i);
  };

  const makeStr = `${vehicle.make} ${vehicle.model}`;
  const year = vehicle.year ?? 2010;

  // Rule 1: German makes
  if (GERMAN.test(makeStr)) {
    const electrical = Math.random() < 0.5
      ? mk("VANOS/VVT Solenoid Failure", 450, "Engine & Drivetrain")
      : mk("ABS Module Fault", 600, "Body & Electrical");
    push(electrical);
    push(mk("Oil Filter Housing Gasket Leak", 350, "Engine & Drivetrain"));
  }

  // Rule 2: Truck / off-road
  if (TRUCK.test(makeStr)) {
    push(mk("Transfer Case Fluid Leak", 250, "Engine & Drivetrain"));
    push(mk("Steering Box Play / Death Wobble Check", 500, "Chassis & Suspension"));
  }

  // Rule 3-5: Age-based
  if (year < 2005) {
    push(mk("Suspension Bushing Wear", 400, "Chassis & Suspension"));
    push(mk("Valve Cover Gasket Leak", 250, "Engine & Drivetrain"));
    push(mk("Subframe Surface Rust", 600, "Body & Electrical"));
    push(mk("Worn Engine Mounts", 350, "Engine & Drivetrain"));
  } else if (year < 2015) {
    push(mk("Timing Chain Tensioner Noise", 900, "Engine & Drivetrain"));
    push(mk("Coolant Expansion Tank Crack", 200, "Engine & Drivetrain"));
    push(mk("Control Arm Bushings", 450, "Chassis & Suspension"));
    push(mk("O2 Sensor Fault", 180, "Body & Electrical"));
  } else {
    push(mk("Infotainment Software Glitch", 150, "Body & Electrical"));
    push(mk("Battery Health Degradation", 250, "Body & Electrical"));
    push(mk("Brake Pad & Rotor Wear", 400, "Chassis & Suspension"));
    push(mk("Cabin Air Filter & HVAC Service", 180, "Engine & Drivetrain"));
  }

  // Top up each category to at least 4 items from generic pool
  const categories: Category[] = ["Engine & Drivetrain", "Chassis & Suspension", "Body & Electrical"];
  for (const cat of categories) {
    const count = () => issues.filter((i) => i.category === cat).length;
    const pool = GENERIC_POOL[cat];
    let pi = 0;
    while (count() < 4 && pi < pool.length) {
      const [label, cost] = pool[pi++];
      push(mk(label, cost, cat));
    }
  }

  return issues;
}
