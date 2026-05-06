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

export type MyPropertiesMode = 'empty' | 'default' | 'many';
export type AddPropertyViewMode = 'modal' | 'fullscreen';
export type AddPropertyFlowMode = 'with-continue' | 'auto-advance';

interface MyPropertiesDevToolProps {
  mode: MyPropertiesMode;
  setMode: (mode: MyPropertiesMode) => void;
  addPropertyViewMode: AddPropertyViewMode;
  setAddPropertyViewMode: (mode: AddPropertyViewMode) => void;
  addPropertyFlowMode: AddPropertyFlowMode;
  setAddPropertyFlowMode: (mode: AddPropertyFlowMode) => void;
}

export function MyPropertiesDevTool({ 
  mode, 
  setMode,
  addPropertyViewMode,
  setAddPropertyViewMode,
  addPropertyFlowMode,
  setAddPropertyFlowMode,
}: MyPropertiesDevToolProps) {
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
          <DropdownMenuLabel>Dev Tools - My Properties</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Properties Mock Data
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setMode('empty')}>
            {mode === 'empty' && '✓ '}Empty State (No Properties)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setMode('default')}>
            {mode === 'default' && '✓ '}Default Properties
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setMode('many')}>
            {mode === 'many' && '✓ '}Many Properties
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Add Property View Mode
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setAddPropertyViewMode('modal')}>
            {addPropertyViewMode === 'modal' && '✓ '}Modal View
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setAddPropertyViewMode('fullscreen')}>
            {addPropertyViewMode === 'fullscreen' && '✓ '}Fullscreen View
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Add Property Flow Mode
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setAddPropertyFlowMode('with-continue')}>
            {addPropertyFlowMode === 'with-continue' && '✓ '}With Continue Button
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setAddPropertyFlowMode('auto-advance')}>
            {addPropertyFlowMode === 'auto-advance' && '✓ '}Auto-Advance (No Button)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
