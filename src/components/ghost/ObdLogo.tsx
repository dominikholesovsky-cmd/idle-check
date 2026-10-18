// Pin order for `litPins`: top row left to right (0-6), then bottom row left to right (7-13).
const TOP_X = [66.25, 86.25, 106.25, 126.25, 146.75, 166.25, 186.75];
const PINS = [
  ...TOP_X.map((x) => ({ x, y: 121, h: 8 })),
  ...TOP_X.map((x) => ({ x, y: 158, h: 7 })),
];

interface ObdLogoProps {
  /** Rendered width in px; height follows the 194:110 aspect ratio. */
  size?: number;
  /** Number of pins (0 to 14) filled with the primary color. */
  litPins?: number;
  className?: string;
  /** Provide only when the logo is not decorative. */
  title?: string;
}

export function ObdLogo({ size = 24, litPins = 0, className, title }: ObdLogoProps) {
  const lit = Math.max(0, Math.min(14, Math.round(litPins)));
  return (
    <svg
      viewBox="33 87 194 110"
      width={size}
      height={(size * 110) / 194}
      className={className}
      style={{ display: "block" }}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path
        d="M110.5 105 H58 Q41 105 41 124 L54 171 Q55 177 62 177 H110.5 V188.5 H150.5 V177 H198 Q205 177 206 171 L219 124 Q219 105 202 105 H150.5 V95 H110.5 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={8}
        strokeLinejoin="round"
      />
      <rect x={65} y={140} width={130} height={8} rx={1} fill="#121212" />
      {PINS.map((pin, i) => (
        <rect
          key={i}
          x={pin.x}
          y={pin.y}
          width={7.5}
          height={pin.h}
          rx={0.8}
          fill={i < lit ? "var(--primary)" : "#121212"}
        />
      ))}
    </svg>
  );
}
