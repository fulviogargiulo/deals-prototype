import { MapPin, Euro, Bed, TrendingUp, Building, Info, Snowflake, Car, Trees, Dumbbell, Shield, Waves, PawPrint, Warehouse, DoorOpen, Sparkles, Eye, Home, Bath } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface MatchingPreference {
  icon: keyof typeof iconMap;
  label: string;
  type: 'exact' | 'close';
}

// For property cards - matching client preferences
export interface PropertyMatchData {
  propertyType: string;
  location: string;
  price: number;
  currency: string;
  bedrooms: number;
  size: number;
  sizeUnit: string;
  bathrooms?: number;
  matchingPreferences?: string[];
  extras?: string[];
}

// For client cards - client preferences to display
export interface ClientMatchData {
  propertyTypes: string[];
  locations: string[];
  priceRange: { min: number; max: number; currency: string };
  bedrooms: number;
  sizeRange: { min: number; max: number; unit: string };
  extras: string[];
}

interface MatchingPreferencePillsProps {
  // For properties
  propertyData?: PropertyMatchData;
  // For clients
  clientData?: ClientMatchData;
  // Display variant
  variant?: 'dark' | 'light';
  // Show all preferences (embedded mode) or limit with +X (card mode)
  showAll?: boolean;
  className?: string;
}

const iconMap = {
  building: Building,
  home: Home,
  location: MapPin,
  price: Euro,
  bedrooms: Bed,
  bathrooms: Bath,
  size: TrendingUp,
  airConditioning: Snowflake,
  balcony: DoorOpen,
  parking: Car,
  pets: PawPrint,
  pool: Waves,
  storage: Warehouse,
  garden: Trees,
  gym: Dumbbell,
  security: Shield,
  view: Eye,
  condition: Sparkles,
};

// Icon mapping for preference features
const getFeatureIcon = (feature: string): keyof typeof iconMap => {
  const lowerFeature = feature.toLowerCase();
  
  // Property types
  if (lowerFeature.includes('apartment') || lowerFeature.includes('flat')) return 'building';
  if (lowerFeature.includes('house') || lowerFeature.includes('villa') || lowerFeature.includes('penthouse')) return 'home';
  if (lowerFeature.includes('studio') || lowerFeature.includes('loft')) return 'building';
  
  // Amenities
  if (lowerFeature.includes('air conditioning') || lowerFeature.includes('ac')) return 'airConditioning';
  if (lowerFeature.includes('balcony') || lowerFeature.includes('terrace')) return 'balcony';
  if (lowerFeature.includes('parking') || lowerFeature.includes('garage')) return 'parking';
  if (lowerFeature.includes('pet') || lowerFeature.includes('pets')) return 'pets';
  if (lowerFeature.includes('pool')) return 'pool';
  if (lowerFeature.includes('storage')) return 'storage';
  if (lowerFeature.includes('garden')) return 'garden';
  if (lowerFeature.includes('gym')) return 'gym';
  if (lowerFeature.includes('security') || lowerFeature.includes('concierge')) return 'security';
  if (lowerFeature.includes('view') || lowerFeature.includes('views')) return 'view';
  if (lowerFeature.includes('condition') || lowerFeature.includes('renovated') || lowerFeature.includes('vacant')) return 'condition';
  
  // Default
  return 'building';
};

// Design system colors
const EXACT_GREEN = '#10B189';
const CLOSE_ORANGE = '#ED9917';

