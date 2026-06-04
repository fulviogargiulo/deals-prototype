import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// ============================================================================
// Types
// ============================================================================

export interface FloatingLabelFieldOption {
  value: string;
  label: string;
}

type FieldMode = "input" | "select" | "combobox";

interface BaseProps {
  /** The floating label text */
  label: string;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the field has an error */
  error?: boolean;
  /** Error message to display below the field */
  errorMessage?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Additional className for the container */
  className?: string;
}

interface InputModeProps extends BaseProps {
  /** Field mode: "input" for text input only */
  mode?: "input";
  /** Current value (string for input) */
  value: string;
  /** Change handler for input mode */
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Input type */
  type?: React.HTMLInputTypeAttribute;
  /** Trailing text (e.g., "€", "m²") */
  trailingText?: string;
  /** Trailing icon */
  trailingIcon?: React.ReactNode;
  /** Supporting text below the field */
  supportingText?: string;
  /** Keyboard event handler */
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  /** Auto focus on mount */
  autoFocus?: boolean;
  /** Options - not used in input mode */
  options?: never;
  /** onValueChange - not used in input mode */
  onValueChange?: never;
  /** Format display value - not used in input mode */
  formatDisplayValue?: never;
  /** Parse input value - not used in input mode */
  parseInputValue?: never;
  /** Prefix - not used in input mode */
  prefix?: never;
  /** Suffix - not used in input mode */
  suffix?: never;
  /** Placeholder - not used in input mode */
  placeholder?: never;
}

interface SelectModeProps extends BaseProps {
  /** Field mode: "select" for dropdown only */
  mode: "select";
  /** Current value */
  value: string;
  /** Change handler for select mode */
  onValueChange: (value: string) => void;
  /** Dropdown options */
  options: FloatingLabelFieldOption[];
  /** Placeholder - ignored but accepted for compatibility */
  placeholder?: string;
  /** onChange - not used in select mode */
  onChange?: never;
  /** type - not used in select mode */
  type?: never;
  /** trailingText - not used in select mode */
  trailingText?: never;
  /** trailingIcon - not used in select mode */
  trailingIcon?: never;
  /** supportingText - not used in select mode */
  supportingText?: never;
  /** Format display value - not used in select mode */
  formatDisplayValue?: never;
  /** Parse input value - not used in select mode */
  parseInputValue?: never;
  /** Prefix - not used in select mode */
  prefix?: never;
  /** Suffix - not used in select mode */
  suffix?: never;
}

interface ComboboxModeProps extends BaseProps {
  /** Field mode: "combobox" for hybrid input + dropdown */
  mode: "combobox";
  /** Current value */
  value: string;
  /** Change handler for combobox mode */
  onValueChange: (value: string) => void;
  /** Dropdown options */
  options: FloatingLabelFieldOption[];
  /** Format function for display value (e.g., adding currency symbols) */
  formatDisplayValue?: (value: string) => string;
  /** Parse function for input (e.g., removing non-numeric characters) */
  parseInputValue?: (input: string) => string;
  /** Prefix to show in the input (e.g., "€") */
  prefix?: string;
  /** Suffix to show in the input (e.g., "m²") */
  suffix?: string;
  /** Input type for manual entry */
  type?: "text" | "number";
  /** onChange - not used in combobox mode */
  onChange?: never;
  /** trailingText - not used in combobox mode */
  trailingText?: never;
  /** trailingIcon - not used in combobox mode */
  trailingIcon?: never;
  /** supportingText - not used in combobox mode */
  supportingText?: never;
}

export type FloatingLabelFieldProps = InputModeProps | SelectModeProps | ComboboxModeProps;

// ============================================================================
// Input Mode Component
// ============================================================================

