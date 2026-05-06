import { useState, ReactNode } from "react";
import { 
  Home, 
  Building2, 
  LandPlot, 
  Warehouse, 
  CarFront, 
  ChevronDown, 
  Euro, 
  Bed,
  Building,
  Castle,
  Columns3,
  Hotel,
  TreeDeciduous,
  Store,
  Factory,
  Briefcase,
  MapPin,
  Trees,
  Fence,
  Package,
  Box
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FloatingLabelSelect } from "@/components/ui/floating-label-select";
import { FloatingLabelCombobox } from "@/components/ui/floating-label-combobox";
import { cn } from "@/lib/utils";
import { OpportunityType } from "@/types";
import { AnimatedContainer } from "@/components/ui/animated-container";

// Shared filter options
export const priceOptions = [
  { value: "none", label: "No min." },
  { value: "50000", label: "€50,000" },
  { value: "100000", label: "€100,000" },
  { value: "150000", label: "€150,000" },
  { value: "200000", label: "€200,000" },
  { value: "300000", label: "€300,000" },
  { value: "500000", label: "€500,000" },
  { value: "750000", label: "€750,000" },
  { value: "1000000", label: "€1,000,000" },
  { value: "2000000", label: "€2,000,000" },
  { value: "5000000", label: "€5,000,000" },
];

export const maxPriceOptions = [
  { value: "none", label: "No max." },
  { value: "100000", label: "€100,000" },
  { value: "200000", label: "€200,000" },
  { value: "300000", label: "€300,000" },
  { value: "500000", label: "€500,000" },
  { value: "750000", label: "€750,000" },
  { value: "1000000", label: "€1,000,000" },
  { value: "2000000", label: "€2,000,000" },
  { value: "5000000", label: "€5,000,000" },
  { value: "10000000", label: "€10,000,000" },
];

export const bedroomOptions = ['studio', '1', '2', '3', '4', '5+'];

export type PropertyCategory = 'residential' | 'commercial' | 'building' | 'land' | 'storage' | 'garage';

export const residentialSubtypes = [
  { key: "apartment", label: "Apartment", icon: <Building className="w-3.5 h-3.5" /> },
  { key: "penthouse", label: "Penthouse", icon: <Building2 className="w-3.5 h-3.5" /> },
  { key: "loft", label: "Loft", icon: <Columns3 className="w-3.5 h-3.5" /> },
  { key: "duplex", label: "Duplex", icon: <Hotel className="w-3.5 h-3.5" /> },
  { key: "house", label: "House", icon: <Home className="w-3.5 h-3.5" /> },
  { key: "semi-detached", label: "Semi-detached", icon: <Home className="w-3.5 h-3.5" /> },
  { key: "townhouse", label: "Townhouse", icon: <Building className="w-3.5 h-3.5" /> },
  { key: "rustic-house", label: "Rustic house", icon: <TreeDeciduous className="w-3.5 h-3.5" /> },
  { key: "villa", label: "Villa", icon: <Castle className="w-3.5 h-3.5" /> },
];

export const commercialSubtypes = [
  { key: "shop", label: "Shop", icon: <Store className="w-3.5 h-3.5" /> },
  { key: "factory", label: "Factory", icon: <Factory className="w-3.5 h-3.5" /> },
  { key: "office", label: "Office", icon: <Briefcase className="w-3.5 h-3.5" /> },
];

export const buildingSubtypes = [
  { key: "commercial_building", label: "Commercial Building", icon: <Building2 className="w-3.5 h-3.5" /> },
  { key: "residential_building", label: "Residential Building", icon: <Building className="w-3.5 h-3.5" /> },
];

export const landSubtypes = [
  { key: "commercial_plot", label: "Commercial Plot", icon: <MapPin className="w-3.5 h-3.5" /> },
  { key: "residential_plot", label: "Residential Plot", icon: <Fence className="w-3.5 h-3.5" /> },
  { key: "non_buildable_plot", label: "Non-Buildable Plot", icon: <Trees className="w-3.5 h-3.5" /> },
];

