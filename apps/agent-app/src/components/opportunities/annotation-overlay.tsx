import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Annotation {
  id: string;
  label: string;
  description: string;
  position: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  linePosition: {
    start: { x: string; y: string };
    end: { x: string; y: string };
  };
  align?: 'left' | 'right';
}

interface AnnotationOverlayProps {
  onClose: () => void;
}

export function AnnotationOverlay({ onClose }: AnnotationOverlayProps) {
  const annotations: Annotation[] = [
    {
      id: 'top-header',
      label: 'Top header',
      description: 'Back - Add - More options',
      position: { top: '2%', right: '5%' },
      linePosition: {
        start: { x: '82%', y: '3%' },
        end: { x: '90%', y: '3%' }
      },
      align: 'right'
    },
    {
      id: 'intent-label',
      label: 'Intent label',
      description: 'Visual indicator of the opportunity type (Buy/Rent/Sell/Lease)',
      position: { top: '10%', left: '5%' },
      linePosition: {
        start: { x: '20%', y: '12%' },
        end: { x: '13%', y: '12%' }
      },
      align: 'left'
    },
    {
      id: 'opportunity-name',
      label: 'Opportunity name',
      description: 'Intent + type + location',
      position: { top: '10%', right: '5%' },
      linePosition: {
        start: { x: '82%', y: '12%' },
        end: { x: '50%', y: '12%' }
      },
      align: 'right'
    },
    {
      id: 'client-access',
      label: 'Client access',
      description: 'Minimised access to client. If tappable opens the bottom sheet',
      position: { top: '18%', left: '5%' },
      linePosition: {
        start: { x: '20%', y: '19%' },
        end: { x: '13%', y: '19%' }
      },
      align: 'left'
    },
    {
      id: 'core-preferences',
      label: 'Core preferences',
      description: 'Exposed min. pref for quick access makes it both informative and functional',
      position: { top: '24%', left: '5%' },
      linePosition: {
        start: { x: '20%', y: '25%' },
        end: { x: '13%', y: '25%' }
      },
      align: 'left'
    },
    {
      id: 'view-all-preferences',
      label: 'View all preferences',
      description: 'Opens screen where you have the full list of preferences',
      position: { top: '24%', right: '5%' },
      linePosition: {
        start: { x: '82%', y: '25%' },
        end: { x: '73%', y: '25%' }
      },
      align: 'right'
    },
    {
      id: 'segmented-control',
      label: 'Segmented control WIP',
      description: 'Properties / Tasks / Visits or Properties / Activity',
      position: { top: '32%', right: '5%' },
      linePosition: {
        start: { x: '82%', y: '33%' },
        end: { x: '40%', y: '33%' }
      },
      align: 'right'
    },
    {
      id: 'matches-banner',
      label: 'Adaptive Immersive matches card',
      description: 'Indication of number of matches, new ones, and copy to indicate saved properties connection and mechanic',
      position: { top: '42%', left: '5%' },
      linePosition: {
        start: { x: '20%', y: '46%' },
        end: { x: '30%', y: '46%' }
      },
      align: 'left'
    },
    {
      id: 'info-icon',
      label: 'Info icon',
      description: "If still unsure about the section, we can have an info icon that'd open a sheet with detailed explanation",
      position: { top: '54%', right: '5%' },
      linePosition: {
        start: { x: '82%', y: '55%' },
        end: { x: '40%', y: '55%' }
      },
      align: 'right'
    },
    {
      id: 'saved-properties',
      label: 'Saved properties section',
      description: 'In order to create the visual connection and solidify the logic, we need a title for the section',
      position: { top: '54%', left: '5%' },
      linePosition: {
        start: { x: '20%', y: '55%' },
        end: { x: '13%', y: '55%' }
      },
      align: 'left'
    },
    {
      id: 'property-card',
      label: 'Dynamic property card',
      description: 'Reworked the card based on insights from research and testing. More functional card, closer to opportunity card, with dynamic action and information based on status etc.',
      position: { bottom: '18%', right: '5%' },
      linePosition: {
        start: { x: '82%', y: '72%' },
        end: { x: '50%', y: '72%' }
      },
      align: 'right'
    },
    {
      id: 'entry-point',
      label: 'Entry point to search',
      description: "We don't want this to be prominent, we want to guide them to use matches",
      position: { bottom: '8%', left: '5%' },
      linePosition: {
        start: { x: '20%', y: '88%' },
        end: { x: '50%', y: '88%' }
      },
      align: 'left'
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px]" />
      
      {/* SVG for connecting lines */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
        <defs>
          <marker
            id="dot"
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="6"
            markerHeight="6"
          >
            <circle cx="5" cy="5" r="4" fill="#ef4444" />
          </marker>
        </defs>
        {annotations.map((annotation) => (
          <line
            key={`line-${annotation.id}`}
            x1={annotation.linePosition.start.x}
            y1={annotation.linePosition.start.y}
            x2={annotation.linePosition.end.x}
            y2={annotation.linePosition.end.y}
            stroke="#ef4444"
            strokeWidth="2"
            markerEnd="url(#dot)"
          />
        ))}
      </svg>

      {/* Annotations */}
      {annotations.map((annotation) => (
        <div
          key={annotation.id}
          className="absolute pointer-events-auto"
          style={annotation.position}
        >
          <div 
            className={`bg-card border-2 border-destructive rounded-lg p-3 shadow-xl max-w-xs ${
              annotation.align === 'right' ? 'text-right' : 'text-left'
            }`}
          >
            <h3 className="font-semibold text-sm mb-1 text-destructive">
              {annotation.label}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {annotation.description}
            </p>
          </div>
        </div>
      ))}

      {/* Close button */}
      <div className="absolute top-4 right-4 pointer-events-auto">
        <Button
          onClick={onClose}
          size="icon"
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Instructions at bottom */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto">
        <div className="bg-card border-2 border-destructive rounded-lg px-4 py-2 shadow-xl">
          <p className="text-sm font-medium text-center">
            Component Annotation Mode - Click X to exit
          </p>
        </div>
      </div>
    </div>
  );
}
