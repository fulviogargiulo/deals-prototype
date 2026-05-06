import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { PropertyDraftData } from "./types";
import { PropertyTypeSelector } from "@/components/properties/property-type-selector";

interface StepPropertyTypeProps {
  data: PropertyDraftData;
  onUpdate: (updates: Partial<PropertyDraftData>) => void;
}

export function StepPropertyType({ data, onUpdate }: StepPropertyTypeProps) {
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

  const handleSelect = (parentType: string, subType: string | null) => {
    onUpdate({ parentType, subType });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Title with staggered animation */}
      <div className={cn(
        "space-y-2 mb-6 transition-all duration-500 ease-out",
        titleVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      )}>
        <h2 className="text-2xl md:text-3xl font-semibold">Select property type</h2>
        <p className="text-base text-muted-foreground">
          Choose the type of property
        </p>
      </div>

      {/* Content with delayed animation */}
      <div className={cn(
        "flex-1 -mx-6 px-6 transition-all duration-500 ease-out overflow-auto",
        contentVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        <PropertyTypeSelector
          selectedParentType={data.parentType}
          selectedSubType={data.subType}
          onSelect={handleSelect}
          size="default"
          showAnimations={false}
        />
      </div>
    </div>
  );
}