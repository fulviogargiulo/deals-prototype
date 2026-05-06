import { cn } from "@/lib/utils";
import { ComponentType } from "react";

interface OpportunityThumbnailProps {
  images: string[];
  fallbackIcon?: ComponentType<{ className?: string }>;
  fallbackColor?: string;
  fallbackBgColor?: string;
  className?: string;
}

/**
 * Unified opportunity thumbnail for table rows.
 * Renders 0 (icon fallback), 1, 2, or 3 images in a consistent 36×36 grid
 * with 4px corner radius on each individual image.
 */
export function OpportunityThumbnail({
  images,
  fallbackIcon: Icon,
  fallbackColor,
  fallbackBgColor,
  className,
}: OpportunityThumbnailProps) {
  const count = images.length;
  const r = "rounded-[6px]";

  if (count === 0 && Icon) {
    return (
      <div
        className={cn("w-9 h-9 flex items-center justify-center flex-shrink-0", r, className)}
        style={{ backgroundColor: fallbackBgColor }}
      >
        <span style={{ color: fallbackColor }}>
          <Icon className="w-3.5 h-3.5" />
        </span>
      </div>
    );
  }

  if (count === 1) {
    return (
      <img
        src={images[0]}
        className={cn("w-9 h-9 object-cover flex-shrink-0", r, className)}
        alt=""
        loading="lazy"
      />
    );
  }

  if (count === 2) {
    return (
      <div className={cn("w-9 h-9 flex-shrink-0 flex flex-col gap-0.5", className)}>
        <img src={images[0]} className={cn("w-full h-1/2 object-cover", r)} alt="" loading="lazy" />
        <img src={images[1]} className={cn("w-full h-1/2 object-cover", r)} alt="" loading="lazy" />
      </div>
    );
  }

  // 3+ images — use CSS grid for pixel-perfect alignment
  return (
    <div className={cn("w-9 h-9 flex-shrink-0 grid grid-cols-2 grid-rows-[55%_1fr] gap-0.5", className)}>
      <img src={images[0]} className={cn("col-span-2 w-full h-full object-cover", r)} alt="" loading="lazy" />
      <img src={images[1]} className={cn("w-full h-full object-cover", r)} alt="" loading="lazy" />
      <img src={images[2]} className={cn("w-full h-full object-cover", r)} alt="" loading="lazy" />
    </div>
  );
}
