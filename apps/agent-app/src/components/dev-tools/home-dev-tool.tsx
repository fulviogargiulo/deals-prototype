import { useState } from "react";
import { useDevTools } from "@/contexts/dev-tools-context";
import { Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ScheduleDisplayMode, OverdueDisplayMode } from "@/components/schedule/activity-widget";
import { DataViewMode } from "@/contexts/data-context";
import { PropertiesLayoutMode, ViewAllMode } from "@/components/home/new-properties-grid";
import { OpportunitiesLayoutMode, TableFilterStyle } from "@/components/home/opportunity-type-grid";

export type ActionCardCount = 0 | 1 | 3 | 5;
export type HomeLayoutVariant = 'stacked' | 'two-column' | 'sidebar' | 'compact';
export type HomeHeaderVariant = 'full-gradient' | 'compact-bar' | 'compact-box';
export type GreetingOverride = 'auto' | 'morning' | 'afternoon' | 'evening';
export type PropertiesDisplayMode = 'show' | 'empty' | 'hidden';

interface HomeDevToolProps {
  scheduleDisplayMode: ScheduleDisplayMode;
  setScheduleDisplayMode: (mode: ScheduleDisplayMode) => void;
  overdueDisplayMode: OverdueDisplayMode;
  setOverdueDisplayMode: (mode: OverdueDisplayMode) => void;
  dataViewMode: DataViewMode;
  setDataViewMode: (mode: DataViewMode) => void;
  actionCardCount: ActionCardCount;
  setActionCardCount: (count: ActionCardCount) => void;
  showSchedule: boolean;
  setShowSchedule: (show: boolean) => void;
  showNewProperties: PropertiesDisplayMode;
  setShowNewProperties: (mode: PropertiesDisplayMode) => void;
  layoutVariant: HomeLayoutVariant;
  setLayoutVariant: (variant: HomeLayoutVariant) => void;
  headerVariant: HomeHeaderVariant;
  setHeaderVariant: (variant: HomeHeaderVariant) => void;
  propertiesLayoutMode: PropertiesLayoutMode;
  setPropertiesLayoutMode: (mode: PropertiesLayoutMode) => void;
  viewAllMode: ViewAllMode;
  setViewAllMode: (mode: ViewAllMode) => void;
  opportunitiesLayoutMode: OpportunitiesLayoutMode;
  setOpportunitiesLayoutMode: (mode: OpportunitiesLayoutMode) => void;
  tableFilterStyle: TableFilterStyle;
  setTableFilterStyle: (style: TableFilterStyle) => void;
  greetingOverride: GreetingOverride;
  setGreetingOverride: (override: GreetingOverride) => void;
  onOpenInquiry?: (scenario: InquiryScenario) => void;
}

export type InquiryScenario = '0-props' | '1-prop' | '3-props' | 'expired';

const layoutVariantOptions: { value: HomeLayoutVariant; label: string }[] = [
  { value: 'stacked', label: 'Stacked' },
  { value: 'two-column', label: '2-Col' },
  { value: 'sidebar', label: 'Sidebar' },
  { value: 'compact', label: 'Compact' },
];

const headerVariantOptions: { value: HomeHeaderVariant; label: string }[] = [
  { value: 'full-gradient', label: 'Full' },
  { value: 'compact-bar', label: 'Bar' },
  { value: 'compact-box', label: 'Box' },
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

const actionCardCountOptions: { value: ActionCardCount; label: string }[] = [
  { value: 0, label: '0' },
  { value: 1, label: '1' },
  { value: 3, label: '3' },
  { value: 5, label: '5' },
];

const scheduleOptions: { value: ScheduleDisplayMode; label: string }[] = [
  { value: 'empty', label: 'Empty' },
  { value: 'few', label: 'Few' },
  { value: 'many', label: 'Many' },
];

const overdueOptions: { value: OverdueDisplayMode; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'some', label: 'Some' },
];

const dataViewOptions: { value: DataViewMode; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'empty', label: 'Empty' },
  { value: 'few', label: 'Few' },
  { value: 'many', label: 'Many' },
];

const opportunitiesLayoutOptions: { value: OpportunitiesLayoutMode; label: string }[] = [
  { value: 'cards', label: 'Cards' },
  { value: 'rich-cards', label: 'Rich' },
  { value: 'pills', label: 'Pills' },
  { value: 'bar', label: 'Bar' },
  { value: 'stacked', label: 'Stacked' },
  { value: 'mini-grid', label: 'Mini' },
  { value: 'table', label: 'Table' },
];

const tableFilterStyleOptions: { value: TableFilterStyle; label: string }[] = [
  { value: 'cards', label: 'Cards' },
  { value: 'pills', label: 'Pills' },
];

const propertiesLayoutOptions: { value: PropertiesLayoutMode; label: string }[] = [
  { value: 'grid', label: 'Grid' },
  { value: 'carousel', label: 'Carousel' },
  { value: 'featured', label: 'Featured' },
  { value: 'compact', label: 'Compact' },
];

const viewAllOptions: { value: ViewAllMode; label: string }[] = [
  { value: 'header', label: 'Header' },
  { value: 'card', label: 'Card' },
];

const greetingOptions: { value: GreetingOverride; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'morning', label: 'AM' },
  { value: 'afternoon', label: 'PM' },
  { value: 'evening', label: 'Eve' },
];