export const storageSubtypes = [
  { key: "storage", label: "Storage", icon: <Package className="w-3.5 h-3.5" /> },
  { key: "warehouse", label: "Warehouse", icon: <Box className="w-3.5 h-3.5" /> },
];

export function getSubtypesForCategory(category: PropertyCategory) {
  switch (category) {
    case 'residential':
      return residentialSubtypes;
    case 'commercial':
      return commercialSubtypes;
    case 'building':
      return buildingSubtypes;
    case 'land':
      return landSubtypes;
    case 'storage':
      return storageSubtypes;
    default:
      return [];
  }
}

// Reusable FilterChip component
export function FilterChip({ 
  label, 
  selected, 
  onClick,
  icon,
  className
}: { 
  label: string; 
  selected: boolean; 
  onClick: () => void;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors",
        selected 
          ? "bg-foreground text-background border-foreground" 
          : "bg-card text-foreground border-border hover:bg-muted",
        className
      )}
    >
      {icon}
      {label}
    </button>
  );
}

// Filter Header Component with title and clear button
function FilterHeader({ 
  title, 
  onClear, 
  showClear = true 
}: { 
  title: string; 
  onClear: () => void; 
  showClear?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="font-semibold">{title}</h3>
      {showClear && (
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={onClear}
          className="h-7 px-2 text-xs"
        >
          Clear
        </Button>
      )}
    </div>
  );
}

// Filter Apply Button Component
function FilterApplyButton({ 
  resultCount, 
  onClick 
}: { 
  resultCount: number; 
  onClick: () => void;
}) {
  return (
    <Button 
      onClick={onClick}
      className="w-full rounded-lg bg-foreground text-background hover:bg-foreground/90 mt-4"
    >
      Show {resultCount} properties
    </Button>
  );
}

// Sliding Toggle Component
interface SlidingToggleProps {
  value: OpportunityType;
  onChange: (value: OpportunityType) => void;
}

function SlidingToggle({ value, onChange }: SlidingToggleProps) {
  return (
    <div className="relative flex p-1.5 bg-card border border-input rounded-full">
      {/* Sliding background indicator */}
      <div 
        className={cn(
          "absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-foreground rounded-full shadow-sm transition-transform duration-300 ease-out",
          value === 'lease' ? "translate-x-[calc(100%+6px)]" : "translate-x-0"
        )}
      />
      
      {/* Toggle buttons */}
      <button
        type="button"
        onClick={() => onChange('sell')}
        className={cn(
          "relative z-10 flex-1 py-3 px-6 text-sm font-medium rounded-full transition-colors duration-200",
          value === 'sell' ? "text-background" : "text-muted-foreground hover:text-foreground"
        )}
      >
        For sale
      </button>
      <button
        type="button"
        onClick={() => onChange('lease')}
        className={cn(
          "relative z-10 flex-1 py-3 px-6 text-sm font-medium rounded-full transition-colors duration-200",
          value === 'lease' ? "text-background" : "text-muted-foreground hover:text-foreground"
        )}
      >
        To rent
      </button>
    </div>
  );
}

// Type Filter Component (For sale / To rent)
interface TypeFilterProps {
  value: OpportunityType;
  onChange: (value: OpportunityType) => void;
  variant?: 'popover' | 'inline';
  resultCount?: number;
}

