import * as React from "react";
import { cn } from "@/lib/utils";
import { parsePhoneNumber, AsYouType } from "libphonenumber-js";
import { countries } from "@/lib/countries";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronDown } from "lucide-react";

export interface FloatingLabelPhoneProps {
  /** The floating label text */
  label: string;
  /** Whether the field is required */
  required?: boolean;
  /** Current phone number value (national format, without country code) */
  value: string;
  /** Change handler for phone number */
  onChange: (value: string) => void;
  /** Selected country code (e.g., "34" for Spain) */
  countryCode: string;
  /** Change handler for country code */
  onCountryCodeChange: (code: string) => void;
  /** Whether the field has an error */
  error?: boolean;
  /** Error message to display below the field */
  errorMessage?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Additional className for the container */
  className?: string;
  /** Callback when phone validity changes */
  onValidityChange?: (isValid: boolean) => void;
}

export const FloatingLabelPhone = React.forwardRef<
  HTMLInputElement,
  FloatingLabelPhoneProps
>(
  (
    {
      label,
      required,
      value,
      onChange,
      countryCode,
      onCountryCodeChange,
      error,
      errorMessage,
      disabled,
      className,
      onValidityChange,
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [countryPickerOpen, setCountryPickerOpen] = React.useState(false);
    const phoneErrorTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const [internalError, setInternalError] = React.useState(false);

    const selectedCountry = React.useMemo(
      () => countries.find((c) => c.code === countryCode) || countries.find((c) => c.countryCode === "ES")!,
      [countryCode]
    );

    const hasValue = value !== undefined && value !== "";
    const isFloating = isFocused || hasValue || countryPickerOpen;
    const showError = error || internalError;

    // Validate phone number
    const validatePhone = React.useCallback(
      (phoneValue: string, country: typeof selectedCountry) => {
        if (!phoneValue) return false;
        try {
          const fullNumber = `+${country.code}${phoneValue.replace(/\D/g, "")}`;
          const parsed = parsePhoneNumber(fullNumber, country.countryCode);
          return parsed.isValid();
        } catch {
          return false;
        }
      },
      []
    );

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      setInternalError(false);
      if (phoneErrorTimeoutRef.current) {
        clearTimeout(phoneErrorTimeoutRef.current);
      }

      if (inputValue === "") {
        onChange("");
        onValidityChange?.(false);
        return;
      }

      // Handle pasted numbers with country code
      if (inputValue.startsWith("+")) {
        console.log('Paste detected, input:', inputValue);
        try {
          // Use parsePhoneNumber to properly extract and format national number
          const parsed = parsePhoneNumber(inputValue);
          console.log('Parsed result:', {
            country: parsed?.country,
            nationalNumber: parsed?.nationalNumber,
            isValid: parsed?.isValid(),
            formatNational: parsed?.formatNational()
          });
          
          if (parsed && parsed.country) {
            const matchedCountry = countries.find(c => c.countryCode === parsed.country);
            console.log('Matched country:', matchedCountry);
            
            if (matchedCountry) {
              if (selectedCountry.code !== matchedCountry.code) {
                onCountryCodeChange(matchedCountry.code);
              }
              
              // Use formatNational() to get properly formatted national number with spaces
              const formattedNational = parsed.formatNational();
              console.log('Setting formatted national:', formattedNational);
              onChange(formattedNational);
              
              const isValid = parsed.isValid();
              onValidityChange?.(isValid);
              return;
            }
          }
        } catch (error) {
          console.log('Parse error:', error);
          // Fallback: try manual country code matching
          const digits = inputValue.slice(1).replace(/\D/g, "");
          for (const country of countries) {
            if (digits.startsWith(country.code)) {
              if (selectedCountry.code !== country.code) {
                onCountryCodeChange(country.code);
              }
              const localNumber = digits.slice(country.code.length);
              onChange(localNumber);
              onValidityChange?.(false);
              return;
            }
          }
        }
        onChange(inputValue);
        onValidityChange?.(false);
      } else {
        // Normal input - format as you type
        try {
          const digitsOnly = inputValue.replace(/\D/g, "");
          
          // Try to parse and format the number properly
          // This handles cases where trunk prefix (like 0 for UAE) might be missing
          const fullNumber = `+${selectedCountry.code}${digitsOnly}`;
          
          let formatted = inputValue;
          let isValid = false;
          
          try {
            const parsed = parsePhoneNumber(fullNumber, selectedCountry.countryCode);
            isValid = parsed.isValid();
            
            if (isValid) {
              // Use formatNational for proper spacing with trunk prefix
              formatted = parsed.formatNational();
            } else {
              // Fall back to AsYouType for partial numbers
              const formatter = new AsYouType(selectedCountry.countryCode);
              formatted = formatter.input(inputValue);
            }
          } catch {
            // Fall back to AsYouType
            const formatter = new AsYouType(selectedCountry.countryCode);
            formatted = formatter.input(inputValue);
          }
          
          onChange(formatted);
          onValidityChange?.(isValid);

          if (!isValid && formatted.length > 0) {
            phoneErrorTimeoutRef.current = setTimeout(() => {
              setInternalError(true);
            }, 2000);
          }
        } catch {
          onChange(inputValue);
          onValidityChange?.(false);
          if (inputValue.length > 0) {
            phoneErrorTimeoutRef.current = setTimeout(() => {
              setInternalError(true);
            }, 2000);
          }
        }
      }
    };

    const handleCountryChange = (code: string) => {
      const country = countries.find((c) => c.code === code);
      if (country) {
        onCountryCodeChange(country.code);
        onChange("");
        onValidityChange?.(false);
        setInternalError(false);
        if (phoneErrorTimeoutRef.current) {
          clearTimeout(phoneErrorTimeoutRef.current);
        }
      }
      setCountryPickerOpen(false);
    };

    const displayErrorMessage = errorMessage || (internalError ? "Please enter a valid phone number" : undefined);

    return (
      <div className="w-full">
        <div className="relative">
          {/* Floating Label - positioned after country selector */}
          <label
            className={cn(
              "absolute pointer-events-none transition-all duration-200 ease-out z-10",
              isFloating
                ? "top-2 text-xs text-muted-foreground left-[124px]"
                : "top-1/2 -translate-y-1/2 text-base text-muted-foreground left-[124px]"
            )}
          >
            {label}
            {required && <span className="text-destructive ml-0.5">*</span>}
          </label>

          {/* Combined Container */}
          <div
            className={cn(
              "flex h-14 w-full rounded-xl border transition-colors duration-500 p-1",
              isFocused || countryPickerOpen ? "border-primary" : "border-input",
              showError && !isFocused && !countryPickerOpen && "border-[hsl(var(--border-destructive-muted))] bg-[hsl(var(--surface-red-alpha))]",
              showError && (isFocused || countryPickerOpen) && "border-destructive bg-[hsl(var(--surface-red-alpha))]",
              !showError && "bg-background",
              disabled && "cursor-not-allowed opacity-50",
              className
            )}
          >
            {/* Country Selector - Rounded pill inside the container */}
            <Popover open={countryPickerOpen} onOpenChange={setCountryPickerOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  disabled={disabled}
                  className={cn(
                    "flex items-center gap-1.5 px-3 h-full shrink-0 rounded-lg transition-colors",
                    "outline-none ring-0 ring-offset-0 shadow-none focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
                    showError 
                      ? "bg-[hsl(var(--surface-red-alpha))]" 
                      : "bg-card hover:bg-muted/30",
                    disabled && "pointer-events-none"
                  )}
                >
                  <span className="text-lg">{selectedCountry.flag}</span>
                  <span className="text-sm font-medium">+{selectedCountry.code}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[320px] p-0 pointer-events-auto"
                align="start"
              >
                <Command className="flex flex-col max-h-[400px]">
                  <CommandInput
                    placeholder="Search country or code..."
                    className="h-12 border-none focus:outline-none focus-visible:outline-none focus:ring-0 focus:ring-offset-0 flex-shrink-0"
                  />
                  <CommandEmpty>No country found.</CommandEmpty>
                  <CommandList
                    className="overflow-y-auto overscroll-contain flex-1"
                    onWheelCapture={(e) => e.stopPropagation()}
                  >
                    <CommandGroup>
                      {countries.map((country) => (
                        <CommandItem
                          key={`${country.code}-${country.countryCode}`}
                          value={`${country.name} ${country.code}`}
                          onSelect={() => handleCountryChange(country.code)}
                          className="flex items-center gap-2 px-3 py-2"
                        >
                          <Check
                            className={cn(
                              "h-4 w-4 shrink-0",
                              selectedCountry.code === country.code
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <span className="text-xl shrink-0">{country.flag}</span>
                          <span className="font-medium shrink-0 min-w-[45px]">
                            +{country.code}
                          </span>
                          <span className="text-muted-foreground truncate">
                            {country.name}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Phone Input */}
            <input
              ref={ref}
              type="tel"
              value={value}
              onChange={handlePhoneChange}
              disabled={disabled}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={cn(
                "flex-1 bg-transparent text-base font-medium px-3 rounded-r-lg",
                "outline-none ring-0 ring-offset-0 shadow-none focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
                isFloating ? "pt-4 pb-0" : "py-0",
                disabled && "cursor-not-allowed"
              )}
              placeholder=""
            />
          </div>
        </div>

        {/* Error Message */}
        {displayErrorMessage && (
          <p className="mt-1.5 text-sm text-destructive px-1">{displayErrorMessage}</p>
        )}
      </div>
    );
  }
);

FloatingLabelPhone.displayName = "FloatingLabelPhone";
