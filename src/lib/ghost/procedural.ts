import type { Category, Issue, Recall, Severity, Vehicle } from "./types";

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

// Ordered by length descending so longer matches win (e.g. "land rover" before "land")
const COMMON_MAKES: Array<{ name: string; pattern: RegExp }> = [
  // Japanese
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
  { name: "daihatsu", pattern: /\bdaihatsu\b/i },
  { name: "scion", pattern: /\bscion\b/i },
  // Korean
  { name: "hyundai", pattern: /\bhyundai\b/i },
  { name: "kia", pattern: /\bkia\b/i },
  { name: "genesis", pattern: /\bgenesis\b/i },
  // American
  { name: "ford", pattern: /\bford\b/i },
  { name: "chevrolet", pattern: /\b(chevrolet|chevy)\b/i },
  { name: "dodge", pattern: /\bdodge\b/i },
  { name: "ram", pattern: /\b(ram\s+trucks?|ram\s+\d{4}|\b1500|\b2500|\b3500)\b/i },
  { name: "jeep", pattern: /\bjeep\b/i },
  { name: "gmc", pattern: /\bgmc\b/i },
  { name: "cadillac", pattern: /\bcadillac\b/i },
  { name: "lincoln", pattern: /\blincoln\b/i },
  { name: "buick", pattern: /\bbuick\b/i },
  { name: "chrysler", pattern: /\bchrysler\b/i },
  { name: "pontiac", pattern: /\bpontiac\b/i },
  { name: "saturn", pattern: /\bsaturn\b/i },
  { name: "oldsmobile", pattern: /\boldsmobile\b/i },
  { name: "mercury", pattern: /\bmercury\b/i },
  { name: "tesla", pattern: /\btesla\b/i },
  { name: "rivian", pattern: /\brivian\b/i },
  { name: "lucid", pattern: /\blucid\b/i },
  // German
  { name: "bmw", pattern: /\bbmw\b/i },
  { name: "audi", pattern: /\baudi\b/i },
  { name: "mercedes-benz", pattern: /\b(mercedes[\-\s]?benz|mercedes|benz|mb)\b/i },
  { name: "volkswagen", pattern: /\b(volkswagen|vw)\b/i },
  { name: "porsche", pattern: /\bporsche\b/i },
  { name: "opel", pattern: /\bopel\b/i },
  // British
  { name: "land rover", pattern: /\bland\s*rover\b/i },
  { name: "jaguar", pattern: /\bjaguar\b/i },
  { name: "mini", pattern: /\bmini\b/i },
  { name: "bentley", pattern: /\bbentley\b/i },
  { name: "rolls-royce", pattern: /\brolls[\-\s]?royce\b/i },
  { name: "lotus", pattern: /\blotus\b/i },
  { name: "mclaren", pattern: /\bmclaren\b/i },
  // European other
  { name: "volvo", pattern: /\bvolvo\b/i },
  { name: "saab", pattern: /\bsaab\b/i },
  { name: "fiat", pattern: /\bfiat\b/i },
  { name: "alfa romeo", pattern: /\balfa[\-\s]?romeo\b/i },
  { name: "ferrari", pattern: /\bferrari\b/i },
  { name: "lamborghini", pattern: /\blamborghini\b/i },
  { name: "maserati", pattern: /\bmaserati\b/i },
  { name: "peugeot", pattern: /\bpeugeot\b/i },
  { name: "renault", pattern: /\brenault\b/i },
  { name: "citroen", pattern: /\bcitroen\b/i },
  { name: "seat", pattern: /\bseat\b/i },
  { name: "skoda", pattern: /\bskoda\b/i },
  // Australian
  { name: "holden", pattern: /\bholden\b/i },
  // Chinese / EV
  { name: "byd", pattern: /\bbyd\b/i },
  { name: "polestar", pattern: /\bpolestar\b/i },
  { name: "genesis", pattern: /\bgenesis\b/i },
];

