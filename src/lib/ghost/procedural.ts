import type { Category, Issue, Recall, ReportRecommendation, RoadmapItem, Severity, Urgency, Vehicle } from "./types";

const MARKETPLACES = [
  { match: /facebook\s*marketplace|fb\.com|facebook\.com/i, name: "Facebook Marketplace" },
  { match: /craigslist|\.craigslist\.org/i, name: "Craigslist" },
  { match: /offerup/i, name: "OfferUp" },
  { match: /ebay\s*motors|ebay/i, name: "eBay Motors" },
  { match: /autotrader/i, name: "AutoTrader" },
  { match: /cars\.com/i, name: "Cars.com" },
  { match: /carvana/i, name: "Carvana" },
  { match: /carmax/i, name: "CarMax" },
];

export function detectMarketplace(text: string): string {
  if (!text) return "the listing";
  for (const mp of MARKETPLACES) if (mp.match.test(text)) return mp.name;
  return "the listing";
}

const COMMON_MAKES: Array<{ name: string; pattern: RegExp }> = [
  { name: "toyota", pattern: /\btoyota\b/i },
  { name: "honda", pattern: /\bhonda\b/i },
  { name: "nissan", pattern: /\bnissan\b/i },
  { name: "mazda", pattern: /\bmazda\b/i },
  { name: "subaru", pattern: /\bsubaru\b/i },
  { name: "mitsubishi", pattern: /\bmitsubishi\b/i },
  { name: "lexus", pattern: /\blexus\b/i },
  { name: "acura", pattern: /\bacura\b/i },
  { name: "infiniti", pattern: /\binfiniti\b/i },
  { name: "isuzu", pattern: /\bisuzu\b/i },
  { name: "suzuki", pattern: /\bsuzuki\b/i },
  { name: "scion", pattern: /\bscion\b/i },
  { name: "hyundai", pattern: /\bhyundai\b/i },
  { name: "kia", pattern: /\bkia\b/i },
  { name: "genesis", pattern: /\bgenesis\b/i },
  { name: "ford", pattern: /\bford\b/i },
  { name: "chevrolet", pattern: /\b(chevrolet|chevy)\b/i },
  { name: "dodge", pattern: /\bdodge\b/i },
  { name: "ram", pattern: /\b(ram\s+trucks?|ram\s+\d{4})\b/i },
  { name: "jeep", pattern: /\bjeep\b/i },
  { name: "gmc", pattern: /\bgmc\b/i },
  { name: "cadillac", pattern: /\bcadillac\b/i },
  { name: "lincoln", pattern: /\blincoln\b/i },
  { name: "buick", pattern: /\bbuick\b/i },
  { name: "chrysler", pattern: /\bchrysler\b/i },
  { name: "pontiac", pattern: /\bpontiac\b/i },
  { name: "tesla", pattern: /\btesla\b/i },
  { name: "bmw", pattern: /\bbmw\b/i },
  { name: "audi", pattern: /\baudi\b/i },
  { name: "mercedes-benz", pattern: /\b(mercedes[\-\s]?benz|mercedes|benz)\b/i },
  { name: "volkswagen", pattern: /\b(volkswagen|vw)\b/i },
  { name: "porsche", pattern: /\bporsche\b/i },
  { name: "land rover", pattern: /\bland\s*rover\b/i },
  { name: "jaguar", pattern: /\bjaguar\b/i },
  { name: "mini", pattern: /\bmini\b/i },
  { name: "volvo", pattern: /\bvolvo\b/i },
  { name: "fiat", pattern: /\bfiat\b/i },
  { name: "alfa romeo", pattern: /\balfa[\-\s]?romeo\b/i },
  { name: "polestar", pattern: /\bpolestar\b/i },
  { name: "rivian", pattern: /\brivian\b/i },
];

