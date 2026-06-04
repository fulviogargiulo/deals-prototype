import { useState, useEffect } from "react";
import { MoreVertical, Link as LinkIcon, Handshake, CircleOff, CheckCircle2, CheckCheck, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getOpportunityBadgeClasses, getOpportunityLabel, getOpportunityConfig } from "./opportunity-icon";
import { OpportunityBareIcons } from "./opportunity-bare-icons";
import { OpportunityType } from "@/types";
import { OpportunityThumbnail } from "./opportunity-thumbnail";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/ui/user-avatar";
import { NewClientBadge } from "@/components/ui/new-client-badge";
import { cn } from "@/lib/utils";
interface OpportunityCardProps {
  id: string;
  type: OpportunityType;
  title: string;
  priceRange?: {
    min: number;
    max: number;
    currency: string;
  };
  bedrooms?: number;
  clientName?: string;
  image?: string;
  images?: string[];
  matchesCount?: number;
  matchesTime?: string;
  onClick?: () => void;
  devMode?: boolean;
  showMatches?: boolean;
  showImage?: boolean;
  showClient?: boolean;
  neighborhoods?: string[];
  propertyTypes?: string[];
  showActivityFooter?: boolean;
  activityText?: string;
  activityTime?: string;
  // Menu action callbacks
  isDeactivated?: boolean;
  isClosed?: boolean;
  isActivating?: boolean;
  canCloseDeal?: boolean;
  onCloseDeal?: () => void;
  onDeactivate?: () => void;
  onActivate?: () => void;
  isNew?: boolean;
  hasNewMatches?: boolean;
}