// Model patterns for common makes — catches models that appear WITHOUT make name
const MODEL_PATTERNS: Array<{ make: string; model: string; pattern: RegExp }> = [
  // Mazda
  { make: "mazda", model: "Miata", pattern: /\bmiata\b/i },
  { make: "mazda", model: "MX-5", pattern: /\bmx-?5\b/i },
  { make: "mazda", model: "RX-7", pattern: /\brx-?7\b/i },
  { make: "mazda", model: "RX-8", pattern: /\brx-?8\b/i },
  { make: "mazda", model: "Mazdaspeed3", pattern: /\bmazdaspeed\s*3\b/i },
  { make: "mazda", model: "Mazdaspeed6", pattern: /\bmazdaspeed\s*6\b/i },
  { make: "mazda", model: "CX-5", pattern: /\bcx-?5\b/i },
  { make: "mazda", model: "CX-9", pattern: /\bcx-?9\b/i },
  { make: "mazda", model: "Mazda3", pattern: /\bmazda\s*3\b/i },
  { make: "mazda", model: "Mazda6", pattern: /\bmazda\s*6\b/i },
  // Nissan / Infiniti JDM
  { make: "nissan", model: "350Z", pattern: /\b350z\b/i },
  { make: "nissan", model: "370Z", pattern: /\b370z\b/i },
  { make: "nissan", model: "Silvia", pattern: /\bsilvia\b/i },
  { make: "nissan", model: "Skyline", pattern: /\bskyline\b/i },
  { make: "nissan", model: "GT-R", pattern: /\bgt-?r\b/i },
  { make: "nissan", model: "Sentra", pattern: /\bsentra\b/i },
  { make: "nissan", model: "Altima", pattern: /\baltima\b/i },
  { make: "nissan", model: "Maxima", pattern: /\bmaxima\b/i },
  { make: "nissan", model: "Frontier", pattern: /\bfrontier\b/i },
  { make: "nissan", model: "Pathfinder", pattern: /\bpathfinder\b/i },
  { make: "nissan", model: "Xterra", pattern: /\bxterra\b/i },
  // Toyota
  { make: "toyota", model: "Supra", pattern: /\bsupra\b/i },
  { make: "toyota", model: "MR2", pattern: /\bmr-?2\b/i },
  { make: "toyota", model: "Celica", pattern: /\bcelica\b/i },
  { make: "toyota", model: "Corolla", pattern: /\bcorolla\b/i },
  { make: "toyota", model: "Camry", pattern: /\bcamry\b/i },
  { make: "toyota", model: "Tacoma", pattern: /\btacoma\b/i },
  { make: "toyota", model: "Tundra", pattern: /\btundra\b/i },
  { make: "toyota", model: "4Runner", pattern: /\b4runner\b/i },
  { make: "toyota", model: "Land Cruiser", pattern: /\bland\s*cruiser\b/i },
  { make: "toyota", model: "Prius", pattern: /\bprius\b/i },
  { make: "toyota", model: "86", pattern: /\bgt-?86\b|\btoyota\s*86\b/i },
  // Honda
  { make: "honda", model: "S2000", pattern: /\bs2000\b/i },
  { make: "honda", model: "NSX", pattern: /\bnsx\b/i },
  { make: "honda", model: "Civic", pattern: /\bcivic\b/i },
  { make: "honda", model: "Accord", pattern: /\baccord\b/i },
  { make: "honda", model: "CR-V", pattern: /\bcr-?v\b/i },
  { make: "honda", model: "Pilot", pattern: /\bpilot\b/i },
  { make: "honda", model: "Fit", pattern: /\bhonda\s*fit\b/i },
  { make: "honda", model: "Integra", pattern: /\bintegra\b/i },
  { make: "honda", model: "Prelude", pattern: /\bprelude\b/i },
  { make: "honda", model: "Odyssey", pattern: /\bodyssey\b/i },
  // Subaru
  { make: "subaru", model: "WRX STI", pattern: /\bwrx\s*sti\b/i },
  { make: "subaru", model: "WRX", pattern: /\bwrx\b/i },
  { make: "subaru", model: "BRZ", pattern: /\bbrz\b/i },
  { make: "subaru", model: "Impreza", pattern: /\bimpreza\b/i },
  { make: "subaru", model: "Legacy", pattern: /\blegacy\b/i },
  { make: "subaru", model: "Outback", pattern: /\boutback\b/i },
  { make: "subaru", model: "Forester", pattern: /\bforester\b/i },
  // Mitsubishi
  { make: "mitsubishi", model: "Lancer Evolution", pattern: /\bevo\s*(x|ix|viii|vii|vi|v|iv|iii|ii|i)?\b|\blancer\s*evo\b/i },
  { make: "mitsubishi", model: "Eclipse", pattern: /\beclipse\b/i },
  { make: "mitsubishi", model: "3000GT", pattern: /\b3000\s*gt\b/i },
  { make: "mitsubishi", model: "Galant", pattern: /\bgalant\b/i },
  // BMW
  { make: "bmw", model: "M3", pattern: /\bbmw\s*m3\b|\bm3\b/i },
  { make: "bmw", model: "M4", pattern: /\bbmw\s*m4\b|\bm4\b/i },
  { make: "bmw", model: "M5", pattern: /\bbmw\s*m5\b|\bm5\b/i },
  { make: "bmw", model: "330i", pattern: /\b330i\b/i },
  { make: "bmw", model: "325i", pattern: /\b325i\b/i },
  { make: "bmw", model: "335i", pattern: /\b335i\b/i },
  { make: "bmw", model: "328i", pattern: /\b328i\b/i },
  { make: "bmw", model: "E46", pattern: /\be46\b/i },
  { make: "bmw", model: "E90", pattern: /\be90\b/i },
  { make: "bmw", model: "E36", pattern: /\be36\b/i },
  { make: "bmw", model: "Z3", pattern: /\bbmw\s*z3\b/i },
  { make: "bmw", model: "Z4", pattern: /\bbmw\s*z4\b/i },
  // Ford
  { make: "ford", model: "Mustang", pattern: /\bmustang\b/i },
  { make: "ford", model: "F-150", pattern: /\bf-?150\b/i },
  { make: "ford", model: "F-250", pattern: /\bf-?250\b/i },
  { make: "ford", model: "Explorer", pattern: /\bexplorer\b/i },
  { make: "ford", model: "Focus ST", pattern: /\bfocus\s*st\b/i },
  { make: "ford", model: "Focus RS", pattern: /\bfocus\s*rs\b/i },
  { make: "ford", model: "Focus", pattern: /\bfocus\b/i },
  { make: "ford", model: "Bronco", pattern: /\bbronco\b/i },
  { make: "ford", model: "Ranger", pattern: /\branger\b/i },
  { make: "ford", model: "Fusion", pattern: /\bfusion\b/i },
  { make: "ford", model: "Edge", pattern: /\bford\s*edge\b/i },
  { make: "ford", model: "Escape", pattern: /\bescape\b/i },
  // Chevrolet
  { make: "chevrolet", model: "Camaro", pattern: /\bcamaro\b/i },
  { make: "chevrolet", model: "Corvette", pattern: /\bcorvette\b/i },
  { make: "chevrolet", model: "Silverado", pattern: /\bsilverado\b/i },
  { make: "chevrolet", model: "Malibu", pattern: /\bmalibu\b/i },
  { make: "chevrolet", model: "Impala", pattern: /\bimpala\b/i },
  { make: "chevrolet", model: "Cruze", pattern: /\bcruze\b/i },
  { make: "chevrolet", model: "Equinox", pattern: /\bequinox\b/i },
  // Dodge
  { make: "dodge", model: "Challenger", pattern: /\bchallenger\b/i },
  { make: "dodge", model: "Charger", pattern: /\bcharger\b/i },
  { make: "dodge", model: "Viper", pattern: /\bviper\b/i },
  { make: "dodge", model: "Durango", pattern: /\bdurango\b/i },
  // Jeep
  { make: "jeep", model: "Wrangler", pattern: /\bwrangler\b/i },
  { make: "jeep", model: "Cherokee", pattern: /\bcherokee\b/i },
  { make: "jeep", model: "Grand Cherokee", pattern: /\bgrand\s*cherokee\b/i },
  // Volkswagen
  { make: "volkswagen", model: "Golf GTI", pattern: /\bgolf\s*gti\b/i },
  { make: "volkswagen", model: "Golf R", pattern: /\bgolf\s*r\b/i },
  { make: "volkswagen", model: "Golf", pattern: /\bgolf\b/i },
  { make: "volkswagen", model: "Jetta", pattern: /\bjetta\b/i },
  { make: "volkswagen", model: "Passat", pattern: /\bpassat\b/i },
  { make: "volkswagen", model: "Tiguan", pattern: /\btiguan\b/i },
  // Porsche
  { make: "porsche", model: "911", pattern: /\bporsche\s*911\b|\b911\s*(carrera|turbo|gt3|gt2)?\b/i },
  { make: "porsche", model: "Boxster", pattern: /\bboxster\b/i },
  { make: "porsche", model: "Cayman", pattern: /\bcayman\b/i },
  { make: "porsche", model: "Cayenne", pattern: /\bcayenne\b/i },
  // Hyundai / Kia
  { make: "hyundai", model: "Genesis Coupe", pattern: /\bgenesis\s*coupe\b/i },
  { make: "hyundai", model: "Elantra", pattern: /\belantra\b/i },
  { make: "hyundai", model: "Sonata", pattern: /\bsonata\b/i },
  { make: "hyundai", model: "Tucson", pattern: /\btucson\b/i },
  { make: "hyundai", model: "Veloster N", pattern: /\bveloster\s*n\b/i },
  { make: "hyundai", model: "Veloster", pattern: /\bveloster\b/i },
  { make: "kia", model: "Stinger", pattern: /\bstinger\b/i },
  { make: "kia", model: "Soul", pattern: /\bkia\s*soul\b/i },
  { make: "kia", model: "Optima", pattern: /\boptima\b/i },
  { make: "kia", model: "Sportage", pattern: /\bsportage\b/i },
];

