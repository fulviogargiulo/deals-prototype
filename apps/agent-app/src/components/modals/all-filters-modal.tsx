import { useState, useEffect } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { Switch } from "@/components/ui/switch";
import { FloatingLabelSelect } from "@/components/ui/floating-label-select";
import { OpportunityType } from "@/types";
import {
  TypeFilter,
  PropertyTypeFilter,
  PriceFilter,
  BedroomsFilter,
  FilterChip,
  PropertyCategory,
  PriceRangeType,
} from "@/components/filters/filter-components";

interface AllFiltersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Current filter values
  typeFilter: OpportunityType;
  propertyCategory: PropertyCategory;
  propertySubtypes: string[];
  priceRange: PriceRangeType;
  sizeRange: [number, number];
  bedroomFilters: string[];
  bathroomMin: string;
  // New filter values
  occupancyStatus: string[];
  propertyCondition: string[];
  viewType: string[];
  floorLevel: string[];
  furnishing: string[];
  rentalContractType: string[];
  amenities: string[];
  showExclusiveOnly: boolean;
  // Callbacks
  onApply: (filters: {
    typeFilter: OpportunityType;
    propertyCategory: PropertyCategory;
    propertySubtypes: string[];
    priceRange: PriceRangeType;
    sizeRange: [number, number];
    bedroomFilters: string[];
    bathroomMin: string;
    occupancyStatus: string[];
    propertyCondition: string[];
    viewType: string[];
    floorLevel: string[];
    furnishing: string[];
    rentalContractType: string[];
    amenities: string[];
    showExclusiveOnly: boolean;
  }) => void;
  totalResults: number;
}

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

// Garage only shows Elevator amenity
const garageAmenityOptions = [
  { key: "elevator", label: "Elevator" },
];

