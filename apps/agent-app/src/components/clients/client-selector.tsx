import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Search, Plus, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useData } from "@/contexts/data-context";
import { OpportunityTypeIconsRow, computeOpportunityTypeCounts } from "@/components/opportunities/opportunity-type-icons-row";

export type ClientSelectorDevScenario = 'default' | 'no-clients' | 'no-results' | 'few-clients' | 'many-clients' | 'loading';

interface ClientSelectorProps {
  selectedClientId?: string;
  currentClientId?: string; // For swap mode - to show "Current" label
  /** Pre-selected client to show even if not in the client list */
  preSelectedClient?: { id: string; name: string; phone: string };
  onSelectClient: (clientId: string, clientName: string, clientPhone: string) => void;
  onDeselectClient?: () => void;
  onAddNewClient?: (searchQuery: string) => void;
  /** Show opportunity type icons next to each client */
  showOpportunityIcons?: boolean;
  size?: 'default' | 'compact';
  className?: string;
  maxHeight?: string;
  devScenario?: ClientSelectorDevScenario;
}

// Mock clients for dev scenarios
const mockFewClients = [
  { id: 'mock-1', fullName: 'John Smith', phone: '+1 555 111 2222', email: 'john@example.com' },
  { id: 'mock-2', fullName: 'Jane Doe', phone: '+1 555 333 4444', email: 'jane@example.com' },
  { id: 'mock-3', fullName: 'Bob Wilson', phone: '+1 555 555 6666', email: 'bob@example.com' },
];

const mockManyClients = [
  ...mockFewClients,
  { id: 'mock-4', fullName: 'Alice Johnson', phone: '+1 555 777 8888', email: 'alice@example.com' },
  { id: 'mock-5', fullName: 'Charlie Brown', phone: '+1 555 999 0000', email: 'charlie@example.com' },
  { id: 'mock-6', fullName: 'Diana Prince', phone: '+1 555 123 4567', email: 'diana@example.com' },
  { id: 'mock-7', fullName: 'Edward Norton', phone: '+1 555 234 5678', email: 'edward@example.com' },
  { id: 'mock-8', fullName: 'Fiona Apple', phone: '+1 555 345 6789', email: 'fiona@example.com' },
  { id: 'mock-9', fullName: 'George Lucas', phone: '+1 555 456 7890', email: 'george@example.com' },
  { id: 'mock-10', fullName: 'Hannah Montana', phone: '+1 555 567 8901', email: 'hannah@example.com' },
  { id: 'mock-11', fullName: 'Ivan Drago', phone: '+1 555 678 9012', email: 'ivan@example.com' },
  { id: 'mock-12', fullName: 'Julia Roberts', phone: '+1 555 789 0123', email: 'julia@example.com' },
];

