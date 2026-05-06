import { useState, useMemo, useRef } from "react";
import { Search, MapPin, Clock, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { StandardModal, StandardModalFooter } from "@/components/ui/standard-modal";
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";

import { FloatingLabelSelect } from "@/components/ui/floating-label-select";
import { FloatingLabelCombobox } from "@/components/ui/floating-label-combobox";
import {
  PropertyTypeFilter,
  PriceFilter,
  BedroomsFilter,
  FilterChip,
  PropertyCategory,
  PriceRangeType,
  priceOptions,
  maxPriceOptions,
} from "@/components/filters/filter-components";
import { OpportunityType } from "@/types";

// Mock locations for search
const allLocations = [
  { name: "La Latina", subtitle: "District in Madrid" },
  { name: "Chamberí", subtitle: "District in Madrid" },
  { name: "Salamanca", subtitle: "District in Madrid" },
  { name: "Retiro", subtitle: "District in Madrid" },
  { name: "Chamartín", subtitle: "District in Madrid" },
  { name: "Malasaña", subtitle: "Neighborhood in Madrid" },
  { name: "Chueca", subtitle: "Neighborhood in Madrid" },
  { name: "Lavapiés", subtitle: "Neighborhood in Madrid" },
  { name: "Sol", subtitle: "Neighborhood in Madrid" },
  { name: "Gran Vía", subtitle: "Area in Madrid" },
  { name: "Paseo de la Castellana", subtitle: "Area in Madrid" },
  { name: "Pozuelo de Alarcón", subtitle: "Municipality in Madrid" },
  { name: "Las Rozas", subtitle: "Municipality in Madrid" },
  { name: "Majadahonda", subtitle: "Municipality in Madrid" },
];

const recentSearches = ["La Latina", "Chamberí", "Salamanca"];

// Size options
const sizeOptions = [
  { value: "0", label: "No min." },
  { value: "30", label: "30 m²" },
  { value: "50", label: "50 m²" },
  { value: "75", label: "75 m²" },
  { value: "100", label: "100 m²" },
  { value: "150", label: "150 m²" },
  { value: "200", label: "200 m²" },
  { value: "300", label: "300 m²" },
  { value: "500", label: "500 m²" },
];

const maxSizeOptions = [
  { value: "10000", label: "No max." },
  { value: "50", label: "50 m²" },
  { value: "75", label: "75 m²" },
  { value: "100", label: "100 m²" },
  { value: "150", label: "150 m²" },
  { value: "200", label: "200 m²" },
  { value: "300", label: "300 m²" },
  { value: "500", label: "500 m²" },
  { value: "1000", label: "1,000 m²" },
];

const bathroomOptions = [
  { value: "any", label: "No min." },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
];

// Property filters options
const occupancyOptions = [
  { key: "vacant", label: "Vacant" },
  { key: "rented", label: "Rented" },
  { key: "illegally-occupied", label: "Illegally occupied" },
  { key: "bare-ownership", label: "Bare ownership" },
];

const conditionOptions = [
  { key: "new", label: "New" },
  { key: "good-condition", label: "Good condition" },
  { key: "under-reformation", label: "Under reformation" },
  { key: "requires-renovation", label: "Requires renovation" },
];

const viewOptions = [
  { key: "interior", label: "Interior" },
  { key: "exterior", label: "Exterior" },
];

const floorOptions = [
  { key: "ground-floor", label: "Ground floor" },
  { key: "middle-floor", label: "Middle floor" },
  { key: "top-floor", label: "Top floor" },
];

const furnishingOptions = [
  { key: "furnished", label: "Furnished" },
  { key: "partially-furnished", label: "Partially furnished" },
  { key: "unfurnished", label: "Unfurnished" },
];

const rentalContractOptions = [
  { key: "long-term", label: "Long term" },
  { key: "short-term", label: "Short term" },
];

const amenityOptions = [
  { key: "elevator", label: "Elevator" },
  { key: "balcony", label: "Balcony" },
  { key: "terrace", label: "Terrace" },
  { key: "parking-space", label: "Parking space" },
  { key: "built-in-wardrobes", label: "Built-in wardrobes" },
  { key: "air-conditioning", label: "Air conditioning" },
  { key: "swimming-pool", label: "Swimming pool" },
  { key: "garden", label: "Garden" },
  { key: "storage-room", label: "Storage room" },
];

// Transaction options
const paymentMethodOptions = [
  { key: "mortgage", label: "Mortgage" },
  { key: "cash", label: "Cash" },
  { key: "payment-plan", label: "Payment plan" },
  { key: "other", label: "Other" },
];

const transactionTimeframeOptions = [
  { key: "immediate", label: "Immediate" },
  { key: "within-3-months", label: "Within 3 months" },
  { key: "within-6-months", label: "Within 6 months" },
  { key: "more-than-6-months", label: "More than 6 months" },
];

interface EditPreferencesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  /** The type of opportunity: 'buy' or 'rent' - determines which filters are shown */
  opportunityType: OpportunityType;
  onSave?: () => void;
}