const InputMode = React.forwardRef<HTMLInputElement, InputModeProps>(
  (
    {
      label,
      required,
      error,
      errorMessage,
      disabled,
      className,
      value,
      onChange,
      type = "text",
      trailingText,
      trailingIcon,
      supportingText,
      onKeyDown,
      autoFocus,
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const hasValue = value !== undefined && value !== "";
    const isFloating = isFocused || hasValue;

    return (
      <div className="w-full">
        <div className="relative">
          {/* Floating Label - stays muted-foreground even in error state */}
          <label
            className={cn(
              "absolute left-4 pointer-events-none transition-all duration-200 ease-out z-10",
              isFloating
                ? "top-2 text-xs text-muted-foreground"
                : "top-1/2 -translate-y-1/2 text-base text-muted-foreground"
            )}
          >
            {label}
            {required && <span className="text-destructive ml-0.5">*</span>}
          </label>

          {/* Input */}
          <input
            type={type}
            ref={ref}
            value={value}
            onChange={onChange}
            disabled={disabled}
            autoFocus={autoFocus}
            onKeyDown={onKeyDown}
            onFocus={(e) => {
              setIsFocused(true);
            }}
            onBlur={(e) => {
              setIsFocused(false);
            }}
            className={cn(
              "flex w-full rounded-xl border pt-6 pb-2 px-4 text-base font-medium transition-colors duration-500",
              "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
              "outline-none ring-0 ring-offset-0 shadow-none focus:outline-none focus:ring-0 focus:ring-offset-0 focus:shadow-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "h-14 border-input bg-background",
              isFocused && !error && "border-primary",
              trailingText && "pr-16",
              trailingIcon && "pr-12",
              error && !isFocused && "border-destructive/40 bg-tier-danger-bg",
              error && isFocused && "border-destructive bg-tier-danger-bg",
              className
            )}
          />

          {/* Trailing Text */}
          {trailingText && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {trailingText}
            </span>
          )}

          {/* Trailing Icon */}
          {trailingIcon && !trailingText && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {trailingIcon}
            </span>
          )}
        </div>

        {/* Supporting Text */}
        {supportingText && !errorMessage && (
          <p className="mt-1.5 text-sm text-muted-foreground px-1">{supportingText}</p>
        )}

        {/* Error Message */}
        {errorMessage && (
          <p className="mt-1.5 text-sm text-destructive px-1">{errorMessage}</p>
        )}
      </div>
    );
  }
);

InputMode.displayName = "InputMode";

// ============================================================================
// Select Mode Component
// ============================================================================

const SelectMode = React.forwardRef<HTMLButtonElement, SelectModeProps>(
  (
    {
      label,
      required,
      error,
      errorMessage,
      disabled,
      className,
      value,
      onValueChange,
      options,
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const hasValue = value !== undefined && value !== "";
    const isFloating = isFocused || hasValue;

    return (
      <div className="w-full">
        <div className="relative">
          {/* Floating Label - stays muted-foreground even in error state */}
          <div
            className={cn(
              "absolute left-4 right-12 pointer-events-none transition-all duration-200 ease-out z-10",
              isFloating ? "top-2 text-xs" : "top-1/2 -translate-y-1/2 text-base"
            )}
          >
            <span className="text-muted-foreground">{label}</span>
            {required && <span className="text-destructive ml-0.5">*</span>}
          </div>

          {/* Select */}
          <Select
            value={value}
            onValueChange={onValueChange}
            disabled={disabled}
            onOpenChange={(open) => setIsFocused(open)}
          >
            <SelectTrigger
              ref={ref}
              className={cn(
                "h-14 px-4 text-base font-medium rounded-xl transition-colors duration-500",
                isFocused && !error ? "border-primary" : "border-input",
                isFloating ? "pt-5 pb-1" : "py-0",
                "outline-none ring-0 ring-offset-0 shadow-none focus:outline-none focus:ring-0 focus:ring-offset-0 focus:shadow-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
                "[&>svg]:absolute [&>svg]:right-4 [&>svg]:top-1/2 [&>svg]:-translate-y-1/2",
                error && !isFocused && "border-destructive/40 bg-tier-danger-bg",
                error && isFocused && "border-destructive bg-tier-danger-bg",
                className
              )}
            >
              {hasValue ? <SelectValue placeholder="" /> : <span></span>}
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <p className="mt-1.5 text-sm text-destructive px-1">{errorMessage}</p>
        )}
      </div>
    );
  }
);

