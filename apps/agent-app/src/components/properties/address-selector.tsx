import { useState, useEffect, useRef, useCallback } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { FloatingLabelSelect } from "@/components/ui/floating-label-select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { searchAddresses, MockAddress } from "@/lib/mock-addresses";
import { requiresUnitDetails, floorOptions, unitTypeOptions, directionalOptions } from "@/lib/property-types";
import { cn } from "@/lib/utils";

interface AddressData {
  address: MockAddress | null;
  block?: string;
  floor?: string;
  unitType?: string;
  unit?: string;
}

interface AddressSelectorProps {
  address: MockAddress | null;
  block?: string;
  floor?: string;
  unitType?: string;
  unit?: string;
  parentType?: string | null;
  onUpdate: (updates: Partial<AddressData>) => void;
  onStreetNumberValidationChange?: (isValidating: boolean, needsValidation: boolean, hasInput: boolean) => void;
  triggerStreetNumberValidation?: boolean;
  size?: 'default' | 'compact';
  showAnimations?: boolean;
  showHeader?: boolean;
  showContinueButton?: boolean;
  onContinue?: () => void;
  className?: string;
}

function AddressMap({ latitude, longitude }: { latitude: number; longitude: number }) {
  const mapContainer = useRef<HTMLDivElement>(null);

  // Use OpenStreetMap embed for a visual representation
  const staticMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.002},${latitude - 0.001},${longitude + 0.002},${latitude + 0.001}&layer=hot&marker=${latitude},${longitude}`;

  return (
    <div ref={mapContainer} className="w-full h-full rounded-xl overflow-hidden">
      <iframe
        src={staticMapUrl}
        className="w-full h-full border-0 outline-none"
        style={{ pointerEvents: 'none' }}
        title="Property location map"
      />
    </div>
  );
}

export function AddressSelector({
  address,
  block = '',
  floor = '',
  unitType = '',
  unit = '',
  parentType,
  onUpdate,
  onStreetNumberValidationChange,
  triggerStreetNumberValidation,
  size = 'default',
  showAnimations = true,
  showHeader = true,
  showContinueButton = false,
  onContinue,
  className
}: AddressSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MockAddress[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [streetNumberInput, setStreetNumberInput] = useState("");
  const [isValidatingStreetNumber, setIsValidatingStreetNumber] = useState(false);
  const [streetNumberError, setStreetNumberError] = useState("");
  const [pendingAddress, setPendingAddress] = useState<MockAddress | null>(null);
  const [titleVisible, setTitleVisible] = useState(!showAnimations);
  const [contentVisible, setContentVisible] = useState(!showAnimations);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  const showUnitFields = parentType && requiresUnitDetails(parentType);
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

  // Auto-scroll to bottom when unit type changes to show new field
  useEffect(() => {
    if (unitType === 'letter-number' || unitType === 'directional') {
      setTimeout(() => {
        // In compact mode, scroll the parent container; otherwise use scrollIntoView
        if (isCompact && scrollEndRef.current) {
          const scrollContainer = scrollEndRef.current.closest('.overflow-y-auto');
          if (scrollContainer) {
            scrollContainer.scrollTo({
              top: scrollContainer.scrollHeight,
              behavior: 'smooth'
            });
          }
        } else {
          scrollEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }, 150);
    }
  }, [unitType, isCompact]);

  // Notify parent about validation state
  useEffect(() => {
    const needsValidation = !!pendingAddress && !address;
    const hasInput = !!streetNumberInput.trim();
    onStreetNumberValidationChange?.(isValidatingStreetNumber, needsValidation, hasInput);
  }, [pendingAddress, address, isValidatingStreetNumber, onStreetNumberValidationChange, streetNumberInput]);

  // Handle external trigger for validation
  useEffect(() => {
    if (triggerStreetNumberValidation && pendingAddress && streetNumberInput.trim()) {
      handleStreetNumberSubmit();
    }
  }, [triggerStreetNumberValidation]);

  // Search addresses when query changes
  useEffect(() => {
    if (searchQuery.length >= 2) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        const results = searchAddresses(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleAddressSelect = (selectedAddress: MockAddress) => {
    if (!selectedAddress.streetNumber) {
      setPendingAddress(selectedAddress);
      setStreetNumberInput("");
      setStreetNumberError("");
    } else {
      onUpdate({ address: selectedAddress });
    }
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleStreetNumberSubmit = useCallback(async () => {
    if (!streetNumberInput.trim() || !pendingAddress) return;

    setIsValidatingStreetNumber(true);
    setStreetNumberError("");

    await new Promise(resolve => setTimeout(resolve, 800));

    const trimmedInput = streetNumberInput.trim();
    const isValidFormat = /^[0-9]+[A-Za-z]?$/.test(trimmedInput);
    const isZero = trimmedInput === "0";

    if (!isValidFormat) {
      setStreetNumberError("Please enter a valid street number (e.g., 12, 45A)");
    } else if (isZero) {
      setStreetNumberError("This number doesn't exist for the street selected");
    } else {
      const updatedAddress: MockAddress = {
        ...pendingAddress,
        streetNumber: trimmedInput
      };
      onUpdate({ address: updatedAddress });
      setPendingAddress(null);
    }

    setIsValidatingStreetNumber(false);
  }, [streetNumberInput, pendingAddress, onUpdate]);

  const handleStreetNumberKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && streetNumberInput.trim() && !isValidatingStreetNumber) {
      handleStreetNumberSubmit();
    }
  };

  // If waiting for street number input
  if (pendingAddress && !address) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        <div className="flex-1 min-h-0">
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
              )}>Add the street number</h2>
              <p className={cn(
                "text-muted-foreground",
                isCompact ? "text-sm" : "text-base"
              )}>
                Enter the street number for the selected address
              </p>
            </div>
          )}

          {/* Content */}
          <div className={cn(
            "space-y-4 transition-all duration-500 ease-out",
            isCompact ? "space-y-4" : "space-y-6",
            showAnimations && (contentVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")
          )}>
            {/* Selected Street Display */}
            <div className={cn(
              "rounded-xl border border-border bg-muted/30 animate-fade-in",
              isCompact ? "p-4" : "p-4"
            )}>
              <div className="flex items-start gap-3">
                <MapPin className={cn(
                  "text-muted-foreground shrink-0 mt-0.5",
                  isCompact ? "h-5 w-5" : "h-5 w-5"
                )} />
                <div className="flex-1 min-w-0">
                  <p className={cn("font-semibold", isCompact ? "text-base" : "text-base")}>{pendingAddress.streetName}</p>
                  <p className={cn("text-muted-foreground", isCompact ? "text-sm" : "text-sm")}>
                    {pendingAddress.neighborhood}, {pendingAddress.city}
                  </p>
                </div>
                <button
                  onClick={() => setPendingAddress(null)}
                  className={cn(
                    "text-primary font-medium hover:underline transition-smooth",
                    isCompact ? "text-sm" : "text-sm"
                  )}
                >
                  Change
                </button>
              </div>
            </div>

            <FloatingLabelInput
              label="Street number"
              required
              value={streetNumberInput}
              onChange={(e) => {
                setStreetNumberInput(e.target.value);
                setStreetNumberError("");
              }}
              onKeyDown={handleStreetNumberKeyDown}
              autoFocus
              error={!!streetNumberError}
              errorMessage={streetNumberError}
              className={isCompact ? "h-11" : ""}
            />
          </div>
        </div>

        {/* Continue button for modal context */}
        {showContinueButton && onContinue && (
          <div className="shrink-0">
            <Button 
              onClick={() => {
                if (streetNumberInput.trim()) {
                  handleStreetNumberSubmit();
                }
              }}
              disabled={!streetNumberInput.trim() || isValidatingStreetNumber}
              className="w-full"
              size="lg"
            >
              {isValidatingStreetNumber ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // If no address selected, show search
  if (!address) {
    return (
      <div className={cn("flex flex-col min-h-0", isCompact ? "gap-4 h-full" : "h-full max-h-full", className)}>
        {/* Title */}
        {showHeader && (
          <div className={cn(
            "space-y-2 transition-all duration-500 ease-out shrink-0",
            isCompact ? "mb-4" : "mb-6",
            showAnimations && (titleVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")
          )}>
            <h2 className={cn(
              "font-semibold",
              isCompact ? "text-xl" : "text-2xl md:text-3xl"
            )}>Where is the property located?</h2>
            <p className={cn(
              "text-muted-foreground",
              isCompact ? "text-sm" : "text-base"
            )}>
              Search for the property address
            </p>
          </div>
        )}

        {/* Content */}
        <div className={cn(
          "flex-1 flex flex-col min-h-0 transition-all duration-500 ease-out",
          showAnimations && (contentVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")
        )}>
          {/* Search Input - stays fixed at top */}
          <div className={cn("relative shrink-0", isCompact ? "mb-4" : "mb-4")}>
            <Search className={cn(
              "absolute top-1/2 -translate-y-1/2 text-muted-foreground",
              isCompact ? "left-3 h-4 w-4" : "left-3 h-4 w-4"
            )} />
            <Input
              placeholder="Search for an address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "rounded-xl",
                isCompact ? "pl-10 h-11" : "pl-10 h-12"
              )}
              autoFocus
            />
          </div>

          {/* Search Results - scrolls independently */}
          <ScrollArea className={cn("flex-1 min-h-0", isCompact ? "-mx-4 px-4" : "-mx-6 px-6")}>
            <div className={cn("pb-4", isCompact ? "space-y-2" : "space-y-2")}>
              {/* Loading State */}
              <div className={cn(
                "text-center text-muted-foreground transition-smooth",
                isCompact ? "py-6" : "py-8",
                isSearching ? "opacity-100" : "opacity-0 h-0 py-0 overflow-hidden"
              )}>
                <div className={cn(
                  "border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin mx-auto mb-3",
                  isCompact ? "h-5 w-5" : "h-5 w-5"
                )} />
                <p className={isCompact ? "text-base" : "text-base"}>Searching...</p>
              </div>

              {/* Search Results List */}
              {!isSearching && searchResults.length > 0 && (
                <div className={isCompact ? "space-y-2" : "space-y-2"}>
                  {searchResults.map((result, index) => (
                    <button
                      key={result.id}
                      onClick={() => handleAddressSelect(result)}
                      className={cn(
                        "w-full flex items-start gap-3 rounded-xl border-2 border-border hover:border-muted-foreground/50 hover:bg-muted/50 transition-smooth text-left animate-fade-in",
                        isCompact ? "p-3" : "p-3"
                      )}
                      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
                    >
                      <MapPin className={cn(
                        "text-muted-foreground shrink-0 mt-0.5",
                        isCompact ? "h-5 w-5" : "h-5 w-5"
                      )} />
                      <div>
                        <p className={cn("font-semibold", isCompact ? "text-base" : "text-base")}>
                          {result.streetName}
                          {result.streetNumber && `, ${result.streetNumber}`}
                        </p>
                        <p className={cn("text-muted-foreground", isCompact ? "text-sm" : "text-sm")}>
                          {result.neighborhood}, {result.city}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* No Results State */}
              {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
                <div className={cn(
                  "text-center text-muted-foreground animate-fade-in",
                  isCompact ? "py-6" : "py-8"
                )}>
                  <MapPin className={cn("mx-auto mb-3 opacity-50", isCompact ? "h-10 w-10" : "h-10 w-10")} />
                  <p className={isCompact ? "text-base" : "text-base"}>No addresses found</p>
                  <p className={cn("mt-1", isCompact ? "text-sm" : "text-sm")}>Try a different search term</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  }

  // Address selected - show details and additional fields
  return (
    <div className={cn("flex flex-col", isCompact ? "gap-4" : "h-full", className)}>
      {/* Title */}
      {showHeader && (
        <div className={cn(
          "space-y-2 transition-all duration-500 ease-out",
          isCompact ? "mb-4" : "mb-6",
          showAnimations && (titleVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")
        )}>
          <h2 className={cn(
            "font-semibold",
            isCompact ? "text-xl" : "text-2xl md:text-3xl"
          )}>Confirm the address</h2>
          <p className={cn(
            "text-muted-foreground",
            isCompact ? "text-sm" : "text-base"
          )}>
            {showUnitFields ? "Add unit details for the property" : "Review the selected address"}
          </p>
        </div>
      )}

      {/* Content */}
      <ScrollArea className={cn(
        "flex-1 transition-all duration-500 ease-out",
        isCompact ? "-mx-4 px-4" : "-mx-6 px-6",
        showAnimations && (contentVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")
      )}>
        <div className={cn("pb-4", isCompact ? "space-y-4" : "space-y-4")}>
          <div className={cn(
            "rounded-xl border-2 border-primary bg-primary/5 animate-fade-in",
            isCompact ? "p-4" : "p-4"
          )}>
            <div className="flex items-center gap-3">
              <MapPin className={cn("text-primary shrink-0", isCompact ? "h-5 w-5" : "h-5 w-5")} />
              <div className="flex-1 min-w-0">
                <p className={cn("font-semibold", isCompact ? "text-base" : "text-base")}>
                  {address.streetName}
                  {address.streetNumber && `, ${address.streetNumber}`}
                </p>
                <p className={cn("text-muted-foreground", isCompact ? "text-sm" : "text-sm")}>
                  {address.neighborhood}, {address.city}, {address.postalCode}
                </p>
              </div>
              <button
                onClick={() => onUpdate({ address: null, block: '', floor: '', unitType: '', unit: '' })}
                className={cn(
                  "text-primary font-medium hover:underline transition-smooth",
                  isCompact ? "text-sm" : "text-base"
                )}
              >
                Change
              </button>
            </div>
          </div>

          {/* Map */}
          <div 
            className={cn(
              "rounded-xl overflow-hidden border border-border animate-fade-in",
              isCompact ? "h-32" : "h-44"
            )}
            style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}
          >
            <AddressMap 
              latitude={address.latitude} 
              longitude={address.longitude} 
            />
          </div>

          {/* Additional Fields for Apartment/Shop/Office */}
          {showUnitFields && (
            <div 
              className={cn("animate-fade-in", isCompact ? "space-y-4" : "space-y-5")}
              style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}
            >
              <h3 className={cn("font-semibold", isCompact ? "text-lg" : "text-xl")}>Unit details</h3>
              
              {/* Block (Optional) */}
              <FloatingLabelInput
                label="Block"
                value={block}
                onChange={(e) => onUpdate({ block: e.target.value })}
                supportingText="Optional"
                className={isCompact ? "h-11" : ""}
              />

              {/* Floor (Required) */}
              <FloatingLabelSelect
                label="Floor"
                required
                value={floor}
                onValueChange={(value) => onUpdate({ floor: value })}
                options={floorOptions}
                placeholder="Select floor"
                className={isCompact ? "h-11" : ""}
              />

              {/* Unit Type */}
              <FloatingLabelSelect
                label="Unit type"
                required
                value={unitType}
                onValueChange={(value) => onUpdate({ unitType: value, unit: '' })}
                options={unitTypeOptions}
                placeholder="Select unit type"
                className={isCompact ? "h-11" : ""}
              />

              {/* Unit Field - Conditional based on unit type */}
              <div className={cn("expandable-content", unitType === 'letter-number' && "expanded")}>
                <FloatingLabelInput
                  label="Unit"
                  required
                  value={unitType === 'letter-number' ? unit : ''}
                  onChange={(e) => {
                    // Only allow alphanumeric characters and auto-capitalize
                    const sanitized = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                    onUpdate({ unit: sanitized });
                  }}
                  className={isCompact ? "h-11" : ""}
                />
              </div>

              <div className={cn("expandable-content", unitType === 'directional' && "expanded")}>
                <FloatingLabelSelect
                  label="Direction"
                  required
                  value={unitType === 'directional' ? unit : ''}
                  onValueChange={(value) => onUpdate({ unit: value })}
                  options={directionalOptions}
                  placeholder="Select direction"
                  className={isCompact ? "h-11" : ""}
                />
              </div>
            </div>
          )}
          <div ref={scrollEndRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
