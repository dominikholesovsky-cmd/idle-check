function usd(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

const floor500 = (n: number) => Math.floor(n / 500) * 500;
const ceil500 = (n: number) => Math.ceil(n / 500) * 500;

// Scale: lowest of (offer, market low) minus 5% of asking, down to $500; highest of
// (asking, market high) plus 5% of asking, up to $500. The market band only exists
// when both numbers are present and sane.
export function PriceRuler({
  offer,
  asking,
  marketLow,
  marketHigh,
  note,
}: {
  offer: number;
  asking: number;
  marketLow?: number;
  marketHigh?: number;
  note?: string;
}) {
  const hasBand =
    typeof marketLow === "number" && typeof marketHigh === "number" &&
    marketLow > 0 && marketHigh >= marketLow;

  const pad = 0.05 * asking;
  const min = floor500(Math.min(offer, hasBand ? marketLow! : offer) - pad);
  const max = ceil500(Math.max(asking, hasBand ? marketHigh! : asking) + pad);
  const span = Math.max(1, max - min);
  const pos = (v: number) => Math.min(100, Math.max(0, ((v - min) / span) * 100));

  const offerPos = pos(offer);
  const askPos = pos(asking);
  // Markers close together: push the labels apart so they never overprint.
  const crowded = askPos - offerPos < 26;

  const summary = `Your offer ${usd(offer)}, asking ${usd(asking)}${
    hasBand ? `, market range ${usd(marketLow!)} to ${usd(marketHigh!)}` : ""
  }.`;

  return (
    <div>
      <div role="img" aria-label={summary} className="relative mt-1.5 h-[108px]">
        <div className="absolute inset-x-0 top-[50px] h-2 rounded bg-card-border" />
        {hasBand && (
          <div
            className="absolute top-[50px] h-2 rounded bg-market-band"
            style={{ left: `${pos(marketLow!)}%`, width: `${pos(marketHigh!) - pos(marketLow!)}%` }}
          />
        )}

        {/* Labels */}
        <div
          className={`absolute top-1 whitespace-nowrap ${crowded ? "text-right" : "text-center"}`}
          style={{ left: `${offerPos}%`, transform: crowded ? "translateX(-100%)" : "translateX(-50%)" }}
        >
          <div className="text-xs text-muted-text">Your offer</div>
          <div className="font-mono text-base font-bold text-primary">{usd(offer)}</div>
        </div>
        <div
          className={`absolute top-1 whitespace-nowrap ${crowded ? "text-left" : "text-center"}`}
          style={{ left: `${askPos}%`, transform: crowded ? "translateX(0)" : "translateX(-50%)" }}
        >
          <div className="text-xs text-muted-text">Asking</div>
          <div className="font-mono text-base font-bold">{usd(asking)}</div>
        </div>

        {/* Markers */}
        <div
          className="absolute top-[45px] -ml-[9px] h-[18px] w-[18px] rounded-full border-[3px] border-white bg-ink shadow-[0_0_0_1px_#121212]"
          style={{ left: `${askPos}%` }}
        />
        <div
          className="absolute top-[45px] -ml-[9px] h-[18px] w-[18px] rounded-full border-[3px] border-white bg-primary shadow-[0_0_0_1px_var(--primary)]"
          style={{ left: `${offerPos}%` }}
        />

        {hasBand && (
          <div
            className="absolute top-[68px] whitespace-nowrap text-[13px] text-text-2"
            style={{ left: `${(pos(marketLow!) + pos(marketHigh!)) / 2}%`, transform: "translateX(-50%)" }}
          >
            Market <strong className="font-mono text-xs">{usd(marketLow!)}–{Math.round(marketHigh!).toLocaleString("en-US")}</strong>
          </div>
        )}

        <div className="absolute left-0 top-[88px] font-mono text-xs text-muted-text">{usd(min)}</div>
        <div className="absolute right-0 top-[88px] font-mono text-xs text-muted-text">{usd(max)}</div>
      </div>
      {note && <p className="mt-1 text-[13px] leading-[1.4] text-muted-text">{note}</p>}
    </div>
  );
}
