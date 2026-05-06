import { useState } from "react";
import { Settings, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { OpportunityType, PropertyStatus } from "@/types";
import { cn } from "@/lib/utils";
import { useDevTools } from "@/contexts/dev-tools-context";

export type SavedCount = number;
export type MatchCountOption = 0 | 3 | 7 | 12;
export type NewMatchOption = 0 | 1 | 3 | 5;
export type LayoutVariant = 'current' | 'two-column-left' | 'two-column-right' | 'compact-wide';
export type HeaderVariant = 'full-gradient' | 'compact-bar';

interface OpportunityDetailsDevToolProps {
  opportunityType: OpportunityType;
  setOpportunityType: (type: OpportunityType) => void;
  hasPropertyAssigned: boolean;
  setHasPropertyAssigned: (value: boolean) => void;
  hasPreferencesAdded: boolean;
  setHasPreferencesAdded: (value: boolean) => void;
  savedCount: SavedCount;
  setSavedCount: (count: SavedCount) => void;
  matchCount: number;
  setMatchCount: (count: number) => void;
  newMatchCount: number;
  setNewMatchCount: (count: number) => void;
  propertyStatus: PropertyStatus;
  setPropertyStatus: (status: PropertyStatus) => void;
  isClosed?: boolean;
  setIsClosed?: (value: boolean) => void;
  layoutVariant: LayoutVariant;
  setLayoutVariant: (variant: LayoutVariant) => void;
  headerVariant: HeaderVariant;
  setHeaderVariant: (variant: HeaderVariant) => void;
}

const opportunityTypes: { value: OpportunityType; label: string }[] = [
  { value: 'buy', label: 'Buy' },
  { value: 'rent', label: 'Rent' },
  { value: 'sell', label: 'Sell' },
  { value: 'lease', label: 'Lease' },
];

const savedCountOptions: { value: number; label: string }[] = [
  { value: 0, label: '0' },
  { value: 1, label: '1' },
  { value: 5, label: '5' },
  { value: 10, label: '10' },
  { value: 15, label: '15' },
  { value: 25, label: '25' },
];

const matchCountOptions: { value: MatchCountOption; label: string }[] = [
  { value: 0, label: '0' },
  { value: 3, label: '3' },
  { value: 7, label: '7' },
  { value: 12, label: '12' },
];

const newMatchOptions: { value: NewMatchOption; label: string }[] = [
  { value: 0, label: '0' },
  { value: 1, label: '1' },
  { value: 3, label: '3' },
  { value: 5, label: '5' },
];

const propertyStatusOptions: { value: PropertyStatus; label: string }[] = [
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'in-review', label: 'Review' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'delisted', label: 'Delisted' },
];

const layoutVariantOptions: { value: LayoutVariant; label: string }[] = [
  { value: 'current', label: 'Original' },
  { value: 'two-column-left', label: 'Sidebar L' },
  { value: 'two-column-right', label: 'Sidebar R' },
  { value: 'compact-wide', label: 'Compact' },
];

const headerVariantOptions: { value: HeaderVariant; label: string }[] = [
  { value: 'full-gradient', label: 'Full Gradient' },
  { value: 'compact-bar', label: 'Compact Bar' },
];

function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  wrap = false,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  wrap?: boolean;
}) {
  return (
    <div className={cn(
      "bg-muted rounded-lg p-1 gap-1",
      wrap ? "grid grid-cols-3" : "flex"
    )}>
      {options.map((option) => (
        <button
          key={String(option.value)}
          onClick={() => onChange(option.value)}
          className={cn(
            "px-2 py-1 text-xs font-medium rounded-md transition-colors text-center",
            !wrap && "flex-1",
            value === option.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function OpportunityDetailsDevTool({
  opportunityType,
  setOpportunityType,
  hasPropertyAssigned,
  setHasPropertyAssigned,
  hasPreferencesAdded,
  setHasPreferencesAdded,
  savedCount,
  setSavedCount,
  matchCount,
  setMatchCount,
  newMatchCount,
  setNewMatchCount,
  propertyStatus,
  setPropertyStatus,
  isClosed,
  setIsClosed,
  layoutVariant,
  setLayoutVariant,
  headerVariant,
  setHeaderVariant,
}: OpportunityDetailsDevToolProps) {
  const { forceNotesEmpty, setForceNotesEmpty } = useDevTools();
  const [isOpen, setIsOpen] = useState(false);
  const isSellOrLease = opportunityType === 'sell' || opportunityType === 'lease';
  const isBuyOrRent = opportunityType === 'buy' || opportunityType === 'rent';

  if (!isOpen) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsOpen(true)}
        className="shadow-lg"
      >
        <Settings className="w-4 h-4 mr-2" />
        Dev Tool
      </Button>
    );
  }

  return (
    <Card className="w-72 shadow-xl overflow-hidden max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Dev Tool</span>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7" 
          onClick={() => setIsOpen(false)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Layout Variant */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Page Layout</label>
          <SegmentedControl
            options={layoutVariantOptions}
            value={layoutVariant}
            onChange={setLayoutVariant}
          />
        </div>

        {/* Header Variant */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Header Style</label>
          <SegmentedControl
            options={headerVariantOptions}
            value={headerVariant}
            onChange={setHeaderVariant}
          />
        </div>

        {/* Opportunity Type */}
        <div className="space-y-2 pt-2 border-t">
          <label className="text-xs font-medium text-muted-foreground">Opportunity Type</label>
          <SegmentedControl
            options={opportunityTypes}
            value={opportunityType}
            onChange={setOpportunityType}
          />
        </div>

        {/* Property Assigned (Sell/Lease only) */}
        {isSellOrLease && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">Property/Preferences Assigned</label>
              <Switch 
                checked={hasPropertyAssigned}
                onCheckedChange={setHasPropertyAssigned}
              />
            </div>
            {hasPropertyAssigned && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Property Status</label>
                <SegmentedControl
                  options={propertyStatusOptions}
                  value={propertyStatus}
                  onChange={setPropertyStatus}
                  wrap
                />
              </div>
            )}
          </div>
        )}

        {/* Preferences Added (Buy/Rent only) */}
        {isBuyOrRent && (
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">Preferences Added</label>
            <Switch 
              checked={hasPreferencesAdded}
              onCheckedChange={setHasPreferencesAdded}
            />
          </div>
        )}

        {/* Matches Banner */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Matches</label>
          <SegmentedControl
            options={matchCountOptions}
            value={matchCount as MatchCountOption}
            onChange={setMatchCount}
          />
        </div>

        {/* New Matches */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">New Matches</label>
          <SegmentedControl
            options={newMatchOptions}
            value={newMatchCount as NewMatchOption}
            onChange={setNewMatchCount}
          />
        </div>

        {/* Saved Count */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Saved {isSellOrLease ? 'Buyers' : 'Properties'}
          </label>
          <SegmentedControl
            options={savedCountOptions}
            value={savedCount}
            onChange={setSavedCount}
          />
        </div>

        {/* Deal Closed Toggle */}
        {setIsClosed && (
          <div className="flex items-center justify-between pt-2 border-t">
            <label className="text-xs font-medium text-muted-foreground">Deal Closed</label>
            <Switch 
              checked={isClosed ?? false}
              onCheckedChange={setIsClosed}
            />
          </div>
        )}

        {/* Notes Empty State Toggle */}
        <div className="flex items-center justify-between pt-2 border-t">
          <label className="text-xs font-medium text-muted-foreground">Notes Empty State</label>
          <Switch 
            checked={forceNotesEmpty}
            onCheckedChange={setForceNotesEmpty}
          />
        </div>
      </div>
    </Card>
  );
}