SelectMode.displayName = "SelectMode";

// ============================================================================
// Combobox Mode Component
// ============================================================================

const ComboboxMode = React.forwardRef<HTMLInputElement, ComboboxModeProps>(
  (
    {
      label,
      required,
      error,
      errorMessage,
      disabled,
      className,
      value,
      onValueChange,
      options,
      formatDisplayValue,
      parseInputValue,
      prefix,
      suffix,
      type = "text",
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState("");
    const [isFocused, setIsFocused] = React.useState(false);
    const internalInputRef = React.useRef<HTMLInputElement>(null);
    const actualRef = (ref as React.RefObject<HTMLInputElement>) || internalInputRef;

    // Track if current value matches an option (to hide prefix when showing option label)
    const matchingOption = options.find((opt) => opt.value === value);
    const isOptionValue = matchingOption && matchingOption.value !== "none";

    // Sync input value with external value
    React.useEffect(() => {
      if (!isFocused) {
        if (isOptionValue) {
          setInputValue(matchingOption.label);
        } else if (value && value !== "none") {
          // Don't use formatDisplayValue here - just show the raw formatted number
          // The prefix is handled separately via the prefix prop
          const numericValue = parseInt(value);
          if (!isNaN(numericValue)) {
            setInputValue(numericValue.toLocaleString("es-ES"));
          } else {
            setInputValue(value);
          }
        } else {
          setInputValue("");
        }
      }
    }, [value, options, isFocused, isOptionValue, matchingOption]);

    const hasValue = inputValue !== "" || (value !== undefined && value !== "" && value !== "none");
    const isFloating = isFocused || hasValue || isOpen;

    // Show prefix only when focused or when value is custom (not from options)
    const showPrefix = prefix && isFloating && (isFocused || !isOptionValue);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      setInputValue(rawValue);

      // Parse and update the actual value
      const parsed = parseInputValue ? parseInputValue(rawValue) : rawValue;
      if (parsed) {
        onValueChange(parsed);
      } else if (rawValue === "") {
        onValueChange("none");
      }
    };

    const handleInputFocus = () => {
      setIsFocused(true);
      // Clear the formatted display to allow raw input
      if (value && value !== "none") {
        setInputValue(value);
      }
    };

    const handleInputBlur = () => {
      setIsFocused(false);
    };

    const handleOpenChange = (open: boolean) => {
      setIsOpen(open);
      if (open) {
        // Focus input when dropdown opens
        setTimeout(() => {
          actualRef.current?.focus();
        }, 0);
      }
    };

    const handleOptionSelect = (optionValue: string) => {
      onValueChange(optionValue);
      setIsOpen(false);

      // Update input display
      const selectedOption = options.find((opt) => opt.value === optionValue);
      if (selectedOption && optionValue !== "none") {
        setInputValue(selectedOption.label);
      } else {
        setInputValue("");
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      } else if (e.key === "Escape") {
        setIsOpen(false);
        actualRef.current?.blur();
      } else if (e.key === "Enter") {
        e.preventDefault();
        setIsOpen(false);
        actualRef.current?.blur();
      }
    };

    return (
      <div className="w-full">
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <div className="relative">
              {/* Floating Label - stays muted-foreground even in error state */}
              <div
                className={cn(
                  "absolute left-4 right-12 pointer-events-none transition-all duration-200 ease-out z-10",
                  isFloating ? "top-2 text-xs" : "top-1/2 -translate-y-1/2 text-base"
                )}
              >
                <span className="text-muted-foreground">{label}</span>
                {required && <span className="text-destructive ml-0.5">*</span>}
              </div>

              {/* Prefix - only show when focused or custom value */}
              {showPrefix && (
                <span className="absolute left-4 bottom-2 text-base font-medium text-foreground pointer-events-none">
                  {prefix}
                </span>
              )}

              {/* Input */}
              <input
                ref={actualRef}
                type={type}
                value={inputValue}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                className={cn(
                  "flex h-14 w-full rounded-xl border text-base font-medium transition-colors duration-500",
                  "outline-none ring-0 ring-offset-0 shadow-none focus:outline-none focus:ring-0 focus:ring-offset-0 focus:shadow-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  "border-input bg-background",
                  (isFocused || isOpen) && !error && "border-primary",
                  isFloating ? "pt-5 pb-1 px-4" : "py-0 px-4",
                  showPrefix && "pl-7",
                  suffix && "pr-12",
                  error && !(isFocused || isOpen) && "border-destructive/40 bg-tier-danger-bg",
                  error && (isFocused || isOpen) && "border-destructive bg-tier-danger-bg",
                  className
                )}
                placeholder=""
              />

              {/* Suffix */}
              {suffix && (
                <span className="absolute right-10 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                  {suffix}
                </span>
              )}

              {/* Dropdown Arrow */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(!isOpen);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                disabled={disabled}
              >
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-500",
                    isOpen && "rotate-180"
                  )}
                />
              </button>
            </div>
          </PopoverTrigger>

          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] p-0 bg-popover border border-border shadow-lg z-[300]"
            align="start"
            sideOffset={4}
          >
            <div className="max-h-60 overflow-y-auto py-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleOptionSelect(option.value)}
                  className={cn(
                    "w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors",
                    value === option.value && "bg-muted font-medium"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Error Message */}
        {errorMessage && (
          <p className="mt-1.5 text-sm text-destructive px-1">{errorMessage}</p>
        )}
      </div>
    );
  }
);