const MODEL_PATTERNS: Array<{ make: string; model: string; pattern: RegExp }> = [
  { make: "mazda", model: "Miata", pattern: /\bmiata\b/i },
  { make: "mazda", model: "MX-5", pattern: /\bmx-?5\b/i },
  { make: "mazda", model: "RX-7", pattern: /\brx-?7\b/i },
  { make: "mazda", model: "RX-8", pattern: /\brx-?8\b/i },
  { make: "mazda", model: "Mazdaspeed3", pattern: /\bmazdaspeed\s*3\b/i },
  { make: "nissan", model: "350Z", pattern: /\b350z\b/i },
  { make: "nissan", model: "370Z", pattern: /\b370z\b/i },
  { make: "nissan", model: "GT-R", pattern: /\bgt-?r\b/i },
  { make: "nissan", model: "Silvia", pattern: /\bsilvia\b/i },
  { make: "nissan", model: "Skyline", pattern: /\bskyline\b/i },
  { make: "toyota", model: "Supra", pattern: /\bsupra\b/i },
  { make: "toyota", model: "MR2", pattern: /\bmr-?2\b/i },
  { make: "toyota", model: "Celica", pattern: /\bcelica\b/i },
  { make: "toyota", model: "86", pattern: /\bgt-?86\b|\btoyota\s*86\b/i },
  { make: "honda", model: "S2000", pattern: /\bs2000\b/i },
  { make: "honda", model: "NSX", pattern: /\bnsx\b/i },
  { make: "honda", model: "Integra", pattern: /\bintegra\b/i },
  { make: "honda", model: "Prelude", pattern: /\bprelude\b/i },
  { make: "subaru", model: "WRX STI", pattern: /\bwrx\s*sti\b/i },
  { make: "subaru", model: "WRX", pattern: /\bwrx\b/i },
  { make: "subaru", model: "BRZ", pattern: /\bbrz\b/i },
  { make: "mitsubishi", model: "Lancer Evolution", pattern: /\bevo\b|\blancer\s*evo\b/i },
  { make: "mitsubishi", model: "Eclipse", pattern: /\beclipse\b/i },
  { make: "mitsubishi", model: "3000GT", pattern: /\b3000\s*gt\b/i },
  { make: "ford", model: "Mustang", pattern: /\bmustang\b/i },
  { make: "ford", model: "Focus ST", pattern: /\bfocus\s*st\b/i },
  { make: "ford", model: "Focus RS", pattern: /\bfocus\s*rs\b/i },
  { make: "ford", model: "Bronco", pattern: /\bbronco\b/i },
  { make: "chevrolet", model: "Camaro", pattern: /\bcamaro\b/i },
  { make: "chevrolet", model: "Corvette", pattern: /\bcorvette\b/i },
  { make: "dodge", model: "Challenger", pattern: /\bchallenger\b/i },
  { make: "dodge", model: "Charger", pattern: /\bcharger\b/i },
  { make: "dodge", model: "Viper", pattern: /\bviper\b/i },
  { make: "volkswagen", model: "Golf GTI", pattern: /\bgolf\s*gti\b/i },
  { make: "volkswagen", model: "Golf R", pattern: /\bgolf\s*r\b/i },
  { make: "hyundai", model: "Veloster N", pattern: /\bveloster\s*n\b/i },
  { make: "hyundai", model: "Genesis Coupe", pattern: /\bgenesis\s*coupe\b/i },
  { make: "kia", model: "Stinger", pattern: /\bstinger\b/i },
];

const TRIM_HINTS: Array<{ test: RegExp; trim: string }> = [
  { test: /\be30\b/i, trim: "E30" },
  { test: /\be36\b/i, trim: "E36" },
  { test: /\be46\b/i, trim: "E46" },
  { test: /\be90\b|\be92\b/i, trim: "E9x" },
  { test: /\b350z\b/i, trim: "Z33" },
  { test: /\b370z\b/i, trim: "Z34" },
  { test: /\bna\s*miata\b/i, trim: "NA" },
  { test: /\bnb\s*miata\b/i, trim: "NB" },
  { test: /\bnc\s*miata\b/i, trim: "NC" },
  { test: /\bnd\s*miata\b/i, trim: "ND" },
  { test: /\brx-?7.*fd\b|\bfd\s*rx/i, trim: "FD" },
  { test: /\brx-?7.*fc\b|\bfc\s*rx/i, trim: "FC" },
  { test: /\bwrx\s*sti\b/i, trim: "GR/VA STI" },
  { test: /\bbrz\b/i, trim: "ZC6" },
  { test: /\bevo\s*x\b|\bevo\s*10\b/i, trim: "Evo X" },
  { test: /\bevo\s*(ix|9)\b/i, trim: "Evo IX" },
  { test: /\bevo\s*(viii|8)\b/i, trim: "Evo VIII" },
  { test: /\bwrangler.*tj\b|\btj\b/i, trim: "TJ" },
  { test: /\bwrangler.*jk\b|\bjk\b/i, trim: "JK" },
  { test: /\bwrangler.*jl\b|\bjl\b/i, trim: "JL" },
  { test: /\bjza80\b|\bmk4\s*supra\b/i, trim: "JZA80" },
  { test: /\bap1\b|\bs2000.*0[0-9]\b/i, trim: "AP1" },
  { test: /\bap2\b|\bs2000.*0[4-9]\b/i, trim: "AP2" },
];

