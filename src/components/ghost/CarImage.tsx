import type { ReactNode } from "react";
import { carImageFor, type CarCrop, type CarImageEntry } from "@/lib/ghost/carImages";

/**
 * The car line drawing. `full` shows the whole image; `front` shows the left part only (used on mobile in
 * the report). `children` is an overlay covering the picture (not clipped), for pins positioned with `carPinPercent`.
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
  const entry = image ?? carImageFor({});
  const w = crop === "front" ? entry.mobileCrop.width : entry.aspect[0];
  const h = crop === "front" ? entry.mobileCrop.height : entry.aspect[1];
  const imgWidth = crop === "front" ? `${entry.mobileCrop.imageWidthPercent}%` : "100%";

  // The picture is clipped to the crop; the overlay is not, so pin tooltips can reach outside the picture.
  return (
    <div className={`relative w-full ${className}`} style={{ aspectRatio: `${w} / ${h}` }}>
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={entry.src}
          alt={entry.alt}
          width={entry.width}
          height={entry.height}
          loading={loading}
          className="absolute left-0 top-0 block h-auto max-w-none"
          style={{ width: imgWidth }}
        />
      </div>
      {children && <div className="absolute inset-0">{children}</div>}
    </div>
  );
}
