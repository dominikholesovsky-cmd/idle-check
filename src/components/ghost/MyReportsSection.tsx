import { useEffect, useRef, useState, type FormEvent } from "react";
import { Check, FolderOpen } from "lucide-react";
import { getAccessToken, useAccount } from "@/lib/account";
import { listMyReports, type MyReportRow } from "@/lib/api/listMyReports";
import { PRICE_USD } from "@/lib/ghost/constants";
import type { AnalysisState } from "@/routes/index";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMIT_MESSAGE = "Please wait a minute before requesting another link.";

const LABEL = "block font-condensed text-[13px] font-semibold uppercase tracking-[0.08em] text-text-2";
const ROW_LINK =
  "inline-flex min-h-[44px] items-center rounded text-[15px] font-semibold text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
const PILL =
  "inline-flex h-[22px] items-center whitespace-nowrap rounded px-2 font-condensed text-xs font-bold tracking-[0.08em]";

const VERDICT_PILL: Record<string, { label: string; className: string }> = {
  negotiate: { label: "NEGOTIATE", className: "bg-sev-med text-sev-med-fg" },
  walkaway: { label: "WALK AWAY", className: "bg-sev-high text-sev-high-fg" },
  buy: { label: "BUY", className: "bg-success-bg text-success" },
};

function shortDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function vehicleName(e: AnalysisState): string {
  const v = e.vehicle;
  return `${v.year ?? ""} ${v.make} ${v.model}`.trim();
}

function entryMeta(e: AnalysisState): string {
  if (!e.unlocked) return `${shortDate(e.timestamp)} · 3 free findings`;
  return `${shortDate(e.timestamp)} · Asking $${e.askingPrice.toLocaleString("en-US")}`;
}

interface ListRow {
  key: string;
  name: string;
  meta: string;
  unlocked: boolean;
  verdict: string | null;
  ts: number;
  actionLabel: string;
  run: () => void;
}

function StatusPill({ unlocked }: { unlocked: boolean }) {
  return unlocked ? (
    <span className={`${PILL} bg-success-bg text-success`}>FULL REPORT</span>
  ) : (
    <span className={`${PILL} bg-input-border text-text-2`}>PREVIEW</span>
  );
}

