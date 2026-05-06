import { LayoutGrid, List, Map } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type ViewMode = 'card' | 'list' | 'map';

interface ViewToggleProps {
  value: ViewMode;
  onValueChange: (value: ViewMode) => void;
  showMapOption?: boolean;
}

export function ViewToggle({ value, onValueChange, showMapOption = false }: ViewToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(val) => val && onValueChange(val as ViewMode)}
      className="border rounded-lg p-1"
    >
      <ToggleGroupItem value="card" aria-label="Card view" size="sm">
        <LayoutGrid className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="list" aria-label="List view" size="sm">
        <List className="h-4 w-4" />
      </ToggleGroupItem>
      {showMapOption && (
        <ToggleGroupItem value="map" aria-label="Map view" size="sm">
          <Map className="h-4 w-4" />
        </ToggleGroupItem>
      )}
    </ToggleGroup>
  );
}
