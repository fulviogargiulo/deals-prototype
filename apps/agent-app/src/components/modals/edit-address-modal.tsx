import { useState, useCallback, useEffect, useRef } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Loader2, ArrowLeft } from "lucide-react";
import { AddressSelector } from "@/components/properties/address-selector";
import { AddressVisibilitySelector, AddressVisibilityOption } from "@/components/properties/address-visibility-selector";
import { MockAddress } from "@/lib/mock-addresses";
import { cn } from "@/lib/utils";

interface AddressData {
  address: MockAddress | null;
  block?: string;
  floor?: string;
  unitType?: string;
  unit?: string;
  visibility?: AddressVisibilityOption;
}

interface EditAddressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAddress: MockAddress | null;
  currentBlock?: string;
  currentFloor?: string;
  currentUnitType?: string;
  currentUnit?: string;
  currentVisibility?: AddressVisibilityOption | null;
  parentType?: string | null;
  onSave: (data: AddressData) => void;
}

// Fixed height for address search (same as client selection modal)
const SEARCH_VIEW_HEIGHT = 600;
// Fixed height for visibility step (3 options + header + button)
const VISIBILITY_VIEW_HEIGHT = 480;

export function EditAddressModal({ 
  open, 
  onOpenChange, 
  currentAddress,
  currentBlock = '',
  currentFloor = '',
  currentUnitType = '',
  currentUnit = '',
  currentVisibility = null,
  parentType,
  onSave 
}: EditAddressModalProps) {
  const [step, setStep] = useState<'address' | 'visibility'>('address');
  const [address, setAddress] = useState<MockAddress | null>(null);
  const [block, setBlock] = useState('');
  const [floor, setFloor] = useState('');
  const [unitType, setUnitType] = useState('');
  const [unit, setUnit] = useState('');
  const [visibility, setVisibility] = useState<AddressVisibilityOption | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [contentHeight, setContentHeight] = useState<number>(SEARCH_VIEW_HEIGHT);
  const [isStreetNumberPending, setIsStreetNumberPending] = useState(false);
  const [hasStreetNumberInput, setHasStreetNumberInput] = useState(false);
  const [isValidatingStreetNumber, setIsValidatingStreetNumber] = useState(false);
  const [triggerValidation, setTriggerValidation] = useState(false);
  
  const addressContentRef = useRef<HTMLDivElement>(null);
  const visibilityContentRef = useRef<HTMLDivElement>(null);

  // Measure form content height (for address details step only)
  const measureAddressFormHeight = useCallback(() => {
    const ref = addressContentRef.current;
    if (ref) {
      const scrollableContent = ref.querySelector('.overflow-y-auto');
      if (scrollableContent) {
        // Get actual content height + header offset (header ~80px + button area ~70px + padding ~30px)
        const actualContentHeight = scrollableContent.scrollHeight;
        const height = actualContentHeight + 180;
        setContentHeight(Math.max(height, 400));
      }
    }
  }, []);

  // Initialize from current values when opening
  useEffect(() => {
    if (open) {
      setAddress(currentAddress);
      setBlock(currentBlock);
      setFloor(currentFloor);
      setUnitType(currentUnitType);
      setUnit(currentUnit);
      setVisibility(currentVisibility);
      setStep('address');
      // Set initial height based on whether we have an address
      if (currentAddress) {
        // Will be measured after render
        setTimeout(() => measureAddressFormHeight(), 100);
      } else {
        setContentHeight(SEARCH_VIEW_HEIGHT);
      }
    }
  }, [open, currentAddress, currentBlock, currentFloor, currentUnitType, currentUnit, currentVisibility, measureAddressFormHeight]);

  // Update height based on step and address state
  useEffect(() => {
    if (!open) return;

    if (step === 'address') {
      if (address) {
        // Address selected with details - measure content dynamically
        const timer = setTimeout(measureAddressFormHeight, 100);
        return () => clearTimeout(timer);
      } else if (!isStreetNumberPending) {
        // Search mode only - use fixed height
        setContentHeight(SEARCH_VIEW_HEIGHT);
      }
      // Street number pending uses fixed height too
    } else if (step === 'visibility') {
      // Use fixed height for visibility step
      setContentHeight(VISIBILITY_VIEW_HEIGHT);
    }
  }, [open, step, address, isStreetNumberPending, block, floor, unitType, unit, measureAddressFormHeight]);

  const handleAddressUpdate = useCallback((updates: Partial<AddressData>) => {
    if (updates.address !== undefined) setAddress(updates.address);
    if (updates.block !== undefined) setBlock(updates.block);
    if (updates.floor !== undefined) setFloor(updates.floor);
    if (updates.unitType !== undefined) setUnitType(updates.unitType);
    if (updates.unit !== undefined) setUnit(updates.unit);
  }, []);

  const handleStreetNumberValidationChange = useCallback((isValidating: boolean, needsValidation: boolean, hasInput: boolean) => {
    setIsValidatingStreetNumber(isValidating);
    setIsStreetNumberPending(needsValidation);
    setHasStreetNumberInput(hasInput);
  }, []);

  const handleVisibilitySelect = useCallback((selected: AddressVisibilityOption) => {
    setVisibility(selected);
  }, []);

  const handleStreetNumberContinue = () => {
    setTriggerValidation(true);
    // Reset trigger after a short delay
    setTimeout(() => setTriggerValidation(false), 100);
  };

  const handleContinue = () => {
    setStep('visibility');
  };

  const handleBack = () => {
    setStep('address');
  };

  const handleSave = async () => {
    if (!address || !visibility) return;
    
    setIsSaving(true);
    
    // Mimic API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    onSave({ address, block, floor, unitType, unit, visibility });
    setIsSaving(false);
    onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset state when closing
      setAddress(null);
      setBlock('');
      setFloor('');
      setUnitType('');
      setUnit('');
      setVisibility(null);
      setStep('address');
      setContentHeight(SEARCH_VIEW_HEIGHT);
    }
    onOpenChange(open);
  };

  const canContinue = !!address;
  const canSave = !!address && !!visibility;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        hideCloseButton 
        className="sm:max-w-lg flex flex-col p-0 overflow-hidden"
        style={{ 
          height: `${contentHeight}px`,
          maxHeight: '90vh',
          transition: 'height 0.3s ease-out'
        }}
      >
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {step === 'visibility' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  className="h-8 w-8 shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <DialogTitle className="text-xl font-semibold">
                {step === 'address' ? 'Edit address' : 'Address visibility'}
              </DialogTitle>
            </div>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
          </div>
          <DialogDescription className="mt-1">
            {step === 'address' 
              ? 'Update the property address' 
              : 'Choose how the address is displayed'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative flex-1 overflow-hidden flex flex-col">
          {/* Address Step */}
          <div 
            ref={addressContentRef}
            className={cn(
              "flex-1 flex flex-col min-h-0 transition-all duration-300 ease-out",
              step === 'address' 
                ? "opacity-100 translate-x-0" 
                : "opacity-0 -translate-x-full absolute inset-0 pointer-events-none"
            )}
          >
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-visible px-6 pt-5 scroll-smooth">
                <div className="px-1">
                  <AddressSelector
                    address={address}
                    block={block}
                    floor={floor}
                    unitType={unitType}
                    unit={unit}
                    parentType={parentType}
                    onUpdate={handleAddressUpdate}
                    onStreetNumberValidationChange={handleStreetNumberValidationChange}
                    triggerStreetNumberValidation={triggerValidation}
                    size="compact"
                    showAnimations={false}
                    showHeader={false}
                    showContinueButton={false}
                    onContinue={handleContinue}
                  />
                </div>
              </div>
              
              {/* Button area with consistent padding - show when address selected or street number pending */}
              {(address || isStreetNumberPending) && (
                <div className="px-6 pb-6 pt-4 shrink-0">
                  {address ? (
                    <Button 
                      onClick={handleContinue} 
                      disabled={!canContinue}
                      className="w-full"
                      size="lg"
                    >
                      Continue
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleStreetNumberContinue}
                      disabled={!hasStreetNumberInput || isValidatingStreetNumber}
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
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Visibility Step */}
          <div 
            ref={visibilityContentRef}
            className={cn(
              "flex-1 flex flex-col min-h-0 transition-all duration-300 ease-out",
              step === 'visibility' 
                ? "opacity-100 translate-x-0" 
                : "opacity-0 translate-x-full absolute inset-0 pointer-events-none"
            )}
          >
            <div className="flex-1 min-h-0 overflow-y-auto px-6">
              <AddressVisibilitySelector
                visibility={visibility}
                address={address}
                block={block}
                floor={floor}
                unit={unit}
                onSelect={handleVisibilitySelect}
                size="compact"
                showAnimations={false}
                showHeader={false}
              />
            </div>
            
            <div className="px-6 pb-6 pt-4 shrink-0">
              <Button 
                onClick={handleSave} 
                disabled={!canSave || isSaving}
                className="w-full"
                size="lg"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save changes'
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
