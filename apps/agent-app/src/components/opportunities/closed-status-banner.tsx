import { CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ClosedStatusBannerProps {
  closingPrice?: number;
  className?: string;
}

export function ClosedStatusBanner({
  closingPrice,
  className,
}: ClosedStatusBannerProps) {
  return (
    <div
      className={cn(
        "w-full rounded-2xl p-6 space-y-4",
        "bg-[#FFFFFF1A]",
        className
      )}
    >
      {/* Status Icon - Circular with translucent green bg */}
      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#10B18966]">
        <CheckCheck className="w-4 h-4 text-ds-green" strokeWidth={2.5} />
      </div>

      {/* Title & Subtitle */}
      <div className="space-y-1">
        <h3
          className="text-lg font-semibold leading-[120%] text-white"
        >
          Deal closed
        </h3>
        {closingPrice && (
          <p
            className="text-sm font-normal leading-[140%]"
            style={{ color: "rgba(255, 255, 255, 0.7)" }}
          >
            Closing price: €{closingPrice.toLocaleString("es-ES")}
          </p>
        )}
      </div>

      {/* No CTAs - intentionally empty */}
    </div>
  );
}
