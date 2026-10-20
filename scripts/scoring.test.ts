import { computeScore, scoreAtPrice, bandFor, verdictFromScore } from "../src/lib/ghost/scoring.ts";
import type { ScoreInput } from "../src/lib/ghost/scoring.ts";

let failed = 0;
const eq = (name: string, cond: boolean, extra = "") => { if (!cond) { failed++; console.log("FAIL", name, extra); } else console.log("ok  ", name, extra); };
const show = (name: string, input: ScoreInput) => {
  const r = computeScore({ currentYear: 2026, ...input });
  console.log(`\n== ${name}: ${r.score} (${r.bandLabel}, ${r.verdict}, confidence ${r.confidence}${r.cap ? ", cap " + r.cap.limit : ""}, raw ${r.rawScore})`);
  console.log("   " + r.dimensions.map((d) => `${d.key}=${d.score ?? "-"}`).join(" "));
  console.log("   drivers: " + r.drivers.slice(0, 4).map((d) => `${d.label} -${d.points}`).join("; "));
  return r;
};

// the BMW demo report from the app
const bmw: ScoreInput = {
  askingPrice: 18500, year: 2018, mileage: 94000, marketValueLow: 16200, marketValueHigh: 17800, vinDecoded: true, hasListingText: true,
  sellerRedFlags: ["Seller mentions 'just serviced' without providing receipts", "Asking price 12% above market average for this mileage and year", "Listed for 3 weeks with multiple price drops"],
  recalls: [{ status: "Remedied", component: "ENGINE AND ENGINE COOLING", description: "fuel injector may crack" }], recallsKnown: true,
  issues: [
    { id: "hpfp", severity: "HIGH", urgency: "Immediate", costMin: 800, costMax: 1400, label: "High-pressure fuel pump" },
    { id: "chain", severity: "HIGH", urgency: "Immediate", costMin: 1200, costMax: 2200, label: "Timing chain tensioner" },
    { id: "vcg", severity: "MED", urgency: "Soon", costMin: 400, costMax: 700, label: "Valve cover gasket" },
    { id: "arms", severity: "MED", urgency: "Soon", costMin: 600, costMax: 1100, label: "Control arm bushings" },
    { id: "cool", severity: "MED", urgency: "Soon", costMin: 500, costMax: 900, label: "Coolant system" },
    { id: "brake", severity: "LOW", urgency: "Monitor", costMin: 80, costMax: 150, label: "Brake fluid" },
    { id: "plugs", severity: "LOW", urgency: "Monitor", costMin: 200, costMax: 350, label: "Spark plugs" },
  ],
};
const r1 = show("BMW 330i demo", bmw);
eq("BMW demo is a negotiate-range score", r1.score >= 40 && r1.score <= 65 && r1.verdict === "negotiate", String(r1.score));

const atOffer = scoreAtPrice({ currentYear: 2026, ...bmw }, 16900);
console.log(`   at offer $16,900: ${atOffer.score}`);
eq("lower price raises the score", atOffer.score > r1.score, `${r1.score} -> ${atOffer.score}`);

const clean: ScoreInput = { askingPrice: 12000, year: 2019, mileage: 60000, marketValueLow: 12500, marketValueHigh: 14000, hasListingText: true, sellerRedFlags: [], recalls: [], recallsKnown: true, vinDecoded: true,
  issues: [{ id: "a", severity: "LOW", urgency: "Monitor", costMin: 100, costMax: 200 }, { id: "b", severity: "MED", urgency: "Soon", costMin: 200, costMax: 400 }] };
const r2 = show("clean car below market", clean);
eq("clean car is top band", r2.score >= 88, String(r2.score));

const typical: ScoreInput = { askingPrice: 14500, year: 2017, mileage: 82000, marketValueLow: 13500, marketValueHigh: 15500, hasListingText: true, sellerRedFlags: ["Seller mentions just serviced without receipts"], recalls: [], recallsKnown: true, vinDecoded: true,
  issues: [{ id: "h", severity: "HIGH", urgency: "Soon", costMin: 900, costMax: 1500 }, { id: "m1", severity: "MED", urgency: "Soon", costMin: 300, costMax: 600 }, { id: "m2", severity: "MED", urgency: "Monitor", costMin: 250, costMax: 450 }, { id: "l1", severity: "LOW", urgency: "Monitor", costMin: 80, costMax: 150 }] };
