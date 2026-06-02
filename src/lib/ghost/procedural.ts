import type { Category, Issue, Recall, Severity, Vehicle } from "./types";

const MARKETPLACES = [
  { match: /facebook\s*marketplace|fb\.com|facebook\.com/i, name: "Facebook Marketplace" },
  { match: /craigslist|\.craigslist\.org/i, name: "Craigslist" },
  { match: /offerup/i, name: "OfferUp" },
  { match: /ebay\s*motors|ebay/i, name: "eBay Motors" },
  { match: /autotrader/i, name: "AutoTrader" },
  { match: /cars\.com/i, name: "Cars.com" },
];

export function detectMarketplace(text: string): string {
  if (!text) return "the listing";
  for (const mp of MARKETPLACES) if (mp.match.test(text)) return mp.name;
  return "the listing";
}

const COMMON_MAKES = [
  "toyota","honda","ford","chevrolet","chevy","nissan","mazda","subaru","hyundai","kia",
  "bmw","audi","mercedes","mercedes-benz","volkswagen","vw","porsche","mini",
  "jeep","ram","dodge","gmc","cadillac","lincoln","buick","chrysler",
  "lexus","acura","infiniti","mitsubishi","volvo","jaguar","land rover","tesla","fiat","alfa romeo",
];

// Known chassis codes / trim hints by model
const TRIM_HINTS: Array<{ test: RegExp; trim: string }> = [
  { test: /\b330i\b|\b325i\b|\b328i\b|e46/i, trim: "E46" },
  { test: /\b335i\b|\b328i\b.*2010|e90|e92/i, trim: "E90" },
  { test: /350z|fairlady/i, trim: "Z33" },
  { test: /370z/i, trim: "Z34" },
  { test: /miata.*nb|nb miata/i, trim: "NB" },
  { test: /miata.*nc|nc miata/i, trim: "NC" },
  { test: /miata.*na|na miata/i, trim: "NA" },
  { test: /wrangler.*tj|tj wrangler/i, trim: "TJ" },
  { test: /wrangler.*jk|jk wrangler/i, trim: "JK" },
  { test: /wrangler.*jl|jl wrangler/i, trim: "JL" },
];

