import * as React from "react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Loader2, ChevronUp, ChevronDown } from "lucide-react";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { FloatingLabelSelect } from "@/components/ui/floating-label-select";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface AdditionalInfo {
  exposure?: {
    view?: string;
    orientation?: string;
  };
  buildAndFinish?: {
    constructionYear?: number;
    renovationYear?: number;
    furnished?: string;
  };
  propertyAmenities?: string[];
  parkingIncluded?: boolean;
  parkingPrice?: number;
  heatingType?: string;
  buildingAmenities?: string[];
  energyCertificate?: {
    consumptionType?: string;
    consumption?: number;
    emissionsType?: string;
    emissions?: number;
  };
}

interface EditAdditionalInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentInfo: AdditionalInfo | null;
  onSave: (info: AdditionalInfo) => void;
}

const viewOptions = [
  { value: "Exterior facing", label: "Exterior facing" },
  { value: "Interior facing", label: "Interior facing" },
  { value: "Both", label: "Both" },
];

const orientations = ["North", "South", "East", "West"];

const furnishedOptions = [
  { value: "Furnished", label: "Furnished" },
  { value: "Partially furnished", label: "Partially furnished" },
  { value: "Unfurnished", label: "Unfurnished" },
];

const heatingOptions = [
  { value: "Heat and cold pump", label: "Heat and cold pump" },
  { value: "Central heating", label: "Central heating" },
  { value: "Individual heating", label: "Individual heating" },
  { value: "Electric heating", label: "Electric heating" },
  { value: "Gas heating", label: "Gas heating" },
  { value: "No heating", label: "No heating" },
];

const energyTypeOptions = [
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "C", label: "C" },
  { value: "D", label: "D" },
  { value: "E", label: "E" },
  { value: "F", label: "F" },
  { value: "G", label: "G" },
];

const allPropertyAmenities = [
  "Air conditioning", "Equipped kitchen", "Built-in wardrobes", "Terrace",
  "Storage room", "Parking space", "Balcony", "Pet-friendly", "Private pool",
  "Gym", "Warehouse", "Smoke outlet", "Corner", "Alarm system", "Mountain view", "Sea view"
];

const allBuildingAmenities = [
  "Elevator", "Accessible housing", "Private garden", "Shared garden",
  "Public pool", "Classic facade", "Concierge", "Doorman", "Shared gym"
];