// "My reports": the same place for signed-out, link-sent and signed-in. The device-local history lives here
// too (it replaces the old "Recent reports" list). Only the account hook decides between the states.
export function MyReportsSection({
  history,
  onOpen,
}: {
  history: AnalysisState[];
  onOpen: (entry: AnalysisState) => void;
}) {
  const account = useAccount();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  // Server-saved (paid) reports for the signed-in email. Previews and unsaved reports come from this device.
  const [saved, setSaved] = useState<MyReportRow[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const signedIn = account.status === "signed-in";
  useEffect(() => {
    if (!signedIn) {
      setSaved(null);
      setLoadFailed(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const accessToken = await getAccessToken();
        if (!accessToken) throw new Error("no session");
        const rows = await listMyReports({ data: { accessToken } });
        if (!cancelled) { setSaved(rows); setLoadFailed(false); }
      } catch {
        if (!cancelled) setLoadFailed(true);
      }
    })();
    return () => { cancelled = true; };
  }, [signedIn, account.email]);

  const send = async (address: string) => {
    setError(null);
    setSending(true);
    try {
      await account.requestLink(address);
      if (mounted.current) setSentTo(address);
    } catch (err) {
      if (mounted.current) setError(err instanceof Error ? err.message : RATE_LIMIT_MESSAGE);
    } finally {
      if (mounted.current) setSending(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!EMAIL_RE.test(clean)) {
      setError("Enter a valid email address.");
      return;
    }
    void send(clean);
  };

  const card = "rounded-card border border-card-border bg-white p-[18px] lg:rounded-[20px] lg:px-7 lg:py-6";
  const entries = history.slice(0, 10);

  // 3. Signed in: the list
  if (account.status === "signed-in") {
    const initial = (account.email ?? "?").charAt(0).toUpperCase();
    const savedIds = new Set((saved ?? []).map((r) => r.id));
    const rows: ListRow[] = [
      ...(saved ?? []).map((r): ListRow => ({
        key: `s-${r.id}`,
        name: r.vehicleLabel,
        meta: `${r.mileage ? `${r.mileage.toLocaleString("en-US")} mi · ` : ""}${r.askingPrice != null ? `Asking $${r.askingPrice.toLocaleString("en-US")}` : ""}`.replace(/ · $/, ""),
        unlocked: true,
        verdict: r.verdict,
        ts: new Date(r.createdAt).getTime(),
        actionLabel: "Open",
        run: () => { window.location.assign(`/report/${r.id}?from=my-reports`); },
      })),
      ...history
        .filter((e) => !e.unlocked || !e.shareId || !savedIds.has(e.shareId))
        .map((e): ListRow => ({
          key: `l-${e.reportId}`,
          name: vehicleName(e),
          meta: e.unlocked
            ? `${e.vehicle.mileage ? `${e.vehicle.mileage.toLocaleString("en-US")} mi · ` : ""}Asking $${e.askingPrice.toLocaleString("en-US")}`
            : "3 free findings · not unlocked",
          unlocked: e.unlocked,
          verdict: e.unlocked ? (e.recommendation?.verdict ?? null) : null,
          ts: e.timestamp,
          actionLabel: e.unlocked ? "Open" : `Unlock $${PRICE_USD.toFixed(2)}`,
          run: () => onOpen(e),
        })),
    ].sort((a, b) => b.ts - a.ts);

    return (
      <section id="my-reports" aria-label="Your reports" className={`${card} mt-4 scroll-mt-20 lg:mt-6`}>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-panel text-primary">
              <FolderOpen className="h-[22px] w-[22px]" />
            </span>
            <h2 className="text-[21px] font-bold">Your reports</h2>
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-chip px-2 font-mono text-[13px] font-bold">
              {rows.length}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex min-w-0 items-center gap-2 text-sm text-text-2">
              <span aria-hidden="true" className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary font-condensed text-sm font-bold text-white">
                {initial}
              </span>
              <span className="truncate">{account.email}</span>
            </span>
            <button type="button" onClick={() => void account.signOut()} className={ROW_LINK}>
              Sign out
            </button>
          </div>
        </div>
        {loadFailed && (
          <p role="alert" className="mt-3 text-[13px] font-semibold text-primary-ink">
            Could not load your saved reports. Reload the page to try again.
          </p>
        )}
        {rows.length === 0 && saved !== null ? (
          <p className="mt-4 text-[15px] text-muted-text">No reports yet. Run a check above and it will show up here.</p>
        ) : (
          <ul className="mt-3">
            {rows.map((row) => {
              const verdict = row.unlocked && row.verdict ? VERDICT_PILL[row.verdict] : undefined;
              return (
                <li
                  key={row.key}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-card-border py-2.5 lg:flex-nowrap"
                >
                  <div className="min-w-0 basis-full lg:basis-auto lg:flex-1">
                    <div className="text-base font-semibold">{row.name}</div>
                    <div className="font-mono text-xs text-muted-text">{row.meta}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill unlocked={row.unlocked} />
                    {verdict && <span className={`${PILL} ${verdict.className}`}>{verdict.label}</span>}
                  </div>
                  <span className="font-mono text-xs text-muted-text">{shortDate(row.ts)}</span>
                  <div className="ml-auto">
                    <button type="button" onClick={row.run} className={ROW_LINK}>
                      {row.actionLabel}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    );
  }

  // 2. Link sent
  if (sentTo) {
    return (
      <section id="my-reports" aria-label="Check your inbox" className={`${card} mt-4 flex scroll-mt-20 flex-wrap items-center gap-x-5 gap-y-4 lg:mt-6`}>
        <span aria-hidden="true" className="inline-flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-success-bg text-success">
          <Check className="h-[22px] w-[22px]" />
        </span>
        <div className="min-w-0 flex-1 basis-[260px]" role="status" aria-live="polite">
          <h2 className="text-[21px] font-bold">Check your inbox</h2>
          <p className="mt-1 text-[15px] leading-[1.5] text-text-2">
            We sent a sign-in link to <strong className="break-all">{sentTo}</strong>. Open it on this device to see your
            reports. It works once.
          </p>
          <p className="mt-1 text-[13px] text-muted-text">Nothing there? Check spam.</p>
          {error && <p role="alert" className="mt-1 text-[13px] font-semibold text-primary-ink">{error}</p>}
        </div>
        <div className="flex flex-wrap gap-x-[18px] gap-y-1">
          <button type="button" disabled={sending} onClick={() => void send(sentTo)} className={ROW_LINK}>
            {sending ? "Sending…" : "Resend link"}
          </button>
          <button
            type="button"
            onClick={() => { setSentTo(null); setError(null); }}
            className={ROW_LINK}
          >
            Use a different email
          </button>
        </div>
      </section>
    );
  }

  // 1. Signed out (also shown while the account is loading)
  return (
    <section id="my-reports" aria-label="Your saved reports" className={`${card} mt-4 flex scroll-mt-20 flex-wrap gap-x-10 gap-y-[18px] lg:mt-6 lg:gap-y-6`}>
      <div className="min-w-0 flex-1 basis-[420px]">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-panel text-primary">
            <FolderOpen className="h-[22px] w-[22px]" />
          </span>
          <h2 className="text-[21px] font-bold">Your saved reports</h2>
        </div>
        <p className="mt-2.5 text-[15px] leading-[1.5] text-muted-text">
          Sign in with your email to see every report you've unlocked, on any device.
        </p>
        <form onSubmit={handleSubmit} noValidate className="mt-3.5 flex flex-wrap gap-2.5">
          <div className="min-w-0 flex-1 basis-[220px]">
            <label htmlFor="mr-email" className={LABEL}>Your email</label>
            <input
              id="mr-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              placeholder="you@example.com"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "mr-email-error" : "mr-email-help"}
              className={`mt-1.5 h-[52px] w-full rounded-field border bg-white px-3.5 text-base text-ink placeholder:text-muted-text focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                error ? "border-primary" : "border-input-border"
              }`}
            />
          </div>
          <div className="w-full self-end sm:w-auto">
            <button
              type="submit"
              disabled={sending}
              className="flex h-[52px] w-full items-center justify-center rounded-field bg-primary px-[26px] text-[17px] font-bold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {sending ? "Sending…" : "Email me a link"}
            </button>
          </div>
        </form>
        {error ? (
          <p id="mr-email-error" role="alert" className="mt-2 text-[13px] font-semibold text-primary-ink">{error}</p>
        ) : (
          <p id="mr-email-help" className="mt-2 text-[13px] leading-[1.4] text-muted-text">
            No password. We send a one-time sign-in link, and only use your email to sign you in.
          </p>
        )}
      </div>

      {entries.length > 0 && (
        <div className="min-w-0 flex-1 basis-[360px] border-t border-card-border pt-[18px] lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
          <h3 className="font-condensed text-[13px] font-bold uppercase tracking-[0.12em] text-muted-text">On this device</h3>
          <ul className="mt-2">
            {entries.slice(0, 5).map((entry) => (
              <li key={entry.reportId} className="flex items-center justify-between gap-3 border-t border-card-border py-2">
                <div className="min-w-0">
                  <div className="text-base font-semibold">{vehicleName(entry)}</div>
                  <div className="font-mono text-xs text-muted-text">{entryMeta(entry)}</div>
                </div>
                <div className="flex shrink-0 items-center gap-2.5">
                  <StatusPill unlocked={entry.unlocked} />
                  <button type="button" onClick={() => onOpen(entry)} className={ROW_LINK}>Open</button>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-[13px] leading-[1.4] text-muted-text">Sign in to see these on every device.</p>
        </div>
      )}
    </section>
  );
}