export function MatchingPreferencePills({
  propertyData,
  clientData,
  variant = 'dark',
  showAll = false,
  className,
}: MatchingPreferencePillsProps) {
  const isDark = variant === 'dark';
  
  // Build exact and close matches arrays separately
  const exactMatches: MatchingPreference[] = [];
  const closeMatches: MatchingPreference[] = [];
  
  if (propertyData) {
    // Property card: show what matches client preferences
    exactMatches.push({ icon: getFeatureIcon(propertyData.propertyType), label: propertyData.propertyType, type: 'exact' });
    exactMatches.push({ icon: 'location', label: propertyData.location, type: 'exact' });
    exactMatches.push({ icon: 'price', label: `${propertyData.currency}${(propertyData.price / 1000).toFixed(0)}k`, type: 'exact' });
    
    // Add extras as exact matches
    if (propertyData.extras) {
      propertyData.extras.forEach(extra => {
        exactMatches.push({ icon: getFeatureIcon(extra), label: extra, type: 'exact' });
      });
    }
    
    closeMatches.push({ icon: 'bedrooms', label: String(propertyData.bedrooms), type: 'close' });
    closeMatches.push({ icon: 'size', label: `${propertyData.size} ${propertyData.sizeUnit}`, type: 'close' });
    if (propertyData.bathrooms) {
      closeMatches.push({ icon: 'bathrooms', label: String(propertyData.bathrooms), type: 'close' });
    }
  } else if (clientData) {
    // Client card: show client's preferences
    if (clientData.propertyTypes[0]) {
      exactMatches.push({ icon: getFeatureIcon(clientData.propertyTypes[0]), label: clientData.propertyTypes[0], type: 'exact' });
    }
    
    // Locations with +N in card mode, all in showAll mode
    if (clientData.locations.length > 0) {
      const locationLabel = clientData.locations.length > 1 && !showAll
        ? `${clientData.locations[0]} +${clientData.locations.length - 1}`
        : clientData.locations[0];
      exactMatches.push({ icon: 'location', label: locationLabel, type: 'exact' });
      
      // In showAll mode, add remaining locations
      if (showAll && clientData.locations.length > 1) {
        clientData.locations.slice(1).forEach(loc => {
          exactMatches.push({ icon: 'location', label: loc, type: 'exact' });
        });
      }
    }
    
    // Add extras as exact matches
    if (clientData.extras) {
      clientData.extras.forEach(extra => {
        exactMatches.push({ icon: getFeatureIcon(extra), label: extra, type: 'exact' });
      });
    }
    
    // Close matches - price range, bedrooms, size
    closeMatches.push({ 
      icon: 'price', 
      label: `${clientData.priceRange.currency}${(clientData.priceRange.min / 1000).toFixed(0)}-${(clientData.priceRange.max / 1000).toFixed(0)}k`, 
      type: 'close' 
    });
    closeMatches.push({ icon: 'bedrooms', label: String(clientData.bedrooms), type: 'close' });
    closeMatches.push({ 
      icon: 'size', 
      label: `${clientData.sizeRange.min}-${clientData.sizeRange.max} ${clientData.sizeRange.unit}`, 
      type: 'close' 
    });
  }
  
  // For card mode (not showAll), combine and limit
  if (!showAll) {
    const allPrefs = [...exactMatches, ...closeMatches];
    const displayLimit = 5;
    const displayPrefs = allPrefs.slice(0, displayLimit);
    const remainingCount = allPrefs.length - displayLimit;
    
    const pillBaseClass = cn(
      "inline-flex items-center gap-1.5 rounded-full font-medium text-xs px-3 py-1.5 text-white"
    );

    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {displayPrefs.map((pref, idx) => {
          const IconComponent = iconMap[pref.icon];
          const bgColor = pref.type === 'exact' 
            ? 'rgba(16, 177, 137, 0.4)' 
            : 'rgba(237, 153, 23, 0.4)';
          const iconColor = pref.type === 'exact' ? EXACT_GREEN : CLOSE_ORANGE;
          
          return (
            <div 
              key={idx}
              className={cn(pillBaseClass, "border-0")}
              style={{ backgroundColor: bgColor }}
            >
              <IconComponent className="h-3 w-3" style={{ color: iconColor }} />
              {pref.label}
            </div>
          );
        })}
        {remainingCount > 0 && (
          <div 
            className={cn(pillBaseClass)}
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)' }}
          >
            +{remainingCount}
          </div>
        )}
      </div>
    );
  }
  
  // For embedded mode (showAll), show sections with headers
  const pillBaseClass = cn(
    "inline-flex items-center gap-1.5 rounded-full font-medium text-sm px-3 py-1.5"
  );
  
  const sectionLabelClass = "text-sm font-normal text-muted-foreground";
  const infoIconClass = "h-4 w-4 text-muted-foreground cursor-help";

  return (
    <div className={cn("space-y-4", className)}>
      {/* Exact match section */}
      {exactMatches.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <span className={sectionLabelClass}>Exact match</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className={infoIconClass} />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs p-4">
                  <p className="font-semibold mb-2">What is an exact match?</p>
                  <p className="text-sm text-muted-foreground">
                    Exact matches happen when the property's features perfectly align with what the client requested.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex flex-wrap gap-2">
            {exactMatches.map((pref, idx) => {
              const IconComponent = iconMap[pref.icon];
              return (
                <div 
                  key={idx}
                  className={cn(pillBaseClass, "border-0 text-foreground")}
                  style={{ backgroundColor: 'rgba(16, 177, 137, 0.15)' }}
                >
                  <IconComponent className="h-4 w-4" style={{ color: EXACT_GREEN }} />
                  {pref.label}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Close match section */}
      {closeMatches.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <span className={sectionLabelClass}>Close match</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className={infoIconClass} />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs p-4">
                  <p className="font-semibold mb-2">What is a close match?</p>
                  <p className="text-sm text-muted-foreground">
                    Close matches are features that don't exactly meet the client's preferences but may still offer great value.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex flex-wrap gap-2">
            {closeMatches.map((pref, idx) => {
              const IconComponent = iconMap[pref.icon];
              return (
                <div 
                  key={idx}
                  className={cn(pillBaseClass, "border-0 text-foreground")}
                  style={{ backgroundColor: 'rgba(237, 153, 23, 0.15)' }}
                >
                  <IconComponent className="h-4 w-4" style={{ color: CLOSE_ORANGE }} />
                  {pref.label}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {exactMatches.length === 0 && closeMatches.length === 0 && (
        <p className="text-sm text-muted-foreground">No matching preferences found</p>
      )}
    </div>
  );
}