export function OpportunityCard({
  type,
  title,
  priceRange,
  bedrooms,
  clientName,
  image,
  images,
  matchesCount = 0,
  matchesTime = "1d ago",
  onClick,
  devMode = false,
  showMatches = true,
  showImage = true,
  showClient = true,
  neighborhoods = [],
  propertyTypes = [],
  showActivityFooter = false,
  activityText = "",
  activityTime = "",
  // Menu action props
  isDeactivated = false,
  isClosed = false,
  isActivating = false,
  canCloseDeal = true,
  onCloseDeal,
  onDeactivate,
  onActivate,
  isNew = false,
  hasNewMatches = false,
}: OpportunityCardProps) {
  const getDevTitleLabel = () => {
    return `\${opportunityType} \${propertyType} in \${locations[0]}`;
  };

  const formatPrice = () => {
    if (!priceRange) return null;
    const { min, max, currency } = priceRange;
    const symbol = currency === 'EUR' ? '€' : currency;
    
    if (min === max) {
      return `${symbol}${(min / 1000).toFixed(0)}k`;
    }
    return `${symbol}${(min / 1000).toFixed(0)}k - ${(max / 1000).toFixed(0)}k`;
  };

  const isClientBuySide = type === 'buy' || type === 'rent';
  const isClientSellSide = type === 'sell' || type === 'lease';
  const isInactive = isDeactivated || isClosed;
  const config = getOpportunityConfig(type);

  // State for enter/exit animation - keeps badge in DOM during transitions
  const [showStatusBadge, setShowStatusBadge] = useState(isInactive);
  const [badgeOpacity, setBadgeOpacity] = useState(isInactive ? 1 : 0);

  useEffect(() => {
    if (isInactive) {
      // Showing: render badge first with opacity 0, then fade in
      setShowStatusBadge(true);
      setBadgeOpacity(0);
      // Use double rAF to ensure DOM is painted before transitioning
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setBadgeOpacity(1);
        });
      });
    } else if (showStatusBadge) {
      // Hiding: fade out, then remove from DOM
      setBadgeOpacity(0);
      const timer = setTimeout(() => {
        setShowStatusBadge(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isInactive]);

  // Badge background colors (15% opacity versions) - matching design system
  const badgeBgColors: Record<string, string> = {
    buy: 'rgba(0, 138, 138, 0.15)',      // #008A8A at 15%
    rent: 'rgba(88, 86, 214, 0.15)',     // #5856D6 at 15%
    sell: 'rgba(217, 93, 40, 0.15)',     // #D95D28 at 15%
    lease: 'rgba(205, 82, 195, 0.15)',   // #CD52C3 at 15%
    mortgage: 'rgba(92, 107, 79, 0.15)', // #5C6B4F at 15%
  };

  // Icon colors - matching design system
  const iconColors: Record<string, string> = {
    buy: '#008A8A',
    rent: '#5856D6',
    sell: '#D95D28',
    lease: '#CD52C3',
    mortgage: '#5C6B4F',
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer bg-surface-1"
      onClick={onClick}
    >
      <div className="p-4 space-y-4">
        {/* Header with Type Badge(s) and Menu */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 relative">
            {/* Opportunity Type Badge - grays out when inactive */}
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
              style={{
                backgroundColor: isInactive ? 'rgba(0, 0, 0, 0.06)' : badgeBgColors[type],
                transition: 'background-color 1500ms ease-in-out',
              }}
            >
              <span 
                style={{
                  color: isInactive ? 'rgba(0, 0, 0, 0.3)' : iconColors[type],
                  transition: 'color 1500ms ease-in-out',
                }}
              >
                {OpportunityBareIcons[type] && (() => {
                  const BareIcon = OpportunityBareIcons[type];
                  return <BareIcon />;
                })()}
              </span>
              <span 
                className="text-xs font-semibold leading-[120%]"
                style={{
                  color: isInactive ? 'rgba(0, 0, 0, 0.3)' : '#1A1A1A',
                  transition: 'color 1500ms ease-in-out',
                }}
              >
                {getOpportunityLabel(type)}
              </span>
            </div>
            
            {/* New Badge - shows when opportunity is new and not inactive */}
            {isNew && !isInactive && (
              <NewClientBadge />
            )}
            
            {/* New Matches Badge - shows when opportunity has new matches and not inactive */}
            {hasNewMatches && !isInactive && (
              <NewClientBadge type="new-matches" />
            )}
            
            {/* Status Badge - shows Closed OR Inactive (never both) */}
            {showStatusBadge && (
              <div 
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full whitespace-nowrap"
                style={{ 
                  backgroundColor: isClosed 
                    ? 'rgba(16, 177, 137, 0.15)' 
                    : 'rgba(237, 153, 23, 0.15)',
                  opacity: badgeOpacity,
                  transition: 'opacity 1500ms ease-in-out',
                }}
              >
                {isClosed ? (
                  <CheckCheck 
                    className="w-3.5 h-3.5 flex-shrink-0"
                    style={{ color: '#10B189' }}
                  />
                ) : (
                  <CircleOff 
                    className="w-3.5 h-3.5 flex-shrink-0"
                    style={{ color: '#ED9917' }}
                  />
                )}
                <span 
                  className="text-sm font-semibold"
                  style={{ color: '#1A1A1A' }}
                >
                  {isClosed ? 'Closed' : 'Inactive'}
                </span>
              </div>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0 rounded-full bg-secondary hover:bg-secondary/80"
              >
                <MoreVertical className="h-4 w-4 rotate-90" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {/* Close Deal */}
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  if (canCloseDeal && !isClosed && !isDeactivated && onCloseDeal) {
                    onCloseDeal();
                  }
                }}
                className="gap-2"
                disabled={!canCloseDeal || isClosed || isDeactivated}
              >
                <Handshake className="w-4 h-4" />
                Close deal
              </DropdownMenuItem>
              
              {/* Deactivate/Activate */}
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  if (isClosed || isActivating) return;
                  if (isDeactivated && onActivate) {
                    onActivate();
                  } else if (onDeactivate) {
                    onDeactivate();
                  }
                }}
                className="gap-2"
                disabled={isClosed || isActivating}
              >
                {isActivating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Activating...
                  </>
                ) : isDeactivated ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Activate
                  </>
                ) : (
                  <>
                    <CircleOff className="w-4 h-4" />
                    Deactivate
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Main Content */}
        <div className="flex gap-4">
          {/* Left: Info */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="overflow-hidden">
              <h3 
                className="text-lg font-semibold leading-heading text-foreground line-clamp-2"
                title={title}
              >
                {title}
              </h3>
              {devMode && (
                <p className="text-xs text-muted-foreground/60 font-mono mt-0.5 line-clamp-1">
                  {getDevTitleLabel()}
                </p>
              )}
            </div>
            
            {/* Price and Specs */}
            <div className="flex items-center gap-2 text-sm font-normal leading-body text-muted-foreground line-clamp-1">
              {priceRange && (
                <>
                  <span>{formatPrice()}</span>
                  {bedrooms && bedrooms > 0 && <span> · </span>}
                </>
              )}
              {bedrooms && bedrooms > 0 && (
                <span>{bedrooms}-{bedrooms + 1} beds</span>
              )}
              {devMode && (priceRange || (bedrooms && bedrooms > 0)) && (
                <span className="text-xs text-muted-foreground/60 font-mono ml-1 truncate">
                  {priceRange && bedrooms && bedrooms > 0
                    ? `\${formatPrice()} · \${bedrooms} - \${bedrooms + 1} beds`
                    : priceRange 
                    ? `\${formatPrice()}`
                    : `\${bedrooms} - \${bedrooms + 1} beds`
                  }
                </span>
              )}
            </div>

            {/* Client Info */}
            {clientName && showClient && (
              <div>
                <div className="flex items-center gap-2">
                  <UserAvatar name={clientName} size="sm" className="w-5 h-5 text-xs" />
                  <span className="text-sm truncate">
                    <span className="text-muted-foreground">Client:</span>{' '}
                    <span className="text-foreground">{clientName}</span>
                  </span>
                </div>
                {devMode && (
                  <p className="text-xs text-muted-foreground/60 font-mono mt-0.5 truncate">
                    {`Client: \${clientName}`}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right: Image(s) */}
          {showImage && (images && images.length > 0 ? (
            <OpportunityThumbnail
              images={images.slice(0, 3)}
              className="w-16 h-16"
            />
          ) : image ? (
            <OpportunityThumbnail
              images={[image]}
              className="w-16 h-16"
            />
          ) : null)}
        </div>

        {/* Footer: Matches */}
        {matchesCount > 0 && showMatches && !showActivityFooter && (
          <div>
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{matchesCount} new matches</span>
              </div>
              <span className="text-sm text-muted-foreground">{matchesTime}</span>
            </div>
            {devMode && (
              <p className="text-xs text-muted-foreground/60 font-mono mt-1">
                {`\${matchesCount} new matches · \${matchesTime}`}
              </p>
            )}
          </div>
        )}

        {/* Footer: Activity (for client detail page) */}
        {showActivityFooter && activityText && (
          <div className="flex items-center justify-between pt-3 border-t">
            <span className="text-sm font-normal leading-body text-foreground">{activityText}</span>
            <span className="text-sm font-normal leading-body text-muted-foreground">{activityTime}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
