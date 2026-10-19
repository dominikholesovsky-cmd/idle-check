import { CarIllustration } from "./CarIllustration";
import { carImageFor } from "@/lib/ghost/carImages";
import { bodyStyleFor } from "@/lib/ghost/report";

// The car for a vehicle: its real line drawing when one is registered, otherwise the generic vector
// (roadster or sedan). Used where the picture has no pins (e.g. the step 2 confirmed-car card).
export function VehicleCar({
  make,
  model,
  className,
  decorative = false,
}: {
  make: string;
  model: string;
  className?: string;
  decorative?: boolean;
}) {
  const image = carImageFor({ make, model });
  if (image) {
    return (
      <img
        src={image.src}
        alt={decorative ? "" : image.alt}
        width={image.width}
        height={image.height}
        className={className}
        style={{ display: "block", height: "auto" }}
      />
    );
  }
  return <CarIllustration body={bodyStyleFor({ model })} className={className} decorative={decorative} />;
}