export function ClientSelector({ 
  selectedClientId,
  currentClientId,
  preSelectedClient,
  onSelectClient,
  onDeselectClient,
  onAddNewClient,
  showOpportunityIcons = false,
  size = 'default',
  className,
  maxHeight = '400px',
  devScenario = 'default'
}: ClientSelectorProps) {
  const { clients: realClients, opportunities } = useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Handle scroll to show scrollbar
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

  // Get clients based on dev scenario
  const baseClients = useMemo(() => {
    switch (devScenario) {
      case 'no-clients':
      case 'no-results':
        return [];
      case 'few-clients':
        return mockFewClients;
      case 'many-clients':
        return mockManyClients;
      default:
        return realClients;
    }
  }, [devScenario, realClients]);

  // Include pre-selected client in the list if it doesn't exist
  const clients = useMemo(() => {
    if (!preSelectedClient) return baseClients;
    
    // Check if the pre-selected client already exists in the list
    const exists = baseClients.some(c => c.id === preSelectedClient.id);
    if (exists) return baseClients;
    
    // Add the pre-selected client to the beginning of the list
    const preSelectedAsClient = {
      id: preSelectedClient.id,
      fullName: preSelectedClient.name,
      phone: preSelectedClient.phone,
      email: undefined,
    };
    return [preSelectedAsClient, ...baseClients];
  }, [baseClients, preSelectedClient]);

  // Debounce search query with loading state
  useEffect(() => {
    if (searchQuery !== debouncedQuery) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        setDebouncedQuery(searchQuery);
        setIsSearching(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, debouncedQuery]);

  const filteredClients = useMemo(() => {
    if (devScenario === 'no-clients') return [];
    return clients.filter((client) =>
      client.fullName.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
      client.phone.includes(debouncedQuery) ||
      (client.email && client.email.toLowerCase().includes(debouncedQuery.toLowerCase()))
    );
  }, [clients, debouncedQuery, devScenario]);

  const isCompact = size === 'compact';
  const isLoading = devScenario === 'loading' || isSearching;
  const hasNoClients = (clients.length === 0 && !debouncedQuery) || devScenario === 'no-clients';
  const showSearchEmptyState = (filteredClients.length === 0 && debouncedQuery && !isSearching) || devScenario === 'no-results';
  const showEmptyState = showSearchEmptyState || hasNoClients;

  const handleAddNewClient = () => {
    if (onAddNewClient) {
      onAddNewClient(searchQuery.trim());
    }
  };

  // Loading skeleton
  const renderLoadingSkeleton = () => (
    <div className={cn("space-y-2", isCompact ? "space-y-2" : "space-y-3")}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className={cn("flex items-center gap-3", isCompact ? "p-3" : "p-4")}>
          <Skeleton className={cn("rounded-full shrink-0", isCompact ? "w-10 h-10" : "w-14 h-14")} />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className={cn("flex flex-col h-full", className)} style={{ minHeight: 0 }}>
      {/* Search Input with New button */}
      <div className="flex gap-3 mb-4 shrink-0 px-1 pt-1">
        <div className="relative flex-1">
          <Search className={cn(
            "absolute top-1/2 -translate-y-1/2 text-muted-foreground",
            isCompact ? "left-3 w-4 h-4" : "left-3 w-4 h-4"
          )} />
          <Input
            placeholder="Search by name or phone number"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              isCompact ? "pl-10 h-11" : "pl-10 h-12 rounded-xl"
            )}
          />
        </div>
        {onAddNewClient && (
          <Button
            variant="outline"
            onClick={handleAddNewClient}
            className={cn(
              "gap-2 shrink-0",
              isCompact ? "h-11 px-4" : "h-12 px-4 rounded-xl"
            )}
          >
            <Plus className={isCompact ? "h-4 w-4" : "h-4 w-4"} />
            New
          </Button>
        )}
      </div>

      {/* Client List */}
      <div 
        ref={listRef}
        onScroll={handleScroll}
        className={cn(
          "flex-1 px-1 pb-1 scrollbar-auto-hide",
          (showEmptyState && !isSearching)
            ? "flex items-center justify-center" 
            : "overflow-y-auto overscroll-contain",
          isScrolling && "scrollbar-visible"
        )}
        style={{ minHeight: 0, overflow: (showEmptyState && !isSearching) ? 'hidden' : 'auto' }}
      >
        {/* Search Loading State - matching AddressSelector pattern */}
        {isSearching ? (
          <div className={cn(
            "text-center text-muted-foreground animate-fade-in",
            isCompact ? "py-8" : "py-10"
          )}>
            <div className={cn(
              "border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin mx-auto mb-3",
              isCompact ? "h-5 w-5" : "h-5 w-5"
            )} />
            <p className={isCompact ? "text-base" : "text-base"}>Searching...</p>
          </div>
        ) : devScenario === 'loading' ? (
          renderLoadingSkeleton()
        ) : showEmptyState ? (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground animate-fade-in px-4">
            <User className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-base font-medium mb-1">
              {showSearchEmptyState ? "No clients found" : "No clients yet"}
            </p>
            <p className="text-sm mb-4">
              {showSearchEmptyState 
                ? "Try adjusting your search" 
                : "Add your first client to get started"
              }
            </p>
            {onAddNewClient && (
              <Button
                variant="secondary"
                onClick={handleAddNewClient}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add new client
              </Button>
            )}
          </div>
        ) : (
          <div 
            key={debouncedQuery}
            className={cn("pb-2", isCompact ? "space-y-2" : "space-y-2")}
          >
            {filteredClients.map((client, index) => {
              const isSelected = selectedClientId === client.id;
              const isCurrent = currentClientId === client.id;
              const initials = client.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
              const oppData = showOpportunityIcons ? computeOpportunityTypeCounts(opportunities.filter(o => o.clientId === client.id)) : null;
              
              console.log('[ClientSelector] Rendering client:', client.id, 'isSelected:', isSelected, 'selectedClientId:', selectedClientId);
              
              return (
                <button
                  key={client.id}
                  onClick={() => {
                    console.log('[ClientSelector] Click on client:', client.id, 'current isSelected:', isSelected);
                    if (isCurrent) return;
                    if (isSelected && onDeselectClient) {
                      console.log('[ClientSelector] Deselecting');
                      onDeselectClient();
                    } else {
                      console.log('[ClientSelector] Selecting');
                      onSelectClient(client.id, client.fullName, client.phone);
                    }
                  }}
                  disabled={isCurrent}
                  className={cn(
                    "w-full flex items-center gap-3 text-left",
                    "transition-colors duration-150 ease-out",
                    "opacity-0 animate-fade-in",
                    "outline-none border",
                    isCompact ? "p-3 rounded-lg" : "p-3 rounded-xl border-2",
                    isCurrent && "opacity-50 cursor-not-allowed",
                    isSelected 
                      ? "border-foreground bg-muted/50" 
                      : isCompact
                        ? "border-transparent hover:bg-muted/50"
                        : "border-border hover:border-muted-foreground/50 hover:bg-muted/50"
                  )}
                  style={{ 
                    animationDelay: `${Math.min(index * 40, 200)}ms`,
                    animationFillMode: 'forwards'
                  }}
                >
                  <div className={cn(
                    "rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium shrink-0",
                    isCompact ? "w-10 h-10 text-sm" : "w-11 h-11 text-base"
                  )}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "font-medium truncate",
                      isCompact ? "text-sm" : "text-base font-semibold"
                    )}>
                      {client.fullName}
                    </p>
                    <p className={cn(
                      "text-muted-foreground truncate",
                      isCompact ? "text-xs" : "text-sm"
                    )}>
                      {client.phone}
                    </p>
                  </div>
                  {/* Opportunity type icons */}
                  {showOpportunityIcons && oppData && (
                    <div className="shrink-0">
                      <OpportunityTypeIconsRow
                        typeCounts={oppData.typeCounts}
                        inactiveCount={oppData.inactiveCount}
                        variant="card"
                      />
                    </div>
                  )}
                  {isCurrent && (
                    <span className="text-xs text-muted-foreground shrink-0">Current</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
