import { useState } from 'react';
import { Deal } from '@/types';
import { StandardModal, StandardModalFooter } from '@/components/ui/standard-modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

type FieldValidation = {
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  patternMessage?: string;
};

interface MissingField {
  id: string;
  label: string;
  type: 'text' | 'file';
  placeholder?: string;
  required?: boolean;
  validation?: FieldValidation;
}

const MISSING_FIELDS_MAP: Record<string, MissingField[]> = {
  'deal-5': [
    {
      id: 'bank-account',
      label: 'Bank Account Details',
      type: 'text',
      placeholder: 'e.g. ES91 2100 0418 4502 0005 1332',
      required: true,
      validation: {
        pattern: /^[A-Z]{2}\d{2}[\s]?[\dA-Z]{4}[\s]?[\dA-Z]{4}[\s]?[\dA-Z]{4}[\s]?[\dA-Z]{4}[\s]?[\dA-Z]{0,4}$/i,
        patternMessage: 'Enter a valid IBAN (e.g. ES91 2100 0418 4502 0005 1332)',
        minLength: 15,
        maxLength: 34,
      },
    },
    { id: 'form-f', label: 'Upload Form F', type: 'file', required: true },
  ],
  'deal-6': [
    {
      id: 'client-name',
      label: 'Client Legal Name',
      type: 'text',
      placeholder: 'Full legal name',
      required: true,
      validation: {
        pattern: /^[A-Za-zÀ-ÿ\s\-'.]+$/,
        patternMessage: 'Name can only contain letters, spaces, hyphens and apostrophes',
        minLength: 2,
        maxLength: 100,
      },
    },
    {
      id: 'tax-id',
      label: 'Tax ID (NIF/CIF)',
      type: 'text',
      placeholder: 'e.g. 12345678A',
      required: true,
      validation: {
        pattern: /^[A-Z0-9]{7,12}$/i,
        patternMessage: 'Enter a valid Tax ID (7-12 alphanumeric characters)',
        minLength: 7,
        maxLength: 12,
      },
    },
  ],
};

const DEFAULT_FIELDS: MissingField[] = [
  {
    id: 'bank-account',
    label: 'Bank Account Details',
    type: 'text',
    placeholder: 'e.g. ES91 2100 0418 4502 0005 1332',
    required: true,
    validation: {
      pattern: /^[A-Z]{2}\d{2}[\s]?[\dA-Z]{4}[\s]?[\dA-Z]{4}[\s]?[\dA-Z]{4}[\s]?[\dA-Z]{4}[\s]?[\dA-Z]{0,4}$/i,
      patternMessage: 'Enter a valid IBAN (e.g. ES91 2100 0418 4502 0005 1332)',
      minLength: 15,
      maxLength: 34,
    },
  },
  { id: 'form-f', label: 'Upload Form F', type: 'file', required: true },
  {
    id: 'client-name',
    label: 'Client Legal Name',
    type: 'text',
    placeholder: 'Full legal name',
    required: true,
    validation: {
      pattern: /^[A-Za-zÀ-ÿ\s\-'.]+$/,
      patternMessage: 'Name can only contain letters, spaces, hyphens and apostrophes',
      minLength: 2,
      maxLength: 100,
    },
  },
];

interface ProvideInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: Deal | null;
  onInfoSubmitted?: (dealId: string) => void;
}

function validateField(field: MissingField, value: string): string | null {
  const trimmed = value.trim();

  if (field.required && !trimmed) {
    return `${field.label} is required`;
  }

  if (!trimmed) return null;

  const v = field.validation;
  if (!v) return null;

  if (v.minLength && trimmed.length < v.minLength) {
    return `Must be at least ${v.minLength} characters`;
  }

  if (v.maxLength && trimmed.length > v.maxLength) {
    return `Must be no more than ${v.maxLength} characters`;
  }

  if (v.pattern && !v.pattern.test(trimmed)) {
    return v.patternMessage || 'Invalid format';
  }

  return null;
}

export function ProvideInfoModal({ open, onOpenChange, deal, onInfoSubmitted }: ProvideInfoModalProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!deal) return null;

  const fields = MISSING_FIELDS_MAP[deal.id] || DEFAULT_FIELDS;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    fields.forEach(field => {
      const error = field.type === 'file'
        ? (field.required && !values[field.id]?.trim() ? `${field.label} is required` : null)
        : validateField(field, values[field.id] || '');
      if (error) newErrors[field.id] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success('Information submitted — deal moved to Under Review');
      onInfoSubmitted?.(deal.id);
      handleClose(false);
    }, 800);
  };

  const handleFileSelect = (fieldId: string) => {
    setValues(prev => ({ ...prev, [fieldId]: 'document.pdf' }));
    setErrors(prev => { const n = { ...prev }; delete n[fieldId]; return n; });
  };

  const handleChange = (fieldId: string, value: string, field: MissingField) => {
    // Enforce maxLength at input level
    const maxLen = field.validation?.maxLength;
    const capped = maxLen ? value.slice(0, maxLen) : value;

    setValues(prev => ({ ...prev, [fieldId]: capped }));

    // Clear error on valid input
    if (errors[fieldId]) {
      const error = validateField(field, capped);
      if (!error) {
        setErrors(prev => { const n = { ...prev }; delete n[fieldId]; return n; });
      }
    }
  };

  const handleBlur = (fieldId: string, field: MissingField) => {
    const value = values[fieldId] || '';
    if (value.trim()) {
      const error = validateField(field, value);
      if (error) {
        setErrors(prev => ({ ...prev, [fieldId]: error }));
      }
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setValues({});
      setErrors({});
      setIsSubmitting(false);
    }
    onOpenChange(open);
  };

  const hasAnyValue = fields.some(f => !!values[f.id]?.trim());

  return (
    <StandardModal
      open={open}
      onOpenChange={handleClose}
      title="Provide Missing Information"
      size="xl"
      contentClassName="pb-6"
      footer={
        hasAnyValue ? (
          <StandardModalFooter
            label="Submit Information"
            loadingLabel="Submitting…"
            onClick={handleSubmit}
            isLoading={isSubmitting}
          />
        ) : undefined
      }
    >
      <div className="space-y-6">
        {fields.map((field) => (
          <div key={field.id} className="space-y-1.5">
            <label className="text-[14px] font-semibold leading-[140%] text-[hsl(var(--fg-primary))]">
              {field.label}
              {field.required && <span className="text-[hsl(var(--ds-red))] ml-0.5">*</span>}
            </label>

            {field.type === 'text' ? (
              <Input
                placeholder={field.placeholder}
                value={values[field.id] || ''}
                onChange={(e) => handleChange(field.id, e.target.value, field)}
                onBlur={() => handleBlur(field.id, field)}
                maxLength={field.validation?.maxLength}
                className={`h-10 text-[14px] ${errors[field.id] ? 'border-[hsl(var(--ds-red))] focus:border-[hsl(var(--ds-red))]' : ''}`}
              />
            ) : (
              <Button
                variant="outline"
                className={`w-full h-10 justify-start text-[14px] font-normal ${
                  values[field.id]
                    ? 'text-[hsl(var(--fg-primary))]'
                    : 'text-[hsl(var(--fg-secondary))]'
                } ${errors[field.id] ? 'border-[hsl(var(--ds-red))]' : ''}`}
                onClick={() => handleFileSelect(field.id)}
              >
                <Upload className="w-4 h-4 mr-2 shrink-0" />
                {values[field.id] || 'Choose file'}
              </Button>
            )}

            {errors[field.id] && (
              <p className="flex items-center gap-1 text-[12px] text-[hsl(var(--ds-red))] leading-[140%]">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {errors[field.id]}
              </p>
            )}
          </div>
        ))}
      </div>
    </StandardModal>
  );
}
