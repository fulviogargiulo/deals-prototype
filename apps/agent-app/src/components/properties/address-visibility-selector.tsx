import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { MockAddress } from "@/lib/mock-addresses";

export type AddressVisibilityOption = 'street-only' | 'full-address' | 'hidden';

interface AddressVisibilitySelectorProps {
  visibility: AddressVisibilityOption | null;
  address: MockAddress | null;
  block?: string;
  floor?: string;
  unit?: string;
  onSelect: (visibility: AddressVisibilityOption) => void;
  size?: 'default' | 'compact';
  showAnimations?: boolean;
  showHeader?: boolean;
  className?: string;
}

interface VisibilityOptionConfig {
  value: AddressVisibilityOption;
  label: string;
}

const visibilityOptions: VisibilityOptionConfig[] = [
  { value: 'street-only', label: 'Street name only' },
  { value: 'full-address', label: 'Full address' },
  { value: 'hidden', label: 'Hide address' },
];

function getAddressPreview(
  visibility: AddressVisibilityOption, 
  address: MockAddress | null,
  block?: string,
  floor?: string,
  unit?: string
): string {
  if (!address) return '';
  
  const { streetName, streetNumber, neighborhood, city } = address;
  
  switch (visibility) {
    case 'street-only':
      return `${streetName}, ${city}`;
    case 'full-address':
      const parts = [streetName];
      if (streetNumber) parts[0] += ` ${streetNumber}`;
      if (block) parts.push(`Block ${block}`);
      if (floor) parts.push(floor);
      if (unit) parts.push(`Unit ${unit}`);
      parts.push(city);
      return parts.join(', ');
    case 'hidden':
      return `${neighborhood || city}, ${city !== neighborhood ? city : 'Spain'}`;
    default:
      return '';
  }
}

export function AddressVisibilitySelector({
  visibility,
  address,
  block,
  floor,
  unit,
  onSelect,
  size = 'default',
  showAnimations = true,
  showHeader = true,
  className
}: AddressVisibilitySelectorProps) {
  const [titleVisible, setTitleVisible] = useState(!showAnimations);
  const [contentVisible, setContentVisible] = useState(!showAnimations);

  const isCompact = size === 'compact';

  // Staggered animation on mount
  useEffect(() => {
    if (!showAnimations) return;
    const titleTimer = setTimeout(() => setTitleVisible(true), 50);
    const contentTimer = setTimeout(() => setContentVisible(true), 250);
    return () => {
      clearTimeout(titleTimer);
      clearTimeout(contentTimer);
    };
  }, [showAnimations]);

  return (
    <div className={cn("flex flex-col", isCompact ? "gap-4" : "h-full", className)}>
      {/* Title */}
      {showHeader && (
        <div className={cn(
          "space-y-2 transition-all duration-500 ease-out",
          isCompact ? "mb-4" : "mb-8",
          showAnimations && (titleVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")
        )}>
          <h2 className={cn(
            "font-semibold",
            isCompact ? "text-xl" : "text-2xl md:text-3xl"
          )}>How should the address be shown?</h2>
          <p className={cn(
            "text-muted-foreground",
            isCompact ? "text-sm" : "text-base"
          )}>
            Choose how much of the address buyers can see
          </p>
        </div>
      )}

      {/* Content */}
      <div className={cn(
        "transition-all duration-500 ease-out",
        isCompact ? "space-y-3" : "space-y-4",
        showAnimations && (contentVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")
      )}>
        {visibilityOptions.map((option) => {
          const isSelected = visibility === option.value;
          const preview = getAddressPreview(option.value, address, block, floor, unit);
          
          return (
            <button
              key={option.value}
              onClick={() => onSelect(option.value)}
              className={cn(
                "w-full flex items-center gap-4 rounded-xl border-2 transition-all text-left",
                isCompact ? "p-4" : "p-4",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/50 hover:bg-muted/50"
              )}
            >
              <div className="flex-1 min-w-0">
                <p className={cn("font-semibold", isCompact ? "text-base" : "text-base")}>{option.label}</p>
                {preview && (
                  <p className={cn(
                    "text-muted-foreground mt-1 truncate",
                    isCompact ? "text-sm" : "text-sm"
                  )}>
                    {preview}
                  </p>
                )}
              </div>
              {isSelected && (
                <div className={cn(
                  "rounded-full bg-primary flex items-center justify-center flex-shrink-0",
                  isCompact ? "w-6 h-6" : "w-6 h-6"
                )}>
                  <Check className={cn("text-primary-foreground", isCompact ? "h-4 w-4" : "h-4 w-4")} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
