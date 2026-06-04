import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronDown, Euro, X, ArrowUpDown, Map, Bed, Bath, Square, MapPin, Clock, ChevronLeft, ChevronRight, SlidersHorizontal, Check } from "lucide-react";
import { PropertyCard } from "@/components/properties/property-card";
import apartmentImage from "@/assets/apartment-la-latina-1.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { PropertiesDevTool, PropertyTypeMode, CarouselStyleMode } from "@/components/dev-tools/properties-dev-tool";
import { Opportunity } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyPropertiesState } from "@/components/properties/empty-properties-state";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/ui/status-badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useData, mockAgents } from "@/contexts/data-context";
import { useDevTools } from "@/contexts/dev-tools-context";
import { TrackedTitle } from "@/components/ui/tracked-title";
import { OpportunityType } from "@/types";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { ContentSkeleton } from "@/components/ui/content-skeleton";
import { AllFiltersModal } from "@/components/modals/all-filters-modal";
import { PageContainer } from "@/components/layout/page-container";
import { 
  TypeFilter, 
  PropertyTypeFilter, 
  PriceFilter, 
  BedroomsFilter,
  PropertyCategory,
  PriceRangeType
} from "@/components/filters/filter-components";

export function PropertiesList() {
  const {
    opportunities
  } = useData();
  const {
    loadingDelay,
    showSubtitles,
    skeletonTargets
  } = useDevTools();
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [typeFilter, setTypeFilter] = useState<OpportunityType>('sell');
  const [priceRange, setPriceRange] = useState<PriceRangeType>([undefined, undefined]);
  const [bedroomFilters, setBedroomFilters] = useState<string[]>([]);
  const [propertyCategory, setPropertyCategory] = useState<PropertyCategory>('residential');
  const [propertySubtypes, setPropertySubtypes] = useState<string[]>([]);
  const [propertyTypeMode, setPropertyTypeMode] = useState<PropertyTypeMode>('default');
  const [carouselStyleMode, setCarouselStyleMode] = useState<CarouselStyleMode>('alternative');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [locationSearchOpen, setLocationSearchOpen] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const [maxVisiblePills, setMaxVisiblePills] = useState(2);
  const [sortBy, setSortBy] = useState<'newest' | 'price-high' | 'price-low' | 'size-high' | 'size-low'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [contentKey, setContentKey] = useState(0);
  const [allFiltersOpen, setAllFiltersOpen] = useState(false);
  // Additional filter states for the modal
  const [sizeRange, setSizeRange] = useState<[number, number]>([0, 10000]);
  const [bathroomMin, setBathroomMin] = useState('any');
  const [occupancyStatus, setOccupancyStatus] = useState<string[]>([]);
  const [propertyCondition, setPropertyCondition] = useState<string[]>([]);
  const [viewType, setViewType] = useState<string[]>([]);
  const [floorLevel, setFloorLevel] = useState<string[]>([]);
  const [furnishing, setFurnishing] = useState<string[]>([]);
  const [rentalContractType, setRentalContractType] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [showExclusiveOnly, setShowExclusiveOnly] = useState(false);
  const itemsPerPage = 12;
  const navigate = useNavigate();

  // Mock location data
  const recentSearches = ['Retiro', 'Goya', 'Salamanca'];
  const allLocations = [{
    name: 'Chamberi',
    subtitle: 'District in Madrid'
  }, {
    name: 'Salamanca',
    subtitle: 'District in Madrid'
  }, {
    name: 'Salvador',
    subtitle: 'District in Madrid'
  }, {
    name: 'Salares',
    subtitle: 'District in Málaga'
  }, {
    name: 'Salinas',
    subtitle: 'District in Málaga'
  }, {
    name: 'Retiro',
    subtitle: 'District in Madrid'
  }, {
    name: 'Goya',
    subtitle: 'Neighbourhood in Madrid'
  }, {
    name: 'Malasaña',
    subtitle: 'Neighbourhood in Madrid'
  }, {
    name: 'La Latina',
    subtitle: 'District in Madrid'
  }];
  const filteredLocations = allLocations.filter(loc => loc.name.toLowerCase().includes(locationSearchQuery.toLowerCase()) || loc.subtitle.toLowerCase().includes(locationSearchQuery.toLowerCase()));

  // Sample property images for variety
  const propertyImages = ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop'];
  const getRandomImage = (index: number) => propertyImages[index % propertyImages.length];

  // Generate mock properties based on dev tool mode
  const generateMockProperties = (): Opportunity[] => {
    if (propertyTypeMode === 'default') {
      // Add varied images to existing opportunities
      return opportunities.filter(opp => opp.type === 'sell' || opp.type === 'lease').map((opp, idx) => ({
        ...opp,
        images: opp.images?.length ? opp.images : [getRandomImage(idx)]
      }));
    }
    const baseMockProperty: Opportunity = {
      id: 'mock-',
      clientId: 'mock-client',
      type: typeFilter,
      status: 'active',
      title: '',
      priceRange: {
        min: 300000,
        max: 500000,
        currency: '€'
      },
      bedrooms: 2,
      bathrooms: 1,
      sizeRange: {
        min: 80,
        max: 80,
        unit: 'm²'
      },
      neighborhoods: ['La Latina', 'Malasaña'],
      tags: ['New'],
      portalBadges: [],
      updatesCount: 0,
      pendingActions: [],
      propertyTypes: ['apartment'],
      images: [propertyImages[0]],
      agentId: 'agent-1',
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    };
    const mockProperties: Opportunity[] = [];
    switch (propertyTypeMode) {
      case 'apartments':
        for (let i = 0; i < 6; i++) {
          mockProperties.push({
            ...baseMockProperty,
            id: `mock-apartment-${i}`,
            title: `Modern Apartment ${i + 1}`,
            propertyTypes: ['apartment'],
            images: [getRandomImage(i)],
            priceRange: {
              min: 250000 + i * 50000,
              max: 300000 + i * 50000,
              currency: '€'
            },
            bedrooms: 1 + i % 3
          });
        }
        break;
      case 'penthouses':
        for (let i = 0; i < 4; i++) {
          mockProperties.push({
            ...baseMockProperty,
            id: `mock-penthouse-${i}`,
            title: `Luxury Penthouse ${i + 1}`,
            propertyTypes: ['penthouse'],
            images: [getRandomImage(i + 4)],
            priceRange: {
              min: 800000 + i * 200000,
              max: 1000000 + i * 200000,
              currency: '€'
            },
            bedrooms: 3 + i,
            bathrooms: 2 + i
          });
        }
        break;
      case 'houses':
        for (let i = 0; i < 5; i++) {
          mockProperties.push({
            ...baseMockProperty,
            id: `mock-house-${i}`,
            title: `Beautiful House ${i + 1}`,
            propertyTypes: ['house'],
            images: [getRandomImage(i + 3)],
            priceRange: {
              min: 500000 + i * 100000,
              max: 600000 + i * 100000,
              currency: '€'
            },
            bedrooms: 3 + i,
            bathrooms: 2
          });
        }
        break;
      case 'commercial':
        for (let i = 0; i < 4; i++) {
          mockProperties.push({
            ...baseMockProperty,
            id: `mock-commercial-${i}`,
            title: `Commercial Space ${i + 1}`,
            propertyTypes: [['shop', 'office', 'factory'][i % 3]],
            images: [getRandomImage(i + 6)],
            priceRange: {
              min: 300000 + i * 150000,
              max: 400000 + i * 150000,
              currency: '€'
            },
            bedrooms: undefined,
            bathrooms: undefined
          });
        }
        break;
      case 'mixed':
        const types = ['apartment', 'penthouse', 'house', 'shop'];
        for (let i = 0; i < 8; i++) {
          mockProperties.push({
            ...baseMockProperty,
            id: `mock-mixed-${i}`,
            title: `Property ${i + 1}`,
            propertyTypes: [types[i % types.length]],
            images: [getRandomImage(i)],
            priceRange: {
              min: 200000 + i * 100000,
              max: 300000 + i * 100000,
              currency: '€'
            },
            bedrooms: i % 2 === 0 ? 2 + i % 3 : undefined
          });
        }
        break;
      case 'many':
        const propertyTypes = ['apartment', 'penthouse', 'house', 'shop', 'office', 'warehouse'];
        const locations = ['La Latina', 'Malasaña', 'Salamanca', 'Retiro', 'Chamberi', 'Goya', 'Chueca'];
        for (let i = 0; i < 120; i++) {
          mockProperties.push({
            ...baseMockProperty,
            id: `mock-many-${i}`,
            title: `Property ${i + 1} - ${propertyTypes[i % propertyTypes.length]}`,
            propertyTypes: [propertyTypes[i % propertyTypes.length]],
            images: [getRandomImage(i)],
            priceRange: {
              min: 150000 + i * 37821 % 2000000,
              max: 200000 + i * 43217 % 2000000,
              currency: '€'
            },
            bedrooms: i % 5 === 0 ? undefined : 1 + i % 4,
            bathrooms: i % 7 === 0 ? undefined : 1 + i % 3,
            neighborhoods: [locations[i % locations.length], locations[(i + 1) % locations.length]],
            source: i % 3 === 0 ? 'idealista' : i % 3 === 1 ? 'fotocasa' : undefined,
            createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
          });
        }
        break;
    }
    return mockProperties;
  };

  // Filter for supply opportunities (sell/lease) - these are "public" properties
  const supplyOpportunities = generateMockProperties();
  const filteredAndSortedProperties = supplyOpportunities.filter(property => {
    const matchesType = property.type === typeFilter;

    // Match price range filter
    let matchesPrice = true;
    if (property.priceRange) {
      const maxPrice = property.priceRange.max;
      const minFilter = priceRange[0];
      const maxFilter = priceRange[1];
      matchesPrice = (minFilter === undefined || maxPrice >= minFilter) && 
                     (maxFilter === undefined || maxPrice <= maxFilter);
    }

    // Match subtype filter (empty array means all)
    const matchesSubtype = propertySubtypes.length === 0 || property.propertyTypes && property.propertyTypes.some(pt => propertySubtypes.includes(pt));

    // Match location filter (empty array means all)
    const matchesLocation = selectedLocations.length === 0 || property.neighborhoods.some(n => selectedLocations.includes(n));

    // Match bedroom filter
    const matchesBedrooms = bedroomFilters.length === 0 || bedroomFilters.some(filter => {
      if (filter === 'studio') return property.bedrooms === 0;
      if (filter === '5+') return property.bedrooms !== undefined && property.bedrooms >= 5;
      const num = parseInt(filter);
      return property.bedrooms === num;
    });

    return matchesType && matchesPrice && matchesSubtype && matchesLocation && matchesBedrooms;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'price-high':
        return (b.priceRange?.max || 0) - (a.priceRange?.max || 0);
      case 'price-low':
        return (a.priceRange?.max || 0) - (b.priceRange?.max || 0);
      case 'size-high':
        return (b.sizeRange?.max || 0) - (a.sizeRange?.max || 0);
      case 'size-low':
        return (a.sizeRange?.max || 0) - (b.sizeRange?.max || 0);
      default:
        return 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedProperties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProperties = filteredAndSortedProperties.slice(startIndex, endIndex);

  // Trigger loading when filters change
  useEffect(() => {
    if (loadingDelay > 0) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
        setContentKey(prev => prev + 1);
      }, loadingDelay);
      return () => clearTimeout(timer);
    } else {
      setContentKey(prev => prev + 1);
    }
  }, [selectedLocations, typeFilter, priceRange, propertySubtypes, bedroomFilters, sortBy, currentPage, viewMode, loadingDelay]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLocations, typeFilter, priceRange, propertySubtypes, bedroomFilters, sortBy]);

  // Responsive pills - calculate how many can fit based on container width
  useEffect(() => {
    const updateMaxPills = () => {
      if (searchBarRef.current) {
        const width = searchBarRef.current.offsetWidth;
        // Each pill ~90px avg, search icon ~40px, need ~80px for input
        // Available space for pills = width - 120 (icon + input minimum)
        const availableSpace = width - 120;
        const pillWidth = 95; // approximate width per pill including gap
        const maxPills = Math.max(0, Math.floor(availableSpace / pillWidth));
        setMaxVisiblePills(Math.min(maxPills, 5)); // cap at 5 pills max
      }
    };
    updateMaxPills();
    window.addEventListener('resize', updateMaxPills);
    // Also observe the element itself for size changes
    const resizeObserver = new ResizeObserver(updateMaxPills);
    if (searchBarRef.current) {
      resizeObserver.observe(searchBarRef.current);
    }
    return () => {
      window.removeEventListener('resize', updateMaxPills);
      resizeObserver.disconnect();
    };
  }, []);
  const formatPrice = (property: typeof supplyOpportunities[0]) => {
    if (!property.priceRange) return 'Price on request';
    const {
      max,
      currency
    } = property.priceRange;
    if (property.type === 'lease') {
      return `${currency}${max.toLocaleString()}/month`;
    }
    return `${currency}${max.toLocaleString()}`;
  };
  const getSortLabel = () => {
    switch (sortBy) {
      case 'newest':
        return 'Newest to Oldest';
      case 'price-high':
        return 'Price: High to Low';
      case 'price-low':
        return 'Price: Low to High';
      case 'size-high':
        return 'Size: High to Low';
      case 'size-low':
        return 'Size: Low to High';
    }
  };
  const renderPropertyCard = (property: typeof supplyOpportunities[0], index: number) => {
    // Get the agent from mockAgents based on agentId, or assign one based on index for variety
    const agentId = property.agentId || `agent-${index % mockAgents.length + 1}`;
    const agent = mockAgents.find(a => a.id === agentId) || mockAgents[index % mockAgents.length];
    
    // Calculate price and original price for price drop display
    const currentPrice = property.priceRange?.max;
    const originalPrice = property.originalPriceRange?.max;
    
    return <PropertyCard key={property.id} property={{
      ...property,
      images: property.images?.length ? property.images : [getRandomImage(index)],
      badges: property.portalBadges,
      agentName: agent?.name,
      agentImage: agent?.photo,
      price: currentPrice,
      originalPrice: originalPrice,
    }} onClick={() => navigate(`/properties/${property.id}`)} carouselStyle={carouselStyleMode} />;
  };
  return <PageContainer>
      {/* Invisible tracking sentinel for global header */}
      <TrackedTitle title="Search properties">
        <div className="h-px w-full" aria-hidden="true" />
      </TrackedTitle>
      
      <div className="space-y-6">
        <div className="flex justify-between items-center animate-fade-in-fast">
          <div>
            <h1 className="text-3xl font-semibold">Search properties</h1>
            {showSubtitles && <p className="text-muted-foreground">Browse available properties for sale and lease</p>}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-2 lg:gap-3 animate-fade-in-fast w-full overflow-hidden">
          {/* Search bar - full width on mobile/tablet, flex-1 on desktop */}
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
              ref={searchBarRef}
              className="relative w-full lg:flex-1"
              onMouseDown={(e) => {
                // Always prevent default and focus the input - this fixes the placeholder click issue
                e.preventDefault();
                locationInputRef.current?.focus();
              }}
            >
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 z-10 pointer-events-none" />
              <div className="flex h-10 w-full rounded-md border border-input bg-card text-sm ring-offset-background focus-within:border-primary transition-colors cursor-text items-center">
                <div className="flex items-center gap-1 flex-1 overflow-hidden pl-10 pr-3">
                  {selectedLocations.slice(0, maxVisiblePills).map((location) => (
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
                  {selectedLocations.length > maxVisiblePills && (
                    <Badge variant="default" className="bg-foreground text-background text-xs shrink-0">
                      +{selectedLocations.length - maxVisiblePills}
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
                    onBlur={() => {
                      // Small delay to allow clicking on dropdown items
                      setTimeout(() => {
                        if (!document.activeElement?.closest('[data-radix-popper-content-wrapper]')) {
                          setLocationSearchOpen(false);
                        }
                      }, 100);
                    }}
                    onKeyDown={(e) => {
                      // Calculate total items for keyboard navigation
                      // Only list items are navigable, not selected pills
                      const listItems = !locationSearchQuery 
                        ? recentSearches.filter(s => !selectedLocations.includes(s))
                        : filteredLocations.filter(l => !selectedLocations.includes(l.name)).map(l => l.name);
                      const totalItems = listItems.length;

                      if (e.key === 'Escape') {
                        e.preventDefault();
                        setLocationSearchOpen(false);
                        locationInputRef.current?.blur();
                      } else if (e.key === 'ArrowDown' && totalItems > 0) {
                        e.preventDefault();
                        setHighlightedIndex(prev => (prev + 1) % totalItems);
                      } else if (e.key === 'ArrowUp' && totalItems > 0) {
                        e.preventDefault();
                        setHighlightedIndex(prev => (prev - 1 + totalItems) % totalItems);
                      } else if (e.key === 'Enter' && totalItems > 0) {
                        e.preventDefault();
                        const selectedItem = listItems[highlightedIndex];
                        if (selectedItem && !selectedLocations.includes(selectedItem)) {
                          setSelectedLocations(prev => [...prev, selectedItem]);
                        }
                        setLocationSearchQuery('');
                        setHighlightedIndex(0);
                        // Keep dropdown open, just refocus input
                        locationInputRef.current?.focus();
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
                {(selectedLocations.length > 0 || locationSearchQuery) && (
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedLocations([]);
                      setLocationSearchQuery('');
                      locationInputRef.current?.focus();
                    }}
                    className="shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors mr-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
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
            <div className="max-h-80 overflow-y-auto space-y-4">
              {/* Recent searches section */}
              {!locationSearchQuery && (
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
                            // Keep dropdown open
                          }}
                          onMouseEnter={() => setHighlightedIndex(index)}
                          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-left transition-colors border bg-card ${
                            isHighlighted 
                              ? 'border-foreground' 
                              : 'border-transparent hover:bg-muted/50'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#0000000D' }}>
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
              )}

              {/* Search results section */}
              {locationSearchQuery && (
                filteredLocations.filter(l => !selectedLocations.includes(l.name)).length === 0 ? (
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
                            // Keep dropdown open
                          }}
                          onMouseEnter={() => setHighlightedIndex(index)}
                          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-left transition-colors border bg-card ${
                            isHighlighted 
                              ? 'border-foreground' 
                              : 'border-transparent hover:bg-muted/50'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#0000000D' }}>
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
                )
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Filters container - horizontally scrollable on mobile/tablet without causing page scroll */}
        <div className="flex gap-2 lg:gap-3 items-center overflow-x-auto lg:overflow-visible pb-1 lg:pb-0 scrollbar-hide w-full lg:w-auto lg:shrink-0">
          <TypeFilter 
            value={typeFilter} 
            onChange={setTypeFilter} 
            variant="popover"
            resultCount={filteredAndSortedProperties.length}
          />

          <PropertyTypeFilter
            category={propertyCategory}
            subtypes={propertySubtypes}
            onCategoryChange={setPropertyCategory}
            onSubtypesChange={setPropertySubtypes}
            variant="popover"
            resultCount={filteredAndSortedProperties.length}
          />

          <PriceFilter
            priceRange={priceRange}
            onChange={setPriceRange}
            variant="popover"
            resultCount={filteredAndSortedProperties.length}
          />

          <BedroomsFilter
            bedroomFilters={bedroomFilters}
            onChange={setBedroomFilters}
            variant="popover"
            resultCount={filteredAndSortedProperties.length}
          />

          {(() => {
            // Count active filters (excluding defaults: "for sale" and "residential")
            const moreFiltersCount = [
              priceRange[0] !== undefined || priceRange[1] !== undefined,
              bedroomFilters.length > 0,
              propertySubtypes.length > 0,
              sizeRange[0] !== 0 || sizeRange[1] !== 10000,
              bathroomMin !== 'any',
              occupancyStatus.length > 0,
              propertyCondition.length > 0,
              viewType.length > 0,
              floorLevel.length > 0,
              furnishing.length > 0,
              rentalContractType.length > 0,
              amenities.length > 0,
              showExclusiveOnly,
            ].filter(Boolean).length;

            return (
              <Button 
                variant="outline" 
                className="rounded-lg shrink-0 bg-card"
                onClick={() => setAllFiltersOpen(true)}
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                All filters
                {moreFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1.5 rounded-full bg-foreground text-background">
                    {moreFiltersCount}
                  </Badge>
                )}
              </Button>
            );
          })()}
        </div>
      </div>

      {/* All Filters Modal */}
      <AllFiltersModal
        open={allFiltersOpen}
        onOpenChange={setAllFiltersOpen}
        typeFilter={typeFilter}
        propertyCategory={propertyCategory}
        propertySubtypes={propertySubtypes}
        priceRange={priceRange}
        sizeRange={sizeRange}
        bedroomFilters={bedroomFilters}
        bathroomMin={bathroomMin}
        occupancyStatus={occupancyStatus}
        propertyCondition={propertyCondition}
        viewType={viewType}
        floorLevel={floorLevel}
        furnishing={furnishing}
        rentalContractType={rentalContractType}
        amenities={amenities}
        showExclusiveOnly={showExclusiveOnly}
        onApply={(filters) => {
          setTypeFilter(filters.typeFilter);
          setPropertyCategory(filters.propertyCategory);
          setPropertySubtypes(filters.propertySubtypes);
          setPriceRange(filters.priceRange);
          setSizeRange(filters.sizeRange);
          setBedroomFilters(filters.bedroomFilters);
          setBathroomMin(filters.bathroomMin);
          setOccupancyStatus(filters.occupancyStatus);
          setPropertyCondition(filters.propertyCondition);
          setViewType(filters.viewType);
          setFloorLevel(filters.floorLevel);
          setFurnishing(filters.furnishing);
          setRentalContractType(filters.rentalContractType);
          setAmenities(filters.amenities);
          setShowExclusiveOnly(filters.showExclusiveOnly);
        }}
        totalResults={filteredAndSortedProperties.length}
      />

      {/* Results count and sorting row */}
      <div className="flex items-center justify-between animate-fade-in-fast gap-2 min-w-0">
        <p className="text-sm font-medium shrink-0">
          {filteredAndSortedProperties.length} properties
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 shrink-0">
              <ArrowUpDown className="w-4 h-4" />
              {getSortLabel()}
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSortBy('newest')}>
              {sortBy === 'newest' && '✓ '}Newest to Oldest
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('price-high')}>
              {sortBy === 'price-high' && '✓ '}Price: High to Low
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('price-low')}>
              {sortBy === 'price-low' && '✓ '}Price: Low to High
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('size-high')}>
              {sortBy === 'size-high' && '✓ '}Size: High to Low
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('size-low')}>
              {sortBy === 'size-low' && '✓ '}Size: Low to High
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {filteredAndSortedProperties.length === 0 ? <EmptyPropertiesState /> : isLoading && skeletonTargets.properties ? viewMode === 'card' ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 overflow-hidden">
            <ContentSkeleton variant="property-card" count={12} />
          </div> : viewMode === 'list' ? <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <ContentSkeleton variant="table-row" count={10} />
              </TableBody>
            </Table>
          </Card> : <div className="h-[600px] bg-muted rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">Loading map...</p>
          </div> : viewMode === 'card' ? <div className="space-y-6">
          <div key={contentKey} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-fade-in overflow-hidden">
            {paginatedProperties.map((property, index) => renderPropertyCard(property, index))}
          </div>
          
          {filteredAndSortedProperties.length > 0 && <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredAndSortedProperties.length)} of {filteredAndSortedProperties.length} properties
              </p>
              {totalPages > 1 && <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({
              length: Math.min(5, totalPages)
            }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return <Button key={pageNum} variant={currentPage === pageNum ? 'default' : 'outline'} size="sm" onClick={() => setCurrentPage(pageNum)} className="w-9">
                          {pageNum}
                        </Button>;
            })}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>}
            </div>}
        </div> : <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Bedrooms</TableHead>
                <TableHead>Bathrooms</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody key={`table-${currentPage}-${typeFilter}-${sortBy}`} className="animate-fade-in">
              {paginatedProperties.map((property, index) => {
            const agent = property.agentId ? mockAgents.find(a => a.id === property.agentId) : null;
            return <TableRow key={property.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/properties/${property.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-12 bg-muted rounded overflow-hidden">
                          <img src={property.images?.[0] || apartmentImage} alt={property.title} className="w-full h-full object-cover" onError={e => {
                      e.currentTarget.src = '/placeholder.svg';
                    }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{property.title}</span>
                            {property.source && <StatusBadge variant="portal">
                                {property.source}
                              </StatusBadge>}
                          </div>
                          {property.propertyTypes && <div className="flex gap-1 mt-1">
                              {property.propertyTypes.slice(0, 2).map(type => <StatusBadge key={type} variant="tag" className="text-xs">
                                  {type}
                                </StatusBadge>)}
                            </div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {agent ? <div className="flex items-center gap-2">
                          <UserAvatar name={agent.name} size="sm" />
                          <span className="text-sm">{agent.name}</span>
                        </div> : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      <StatusBadge variant="opportunity-type" status={property.type}>
                        For {property.type}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="font-medium">{formatPrice(property)}</TableCell>
                    <TableCell>{property.bedrooms || '-'}</TableCell>
                    <TableCell>{property.bathrooms || '-'}</TableCell>
                    <TableCell>
                      {property.sizeRange ? `${property.sizeRange.min}-${property.sizeRange.max} ${property.sizeRange.unit}` : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {property.neighborhoods.slice(0, 2).map(neighborhood => <StatusBadge key={neighborhood} variant="tag" className="text-xs">
                            {neighborhood}
                          </StatusBadge>)}
                        {property.neighborhoods.length > 2 && <span className="text-xs text-muted-foreground">
                            +{property.neighborhoods.length - 2}
                          </span>}
                      </div>
                    </TableCell>
                  </TableRow>;
          })}
            </TableBody>
          </Table>
        </Card>}

        <PropertiesDevTool propertyTypeMode={propertyTypeMode} setPropertyTypeMode={setPropertyTypeMode} carouselStyleMode={carouselStyleMode} setCarouselStyleMode={setCarouselStyleMode} />
      </div>
    </PageContainer>;
}