export function parseVehicle(input: {
  text?: string;
  make?: string;
  model?: string;
  year?: string;
  engineType?: string;
  mileage?: string;
  vin?: string;
}): Vehicle {
  const manualYear = input.year ? parseInt(input.year, 10) : NaN;
  const haystack = (input.text ?? "").toLowerCase();

  const yearMatch = haystack.match(/\b(19[7-9]\d|20[0-2]\d)\b/);
  const year = !Number.isNaN(manualYear)
    ? manualYear
    : yearMatch ? parseInt(yearMatch[1], 10) : null;

  let make = input.make?.trim() ?? "";
  let model = input.model?.trim() ?? "";

  if (!make || !model) {
    for (const mp of MODEL_PATTERNS) {
      if (mp.pattern.test(input.text ?? "")) {
        if (!make) make = mp.make;
        if (!model) model = mp.model;
        break;
      }
    }
  }

  if (!make) {
    for (const m of COMMON_MAKES) {
      if (m.pattern.test(input.text ?? "")) {
        make = m.name;
        break;
      }
    }
  }

  if (!model && make) {
    const escaped = make.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    const re = new RegExp(`${escaped}\\s+([a-z0-9][a-z0-9\\-\\s]{1,20})`, "i");
    const mm = (input.text ?? "").match(re);
    if (mm) model = mm[1].trim().split(/\s+/).slice(0, 2).join(" ");
  }

  // Mileage — prefer manual input over text parsing
  let mileage: number | null = null;
  if (input.mileage && !Number.isNaN(Number(input.mileage))) {
    mileage = Number(input.mileage);
  } else {
    const mi = haystack.match(/([\d,]{3,7})\s*(?:k\s*miles?|k\s*mi\b|miles?|mi\b)/);
    if (mi) {
      const raw = mi[1].replace(/,/g, "");
      let n = parseInt(raw, 10);
      if (/k\s*(miles?|mi)/.test(mi[0])) n = n * 1000;
      if (!Number.isNaN(n) && n > 100 && n < 500_000) mileage = n;
    }
  }

  let trim: string | undefined;
  const fullText = `${input.text ?? ""} ${model}`;
  for (const t of TRIM_HINTS) {
    if (t.test.test(fullText)) { trim = t.trim; break; }
  }

  return {
    year,
    make: make ? titleCase(make) : "Unknown Make",
    model: model ? titleCase(model) : "Vehicle",
    trim,
    mileage,
    engineType: input.engineType || undefined,
    vin: input.vin?.trim().toUpperCase() || undefined,
  };
}

function titleCase(s: string): string {
  return s.split(/\s+/).map((w) =>
    w.length <= 2 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()
  ).join(" ");
}

const GERMAN = /\b(bmw|audi|mercedes|mercedes-benz|vw|volkswagen|porsche)\b/i;
const TRUCK = /\b(wrangler|jeep|f-?150|f-?250|silverado|ram|tacoma|tundra|bronco|4runner|suburban)\b/i;
const JDM = /\b(350z|370z|silvia|skyline|gt-r|supra|rx-?7|rx-?8|mx-?5|miata|s2000|nsx|evo|wrx|sti|brz|celica|mr-?2|integra|eclipse)\b/i;
const ROTARY = /\b(rx-?7|rx-?8)\b/i;
const TURBO_FOUR = /\b(wrx|sti|evo|mazdaspeed|focus\s*st|focus\s*rs|golf\s*gti|golf\s*r|veloster\s*n|stinger)\b/i;
const MUSCLE = /\b(mustang|camaro|challenger|charger|corvette|viper)\b/i;
const HYBRID = /\b(prius|insight|ioniq|volt|fusion\s*hybrid|camry\s*hybrid)\b/i;

let idCounter = 0;

// Parts are typically 40-60% of total cost, labour the rest
function mkIssue(
  label: string,
  partsBase: number,
  labourHours: number,
  category: Category,
  severity: Severity,
  urgency: Urgency,
  explanation: string,
): Issue {
  const labourRate = 120;
  const labourCost = labourHours * labourRate;
  const totalBase = partsBase + labourCost;

  const partsMin = Math.round((partsBase * 0.85) / 10) * 10;
  const partsMax = Math.round((partsBase * 1.25) / 10) * 10;
  const costMin = Math.round((totalBase * 0.85) / 10) * 10;
  const costMax = Math.round((totalBase * 1.25) / 10) * 10;

  return {
    id: `issue-${++idCounter}`,
    label,
    category,
    severity,
    urgency,
    costMin,
    costMax,
    partsCostMin: partsMin,
    partsCostMax: partsMax,
    labourHours,
    explanation,
  };
}