export function HomeDevTool({
  scheduleDisplayMode,
  setScheduleDisplayMode,
  overdueDisplayMode,
  setOverdueDisplayMode,
  dataViewMode,
  setDataViewMode,
  actionCardCount,
  setActionCardCount,
  showSchedule,
  setShowSchedule,
  showNewProperties,
  setShowNewProperties,
  layoutVariant,
  setLayoutVariant,
  headerVariant,
  setHeaderVariant,
  propertiesLayoutMode,
  setPropertiesLayoutMode,
  viewAllMode,
  setViewAllMode,
  opportunitiesLayoutMode,
  setOpportunitiesLayoutMode,
  tableFilterStyle,
  setTableFilterStyle,
  greetingOverride,
  setGreetingOverride,
  onOpenInquiry,
}: HomeDevToolProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { newMatchesDisplay, setNewMatchesDisplay } = useDevTools();

  const newMatchesOptions: { value: 'tag' | 'dot'; label: string }[] = [
    { value: 'tag', label: 'Tag' },
    { value: 'dot', label: 'Dot' },
  ];

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="shadow-lg"
        >
          <Settings className="w-4 h-4 mr-2" />
          Dev Tool
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-72 shadow-xl overflow-hidden max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Dev Tool — Home</span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {/* Page Layout */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Page Layout</label>
            <SegmentedControl options={layoutVariantOptions} value={layoutVariant} onChange={setLayoutVariant} />
          </div>

          {/* Header Style */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Header Style</label>
            <SegmentedControl options={headerVariantOptions} value={headerVariant} onChange={setHeaderVariant} />
          </div>

          {/* Opportunities Layout */}
          <div className="space-y-2 pt-2 border-t">
            <label className="text-xs font-medium text-muted-foreground">Opportunities Layout</label>
            <SegmentedControl options={opportunitiesLayoutOptions} value={opportunitiesLayoutMode} onChange={setOpportunitiesLayoutMode} wrap />
          </div>

          {/* Greeting Override */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Greeting</label>
            <SegmentedControl options={greetingOptions} value={greetingOverride} onChange={setGreetingOverride} />
          </div>

          {/* Action Cards */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Action Cards</label>
            <SegmentedControl options={actionCardCountOptions} value={actionCardCount} onChange={setActionCardCount} />
          </div>

          {/* Table Filter Style */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Table Filter Style</label>
            <SegmentedControl options={tableFilterStyleOptions} value={tableFilterStyle} onChange={setTableFilterStyle} />
          </div>

          {/* Data Density */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Opportunities Data</label>
            <SegmentedControl
              options={[
                ...dataViewOptions,
              ]}
              value={dataViewMode}
              onChange={setDataViewMode}
            />
          </div>

          {/* Sections Visibility */}
          <div className="space-y-2 pt-2 border-t">
            <label className="text-xs font-medium text-muted-foreground">Sections</label>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">My Schedule</span>
              <Switch checked={showSchedule} onCheckedChange={setShowSchedule} />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">New in Madrid</span>
              <SegmentedControl
                options={[
                  { value: 'show' as PropertiesDisplayMode, label: 'Show' },
                  { value: 'empty' as PropertiesDisplayMode, label: 'Empty' },
                  { value: 'hidden' as PropertiesDisplayMode, label: 'Hidden' },
                ]}
                value={showNewProperties}
                onChange={setShowNewProperties}
              />
            </div>
          </div>

          {/* Properties Layout */}
          <div className="space-y-2 pt-2 border-t">
            <label className="text-xs font-medium text-muted-foreground">Properties Layout</label>
            <SegmentedControl options={propertiesLayoutOptions} value={propertiesLayoutMode} onChange={setPropertiesLayoutMode} />
          </div>

          {/* View All Mode */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">"View All" Position</label>
            <SegmentedControl options={viewAllOptions} value={viewAllMode} onChange={setViewAllMode} />
          </div>

          {/* Schedule Settings */}
          <div className="space-y-2 pt-2 border-t">
            <label className="text-xs font-medium text-muted-foreground">Schedule Display</label>
            <SegmentedControl options={scheduleOptions} value={scheduleDisplayMode} onChange={setScheduleDisplayMode} />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Overdue Tasks</label>
            <SegmentedControl options={overdueOptions} value={overdueDisplayMode} onChange={setOverdueDisplayMode} />
          </div>

          {/* New Matches Display */}
          <div className="space-y-2 pt-2 border-t">
            <label className="text-xs font-medium text-muted-foreground">New Matches Display</label>
            <SegmentedControl options={newMatchesOptions} value={newMatchesDisplay} onChange={setNewMatchesDisplay} />
          </div>

          {/* Inquiry Modal */}
          <div className="space-y-2 pt-2 border-t">
            <label className="text-xs font-medium text-muted-foreground">Inquiry Modal</label>
            <div className="grid grid-cols-2 gap-1.5">
              <Button variant="outline" size="sm" className="text-[10px] px-1" onClick={() => onOpenInquiry?.('0-props')}>
                0 Props
              </Button>
              <Button variant="outline" size="sm" className="text-[10px] px-1" onClick={() => onOpenInquiry?.('1-prop')}>
                1 Prop
              </Button>
              <Button variant="outline" size="sm" className="text-[10px] px-1" onClick={() => onOpenInquiry?.('3-props')}>
                3 Props
              </Button>
              <Button variant="outline" size="sm" className="text-[10px] px-1" onClick={() => onOpenInquiry?.('expired')}>
                Expired
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
