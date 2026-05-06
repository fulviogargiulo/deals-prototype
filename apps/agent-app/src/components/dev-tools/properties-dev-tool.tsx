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

export type PropertyTypeMode = 'default' | 'apartments' | 'penthouses' | 'houses' | 'commercial' | 'mixed' | 'many';
export type CarouselStyleMode = 'current' | 'alternative';

interface PropertiesDevToolProps {
  propertyTypeMode: PropertyTypeMode;
  setPropertyTypeMode: (mode: PropertyTypeMode) => void;
  carouselStyleMode: CarouselStyleMode;
  setCarouselStyleMode: (mode: CarouselStyleMode) => void;
}

export function PropertiesDevTool({ 
  propertyTypeMode, 
  setPropertyTypeMode,
  carouselStyleMode,
  setCarouselStyleMode,
}: PropertiesDevToolProps) {
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
          <DropdownMenuLabel>Dev Tools - Properties</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Property Mock Data
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setPropertyTypeMode('default')}>
            {propertyTypeMode === 'default' && '✓ '}Default (Current Data)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setPropertyTypeMode('apartments')}>
            {propertyTypeMode === 'apartments' && '✓ '}Show Apartments Only
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setPropertyTypeMode('penthouses')}>
            {propertyTypeMode === 'penthouses' && '✓ '}Show Penthouses Only
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setPropertyTypeMode('houses')}>
            {propertyTypeMode === 'houses' && '✓ '}Show Houses Only
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setPropertyTypeMode('commercial')}>
            {propertyTypeMode === 'commercial' && '✓ '}Show Commercial Only
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setPropertyTypeMode('mixed')}>
            {propertyTypeMode === 'mixed' && '✓ '}Show Mixed Types
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Lazy Loading Test
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setPropertyTypeMode('many')}>
            {propertyTypeMode === 'many' && '✓ '}Generate 100+ Properties
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Carousel Styling
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setCarouselStyleMode('current')}>
            {carouselStyleMode === 'current' && '✓ '}Current Style
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setCarouselStyleMode('alternative')}>
            {carouselStyleMode === 'alternative' && '✓ '}Alternative Style
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
