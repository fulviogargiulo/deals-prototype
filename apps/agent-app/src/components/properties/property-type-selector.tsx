import { useState, useEffect } from "react";
import { Building2, Home, Briefcase, Store, Factory, Building, TreeDeciduous, Warehouse, Car, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { propertyTypes, PropertyParentType } from "@/lib/property-types";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PropertyTypeSelectorProps {
  selectedParentType: string | null;
  selectedSubType: string | null;
  onSelect: (parentType: string, subType: string | null) => void;
  size?: 'default' | 'compact';
  showAnimations?: boolean;
  className?: string;
}

const parentTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  apartment: Building2,
  house: Home,
  office: Briefcase,
  shop: Store,
  factory: Factory,
  building: Building,
  land: TreeDeciduous,
  storage: Warehouse,
  garage: Car,
};

export function PropertyTypeSelector({ 
  selectedParentType,
  selectedSubType,
  onSelect,
  size = 'default',
  showAnimations = true,
  className
}: PropertyTypeSelectorProps) {
  const [titleVisible, setTitleVisible] = useState(!showAnimations);
  const [contentVisible, setContentVisible] = useState(!showAnimations);
  const [subtypesVisible, setSubtypesVisible] = useState(!showAnimations);

  const currentParentType = propertyTypes.find((t) => t.id === selectedParentType);
  const hasSubtypes = currentParentType && currentParentType.subtypes.length > 0;

  // Staggered animation on mount (only if showAnimations is true)
  useEffect(() => {
    if (!showAnimations) return;
    const titleTimer = setTimeout(() => setTitleVisible(true), 50);
    const contentTimer = setTimeout(() => setContentVisible(true), 250);
    return () => {
      clearTimeout(titleTimer);
      clearTimeout(contentTimer);
    };
  }, [showAnimations]);

  // Animate subtypes section when parent type changes
  useEffect(() => {
    if (!showAnimations) {
      setSubtypesVisible(hasSubtypes ?? false);
      return;
    }
    if (hasSubtypes) {
      setSubtypesVisible(false);
      const timer = setTimeout(() => setSubtypesVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setSubtypesVisible(false);
    }
  }, [selectedParentType, hasSubtypes, showAnimations]);

  const handleParentSelect = (parentType: PropertyParentType) => {
    if (parentType.subtypes.length === 0) {
      // No subtypes, select both parent and sub as the same
      onSelect(parentType.id, parentType.id);
    } else {
      // Has subtypes, select parent and clear subtype
      onSelect(parentType.id, null);
    }
  };

  const handleSubtypeSelect = (subtypeId: string) => {
    if (selectedParentType) {
      onSelect(selectedParentType, subtypeId);
    }
  };

  const isCompact = size === 'compact';

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Content */}
      <ScrollArea className={cn(
        "flex-1 transition-all duration-500 ease-out",
        showAnimations && (contentVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")
      )}>
        <div className="space-y-6">
          {/* Parent Types Grid */}
          <div className={cn(
            "grid gap-3",
            isCompact ? "grid-cols-3" : "grid-cols-2 md:grid-cols-3"
          )}>
            {propertyTypes.map((parentType) => {
              const isSelected = selectedParentType === parentType.id;
              const Icon = parentTypeIcons[parentType.id] || Building2;
              
              return (
                <button
                  key={parentType.id}
                  onClick={() => handleParentSelect(parentType)}
                  className={cn(
                    "flex flex-col items-start rounded-xl border-2 transition-all",
                    isCompact ? "gap-2 p-3" : "gap-3 p-4",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/50 hover:bg-muted/50"
                  )}
                >
                  <Icon className={cn(
                    "transition-colors",
                    isCompact ? "h-6 w-6" : "h-7 w-7",
                    isSelected ? "text-primary" : "text-foreground"
                  )} />
                  <span className={cn(
                    "font-semibold",
                    isCompact ? "text-sm" : "text-base"
                  )}>{parentType.label}</span>
                </button>
              );
            })}
          </div>

          {/* Subtypes Section - Shown when parent has subtypes */}
          {hasSubtypes && currentParentType && (
            <div className={cn(
              "transition-all duration-400 ease-out",
              showAnimations && (subtypesVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")
            )}>
              <div className="pt-5">
                <p className={cn(
                  "font-medium mb-3 text-muted-foreground",
                  isCompact ? "text-sm" : "text-base"
                )}>
                  What type of {currentParentType.label.toLowerCase()}?
                </p>
                <div className="flex flex-wrap gap-2">
                  {currentParentType.subtypes.map((subtype) => {
                    const isSubtypeSelected = selectedSubType === subtype.id;
                    
                    return (
                      <button
                        key={subtype.id}
                        onClick={() => handleSubtypeSelect(subtype.id)}
                        className={cn(
                          "flex items-center gap-2 rounded-full border-2 transition-all font-medium",
                          isCompact ? "px-3 py-1.5 text-sm" : "px-4 py-2 text-sm",
                          isSubtypeSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:border-muted-foreground/50 hover:bg-muted/50"
                        )}
                      >
                        {subtype.label}
                        {isSubtypeSelected && (
                          <Check className={isCompact ? "h-3 w-3" : "h-3.5 w-3.5"} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