const TRIM_HINTS: Array<{ test: RegExp; trim: string }> = [
  // BMW
  { test: /\be30\b/i, trim: "E30" },
  { test: /\be36\b/i, trim: "E36" },
  { test: /\be46\b/i, trim: "E46" },
  { test: /\be90\b|\be92\b|\be93\b/i, trim: "E9x" },
  { test: /\bf30\b|\bf32\b/i, trim: "F3x" },
  // Nissan Z
  { test: /\b350z\b|fairlady\s*z/i, trim: "Z33" },
  { test: /\b370z\b/i, trim: "Z34" },
  { test: /\b400z\b|\bz\s*car\s*2023\b/i, trim: "Z34+" },
  // Mazda
  { test: /\bna\s*miata\b|\bmiata.*\b(90|91|92|93|94|95|96|97)\b/i, trim: "NA" },
  { test: /\bnb\s*miata\b|\bmiata.*\b(99|00|01|02|03|04|05)\b/i, trim: "NB" },
  { test: /\bnc\s*miata\b|\bmiata.*\b(06|07|08|09|10|11|12|13|14|15)\b/i, trim: "NC" },
  { test: /\bnd\s*miata\b|\bmiata.*\b(16|17|18|19|20|21|22|23|24)\b/i, trim: "ND" },
  { test: /\brx-?7.*fd\b|\bfd\s*rx-?7\b/i, trim: "FD" },
  { test: /\brx-?7.*fc\b|\bfc\s*rx-?7\b/i, trim: "FC" },
  // Subaru
  { test: /\bversion\s*(vi|vii|viii|ix|x)\b|\bv\d\b.*wrx/i, trim: "GC/GD" },
  { test: /\bva\s*wrx\b|\bwrx.*\b(15|16|17|18|19|20|21)\b/i, trim: "VA" },
  { test: /\bbrz\b/i, trim: "ZC6" },
  // Jeep
  { test: /\bwrangler.*tj\b|\btj\b.*wrangler/i, trim: "TJ" },
  { test: /\bwrangler.*jk\b|\bjk\b.*wrangler/i, trim: "JK" },
  { test: /\bwrangler.*jl\b|\bjl\b.*wrangler/i, trim: "JL" },
  // Honda
  { test: /\bek\s*civic\b|\bcivic.*\b(96|97|98|99|00)\b/i, trim: "EK" },
  { test: /\bep3\b|\bcivic\s*si.*\b(02|03|04|05)\b/i, trim: "EP3" },
  { test: /\bdc5\b|\brsx\b/i, trim: "DC5" },
  { test: /\bap1\b|\bs2000.*\b(00|01|02|03|04|05|06|07|08|09)\b/i, trim: "AP1/AP2" },
  // Toyota
  { test: /\bmk4\s*supra\b|\bsupra.*jza80\b|\bjza80\b/i, trim: "JZA80" },
  { test: /\bmk3\s*supra\b|\bsupra.*ma70\b/i, trim: "MA70" },
  { test: /\baw11\b|\bmr2.*\b(85|86|87|88|89)\b/i, trim: "AW11" },
  { test: /\bsw20\b|\bmr2.*\b(90|91|92|93|94|95)\b/i, trim: "SW20" },
  // Mitsubishi
  { test: /\bevo\s*x\b|\bevo\s*10\b/i, trim: "Evo X" },
  { test: /\bevo\s*(viii|8)\b/i, trim: "Evo VIII" },
  { test: /\bevo\s*(ix|9)\b/i, trim: "Evo IX" },
];

