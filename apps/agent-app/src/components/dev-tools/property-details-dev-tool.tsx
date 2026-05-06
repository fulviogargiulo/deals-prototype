import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type PropertyOwnershipMode = 'not-owned' | 'owned';

interface PropertyDetailsDevToolProps {
  ownershipMode: PropertyOwnershipMode;
  setOwnershipMode: (mode: PropertyOwnershipMode) => void;
}

export function PropertyDetailsDevTool({ 
  ownershipMode, 
  setOwnershipMode,
}: PropertyDetailsDevToolProps) {
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
        <DropdownMenuContent align="end" className="w-64 bg-background">
          <DropdownMenuLabel>Dev Tools - Property Details</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Property Ownership
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setOwnershipMode('not-owned')}>
            {ownershipMode === 'not-owned' && '✓ '}Not owned by agent
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOwnershipMode('owned')}>
            {ownershipMode === 'owned' && '✓ '}Owned by agent (your listing)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
