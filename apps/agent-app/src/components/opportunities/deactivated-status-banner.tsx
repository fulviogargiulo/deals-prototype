import { CircleOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OpportunityType } from "@/types";

interface DeactivatedStatusBannerProps {
  opportunityType: OpportunityType;
  onActivate: () => void;
  onViewActivity: () => void;
  isActivating?: boolean;
  className?: string;
}

export function DeactivatedStatusBanner({
  opportunityType,
  onActivate,
  onViewActivity,
  isActivating = false,
  className,
}: DeactivatedStatusBannerProps) {
  const subtitle = "You will not receive any match for this opportunity.";

  return (
    <div
      className={cn(
        "w-full rounded-2xl p-6 space-y-4",
        "bg-[#FFFFFF1A]",
        className
      )}
    >
      {/* Icon */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: "rgba(237, 153, 23, 0.2)" }}
      >
        <CircleOff className="w-4 h-4" style={{ color: "#ED9917" }} />
      </div>

      {/* Title & Subtitle */}
      <div className="space-y-1">
        <h3
          className="text-lg font-semibold leading-[120%] text-white"
        >
          Opportunity deactivated
        </h3>
        <p
          className="text-sm font-normal leading-[140%]"
          style={{ color: "rgba(255, 255, 255, 0.7)" }}
        >
          {subtitle}
        </p>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        {/* Secondary Button - Learn more */}
        <Button
          variant="ghost"
          className="flex-1 h-12 rounded-xl font-semibold bg-white/20 hover:bg-white/30 transition-colors"
          onClick={onViewActivity}
          disabled={isActivating}
        >
          <span className="text-white">Learn more</span>
        </Button>

        {/* Primary Button */}
        <Button
          className="flex-1 h-12 rounded-xl font-semibold bg-white text-foreground hover:bg-white/90 transition-colors"
          onClick={onActivate}
          disabled={isActivating}
        >
          {isActivating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Activating...
            </>
          ) : (
            "Activate"
          )}
        </Button>
      </div>
    </div>
  );
}
