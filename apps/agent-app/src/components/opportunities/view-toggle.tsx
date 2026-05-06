import { LayoutGrid, LayoutList, List } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type ViewMode = 'card-horizontal' | 'card-vertical' | 'table';

interface ViewToggleProps {
  value: ViewMode;
  onValueChange: (value: ViewMode) => void;
  /** Show only card-vertical and table options */
  simple?: boolean;
}

export function ViewToggle({ value, onValueChange, simple }: ViewToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(val) => val && onValueChange(val as ViewMode)}
      className="border rounded-lg p-1"
    >
      {!simple && (
        <ToggleGroupItem value="card-horizontal" aria-label="Horizontal cards" size="sm">
          <LayoutList className="h-4 w-4" />
        </ToggleGroupItem>
      )}
      <ToggleGroupItem value="card-vertical" aria-label="Vertical cards" size="sm">
        <LayoutGrid className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="table" aria-label="Table view" size="sm">
        <List className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