export function AllFiltersModal({
  open,
  onOpenChange,
  typeFilter: initialTypeFilter,
  propertyCategory: initialPropertyCategory,
  propertySubtypes: initialPropertySubtypes,
  priceRange: initialPriceRange,
  sizeRange: initialSizeRange,
  bedroomFilters: initialBedroomFilters,
  bathroomMin: initialBathroomMin,
  occupancyStatus: initialOccupancyStatus,
  propertyCondition: initialPropertyCondition,
  viewType: initialViewType,
  floorLevel: initialFloorLevel,
  furnishing: initialFurnishing,
  rentalContractType: initialRentalContractType,
  amenities: initialAmenities,
  showExclusiveOnly: initialShowExclusiveOnly,
  onApply,
  totalResults,
}: AllFiltersModalProps) {
  // Local state for all filters
  const [typeFilter, setTypeFilter] = useState<OpportunityType>(initialTypeFilter);
  const [propertyCategory, setPropertyCategory] = useState<PropertyCategory>(initialPropertyCategory);
  const [propertySubtypes, setPropertySubtypes] = useState<string[]>(initialPropertySubtypes);
  const [priceRange, setPriceRange] = useState<PriceRangeType>(initialPriceRange);
  const [sizeRange, setSizeRange] = useState<[number, number]>(initialSizeRange);
  const [bedroomFilters, setBedroomFilters] = useState<string[]>(initialBedroomFilters);
  const [bathroomMin, setBathroomMin] = useState(initialBathroomMin);
  const [occupancyStatus, setOccupancyStatus] = useState<string[]>(initialOccupancyStatus);
  const [propertyCondition, setPropertyCondition] = useState<string[]>(initialPropertyCondition);
  const [viewType, setViewType] = useState<string[]>(initialViewType);
  const [floorLevel, setFloorLevel] = useState<string[]>(initialFloorLevel);
  const [furnishing, setFurnishing] = useState<string[]>(initialFurnishing);
  const [rentalContractType, setRentalContractType] = useState<string[]>(initialRentalContractType);
  const [amenities, setAmenities] = useState<string[]>(initialAmenities);
  const [showExclusiveOnly, setShowExclusiveOnly] = useState(initialShowExclusiveOnly);
  const [showMoreAmenities, setShowMoreAmenities] = useState(false);

  // Determine visibility based on type filter and property category
  const isForRent = typeFilter === 'lease';
  const isBuilding = propertyCategory === 'building';
  const isLand = propertyCategory === 'land';
  const isCommercial = propertyCategory === 'commercial';
  const isResidential = propertyCategory === 'residential';
  const isStorage = propertyCategory === 'storage';
  const isGarage = propertyCategory === 'garage';
  
  // Categories with minimal filters (no rooms, floors, property condition, etc.)
  const isMinimalCategory = isLand || isStorage || isGarage;
  
  // Visibility rules per category
  const showSizeFilter = !isGarage; // Size not shown for garage
  const showRoomFilters = !isBuilding && !isMinimalCategory; // Bedrooms/bathrooms for residential, commercial
  const showFloorFilters = !isBuilding && !isMinimalCategory && !isCommercial; // View only for residential
  const showFloor = !isBuilding && !isMinimalCategory; // Floor for residential, commercial
  const showPropertyCondition = !isMinimalCategory && (isCommercial || !isForRent); // For sale (except minimal), or commercial (both)
  const showAmenities = !isLand && !isStorage; // Amenities for residential, commercial, building, garage
  const showOccupancyStatus = !isForRent && isResidential; // Only for sale + residential
  const showRentalContractType = isForRent && !isCommercial; // For rent, except commercial
  const showFurnishing = isForRent && isResidential; // Only for rent + residential

  // Reset local state when modal opens
  useEffect(() => {
    if (open) {
      setTypeFilter(initialTypeFilter);
      setPropertyCategory(initialPropertyCategory);
      setPropertySubtypes(initialPropertySubtypes);
      setPriceRange(initialPriceRange);
      setSizeRange(initialSizeRange);
      setBedroomFilters(initialBedroomFilters);
      setBathroomMin(initialBathroomMin);
      setOccupancyStatus(initialOccupancyStatus);
      setPropertyCondition(initialPropertyCondition);
      setViewType(initialViewType);
      setFloorLevel(initialFloorLevel);
      setFurnishing(initialFurnishing);
      setRentalContractType(initialRentalContractType);
      setAmenities(initialAmenities);
      setShowExclusiveOnly(initialShowExclusiveOnly);
    }
  }, [open, initialTypeFilter, initialPropertyCategory, initialPropertySubtypes, initialPriceRange, initialSizeRange, initialBedroomFilters, initialBathroomMin, initialOccupancyStatus, initialPropertyCondition, initialViewType, initialFloorLevel, initialFurnishing, initialRentalContractType, initialAmenities, initialShowExclusiveOnly]);

  const handleClearAll = () => {
    setTypeFilter('sell');
    setPropertyCategory('residential');
    setPropertySubtypes([]);
    setPriceRange([undefined, undefined]);
    setSizeRange([0, 10000]);
    setBedroomFilters([]);
    setBathroomMin('any');
    setOccupancyStatus([]);
    setPropertyCondition([]);
    setViewType([]);
    setFloorLevel([]);
    setFurnishing([]);
    setRentalContractType([]);
    setAmenities([]);
    setShowExclusiveOnly(false);
  };

  const handleApply = () => {
    onApply({
      typeFilter,
      propertyCategory,
      propertySubtypes,
      priceRange,
      sizeRange,
      bedroomFilters,
      bathroomMin,
      occupancyStatus,
      propertyCondition,
      viewType,
      floorLevel,
      furnishing,
      rentalContractType,
      amenities,
      showExclusiveOnly,
    });
    onOpenChange(false);
  };

  const toggleArrayFilter = (array: string[], setArray: (val: string[]) => void, value: string) => {
    if (array.includes(value)) {
      setArray(array.filter(v => v !== value));
    } else {
      setArray([...array, value]);
    }
  };

  // Get appropriate amenities list based on category
  const currentAmenityOptions = isGarage ? garageAmenityOptions : amenityOptions;
  const visibleAmenities = showMoreAmenities ? currentAmenityOptions : currentAmenityOptions.slice(0, 6);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideCloseButton className="sm:max-w-lg p-0 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-6 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">Filters</DialogTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClearAll}
                className="text-muted-foreground"
              >
                Clear all
              </Button>
              <DialogClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </DialogClose>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 scrollbar-auto-fade">
          <div className="space-y-6">
            {/* For sale / To rent toggle - using shared component */}
            <TypeFilter 
              value={typeFilter} 
              onChange={setTypeFilter} 
              variant="inline" 
            />

            {/* Property type - using shared component */}
            <PropertyTypeFilter
              category={propertyCategory}
              subtypes={propertySubtypes}
              onCategoryChange={setPropertyCategory}
              onSubtypesChange={setPropertySubtypes}
              variant="inline"
            />

            {/* Price - using shared component */}
            <PriceFilter
              priceRange={priceRange}
              onChange={setPriceRange}
              variant="inline"
              isRent={isForRent}
            />

            {/* Size - not shown for garage */}
            {showSizeFilter && (
              <div className="space-y-4">
                <h3 className="font-semibold">Size (m²)</h3>
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

            {/* Bedrooms - only for residential properties (not buildings/land) */}
            {showRoomFilters && (
              <BedroomsFilter
                bedroomFilters={bedroomFilters}
                onChange={setBedroomFilters}
                variant="inline"
              />
            )}

            {/* Bathrooms - only for residential properties (not buildings/land) */}
            {showRoomFilters && (
              <div className="space-y-4">
                <h3 className="font-semibold">Bathrooms</h3>
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
              <div className="space-y-4">
                <h3 className="font-semibold">Rental contract type</h3>
                <div className="flex flex-wrap gap-2">
                  {rentalContractOptions.map(option => (
                    <FilterChip
                      key={option.key}
                      label={option.label}
                      selected={rentalContractType.includes(option.key)}
                      onClick={() => toggleArrayFilter(rentalContractType, setRentalContractType, option.key)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Occupancy status - only for sale + residential */}
            {showOccupancyStatus && (
              <div className="space-y-4">
                <h3 className="font-semibold">Occupancy status</h3>
                <div className="flex flex-wrap gap-2">
                  {occupancyOptions.map(option => (
                    <FilterChip
                      key={option.key}
                      label={option.label}
                      selected={occupancyStatus.includes(option.key)}
                      onClick={() => toggleArrayFilter(occupancyStatus, setOccupancyStatus, option.key)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Property condition */}
            {showPropertyCondition && (
              <div className="space-y-4">
                <h3 className="font-semibold">Property condition</h3>
                <div className="flex flex-wrap gap-2">
                  {conditionOptions.map(option => (
                    <FilterChip
                      key={option.key}
                      label={option.label}
                      selected={propertyCondition.includes(option.key)}
                      onClick={() => toggleArrayFilter(propertyCondition, setPropertyCondition, option.key)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* View - only for residential/garage (not buildings/land/commercial) */}
            {showFloorFilters && (
              <div className="space-y-4">
                <h3 className="font-semibold">View</h3>
                <div className="flex flex-wrap gap-2">
                  {viewOptions.map(option => (
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

            {/* Floor - for residential, commercial, garage (not buildings/land) */}
            {showFloor && (
              <div className="space-y-4">
                <h3 className="font-semibold">Floor</h3>
                <div className="flex flex-wrap gap-2">
                  {floorOptions.map(option => (
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
              <div className="space-y-4">
                <h3 className="font-semibold">Furnishing</h3>
                <div className="flex flex-wrap gap-2">
                  {furnishingOptions.map(option => (
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
              <div className="space-y-4">
                <h3 className="font-semibold">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {visibleAmenities.map(option => (
                    <FilterChip
                      key={option.key}
                      label={option.label}
                      selected={amenities.includes(option.key)}
                      onClick={() => toggleArrayFilter(amenities, setAmenities, option.key)}
                    />
                  ))}
                </div>
                {currentAmenityOptions.length > 6 && (
                  <button
                    onClick={() => setShowMoreAmenities(!showMoreAmenities)}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showMoreAmenities ? 'Show less' : 'Show more'}
                    {showMoreAmenities ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                )}
              </div>
            )}

            {/* Listing options */}
            <div className="space-y-4">
              <h3 className="font-semibold">Listing options</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm">Show only exclusive properties</span>
                <Switch
                  checked={showExclusiveOnly}
                  onCheckedChange={setShowExclusiveOnly}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Fixed footer */}
        <div className="px-6 py-4 shrink-0">
          <Button 
            onClick={handleApply}
            className="w-full h-14 text-base font-medium rounded-xl"
          >
            Show {totalResults} properties
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