ComboboxMode.displayName = "ComboboxMode";

// ============================================================================
// Main Component
// ============================================================================

const FloatingLabelField = React.forwardRef<
  HTMLInputElement | HTMLButtonElement,
  FloatingLabelFieldProps
>((props, ref) => {
  const mode = props.mode || "input";

  if (mode === "select") {
    return <SelectMode ref={ref as React.Ref<HTMLButtonElement>} {...(props as SelectModeProps)} />;
  }

  if (mode === "combobox") {
    return <ComboboxMode ref={ref as React.Ref<HTMLInputElement>} {...(props as ComboboxModeProps)} />;
  }

  return <InputMode ref={ref as React.Ref<HTMLInputElement>} {...(props as InputModeProps)} />;
});

FloatingLabelField.displayName = "FloatingLabelField";

// ============================================================================
// Legacy Exports (for backward compatibility during migration)
// ============================================================================

/** @deprecated Use FloatingLabelField with mode="input" instead */
export const FloatingLabelInput = React.forwardRef<
  HTMLInputElement,
  Omit<InputModeProps, "mode">
>((props, ref) => <InputMode ref={ref} {...props} />);
FloatingLabelInput.displayName = "FloatingLabelInput";

/** @deprecated Use FloatingLabelField with mode="select" instead */
export const FloatingLabelSelect = React.forwardRef<
  HTMLButtonElement,
  Omit<SelectModeProps, "mode">
>((props, ref) => <SelectMode ref={ref} {...props} mode="select" />);
FloatingLabelSelect.displayName = "FloatingLabelSelect";

/** @deprecated Use FloatingLabelField with mode="combobox" instead */
export const FloatingLabelCombobox = React.forwardRef<
  HTMLInputElement,
  Omit<ComboboxModeProps, "mode">
>((props, ref) => <ComboboxMode ref={ref} {...props} mode="combobox" />);
FloatingLabelCombobox.displayName = "FloatingLabelCombobox";

export { FloatingLabelField };
