import { createFileRoute, notFound } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Navbar } from "@/components/ghost/Navbar";
import { Footer } from "@/components/ghost/Footer";

interface CarPage {
  slug: string;
  year: number;
  make: string;
  model: string;
  metaDescription: string;
  intro: string;
  sections: { heading: string; body: string }[];
  ctaMake: string;
  ctaModel: string;
}

const CAR_PAGES: CarPage[] = [
  {
    slug: "2018-bmw-330i-common-problems",
    year: 2018, make: "BMW", model: "330i",
    metaDescription: "2018 BMW 330i common problems — oil leaks, cooling system failures, and electrical gremlins to check before buying a used B48-powered 3 Series.",
    intro: "The 2018 BMW 330i powered by the B48 turbocharged four-cylinder is one of the most rewarding used sport sedans under $25,000 — but it comes with a checklist of recurring issues that every buyer should understand before signing anything.",
    sections: [
      { heading: "Engine Oil Consumption & Valve Cover Leaks", body: "The B48 engine is known for higher-than-average oil consumption, often burning up to a quart every 2,000–3,000 miles. Valve cover gasket leaks are common after 60,000 miles and present as an oily residue along the top of the engine. Ask for service records showing regular oil changes and inspect the valve cover area before purchase." },
      { heading: "Cooling System: Water Pump & Thermostat", body: "BMW's electric water pump on the B48 has a documented failure history, typically around 60,000–80,000 miles. A failing pump may trigger a coolant warning without immediately overheating. Budget $600–900 for a water pump replacement. The plastic thermostat housing is another common leak point — inspect it during any pre-purchase inspection." },
      { heading: "High-Pressure Fuel Pump (HPFP) Noise", body: "Many B48 owners report a diesel-like ticking from the high-pressure fuel pump, especially on cold starts. This is often normal but can indicate injector wear on higher-mileage examples. A compression test and fuel pressure check during a pre-purchase inspection will confirm the engine's health." },
      { heading: "Electrical & iDrive Issues", body: "The 2018 330i's infotainment system (iDrive 6) can exhibit random reboots, frozen screens, and Bluetooth connectivity drops. These issues are typically software-related and can be resolved with dealer coding updates. Also verify that all ADAS features (lane keep assist, front collision warning) are fully functional — sensors are expensive to replace." },
    ],
    ctaMake: "BMW", ctaModel: "330i",
  },
  {
    slug: "2015-toyota-camry-common-problems",
    year: 2015, make: "Toyota", model: "Camry",
    metaDescription: "2015 Toyota Camry common problems — oil consumption on 4-cylinder engines, transmission shudder, and paint issues to check before you buy.",
    intro: "The 2015 Toyota Camry has one of the strongest reliability reputations in the midsize sedan segment, but the 2.5L 4-cylinder engine from this generation has a known oil consumption issue that has led to multiple technical service bulletins.",
    sections: [
      { heading: "2AR-FE Engine Oil Consumption", body: "Toyota issued TSB 0094-14 covering excessive oil consumption on 2.5L Camrys from this era. Some owners report burning up to a quart every 1,200 miles. Toyota updated the piston rings in a revised short block kit, but many vehicles were never repaired. Check whether the TSB repair has been performed and request to see oil level before the test drive." },
      { heading: "Transmission Shudder (6-Speed Automatic)", body: "The 6-speed automatic can develop a shudder during light acceleration between 25–45 mph, caused by torque converter clutch slip. Toyota released an updated ATF fluid (WS specification) and a drain-and-fill procedure to address this. Verify the transmission fluid has been recently serviced and test drive with particular attention to light throttle transitions." },
      { heading: "Paint & Clear Coat", body: "The 2015 Camry's exterior paint — particularly white and silver — is prone to clear coat peeling on the roof and hood. This is a cosmetic issue but expensive to repair ($800–1,500 for a full repaint). Inspect the roof carefully in sunlight before purchase." },
      { heading: "Power Steering Rack", body: "Some 2015 Camrys with electric power steering exhibit a slight delay or inconsistency in steering feel. While not a safety issue, it can indicate early wear in the rack assembly. Test for straight-line tracking and any clunking over bumps." },
    ],
    ctaMake: "Toyota", ctaModel: "Camry",
  },
  {
    slug: "2017-honda-civic-common-problems",
    year: 2017, make: "Honda", model: "Civic",
    metaDescription: "2017 Honda Civic common problems — AC compressor failure, CVT shudder on turbos, and oil dilution issues to check before buying.",
    intro: "The 2017 Honda Civic (10th generation) received widespread critical acclaim for its driving dynamics and fuel economy, but this generation introduced new engines and a CVT transmission that brought fresh reliability concerns buyers should verify.",
    sections: [
      { heading: "1.5T Engine Oil Dilution", body: "Honda issued a technical service bulletin (18-090) in 2018 acknowledging that the 1.5T turbocharged engine can mix gasoline into the engine oil during cold, short-trip driving in cold climates. The oil appears overfull on the dipstick and smells of fuel. Honda's fix involved updated ECU calibration, but the issue persists in cold weather use. Check oil level and smell before purchase." },
      { heading: "CVT Transmission Shudder", body: "The CVT paired with the 1.5T engine can exhibit a shudder or vibration during light acceleration, similar to the Toyota issue but distinct in cause. Honda updated the CVT software in a recall for some model years. Confirm the recall has been performed at a Honda dealer and test drive on a highway ramp with light throttle." },
      { heading: "Air Conditioning Compressor", body: "The AC compressor on 10th-gen Civics has an elevated failure rate, with compressors seizing as early as 50,000 miles. Symptoms include a squealing belt, no cold air, and an AC clutch that won't engage. Replacement runs $800–1,200. Always verify AC blows cold before any used car purchase." },
      { heading: "Honda Sensing Calibration", body: "The front camera for Honda Sensing ADAS features (collision mitigation, lane assist) can be knocked out of calibration by a windshield replacement or minor front-end impact. Recalibration requires specialized equipment. Verify all Sensing features are active and functional during your inspection." },
    ],
    ctaMake: "Honda", ctaModel: "Civic",
  },
  {
    slug: "2016-ford-f150-common-problems",
    year: 2016, make: "Ford", model: "F-150",
    metaDescription: "2016 Ford F-150 common problems — 2.7L EcoBoost carbon buildup, transmission shudder, and tailgate issues to know before buying.",
    intro: "The 2016 Ford F-150 with the aluminum body continues to be one of America's best-selling trucks, and the EcoBoost engines offer impressive performance — but buyers should be aware of several recurring issues that show up across the 2.7L and 3.5L EcoBoost variants.",
    sections: [
      { heading: "EcoBoost Carbon Buildup on Intake Valves", body: "Direct-injection engines like the 2.7L and 3.5L EcoBoost do not wash intake valves with fuel, leading to carbon deposits that restrict airflow over time. Symptoms include rough idle, misfires, and reduced power, typically after 60,000–80,000 miles. Walnut blasting costs $400–700 and is the standard fix. Ask whether this service has been performed." },
      { heading: "6R80 Transmission Shudder & Shift Flares", body: "The 6-speed automatic in the 2016 F-150 can develop a shudder during torque converter lockup or shift flares when warm. Ford has issued multiple TSBs for this. A recent transmission fluid service with Ford-spec Mercon LV fluid often resolves early symptoms. Test drive on a highway with light throttle at 40–50 mph." },
      { heading: "Panoramic Moonroof Cracking", body: "If equipped with the panoramic sunroof, the large glass panel can crack or shatter spontaneously — a known issue across multiple Ford models. If the truck has a panoramic roof, inspect carefully for stress cracks, especially near the frame edges." },
      { heading: "Tailgate Latch & Cable", body: "The tailgate latch mechanism and cable on 2016 F-150s are prone to wear and can leave the tailgate stuck open or closed. Replacement hardware is inexpensive ($50–150) but inspect and cycle the tailgate manually before purchase to confirm smooth operation." },
    ],
    ctaMake: "Ford", ctaModel: "F-150",
  },
  {
    slug: "2014-nissan-altima-common-problems",
    year: 2014, make: "Nissan", model: "Altima",
    metaDescription: "2014 Nissan Altima common problems — CVT failure, steering fluid leaks, and sunroof drain issues every buyer should check before purchase.",
    intro: "The 2014 Nissan Altima sells in huge numbers, which means plenty of used examples are available — but the CVT transmission used in this generation has a well-documented failure history that should be the first thing any buyer investigates.",
    sections: [
      { heading: "CVT Transmission Failure", body: "The JATCO-sourced CVT in the 2014 Altima has one of the most documented failure rates of any modern transmission. Typical failures involve belt slip, shudder, juddering from a stop, and in some cases complete seizure. Nissan extended the CVT warranty to 5 years/60,000 miles, but many of these vehicles are now beyond coverage. An independent transmission inspection before purchase is essential. Budget $3,500–4,500 for replacement if needed." },
      { heading: "Power Steering Fluid Leaks", body: "The 2.5L-equipped Altima uses hydraulic power steering, and the hose connections and rack are prone to seeping power steering fluid. Check for pink or reddish fluid residue near the steering rack and reservoir. A full rack replacement costs $600–900." },
      { heading: "Sunroof Drain Clogging & Water Intrusion", body: "The sunroof drain tubes on the 2014 Altima are easily blocked by debris, causing water to pool inside the cabin. Signs include musty odors, wet carpet near the A-pillar, or water stains on headliner. This is a cheap fix ($100–200) but can indicate mold or electrical damage if left unaddressed." },
      { heading: "Air Conditioning Compressor Seizing", body: "The AC compressor on QR25DE engines can seize and send metal particles through the entire AC system, requiring a full system flush and compressor replacement ($1,200–1,600). Verify cold air output and listen for any belt-area squealing before purchase." },
    ],
    ctaMake: "Nissan", ctaModel: "Altima",
  },
  {
    slug: "2018-subaru-outback-common-problems",
    year: 2018, make: "Subaru", model: "Outback",
    metaDescription: "2018 Subaru Outback common problems — head gasket risk, CVT shudder, and Eyesight camera issues every buyer should verify.",
    intro: "The 2018 Subaru Outback is a popular all-wheel-drive wagon with a loyal following, but Subaru's horizontally-opposed boxer engines have a long history of cooling system issues, and the CVT from this era has its own concerns.",
    sections: [
      { heading: "2.5i Head Gasket History & Cooling System", body: "While Subaru addressed the notorious head gasket failures from earlier generations with the FA25 engine used in 2018, the cooling system still deserves careful inspection. Look for coolant residue near the block, white exhaust smoke on startup, or a milky dipstick reading. A cooling system pressure test is highly recommended as part of any pre-purchase inspection." },
      { heading: "CVT Lineartronic Shudder", body: "The Lineartronic CVT used in the 2018 Outback can develop a shudder during acceleration from a stop, particularly on higher-mileage examples. Subaru issued revised fluid specifications and a software update. Check for smooth, seamless acceleration on test drive and confirm transmission service history." },
      { heading: "Subaru EyeSight Camera Failures", body: "The dual-camera EyeSight system is mounted on the windshield and is sensitive to camera misalignment, fogging, and windshield replacement. A malfunctioning EyeSight disables adaptive cruise and collision braking. Verify all EyeSight functions are active — the dashboard will display an alert if cameras are disabled." },
      { heading: "Oil Consumption on FA-Series Engines", body: "Some 2018 Outback owners report oil consumption between changes, burning up to a quart per 2,000 miles. Subaru issued TSBs and extended warranties on affected vehicles. Ask to check the oil dipstick before purchase and request documentation of oil change intervals." },
    ],
    ctaMake: "Subaru", ctaModel: "Outback",
  },
  {
    slug: "2015-jeep-grand-cherokee-common-problems",
    year: 2015, make: "Jeep", model: "Grand Cherokee",
    metaDescription: "2015 Jeep Grand Cherokee common problems — TIPM failures, air suspension leaks, and transmission shifting issues to inspect before buying.",
    intro: "The 2015 Jeep Grand Cherokee is a capable SUV with genuine off-road credentials, but this generation has several well-known electrical and mechanical issues that can be expensive if you're not prepared for them.",
    sections: [
      { heading: "TIPM (Totally Integrated Power Module) Failures", body: "The TIPM is the central electrical control hub, and failures in 2015 Grand Cherokees can cause bizarre symptoms: fuel pump running after the engine is off, random horn honking, stalling, or complete no-start. A replacement TIPM costs $700–1,200 plus programming. If the truck exhibits any unexplained electrical behavior, have the TIPM tested before purchase." },
      { heading: "Air Suspension Compressor Failure", body: "If equipped with the Quadra-Lift air suspension, the compressor pump is prone to failure, leaving the vehicle sagging on one corner. A replacement compressor runs $400–600. Verify the vehicle sits level and that air suspension raises and lowers correctly across all settings before purchase." },
      { heading: "8HP45/70 Transmission Rough Shifts", body: "The ZF 8-speed automatic can exhibit harsh 1-2 upshifts and occasional delayed engagement from a cold start. This is often addressed with a transmission fluid change and software update. Test drive with particular attention to smooth shifts through the lower gears." },
      { heading: "Transfer Case & Front Differential Leaks", body: "The NV244 transfer case and front differential seals are prone to leaking on higher-mileage examples. Check underneath for reddish transfer case fluid or differential oil near the front axle. A seal replacement costs $300–500 at a shop." },
    ],
    ctaMake: "Jeep", ctaModel: "Grand Cherokee",
  },
  {
    slug: "2017-mazda-cx5-common-problems",
    year: 2017, make: "Mazda", model: "CX-5",
    metaDescription: "2017 Mazda CX-5 common problems — SKYACTIV engine noise, i-ACTIVSENSE sensor calibration, and paint chips to know before buying.",
    intro: "The 2017 Mazda CX-5 is widely regarded as one of the most reliable compact SUVs of its era, with notably fewer issues than competitors — but there are a handful of common concerns that appear on higher-mileage examples.",
    sections: [
      { heading: "SKYACTIV-G Engine Ticking on Cold Start", body: "Many 2.0L and 2.5L SKYACTIV-G owners report a ticking or tapping noise on cold starts that disappears once the engine warms. This is generally attributed to the high compression ratio and direct injection characteristics of the engine, not a mechanical defect. However, persistent ticking when warm can indicate variable valve timing system wear. A pre-purchase inspection should include a cold start." },
      { heading: "i-ACTIVSENSE Calibration After Windshield Work", body: "The radar-based i-ACTIVSENSE system (forward collision warning, adaptive cruise) uses a camera and radar behind the windshield. Any windshield replacement requires professional ADAS recalibration. Confirm all safety systems are active and that the vehicle's service history doesn't show windshield work without accompanying recalibration." },
      { heading: "Paint Chip Susceptibility", body: "The 2017 CX-5's paint is softer than average and chips easily on the hood and front bumper from highway driving. While cosmetic, extensive chipping can lead to rust in stone-chip-prone climates. Inspect the leading edges of the hood and front bumper carefully." },
      { heading: "Rear Wiper Motor Failure", body: "A minor but common issue: the rear wiper motor on 2017 CX-5 models occasionally fails, leaving the rear wiper inoperable. Replacement costs $150–250. Test all wiper functions during your walk-around." },
    ],
    ctaMake: "Mazda", ctaModel: "CX-5",
  },
  {
    slug: "2016-volkswagen-jetta-common-problems",
    year: 2016, make: "Volkswagen", model: "Jetta",
    metaDescription: "2016 Volkswagen Jetta common problems — DSG shudder, 1.4T timing chain, and door handle failures to verify before buying a used Jetta.",
    intro: "The 2016 Volkswagen Jetta offers European driving refinement at a competitive price point, but the DSG dual-clutch transmission and TSI engines from this generation have a reputation for issues that can result in costly repairs if not identified before purchase.",
    sections: [
      { heading: "DSG (DQ200 7-Speed) Shudder & Hesitation", body: "The 7-speed dry-clutch DSG is the most complained-about component in this generation of Jetta. Low-speed shudder, hesitation from a stop, and occasional rough engagement are all common. VW updated the mechatronic unit software and the clutch packs multiple times. Confirm the transmission software is current-specification and test drive extensively at low speeds in traffic before purchase." },
      { heading: "1.4T TSI Timing Chain Tensioner", body: "The EA211 1.4L TSI engine uses a timing chain rather than a belt, but the chain tensioner can wear prematurely, causing a rattle on cold starts. Left unaddressed, a slack chain can jump timing and cause engine damage. Listen carefully for rattling in the first 10–15 seconds after a cold start." },
      { heading: "Water Pump & Thermostat Housing Failure", body: "Like many modern VW/Audi products, the 2016 Jetta's plastic thermostat housing and water pump are failure-prone items, typically around 60,000–80,000 miles. A combined water pump and thermostat service costs $500–800 and is considered preventive maintenance on this platform." },
      { heading: "Door Handle & Lock Actuator Failures", body: "Interior and exterior door handles on the 2016 Jetta break with surprising frequency — the plastic pivot points crack, leaving handles floppy or non-functional. Test every door handle and verify all lock actuators engage smoothly from both key fob and interior buttons." },
    ],
    ctaMake: "Volkswagen", ctaModel: "Jetta",
  },
  {
    slug: "2014-chevrolet-silverado-common-problems",
    year: 2014, make: "Chevrolet", model: "Silverado",
    metaDescription: "2014 Chevrolet Silverado common problems — AFM lifter failure, transmission shudder, and StabiliTrak errors to check before buying.",
    intro: "The 2014 Chevrolet Silverado 1500 is a workhorse truck with a strong following, but the generation-defining 5.3L EcoTec3 engine's Active Fuel Management (AFM) system has produced some of the most discussed reliability concerns in the full-size truck segment.",
    sections: [
      { heading: "AFM Lifter Failure (5.3L & 6.2L V8)", body: "The Active Fuel Management system deactivates cylinders 1, 4, 6, and 7 under light load to improve fuel economy. The DOD/AFM lifters used are significantly less robust than conventional lifters and can collapse or stick, causing a deep engine knock and oil consumption. Repair requires a camshaft and lifter replacement ($2,000–4,000). Many owners disable AFM via a tune or range device as preventive maintenance. Ask whether AFM has been disabled or the truck has been tuned." },
      { heading: "6L80 Transmission Shudder", body: "The 6-speed automatic can develop a torque converter shudder between 40–55 mph under light acceleration. GM's fix involves a transmission fluid change with updated Dexron VI. Test drive on a highway at light throttle specifically in this speed range." },
      { heading: "StabiliTrak / Traction Control False Activations", body: "Many 2014 Silverado owners report the StabiliTrak warning illuminating without an actual fault — often triggered by faulty wheel speed sensors or a weak battery. A scan tool will reveal if any ABS or stability codes are present. This can be a $150 sensor fix or indicate deeper ABS module issues." },
      { heading: "Intake Manifold Gasket Leaks", body: "The intake manifold gaskets on the EcoTec3 5.3L can seep coolant at higher mileage, leading to white smoke from the exhaust or a coolant smell. This is a relatively common service item on these trucks ($400–600 at a shop) and should be factored into negotiations if detected." },
    ],
    ctaMake: "Chevrolet", ctaModel: "Silverado",
  },
];

