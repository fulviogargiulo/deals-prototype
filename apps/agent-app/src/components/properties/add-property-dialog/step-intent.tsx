import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PropertyDraftData } from "./types";
import { getOpportunityConfig } from "@/components/opportunities/opportunity-icon";

interface StepIntentProps {
  data: PropertyDraftData;
  onUpdate: (updates: Partial<PropertyDraftData>) => void;
}

const intentOptions = [
  {
    id: 'sell' as const,
    description: 'Client has a property for sale',
  },
  {
    id: 'lease' as const,
    description: 'Client has a property for rent',
  },
];

export function StepIntent({ data, onUpdate }: StepIntentProps) {
  const [titleVisible, setTitleVisible] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);

  // Staggered animation on mount
  useEffect(() => {
    const titleTimer = setTimeout(() => setTitleVisible(true), 50);
    const contentTimer = setTimeout(() => setContentVisible(true), 250);
    return () => {
      clearTimeout(titleTimer);
      clearTimeout(contentTimer);
    };
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Title with staggered animation */}
      <div className={cn(
        "space-y-2 mb-8 transition-all duration-500 ease-out",
        titleVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      )}>
        <h2 className="text-2xl md:text-3xl font-semibold">Select opportunity type</h2>
        <p className="text-base text-muted-foreground">
          Choose the option that represents the client
        </p>
      </div>

      {/* Content with delayed animation */}
      <div className={cn(
        "space-y-4 transition-all duration-500 ease-out",
        contentVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        {intentOptions.map((option) => {
          const isSelected = data.intent === option.id;
          const config = getOpportunityConfig(option.id);
          
          return (
            <button
              key={option.id}
              onClick={() => onUpdate({ intent: option.id })}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/50 hover:bg-muted/50"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                config.lightBg
              )}>
                <img src={config.icon} alt={config.label} className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-base">{config.label}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{option.description}</p>
              </div>
              {isSelected && (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}