import type { ReactNode } from "react";
import { carImageFor, type CarCrop, type CarImageEntry } from "@/lib/ghost/carImages";

const FALLBACK = () => {
  const entry = carImageFor({ make: "Mazda", model: "RX-7" });
  if (!entry) throw new Error("RX-7 image entry missing");
  return entry;
};

/**
 * The car line drawing. `full` shows the whole image; `front` shows the left part only (used on mobile in
 * the report). `children` is an overlay covering the picture, for pins positioned with `carPinPercent`.
 */
export function CarImage({
  crop = "full",
  image,
  className = "",
  loading = "lazy",
  children,
}: {
  crop?: CarCrop;
  image?: CarImageEntry;
  className?: string;
  loading?: "lazy" | "eager";
  children?: ReactNode;
}) {
  const entry = image ?? FALLBACK();
  const w = crop === "front" ? entry.mobileCrop.width : entry.aspect[0];
  const h = crop === "front" ? entry.mobileCrop.height : entry.aspect[1];
  const imgWidth = crop === "front" ? `${entry.mobileCrop.imageWidthPercent}%` : "100%";

  return (
    <div className={`relative w-full overflow-hidden ${className}`} style={{ aspectRatio: `${w} / ${h}` }}>
      <img
        src={entry.src}
        alt={entry.alt}
        width={entry.width}
        height={entry.height}
        loading={loading}
        className="absolute left-0 top-0 block h-auto max-w-none"
        style={{ width: imgWidth }}
      />
      {children && <div className="absolute inset-0">{children}</div>}
    </div>
  );
}
