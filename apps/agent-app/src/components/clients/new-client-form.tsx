import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { FloatingLabelPhone } from "@/components/ui/floating-label-phone";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { parsePhoneNumber } from 'libphonenumber-js';
import { toast } from "@/components/ui/use-toast";
import { Settings, ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { countries } from "@/lib/countries";
import { OpportunityType } from "@/types";
import { getOpportunityConfig } from "@/components/opportunities/opportunity-icon";
import { OpportunityBareIcons } from "@/components/opportunities/opportunity-bare-icons";

// Opportunity types for client creation (excluding mortgage)
const opportunityTypes: { type: OpportunityType; title: string; description: string }[] = [
  { type: "buy", title: "Buy", description: "Client wants to buy a property" },
  { type: "sell", title: "Sell", description: "Client has a property for sale" },
  { type: "rent", title: "Rent", description: "Client wants to rent a property" },
  { type: "lease", title: "Lease", description: "Client has a property for rent" },
];

interface NewClientFormProps {
  mode?: 'create' | 'edit';
  initialData?: {
    fullName: string;
    phone: string;
    email?: string;
    opportunityType?: OpportunityType;
  };
  initialFirstName?: string;
  initialLastName?: string;
  onSave?: (data: { fullName: string; phone: string; email?: string; opportunityType: OpportunityType }) => Promise<void>;
  onSuccess?: (clientId: string, clientName: string, clientPhone: string, opportunityType: OpportunityType) => void;
  onCancel?: () => void;
  showCancelButton?: boolean;
  showDevTools?: boolean;
  showHeader?: boolean;
  /** Hide the internal submit button (when using external footer) */
  hideSubmitButton?: boolean;
  /** Callback to expose form state to parent */
  onFormStateChange?: (state: { isSaving: boolean; canSubmit: boolean }) => void;
  /** Ref to expose submit function to parent */
  submitRef?: React.MutableRefObject<(() => void) | null>;
  devErrorMode?: 'none' | 'required' | 'invalid' | 'phone-exists' | 'email-exists' | 'both-exist';
  className?: string;
}

type ErrorMode = 'none' | 'required' | 'invalid' | 'phone-exists' | 'email-exists' | 'both-exist';

export function NewClientForm({ 
  mode = 'create', 
  initialData,
  initialFirstName = '',
  initialLastName = '',
  onSave, 
  onSuccess,
  onCancel,
  showCancelButton = true,
  showDevTools = true,
  showHeader = true,
  hideSubmitButton = false,
  onFormStateChange,
  submitRef,
  devErrorMode,
  className
}: NewClientFormProps) {
  const [formData, setFormData] = useState({
    firstName: initialFirstName,
    lastName: initialLastName,
    email: ''
  });
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState("34"); // Default to Spain
  const [selectedOpportunityType, setSelectedOpportunityType] = useState<OpportunityType | null>(null);
  const [errorMode, setErrorMode] = useState<ErrorMode>(devErrorMode || 'none');
  const [errors, setErrors] = useState({
    firstName: '',
    phone: '',
    email: '',
    opportunityType: ''
  });
  const [isValidPhone, setIsValidPhone] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Expose submit function to parent via ref
  useEffect(() => {
    if (submitRef) {
      submitRef.current = () => {
        formRef.current?.requestSubmit();
      };
    }
  }, [submitRef]);

  // Notify parent of form state changes
  useEffect(() => {
    if (onFormStateChange) {
      onFormStateChange({ isSaving, canSubmit: true });
    }
  }, [isSaving, onFormStateChange]);

  // Initialize form with edit data or initial values
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      const [first, ...rest] = initialData.fullName.split(' ');
      setFormData({
        firstName: first || '',
        lastName: rest.join(' ') || '',
        email: initialData.email || ''
      });
      
      if (initialData.phone) {
        try {
          const parsed = parsePhoneNumber(initialData.phone);
          if (parsed) {
            const country = countries.find(c => c.code === parsed.countryCallingCode);
            if (country) {
              setCountryCode(country.code);
              setPhoneNumber(parsed.nationalNumber);
              setIsValidPhone(true);
            }
          }
        } catch {
          setPhoneNumber(initialData.phone);
        }
      }
    } else if (mode === 'create') {
      // Update form data when initial values change (from search prefill)
      setFormData(prev => ({
        ...prev,
        firstName: initialFirstName,
        lastName: initialLastName
      }));
    }
  }, [mode, initialData, initialFirstName, initialLastName]);

  // Reset form function
  const resetForm = () => {
    setFormData({ firstName: '', lastName: '', email: '' });
    setPhoneNumber('');
    setCountryCode("34");
    setSelectedOpportunityType(null);
    setIsValidPhone(false);
    setErrors({ firstName: '', phone: '', email: '', opportunityType: '' });
    setErrorMode('none');
  };

  // Sync devErrorMode prop with internal state
  useEffect(() => {
    if (devErrorMode !== undefined) {
      setErrorMode(devErrorMode);
    }
  }, [devErrorMode]);

  // Trigger validation when error mode changes (for dev tool)
  useEffect(() => {
    if (errorMode !== 'none') {
      validateForm();
    } else {
      setErrors({ firstName: '', phone: '', email: '', opportunityType: '' });
    }
  }, [errorMode]);

  const validateForm = () => {
    const newErrors = { firstName: '', phone: '', email: '', opportunityType: '' };
    
    if (errorMode === 'required') {
      newErrors.firstName = 'First name is required';
      newErrors.phone = 'Phone number is required';
    }
    
    if (errorMode === 'invalid') {
      newErrors.firstName = 'Invalid characters in name';
      newErrors.phone = 'Invalid phone number format';
      if (formData.email) newErrors.email = 'Invalid email address';
    }
    
    if (errorMode === 'phone-exists' || errorMode === 'both-exist') {
      newErrors.phone = 'This phone number is already registered';
    }
    
    if (errorMode === 'email-exists' || errorMode === 'both-exist') {
      newErrors.email = 'This email address is already registered';
    }
    
    setErrors(newErrors);
    return errorMode === 'none' && !newErrors.firstName && !newErrors.phone && !newErrors.email;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all required fields at once
    const newErrors = { firstName: '', phone: '', email: '', opportunityType: '' };
    let hasErrors = false;
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
      hasErrors = true;
    }
    
    if (!isValidPhone) {
      newErrors.phone = 'Please enter a valid phone number';
      hasErrors = true;
    }
    
    // Opportunity type is required in create mode
    if (mode === 'create' && !selectedOpportunityType) {
      newErrors.opportunityType = 'Please select an opportunity type';
      hasErrors = true;
    }
    
    if (hasErrors) {
      setErrors(newErrors);
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    const fullName = `${formData.firstName} ${formData.lastName}`.trim();
    const fullPhone = `+${countryCode} ${phoneNumber}`;
    
    if (onSave) {
      setIsSaving(true);
      try {
        await onSave({
          fullName,
          phone: fullPhone,
          email: formData.email || undefined,
          opportunityType: selectedOpportunityType!
        });
      } finally {
        setIsSaving(false);
      }
    } else {
      // Default behavior for create mode
      const newClientId = `client-${Date.now()}`;
      
      if (onSuccess) {
        onSuccess(newClientId, fullName, fullPhone, selectedOpportunityType!);
      } else {
        toast({
          title: mode === 'edit' ? "Client updated" : "Client created",
          description: `${fullName} has been ${mode === 'edit' ? 'updated' : 'added'} successfully.`,
        });
      }
      resetForm();
    }
  };

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Header with back button and dev tools - only shown if showHeader is true */}
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {showCancelButton && onCancel && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onCancel}
                className="shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div>
              <h3 className="text-lg font-semibold">
                {mode === 'edit' ? 'Edit client' : 'Add new client'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {mode === 'edit' ? 'Update the client details below.' : 'Enter the client\'s contact information.'}
              </p>
            </div>
          </div>
          {showDevTools && mode === 'create' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Error States (Dev Tool)</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setErrorMode('none')}
                  className={errorMode === 'none' ? 'bg-accent' : ''}
                >
                  No Errors
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setErrorMode('required')}
                  className={errorMode === 'required' ? 'bg-accent' : ''}
                >
                  Required Field Errors
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setErrorMode('invalid')}
                  className={errorMode === 'invalid' ? 'bg-accent' : ''}
                >
                  Invalid Input Errors
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setErrorMode('phone-exists')}
                  className={errorMode === 'phone-exists' ? 'bg-accent' : ''}
                >
                  Phone Already Exists
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setErrorMode('email-exists')}
                  className={errorMode === 'email-exists' ? 'bg-accent' : ''}
                >
                  Email Already Exists
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setErrorMode('both-exist')}
                  className={errorMode === 'both-exist' ? 'bg-accent' : ''}
                >
                  Both Already Exist
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}
      
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 pt-0.5">
        <FloatingLabelInput
          label="First name"
          required
          value={formData.firstName}
          onChange={(e) => {
            setFormData({...formData, firstName: e.target.value});
            if (errors.firstName) setErrors({...errors, firstName: ''});
          }}
          error={!!errors.firstName}
          errorMessage={errors.firstName}
        />

        <FloatingLabelInput
          label="Last name"
          value={formData.lastName}
          onChange={(e) => setFormData({...formData, lastName: e.target.value})}
        />
        
        <FloatingLabelPhone
          label="Phone number"
          required
          value={phoneNumber}
          onChange={(value) => {
            setPhoneNumber(value);
            if (errors.phone) setErrors({...errors, phone: ''});
          }}
          countryCode={countryCode}
          onCountryCodeChange={setCountryCode}
          error={!!errors.phone}
          errorMessage={errors.phone}
          onValidityChange={setIsValidPhone}
        />
        
        <FloatingLabelInput
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => {
            setFormData({...formData, email: e.target.value});
            if (errors.email) setErrors({...errors, email: ''});
          }}
          error={!!errors.email}
          errorMessage={errors.email}
        />
        
        {/* Opportunity Type Selector - only shown in create mode */}
        {mode === 'create' && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold">Opportunity type</span>
              <span className="text-destructive">*</span>
            </div>
            <div className="space-y-2">
              {opportunityTypes.map((opp) => {
                const config = getOpportunityConfig(opp.type);
                const isSelected = selectedOpportunityType === opp.type;
                return (
                  <button
                    key={opp.type}
                    type="button"
                    onClick={() => {
                      setSelectedOpportunityType(opp.type);
                      if (errors.opportunityType) setErrors({...errors, opportunityType: ''});
                    }}
                    className={cn(
                      "w-full p-3 rounded-xl border text-left flex items-center gap-3",
                      "outline-none ring-0 ring-offset-0 shadow-none",
                      "focus:outline-none focus:ring-0 focus:ring-offset-0 focus:shadow-none",
                      "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
                      isSelected
                        ? "bg-card"
                        : "border-border bg-card hover:border-muted-foreground/30"
                    )}
                    style={{ borderColor: isSelected ? 'hsl(var(--foreground))' : undefined }}
                  >
                    {/* Radio button */}
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                      isSelected ? "border-foreground" : "border-muted-foreground/40"
                    )}>
                      {isSelected && (
                        <div className="w-2.5 h-2.5 rounded-full bg-foreground" />
                      )}
                    </div>
                    
                    {/* Icon with background */}
                    <div className={cn("p-2.5 rounded-xl flex items-center justify-center", config.badgeClasses, config.textColor)}>
                      {OpportunityBareIcons[opp.type] && (() => {
                        const IconComponent = OpportunityBareIcons[opp.type];
                        return <IconComponent className="w-5 h-5" />;
                      })()}
                    </div>
                    
                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm">{opp.title}</h4>
                      <p className="text-xs text-muted-foreground">{opp.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            {errors.opportunityType && (
              <p className="text-sm text-destructive">{errors.opportunityType}</p>
            )}
          </div>
        )}
        
        {!hideSubmitButton && (
          <div className="pt-4 pb-4">
            <Button 
              type="submit" 
              className="w-full h-12"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'edit' ? 'Saving...' : 'Creating...'}
                </>
              ) : (
                mode === 'edit' ? 'Save changes' : 'Create client'
              )}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
