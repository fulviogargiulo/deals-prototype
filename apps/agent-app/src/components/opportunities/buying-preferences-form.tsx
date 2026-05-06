import { useState, useRef, useEffect } from "react";
import { Search, Plus, Info, ChevronDown, Pencil, X, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverAnchor,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface BuyingPreferencesFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  onComplete: () => void;
  onSkip: () => void;
}

export function BuyingPreferencesForm({
  open,
  onOpenChange,
  clientName,
  onComplete,
  onSkip,
}: BuyingPreferencesFormProps) {
  const [bedrooms, setBedrooms] = useState<number | null>(null);
  const [bathrooms, setBathrooms] = useState<number | null>(null);
  const [floors, setFloors] = useState<string[]>([]);
  const [views, setViews] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [occupancyStatus, setOccupancyStatus] = useState<string[]>([]);
  const [furniture, setFurniture] = useState<string[]>([]);
  const [needsMortgage, setNeedsMortgage] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minSize, setMinSize] = useState("");
  const [maxSize, setMaxSize] = useState("");
  const [features, setFeatures] = useState<string[]>(["Air conditioning", "Balcony", "Central heating", "Elevator", "Pet-friendly"]);
  const [newFeature, setNewFeature] = useState("");
  const [isAddingFeature, setIsAddingFeature] = useState(false);
  const [minPriceOpen, setMinPriceOpen] = useState(false);
  const [maxPriceOpen, setMaxPriceOpen] = useState(false);
  const [minSizeOpen, setMinSizeOpen] = useState(false);
  const [maxSizeOpen, setMaxSizeOpen] = useState(false);
  
  // Location search state
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [locationSearchOpen, setLocationSearchOpen] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const [maxVisiblePills, setMaxVisiblePills] = useState(2);
  
  // Transaction details state
  const [paymentMethod, setPaymentMethod] = useState("");
  const [transactionTimeframe, setTransactionTimeframe] = useState("");

  const minPriceRef = useRef<HTMLInputElement>(null);
  const maxPriceRef = useRef<HTMLInputElement>(null);
  const minSizeRef = useRef<HTMLInputElement>(null);
  const maxSizeRef = useRef<HTMLInputElement>(null);
  
  // Mock location data
  const recentSearches = ['Retiro', 'Goya', 'Salamanca'];
  const allLocations = [
    { name: 'Chamberi', subtitle: 'District in Madrid' },
    { name: 'Salamanca', subtitle: 'District in Madrid' },
    { name: 'Salvador', subtitle: 'District in Madrid' },
    { name: 'Salares', subtitle: 'District in Málaga' },
    { name: 'Salinas', subtitle: 'District in Málaga' },
    { name: 'Retiro', subtitle: 'District in Madrid' },
    { name: 'Goya', subtitle: 'Neighbourhood in Madrid' },
    { name: 'Malasaña', subtitle: 'Neighbourhood in Madrid' },
    { name: 'La Latina', subtitle: 'District in Madrid' }
  ];
  const filteredLocations = allLocations.filter(loc => 
    loc.name.toLowerCase().includes(locationSearchQuery.toLowerCase()) || 
    loc.subtitle.toLowerCase().includes(locationSearchQuery.toLowerCase())
  );
  
  // Responsive pill calculation
  useEffect(() => {
    const updateMaxPills = () => {
      if (searchBarRef.current) {
        const width = searchBarRef.current.offsetWidth;
        const availableSpace = width - 120;
        const pillWidth = 95;
        const maxPills = Math.max(0, Math.floor(availableSpace / pillWidth));
        setMaxVisiblePills(Math.min(maxPills, 5));
      }
    };
    
    updateMaxPills();
    window.addEventListener('resize', updateMaxPills);
    
    const resizeObserver = new ResizeObserver(updateMaxPills);
    if (searchBarRef.current) {
      resizeObserver.observe(searchBarRef.current);
    }
    
    return () => {
      window.removeEventListener('resize', updateMaxPills);
      resizeObserver.disconnect();
    };
  }, []);

  const digitsOnly = (v: string) => v.replace(/[^0-9]/g, "");

  const formatPrice = (value: string) => {
    if (!value) return "";
    return `€${Number(value).toLocaleString()}`;
  };

  const formatSize = (value: string) => {
    if (!value) return "";
    return `${Number(value).toLocaleString()} m²`;
  };

  const toggleSelection = (value: string, array: string[], setter: (arr: string[]) => void) => {
    if (array.includes(value)) {
      setter(array.filter(v => v !== value));
    } else {
      setter([...array, value]);
    }
  };

  const PRICE_OPTIONS = [
    "100000","200000","300000","400000","500000","600000","700000","800000","900000","1000000"
  ];
  const SIZE_OPTIONS = ["50","75","100","125","150","175","200","225","250","300"];
  const filterOptions = (opts: string[], value: string) => {
    const q = digitsOnly(value);
    if (!q) return opts;
    return opts.filter((o) => o.startsWith(q));
  };

  const addFeature = () => {
    if (newFeature.trim() && !features.includes(newFeature.trim())) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature("");
      setIsAddingFeature(false);
    }
  };

  const removeFeature = (feature: string) => {
    setFeatures(features.filter(f => f !== feature));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 bg-background shrink-0">

          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">
                Set up {clientName.split(' ')[0]}'s buying preferences
              </DialogTitle>
              <DialogDescription className="mt-2 text-muted-foreground">
                Add what you know about {clientName.split(' ')[0]}'s preferences or skip and update them later.
              </DialogDescription>
            </div>
            <Button variant="ghost" onClick={onSkip} className="shrink-0 -mr-2">
              Skip
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6">
          <div className="space-y-6 py-4 pb-6">

            {/* Minimum Preferences */}
            <div className="space-y-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
              <div>
                <h3 className="font-semibold text-base mb-3">Minimum preferences</h3>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-accent/50 border border-accent">
                  <Info className="h-4 w-4 text-accent-foreground shrink-0 mt-0.5" />
                  <p className="text-sm text-accent-foreground">
                    These are the essential details to start finding matching properties
                  </p>
                </div>
              </div>

            <div>
              <Label className="text-sm font-medium">Location <span className="text-destructive">*</span></Label>
              <Popover open={locationSearchOpen} onOpenChange={setLocationSearchOpen}>
                <PopoverAnchor asChild>
                  <div 
                    ref={searchBarRef}
                    className="relative mt-2"
                  >
                    <div className="flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-md border border-input bg-card focus-within:border-primary transition-colors">
                      <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
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
                            setTimeout(() => {
                              if (!document.activeElement?.closest('[data-radix-popper-content-wrapper]')) {
                                setLocationSearchOpen(false);
                              }
                            }, 100);
                          }}
                          onKeyDown={(e) => {
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
                    {/* Selected locations section */}
                    {!locationSearchQuery && selectedLocations.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {selectedLocations.map((location) => (
                          <Badge 
                            key={location} 
                            variant="default" 
                            className="bg-foreground text-background text-xs shrink-0 pl-2 pr-1.5 py-0.5 cursor-pointer hover:opacity-80"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setSelectedLocations(prev => prev.filter(l => l !== location));
                            }}
                          >
                            {location}
                            <X className="w-3 h-3 ml-1" />
                          </Badge>
                        ))}
                      </div>
                    )}

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
                      )
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium">Minimum price <span className="text-destructive">*</span></Label>
                <Popover open={minPriceOpen} onOpenChange={setMinPriceOpen}>
                  <PopoverAnchor asChild>
                    <div className="relative mt-2">
                      <Input
                        ref={minPriceRef}
                        placeholder="€550,000"
                        inputMode="numeric"
                        pattern="\\d*"
                        value={minPrice ? formatPrice(minPrice) : ""}
                        onChange={(e) => setMinPrice(digitsOnly(e.target.value))}
                        onFocus={() => setMinPriceOpen(true)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-0 top-0 h-full px-3 flex items-center justify-center"
                        onMouseDown={(e) => { e.preventDefault(); setMinPriceOpen((o) => !o); }}
                        aria-label="Open price options"
                      >
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  </PopoverAnchor>
                  <PopoverContent align="start" className="z-50 p-2" style={{ width: minPriceRef.current ? `${minPriceRef.current.offsetWidth}px` : undefined }}>
                    <div className="space-y-1">
                      {filterOptions(PRICE_OPTIONS, minPrice).map((price) => (
                        <Button
                          key={price}
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => { setMinPrice(price); setMinPriceOpen(false); }}
                        >
                          €{Number(price).toLocaleString()}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className="text-sm font-medium">Maximum price <span className="text-destructive">*</span></Label>
                <Popover open={maxPriceOpen} onOpenChange={setMaxPriceOpen}>
                  <PopoverAnchor asChild>
                    <div className="relative mt-2">
                      <Input
                        ref={maxPriceRef}
                        placeholder="€650,000"
                        inputMode="numeric"
                        pattern="\\d*"
                        value={maxPrice ? formatPrice(maxPrice) : ""}
                        onChange={(e) => setMaxPrice(digitsOnly(e.target.value))}
                        onFocus={() => setMaxPriceOpen(true)}
                        className="pr-10"
                      />
                      <button 
                        className="absolute right-0 top-0 h-full px-3 flex items-center justify-center"
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); setMaxPriceOpen((o) => !o); }}
                      >
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  </PopoverAnchor>
                  <PopoverContent className="z-50 p-2" align="start" style={{ width: maxPriceRef.current ? `${maxPriceRef.current.offsetWidth}px` : undefined }}>
                    <div className="space-y-1">
                      {filterOptions(PRICE_OPTIONS, maxPrice).map((price) => (
                        <Button
                          key={price}
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => {
                            setMaxPrice(price);
                            setMaxPriceOpen(false);
                          }}
                        >
                          €{Number(price).toLocaleString()}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium">Minimum size <span className="text-destructive">*</span></Label>
                <Popover open={minSizeOpen} onOpenChange={setMinSizeOpen}>
                  <PopoverAnchor asChild>
                    <div className="relative mt-2">
                      <Input
                        ref={minSizeRef}
                        placeholder="70 m²"
                        inputMode="numeric"
                        pattern="\\d*"
                        value={minSize ? formatSize(minSize) : ""}
                        onChange={(e) => setMinSize(digitsOnly(e.target.value))}
                        onFocus={() => setMinSizeOpen(true)}
                        className="pr-10"
                      />
                      <button 
                        className="absolute right-0 top-0 h-full px-3 flex items-center justify-center"
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); setMinSizeOpen((o) => !o); }}
                      >
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  </PopoverAnchor>
                  <PopoverContent className="z-50 p-2" align="start" style={{ width: minSizeRef.current ? `${minSizeRef.current.offsetWidth}px` : undefined }}>
                    <div className="space-y-1">
                      {filterOptions(SIZE_OPTIONS, minSize).map((size) => (
                        <Button
                          key={size}
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => {
                            setMinSize(size);
                            setMinSizeOpen(false);
                          }}
                        >
                          {Number(size).toLocaleString()} m²
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className="text-sm font-medium">Maximum size <span className="text-destructive">*</span></Label>
                <Popover open={maxSizeOpen} onOpenChange={setMaxSizeOpen}>
                  <PopoverAnchor asChild>
                    <div className="relative mt-2">
                      <Input
                        ref={maxSizeRef}
                        placeholder="Select size"
                        inputMode="numeric"
                        pattern="\\d*"
                        value={maxSize ? formatSize(maxSize) : ""}
                        onChange={(e) => setMaxSize(digitsOnly(e.target.value))}
                        onFocus={() => setMaxSizeOpen(true)}
                        className="pr-10"
                      />
                      <button 
                        className="absolute right-0 top-0 h-full px-3 flex items-center justify-center"
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); setMaxSizeOpen((o) => !o); }}
                      >
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  </PopoverAnchor>
                  <PopoverContent className="z-50 p-2" align="start" style={{ width: maxSizeRef.current ? `${maxSizeRef.current.offsetWidth}px` : undefined }}>
                    <div className="space-y-1">
                      {filterOptions(SIZE_OPTIONS, maxSize).map((size) => (
                        <Button
                          key={size}
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => {
                            setMaxSize(size);
                            setMaxSizeOpen(false);
                          }}
                        >
                          {Number(size).toLocaleString()} m²
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Bedroom number <span className="text-destructive">*</span></Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {[0, 1, 2, 3, "4+"].map((num) => (
                  <Button
                    key={num}
                    variant={bedrooms === num ? "default" : "outline"}
                    size="sm"
                    className={`rounded-full ${bedrooms === num ? 'bg-foreground text-background hover:bg-foreground/90' : ''}`}
                    onClick={() => setBedrooms(num as number)}
                  >
                    {num}
                  </Button>
                ))}
              </div>
            </div>

            {/* Transaction Details - no divider, just spacing */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <Label className="text-sm font-medium">Payment method <span className="text-destructive">*</span></Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select payment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mortgage">Mortgage</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Transaction timeframe <span className="text-destructive">*</span></Label>
                <Select value={transactionTimeframe} onValueChange={setTransactionTimeframe}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="1-3months">1-3 months</SelectItem>
                    <SelectItem value="3-6months">3-6 months</SelectItem>
                    <SelectItem value="6-12months">6-12 months</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            </div>

            {/* Additional Preferences */}
            <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border">
              <div>
                <h3 className="font-semibold text-base">Additional preferences</h3>
              </div>

            <div>
              <Label className="text-sm font-medium">Property type</Label>
              <Select>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Residential: Apartment, Penthouse, Duplex" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential: Apartment, Penthouse, Duplex</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="land">Land</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Bathroom number</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {[1, 2, 3, "4+"].map((num) => (
                  <Button
                    key={num}
                    variant={bathrooms === num ? "default" : "outline"}
                    size="sm"
                    className={`rounded-full ${bathrooms === num ? 'bg-foreground text-background hover:bg-foreground/90' : ''}`}
                    onClick={() => setBathrooms(num as number)}
                  >
                    {num}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Floor</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {["Ground floor", "Middle floor", "Top floor"].map((floor) => (
                  <Button
                    key={floor}
                    variant="outline"
                    size="sm"
                    className={`rounded-full ${floors.includes(floor) ? 'bg-foreground text-background hover:bg-foreground/90 hover:text-background' : ''}`}
                    onClick={() => toggleSelection(floor, floors, setFloors)}
                  >
                    {floor}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">View</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {["Exterior", "Interior"].map((view) => (
                  <Button
                    key={view}
                    variant="outline"
                    size="sm"
                    className={`rounded-full ${views.includes(view) ? 'bg-foreground text-background hover:bg-foreground/90 hover:text-background' : ''}`}
                    onClick={() => toggleSelection(view, views, setViews)}
                  >
                    {view}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Condition</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {["New", "Good condition", "Requires renovation", "Under renovation"].map((condition) => (
                  <Button
                    key={condition}
                    variant="outline"
                    size="sm"
                    className={`rounded-full ${conditions.includes(condition) ? 'bg-foreground text-background hover:bg-foreground/90 hover:text-background' : ''}`}
                    onClick={() => toggleSelection(condition, conditions, setConditions)}
                  >
                    {condition}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Occupancy status</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {["Vacant", "Illegally occupied", "Rented"].map((status) => (
                  <Button
                    key={status}
                    variant="outline"
                    size="sm"
                    className={`rounded-full ${occupancyStatus.includes(status) ? 'bg-foreground text-background hover:bg-foreground/90 hover:text-background' : ''}`}
                    onClick={() => toggleSelection(status, occupancyStatus, setOccupancyStatus)}
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Furniture</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {["Furnished", "Partially furnished", "Not furnished"].map((furn) => (
                  <Button
                    key={furn}
                    variant="outline"
                    size="sm"
                    className={`rounded-full ${furniture.includes(furn) ? 'bg-foreground text-background hover:bg-foreground/90 hover:text-background' : ''}`}
                    onClick={() => toggleSelection(furn, furniture, setFurniture)}
                  >
                    {furn}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Features</Label>
              <div className="mt-2 space-y-2">
                <div className="flex flex-wrap gap-2">
                  {features.map((feature) => (
                    <div
                      key={feature}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-background border text-sm"
                    >
                      <span>{feature}</span>
                      <button
                        onClick={() => removeFeature(feature)}
                        className="hover:bg-muted rounded-full p-0.5"
                        aria-label={`Remove ${feature}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                {isAddingFeature ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter feature name"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                      autoFocus
                      className="flex-1"
                    />
                    <Button onClick={addFeature} size="sm">
                      Add
                    </Button>
                    <Button 
                      onClick={() => {
                        setIsAddingFeature(false);
                        setNewFeature("");
                      }} 
                      variant="ghost" 
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setIsAddingFeature(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add feature
                  </Button>
                )}
              </div>
            </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-background shrink-0">
          <Button 
            size="lg" 
            className="w-full rounded-full bg-foreground text-background hover:bg-foreground/90 h-12 font-medium" 
            onClick={onComplete}
          >
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
