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

export type PropertyStatus = 'draft' | 'in-review' | 'published' | 'rejected' | 'delisted';

export type SectionDataMode = 'complete' | 'partial' | 'empty';

export interface PropertyDetailsDevConfig {
  status: PropertyStatus;
  photosMode: 'many' | 'few' | 'none';
  hasPropertyType: boolean;
  hasAddress: boolean;
  hasPricing: boolean;
  hasDescription: boolean;
  hasFeatures: boolean;
  hasAdditionalInfo: boolean;
  hasDocuments: boolean;
  allowEditing: boolean; // Override locks for dev mode
}

interface MyPropertyDetailsDevToolProps {
  config: PropertyDetailsDevConfig;
  setConfig: (config: PropertyDetailsDevConfig) => void;
}

const presets: { label: string; config: Partial<PropertyDetailsDevConfig> }[] = [
  {
    label: 'Complete Property',
    config: {
      status: 'published',
      photosMode: 'many',
      hasPropertyType: true,
      hasAddress: true,
      hasPricing: true,
      hasDescription: true,
      hasFeatures: true,
      hasAdditionalInfo: true,
      hasDocuments: true,
    },
  },
  {
    label: 'Empty Draft',
    config: {
      status: 'draft',
      photosMode: 'none',
      hasPropertyType: false,
      hasAddress: false,
      hasPricing: false,
      hasDescription: false,
      hasFeatures: false,
      hasAdditionalInfo: false,
      hasDocuments: false,
    },
  },
  {
    label: 'Partial Draft',
    config: {
      status: 'draft',
      photosMode: 'few',
      hasPropertyType: true,
      hasAddress: true,
      hasPricing: false,
      hasDescription: false,
      hasFeatures: true,
      hasAdditionalInfo: false,
      hasDocuments: false,
    },
  },
  {
    label: 'In Review',
    config: {
      status: 'in-review',
      photosMode: 'many',
      hasPropertyType: true,
      hasAddress: true,
      hasPricing: true,
      hasDescription: true,
      hasFeatures: true,
      hasAdditionalInfo: true,
      hasDocuments: true,
    },
  },
  {
    label: 'Rejected',
    config: {
      status: 'rejected',
      photosMode: 'many',
      hasPropertyType: true,
      hasAddress: true,
      hasPricing: true,
      hasDescription: true,
      hasFeatures: true,
      hasAdditionalInfo: false,
      hasDocuments: false,
    },
  },
  {
    label: 'Delisted',
    config: {
      status: 'delisted',
      photosMode: 'many',
      hasPropertyType: true,
      hasAddress: true,
      hasPricing: true,
      hasDescription: true,
      hasFeatures: true,
      hasAdditionalInfo: true,
      hasDocuments: true,
    },
  },
];

export function MyPropertyDetailsDevTool({ config, setConfig }: MyPropertyDetailsDevToolProps) {
  const updateConfig = (updates: Partial<PropertyDetailsDevConfig>) => {
    setConfig({ ...config, ...updates });
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
        <DropdownMenuContent align="end" className="w-72 bg-background max-h-[80vh] overflow-y-auto">
          <DropdownMenuLabel>Dev Tools - Property Details</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Presets */}
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Quick Presets
          </DropdownMenuLabel>
          {presets.map((preset) => (
            <DropdownMenuItem
              key={preset.label}
              onClick={() => updateConfig(preset.config)}
            >
              {preset.label}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          {/* Status */}
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Property Status
          </DropdownMenuLabel>
          {(['draft', 'in-review', 'published', 'rejected', 'delisted'] as PropertyStatus[]).map((status) => (
            <DropdownMenuItem
              key={status}
              onClick={() => updateConfig({ status })}
            >
              {config.status === status && '✓ '}
              {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          {/* Photos */}
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Photos
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={() => updateConfig({ photosMode: 'many' })}>
            {config.photosMode === 'many' && '✓ '}Many Photos (12)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => updateConfig({ photosMode: 'few' })}>
            {config.photosMode === 'few' && '✓ '}Few Photos (3)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => updateConfig({ photosMode: 'none' })}>
            {config.photosMode === 'none' && '✓ '}No Photos
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Sections */}
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Sections Data
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={() => updateConfig({ hasPropertyType: !config.hasPropertyType })}>
            {config.hasPropertyType ? '✓ ' : '○ '}Property Type
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => updateConfig({ hasAddress: !config.hasAddress })}>
            {config.hasAddress ? '✓ ' : '○ '}Address
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => updateConfig({ hasPricing: !config.hasPricing })}>
            {config.hasPricing ? '✓ ' : '○ '}Pricing
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => updateConfig({ hasDescription: !config.hasDescription })}>
            {config.hasDescription ? '✓ ' : '○ '}Description
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => updateConfig({ hasFeatures: !config.hasFeatures })}>
            {config.hasFeatures ? '✓ ' : '○ '}Features
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => updateConfig({ hasAdditionalInfo: !config.hasAdditionalInfo })}>
            {config.hasAdditionalInfo ? '✓ ' : '○ '}Additional Info
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => updateConfig({ hasDocuments: !config.hasDocuments })}>
            {config.hasDocuments ? '✓ ' : '○ '}Documents
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Dev Mode Options */}
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Dev Mode Options
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={() => updateConfig({ allowEditing: !config.allowEditing })}>
            {config.allowEditing ? '✓ ' : '○ '}Allow editing (override locks)
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Quick toggles */}
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Quick Actions
          </DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() =>
              updateConfig({
                hasPropertyType: true,
                hasAddress: true,
                hasPricing: true,
                hasDescription: true,
                hasFeatures: true,
                hasAdditionalInfo: true,
                hasDocuments: true,
                photosMode: 'many',
              })
            }
          >
            Fill All Sections
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              updateConfig({
                hasPropertyType: false,
                hasAddress: false,
                hasPricing: false,
                hasDescription: false,
                hasFeatures: false,
                hasAdditionalInfo: false,
                hasDocuments: false,
                photosMode: 'none',
              })
            }
          >
            Clear All Sections
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
