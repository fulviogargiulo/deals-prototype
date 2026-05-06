import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

export type MatchViewMode = 'properties' | 'clients';
export type PreviewMode = 'expand' | 'modal';
export type LayoutMode = 'carousel' | 'table';

interface MatchesDevToolProps {
  viewMode: MatchViewMode;
  setViewMode: (mode: MatchViewMode) => void;
  previewMode: PreviewMode;
  setPreviewMode: (mode: PreviewMode) => void;
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  showShareAction: boolean;
  setShowShareAction: (enabled: boolean) => void;
  showBulkActions: boolean;
  setShowBulkActions: (enabled: boolean) => void;
  showHoverActions: boolean;
  setShowHoverActions: (enabled: boolean) => void;
}

export function MatchesDevTool({
  viewMode,
  setViewMode,
  previewMode,
  setPreviewMode,
  layoutMode,
  setLayoutMode,
  showShareAction,
  setShowShareAction,
  showBulkActions,
  setShowBulkActions,
  showHoverActions,
  setShowHoverActions,
}: MatchesDevToolProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-zinc-800">
          <Settings className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Matches Dev Tools</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Layout Mode
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={layoutMode}
          onValueChange={(v) => setLayoutMode(v as LayoutMode)}
        >
          <DropdownMenuRadioItem value="table">Table (List View)</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="carousel">Carousel (Horizontal List)</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Match Type
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={viewMode}
          onValueChange={(v) => setViewMode(v as MatchViewMode)}
        >
          <DropdownMenuRadioItem value="properties">Properties</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="clients">Clients</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Preview Mode
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={previewMode}
          onValueChange={(v) => setPreviewMode(v as PreviewMode)}
        >
          <DropdownMenuRadioItem value="expand">Expand Card</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="modal">Modal</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Experimental
        </DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={showShareAction}
          onCheckedChange={setShowShareAction}
        >
          Share action in table rows
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={showBulkActions}
          onCheckedChange={setShowBulkActions}
        >
          Bulk actions in table view
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={showHoverActions}
          onCheckedChange={setShowHoverActions}
        >
          Show CTAs on hover
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}