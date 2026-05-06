import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDevTools } from "@/contexts/dev-tools-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

export type ApiSimulationMode = 'success' | 'error';
export type OpportunityDisplayMode = 'default' | 'count-0' | 'count-1' | 'count-2' | 'count-5';
export type DescriptionMode = 'default' | 'none' | 'short' | 'long';
export type SourceMode = 'default' | 'self-created' | 'idealista' | 'fotocasa' | 'pisos' | 'huspy' | 'marketing-campaign' | 'ops-portal';
export type OpportunityCardMatchesMode = 'with-matches' | 'no-matches';
export type OpportunityCardImageMode = 'with-image' | 'with-multiple-images' | 'no-image';
export type OpportunityCardClientMode = 'with-client' | 'no-client';
// NewMatchesDisplayMode is now in dev-tools-context

interface ClientDetailsDevToolProps {
  apiMode: ApiSimulationMode;
  setApiMode: (mode: ApiSimulationMode) => void;
  opportunityMode: OpportunityDisplayMode;
  setOpportunityMode: (mode: OpportunityDisplayMode) => void;
  descriptionMode: DescriptionMode;
  setDescriptionMode: (mode: DescriptionMode) => void;
  sourceMode: SourceMode;
  setSourceMode: (mode: SourceMode) => void;
  devMode: boolean;
  setDevMode: (mode: boolean) => void;
  cardMatchesMode: OpportunityCardMatchesMode;
  setCardMatchesMode: (mode: OpportunityCardMatchesMode) => void;
  cardImageMode: OpportunityCardImageMode;
  setCardImageMode: (mode: OpportunityCardImageMode) => void;
  cardClientMode: OpportunityCardClientMode;
  setCardClientMode: (mode: OpportunityCardClientMode) => void;
}

export function ClientDetailsDevTool({
  apiMode, 
  setApiMode, 
  opportunityMode, 
  setOpportunityMode,
  descriptionMode,
  setDescriptionMode,
  sourceMode,
  setSourceMode,
  devMode,
  setDevMode,
  cardMatchesMode,
  setCardMatchesMode,
  cardImageMode,
  setCardImageMode,
  cardClientMode,
  setCardClientMode
}: ClientDetailsDevToolProps) {
  const { newMatchesDisplay, setNewMatchesDisplay } = useDevTools();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Dev Tool
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 max-h-80 overflow-y-auto">
        <DropdownMenuLabel>API Simulation</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => setApiMode('success')}
          className={apiMode === 'success' ? 'bg-accent' : ''}
        >
          API Success
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setApiMode('error')}
          className={apiMode === 'error' ? 'bg-accent' : ''}
        >
          API Error
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Opportunities Count</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => setOpportunityMode('default')}
          className={opportunityMode === 'default' ? 'bg-accent' : ''}
        >
          Default (All)
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setOpportunityMode('count-0')}
          className={opportunityMode === 'count-0' ? 'bg-accent' : ''}
        >
          0 Opportunities
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setOpportunityMode('count-1')}
          className={opportunityMode === 'count-1' ? 'bg-accent' : ''}
        >
          1 Opportunity
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setOpportunityMode('count-2')}
          className={opportunityMode === 'count-2' ? 'bg-accent' : ''}
        >
          2 Opportunities
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setOpportunityMode('count-5')}
          className={opportunityMode === 'count-5' ? 'bg-accent' : ''}
        >
          5 Opportunities
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Client Description</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => setDescriptionMode('default')}
          className={descriptionMode === 'default' ? 'bg-accent' : ''}
        >
          Default
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setDescriptionMode('none')}
          className={descriptionMode === 'none' ? 'bg-accent' : ''}
        >
          No Description
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setDescriptionMode('short')}
          className={descriptionMode === 'short' ? 'bg-accent' : ''}
        >
          Short Description
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setDescriptionMode('long')}
          className={descriptionMode === 'long' ? 'bg-accent' : ''}
        >
          Long Description
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Client Source</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => setSourceMode('default')}
          className={sourceMode === 'default' ? 'bg-accent' : ''}
        >
          Default
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setSourceMode('self-created')}
          className={sourceMode === 'self-created' ? 'bg-accent' : ''}
        >
          Self-created
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setSourceMode('idealista')}
          className={sourceMode === 'idealista' ? 'bg-accent' : ''}
        >
          Idealista
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setSourceMode('fotocasa')}
          className={sourceMode === 'fotocasa' ? 'bg-accent' : ''}
        >
          Fotocasa
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setSourceMode('pisos')}
          className={sourceMode === 'pisos' ? 'bg-accent' : ''}
        >
          Pisos.com
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setSourceMode('huspy')}
          className={sourceMode === 'huspy' ? 'bg-accent' : ''}
        >
          Huspy
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setSourceMode('marketing-campaign')}
          className={sourceMode === 'marketing-campaign' ? 'bg-accent' : ''}
        >
          Marketing campaign
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setSourceMode('ops-portal')}
          className={sourceMode === 'ops-portal' ? 'bg-accent' : ''}
        >
          OPS portal
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Opportunity Card</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => setCardMatchesMode(cardMatchesMode === 'with-matches' ? 'no-matches' : 'with-matches')}
          className={cardMatchesMode === 'with-matches' ? 'bg-accent' : ''}
        >
          {cardMatchesMode === 'with-matches' ? '✓ Show Matches' : 'Show Matches'}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setCardImageMode('with-image')}
          className={cardImageMode === 'with-image' ? 'bg-accent' : ''}
        >
          {cardImageMode === 'with-image' ? '✓ ' : ''}Single Image
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setCardImageMode('with-multiple-images')}
          className={cardImageMode === 'with-multiple-images' ? 'bg-accent' : ''}
        >
          {cardImageMode === 'with-multiple-images' ? '✓ ' : ''}Multiple Images
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setCardImageMode('no-image')}
          className={cardImageMode === 'no-image' ? 'bg-accent' : ''}
        >
          {cardImageMode === 'no-image' ? '✓ ' : ''}No Image
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setCardClientMode(cardClientMode === 'with-client' ? 'no-client' : 'with-client')}
          className={cardClientMode === 'with-client' ? 'bg-accent' : ''}
        >
          {cardClientMode === 'with-client' ? '✓ Show Client Details' : 'Show Client Details'}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel>New Matches Display</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setNewMatchesDisplay('tag')}
          className={newMatchesDisplay === 'tag' ? 'bg-accent' : ''}
        >
          {newMatchesDisplay === 'tag' ? '✓ ' : ''}Tag (New matches)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setNewMatchesDisplay('dot')}
          className={newMatchesDisplay === 'dot' ? 'bg-accent' : ''}
        >
          {newMatchesDisplay === 'dot' ? '✓ ' : ''}Red dot only
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={devMode}
          onCheckedChange={setDevMode}
        >
          Show Label Construction
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
