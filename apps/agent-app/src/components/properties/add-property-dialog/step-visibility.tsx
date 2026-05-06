import { AddressVisibilitySelector, AddressVisibilityOption } from "@/components/properties/address-visibility-selector";
import { PropertyDraftData } from "./types";

interface StepVisibilityProps {
  data: PropertyDraftData;
  onUpdate: (updates: Partial<PropertyDraftData>) => void;
}

export function StepVisibility({ data, onUpdate }: StepVisibilityProps) {
  const handleSelect = (visibility: AddressVisibilityOption) => {
    onUpdate({ addressVisibility: visibility });
  };

  return (
    <AddressVisibilitySelector
      visibility={data.addressVisibility as AddressVisibilityOption | null}
      address={data.address}
      block={data.block}
      floor={data.floor}
      unit={data.unit}
      onSelect={handleSelect}
      size="default"
      showAnimations={true}
    />
  );
}
