import { useId } from "react";

interface CarIllustrationProps {
  body?: "roadster" | "sedan";
  /** Override the default "0 0 520 224" viewBox (the mobile report crops the sedan to "236 64 252 150"). */
  viewBox?: string;
  className?: string;
  /** Hide from assistive tech when the illustration is purely decorative. */
  decorative?: boolean;
}

const LABELS = {
  roadster: "Illustration of a red roadster",
  sedan: "Illustration of a red sedan",
};

function Wheel({ cx }: { cx: number }) {
  return (
    <g>
      <circle cx={cx} cy={172} r={30} fill="#2b2b2a" />
      <circle cx={cx} cy={172} r={19} fill="#d9d7d1" />
      <circle cx={cx} cy={172} r={6} fill="#8a8a86" />
      <path
        d={`M${cx} 155 L${cx} 189 M${cx - 17} 172 L${cx + 17} 172 M${cx - 12} 160 L${cx + 12} 184 M${cx + 12} 160 L${cx - 12} 184`}
        stroke="#8a8a86"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </g>
  );
}

function Roadster({ clipId }: { clipId: string }) {
  return (
    <>
      <ellipse cx={262} cy={206} rx={214} ry={9} fill="rgba(18,18,18,0.10)" />
      <path d="M462 177 L463 156 C465 148 460 143 449 141 C410 133 366 123 332 118 L162 112 C122 112 84 116 66 125 C58 131 57 142 58 154 L58 177 Z" fill="var(--primary)" />
      <path d="M330 118 L268 83 C258 78 238 76 220 78 C196 82 176 96 160 112 Z" fill="#2b2b2a" />
      <path d="M314 115 L268 90 C258 87 246 87 238 88 L234 115 Z" fill="#cfe3ec" />
      <path d="M228 115 L230 96 C214 100 200 106 188 114 Z" fill="#9fb9c6" />
      <path d="M84 140 C160 146 330 148 456 150" stroke="rgba(255,255,255,0.38)" strokeWidth={2} strokeLinecap="round" fill="none" />
      <path d="M322 120 L318 170 M216 114 L214 168" stroke="rgba(0,0,0,0.22)" strokeWidth={2} fill="none" />
      <rect x={232} y={134} width={20} height={4} rx={2} fill="rgba(0,0,0,0.3)" />
      <path d="M432 142 C446 142 456 146 458 152 C452 156 438 154 428 150 Z" fill="#fff4c4" stroke="#2b2b2a" strokeWidth={1.5} />
      <rect x={446} y={160} width={14} height={9} rx={3} fill="#2b2b2a" />
      <path d="M404 177 L462 177 L462 181 C440 183 420 182 404 179 Z" fill="#2b2b2a" />
      <ellipse cx={63} cy={140} rx={5} ry={9} fill="#7f1317" />
      <path d="M312 114 L324 111 L326 118 L314 120 Z" fill="#2b2b2a" />
      <g clipPath={`url(#${clipId})`}>
        <circle cx={140} cy={172} r={36} fill="#1f1f1e" />
        <circle cx={382} cy={172} r={36} fill="#1f1f1e" />
      </g>
      <Wheel cx={140} />
      <Wheel cx={382} />
    </>
  );
}

function Sedan({ clipId }: { clipId: string }) {
  return (
    <>
      <ellipse cx={262} cy={206} rx={216} ry={9} fill="rgba(18,18,18,0.10)" />
      <path d="M462 177 L463 154 C465 146 459 141 448 139 C406 130 366 122 338 118 L152 114 C112 114 72 117 62 126 C56 132 55 144 55 154 L55 177 Z" fill="var(--primary)" />
      <path d="M336 118 L290 83 C278 76 254 76 232 78 C206 80 184 92 152 114 Z" fill="#2b2b2a" />
      <path d="M322 115 L286 88 C276 84 264 84 252 85 L248 115 Z" fill="#cfe3ec" />
      <path d="M240 115 L242 86 C222 88 206 95 192 106 L180 115 Z" fill="#cfe3ec" />
      <path d="M62 142 C140 146 330 148 452 148" stroke="rgba(255,255,255,0.38)" strokeWidth={2} strokeLinecap="round" fill="none" />
      <path d="M332 120 L328 170 M244 115 L244 168 M176 115 L174 168" stroke="rgba(0,0,0,0.22)" strokeWidth={2} fill="none" />
      <rect x={270} y={132} width={20} height={4} rx={2} fill="rgba(0,0,0,0.3)" />
      <rect x={204} y={132} width={20} height={4} rx={2} fill="rgba(0,0,0,0.3)" />
      <path d="M440 139 L458 144 L452 151 L432 146 Z" fill="#fff4c4" stroke="#2b2b2a" strokeWidth={1.5} />
      <rect x={446} y={158} width={15} height={10} rx={3} fill="#2b2b2a" />
      <path d="M58 124 L70 122 L70 136 L58 138 Z" fill="#7f1317" />
      <path d="M312 116 L324 114 L326 121 L314 122 Z" fill="#2b2b2a" />
      <g clipPath={`url(#${clipId})`}>
        <circle cx={142} cy={172} r={36} fill="#1f1f1e" />
        <circle cx={388} cy={172} r={36} fill="#1f1f1e" />
      </g>
      <Wheel cx={142} />
      <Wheel cx={388} />
    </>
  );
}

export function CarIllustration({
  body = "sedan",
  viewBox = "0 0 520 224",
  className,
  decorative = false,
}: CarIllustrationProps) {
  // useId returns ":r0:"; colons are awkward inside url(#...), so strip them.
  const clipId = `car-well-${useId().replace(/:/g, "")}`;
  return (
    <svg
      viewBox={viewBox}
      className={className}
      style={{ display: "block" }}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : LABELS[body]}
      aria-hidden={decorative ? true : undefined}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={0} y={0} width={520} height={177} />
        </clipPath>
      </defs>
      {body === "roadster" ? <Roadster clipId={clipId} /> : <Sedan clipId={clipId} />}
    </svg>
  );
}