const GENERIC_POOL: Record<Category, Array<{
  label: string; parts: number; hours: number;
  sev: Severity; urg: Urgency; exp: string;
}>> = {
  "Engine & Drivetrain": [
    { label: "Spark Plug & Coil Pack Service", parts: 120, hours: 1.5, sev: "LOW", urg: "Soon",
      exp: "Standard tune-up item. Worn plugs cause rough idle and reduced fuel economy. Ask the seller when it was last done — if they're not sure, budget for a fresh set." },
    { label: "Transmission Fluid Service", parts: 60, hours: 1, sev: "MED", urg: "Soon",
      exp: "Most sellers neglect this. Old fluid shortens transmission life dramatically. Pull the dipstick — fluid should be pink/red, not brown or burnt-smelling." },
    { label: "Serpentine Belt Replacement", parts: 40, hours: 1, sev: "LOW", urg: "Monitor",
      exp: "Look for cracks or glazing. A failed serpentine belt leaves you stranded instantly. Cheap preventive swap." },
    { label: "Cooling System Flush", parts: 40, hours: 1.5, sev: "MED", urg: "Soon",
      exp: "Coolant breaks down and causes rust in engine passages. Brown or rusty fluid in the reservoir means it's overdue." },
    { label: "Motor Mount Wear", parts: 120, hours: 2, sev: "MED", urg: "Soon",
      exp: "Rock the engine by hand — excessive movement or a thud when dropping into gear means a mount is gone. Causes vibration and accelerates CV axle wear." },
    { label: "PCV Valve & Crankcase Service", parts: 20, hours: 0.5, sev: "LOW", urg: "Monitor",
      exp: "A stuck PCV valve causes oil sludge buildup. Easy $20 part — ask about oil change frequency." },
  ],
  "Chassis & Suspension": [
    { label: "Alignment & Tire Balance", parts: 20, hours: 1, sev: "LOW", urg: "Soon",
      exp: "Almost always needed on a used car. Watch how the car tracks — pulling to one side or steering vibration means it's overdue." },
    { label: "Sway Bar End Links & Bushings", parts: 60, hours: 1, sev: "LOW", urg: "Monitor",
      exp: "Clunking over bumps is the telltale sign. Cheap part that affects handling and tire wear." },
    { label: "Brake Fluid Flush", parts: 20, hours: 1, sev: "LOW", urg: "Soon",
      exp: "Dark brown fluid means it's overdue. Degraded fluid reduces pedal feel and corrodes ABS components internally." },
    { label: "Wheel Bearing Check", parts: 150, hours: 2, sev: "MED", urg: "Soon",
      exp: "Listen for a hum that changes with speed on the test drive. Failed bearings cause uneven tire wear and eventual wheel separation." },
    { label: "Strut & Shock Absorber Wear", parts: 350, hours: 3, sev: "MED", urg: "Soon",
      exp: "Bounce each corner — it should settle in one motion. Worn struts ruin tire contact and make the car unsafe in panic stops." },
    { label: "Tie Rod & Ball Joint Inspection", parts: 120, hours: 2, sev: "HIGH", urg: "Immediate",
      exp: "Grab each front tire at 9 and 3 o'clock and rock it — any looseness is a worn tie rod. These are safety-critical steering components." },
  ],
  "Body & Electrical": [
    { label: "Headlight Lens Restoration", parts: 20, hours: 1, sev: "LOW", urg: "Monitor",
      exp: "Yellowed headlights cut nighttime visibility significantly. Easy DIY fix with a $20 kit." },
    { label: "Door Seal & Weatherstrip", parts: 80, hours: 1, sev: "LOW", urg: "Monitor",
      exp: "Check for wind noise and water staining inside door jambs. Cracked seals lead to interior moisture and rust." },
    { label: "Battery Load Test", parts: 150, hours: 0.5, sev: "LOW", urg: "Monitor",
      exp: "Free at any AutoZone. If the battery is more than 4 years old, budget for a replacement." },
    { label: "Paint Correction (Hood/Roof)", parts: 80, hours: 5, sev: "LOW", urg: "Monitor",
      exp: "Sun-oxidized clear coat on horizontal panels. Cosmetic but affects resale." },
    { label: "Interior Trim & Switch Wear", parts: 120, hours: 1.5, sev: "LOW", urg: "Monitor",
      exp: "Test every button on the test drive. Broken switches and missing trim clips add up fast." },
    { label: "EVAP System & Emissions", parts: 80, hours: 1, sev: "LOW", urg: "Monitor",
      exp: "Ask if the CEL has been on. EVAP codes will fail emissions — request an OBD scan before purchasing." },
  ],
};

