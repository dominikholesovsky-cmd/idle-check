import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Navbar } from "@/components/ghost/Navbar";
import { Footer } from "@/components/ghost/Footer";
import { RecallSection } from "@/components/ghost/RecallSection";
import { fetchRecalls } from "@/lib/api/fetchRecalls";

interface CarPage {
  slug: string;
  year: number;
  make: string;
  model: string;
  metaDescription: string;
  intro: string;
  issues: { heading: string; body: string }[];
}

const CAR_PAGES: CarPage[] = [
  {
    slug: "2018-bmw-330i-common-problems",
    year: 2018, make: "BMW", model: "330i",
    metaDescription: "What to check before buying a 2018 BMW 330i — common B48 engine issues, cooling system wear, and electrical concerns owners report.",
    intro: "The 2018 BMW 330i is powered by BMW's B48 turbocharged four-cylinder, a capable but maintenance-sensitive engine. Before buying, there are a handful of known weak points on this platform that consistently come up in owner communities and independent shop reports.",
    issues: [
      {
        heading: "Engine Oil Consumption & Valve Cover",
        body: "The B48 engine is commonly associated with higher-than-average oil consumption. Owners often report needing to top off oil between scheduled services. The valve cover gasket area is a known leak point on this generation — look for oily residue along the top of the engine and ask for service records showing consistent oil changes.",
      },
      {
        heading: "Cooling System Components",
        body: "BMW's cooling systems on this generation use several plastic components — the thermostat housing and electric water pump are areas that independent mechanics frequently flag on pre-purchase inspections. A pre-purchase cooling system check is worthwhile on any B48-powered vehicle with significant mileage.",
      },
      {
        heading: "Electrical & iDrive Infotainment",
        body: "Some owners of this generation report occasional infotainment reboots and Bluetooth connectivity issues. These are generally software-related. If the car is equipped with driver assistance features, verify all sensors and cameras are active — ADAS components can be expensive to replace or recalibrate after a minor collision.",
      },
    ],
  },
  {
    slug: "2015-toyota-camry-common-problems",
    year: 2015, make: "Toyota", model: "Camry",
    metaDescription: "What to check before buying a 2015 Toyota Camry — oil consumption concerns on 4-cylinder models, transmission behavior, and paint to inspect.",
    intro: "The 2015 Toyota Camry is one of the most dependable used midsize sedans available, but buyers should be aware of a few recurring concerns on this generation — particularly on 2.5L four-cylinder models — that show up consistently in owner communities.",
    issues: [
      {
        heading: "2.5L Engine Oil Consumption",
        body: "The 2.5L four-cylinder in this generation of Camry is commonly associated with higher-than-expected oil consumption. Toyota issued technical service bulletins related to this concern. Before purchasing, check the oil level on the dipstick and ask whether the seller has needed to add oil between changes. Consistent oil changes with documented intervals are a good sign.",
      },
      {
        heading: "Automatic Transmission Shudder",
        body: "Some 2015 Camry owners report a shudder or vibration from the automatic transmission, most noticeable during light acceleration at moderate speeds. This is often related to transmission fluid condition. During your test drive, pay particular attention to smooth shifts through all gears — a recent transmission fluid service is a good sign.",
      },
      {
        heading: "Paint & Clear Coat",
        body: "The exterior paint on this generation — particularly lighter colors — can be prone to clear coat degradation over time. Inspect the roof, hood, and trunk lid carefully in direct light. This is a cosmetic issue but can be costly to address and is worth factoring into your negotiation.",
      },
    ],
  },
  {
    slug: "2017-honda-civic-common-problems",
    year: 2017, make: "Honda", model: "Civic",
    metaDescription: "What to check before buying a 2017 Honda Civic — 1.5T oil dilution, CVT behavior, and AC compressor issues owners commonly report.",
    intro: "The 2017 Honda Civic (10th generation) is a highly regarded compact that earned praise for driving dynamics and efficiency, but the new 1.5T turbocharged engine and CVT transmission introduced in this generation brought some concerns that buyers should verify before purchasing.",
    issues: [
      {
        heading: "1.5T Engine Oil Dilution in Cold Climates",
        body: "The 1.5L turbocharged engine in this generation is widely associated with gasoline mixing into the engine oil, particularly in colder climates and with short-trip driving patterns. This can cause the oil to appear overfull and smell of fuel. Honda issued updated ECU calibrations to address this, but it remains a known concern. Check oil level and condition before purchase.",
      },
      {
        heading: "CVT Transmission Behavior",
        body: "The CVT paired with the 1.5T can exhibit shudder or hesitation, particularly at low speeds or during light-throttle acceleration. Testing on a highway on-ramp and in slow-moving traffic will help you evaluate the transmission's behavior. A smooth, seamless feel throughout the power range is what to look for.",
      },
      {
        heading: "Air Conditioning Compressor",
        body: "The AC compressor on 10th-generation Civics is a component that independent mechanics flag more frequently than average for this class. Always verify that the AC produces cold air promptly when tested, and listen for any belt-area noise when the AC is engaged.",
      },
    ],
  },
  {
    slug: "2016-ford-f150-common-problems",
    year: 2016, make: "Ford", model: "F-150",
    metaDescription: "What to check before buying a 2016 Ford F-150 — EcoBoost carbon buildup, transmission shudder, and known weak points to inspect.",
    intro: "The 2016 Ford F-150 with aluminum body construction is a capable and popular truck, but the EcoBoost turbocharged engines used in this generation come with known maintenance considerations that are important to understand before buying.",
    issues: [
      {
        heading: "EcoBoost Intake Valve Carbon Buildup",
        body: "The 2.7L and 3.5L EcoBoost engines use direct injection, which does not wash the intake valves with fuel. Over time, carbon deposits build up on the intake valves, which can cause rough idle, misfires, or reduced power. This is a known characteristic of direct-injection engines generally — asking about mileage and whether any carbon cleaning service has been performed is worthwhile.",
      },
      {
        heading: "Automatic Transmission Shudder",
        body: "The 6-speed automatic in this generation F-150 is commonly associated with a torque converter shudder, most noticeable at highway speeds under light acceleration. This is a well-documented concern across this platform. A test drive on the highway with light throttle between 40–55 mph is the best way to evaluate this.",
      },
      {
        heading: "Tailgate & Accessory Hardware",
        body: "Tailgate latches and associated cable mechanisms are a frequently reported wear item on this generation. Test the tailgate manually — it should operate smoothly and latch securely. Also verify that any installed accessories (backup camera, trailer wiring, running boards) are fully functional.",
      },
    ],
  },
  {
    slug: "2014-nissan-altima-common-problems",
    year: 2014, make: "Nissan", model: "Altima",
    metaDescription: "What to check before buying a 2014 Nissan Altima — CVT reliability, power steering leaks, and common issues to inspect before purchase.",
    intro: "The 2014 Nissan Altima is a widely available used sedan, but its CVT transmission has a well-documented reputation in this generation that makes a thorough pre-purchase inspection especially important.",
    issues: [
      {
        heading: "CVT Transmission — The Most Important Thing to Check",
        body: "The CVT used in this generation of Altima is widely regarded as one of the more problematic transmissions of its era, and owner communities discuss failure rates frequently. Symptoms to watch for include shudder or juddering from a stop, a shaking sensation during acceleration, hesitation, or unusual noise. A smooth, vibration-free experience during a comprehensive test drive — including city traffic, highway, and full acceleration — is essential. Have an independent mechanic evaluate the transmission before any purchase.",
      },
      {
        heading: "Power Steering System",
        body: "The 2.5L Altima uses hydraulic power steering, and owners commonly report seeping or leaking around the hoses and rack assembly on older examples. Inspect underneath the vehicle near the steering rack for any fluid residue. Check steering feel during the test drive for any unusual play or effort.",
      },
      {
        heading: "Sunroof Drains & Interior Water Intrusion",
        body: "If equipped with a sunroof, the drain tubes can become clogged with debris over time, leading to water pooling inside the cabin. Signs include musty odors, damp carpet near the front pillars, or water stains on interior trim. This is worth checking on any used Altima with a sunroof.",
      },
    ],
  },
  {
    slug: "2018-subaru-outback-common-problems",
    year: 2018, make: "Subaru", model: "Outback",
    metaDescription: "What to check before buying a 2018 Subaru Outback — oil consumption, CVT behavior, and EyeSight camera issues owners report.",
    intro: "The 2018 Subaru Outback offers genuine all-wheel-drive capability and a loyal owner base, but Subaru's horizontally-opposed engines and the Lineartronic CVT have known concerns that pre-purchase buyers should check.",
    issues: [
      {
        heading: "Engine Oil Consumption",
        body: "Subaru's FA-series boxer engines from this era are associated with oil consumption between changes in some vehicles. Owners in forums commonly report needing to add oil before the next scheduled service. Check the dipstick before the test drive and ask the seller how often they add oil. Consistent, documented oil changes are a positive indicator.",
      },
      {
        heading: "Lineartronic CVT Behavior",
        body: "The CVT in the 2018 Outback can exhibit shudder during low-speed acceleration on higher-mileage examples. Subaru updated fluid specifications and released software updates related to this. Test drive in stop-and-go conditions and assess for any vibration or hesitation from a stop.",
      },
      {
        heading: "EyeSight Camera System",
        body: "The dual-camera EyeSight system is mounted inside the windshield and is sensitive to fogging, physical damage, and miscalibration from windshield replacements. A malfunctioning EyeSight system will display a warning on the dashboard and disable adaptive cruise and collision braking. Verify all EyeSight features are active before purchase — any replacement or recalibration history is worth asking about.",
      },
    ],
  },
  {
    slug: "2015-jeep-grand-cherokee-common-problems",
    year: 2015, make: "Jeep", model: "Grand Cherokee",
    metaDescription: "What to check before buying a 2015 Jeep Grand Cherokee — TIPM electrical issues, air suspension, and transmission concerns to inspect.",
    intro: "The 2015 Jeep Grand Cherokee is a capable and well-equipped SUV, but this generation has some well-known electrical and mechanical concerns that buyers encounter more frequently than average.",
    issues: [
      {
        heading: "TIPM Electrical Module",
        body: "The Totally Integrated Power Module (TIPM) is a known weak point on this generation of Grand Cherokee and other Chrysler vehicles of the same era. It controls many vehicle electrical functions, and failures can manifest as unexplained behavior — stalling, fuel pump running after shutdown, or random warning lights. If the vehicle exhibits any unexplained electrical behavior during your test or walk-around, this is the first thing an independent mechanic should evaluate.",
      },
      {
        heading: "Air Suspension (If Equipped)",
        body: "Models with Quadra-Lift air suspension can develop compressor and air bag wear over time. The vehicle should sit level and raise and lower smoothly through all ride-height settings. Any sagging, slow response, or warning lights related to the suspension system warrant further investigation before purchase.",
      },
      {
        heading: "Transfer Case & Drivetrain Seals",
        body: "On higher-mileage examples, it is common to find seeping transfer case or differential seals — inspect underneath the vehicle for any reddish-brown fluid near the center or front axle areas. This is a serviceable issue but worth noting in any negotiation.",
      },
    ],
  },
  {
    slug: "2017-mazda-cx5-common-problems",
    year: 2017, make: "Mazda", model: "CX-5",
    metaDescription: "What to check before buying a 2017 Mazda CX-5 — SKYACTIV engine cold start behavior, i-ACTIVSENSE calibration, and things to inspect.",
    intro: "The 2017 Mazda CX-5 is consistently ranked among the most reliable compact SUVs of its generation, with notably fewer reported issues than most competitors. That said, there are a few things worth verifying on any used example.",
    issues: [
      {
        heading: "SKYACTIV Engine Cold Start Behavior",
        body: "Some owners of 2.0L and 2.5L SKYACTIV-G engines report a light ticking or tapping noise on cold starts that fades once the engine warms. This is generally considered a characteristic of the high-compression engine design rather than a defect, but it is worth listening for during a cold start before the test drive. Any persistent noise when warm deserves further investigation.",
      },
      {
        heading: "i-ACTIVSENSE After Windshield Work",
        body: "The forward-facing camera for Mazda's i-ACTIVSENSE safety systems is mounted behind the windshield. If the windshield has ever been replaced, professional ADAS recalibration is required. Ask about any windshield replacement history and verify all safety features — forward collision warning and lane departure — are active and functioning.",
      },
      {
        heading: "General Inspection Points",
        body: "The 2017 CX-5 is generally a low-drama used purchase. Standard checks — brakes, tires, all electronics, sunroof operation if equipped — apply. The paint on this generation can be prone to chipping on the hood and front bumper from road debris, so inspect leading edges in good light for rust-prone chips.",
      },
    ],
  },
  {
    slug: "2016-volkswagen-jetta-common-problems",
    year: 2016, make: "Volkswagen", model: "Jetta",
    metaDescription: "What to check before buying a 2016 Volkswagen Jetta — DSG transmission shudder, TSI engine timing chain, and common wear items to verify.",
    intro: "The 2016 Volkswagen Jetta offers a polished driving experience at an accessible used-car price point, but the DSG dual-clutch transmission and TSI engines on this generation have known concerns that buyers frequently encounter.",
    issues: [
      {
        heading: "DSG Dual-Clutch Transmission (If Equipped)",
        body: "The 7-speed dry-clutch DSG is the most widely discussed component concern on this generation of Jetta. Low-speed shudder, hesitation from a stop, and rough engagement at parking lot speeds are common owner complaints. VW has released multiple software updates for the transmission control module. Test drive extensively in slow stop-and-go traffic — the behavior should be smooth and confident, not jerky or hesitant.",
      },
      {
        heading: "TSI Engine Timing Chain",
        body: "The TSI engines in this generation use a timing chain rather than a belt, but the chain tensioner is associated with premature wear on some examples. Listen for a rattling or chattering sound in the first 10–15 seconds after a cold start, which can indicate chain slack. A rattle that clears quickly is often low oil pressure; one that persists warrants further investigation.",
      },
      {
        heading: "Cooling System & Door Hardware",
        body: "Like many European vehicles of this era, plastic cooling system components — thermostat housings, water pumps — are serviceable items that independent mechanics recommend checking at higher mileage. Also test every door handle; exterior and interior handles on this generation are a commonly replaced wear item.",
      },
    ],
  },
  {
    slug: "2014-chevrolet-silverado-common-problems",
    year: 2014, make: "Chevrolet", model: "Silverado",
    metaDescription: "What to check before buying a 2014 Chevrolet Silverado — AFM lifter concerns on 5.3L, transmission shudder, and StabiliTrak issues to inspect.",
    intro: "The 2014 Chevrolet Silverado 1500 is a capable full-size truck and one of the most common used vehicles on the market. The EcoTec3 5.3L V8's Active Fuel Management system, however, is the subject of significant ongoing discussion in the owner and mechanic community.",
    issues: [
      {
        heading: "5.3L Active Fuel Management (AFM) Lifters",
        body: "The Active Fuel Management system — which deactivates cylinders under light load — uses specialized lifters that are widely discussed as a weak point on this platform compared to conventional lifters. Owners and mechanics on forums frequently report AFM-related failures, typically involving a deep knocking sound and oil consumption. Many owners proactively disable AFM via a tune or aftermarket device. Ask whether AFM has been disabled, and listen carefully for any abnormal engine knock at idle or under light acceleration.",
      },
      {
        heading: "Automatic Transmission Shudder",
        body: "The 6-speed automatic is associated with a torque converter shudder — most noticeable as a vibration or shaking sensation at moderate highway speeds under light throttle. This is a commonly reported concern on this platform. A comprehensive highway test drive specifically evaluating smooth operation through the 40–55 mph range is recommended.",
      },
      {
        heading: "StabiliTrak / Traction Control Warning Lights",
        body: "StabiliTrak warning illumination without an apparent cause is a frequently reported complaint on this generation. It can be triggered by wheel speed sensor wear, ABS module issues, or even a weak battery. A pre-purchase OBD-II scan to check for any stored or active fault codes is a simple and worthwhile step.",
      },
    ],
  },
];

