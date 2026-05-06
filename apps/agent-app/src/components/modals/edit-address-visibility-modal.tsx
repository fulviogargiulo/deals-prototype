import { useState, useCallback, useEffect } from "react";
import { StandardModal, StandardModalFooter } from "@/components/ui/standard-modal";
import { AddressVisibilitySelector, AddressVisibilityOption } from "@/components/properties/address-visibility-selector";
import { MockAddress } from "@/lib/mock-addresses";

interface EditAddressVisibilityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentVisibility: AddressVisibilityOption | null;
  address: MockAddress | null;
  block?: string;
  floor?: string;
  unit?: string;
  onSave: (visibility: AddressVisibilityOption) => void;
}

export function EditAddressVisibilityModal({ 
  open, 
  onOpenChange, 
  currentVisibility,
  address,
  block,
  floor,
  unit,
  onSave 
}: EditAddressVisibilityModalProps) {
  const [visibility, setVisibility] = useState<AddressVisibilityOption | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize from current value when opening
  useEffect(() => {
    if (open) {
      setVisibility(currentVisibility);
    }
  }, [open, currentVisibility]);

  const handleSelect = useCallback((selected: AddressVisibilityOption) => {
    setVisibility(selected);
  }, []);

  const handleSave = async () => {
    if (!visibility) return;
    
    setIsSaving(true);
    
    // Mimic API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    onSave(visibility);
    setIsSaving(false);
    onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setVisibility(null);
    }
    onOpenChange(open);
  };

  const canSave = !!visibility;

  return (
    <StandardModal
      open={open}
      onOpenChange={handleOpenChange}
      title="Edit address visibility"
      description="Choose how the address is displayed to buyers"
      size="lg"
      preventClose={isSaving}
      footer={
        <StandardModalFooter
          label="Save changes"
          loadingLabel="Saving..."
          onClick={handleSave}
          isLoading={isSaving}
          disabled={!canSave}
        />
      }
    >
      <div className="pb-2">
        <AddressVisibilitySelector
          visibility={visibility}
          address={address}
          block={block}
          floor={floor}
          unit={unit}
          onSelect={handleSelect}
          size="compact"
          showAnimations={false}
        />
      </div>
    </StandardModal>
  );
}
