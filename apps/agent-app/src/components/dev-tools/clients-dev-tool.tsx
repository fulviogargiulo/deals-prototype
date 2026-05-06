import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { useData, type DataViewMode } from "@/contexts/data-context";
import { useDevTools, type SortMode } from "@/contexts/dev-tools-context";
import { OpportunityType } from "@/types";
import { OpportunityIcon } from "@/components/opportunities/opportunity-icon";

interface ClientsDevToolProps {
  showOpportunityFilter: boolean;
  onShowOpportunityFilterChange: (show: boolean) => void;
  intentFilters: OpportunityType[];
  onIntentFiltersChange: (filters: OpportunityType[]) => void;
  showPerPageControl: boolean;
  onShowPerPageControlChange: (show: boolean) => void;
}

export function ClientsDevTool({
  showOpportunityFilter,
  onShowOpportunityFilterChange,
  intentFilters,
  onIntentFiltersChange,
  showPerPageControl,
  onShowPerPageControlChange,
}: ClientsDevToolProps) {
  const { dataViewMode, setDataViewMode } = useData();
  const { sortMode, setSortMode } = useDevTools();

  const toggleIntentFilter = (type: OpportunityType) => {
    onIntentFiltersChange(
      intentFilters.includes(type) 
        ? intentFilters.filter(t => t !== type)
        : [...intentFilters, type]
    );
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="icon"
            className="rounded-full h-12 w-12 shadow-lg bg-background border-2"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-background">
          <DropdownMenuLabel>Dev Tools - Clients</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Data Mode
          </DropdownMenuLabel>
          <DropdownMenuItem 
            onClick={() => setDataViewMode('default')}
          >
            {dataViewMode === 'default' && '✓ '}Default View
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setDataViewMode('empty')}
          >
            {dataViewMode === 'empty' && '✓ '}Empty State
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setDataViewMode('few')}
          >
            {dataViewMode === 'few' && '✓ '}Few Clients (5)
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setDataViewMode('many')}
          >
            {dataViewMode === 'many' && '✓ '}Many Clients (50+)
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Hidden Filters
          </DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={showOpportunityFilter}
            onCheckedChange={onShowOpportunityFilterChange}
          >
            Show Opportunity Filter
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={showPerPageControl}
            onCheckedChange={onShowPerPageControlChange}
          >
            Show Per Page Control
          </DropdownMenuCheckboxItem>
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Sort Mode
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setSortMode('button')}>
            {sortMode === 'button' && '✓ '}Sort Button + Count
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setSortMode('header')}>
            {sortMode === 'header' && '✓ '}Table Header Sorting
          </DropdownMenuItem>
          
          {showOpportunityFilter && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                Opportunity Filter
              </DropdownMenuLabel>
              {(['buy', 'rent', 'sell', 'lease'] as OpportunityType[]).map(type => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={intentFilters.includes(type)}
                  onCheckedChange={() => toggleIntentFilter(type)}
                >
                  <div className="flex items-center gap-2 capitalize">
                    <OpportunityIcon type={type} className="w-5 h-5" />
                    {type}
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export type { DataViewMode };
