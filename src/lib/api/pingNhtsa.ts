import { createServerFn } from "@tanstack/react-start";

export const pingNhtsa = createServerFn({ method: "GET" }).handler(async () => {
  const start = Date.now();
  try {
    const res = await fetch(
      "https://api.nhtsa.gov/recalls/recallsByVehicle?make=HONDA&model=CIVIC&modelYear=2020",
      { signal: AbortSignal.timeout(5000) },
    );
    const latency = Date.now() - start;
    if (!res.ok) return { ok: false as const, latency };
    const json = await res.json();
    return {
      ok: true as const,
      latency,
      sampleCount: Array.isArray(json?.results) ? json.results.length : 0,
    };
  } catch {
    return { ok: false as const, latency: Date.now() - start };
  }
});
