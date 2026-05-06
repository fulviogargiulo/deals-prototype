import { useState, useCallback, useEffect } from "react";
import { StandardModal, StandardModalFooter } from "@/components/ui/standard-modal";
import { PropertyTypeSelector } from "@/components/properties/property-type-selector";
import { propertyTypes } from "@/lib/property-types";

interface EditPropertyTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPropertyType: string | null;
  onSave: (parentType: string, subType: string, label: string) => void;
}

export function EditPropertyTypeModal({ 
  open, 
  onOpenChange, 
  currentPropertyType,
  onSave 
}: EditPropertyTypeModalProps) {
  const [selectedParentType, setSelectedParentType] = useState<string | null>(null);
  const [selectedSubType, setSelectedSubType] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize selection from current property type
  useEffect(() => {
    if (open && currentPropertyType) {
      // Find the parent type and subtype from the current label
      for (const parent of propertyTypes) {
        if (parent.label.toLowerCase() === currentPropertyType.toLowerCase()) {
          setSelectedParentType(parent.id);
          setSelectedSubType(parent.subtypes.length === 0 ? parent.id : null);
          return;
        }
        for (const sub of parent.subtypes) {
          if (sub.label.toLowerCase() === currentPropertyType.toLowerCase()) {
            setSelectedParentType(parent.id);
            setSelectedSubType(sub.id);
            return;
          }
        }
      }
    }
  }, [open, currentPropertyType]);

  const handleSelect = useCallback((parentType: string, subType: string | null) => {
    setSelectedParentType(parentType);
    setSelectedSubType(subType);
  }, []);

  const handleSave = async () => {
    if (selectedParentType && selectedSubType) {
      setIsSaving(true);
      
      // Mimic API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Find the label for the selected type
      const parent = propertyTypes.find(p => p.id === selectedParentType);
      if (parent) {
        const subtype = parent.subtypes.find(s => s.id === selectedSubType);
        const label = subtype ? subtype.label : parent.label;
        onSave(selectedParentType, selectedSubType, label);
        setIsSaving(false);
        onOpenChange(false);
      }
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset state when closing
      setSelectedParentType(null);
      setSelectedSubType(null);
    }
    onOpenChange(open);
  };

  const canSave = selectedParentType && selectedSubType;

  return (
    <StandardModal
      open={open}
      onOpenChange={handleOpenChange}
      title="Edit property type"
      description="Select the type of property"
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
        <PropertyTypeSelector
          selectedParentType={selectedParentType}
          selectedSubType={selectedSubType}
          onSelect={handleSelect}
          size="compact"
          showAnimations={false}
        />
      </div>
    </StandardModal>
  );
}
