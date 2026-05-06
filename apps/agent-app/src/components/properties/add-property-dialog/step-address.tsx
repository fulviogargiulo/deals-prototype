import { AddressSelector } from "@/components/properties/address-selector";
import { PropertyDraftData } from "./types";
import { MockAddress } from "@/lib/mock-addresses";

interface StepAddressProps {
  data: PropertyDraftData;
  onUpdate: (updates: Partial<PropertyDraftData>) => void;
  onStreetNumberValidationChange?: (isValidating: boolean, needsValidation: boolean, hasInput: boolean) => void;
  triggerStreetNumberValidation?: boolean;
}

interface AddressData {
  address: MockAddress | null;
  block?: string;
  floor?: string;
  unitType?: string;
  unit?: string;
}

export function StepAddress({ data, onUpdate, onStreetNumberValidationChange, triggerStreetNumberValidation }: StepAddressProps) {
  const handleUpdate = (updates: Partial<AddressData>) => {
    onUpdate(updates as Partial<PropertyDraftData>);
  };

  return (
    <AddressSelector
      address={data.address}
      block={data.block}
      floor={data.floor}
      unitType={data.unitType}
      unit={data.unit}
      parentType={data.parentType}
      onUpdate={handleUpdate}
      onStreetNumberValidationChange={onStreetNumberValidationChange}
      triggerStreetNumberValidation={triggerStreetNumberValidation}
      size="default"
      showAnimations={true}
    />
  );
}
