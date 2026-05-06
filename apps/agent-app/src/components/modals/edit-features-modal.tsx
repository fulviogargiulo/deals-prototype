import { useState, useEffect } from "react";
import { StandardModal, StandardModalFooter, MandatoryFieldsNote } from "@/components/ui/standard-modal";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { FloatingLabelSelect } from "@/components/ui/floating-label-select";

interface PropertyFeatures {
  size?: number;
  usableSize?: number;
  bedrooms?: number;
  bathrooms?: number;
  condition?: string;
  occupancyStatus?: string;
}

interface EditFeaturesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFeatures: PropertyFeatures | null;
  onSave: (features: PropertyFeatures) => void;
}

const bedroomOptions = [
  { value: "0", label: "0" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6", label: "6" },
  { value: "7", label: "7" },
  { value: "8", label: "8" },
  { value: "9", label: "9" },
  { value: "10", label: "10+" },
];

const bathroomOptions = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6", label: "6+" },
];

const conditionOptions = [
  { value: "New", label: "New" },
  { value: "Excellent", label: "Excellent" },
  { value: "Good", label: "Good" },
  { value: "Fair", label: "Fair" },
  { value: "Needs renovation", label: "Needs renovation" },
];

const occupancyOptions = [
  { value: "Vacant", label: "Vacant" },
  { value: "Owner occupied", label: "Owner occupied" },
  { value: "Tenant occupied", label: "Tenant occupied" },
];

export function EditFeaturesModal({
  open,
  onOpenChange,
  currentFeatures,
  onSave,
}: EditFeaturesModalProps) {
  const [size, setSize] = useState("");
  const [usableSize, setUsableSize] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [condition, setCondition] = useState("");
  const [occupancyStatus, setOccupancyStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form with current values when modal opens
  useEffect(() => {
    if (open && currentFeatures) {
      setSize(currentFeatures.size?.toString() || "");
      setUsableSize(currentFeatures.usableSize?.toString() || "");
      setBedrooms(currentFeatures.bedrooms?.toString() || "");
      setBathrooms(currentFeatures.bathrooms?.toString() || "");
      setCondition(currentFeatures.condition || "");
      setOccupancyStatus(currentFeatures.occupancyStatus || "");
    } else if (open && !currentFeatures) {
      setSize("");
      setUsableSize("");
      setBedrooms("");
      setBathrooms("");
      setCondition("");
      setOccupancyStatus("");
    }
  }, [open, currentFeatures]);

  const isValid = size && bedrooms && bathrooms && condition && occupancyStatus;

  const handleSave = async () => {
    if (!isValid) return;
    
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    onSave({
      size: Number(size),
      usableSize: usableSize ? Number(usableSize) : undefined,
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      condition,
      occupancyStatus,
    });
    
    setIsSaving(false);
    onOpenChange(false);
  };

  const handleClose = () => {
    if (!isSaving) {
      onOpenChange(false);
    }
  };

  return (
    <StandardModal
      open={open}
      onOpenChange={handleClose}
      title="Property features"
      description={<MandatoryFieldsNote />}
      size="md"
      preventClose={isSaving}
      footer={
        <StandardModalFooter
          label="Save"
          loadingLabel="Saving..."
          onClick={handleSave}
          isLoading={isSaving}
          disabled={!isValid}
        />
      }
    >
      <div className="space-y-4 pb-2">
        {/* Size */}
        <FloatingLabelInput
          label="Size"
          required
          value={size}
          onChange={(e) => setSize(e.target.value.replace(/\D/g, ""))}
          trailingText="m²"
        />

        {/* Usable Size */}
        <FloatingLabelInput
          label="Usable size"
          value={usableSize}
          onChange={(e) => setUsableSize(e.target.value.replace(/\D/g, ""))}
          trailingText="m²"
        />

        {/* Bedrooms and Bathrooms */}
        <div className="grid grid-cols-2 gap-4">
          <FloatingLabelSelect
            label="Bedrooms"
            required
            value={bedrooms}
            onValueChange={setBedrooms}
            options={bedroomOptions}
          />
          <FloatingLabelSelect
            label="Bathrooms"
            required
            value={bathrooms}
            onValueChange={setBathrooms}
            options={bathroomOptions}
          />
        </div>

        {/* Condition */}
        <FloatingLabelSelect
          label="Condition"
          required
          value={condition}
          onValueChange={setCondition}
          options={conditionOptions}
        />

        {/* Occupancy Status */}
        <FloatingLabelSelect
          label="Occupancy status"
          required
          value={occupancyStatus}
          onValueChange={setOccupancyStatus}
          options={occupancyOptions}
        />
      </div>
    </StandardModal>
  );
}