export function EditAdditionalInfoModal({
  open,
  onOpenChange,
  currentInfo,
  onSave,
}: EditAdditionalInfoModalProps) {
  // Exposure
  const [view, setView] = useState("");
  const [orientation, setOrientation] = useState("");
  
  // Build and finish
  const [constructionYear, setConstructionYear] = useState("");
  const [renovationYear, setRenovationYear] = useState("");
  const [furnished, setFurnished] = useState("");
  
  // Property amenities
  const [propertyAmenities, setPropertyAmenities] = useState<string[]>([]);
  const [showAllPropertyAmenities, setShowAllPropertyAmenities] = useState(false);
  const [parkingIncluded, setParkingIncluded] = useState<boolean | null>(null);
  const [parkingPrice, setParkingPrice] = useState("");
  
  // Heating
  const [heatingType, setHeatingType] = useState("");
  
  // Building amenities
  const [buildingAmenities, setBuildingAmenities] = useState<string[]>([]);
  const [showAllBuildingAmenities, setShowAllBuildingAmenities] = useState(false);
  
  // Energy certificate
  const [consumptionType, setConsumptionType] = useState("");
  const [consumption, setConsumption] = useState("");
  const [emissionsType, setEmissionsType] = useState("");
  const [emissions, setEmissions] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form with current values when modal opens
  useEffect(() => {
    if (open && currentInfo) {
      setView(currentInfo.exposure?.view || "");
      setOrientation(currentInfo.exposure?.orientation || "");
      setConstructionYear(currentInfo.buildAndFinish?.constructionYear?.toString() || "");
      setRenovationYear(currentInfo.buildAndFinish?.renovationYear?.toString() || "");
      setFurnished(currentInfo.buildAndFinish?.furnished || "");
      setPropertyAmenities(currentInfo.propertyAmenities || []);
      setParkingIncluded(currentInfo.parkingIncluded ?? null);
      setParkingPrice(currentInfo.parkingPrice?.toString() || "");
      setHeatingType(currentInfo.heatingType || "");
      setBuildingAmenities(currentInfo.buildingAmenities || []);
      setConsumptionType(currentInfo.energyCertificate?.consumptionType || "");
      setConsumption(currentInfo.energyCertificate?.consumption?.toString() || "");
      setEmissionsType(currentInfo.energyCertificate?.emissionsType || "");
      setEmissions(currentInfo.energyCertificate?.emissions?.toString() || "");
    } else if (open && !currentInfo) {
      // Reset all fields
      setView("");
      setOrientation("");
      setConstructionYear("");
      setRenovationYear("");
      setFurnished("");
      setPropertyAmenities([]);
      setParkingIncluded(null);
      setParkingPrice("");
      setHeatingType("");
      setBuildingAmenities([]);
      setConsumptionType("");
      setConsumption("");
      setEmissionsType("");
      setEmissions("");
    }
  }, [open, currentInfo]);

  const togglePropertyAmenity = (amenity: string) => {
    setPropertyAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const toggleBuildingAmenity = (amenity: string) => {
    setBuildingAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const isValid = view && orientation;

  const handleSave = async () => {
    if (!isValid) return;
    
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const info: AdditionalInfo = {
      exposure: {
        view,
        orientation,
      },
      buildAndFinish: {
        constructionYear: constructionYear ? Number(constructionYear) : undefined,
        renovationYear: renovationYear ? Number(renovationYear) : undefined,
        furnished: furnished || undefined,
      },
      propertyAmenities: propertyAmenities.length > 0 ? propertyAmenities : undefined,
      parkingIncluded: parkingIncluded ?? undefined,
      parkingPrice: parkingPrice ? Number(parkingPrice) : undefined,
      heatingType: heatingType || undefined,
      buildingAmenities: buildingAmenities.length > 0 ? buildingAmenities : undefined,
      energyCertificate: consumptionType || consumption || emissionsType || emissions ? {
        consumptionType: consumptionType || undefined,
        consumption: consumption ? Number(consumption) : undefined,
        emissionsType: emissionsType || undefined,
        emissions: emissions ? Number(emissions) : undefined,
      } : undefined,
    };
    
    onSave(info);
    setIsSaving(false);
    onOpenChange(false);
  };

  const handleClose = () => {
    if (!isSaving) {
      onOpenChange(false);
    }
  };

  const visiblePropertyAmenities = showAllPropertyAmenities 
    ? allPropertyAmenities 
    : allPropertyAmenities.slice(0, 9);
    
  const visibleBuildingAmenities = showAllBuildingAmenities 
    ? allBuildingAmenities 
    : allBuildingAmenities.slice(0, 6);

  const showParkingQuestion = propertyAmenities.includes("Parking space");

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent hideCloseButton className="sm:max-w-lg p-0 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pl-6 pr-4 pt-6 pb-2 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">Additional info</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Fields marked with the red asterisk (<span className="text-destructive">*</span>) are mandatory
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleClose}
              disabled={isSaving}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="space-y-6 pt-4">
            
            {/* Exposure Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-base">Exposure</h3>
              
              <FloatingLabelSelect
                label="View"
                required
                value={view}
                onValueChange={setView}
                options={viewOptions}
              />
              
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Orientation <span className="text-destructive">*</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {orientations.map((dir) => (
                    <button
                      key={dir}
                      type="button"
                      onClick={() => setOrientation(dir)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                        orientation === dir
                          ? "bg-foreground text-background border-foreground"
                          : "bg-background text-foreground border-border hover:bg-muted"
                      )}
                    >
                      {dir}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Build and finish Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-base">Build and finish</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FloatingLabelInput
                  label="Construction year"
                  value={constructionYear}
                  onChange={(e) => setConstructionYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
                />
                <FloatingLabelInput
                  label="Renovation year"
                  value={renovationYear}
                  onChange={(e) => setRenovationYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
                />
              </div>
              
              <FloatingLabelSelect
                label="Furnished"
                value={furnished}
                onValueChange={setFurnished}
                options={furnishedOptions}
              />
            </div>

            {/* Property amenities Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-base">Property amenities</h3>
              
              <div className="flex flex-wrap gap-2">
                {visiblePropertyAmenities.map((amenity) => (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => togglePropertyAmenity(amenity)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-all border",
                      propertyAmenities.includes(amenity)
                        ? "bg-foreground text-background border-foreground"
                        : "bg-background text-foreground border-border hover:bg-muted"
                    )}
                  >
                    {amenity}
                  </button>
                ))}
              </div>
              
              {allPropertyAmenities.length > 9 && (
                <button
                  type="button"
                  onClick={() => setShowAllPropertyAmenities(!showAllPropertyAmenities)}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showAllPropertyAmenities ? (
                    <>Show less <ChevronUp className="w-4 h-4" /></>
                  ) : (
                    <>Show more <ChevronDown className="w-4 h-4" /></>
                  )}
                </button>
              )}
              
              {/* Parking included question */}
              {showParkingQuestion && (
                <div className="space-y-3 pt-2">
                  <p className="text-sm text-muted-foreground">
                    Is the parking space included in the property price?
                  </p>
                  <RadioGroup 
                    value={parkingIncluded === true ? "yes" : parkingIncluded === false ? "no" : ""}
                    onValueChange={(val) => setParkingIncluded(val === "yes")}
                    className="space-y-2"
                  >
                    <div className={cn(
                      "flex items-center space-x-3 rounded-xl border p-4 cursor-pointer transition-all",
                      parkingIncluded === true ? "border-foreground bg-muted/50" : "border-border"
                    )}>
                      <RadioGroupItem value="yes" id="parking-yes" />
                      <Label htmlFor="parking-yes" className="cursor-pointer font-medium">Yes</Label>
                    </div>
                    <div className={cn(
                      "flex items-center space-x-3 rounded-xl border p-4 cursor-pointer transition-all",
                      parkingIncluded === false ? "border-foreground bg-muted/50" : "border-border"
                    )}>
                      <RadioGroupItem value="no" id="parking-no" />
                      <Label htmlFor="parking-no" className="cursor-pointer font-medium">No</Label>
                    </div>
                  </RadioGroup>
                  
                  {parkingIncluded === false && (
                    <FloatingLabelInput
                      label="Parking price"
                      required
                      value={parkingPrice}
                      onChange={(e) => setParkingPrice(e.target.value.replace(/\D/g, ""))}
                      trailingText="€"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Heating type */}
            <FloatingLabelSelect
              label="Heating type"
              value={heatingType}
              onValueChange={setHeatingType}
              options={heatingOptions}
            />

            {/* Building amenities Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-base">Building amenities</h3>
              
              <div className="flex flex-wrap gap-2">
                {visibleBuildingAmenities.map((amenity) => (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleBuildingAmenity(amenity)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-all border",
                      buildingAmenities.includes(amenity)
                        ? "bg-foreground text-background border-foreground"
                        : "bg-background text-foreground border-border hover:bg-muted"
                    )}
                  >
                    {amenity}
                  </button>
                ))}
              </div>
              
              {allBuildingAmenities.length > 6 && (
                <button
                  type="button"
                  onClick={() => setShowAllBuildingAmenities(!showAllBuildingAmenities)}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showAllBuildingAmenities ? (
                    <>Show less <ChevronUp className="w-4 h-4" /></>
                  ) : (
                    <>Show more <ChevronDown className="w-4 h-4" /></>
                  )}
                </button>
              )}
            </div>

            {/* Energy certificate Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-base">Energy certificate</h3>
              
              <FloatingLabelSelect
                label="Energy consumption type"
                value={consumptionType}
                onValueChange={setConsumptionType}
                options={energyTypeOptions}
              />
              
              <FloatingLabelInput
                label="Energy consumption"
                value={consumption}
                onChange={(e) => setConsumption(e.target.value.replace(/\D/g, ""))}
                trailingText="kWh/m² year"
              />
              
              <FloatingLabelSelect
                label="Emissions type"
                value={emissionsType}
                onValueChange={setEmissionsType}
                options={energyTypeOptions}
              />
              
              <FloatingLabelInput
                label="Emissions"
                value={emissions}
                onChange={(e) => setEmissions(e.target.value.replace(/\D/g, ""))}
                trailingText="kg CO²/m² year"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2 shrink-0">
          <Button 
            className="w-full h-14 text-base font-medium rounded-xl"
            onClick={handleSave}
            disabled={!isValid || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