const PAGE_MAP = Object.fromEntries(CAR_PAGES.map((p) => [p.slug, p]));

export const Route = createFileRoute("/cars/$slug")({
  head: ({ params }) => {
    const page = PAGE_MAP[params.slug];
    if (!page) return {};
    return {
      meta: [
        { title: `${page.year} ${page.make} ${page.model} Common Problems | Idle Check` },
        { name: "description", content: page.metaDescription },
        { property: "og:title", content: `${page.year} ${page.make} ${page.model} Common Problems | Idle Check` },
        { property: "og:description", content: page.metaDescription },
        { property: "og:url", content: `https://idle-check.com/cars/${page.slug}` },
      ],
    };
  },
  loader: ({ params }) => {
    if (!PAGE_MAP[params.slug]) throw notFound();
    return { slug: params.slug };
  },
  component: CarPageComponent,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center text-zinc-500">
      Car page not found.
    </div>
  ),
});

function CarPageComponent() {
  const { slug } = Route.useParams();
  const page = PAGE_MAP[slug]!;

  const ctaUrl = `/?make=${encodeURIComponent(page.ctaMake)}&model=${encodeURIComponent(page.ctaModel)}&year=${page.year}`;

  return (
    <div className="min-h-screen bg-[#f5f4f0]">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 font-condensed text-[11px] uppercase tracking-wider text-zinc-400">
          <Link to="/" className="hover:text-zinc-600">Home</Link>
          <span>/</span>
          <span className="text-zinc-600">{page.year} {page.make} {page.model}</span>
        </nav>

        {/* H1 */}
        <h1 className="font-condensed text-3xl font-bold leading-tight text-zinc-900 sm:text-4xl">
          {page.year} {page.make} {page.model} — Common Problems &amp; What to Check Before Buying
        </h1>

        {/* Intro */}
        <p className="mt-6 text-base leading-relaxed text-zinc-700">{page.intro}</p>

        {/* Sections */}
        <div className="mt-10 space-y-8">
          {page.sections.map((section, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
              <h2 className="font-condensed text-lg font-semibold text-zinc-900">{section.heading}</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-zinc-700">{section.body}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-xl border border-red-100 bg-red-50 p-6 sm:p-8">
          <h2 className="font-condensed text-xl font-bold text-zinc-900">
            Ready to check this exact car before you buy?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            Get a full AI-powered inspection report — issues specific to your vehicle's mileage and condition, a negotiation script, and an estimated repair budget. Takes 60 seconds.
          </p>
          <a
            href={ctaUrl}
            className="mt-5 inline-flex items-center justify-center rounded-lg bg-red-700 px-6 py-3 font-condensed text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-red-600"
          >
            Get Your Inspection Report →
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