export function EditPreferencesModal({
  open,
  onOpenChange,
  clientName,
  opportunityType,
  onSave,
}: EditPreferencesModalProps) {
  // Location search state
  const [locationSearchOpen, setLocationSearchOpen] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const locationInputRef = useRef<HTMLInputElement>(null);

  // Property filters state
  const [propertyCategory, setPropertyCategory] = useState<PropertyCategory>("residential");
  const [propertySubtypes, setPropertySubtypes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<PriceRangeType>([undefined, undefined]);
  const [sizeRange, setSizeRange] = useState<[number, number]>([0, 10000]);
  const [bedroomFilters, setBedroomFilters] = useState<string[]>([]);
  const [bathroomMin, setBathroomMin] = useState("any");
  const [occupancyStatus, setOccupancyStatus] = useState<string[]>([]);
  const [propertyCondition, setPropertyCondition] = useState<string[]>([]);
  const [viewType, setViewType] = useState<string[]>([]);
  const [floorLevel, setFloorLevel] = useState<string[]>([]);
  const [furnishing, setFurnishing] = useState<string[]>([]);
  const [rentalContractType, setRentalContractType] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [showExclusiveOnly, setShowExclusiveOnly] = useState(false);
  const [showMoreAmenities, setShowMoreAmenities] = useState(false);

  // Transaction state
  const [paymentMethod, setPaymentMethod] = useState<string[]>([]);
  const [transactionTimeframe, setTransactionTimeframe] = useState<string[]>([]);

  // Loading state
  const [isSaving, setIsSaving] = useState(false);

  // Determine if this is a rent opportunity
  const isForRent = opportunityType === "rent" || opportunityType === "lease";
  
  // Determine visibility based on property category
  const isBuilding = propertyCategory === "building";
  const isLand = propertyCategory === "land";
  const isCommercial = propertyCategory === "commercial";
  const isResidential = propertyCategory === "residential";
  const isStorage = propertyCategory === "storage";
  const isGarage = propertyCategory === "garage";

  // Categories with minimal filters
  const isMinimalCategory = isLand || isStorage || isGarage;

  // Visibility rules per category
  const showSizeFilter = !isGarage;
  const showRoomFilters = !isBuilding && !isMinimalCategory;
  const showFloorFilters = !isBuilding && !isMinimalCategory && !isCommercial;
  const showFloor = !isBuilding && !isMinimalCategory;
  const showPropertyCondition = !isMinimalCategory && (isCommercial || !isForRent);
  const showAmenities = !isLand && !isStorage;
  const showOccupancyStatus = !isForRent && isResidential;
  const showRentalContractType = isForRent && !isCommercial;
  const showFurnishing = isForRent && isResidential;

  // Filtered locations based on search
  const filteredLocations = useMemo(() => {
    if (!locationSearchQuery) return [];
    return allLocations.filter(
      (loc) =>
        loc.name.toLowerCase().includes(locationSearchQuery.toLowerCase()) ||
        loc.subtitle.toLowerCase().includes(locationSearchQuery.toLowerCase())
    );
  }, [locationSearchQuery]);

  const visibleAmenities = showMoreAmenities ? amenityOptions : amenityOptions.slice(0, 6);

  const toggleArrayFilter = (array: string[], setArray: (val: string[]) => void, value: string) => {
    if (array.includes(value)) {
      setArray(array.filter((v) => v !== value));
    } else {
      setArray([...array, value]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    onSave?.();
    onOpenChange(false);
  };

  // Get the first name for title
  const firstName = clientName.split(" ")[0];
  
  // Determine the label based on opportunity type
  const preferenceLabel = isForRent ? "renting" : "buying";

  return (
    <StandardModal
      open={open}
      onOpenChange={onOpenChange}
      title={`${firstName}'s ${preferenceLabel} preferences`}
      description="Complete the preferences to help us find better matches for this opportunity"
      size="lg"
      preventClose={isSaving}
      footer={
        <StandardModalFooter
          label="Save preferences"
          loadingLabel="Saving..."
          onClick={handleSave}
          isLoading={isSaving}
        />
      }
    >
      <div className="space-y-6 pb-4">
        {/* Location Search */}
        <div className="space-y-4">
          <h3 className="font-semibold">Location <span className="text-destructive">*</span></h3>
          <Popover 
            open={locationSearchOpen} 
            onOpenChange={(open) => {
              setLocationSearchOpen(open);
              if (open) {
                setHighlightedIndex(0);
              }
            }}
          >
            <PopoverAnchor asChild>
              <div 
                className="relative w-full"
                onMouseDown={(e) => {
                  // Always prevent default and focus the input - this fixes the placeholder click issue
                  e.preventDefault();
                  locationInputRef.current?.focus();
                }}
              >
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 z-10 pointer-events-none" />
                <div className="flex h-12 w-full rounded-md border border-input bg-card text-sm ring-offset-background focus-within:border-primary transition-colors cursor-text items-center">
                  <div className="flex items-center gap-1 flex-1 overflow-hidden pl-10 pr-3">
                    {selectedLocations.slice(0, 2).map((location) => (
                      <Badge
                        key={location}
                        variant="default"
                        className="bg-foreground text-background text-xs shrink-0 pl-2 pr-1.5 py-0.5"
                      >
                        {location}
                        <button
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedLocations(prev => prev.filter(l => l !== location));
                          }}
                          className="ml-1 hover:opacity-70"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                    {selectedLocations.length > 2 && (
                      <Badge
                        variant="default"
                        className="bg-foreground text-background text-xs shrink-0"
                      >
                        +{selectedLocations.length - 2}
                      </Badge>
                    )}
                    <input
                      ref={locationInputRef}
                      type="text"
                      value={locationSearchQuery}
                      onChange={(e) => {
                        setLocationSearchQuery(e.target.value);
                        setHighlightedIndex(0);
                      }}
                      onFocus={() => {
                        setLocationSearchOpen(true);
                        setHighlightedIndex(0);
                      }}
                      onBlur={(e) => {
                        // Close if focus moves outside the popover
                        const relatedTarget = e.relatedTarget as HTMLElement | null;
                        const popoverContent = document.querySelector('[data-radix-popper-content-wrapper]');
                        if (!popoverContent?.contains(relatedTarget)) {
                          setLocationSearchOpen(false);
                        }
                      }}
                      onKeyDown={(e) => {
                        const items = !locationSearchQuery ? recentSearches : filteredLocations.map(l => l.name);
                        const itemCount = items.length;

                        if (e.key === 'Escape') {
                          e.preventDefault();
                          setLocationSearchOpen(false);
                          locationInputRef.current?.blur();
                        } else if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setHighlightedIndex(prev => (prev + 1) % itemCount);
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setHighlightedIndex(prev => (prev - 1 + itemCount) % itemCount);
                        } else if (e.key === 'Enter' && itemCount > 0) {
                          e.preventDefault();
                          const selectedItem = items[highlightedIndex];
                          if (selectedItem && !selectedLocations.includes(selectedItem)) {
                            setSelectedLocations(prev => [...prev, selectedItem]);
                          }
                          setLocationSearchQuery('');
                          setHighlightedIndex(0);
                        } else if (e.key === 'Backspace' && locationSearchQuery === '' && selectedLocations.length > 0) {
                          e.preventDefault();
                          setSelectedLocations(prev => prev.slice(0, -1));
                        }
                      }}
                      placeholder={selectedLocations.length === 0 ? "Search location..." : ""}
                      className="flex-1 min-w-[80px] bg-transparent outline-none border-none text-sm placeholder:text-muted-foreground caret-foreground"
                      style={{ boxShadow: 'none' }}
                    />
                  </div>
                </div>
              </div>
            </PopoverAnchor>
            <PopoverContent
              className="w-[--radix-popover-trigger-width] p-3 bg-background"
              align="start"
              sideOffset={4}
              onOpenAutoFocus={(e) => e.preventDefault()}
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <div className="max-h-60 overflow-y-auto space-y-4">
                {/* Recent searches section */}
                {!locationSearchQuery ? (
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-foreground">Recent searches</div>
                    <div className="space-y-2">
                      {recentSearches.filter(s => !selectedLocations.includes(s)).map((search, index) => {
                        const locationData = allLocations.find(l => l.name === search);
                        const isHighlighted = highlightedIndex === index;
                        return (
                          <button
                            key={search}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setSelectedLocations(prev => [...prev, search]);
                              setLocationSearchQuery('');
                              setHighlightedIndex(0);
                            }}
                            onMouseEnter={() => setHighlightedIndex(index)}
                            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-left transition-colors border bg-card ${
                              isHighlighted 
                                ? 'border-foreground' 
                                : 'border-transparent hover:bg-muted/50'
                            }`}
                          >
                            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-muted">
                              <Clock className="w-4 h-4 text-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-foreground">{search}</div>
                              <div className="text-xs text-muted-foreground">{locationData?.subtitle || 'District in Madrid'}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : filteredLocations.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">No locations found.</div>
                ) : (
                  <div className="space-y-2">
                    {filteredLocations.filter(l => !selectedLocations.includes(l.name)).map((location, index) => {
                      const isHighlighted = highlightedIndex === index;
                      return (
                        <button
                          key={location.name}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSelectedLocations(prev => [...prev, location.name]);
                            setLocationSearchQuery('');
                            setHighlightedIndex(0);
                          }}
                          onMouseEnter={() => setHighlightedIndex(index)}
                          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-left transition-colors border bg-card ${
                            isHighlighted 
                              ? 'border-foreground' 
                              : 'border-transparent hover:bg-muted/50'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-muted">
                            <MapPin className="w-4 h-4 text-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-foreground">{location.name}</div>
                            <div className="text-xs text-muted-foreground">{location.subtitle}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Property Type */}
        <div className="space-y-4">
          <h3 className="font-semibold">Property type <span className="text-destructive">*</span></h3>
          <PropertyTypeFilter
            category={propertyCategory}
            subtypes={propertySubtypes}
            onCategoryChange={(cat) => {
              setPropertyCategory(cat);
              setPropertySubtypes([]);
            }}
            onSubtypesChange={setPropertySubtypes}
            variant="inline"
            hideLabel
          />
        </div>

        {/* Price */}
        <div className="space-y-4">
          <h3 className="font-semibold">Price <span className="text-destructive">*</span></h3>
          <PriceFilter
            priceRange={priceRange}
            onChange={setPriceRange}
            variant="inline"
            isRent={isForRent}
            hideLabel
          />
        </div>

        {/* Size */}
        {showSizeFilter && (
          <div className="space-y-4">
            <h3 className="font-semibold">Size <span className="text-destructive">*</span></h3>
            <div className="grid grid-cols-2 gap-4">
              <FloatingLabelSelect
                label="Min."
                value={sizeRange[0].toString()}
                onValueChange={(val) => setSizeRange([parseInt(val), sizeRange[1]])}
                options={sizeOptions}
              />
              <FloatingLabelSelect
                label="Max."
                value={sizeRange[1].toString()}
                onValueChange={(val) => setSizeRange([sizeRange[0], parseInt(val)])}
                options={maxSizeOptions}
              />
            </div>
          </div>
        )}

        {/* Bedrooms */}
        {showRoomFilters && (
          <div className="space-y-4">
            <h3 className="font-semibold">Bedrooms <span className="text-destructive">*</span></h3>
            <BedroomsFilter
              bedroomFilters={bedroomFilters}
              onChange={setBedroomFilters}
              variant="inline"
              hideLabel
            />
          </div>
        )}

        {/* Transaction Section - No divider */}
        <div className="space-y-4">
          <h3 className="font-semibold text-base">Transaction <span className="text-destructive">*</span></h3>

          {/* Payment Method - NOT visible for RENT opportunities */}
          {!isForRent && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Payment method <span className="text-destructive">*</span></h4>
              <div className="flex flex-wrap gap-2">
                {paymentMethodOptions.map((option) => (
                  <FilterChip
                    key={option.key}
                    label={option.label}
                    selected={paymentMethod.includes(option.key)}
                    onClick={() => toggleArrayFilter(paymentMethod, setPaymentMethod, option.key)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Transaction Time Frame - Always visible */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Transaction time frame <span className="text-destructive">*</span></h4>
            <div className="flex flex-wrap gap-2">
              {transactionTimeframeOptions.map((option) => (
                <FilterChip
                  key={option.key}
                  label={option.label}
                  selected={transactionTimeframe.includes(option.key)}
                  onClick={() =>
                    toggleArrayFilter(transactionTimeframe, setTransactionTimeframe, option.key)
                  }
                />
              ))}
            </div>
          </div>
        </div>

        {/* Additional Filters Section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-base">Additional filters</h3>

          {/* Bathrooms */}
          {showRoomFilters && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Bathrooms</h4>
              <FloatingLabelSelect
                label="Min."
                value={bathroomMin}
                onValueChange={setBathroomMin}
                options={bathroomOptions}
              />
            </div>
          )}

          {/* Rental contract type - for rent, except commercial */}
          {showRentalContractType && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Rental contract type</h4>
              <div className="flex flex-wrap gap-2">
                {rentalContractOptions.map((option) => (
                  <FilterChip
                    key={option.key}
                    label={option.label}
                    selected={rentalContractType.includes(option.key)}
                    onClick={() =>
                      toggleArrayFilter(rentalContractType, setRentalContractType, option.key)
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* Occupancy status - only for sale + residential */}
          {showOccupancyStatus && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Occupancy status</h4>
              <div className="flex flex-wrap gap-2">
                {occupancyOptions.map((option) => (
                  <FilterChip
                    key={option.key}
                    label={option.label}
                    selected={occupancyStatus.includes(option.key)}
                    onClick={() =>
                      toggleArrayFilter(occupancyStatus, setOccupancyStatus, option.key)
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* Property condition */}
          {showPropertyCondition && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Property condition</h4>
              <div className="flex flex-wrap gap-2">
                {conditionOptions.map((option) => (
                  <FilterChip
                    key={option.key}
                    label={option.label}
                    selected={propertyCondition.includes(option.key)}
                    onClick={() =>
                      toggleArrayFilter(propertyCondition, setPropertyCondition, option.key)
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* View - only for residential (not buildings/land/commercial) */}
          {showFloorFilters && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">View</h4>
              <div className="flex flex-wrap gap-2">
                {viewOptions.map((option) => (
                  <FilterChip
                    key={option.key}
                    label={option.label}
                    selected={viewType.includes(option.key)}
                    onClick={() => toggleArrayFilter(viewType, setViewType, option.key)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Floor - for residential, commercial (not buildings/land) */}
          {showFloor && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Floor</h4>
              <div className="flex flex-wrap gap-2">
                {floorOptions.map((option) => (
                  <FilterChip
                    key={option.key}
                    label={option.label}
                    selected={floorLevel.includes(option.key)}
                    onClick={() => toggleArrayFilter(floorLevel, setFloorLevel, option.key)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Furnishing - only for rent + residential */}
          {showFurnishing && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Furnishing</h4>
              <div className="flex flex-wrap gap-2">
                {furnishingOptions.map((option) => (
                  <FilterChip
                    key={option.key}
                    label={option.label}
                    selected={furnishing.includes(option.key)}
                    onClick={() => toggleArrayFilter(furnishing, setFurnishing, option.key)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Amenities - not shown for land */}
          {showAmenities && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Amenities</h4>
              <div className="flex flex-wrap gap-2">
                {visibleAmenities.map((option) => (
                  <FilterChip
                    key={option.key}
                    label={option.label}
                    selected={amenities.includes(option.key)}
                    onClick={() => toggleArrayFilter(amenities, setAmenities, option.key)}
                  />
                ))}
              </div>
              {amenityOptions.length > 6 && (
                <button
                  onClick={() => setShowMoreAmenities(!showMoreAmenities)}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showMoreAmenities ? "Show less" : "Show more"}
                  {showMoreAmenities ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          )}

          {/* Listing options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Show only exclusive properties</span>
              <Switch checked={showExclusiveOnly} onCheckedChange={setShowExclusiveOnly} />
            </div>
          </div>
        </div>
      </div>
    </StandardModal>
  );
}