const PAGE_MAP = Object.fromEntries(CAR_PAGES.map((p) => [p.slug, p]));

export const Route = createFileRoute("/cars/$slug")({
  head: ({ params }) => {
    const page = PAGE_MAP[params.slug];
    if (!page) return {};
    return {
      meta: [
        { title: `${page.year} ${page.make} ${page.model} — What to Check Before Buying | Idle Check` },
        { name: "description", content: page.metaDescription },
        { property: "og:title", content: `${page.year} ${page.make} ${page.model} — What to Check Before Buying | Idle Check` },
        { property: "og:description", content: page.metaDescription },
        { property: "og:url", content: `https://idle-check.com/cars/${params.slug}` },
        { property: "og:image", content: "https://idle-check.com/og-image.png" },
      ],
    };
  },
  loader: async ({ params }) => {
    const page = PAGE_MAP[params.slug];
    if (!page) return { slug: params.slug, recalls: [], recallSource: "none" };
    const result = await fetchRecalls({
      data: { make: page.make, model: page.model, year: page.year },
    });
    return { slug: params.slug, recalls: result.recalls, recallSource: result.source };
  },
  component: CarPageComponent,
});

function CarPageComponent() {
  const { slug } = Route.useParams();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loaderData = Route.useLoaderData() as any;
  const recalls: import("@/lib/ghost/types").Recall[] = loaderData?.recalls ?? [];
  const recallSource: string = loaderData?.recallSource ?? "none";
  const page = PAGE_MAP[slug]!;

  const ctaUrl = `/?make=${encodeURIComponent(page.make)}&model=${encodeURIComponent(page.model)}&year=${page.year}`;

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
          {page.year} {page.make} {page.model} — What to Check Before You Buy
        </h1>

        {/* Intro */}
        <p className="mt-6 text-base leading-relaxed text-zinc-700">{page.intro}</p>

        {/* Issue sections */}
        <div className="mt-8 space-y-5">
          {page.issues.map((issue, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
              <h2 className="font-condensed text-base font-semibold text-zinc-900">{issue.heading}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-zinc-700">{issue.body}</p>
            </div>
          ))}
        </div>

        {/* NHTSA Recalls */}
        {recalls.length > 0 ? (
          <RecallSection recalls={recalls} />
        ) : (
          <div className="mt-8 rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
            <h2 className="font-condensed text-sm font-semibold uppercase tracking-[0.14em] text-zinc-900">
              Official Recall Records
            </h2>
            <p className="mt-2 text-[13px] text-zinc-500">
              {recallSource === "none"
                ? "No active NHTSA recalls found for this make, model, and year. Always verify at nhtsa.gov before purchase."
                : "Loading recall data…"}
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-10 rounded-xl border border-red-100 bg-red-50 p-6 sm:p-8">
          <h2 className="font-condensed text-xl font-bold text-zinc-900">
            Run a full inspection report on this exact car
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            Get a personalized AI report based on your specific vehicle — flagged issues by mileage and condition, an estimated repair budget, and a negotiation script. Takes about 60 seconds.
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