export function TypeFilter({ value, onChange, variant = 'popover', resultCount = 0 }: TypeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempValue, setTempValue] = useState<OpportunityType>(value);

  const handleOpen = (open: boolean) => {
    if (open) {
      setTempValue(value);
    }
    setIsOpen(open);
  };

  const handleApply = () => {
    onChange(tempValue);
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempValue('sell');
  };

  if (variant === 'inline') {
    return <SlidingToggle value={value} onChange={onChange} />;
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="default" className="rounded-lg bg-foreground text-background hover:bg-foreground/90 shrink-0">
          {value === 'sell' ? 'For sale' : 'To rent'}
          <ChevronDown className="w-4 h-4 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 bg-background" align="start">
        <div className="space-y-4">
          <FilterHeader title="Listing type" onClear={handleClear} />
          <SlidingToggle value={tempValue} onChange={setTempValue} />
          <FilterApplyButton resultCount={resultCount} onClick={handleApply} />
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Property Type Filter Component
interface PropertyTypeFilterProps {
  category: PropertyCategory;
  subtypes: string[];
  onCategoryChange: (category: PropertyCategory) => void;
  onSubtypesChange: (subtypes: string[]) => void;
  variant?: 'popover' | 'inline';
  resultCount?: number;
  /** Hide the label in inline mode (useful when parent provides its own label) */
  hideLabel?: boolean;
}

export function PropertyTypeFilter({ 
  category, 
  subtypes, 
  onCategoryChange, 
  onSubtypesChange,
  variant = 'popover',
  resultCount = 0,
  hideLabel = false,
}: PropertyTypeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempCategory, setTempCategory] = useState<PropertyCategory>(category);
  const [tempSubtypes, setTempSubtypes] = useState<string[]>(subtypes);

  const handleOpen = (open: boolean) => {
    if (open) {
      setTempCategory(category);
      setTempSubtypes(subtypes);
    }
    setIsOpen(open);
  };

  const handleApply = () => {
    onCategoryChange(tempCategory);
    onSubtypesChange(tempSubtypes);
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempCategory('residential');
    setTempSubtypes([]);
  };

  const toggleSubtype = (subtype: string) => {
    if (tempSubtypes.includes(subtype)) {
      setTempSubtypes(tempSubtypes.filter(s => s !== subtype));
    } else {
      setTempSubtypes([...tempSubtypes, subtype]);
    }
  };

  const handleCategoryChange = (newCategory: PropertyCategory) => {
    setTempCategory(newCategory);
    setTempSubtypes([]);
  };

  const categorySubtypes = getSubtypesForCategory(variant === 'inline' ? category : tempCategory);

  const renderContent = (currentCategory: PropertyCategory, currentSubtypes: string[], onToggleSubtype: (s: string) => void, onCatChange: (c: PropertyCategory) => void) => (
    <>
      <FloatingLabelSelect 
        label="Category"
        value={currentCategory} 
        onValueChange={(val) => onCatChange(val as PropertyCategory)}
        options={[
          { value: "residential", label: "Residential" },
          { value: "commercial", label: "Commercial" },
          { value: "building", label: "Building" },
          { value: "land", label: "Land" },
          { value: "storage", label: "Storage" },
          { value: "garage", label: "Garage" },
        ]}
      />

      {getSubtypesForCategory(currentCategory).length > 0 && (
        <AnimatedContainer animation="fade-in" key={currentCategory}>
          <div className="flex flex-wrap gap-2">
            {getSubtypesForCategory(currentCategory).map((subtype) => {
              const iconValue = 'icon' in subtype ? (subtype as { key: string; label: string; icon: ReactNode }).icon : undefined;
              return (
                <FilterChip
                  key={subtype.key}
                  label={subtype.label}
                  icon={iconValue}
                  selected={currentSubtypes.includes(subtype.key)}
                  onClick={() => onToggleSubtype(subtype.key)}
                />
              );
            })}
          </div>
        </AnimatedContainer>
      )}
    </>
  );

  if (variant === 'inline') {
    const inlineToggle = (subtype: string) => {
      if (subtypes.includes(subtype)) {
        onSubtypesChange(subtypes.filter(s => s !== subtype));
      } else {
        onSubtypesChange([...subtypes, subtype]);
      }
    };
    
    const inlineCategoryChange = (newCategory: PropertyCategory) => {
      onCategoryChange(newCategory);
      onSubtypesChange([]);
    };

    return (
      <div className="space-y-4">
        {!hideLabel && <h3 className="font-semibold">Property type</h3>}
        {renderContent(category, subtypes, inlineToggle, inlineCategoryChange)}
      </div>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="default" className="rounded-lg bg-foreground text-background hover:bg-foreground/90 shrink-0">
          <span>
            {category.charAt(0).toUpperCase() + category.slice(1)}
            {subtypes.length > 0 && `: ${subtypes.length} selected`}
          </span>
          <ChevronDown className="w-4 h-4 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 bg-background" align="start">
        <div className="space-y-4">
          <FilterHeader title="Property type" onClear={handleClear} />
          {renderContent(tempCategory, tempSubtypes, toggleSubtype, handleCategoryChange)}
          <FilterApplyButton resultCount={resultCount} onClick={handleApply} />
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Price Filter Component
export type PriceRangeType = [number | undefined, number | undefined];

interface PriceFilterProps {
  priceRange: PriceRangeType;
  onChange: (range: PriceRangeType) => void;
  variant?: 'popover' | 'inline';
  resultCount?: number;
  isRent?: boolean;
  /** Hide the label in inline mode (useful when parent provides its own label) */
  hideLabel?: boolean;
  /** Dark mode styling for use inside dark containers like the matches modal */
  darkMode?: boolean;
}

export function PriceFilter({ priceRange, onChange, variant = 'popover', resultCount = 0, isRent = false, hideLabel = false, darkMode = false }: PriceFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempRange, setTempRange] = useState<PriceRangeType>(priceRange);

  const handleOpen = (open: boolean) => {
    if (open) {
      setTempRange(priceRange);
    }
    setIsOpen(open);
  };

  const handleApply = () => {
    onChange(tempRange);
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempRange([undefined, undefined]);
  };

  const formatPriceDisplay = (value: string) => {
    const num = parseInt(value);
    if (isNaN(num)) return value;
    return `€${num.toLocaleString()}`;
  };

  const parsePriceInput = (input: string) => {
    // Remove currency symbol, spaces, and commas
    const cleaned = input.replace(/[€\s,]/g, '');
    const num = parseInt(cleaned);
    return isNaN(num) ? '' : num.toString();
  };

  const renderSelects = (range: PriceRangeType, setRange: (r: PriceRangeType) => void) => (
    <div className="grid grid-cols-2 gap-4">
      <FloatingLabelCombobox 
        label="Min."
        value={range[0] !== undefined ? range[0].toString() : "none"} 
        onValueChange={(val) => setRange([val === "none" || val === "" ? undefined : parseInt(val), range[1]])}
        options={priceOptions}
        formatDisplayValue={formatPriceDisplay}
        parseInputValue={parsePriceInput}
        type="text"
        prefix="€"
      />
      <FloatingLabelCombobox 
        label="Max."
        value={range[1] !== undefined ? range[1].toString() : "none"} 
        onValueChange={(val) => setRange([range[0], val === "none" || val === "" ? undefined : parseInt(val)])}
        options={maxPriceOptions}
        formatDisplayValue={formatPriceDisplay}
        parseInputValue={parsePriceInput}
        type="text"
        prefix="€"
      />
    </div>
  );

  const priceLabel = isRent ? 'Price (€/month)' : 'Price (€)';

  if (variant === 'inline') {
    return (
      <div className="space-y-4">
        {!hideLabel && <h3 className="font-semibold">{priceLabel}</h3>}
        {renderSelects(priceRange, onChange)}
      </div>
    );
  }

  const getPriceLabel = () => {
    const min = priceRange[0];
    const max = priceRange[1];
    if (min === undefined && max === undefined) return 'Price';
    if (min === undefined && max !== undefined) return `Up to €${(max / 1000).toFixed(0)}k`;
    if (min !== undefined && max === undefined) return `€${(min / 1000).toFixed(0)}k+`;
    return `€${(min! / 1000).toFixed(0)}k - €${(max! / 1000).toFixed(0)}k`;
  };

  const hasActiveFilter = priceRange[0] !== undefined || priceRange[1] !== undefined;

  return (
    <Popover open={isOpen} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant={hasActiveFilter ? "default" : "outline"} 
          className={cn(
            "rounded-full shrink-0",
            darkMode
              ? hasActiveFilter
                ? "bg-white text-zinc-900 hover:bg-white/90 border-white"
                : "bg-white/10 text-white border-white/20 hover:bg-white/20"
              : hasActiveFilter 
                ? "bg-foreground text-background hover:bg-foreground/90"
                : "bg-card"
          )}
        >
          <Euro className="w-4 h-4 mr-2" />
          {getPriceLabel()}
          <ChevronDown className="w-4 h-4 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 bg-background z-[200]" align="start">
        <div className="space-y-4">
          <FilterHeader title="Price (€)" onClear={handleClear} />
          {renderSelects(tempRange, setTempRange)}
          <FilterApplyButton resultCount={resultCount} onClick={handleApply} />
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Bedrooms Filter Component
interface BedroomsFilterProps {
  bedroomFilters: string[];
  onChange: (filters: string[]) => void;
  variant?: 'popover' | 'inline';
  resultCount?: number;
  /** Hide the label in inline mode (useful when parent provides its own label) */
  hideLabel?: boolean;
  /** Dark mode styling for use inside dark containers like the matches modal */
  darkMode?: boolean;
}

export function BedroomsFilter({ bedroomFilters, onChange, variant = 'popover', resultCount = 0, hideLabel = false, darkMode = false }: BedroomsFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<string[]>(bedroomFilters);

  const handleOpen = (open: boolean) => {
    if (open) {
      setTempFilters(bedroomFilters);
    }
    setIsOpen(open);
  };

  const handleApply = () => {
    onChange(tempFilters);
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempFilters([]);
  };

  const toggleBedroom = (option: string, filters: string[], setFilters: (f: string[]) => void) => {
    if (filters.includes(option)) {
      setFilters(filters.filter(o => o !== option));
    } else {
      setFilters([...filters, option]);
    }
  };

  const renderChips = (filters: string[], setFilters: (f: string[]) => void) => (
    <div className="flex flex-wrap gap-2">
      {bedroomOptions.map((option) => (
        <FilterChip
          key={option}
          label={option === 'studio' ? 'Studio' : option}
          selected={filters.includes(option)}
          onClick={() => toggleBedroom(option, filters, setFilters)}
        />
      ))}
    </div>
  );

  if (variant === 'inline') {
    return (
      <div className="space-y-3">
        {!hideLabel && <h3 className="font-semibold">Bedrooms</h3>}
        {renderChips(bedroomFilters, onChange)}
      </div>
    );
  }

  const getBedroomsLabel = () => {
    if (bedroomFilters.length === 0) return 'Bedrooms';
    if (bedroomFilters.length === 1) {
      return bedroomFilters[0] === 'studio' ? 'Studio' : `${bedroomFilters[0]} bed`;
    }
    return `${bedroomFilters.length} selected`;
  };

  const hasActiveFilter = bedroomFilters.length > 0;

  return (
    <Popover open={isOpen} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant={hasActiveFilter ? "default" : "outline"} 
          className={cn(
            "rounded-full shrink-0",
            darkMode
              ? hasActiveFilter
                ? "bg-white text-zinc-900 hover:bg-white/90 border-white"
                : "bg-white/10 text-white border-white/20 hover:bg-white/20"
              : hasActiveFilter 
                ? "bg-foreground text-background hover:bg-foreground/90"
                : "bg-card"
          )}
        >
          <Bed className="w-4 h-4 mr-2" />
          {getBedroomsLabel()}
          <ChevronDown className="w-4 h-4 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4 bg-background z-[200]" align="start">
        <div className="space-y-4">
          <FilterHeader title="Bedrooms" onClear={handleClear} />
          {renderChips(tempFilters, setTempFilters)}
          <FilterApplyButton resultCount={resultCount} onClick={handleApply} />
        </div>
      </PopoverContent>
    </Popover>
  );
}
