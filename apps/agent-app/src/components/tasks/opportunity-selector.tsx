import { useState, useEffect, useRef, useCallback } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { OpportunityThumbnail } from "@/components/opportunities/opportunity-thumbnail";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { mockOpportunities, mockClients } from "@/data/mockData";
import { Opportunity } from "@/types";
import { getOpportunityConfig } from "@/components/opportunities/opportunity-icon";

export type OpportunitySelectorDevScenario = 'default' | 'no-opportunities' | 'few-opportunities' | 'many-opportunities' | 'loading';

interface OpportunitySelectorProps {
  selectedOpportunityId?: string;
  onSelectOpportunity: (opportunity: Opportunity) => void;
  size?: 'default' | 'compact';
  className?: string;
  devScenario?: OpportunitySelectorDevScenario;
}

export function OpportunitySelector({
  selectedOpportunityId,
  onSelectOpportunity,
  size = 'compact',
  className,
  devScenario = 'default'
}: OpportunitySelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle scroll events for auto-hide scrollbar
  const handleScroll = useCallback(() => {
    setIsScrolling(true);
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Simulate search with loading state
  useEffect(() => {
    if (searchQuery) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        setIsSearching(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  // Get opportunities based on dev scenario
  const getOpportunities = (): Opportunity[] => {
    if (devScenario === 'no-opportunities') return [];
    if (devScenario === 'few-opportunities') return mockOpportunities.slice(0, 3);
    if (devScenario === 'many-opportunities') return mockOpportunities;
    if (devScenario === 'loading') return [];
    return mockOpportunities;
  };

  const opportunities = getOpportunities();

  // Filter by search query
  const filteredOpportunities = opportunities.filter(opp => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const client = mockClients.find(c => c.id === opp.clientId);
    return (
      opp.title.toLowerCase().includes(query) ||
      client?.fullName.toLowerCase().includes(query) ||
      opp.neighborhoods.some(n => n.toLowerCase().includes(query))
    );
  });

  const isLoading = devScenario === 'loading' || isSearching;

  const getClientName = (clientId: string) => {
    return mockClients.find(c => c.id === clientId)?.fullName || 'Unknown';
  };

  const formatPrice = (opp: Opportunity) => {
    if (!opp.priceRange) return '';
    const { min, max, currency } = opp.priceRange;
    if (min === max) {
      return `${currency}${min.toLocaleString()}`;
    }
    return `${currency}${min.toLocaleString()} - ${currency}${max.toLocaleString()}`;
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Search Input */}
      <div className="relative shrink-0 mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search opportunities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-11 rounded-xl"
        />
      </div>

      {/* Scrollable List */}
      <div className="flex-1 min-h-0 relative">
        <ScrollArea 
          className={cn(
            "h-full scrollbar-auto-hide",
            isScrolling && "scrollbar-visible"
          )}
          onScrollCapture={handleScroll}
        >
          <div className="pt-1 space-y-2 pr-2">
            {/* Loading State */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12 transition-smooth">
                <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground mt-3">Searching...</p>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredOpportunities.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">
                  {searchQuery ? 'No opportunities found' : 'No opportunities yet'}
                </p>
              </div>
            )}

            {/* Opportunity List */}
            {!isLoading && filteredOpportunities.map((opportunity) => {
              const config = getOpportunityConfig(opportunity.type);
              const isSelected = opportunity.id === selectedOpportunityId;
              const images = opportunity.images || [];
              const mainImage = images[0];
              const thumbnails = images.slice(1, 3);

              return (
                <button
                  key={opportunity.id}
                  onClick={() => onSelectOpportunity(opportunity)}
                  className={cn(
                    "w-full p-4 rounded-xl border text-left transition-all duration-200 group",
                    "hover:border-primary/50 hover:bg-accent/50",
                    isSelected 
                      ? "border-primary bg-primary/5" 
                      : "border-border bg-background"
                  )}
                >
                  {/* Type Badge at top */}
                  <Badge 
                    variant="secondary"
                    className="mb-2"
                    style={{
                      backgroundColor: config.alphaBg,
                      color: config.tokenColor,
                    }}
                  >
                    <img src={config.icon} alt={config.label} className="w-4 h-4 mr-1" />
                    {config.label}
                  </Badge>

                  <div className="flex items-start justify-between gap-3">
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title with marquee on hover/selected */}
                      <div className="overflow-hidden">
                        <h4 
                          className={cn(
                            "font-semibold text-base leading-tight",
                            "line-clamp-2",
                            (isSelected) && "group-hover:animate-none"
                          )}
                          title={opportunity.title}
                        >
                          {opportunity.title}
                        </h4>
                      </div>
                      {opportunity.priceRange && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {formatPrice(opportunity)}
                          {opportunity.bedrooms ? ` · ${opportunity.bedrooms} beds` : ''}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1.5 line-clamp-1">
                        Client: <span className="text-foreground">{getClientName(opportunity.clientId)}</span>
                      </p>
                    </div>

                    {/* Property Images */}
                    {mainImage && (
                      <OpportunityThumbnail
                        images={[mainImage, ...thumbnails].slice(0, 3)}
                        className="w-20 h-20"
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
