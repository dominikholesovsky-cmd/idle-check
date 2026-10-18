import { useEffect, useRef, useState, type ReactNode } from "react";
import { AlertCircle, ChevronDown } from "lucide-react";
import { PRICE_USD } from "@/lib/ghost/constants";
import type { Issue, Vehicle } from "@/lib/ghost/types";

const PRICE = `$${PRICE_USD.toFixed(2)}`;

const ADDS: { title: string; body: string; icon: ReactNode }[] = [
  {
    title: "Model-specific findings",
    body: "Known weak points for your exact year and engine, each with a cost range and part numbers.",
    icon: (
      <>
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h4" />
      </>
    ),
  },
  {
    title: "Seller red flags",
    body: "What the listing says, and what it carefully avoids saying.",
    icon: (
      <>
        <path d="M5 21V4" />
        <path d="M5 4h11l-2 4 2 4H5" />
      </>
    ),
  },
  {
    title: "Verdict, market value, recalls",
    body: "Buy, negotiate or walk away, plus a price check and open NHTSA recalls.",
    icon: (
      <>
        <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
  },
  {
    title: "Negotiation script",
    body: "A ready-to-send message with a suggested cash offer. It updates as you tick items.",
    icon: <path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.4A8 8 0 1 1 21 12z" />,
  },
  {
    title: "PDF and shareable link",
    body: "A printable inspection checklist to bring to the seller.",
    icon: (
      <>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5" />
        <path d="M12 11v6m-3-3 3 3 3-3" />
      </>
    ),
  },
];

const PANEL_BULLETS = [
  "Findings with cost ranges and part numbers",
  "Seller red flags, verdict and market value",
  "Negotiation script, PDF and shareable link",
];

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";
const UNLOCK_BTN = `flex items-center justify-center gap-2 rounded-field bg-primary font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70 ${FOCUS}`;

function SeverityPill({ severity }: { severity: Issue["severity"] }) {
  const cls =
    severity === "HIGH"
      ? "bg-sev-high text-sev-high-fg"
      : severity === "MED"
      ? "bg-sev-med text-sev-med-fg"
      : "bg-sev-low text-sev-low-fg";
  return (
    <span
      className={`inline-flex h-[22px] items-center rounded px-2 font-condensed text-xs font-bold tracking-[0.08em] lg:h-6 lg:px-[9px] lg:text-[13px] ${cls}`}
    >
      {severity}
    </span>
  );
}

function LockIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      className="shrink-0 text-primary"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function CardIcon({ size }: { size: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="h-5 w-5 animate-spin rounded-full border-[3px] border-white/40 border-t-white motion-reduce:animate-none"
    />
  );
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isDesktop;
}

function FindingBody({ issue, clamp }: { issue: Issue; clamp: boolean }) {
  return (
    <>
      <div className="flex items-center gap-2 lg:gap-2.5">
        <SeverityPill severity={issue.severity} />
        <span className="text-xs uppercase tracking-[0.06em] text-muted-text lg:text-[13px]">
          {issue.category}
        </span>
      </div>
      <div className="mt-2 flex items-start justify-between gap-3 lg:mt-2.5">
        <h3 className="text-[17px] font-semibold leading-tight lg:text-xl">{issue.label}</h3>
        {clamp && <ChevronDown aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-muted-text transition-transform group-aria-expanded:rotate-180 motion-reduce:transition-none" />}
      </div>
      <p
        className={`mt-1 text-sm leading-[1.45] text-muted-text lg:mt-1.5 lg:max-w-[640px] lg:text-[15px] lg:leading-normal ${
          clamp ? "group-aria-expanded:line-clamp-none line-clamp-2" : ""
        }`}
      >
        {issue.explanation}
      </p>
    </>
  );
}

export function FreePreviewView({
  vehicle,
  issues,
  onUnlock,
  paymentError,
  askingPrice,
  marketplace,
}: {
  vehicle: Vehicle;
  issues: Issue[];
  onUnlock: () => void | Promise<void>;
  paymentError?: string | null;
  askingPrice: number;
  marketplace?: string;
}) {
  const free = issues.slice(0, 3);
  const isDesktop = useIsDesktop();
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [opening, setOpening] = useState(false);
  const [cardVisible, setCardVisible] = useState(false);
  const cardRef = useRef<HTMLElement>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false); // synchronous guard; state alone lags behind rapid clicks

  const yearStr = vehicle.year ? `${vehicle.year} ` : "";
  const name = `${yearStr}${vehicle.make} ${vehicle.model}`.trim();
  const showMarketplace = !!marketplace && marketplace.trim().toLowerCase() !== "the listing";
  const meta = [
    vehicle.mileage ? `${vehicle.mileage.toLocaleString("en-US")} mi` : null,
    showMarketplace ? marketplace : null,
  ]
    .filter(Boolean)
    .join(" · ");

  // Hide the mobile bottom bar while the in-page unlock card is on screen
  useEffect(() => {
    const el = cardRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(([entry]) => setCardVisible(entry.isIntersecting));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // A payment error re-enables the button
  useEffect(() => {
    if (paymentError) {
      inFlight.current = false;
      setOpening(false);
    }
  }, [paymentError]);

  useEffect(() => () => { if (resetTimer.current) clearTimeout(resetTimer.current); }, []);

  const handleUnlock = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setOpening(true);
    try {
      await onUnlock();
    } catch {
      // handled by the parent via paymentError
    }
    // A successful checkout navigates away and unloads this page. If we are still here
    // a moment later, nothing happened, so let the user try again.
    resetTimer.current = setTimeout(() => {
      inFlight.current = false;
      setOpening(false);
    }, 3000);
  };

  const toggle = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const errorBanner = paymentError ? (
    <div
      role="alert"
      className="mb-3 flex items-start gap-2.5 rounded-xl border border-primary-tint-border bg-primary-tint px-3.5 py-3 text-sm text-primary-ink"
    >
      <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      {paymentError}
    </div>
  ) : null;

  const buttonLabel = opening ? (
    <>
      <Spinner />
      Opening checkout…
    </>
  ) : (
    <>
      <CardIcon size={20} />
      Unlock full report
    </>
  );

  return (
    <section
      className="relative z-10 min-h-screen text-ink"
      style={{
        backgroundColor: "#f5f4f0",
        backgroundImage: "radial-gradient(circle, #c8c4bc 0.8px, transparent 0.8px)",
        backgroundSize: "20px 20px",
      }}
    >
      <div className="mx-auto max-w-[1120px] px-4 pb-32 pt-3 lg:px-6 lg:pb-12 lg:pt-8">
        {/* Hero */}
        <div className="rounded-card-sm border border-card-border bg-white p-5 lg:flex lg:flex-wrap lg:items-center lg:gap-8 lg:p-10">
          <div className="min-w-0 lg:flex-1 lg:basis-[420px]">
            <span className="inline-flex h-7 items-center rounded-full border border-card-border bg-chip px-3 font-condensed text-[13px] font-bold uppercase tracking-[0.12em] text-primary">
              Free preview
            </span>
            <h1 className="mt-3.5 font-condensed text-[30px] font-bold uppercase leading-none tracking-[0.01em] lg:mt-4 lg:text-[52px]">
              {name}
            </h1>
            {meta && (
              <p className="mt-2 font-mono text-[13px] text-muted-text lg:mt-3 lg:text-[15px]">{meta}</p>
            )}
          </div>

          <dl className="mt-[18px] grid grid-cols-3 gap-3 border-t border-card-border pt-4 lg:mt-0 lg:w-[400px] lg:gap-0 lg:overflow-hidden lg:rounded-xl lg:border lg:bg-page lg:pt-0">
            <div className="lg:px-5 lg:py-[18px]">
              <dt className="font-condensed text-xs font-semibold uppercase tracking-[0.1em] text-muted-text lg:text-[13px]">Asking</dt>
              <dd className="mt-1.5 font-mono text-base font-bold lg:mt-2 lg:text-lg">
                ${askingPrice.toLocaleString("en-US")}
              </dd>
            </div>
            {["Verdict", "Repairs"].map((label) => (
              <div key={label} className="lg:border-l lg:border-card-border lg:px-5 lg:py-[18px]">
                <dt className="font-condensed text-xs font-semibold uppercase tracking-[0.1em] text-muted-text lg:text-[13px]">{label}</dt>
                <dd className="mt-1.5 flex items-center gap-1.5 text-[15px] font-semibold text-text-2 lg:mt-2 lg:text-base">
                  <LockIcon />
                  Locked
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-5 lg:mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(340px,400px)] lg:items-start lg:gap-8">
          <div className="min-w-0">
            {/* Free findings */}
            <div className="mb-2.5 flex items-baseline justify-between gap-4 lg:mb-3">
              <h2 className="font-condensed text-[15px] font-bold uppercase tracking-[0.12em] lg:text-[17px]">
                Free findings
              </h2>
              <span className="text-[13px] text-muted-text lg:hidden">Tap to expand</span>
              <span className="hidden text-sm text-muted-text lg:inline">Included, no payment needed</span>
            </div>
            <ul className="overflow-hidden rounded-xl border border-card-border bg-white">
              {free.map((issue) => {
                const open = openIds.has(issue.id);
                return (
                  <li key={issue.id} className="border-b border-card-border last:border-b-0">
                    {isDesktop ? (
                      <div className="px-6 py-5">
                        <FindingBody issue={issue} clamp={false} />
                      </div>
                    ) : (
                      <button
                        type="button"
                        aria-expanded={open}
                        onClick={() => toggle(issue.id)}
                        className={`group block min-h-[44px] w-full px-4 py-3.5 text-left ${FOCUS} focus-visible:ring-inset focus-visible:ring-offset-0`}
                      >
                        <FindingBody issue={issue} clamp />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* What the full report adds */}
            <h2 className="mb-2.5 mt-6 font-condensed text-[15px] font-bold uppercase tracking-[0.12em] lg:mb-3 lg:mt-10 lg:text-[17px]">
              What the full report adds
            </h2>
            <ul className="overflow-hidden rounded-xl border border-card-border bg-white">
              {ADDS.map((item) => (
                <li
                  key={item.title}
                  className="flex gap-3.5 border-b border-card-border px-4 py-3.5 last:border-b-0 lg:gap-4 lg:px-6 lg:py-5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-card-border bg-page text-primary lg:h-11 lg:w-11">
                    <svg
                      aria-hidden="true"
                      className="h-5 w-5 lg:h-[22px] lg:w-[22px]"
                      viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    >
                      {item.icon}
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[17px] font-semibold leading-tight lg:text-lg">{item.title}</h3>
                    <p className="mt-1 text-sm leading-[1.45] text-muted-text lg:text-[15px] lg:leading-normal">{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Unlock panel: in-page card on mobile, sticky panel on desktop */}
          <aside
            ref={cardRef}
            aria-label="Unlock the full report"
            className="mt-5 rounded-card-sm border-2 border-primary bg-white p-5 lg:sticky lg:top-6 lg:mt-0 lg:p-7"
          >
            <span className="hidden h-7 items-center rounded-full border border-card-border bg-chip px-3 font-condensed text-[13px] font-bold uppercase tracking-[0.12em] text-primary lg:inline-flex">
              Full report
            </span>
            <h2 className="font-condensed text-[28px] font-bold uppercase leading-none tracking-[0.01em] lg:mt-3.5 lg:text-[30px]">
              Unlock the full report
            </h2>
            <div className="mt-3.5 flex items-baseline gap-2.5 lg:mt-4">
              <span className="font-mono text-5xl font-bold leading-none lg:text-[56px]">{PRICE}</span>
              <span className="text-sm text-muted-text lg:text-[15px]">one-time</span>
            </div>
            <p className="mt-2 text-sm leading-[1.45] text-muted-text lg:text-[15px]">
              No subscription. Works for this listing only.
            </p>
            <ul className="mt-5 hidden flex-col gap-2.5 lg:flex">
              {PANEL_BULLETS.map((b) => (
                <li key={b} className="flex gap-2.5 text-[15px] leading-[1.4] text-text-2">
                  <svg
                    aria-hidden="true"
                    className="mt-px shrink-0 text-primary"
                    width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <path d="m5 12 5 5 9-10" />
                  </svg>
                  {b}
                </li>
              ))}
            </ul>
            <div className="mt-4 lg:mt-6">
              {errorBanner}
              <button
                type="button"
                onClick={handleUnlock}
                disabled={opening}
                aria-busy={opening}
                className={`${UNLOCK_BTN} h-14 w-full text-[17px]`}
              >
                {buttonLabel}
              </button>
            </div>
            <p className="mt-3 text-center text-[13px] text-muted-text">
              Credit card · Apple Pay · Google Pay. No account needed.
            </p>
          </aside>
        </div>
      </div>

      {/* Mobile bottom bar. Hidden while the in-page card is visible, so only one button shows. */}
      {!cardVisible && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-card-border bg-white px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 lg:hidden">
          {paymentError && (
            <p className="mb-2 flex items-start gap-2 text-[13px] text-primary-ink">
              <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              {paymentError}
            </p>
          )}
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-mono text-[22px] font-bold leading-none">{PRICE}</div>
              <div className="mt-[3px] text-[13px] text-muted-text">one-time, this listing</div>
            </div>
            <button
              type="button"
              onClick={handleUnlock}
              disabled={opening}
              aria-busy={opening}
              className={`${UNLOCK_BTN} h-[52px] px-5 text-base`}
            >
              {opening ? (
                <>
                  <Spinner />
                  Opening checkout…
                </>
              ) : (
                <>
                  <CardIcon size={18} />
                  Unlock full report
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
