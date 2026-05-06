import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ClientSelector } from "@/components/clients/client-selector";
import { PropertyDraftData } from "./types";

interface StepClientProps {
  data: PropertyDraftData;
  onUpdate: (updates: Partial<PropertyDraftData>) => void;
  onAddNewClient: () => void;
}

export function StepClient({ data, onUpdate, onAddNewClient }: StepClientProps) {
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
    <div className="flex flex-col h-full min-h-0 max-h-full">
      {/* Title with staggered animation */}
      <div className={cn(
        "space-y-2 mb-6 transition-all duration-500 ease-out",
        titleVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      )}>
        <h2 className="text-2xl md:text-3xl font-semibold">Select client</h2>
        <p className="text-base text-muted-foreground">Choose an existing client or add a new one</p>
      </div>
      
      {/* Content with delayed animation */}
      <div className={cn(
        "flex-1 flex flex-col min-h-0 transition-all duration-500 ease-out",
        contentVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        <ClientSelector
          selectedClientId={data.clientId}
          onSelectClient={(clientId) => onUpdate({ clientId })}
          onAddNewClient={onAddNewClient}
          size="default"
          maxHeight="calc(100vh - 400px)"
        />
      </div>
    </div>
  );
}
