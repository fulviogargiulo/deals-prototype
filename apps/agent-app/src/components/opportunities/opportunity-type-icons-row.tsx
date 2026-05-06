import { OpportunityType } from "@/types";
import { OpportunityIcon } from "./opportunity-icon";
import { OpportunityBareIcons } from "./opportunity-bare-icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Badge background colors (15% opacity versions)
const badgeBgColors: Record<string, string> = {
  buy: 'rgba(0, 138, 138, 0.15)',
  rent: 'rgba(88, 86, 214, 0.15)',
  sell: 'rgba(217, 93, 40, 0.15)',
  lease: 'rgba(205, 82, 195, 0.15)',
};

const iconColors: Record<string, string> = {
  buy: '#008A8A',
  rent: '#5856D6',
  sell: '#D95D28',
  lease: '#CD52C3',
};

interface OpportunityTypeCounts {
  type: OpportunityType;
  activeCount: number;
}

interface OpportunityTypeIconsRowProps {
  /** Active opportunity counts per type */
  typeCounts: OpportunityTypeCounts[];
  /** Number of inactive (closed) opportunities */
  inactiveCount: number;
  /** Visual variant */
  variant?: 'table' | 'card';
}

/**
 * Renders a row of opportunity type icons with per-type count badges
 * and a "+x" indicator for inactive opportunities.
 * 
 * - `table` variant: uses the SVG icons with background circles (28x28)
 * - `card` variant: uses bare icons inside colored circles (32x32)
 */
export function OpportunityTypeIconsRow({
  typeCounts,
  inactiveCount,
  variant = 'table',
}: OpportunityTypeIconsRowProps) {
  const activeTypes = typeCounts.filter(tc => tc.activeCount > 0);

  if (activeTypes.length === 0 && inactiveCount === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      <TooltipProvider>
        {activeTypes.map(({ type, activeCount }) => {
          if (variant === 'card') {
            const IconComponent = OpportunityBareIcons[type as keyof typeof OpportunityBareIcons];
            if (!IconComponent) return null;
            return (
              <Tooltip key={type}>
                <TooltipTrigger>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center relative"
                    style={{ backgroundColor: badgeBgColors[type] || '#0000000D' }}
                  >
                    <span style={{ color: iconColors[type] || '#1A1A1A' }}>
                      <IconComponent className="!w-3.5 !h-3.5" />
                    </span>
                    {activeCount > 1 && (
                      <span className="absolute -top-1 -right-1 bg-background border border-border rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-semibold">
                        {activeCount}
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="capitalize">{type} ({activeCount})</p>
                </TooltipContent>
              </Tooltip>
            );
          }

          // table variant
          return (
            <Tooltip key={type}>
              <TooltipTrigger>
                <div className="relative">
                  <OpportunityIcon type={type} className="w-7 h-7" />
                  {activeCount > 1 && (
                    <span className="absolute -top-1 -right-1 bg-background border border-border rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-medium">
                      {activeCount}
                    </span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="capitalize">{type} ({activeCount})</p>
              </TooltipContent>
            </Tooltip>
          );
        })}

        {inactiveCount > 0 && (
          <Tooltip>
            <TooltipTrigger>
              <div className="w-8 h-8 rounded-full bg-[#F0F0F0] flex items-center justify-center text-xs font-semibold text-muted-foreground">
                +{inactiveCount}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{inactiveCount} inactive</p>
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
}

/**
 * Helper to compute type counts and inactive count from a list of opportunities.
 */
export function computeOpportunityTypeCounts(
  opportunities: Array<{ type: OpportunityType; status?: string }>
): { typeCounts: OpportunityTypeCounts[]; inactiveCount: number } {
  const activeStatuses = new Set(['new', 'to-review', 'qualified', 'active', 'under-offer']);
  
  const typeMap = new Map<OpportunityType, number>();
  let inactiveCount = 0;

  for (const opp of opportunities) {
    if (opp.status && !activeStatuses.has(opp.status)) {
      inactiveCount++;
    } else {
      typeMap.set(opp.type, (typeMap.get(opp.type) || 0) + 1);
    }
  }

  const typeCounts: OpportunityTypeCounts[] = (['buy', 'rent', 'sell', 'lease'] as OpportunityType[])
    .filter(type => typeMap.has(type))
    .map(type => ({ type, activeCount: typeMap.get(type)! }));

  return { typeCounts, inactiveCount };
}
