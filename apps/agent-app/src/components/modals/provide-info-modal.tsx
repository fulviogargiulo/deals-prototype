import { useState } from 'react';
import { Deal } from '@/types';
import { StandardModal, StandardModalFooter } from '@/components/ui/standard-modal';
import { Button } from '@/components/ui/button';
import { Upload, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { sharedDealDocumentRequirements } from '@huspy/shared-domain';

interface ProvideInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: Deal | null;
  onInfoSubmitted?: (dealId: string) => void;
}

export function ProvideInfoModal({ open, onOpenChange, deal, onInfoSubmitted }: ProvideInfoModalProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!deal) return null;

  const pendingRequirements = sharedDealDocumentRequirements.filter(
    (r) => r.dealId === deal.id && r.status === 'pending'
  );

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    pendingRequirements.forEach((r) => {
      if (r.required && !values[r.id]?.trim()) {
        newErrors[r.id] = `${r.label} is required`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success('Documents submitted — deal moved to Under Review');
      onInfoSubmitted?.(deal.id);
      handleClose(false);
    }, 800);
  };

  const handleFileSelect = (requirementId: string) => {
    setValues(prev => ({ ...prev, [requirementId]: 'document.pdf' }));
    setErrors(prev => { const n = { ...prev }; delete n[requirementId]; return n; });
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setValues({});
      setErrors({});
      setIsSubmitting(false);
    }
    onOpenChange(open);
  };

  const hasAnyValue = pendingRequirements.some((r) => !!values[r.id]?.trim());

  return (
    <StandardModal
      open={open}
      onOpenChange={handleClose}
      title="Upload Missing Documents"
      size="xl"
      contentClassName="pb-6"
      footer={
        hasAnyValue ? (
          <StandardModalFooter
            label="Submit Documents"
            loadingLabel="Submitting…"
            onClick={handleSubmit}
            isLoading={isSubmitting}
          />
        ) : undefined
      }
    >
      <div className="space-y-6">
        {pendingRequirements.length === 0 ? (
          <p className="text-[14px] text-[hsl(var(--fg-secondary))]">
            No pending documents for this deal.
          </p>
        ) : (
          pendingRequirements.map((r) => (
            <div key={r.id} className="space-y-1.5">
              <label className="text-[14px] font-semibold leading-[140%] text-[hsl(var(--fg-primary))]">
                {r.label}
                {r.required && <span className="text-[hsl(var(--ds-red))] ml-0.5">*</span>}
              </label>
              <Button
                variant="outline"
                className={`w-full h-10 justify-start text-[14px] font-normal ${
                  values[r.id] ? 'text-[hsl(var(--fg-primary))]' : 'text-[hsl(var(--fg-secondary))]'
                } ${errors[r.id] ? 'border-[hsl(var(--ds-red))]' : ''}`}
                onClick={() => handleFileSelect(r.id)}
              >
                <Upload className="w-4 h-4 mr-2 shrink-0" />
                {values[r.id] || 'Choose file'}
              </Button>
              {errors[r.id] && (
                <p className="flex items-center gap-1 text-[12px] text-[hsl(var(--ds-red))] leading-[140%]">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {errors[r.id]}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </StandardModal>
  );
}