export function parseVehicle(input: {
  text?: string;
  make?: string;
  model?: string;
  year?: string;
}): Vehicle {
  const manualYear = input.year ? parseInt(input.year, 10) : NaN;
  const haystack = (input.text ?? "").toLowerCase();

  // Year — take the first plausible year found
  const yearMatch = haystack.match(/\b(19[7-9]\d|20[0-2]\d)\b/);
  const year = !Number.isNaN(manualYear)
    ? manualYear
    : yearMatch ? parseInt(yearMatch[1], 10) : null;

  let make = input.make?.trim() ?? "";
  let model = input.model?.trim() ?? "";

  // Step 1: try model-first detection (catches "Miata" without "Mazda")
  if (!make || !model) {
    for (const mp of MODEL_PATTERNS) {
      if (mp.pattern.test(haystack) || mp.pattern.test(input.text ?? "")) {
        if (!make) make = mp.make;
        if (!model) model = mp.model;
        break;
      }
    }
  }

  // Step 2: make detection by pattern
  if (!make) {
    for (const m of COMMON_MAKES) {
      if (m.pattern.test(haystack) || m.pattern.test(input.text ?? "")) {
        make = m.name;
        break;
      }
    }
  }

  // Step 3: fallback model extraction from text after make name
  if (!model && make) {
    const escapedMake = make.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    const re = new RegExp(`${escapedMake}\\s+([a-z0-9][a-z0-9\\-\\s]{1,20})`, "i");
    const mm = (input.text ?? "").match(re);
    if (mm) model = mm[1].trim().split(/\s+/).slice(0, 2).join(" ");
  }

  // Mileage
  let mileage: number | null = null;
  const mi = haystack.match(/([\d,]{3,7})\s*(?:k\s*miles?|k\s*mi\b|miles?|mi\b)/);
  if (mi) {
    const raw = mi[1].replace(/,/g, "");
    let n = parseInt(raw, 10);
    if (/k\s*(miles?|mi)/.test(mi[0])) n = n * 1000;
    if (!Number.isNaN(n) && n > 100 && n < 500_000) mileage = n;
  }

  // Trim / chassis code
  let trim: string | undefined;
  const fullText = `${input.text ?? ""} ${model}`;
  for (const t of TRIM_HINTS) {
    if (t.test.test(fullText)) {
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
  const exceptions = new Set(["bmw", "gmc", "rx-7", "rx-8", "mx-5", "cr-v", "gt-r", "nsx", "wrx", "sti", "brz"]);
  return s
    .split(/\s+/)
    .map((w) => {
      const lower = w.toLowerCase();
      if (exceptions.has(lower)) return w.toUpperCase().replace("RX-", "RX-").replace("MX-", "MX-");
      if (w.length <= 2) return w.toUpperCase();
      return w[0].toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
}

// ─── Make/model detectors ────────────────────────────────────────────────────

const GERMAN = /\b(bmw|audi|mercedes|mercedes-benz|benz|vw|volkswagen|porsche)\b/i;
const TRUCK = /\b(wrangler|jeep|f-?150|f-?250|f-?350|silverado|ram|tacoma|tundra|bronco|4runner|suburban|yukon|sequoia)\b/i;
const JDM = /\b(350z|370z|silvia|skyline|gt-r|gtr|supra|rx-?7|rx-?8|mx-?5|miata|s2000|nsx|evo|lancer\s*evolution|wrx|sti|brz|celica|mr-?2|integra|prelude|eclipse|3000gt)\b/i;
const ROTARY = /\b(rx-?7|rx-?8)\b/i;
const TURBO_FOUR = /\b(wrx|sti|evo|lancer\s*evolution|mazdaspeed|focus\s*st|focus\s*rs|golf\s*gti|golf\s*r|veloster\s*n|stinger)\b/i;
const MUSCLE = /\b(mustang|camaro|challenger|charger|corvette|viper)\b/i;
const HYBRID = /\b(prius|insight|ioniq|niro|volt|fusion\s*hybrid|camry\s*hybrid|accord\s*hybrid)\b/i;

let idCounter = 0;

function range(base: number): [number, number] {
  const lo = Math.round((base * 0.85) / 10) * 10;
  const hi = Math.round((base * 1.25) / 10) * 10;
  return [lo, hi];
}

function mk(label: string, base: number, category: Category, severity: Severity, explanation: string): Issue {
  const [costMin, costMax] = range(base);
  return { id: `issue-${++idCounter}`, label, category, severity, costMin, costMax, explanation };
}

// ─── Generic pool ────────────────────────────────────────────────────────────

const GENERIC_POOL: Record<Category, Array<{ label: string; base: number; sev: Severity; exp: string }>> = {
  "Engine & Drivetrain": [
    { label: "Spark Plug & Coil Pack Service", base: 280, sev: "LOW", exp: "Standard tune-up item. Worn plugs cause rough idle and reduced fuel economy. Ask the seller when it was last done — if they're not sure, budget for a fresh set before you drive it hard." },
    { label: "Transmission Fluid Service", base: 320, sev: "MED", exp: "Most sellers skip this completely. Degraded fluid shortens transmission life dramatically and causes harsh shifts. Pull the dipstick if accessible — pink/red is good, brown or burnt-smelling means it's overdue." },
    { label: "Serpentine Belt Replacement", base: 220, sev: "LOW", exp: "Look for surface cracks or glazing on the belt. A snapped serpentine belt leaves you stranded instantly and can damage cooling and power steering. It's a cheap preventive swap." },
    { label: "Cooling System Flush", base: 250, sev: "MED", exp: "Coolant breaks down and causes rust inside the engine passages. Check the reservoir — brown or rusty fluid, or an oily film on top, means the system hasn't been serviced in years." },
    { label: "Motor Mount Wear", base: 380, sev: "MED", exp: "With the hood open, have someone rev the engine while you watch — excessive movement or a thud when dropping into gear means at least one mount is gone. Causes vibration and accelerates wear on CV axles." },
    { label: "PCV Valve & Crankcase Service", base: 180, sev: "LOW", exp: "A stuck PCV valve causes oil sludge buildup and pressurizes the crankcase. Easy $20 part, but if it's been ignored for years the sludge becomes a much bigger issue. Ask about oil change frequency." },
  ],
  "Chassis & Suspension": [
    { label: "Alignment & Tire Balance", base: 180, sev: "LOW", exp: "Almost always needed after buying a used car. On the test drive, let go of the wheel briefly at highway speed — pulling to one side or a steering vibration means it's overdue." },
    { label: "Sway Bar End Links & Bushings", base: 240, sev: "LOW", exp: "Worn end links cause a clunking noise over bumps, especially at low speed. Cheap part, but the noise is annoying and it affects handling feel. Easy to check — just grab the link and see if there's play." },
    { label: "Brake Fluid Flush", base: 160, sev: "LOW", exp: "Brake fluid absorbs moisture over time. Dark brown fluid in the reservoir means it's overdue — degraded fluid reduces pedal feel and can corrode ABS components internally." },
    { label: "Wheel Bearing Check", base: 420, sev: "MED", exp: "On the test drive, listen for a hum or growl that changes pitch with speed or load. Failed bearings cause uneven tire wear and — if ignored — eventual wheel separation. Get it checked before buying." },
    { label: "Strut & Shock Absorber Wear", base: 700, sev: "MED", exp: "Push down hard on each corner of the car — it should rebound once and stop. If it keeps bouncing, the struts are shot. Bad shocks ruin tire contact and make the car unsafe in panic stops." },
    { label: "Tie Rod & Ball Joint Inspection", base: 350, sev: "HIGH", exp: "Grab each front tire at 9 and 3 o'clock and rock it — any looseness is a worn tie rod. Then grab at 12 and 6 and do the same for ball joints. These are steering and suspension safety items." },
  ],
  "Body & Electrical": [
    { label: "Headlight Lens Restoration", base: 180, sev: "LOW", exp: "Yellowed headlights cut nighttime visibility significantly. Easy DIY fix with a $20 kit, or $80 at any detailer. Factor it into your offer if the seller hasn't done it." },
    { label: "Door Seal & Weatherstrip Condition", base: 220, sev: "LOW", exp: "Check for wind noise on the highway and look for water staining inside the door jambs. Cracked seals lead to interior moisture and eventually rust in the floor pans." },
    { label: "Battery Load Test", base: 200, sev: "LOW", exp: "Free at any AutoZone or O'Reilly. If the battery is more than 4 years old, budget for a replacement soon — they fail without warning and leave you stranded." },
    { label: "Clear Coat & Paint Fade (Hood/Roof)", base: 650, sev: "LOW", exp: "Sun-oxidized clear coat on horizontal panels is cosmetic but affects resale. It's a real detailing cost — factor it into your offer rather than assuming you'll live with it." },
    { label: "Interior Trim, Switches & Controls", base: 280, sev: "LOW", exp: "Test every single button on the test drive — windows, mirrors, locks, HVAC controls, heated seats, cruise control. Broken switches and missing trim clips are small individually but add up fast." },
    { label: "EVAP System & Emissions Check", base: 220, sev: "LOW", exp: "Ask if the check engine light has been on recently. EVAP codes are common on older cars and cheap to fix, but they'll fail an emissions test. Request an OBD scan before purchasing." },
  ],
};

// ─── Issue generation ─────────────────────────────────────────────────────────

export function generateIssues(vehicle: Vehicle): Issue[] {
  idCounter = 0;
  const issues: Issue[] = [];
  const seen = new Set<string>();
  const push = (i: Issue) => { if (!seen.has(i.label)) { seen.add(i.label); issues.push(i); } };

  const fullStr = `${vehicle.make} ${vehicle.model}`;
  const year = vehicle.year ?? 2010;
  const v = `${vehicle.year ?? ""} ${vehicle.make} ${vehicle.model}`.trim();

  // ── Rotary engine ──────────────────────────────────────────────────────────
  if (ROTARY.test(fullStr)) {
    push(mk("Apex Seal Wear / Compression Test", 1200, "Engine & Drivetrain", "HIGH",
      `The rotary engine in the ${v} lives or dies by its apex seals. Before you go see it, ask for a compression test printout — each rotor should read above 8.5 bar / 120 psi. Low compression on a cold start means a rebuild is coming, and that's a $3,000–$6,000 job at a rotary specialist.`));
    push(mk("Coolant In Oil (Rotor Housing Leak)", 800, "Engine & Drivetrain", "HIGH",
      `Pull the oil dipstick and look for a milky, mayonnaise-like consistency. Coolant mixing with oil means the rotor housing O-rings or end plate seals are gone. On the test drive, watch for white smoke from the exhaust on startup — it's the clearest warning sign.`));
    push(mk("Catalytic Converter Damage", 650, "Body & Electrical", "MED",
      `Rotary engines run rich and can destroy catalytic converters. Check for a rattling sound from under the car. A clogged cat kills performance and costs $400–$800 to replace on these platforms.`));
  }

  // ── Turbo four (WRX, STI, Evo, GTI, etc.) ────────────────────────────────
  if (TURBO_FOUR.test(fullStr)) {
    push(mk("Boost Leak Inspection", 350, "Engine & Drivetrain", "HIGH",
      `Turbocharged engines develop boost leaks at intercooler couplings and charge pipes over time — especially if the car has been modded or pushed hard. Symptoms are a whooshing sound under acceleration and sluggish boost. A smoke test at a shop will find every leak quickly.`));
    push(mk("Turbocharger Oil Feed Line Condition", 450, "Engine & Drivetrain", "MED",
      `The turbo oil feed line on the ${v} is a known maintenance item. Restricted flow from a clogged line starves the turbo of lubrication and causes premature bearing failure. Ask about oil change frequency — turbos need clean oil every 5,000 miles, no exceptions.`));
  }

  // ── EJ Subaru specific (WRX/STI) ──────────────────────────────────────────
  if (/\b(wrx|sti|impreza)\b/i.test(fullStr) && /subaru/i.test(fullStr)) {
    push(mk("EJ Engine Spun Bearing / Rod Knock", 3500, "Engine & Drivetrain", "HIGH",
      `The EJ engine in the ${v} is notorious for spun rod bearings, especially in cars that were driven hard or had infrequent oil changes. On the test drive, listen for a knocking sound at idle that gets louder under load. This is a walk-away condition unless the price reflects a full engine replacement.`));
    push(mk("Head Gasket Failure (EJ)", 1400, "Engine & Drivetrain", "HIGH",
      `EJ engines have a well-documented head gasket weakness. Check for white exhaust smoke on a cold start, a sweet smell from the coolant reservoir, or bubbles in the overflow tank with the engine running. A failed gasket means a $1,200–$2,000 repair minimum.`));
  }

  // ── JDM general ───────────────────────────────────────────────────────────
  if (JDM.test(fullStr) && !ROTARY.test(fullStr)) {
    push(mk("Aftermarket Modification Inspection", 400, "Body & Electrical", "MED",
      `JDM platforms attract modifications — some done well, most done questionably. Check under the hood for cut wires, zip-tied vacuum lines, and non-stock ECU tunes. Ask for a list of every modification in writing. Each mod shifts liability to you once you drive it off.`));
    push(mk("Differential Fluid Service", 280, "Engine & Drivetrain", "MED",
      `The rear or limited-slip differential on the ${v} needs fresh fluid every 30k miles — most sellers skip it. Old fluid causes clutch-pack wear in LSD units and leads to a $1,500+ rebuild. Ask when it was last done and check for gear whine on the test drive.`));
  }

  // ── Mazda specific ────────────────────────────────────────────────────────
  if (/mazda/i.test(fullStr)) {
    if (/miata|mx-?5/i.test(fullStr)) {
      push(mk("Soft Top Frame & Latch Condition", 650, "Body & Electrical", "MED",
        `Inspect the soft top by raising and lowering it in front of the seller. Look for tears at the corners, a cloudy rear window, and whether the latches engage cleanly. A replacement top is $300–$800 for fabric, more for glass rear window. Water leaks ruin the interior fast.`));
      push(mk("Rear Subframe Rust (NA/NB)", 800, "Chassis & Suspension", "HIGH",
        `Early Miatas are notorious for rear subframe rust, especially in northern states or coastal areas. Get under the car and tap the rear subframe mounting points with a screwdriver handle. Flaking, pitting, or hollow sounds mean structural rust — this is a walk-away issue unless it's been professionally addressed.`));
    }
    if (/rx-?7|rx-?8/i.test(fullStr)) {
      // Already covered by ROTARY block above
    } else if (!/miata|mx-?5/i.test(fullStr)) {
      push(mk("SKYACTIV Engine Oil Consumption Check", 300, "Engine & Drivetrain", "MED",
        `Some SKYACTIV-G engines consume oil at higher-than-expected rates, particularly in the 2.0L. Check the dipstick when you arrive — it should be at the full mark. Ask how often the seller checks and tops off the oil. Consistent low levels mean the engine is burning oil.`));
    }
  }

  // ── German makes ──────────────────────────────────────────────────────────
  if (GERMAN.test(fullStr)) {
    push(mk("Oil Filter Housing Gasket Leak", 350, "Engine & Drivetrain", "MED",
      `Nearly universal on ${vehicle.make} engines past 80k miles. Look at the driver side of the engine block for crusty brown oil residue or fresh drips onto the alternator. Left alone, it destroys the alternator and belt within months.`));
    if (/bmw/i.test(fullStr)) {
      push(mk("VANOS / Valvetronic Solenoid Fault", 550, "Engine & Drivetrain", "MED",
        `BMW's variable valve timing system is reliable when oil changes are regular, but solenoids clog with sludge from dirty oil. Rough cold starts, a CEL, and a rattle on startup are the warning signs. Ask for a service history with oil change dates — vague answers are a red flag.`));
      push(mk("Cooling System Component Failure", 600, "Engine & Drivetrain", "HIGH",
        `BMW plastic cooling components — expansion tank, thermostat housing, water pump housing — become brittle with age and fail without warning. Ask if the coolant system has been refreshed. A roadside coolant failure can take the engine with it.`));
    }
    if (/audi|volkswagen|vw/i.test(fullStr)) {
      push(mk("DSG / S-Tronic Mechatronic Wear", 1200, "Engine & Drivetrain", "HIGH",
        `The dual-clutch transmission on this platform has a known mechatronic unit weakness. Symptoms are jerky low-speed engagement, hesitation from a stop, and rough 1-2 shifts. A mechatronic replacement runs $1,000–$2,500 at an independent VAG specialist.`));
    }
  }

  // ── Truck / SUV ────────────────────────────────────────────────────────────
  if (TRUCK.test(fullStr)) {
    push(mk("Transfer Case Fluid Leak", 250, "Engine & Drivetrain", "MED",
      `Look under the truck right behind the transmission — any wet seepage or fresh drips from the transfer case output seals means they're going. Fluid itself is cheap, but ignoring it leads to a $2,000–$3,500 transfer case replacement.`));
    push(mk("Steering Gear Play / Death Wobble Check", 500, "Chassis & Suspension", "HIGH",
      `At 55–65 mph, hit a small expansion joint and watch what happens. Any sustained shimmy that you can't immediately control is the infamous death wobble — caused by worn track bar, ball joints, or steering stabilizer. This is a safety issue that should be fixed before driving on a highway.`));
    push(mk("Frame Rust & Underbody Inspection", 700, "Body & Electrical", "HIGH",
      `Get under the truck with a flashlight and a screwdriver. Tap the frame rails, crossmembers, and bed mounting points. Surface scale is fine; hollow sounds or a screwdriver that punches through means the frame is compromised — walk away.`));
  }

  // ── Muscle cars ────────────────────────────────────────────────────────────
  if (MUSCLE.test(fullStr)) {
    push(mk("Clutch & Flywheel Wear Assessment", 900, "Engine & Drivetrain", "HIGH",
      `Muscle cars get driven hard. On the test drive, slip the clutch slightly when pulling away from a stop — it should engage firmly with minimal slip. A burning smell or clutch that grabs at the very top of travel means it needs replacement soon. Budget $800–$1,400 at a shop.`));
    push(mk("Rear Axle Seal Leak", 300, "Engine & Drivetrain", "MED",
      `Look at the inner face of the rear wheels for an oily film — that's a leaking axle seal. Differential fluid on the brakes is a serious safety issue and will fail any state inspection. Easy fix, but the brakes may need service too.`));
  }

  // ── Hybrid ─────────────────────────────────────────────────────────────────
  if (HYBRID.test(fullStr)) {
    push(mk("HV Battery State of Health", 2500, "Body & Electrical", "HIGH",
      `Ask the seller to show you the hybrid battery health readout on a scan tool. A degraded pack shows dramatically reduced EV range and causes the ICE to run constantly. Replacement packs run $1,500–$4,000 depending on the model.`));
    push(mk("Inverter Coolant Loop Service", 300, "Engine & Drivetrain", "MED",
      `Hybrid vehicles have a separate coolant loop for the inverter and motor electronics. Most owners never service it. Ask when it was last flushed — degraded inverter coolant causes $2,000+ inverter failures.`));
  }

  // ── Age-based rules ────────────────────────────────────────────────────────
  if (year < 2000) {
    push(mk("Suspension Bushing Replacement", 500, "Chassis & Suspension", "MED",
      `25+ year old rubber bushings are cracked, hardened, and overdue for replacement on every car regardless of mileage. The symptoms — clunking, wandering steering, loose feel — are present on almost every car this age. A full polyurethane bushing kit transforms the driving experience.`));
    push(mk("Valve Cover Gasket Leak", 250, "Engine & Drivetrain", "LOW",
      `Look for oily residue along the valve cover edges and sniff near the firewall when the engine is warm. The gasket is a cheap part but labor adds up on some platforms. Not urgent, but it almost always signals other deferred maintenance.`));
    push(mk("Structural Rust Assessment", 700, "Body & Electrical", "HIGH",
      `Get under the car with a flashlight and a screwdriver. Poke at the subframe, rocker panels, floor pans, and rear shock towers. Surface rust is cosmetic — flaking rust that crumbles or hollow spots that flex mean structural compromise. This is the most important inspection point on any car from this era.`));
    push(mk("Distributor Cap & Ignition System", 280, "Engine & Drivetrain", "MED",
      `Older distributor-based ignition systems develop cracks in the cap and worn rotor contacts over time. A car that misfires or stutters under load usually starts here. Check the cap for carbon tracking lines — easy to spot with a flashlight.`));
  } else if (year < 2008) {
    push(mk("Timing Chain / Belt Service Due", 900, "Engine & Drivetrain", "HIGH",
      `Listen for a rattling sound on cold startup that quiets after a few seconds — that's a stretched timing chain. For belt-driven engines, ask for the last belt service date and mileage. A skipped belt service is a ticking time bomb that can destroy the engine without warning.`));
    push(mk("Coolant Expansion Tank Failure", 200, "Engine & Drivetrain", "MED",
      `Plastic expansion tanks from this era get brittle and crack at the seams. Look for crusty white mineral deposits around the cap and lower seams — that's dried coolant from a slow leak. Cheap part, but a blown tank strands you fast.`));
    push(mk("Control Arm Bushing Wear", 450, "Chassis & Suspension", "MED",
      `By 100k miles these are usually shot on most platforms. Worn bushings feel like loose, imprecise steering and cause tire cupping on the inner edge. Replacing both front control arms with fresh bushings plus an alignment typically runs this amount at an independent shop.`));
    push(mk("O2 Sensor / Emissions Fault", 180, "Body & Electrical", "LOW",
      `A common and usually cheap check engine light cause. Ask the seller if any codes are stored — many states require a clear emissions system to register the car. A $30 part and 30 minutes of labor if it's just one sensor.`));
  } else if (year < 2015) {
    push(mk("Timing Chain Tensioner Wear", 850, "Engine & Drivetrain", "HIGH",
      `On the test drive, listen for a faint rattle on cold start that disappears after 10–15 seconds. The ${v} platform is in the mileage band where tensioner wear becomes common. Catching it at rattle stage is a $850 fix. Missing it means a new engine.`));
    push(mk("Carbon Buildup on Intake Valves (GDI)", 600, "Engine & Drivetrain", "MED",
      `Direct-injection engines — which this likely is — build carbon deposits on the back of intake valves over time. Symptoms are a rough idle, hesitation, and reduced power. A walnut-blast cleaning runs $400–$700 and restores performance.`));
    push(mk("Thermostat & Water Pump Replacement", 480, "Engine & Drivetrain", "MED",
      `Plastic thermostat housings and impeller water pumps from this era have a finite lifespan. If the temperature gauge is slow to climb or runs slightly cool, the thermostat is failing. Do both together since they share labor on most platforms.`));
  } else {
    push(mk("Infotainment & Software System Check", 150, "Body & Electrical", "LOW",
      `On the test drive, cycle through every screen — backup camera, navigation, CarPlay or Android Auto, Bluetooth. A completely dead screen usually needs a $1,000+ head unit replacement. Software freezes are usually a dealer reflash.`));
    push(mk("HV / 12V Battery Dual System Health", 280, "Body & Electrical", "LOW",
      `Modern vehicles depend on both the main battery and a 12V auxiliary battery for electronics. Ask for the install date on the 12V — if it's original at 5+ years, budget for a replacement. Start/stop systems accelerate 12V wear significantly.`));
    push(mk("Brake Pad & Rotor Measurement", 400, "Chassis & Suspension", "MED",
      `Peek through the wheel spokes at the rotor face — a deep lip on the outer edge means the rotor is worn past its limit. Budget for pads and rotors together, not just one. Mixing new pads on worn rotors causes uneven braking and rapid wear.`));
    push(mk("ADAS Sensor Calibration Check", 300, "Body & Electrical", "MED",
      `Modern vehicles with adaptive cruise, lane keep, and automatic emergency braking require all cameras and radar sensors to be calibrated to OEM specs. Even a minor fender-bender can knock them out of alignment. Ask if any ADAS warning lights appear on startup.`));
  }

  // ── Top up each category to 5 items minimum ──────────────────────────────
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