export function generateIssues(vehicle: Vehicle): Issue[] {
  idCounter = 0;
  const issues: Issue[] = [];
  const seen = new Set<string>();
  const push = (i: Issue) => { if (!seen.has(i.label)) { seen.add(i.label); issues.push(i); } };

  const fullStr = `${vehicle.make} ${vehicle.model}`;
  const year = vehicle.year ?? 2010;
  const v = `${vehicle.year ?? ""} ${vehicle.make} ${vehicle.model}`.trim();

  // ── Rotary ────────────────────────────────────────────────────────────────
  if (ROTARY.test(fullStr)) {
    push(mkIssue("Apex Seal Compression Test", 200, 2, "Engine & Drivetrain", "HIGH", "Immediate",
      `The rotary in the ${v} lives or dies by its apex seals. Ask for a compression test printout — each rotor should read above 8.5 bar / 120 psi. Low compression means a rebuild is coming at $3,000–$6,000 at a rotary specialist.`));
    push(mkIssue("Coolant-in-Oil / Rotor Housing Leak", 400, 4, "Engine & Drivetrain", "HIGH", "Immediate",
      `Pull the oil dipstick and look for a milky, mayonnaise-like consistency. On the test drive, watch for white smoke from the exhaust on a cold start — it's the clearest warning sign of a failed rotor housing seal.`));
    push(mkIssue("Catalytic Converter Condition", 500, 1, "Body & Electrical", "MED", "Soon",
      `Rotary engines run rich and destroy catalytic converters. Check for a rattling sound under the car at idle. A clogged cat kills performance and fails emissions.`));
  }

  // ── Turbo four ────────────────────────────────────────────────────────────
  if (TURBO_FOUR.test(fullStr)) {
    push(mkIssue("Boost Leak Smoke Test", 80, 1.5, "Engine & Drivetrain", "HIGH", "Immediate",
      `Turbocharged engines develop boost leaks at intercooler couplings and charge pipes — especially on modified cars. A whooshing sound under acceleration and sluggish boost are the symptoms. A smoke test at a shop finds every leak quickly.`));
    push(mkIssue("Turbo Oil Feed Line Condition", 120, 1, "Engine & Drivetrain", "MED", "Soon",
      `Restricted flow from a clogged oil feed line starves the turbo of lubrication and causes premature bearing failure. Turbos need clean oil every 5,000 miles — ask about service history.`));
  }

  // ── EJ Subaru ─────────────────────────────────────────────────────────────
  if (/\b(wrx|sti|impreza)\b/i.test(fullStr) && /subaru/i.test(fullStr)) {
    push(mkIssue("EJ Engine Rod Knock / Spun Bearing", 3000, 20, "Engine & Drivetrain", "HIGH", "Immediate",
      `The EJ engine is notorious for spun rod bearings on hard-driven or poorly maintained cars. Listen for a knocking sound at idle that gets louder under load. This is a walk-away condition unless the price reflects a full engine replacement.`));
    push(mkIssue("EJ Head Gasket Failure", 800, 10, "Engine & Drivetrain", "HIGH", "Immediate",
      `EJ engines have a well-documented head gasket weakness. Check for white exhaust smoke on cold start, a sweet smell from the coolant reservoir, or bubbles in the overflow tank with the engine running.`));
  }

  // ── JDM general ───────────────────────────────────────────────────────────
  if (JDM.test(fullStr) && !ROTARY.test(fullStr)) {
    push(mkIssue("Aftermarket Modification Assessment", 200, 2, "Body & Electrical", "MED", "Soon",
      `JDM platforms attract modifications — some done well, most done questionably. Check under the hood for cut wires, zip-tied vacuum lines, and non-stock ECU tunes. Ask for a full mod list in writing.`));
    push(mkIssue("Differential Fluid Service", 60, 1.5, "Engine & Drivetrain", "MED", "Soon",
      `The rear or limited-slip differential needs fresh fluid every 30k miles — most sellers skip it. Old fluid causes clutch-pack wear in LSD units. Ask when it was last done and listen for gear whine on the test drive.`));
  }

  // ── Mazda ─────────────────────────────────────────────────────────────────
  if (/mazda/i.test(fullStr)) {
    if (/miata|mx-?5/i.test(fullStr)) {
      push(mkIssue("Soft Top Frame & Latch Condition", 400, 2, "Body & Electrical", "MED", "Soon",
        `Raise and lower the top in front of the seller. Look for tears at the corners, a cloudy rear window, and whether the latches engage cleanly. A replacement top runs $300–$800 for fabric. Water leaks ruin the interior fast.`));
      push(mkIssue("Rear Subframe Rust (NA/NB)", 600, 4, "Chassis & Suspension", "HIGH", "Immediate",
        `Early Miatas are notorious for rear subframe rust, especially in northern states. Get under the car and tap the rear subframe mounting points. Flaking or hollow sounds mean structural rust — this is a walk-away issue unless professionally addressed.`));
    }
  }

  // ── German ────────────────────────────────────────────────────────────────
  if (GERMAN.test(fullStr)) {
    push(mkIssue("Oil Filter Housing Gasket Leak", 30, 2.5, "Engine & Drivetrain", "MED", "Soon",
      `Nearly universal on ${vehicle.make} engines past 80k miles. Look at the driver side of the engine block for crusty brown oil residue or fresh drips onto the alternator. Left alone it destroys the alternator and belt.`));
    if (/bmw/i.test(fullStr)) {
      push(mkIssue("VANOS / Valvetronic Solenoid Fault", 150, 2.5, "Engine & Drivetrain", "MED", "Soon",
        `BMW variable valve timing solenoids clog with sludge from dirty oil. Rough cold starts, a CEL, and a rattle on startup are the warning signs. Ask for service history with oil change dates.`));
      push(mkIssue("Cooling System Plastic Component Failure", 200, 3, "Engine & Drivetrain", "HIGH", "Immediate",
        `BMW plastic cooling components — expansion tank, thermostat housing, water pump housing — become brittle with age. Ask if the cooling system has been refreshed. A roadside coolant failure can take the engine with it.`));
    }
    if (/audi|volkswagen|vw/i.test(fullStr)) {
      push(mkIssue("DSG Mechatronic Unit Wear", 800, 3, "Engine & Drivetrain", "HIGH", "Soon",
        `The dual-clutch transmission has a known mechatronic unit weakness. Symptoms are jerky low-speed engagement, hesitation from a stop, and rough 1-2 shifts. Replacement runs $1,000–$2,500 at a VAG specialist.`));
    }
  }

  // ── Truck / SUV ───────────────────────────────────────────────────────────
  if (TRUCK.test(fullStr)) {
    push(mkIssue("Transfer Case Fluid Leak", 80, 1.5, "Engine & Drivetrain", "MED", "Soon",
      `Look under the truck right behind the transmission for wet seepage from the transfer case output seals. Ignoring it leads to a $2,000–$3,500 transfer case replacement.`));
    push(mkIssue("Death Wobble / Steering Gear Check", 200, 3, "Chassis & Suspension", "HIGH", "Immediate",
      `At 55–65 mph hit a small bump and watch the steering wheel. Any sustained shimmy is death wobble — caused by worn track bar, ball joints, or steering stabilizer. Genuine safety issue that must be fixed before highway driving.`));
    push(mkIssue("Frame Rail & Underbody Rust", 400, 4, "Body & Electrical", "HIGH", "Immediate",
      `Get under with a flashlight and screwdriver. Tap frame rails, crossmembers, and bed mounting points. Surface scale is fine — hollow sounds or a screwdriver that punches through means the frame is compromised.`));
  }

  // ── Muscle ────────────────────────────────────────────────────────────────
  if (MUSCLE.test(fullStr)) {
    push(mkIssue("Clutch & Flywheel Assessment", 500, 4, "Engine & Drivetrain", "HIGH", "Soon",
      `Muscle cars get driven hard. On the test drive, slip the clutch slightly from a stop — it should engage firmly. A burning smell or clutch that grabs at the top of travel means it needs replacement soon.`));
    push(mkIssue("Rear Axle Seal Leak", 60, 2, "Engine & Drivetrain", "MED", "Soon",
      `Look at the inner face of the rear wheels for an oily film. Differential fluid on the brakes is a safety issue and will fail state inspection. Easy fix but the brakes may need service too.`));
  }

  // ── Hybrid ────────────────────────────────────────────────────────────────
  if (HYBRID.test(fullStr)) {
    push(mkIssue("HV Battery State of Health", 2000, 2, "Body & Electrical", "HIGH", "Immediate",
      `Ask the seller to show you the hybrid battery health readout on a scan tool. A degraded pack shows dramatically reduced EV range. Replacement packs run $1,500–$4,000 depending on the model.`));
    push(mkIssue("Inverter Coolant Loop Service", 40, 1.5, "Engine & Drivetrain", "MED", "Soon",
      `Hybrid vehicles have a separate coolant loop for the inverter. Most owners never service it. Degraded inverter coolant causes $2,000+ inverter failures.`));
  }

  // ── Age-based ─────────────────────────────────────────────────────────────
  if (year < 2000) {
    push(mkIssue("Full Suspension Bushing Replacement", 300, 6, "Chassis & Suspension", "MED", "Soon",
      `25+ year old rubber bushings are cracked and overdue on every car regardless of mileage. A full polyurethane bushing kit transforms the driving experience and eliminates clunking.`));
    push(mkIssue("Valve Cover Gasket Leak", 40, 1.5, "Engine & Drivetrain", "LOW", "Monitor",
      `Look for oily residue along the valve cover edges and sniff near the firewall when warm. Not urgent, but almost always signals other deferred maintenance.`));
    push(mkIssue("Structural Rust Assessment", 400, 5, "Body & Electrical", "HIGH", "Immediate",
      `Get under the car with a flashlight and screwdriver. Poke at the subframe, rocker panels, and floor pans. Flaking rust that crumbles or hollow spots mean structural compromise — most important inspection point on any car this age.`));
    push(mkIssue("Ignition System Service", 80, 1.5, "Engine & Drivetrain", "MED", "Soon",
      `Distributor cap, rotor, and ignition wires become unreliable by this age. A car that misfires under load usually starts here. Check the cap for carbon tracking lines with a flashlight.`));
  } else if (year < 2008) {
    push(mkIssue("Timing Chain / Belt Service", 300, 5, "Engine & Drivetrain", "HIGH", "Immediate",
      `Ask for the last belt service date and mileage. A skipped timing belt service is a ticking time bomb that can destroy the engine without warning. For chain engines, listen for a cold-start rattle.`));
    push(mkIssue("Coolant Expansion Tank Crack", 40, 1, "Engine & Drivetrain", "MED", "Soon",
      `Plastic expansion tanks from this era get brittle and crack at the seams. Look for crusty white deposits around the cap — dried coolant from a slow leak. A blown tank strands you fast.`));
    push(mkIssue("Control Arm Bushing Wear", 200, 3, "Chassis & Suspension", "MED", "Soon",
      `By 100k miles these are usually shot. Worn bushings feel like loose, imprecise steering and cause tire cupping on the inner edge.`));
    push(mkIssue("O2 Sensor / Emissions Fault", 80, 1, "Body & Electrical", "LOW", "Monitor",
      `Common cheap check engine light cause. Ask if any codes are stored — many states require a clear emissions system to register. Usually a $30 part swap.`));
  } else if (year < 2016) {
    push(mkIssue("Timing Chain Tensioner Wear", 300, 5, "Engine & Drivetrain", "HIGH", "Immediate",
      `Listen for a faint rattle on cold start that disappears after 10–15 seconds. The ${v} is in the mileage band where tensioner wear becomes common. Catching it at rattle stage is a $850 fix — missing it means a new engine.`));
    push(mkIssue("GDI Carbon Buildup on Intake Valves", 200, 4, "Engine & Drivetrain", "MED", "Soon",
      `Direct-injection engines build carbon deposits on intake valves over time. Symptoms are rough idle, hesitation, and reduced power. A walnut-blast cleaning runs $400–$700 and restores full performance.`));
    push(mkIssue("Thermostat & Water Pump Service", 150, 3, "Engine & Drivetrain", "MED", "Soon",
      `Plastic thermostat housings and impeller water pumps have a finite lifespan. If the temperature gauge is slow to climb, the thermostat is failing. Do both together since they share labor.`));
    push(mkIssue("O2 / Lambda Sensor Fault", 80, 1, "Body & Electrical", "LOW", "Monitor",
      `Common cause of a vague CEL and 1–2 mpg drop. Ask if they'll let you scan codes with an OBD2 reader before money changes hands.`));
  } else {
    push(mkIssue("Infotainment & ADAS System Check", 100, 0.5, "Body & Electrical", "LOW", "Monitor",
      `Cycle through every screen on the test drive — backup camera, CarPlay, Android Auto, Bluetooth. Check that all ADAS warning lights are off on startup.`));
    push(mkIssue("12V Battery Health", 150, 0.5, "Body & Electrical", "LOW", "Monitor",
      `Modern start/stop systems are hard on batteries. Ask for the install date — if it's original at 5+ years, budget for a replacement soon.`));
    push(mkIssue("Brake Pad & Rotor Condition", 200, 2.5, "Chassis & Suspension", "MED", "Soon",
      `Peek through the wheel spokes at the rotor face — a deep outer lip means it's worn past limit. Budget for pads and rotors together.`));
    push(mkIssue("ADAS Sensor Calibration", 150, 1, "Body & Electrical", "MED", "Soon",
      `Cameras and radar sensors for lane keep and emergency braking need OEM calibration. Even a minor fender-bender can knock them out of alignment.`));
  }

  // ── Top up to 5 per category ──────────────────────────────────────────────
  const categories: Category[] = ["Engine & Drivetrain", "Chassis & Suspension", "Body & Electrical"];
  for (const cat of categories) {
    const count = () => issues.filter((i) => i.category === cat).length;
    const pool = GENERIC_POOL[cat];
    let pi = 0;
    while (count() < 5 && pi < pool.length) {
      const g = pool[pi++];
      push(mkIssue(g.label, g.parts, g.hours, cat, g.sev, g.urg, g.exp));
    }
  }

  return issues;
}

