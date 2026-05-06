import { X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { NewClientBadge } from "@/components/ui/new-client-badge";
import matchesImagesStack from "@/assets/matches-images-stack.png";
import matchesBuyersStack from "@/assets/matches-buyers-stack.svg";
import { cn } from "@/lib/utils";

interface MatchesBannerProps {
  matchCount: number;
  newCount: number;
  onViewMatches: () => void;
  onDismiss?: () => void;
  description?: string;
  hasMatches?: boolean;
  variant?: 'properties' | 'buyers';
}

export function MatchesBanner({
  matchCount,
  newCount,
  onViewMatches,
  onDismiss,
  description = "Review and add them to the Saved properties.",
  hasMatches = true,
  variant = 'properties',
}: MatchesBannerProps) {
  const assetSrc = variant === 'buyers' ? matchesBuyersStack : matchesImagesStack;
  return (
    <Card 
      className="bg-surface-ds-accent border-0 text-white p-6 cursor-pointer hover:bg-surface-ds-accent/90 transition-all overflow-hidden relative rounded-2xl"
      onClick={onViewMatches}
    >
      <div className="flex items-start justify-between gap-6 relative z-10">
        <div className="flex-1 space-y-3">
          {/* Title row with New badge */}
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold leading-heading text-white">
              {hasMatches ? `${matchCount} matches` : 'No matches'}
            </h3>
            {newCount > 0 && hasMatches && (
              <NewClientBadge variant="dark" />
            )}
          </div>
          
          {/* Subtitle */}
          <p className="text-sm font-normal leading-body text-white">
            {hasMatches ? description : "We'll notify you when we find matching properties"}
          </p>
        </div>

        {/* Dismiss button when no matches */}
        {!hasMatches && onDismiss && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className="shrink-0 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        )}
      </div>
      
      {/* Stacked images asset - bottom right */}
      <div 
        className={cn(
          "absolute pointer-events-none",
          !hasMatches && "blur-sm"
        )}
        style={{
          bottom: '-11px',
          right: '-3px',
          height: '112px',
        }}
      >
        <img 
          src={assetSrc} 
          alt="Matches preview"
          className="w-full h-full object-contain rounded-xl"
          style={{
            filter: !hasMatches ? 'blur(4px)' : undefined,
            boxShadow: !hasMatches ? '0px 4px 24px 0px rgba(0, 0, 0, 0.05)' : undefined,
          }}
        />
      </div>
    </Card>
  );
}