const rt = show("typical fairly priced car, 1 high item", typical);
eq("typical car lands in the fair to good range", rt.score >= 58 && rt.score <= 80, String(rt.score));
const noMarket = show("same car without market range", { ...typical, marketValueLow: null, marketValueHigh: null });
eq("missing market range lowers confidence and pulls toward 50", noMarket.confidence !== "high" && Math.abs(noMarket.score - 50) < Math.abs(rt.score - 50) + 8, `${noMarket.score} vs ${rt.score}`);
const cheaper = computeScore({ currentYear: 2026, ...bmw, askingPrice: 15500 });
eq("a lower price never lowers the repair dimension", cheaper.dimensions[1].score === r1.dimensions[1].score, `${cheaper.dimensions[1].score} vs ${r1.dimensions[1].score}`);

const salvage: ScoreInput = { ...clean, askingPrice: 9000, sellerRedFlags: ["Rebuilt title not mentioned in the listing", "Odometer reads lower than the service history"] };
const r3 = show("salvage and odometer flags", salvage);
eq("severe flag caps the score at 39", r3.score <= 39 && r3.cap?.limit === 39, String(r3.score));

const wreck: ScoreInput = { askingPrice: 5000, year: 2004, mileage: 230000, hasListingText: true, sellerRedFlags: ["No maintenance records"],
  issues: [{ id: "e", severity: "HIGH", urgency: "Immediate", costMin: 2500, costMax: 4500 }, { id: "t", severity: "HIGH", urgency: "Immediate", costMin: 1500, costMax: 2500 }, { id: "s", severity: "MED", urgency: "Soon", costMin: 700, costMax: 1200 }] };
const r4 = show("old high-mileage money pit", wreck);
eq("money pit is poor", r4.score < 40 && r4.verdict === "walkaway", String(r4.score));

const noData = show("almost no data", { askingPrice: 8000, issues: [] });
eq("no data gives low confidence", noData.confidence === "low", noData.confidence);
eq("no data never looks excellent", noData.score >= 45 && noData.score <= 70, String(noData.score));
eq("unknown dimensions are skipped", noData.dimensions.filter((d) => !d.known).length >= 3);

const safety: ScoreInput = { ...clean, recalls: [{ status: "Open", component: "AIR BAGS", description: "Air bag may not deploy" }] };
const r5 = show("open airbag recall", safety);
eq("open safety recall caps at 54", r5.score <= 54, String(r5.score));

const cheap = show("suspiciously cheap", { ...clean, askingPrice: 6000 });
eq("suspiciously low price is not rewarded fully", cheap.dimensions[0].score === 80, String(cheap.dimensions[0].score));
eq("suspiciously low price is capped below the buy band", cheap.score <= 74 && cheap.verdict === "negotiate" && cheap.cap?.limit === 74, String(cheap.score));

const junk = computeScore({ currentYear: 2026, askingPrice: Number.NaN, issues: [{ id: "x", severity: "HIGH", costMin: Number.NaN, costMax: -5 } as never] });
eq("garbage input does not throw and stays in range", junk.score >= 0 && junk.score <= 100, String(junk.score));

eq("bands", bandFor(95).band === "excellent" && bandFor(80).band === "good" && bandFor(65).band === "fair" && bandFor(45).band === "weak" && bandFor(10).band === "poor");
eq("verdict thresholds", verdictFromScore(75) === "buy" && verdictFromScore(74) === "negotiate" && verdictFromScore(40) === "negotiate" && verdictFromScore(39) === "walkaway");
eq("impacts add up to repairs plus risk loss", Math.abs(Object.values(r1.issueImpacts).reduce((a, b) => a + b, 0) - (r1.dimensions[1].pointsLost + r1.dimensions[2].pointsLost)) < 0.8);

// monotonic: more HIGH findings never raise the score
let prev = 101, mono = true;
for (let n = 0; n <= 5; n++) {
  const s = computeScore({ currentYear: 2026, ...clean, issues: Array.from({ length: n }, (_, k) => ({ id: "h" + k, severity: "HIGH" as const, urgency: "Immediate" as const, costMin: 900, costMax: 1500 })) }).score;
  if (s > prev) mono = false; prev = s;
}
eq("score never rises when HIGH findings are added", mono);

console.log(failed ? `\n${failed} FAILED` : "\nall checks passed");
process.exit(failed ? 1 : 0);
