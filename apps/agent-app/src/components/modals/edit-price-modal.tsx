import { useState, useEffect } from "react";
import { StandardModal, StandardModalFooter, MandatoryFieldsNote } from "@/components/ui/standard-modal";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { FloatingLabelSelect } from "@/components/ui/floating-label-select";

interface PricingData {
  price: number;
  currency: string;
  communityFees?: number;
  ibi?: number;
  contractType?: string;
}

interface EditPriceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intent: 'sale' | 'rental';
  currentPricing: PricingData | null;
  onSave: (pricing: PricingData) => void;
}

const contractTypeOptions = [
  { value: 'long-term', label: 'Long term' },
  { value: 'short-term', label: 'Short term' },
  { value: 'seasonal', label: 'Seasonal' },
];

export function EditPriceModal({ 
  open, 
  onOpenChange, 
  intent,
  currentPricing,
  onSave 
}: EditPriceModalProps) {
  const [price, setPrice] = useState("");
  const [communityFees, setCommunityFees] = useState("");
  const [ibi, setIbi] = useState("");
  const [contractType, setContractType] = useState("long-term");
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form with current values when modal opens
  useEffect(() => {
    if (open && currentPricing) {
      setPrice(currentPricing.price.toString());
      setCommunityFees(currentPricing.communityFees?.toString() || "");
      setIbi(currentPricing.ibi?.toString() || "");
      setContractType(currentPricing.contractType || "long-term");
    } else if (open && !currentPricing) {
      setPrice("");
      setCommunityFees("");
      setIbi("");
      setContractType("long-term");
    }
  }, [open, currentPricing]);

  const isSaleIntent = intent === 'sale';

  // Validation - price is always required
  const isPriceValid = price.trim() !== "" && !isNaN(Number(price)) && Number(price) > 0;
  
  // For sale: community fees and IBI are required
  // For rental: contract type is required (already has default)
  const isFormValid = isSaleIntent 
    ? isPriceValid && communityFees.trim() !== "" && !isNaN(Number(communityFees)) && ibi.trim() !== "" && !isNaN(Number(ibi))
    : isPriceValid;

  const handleSave = () => {
    if (!isFormValid) return;

    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      const pricing: PricingData = {
        price: Number(price),
        currency: '€',
      };

      if (isSaleIntent) {
        pricing.communityFees = Number(communityFees);
        pricing.ibi = Number(ibi);
      } else {
        pricing.contractType = contractType;
      }

      onSave(pricing);
      setIsSaving(false);
      onOpenChange(false);
    }, 1500);
  };

  const handleClose = () => {
    if (!isSaving) {
      onOpenChange(false);
    }
  };

  // Format number with thousand separators
  const formatNumber = (value: string) => {
    const num = value.replace(/[^\d]/g, '');
    if (!num) return '';
    return Number(num).toLocaleString('de-DE');
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, '');
    setPrice(rawValue);
  };

  const handleCommunityFeesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, '');
    setCommunityFees(rawValue);
  };

  const handleIbiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, '');
    setIbi(rawValue);
  };

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      } else if (e.key === "Enter" && !e.shiftKey && isFormValid && !isSaving) {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, isFormValid, isSaving]);

  return (
    <StandardModal
      open={open}
      onOpenChange={handleClose}
      title="Pricing"
      description={<MandatoryFieldsNote />}
      size="md"
      preventClose={isSaving}
      footer={
        <StandardModalFooter
          label="Save"
          loadingLabel="Saving..."
          onClick={handleSave}
          isLoading={isSaving}
          disabled={!isFormValid}
        />
      }
    >
      <div className="space-y-4 pb-2">
        {isSaleIntent ? (
          // Sale pricing fields
          <>
            <FloatingLabelInput
              label="Property price"
              required
              value={formatNumber(price)}
              onChange={handlePriceChange}
              trailingText="€"
            />

            <FloatingLabelInput
              label="Community fees"
              required
              value={formatNumber(communityFees)}
              onChange={handleCommunityFeesChange}
              trailingText="€/month"
            />

            <FloatingLabelInput
              label="IBI"
              required
              value={formatNumber(ibi)}
              onChange={handleIbiChange}
              trailingText="€/year"
            />
          </>
        ) : (
          // Rental pricing fields
          <>
            <FloatingLabelInput
              label="Rental price"
              required
              value={formatNumber(price)}
              onChange={handlePriceChange}
              trailingText="€/month"
            />

            <FloatingLabelSelect
              label="Contract type"
              required
              value={contractType}
              onValueChange={setContractType}
              options={contractTypeOptions}
            />
          </>
        )}
      </div>
    </StandardModal>
  );
}