// ─── Recommendation & Roadmap ─────────────────────────────────────────────────

// ─── Recommendation & Roadmap ─────────────────────────────────────────────────

export function generateRecommendation(
  vehicle: Vehicle,
  issues: Issue[] = [],
  askingPrice: number,
): ReportRecommendation {
  try {
    const validIssues = Array.isArray(issues) ? issues : [];
    const safeAskingPrice = askingPrice && askingPrice > 0 ? askingPrice : 1;

    const highCount = validIssues.filter((i) => i.severity === "HIGH").length;
    const immediate = validIssues.filter((i) => i.urgency === "Immediate");
    const soon = validIssues.filter((i) => i.urgency === "Soon");
    const monitor = validIssues.filter((i) => i.urgency === "Monitor");

    const totalPartsMin = validIssues.reduce((s, i) => s + (i.partsCostMin || 0), 0);
    const totalMin = validIssues.reduce((s, i) => s + (i.costMin || 0), 0);
    const totalMax = validIssues.reduce((s, i) => s + (i.costMax || 0), 0);
    const repairRatio = totalMin / safeAskingPrice;

    const v = `${vehicle?.year ?? ""} ${vehicle?.make ?? ""} ${vehicle?.model ?? ""}`.trim() || "Vehicle";

    let verdict: "buy" | "negotiate" | "walkaway";
    let headline: string;
    let summary: string;

    if (highCount >= 3 || repairRatio > 0.6) {
      verdict = "walkaway";
      headline = "Walk Away — Unless the Price Drops Significantly";
      summary = `The ${v} has ${highCount} high-severity issues and an estimated repair bill of $${totalMin.toLocaleString()}+ — that's ${Math.round(repairRatio * 100)}% of the asking price. At this ratio, you're buying someone else's problem. If the seller won't move to reflect these costs, there are better cars out there for this budget.`;
    } else if (highCount >= 1 || repairRatio > 0.25) {
      verdict = "negotiate";
      headline = "Negotiate Hard — Real Issues Found";
      summary = `The ${v} has ${highCount > 0 ? `${highCount} high-priority item${highCount > 1 ? "s" : ""}` : "several medium-priority items"} that need attention. The estimated repair cost of $${totalMin.toLocaleString()}–$${totalPartsMin === 0 ? "–" : totalMax.toLocaleString()} gives you real leverage in negotiation. Use the script below to open at a lower number — this car has work ahead of it.`;
    } else {
      verdict = "buy";
      headline = "Solid Buy — Mostly Routine Maintenance";
      summary = `The ${v} looks like a reasonable purchase at this price point. The flagged items are mostly routine wear — expected on any used car at this age and mileage. Have a trusted mechanic do a pre-purchase inspection to confirm, then make your offer with confidence.`;
    }

    const roadmap = [
      ...(immediate.length > 0 ? [{ urgency: "Immediate" as const, label: "Immediate Attention", reason: "Critical safety or mechanical issues.", issueIds: immediate.map((i) => i.id) }] : []),
      ...(soon.length > 0 ? [{ urgency: "Soon" as const, label: "Fix Soon", reason: "Routine wear items that need replacement shortly.", issueIds: soon.map((i) => i.id) }] : []),
      ...(monitor.length > 0 ? [{ urgency: "Monitor" as const, label: "Monitor / Watch", reason: "Minor items to watch over time.", issueIds: monitor.map((i) => i.id) }] : []),
    ];

    return {
      verdict,
      headline,
      summary,
      roadmap,
    };

  } catch (error) {
    return {
      verdict: "negotiate",
      headline: "Negotiate — Review Details Below",
      summary: "Vehicle evaluation completed. Please inspect the individual checklist items to verify details.",
      roadmap: [],
    };
  }
}

  const roadmap: RoadmapItem[] = [];

  if (immediate.length > 0) {
    roadmap.push({
      urgency: "Immediate",
      label: "Fix Before Driving",
      reason: "These items are safety-critical or will cause further damage if ignored. Address them before the car goes on the road.",
      issueIds: immediate.map((i) => i.id),
    });
  }
  if (soon.length > 0) {
    roadmap.push({
      urgency: "Soon",
      label: "Address Within 3 Months",
      reason: "These are legitimate wear items that won't strand you today but will become more expensive if ignored. Budget for them in your first ownership quarter.",
      issueIds: soon.map((i) => i.id),
    });
  }
  if (monitor.length > 0) {
    roadmap.push({
      urgency: "Monitor",
      label: "Keep an Eye On",
      reason: "Low-priority items — cosmetic or minor maintenance. Check them at your first scheduled service and address as budget allows.",
      issueIds: monitor.map((i) => i.id),
    });
  }

  return { verdict, headline, summary, roadmap };
}