export function parseVehicle(input: {
  text?: string;
  make?: string;
  model?: string;
  year?: string;
}): Vehicle {
  const manualYear = input.year ? parseInt(input.year, 10) : NaN;
  const haystack = (input.text ?? "").toLowerCase();

  const yearMatch = haystack.match(/\b(19[7-9]\d|20[0-2]\d)\b/);
  const year = !Number.isNaN(manualYear)
    ? manualYear
    : yearMatch ? parseInt(yearMatch[1], 10) : null;

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
    const re = new RegExp(`${make}\\s+([a-z0-9\\-]+)`, "i");
    const mm = haystack.match(re);
    if (mm) model = mm[1];
  }

  // Mileage
  let mileage: number | null = null;
  const mi = haystack.match(/([\d,]{3,7})\s*(?:mi|miles|k\s*miles|k\s*mi)\b/);
  if (mi) {
    const raw = mi[1].replace(/,/g, "");
    let n = parseInt(raw, 10);
    if (/k\s*mi/.test(mi[0])) n = n * 1000;
    if (!Number.isNaN(n) && n > 100 && n < 500000) mileage = n;
  }

  // Trim / chassis
  let trim: string | undefined;
  for (const t of TRIM_HINTS) {
    if (t.test.test(haystack) || t.test.test(`${model}`)) {
      trim = t.trim;
      break;
    }
  }

  return {
    year,
    make: make ? titleCase(make) : "Unknown Make",
    model: model ? titleCase(model) : "Vehicle",
    trim,
    mileage,
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
function range(base: number): [number, number] {
  const lo = Math.round((base * 0.85) / 10) * 10;
  const hi = Math.round((base * 1.25) / 10) * 10;
  return [lo, hi];
}

function mk(
  label: string,
  base: number,
  category: Category,
  severity: Severity,
  explanation: string,
): Issue {
  const [costMin, costMax] = range(base);
  return {
    id: `issue-${++idCounter}`,
    label,
    category,
    severity,
    costMin,
    costMax,
    explanation,
  };
}

const GENERIC_POOL: Record<Category, Array<{ label: string; base: number; sev: Severity; exp: string }>> = {
  "Engine & Drivetrain": [
    { label: "Spark Plug & Coil Pack Service", base: 280, sev: "LOW", exp: "Standard tune-up item. Worn plugs cause rough idle and reduced mpg. Ask if it's been done recently — if the seller doesn't know, budget for a fresh set." },
    { label: "Transmission Fluid Service", base: 320, sev: "MED", exp: "Most sellers neglect this. Old fluid shortens transmission life dramatically. Pull the dipstick if accessible — fluid should be pink/red, not brown or burnt-smelling." },
    { label: "Serpentine Belt Replacement", base: 220, sev: "LOW", exp: "Look for visible cracks or glazing on the belt. A failed serpentine belt strands you and can damage the engine. Cheap to replace as preventive maintenance." },
    { label: "Cooling System Flush", base: 250, sev: "MED", exp: "Coolant degrades over time and rusts internal passages. Check the reservoir for rusty brown coolant or oily film floating on top — both are bad signs." },
    { label: "Motor Mount Inspection", base: 380, sev: "MED", exp: "Worn motor mounts cause vibration at idle and a thud when shifting into gear. Rock the engine by hand with the hood open — excessive movement means they're shot." },
  ],
  "Chassis & Suspension": [
    { label: "Alignment & Tire Balance", base: 180, sev: "LOW", exp: "Almost always needed on a used car. Watch how the car tracks on a test drive — pulling to one side or a vibrating wheel at speed means it's overdue." },
    { label: "Sway Bar End Links", base: 240, sev: "LOW", exp: "Cheap part that wears out. Clunking over bumps is the telltale sign. Easy DIY but worth budgeting for since it affects handling and tire wear." },
    { label: "Brake Fluid Flush", base: 160, sev: "LOW", exp: "Brake fluid absorbs moisture and degrades. If it looks dark brown in the reservoir, it's overdue. Important for brake feel and ABS module longevity." },
    { label: "Wheel Bearing Inspection", base: 420, sev: "MED", exp: "Listen for a humming or grinding sound that changes with speed on the test drive. Failed bearings cause uneven tire wear and eventually wheel separation." },
    { label: "Strut Assembly Wear", base: 700, sev: "MED", exp: "Bounce each corner of the car hard — it should settle in one motion, not keep oscillating. Worn struts kill ride quality and ruin tires." },
  ],
  "Body & Electrical": [
    { label: "Headlight Restoration", base: 180, sev: "LOW", exp: "Hazy yellow headlights are a safety issue at night and a fast cosmetic win. Easy DIY with a kit or $80 at a detailer." },
    { label: "Door Seal & Weatherstrip", base: 220, sev: "LOW", exp: "Check for wind noise on the test drive and look for water staining inside door jambs. Cracked seals lead to interior leaks and rust later." },
    { label: "Battery Load Test", base: 200, sev: "LOW", exp: "Free at any AutoZone or O'Reilly. If the battery is more than 4 years old, plan to replace it — failed batteries leave you stranded." },
    { label: "Paint Correction (Hood/Roof)", base: 650, sev: "LOW", exp: "Sun-faded clear coat on the hood and roof is normal on older cars. Pure cosmetic, but factor into your offer if you care about resale." },
    { label: "Interior Trim & Switch Wear", base: 280, sev: "LOW", exp: "Test every window, lock, mirror, and HVAC button on the test drive. Worn switches and broken trim clips are nickel-and-dime fixes that add up." },
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
  const v = `${vehicle.year ?? ""} ${vehicle.make} ${vehicle.model}`.trim();

  // Rule 1: German makes
  if (GERMAN.test(makeStr)) {
    if (Math.random() < 0.5) {
      push(mk(
        "VANOS/VVT Solenoid Failure", 450, "Engine & Drivetrain", "MED",
        `The variable-valve timing solenoids on the ${v} are a known weak point — they gunk up with old oil and trigger rough cold starts plus a CEL. When you see the car, ask if the oil has been changed every 5k with full synthetic; if they're vague, assume the worst.`,
      ));
    } else {
      push(mk(
        "ABS Module Fault", 600, "Body & Electrical", "HIGH",
        `German ABS modules from this era fail by their late teens. Check the dash for any ABS, traction, or DSC warning lights when you turn the key. A failed module disables stability control and can cost $1k+ to retrofit.`,
      ));
    }
    push(mk(
      "Oil Filter Housing Gasket Leak", 350, "Engine & Drivetrain", "MED",
      `Almost universal on ${vehicle.make} engines past 80k. Look at the driver side of the engine block for crusty oil residue or oil dripping onto the alternator. Left alone it kills the alternator and belt.`,
    ));
  }

  // Rule 2: Truck / off-road
  if (TRUCK.test(makeStr)) {
    push(mk(
      "Transfer Case Fluid Leak", 250, "Engine & Drivetrain", "MED",
      `Look under the truck right behind the transmission — any wet seepage or fresh drips means the output shaft seal is going. Fluid is cheap, but ignoring it can grenade a $2,500 transfer case.`,
    ));
    push(mk(
      "Steering Box Play / Death Wobble Check", 500, "Chassis & Suspension", "HIGH",
      `On a test drive at 50–65 mph, hit a small bump and watch how the steering wheel reacts. Any sustained shimmy is the famous "death wobble" — usually a worn track bar, ball joints, or steering damper. Genuine safety issue.`,
    ));
  }

  // Rule 3-5: Age-based
  if (year < 2005) {
    push(mk(
      "Suspension Bushing Wear", 400, "Chassis & Suspension", "MED",
      `Rubber control-arm and sway bar bushings dry out and crack by 20 years old. Clunking over bumps and vague steering are the symptoms. A full set transforms how the car drives.`,
    ));
    push(mk(
      "Valve Cover Gasket Leak", 250, "Engine & Drivetrain", "LOW",
      `Look for a thin film of oil residue along the top edges of the engine and take a sniff near the firewall when warm — burning oil smell is the giveaway. Not urgent, but it almost always means other maintenance has been deferred too.`,
    ));
    push(mk(
      "Subframe Surface Rust", 600, "Body & Electrical", "HIGH",
      `Get under the car with a flashlight and tap the subframe, rocker panels, and rear shock mounts with a screwdriver. Flaky scale that crumbles is a structural concern — surface rust is fine, perforation is a walk-away on this car.`,
    ));
    push(mk(
      "Worn Engine Mounts", 350, "Engine & Drivetrain", "MED",
      `Put it in drive with your foot on the brake — excessive engine movement or a thud is a dead mount. Causes vibration through the steering wheel and accelerates other wear.`,
    ));
  } else if (year < 2015) {
    push(mk(
      "Timing Chain Tensioner Noise", 900, "Engine & Drivetrain", "HIGH",
      `Listen for a rattle on cold startup that fades after a few seconds. The ${v} platform is known for tensioner wear in this mileage band. Catching it early is a $900 job; ignoring it can mean a new engine.`,
    ));
    push(mk(
      "Coolant Expansion Tank Crack", 200, "Engine & Drivetrain", "MED",
      `Plastic expansion tanks get brittle and start weeping coolant around the seams. Open the hood with the engine cold and look for crusty white residue around the cap and lower seams.`,
    ));
    push(mk(
      "Control Arm Bushings", 450, "Chassis & Suspension", "MED",
      `By 100k these are usually shot. Symptoms are loose steering on-center and tire cupping. Replacing both sides plus alignment runs around this number at an independent shop.`,
    ));
    push(mk(
      "O2 Sensor Fault", 180, "Body & Electrical", "LOW",
      `Common cause of a vague CEL and 1–2 mpg drop. Ask if they'll let you scan codes with an OBD2 reader before money changes hands — $30 part swap if it's just one sensor.`,
    ));
  } else {
    push(mk(
      "Infotainment Software Glitch", 150, "Body & Electrical", "LOW",
      `On the test drive, cycle through every screen — backup camera, CarPlay/Android Auto, Bluetooth pairing. A dead screen or no-boot is usually a software reflash, but some need a $1k+ unit.`,
    ));
    push(mk(
      "Battery Health Degradation", 250, "Body & Electrical", "LOW",
      `Modern cars with start/stop and lots of electronics are harder on batteries. Ask for the install date — if it's the original 5+ years in, plan on a replacement soon.`,
    ));
    push(mk(
      "Brake Pad & Rotor Wear", 400, "Chassis & Suspension", "MED",
      `Peek through the wheel spokes at the rotor — a deep lip on the outer edge or shiny grooves means it's due. Budget for pads and rotors together, not just one or the other.`,
    ));
    push(mk(
      "Cabin Air Filter & HVAC Service", 180, "Engine & Drivetrain", "LOW",
      `Almost nobody changes the cabin filter on schedule. Run the AC on max and smell for mildew. A clogged filter strains the blower motor and is a 10-minute fix.`,
    ));
  }

  // Top up each category to at least 5 items
  const categories: Category[] = ["Engine & Drivetrain", "Chassis & Suspension", "Body & Electrical"];
  for (const cat of categories) {
    const count = () => issues.filter((i) => i.category === cat).length;
    const pool = GENERIC_POOL[cat];
    let pi = 0;
    while (count() < 5 && pi < pool.length) {
      const g = pool[pi++];
      push(mk(g.label, g.base, cat, g.sev, g.exp));
    }
  }

  return issues;
}

const RECALL_POOL = [
  { component: "Takata Airbag Inflator", status: "Open" as const },
  { component: "Fuel Pump Module — possible stall", status: "Remedied" as const },
  { component: "Brake Booster Vacuum Hose", status: "Remedied" as const },
  { component: "Electronic Power Steering Software", status: "Open" as const },
  { component: "Driver-side Seat Belt Anchor", status: "Remedied" as const },
  { component: "Backup Camera Display Failure", status: "Remedied" as const },
  { component: "Transmission Control Software", status: "Remedied" as const },
];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function generateRecalls(vehicle: Vehicle): Recall[] {
  const base = vehicle.year ?? 2010;
  // Deterministic-ish pick from pool based on year
  const start = Math.abs(base) % RECALL_POOL.length;
  const picks: Recall[] = [];
  for (let i = 0; i < 3; i++) {
    const item = RECALL_POOL[(start + i) % RECALL_POOL.length];
    const m = MONTHS[(base + i * 3) % 12];
    const y = base + 2 + i;
    picks.push({
      id: `recall-${i}`,
      date: `${m} ${y}`,
      component: item.component,
      status: item.status,
    });
  }
  return picks;
}