// ─── Recalls ──────────────────────────────────────────────────────────────────

const RECALL_POOL = [
  { component: "Takata Airbag Inflator", status: "Open" as const },
  { component: "Fuel Pump Module — possible stall", status: "Remedied" as const },
  { component: "Brake Booster Vacuum Hose", status: "Remedied" as const },
  { component: "Electronic Power Steering Software", status: "Open" as const },
  { component: "Driver-side Seat Belt Pretensioner", status: "Remedied" as const },
  { component: "Backup Camera Display Failure", status: "Remedied" as const },
  { component: "Transmission Control Module Software", status: "Remedied" as const },
  { component: "Engine Oil Cooler Line Leak", status: "Open" as const },
  { component: "ABS Module Corrosion", status: "Remedied" as const },
  { component: "Fuel Injector O-Ring Seal", status: "Remedied" as const },
];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function generateRecalls(vehicle: Vehicle): Recall[] {
  const base = vehicle.year ?? 2010;
  const start = Math.abs(base) % RECALL_POOL.length;
  const picks: Recall[] = [];
  for (let i = 0; i < 3; i++) {
    const item = RECALL_POOL[(start + i) % RECALL_POOL.length];
    const m = MONTHS[(base + i * 3) % 12];
    const y = base + 2 + i;
    picks.push({ id: `recall-${i}`, date: `${m} ${y}`, component: item.component, status: item.status });
  }
  return picks;
}