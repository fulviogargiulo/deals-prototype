import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SlideShow } from "@/components/ui/slideshow";
import { countries } from "@/lib/countries";
import { parsePhoneNumber, AsYouType } from "libphonenumber-js";
import { LoginDevTool, type ModalStyleMode } from "@/components/dev-tools/login-dev-tool";
import Lottie from "lottie-react";
import logoAnimation from "@/assets/logo-white-intro.json";
import { WizardModal } from "@/components/ui/standard-modal";


type LoginStep = "phone" | "otp";

// Glass-themed floating label phone component for login
interface GlassPhoneInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  countryCode: string;
  onCountryCodeChange: (code: string) => void;
  error?: boolean;
  errorMessage?: string;
  onValidityChange?: (isValid: boolean) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  inputRef?: React.RefObject<HTMLInputElement>;
  styleMode?: "glass" | "solid";
}

function GlassPhoneInput({
  label,
  value,
  onChange,
  countryCode,
  onCountryCodeChange,
  error,
  errorMessage,
  onValidityChange,
  onKeyDown,
  inputRef,
  styleMode = "glass",
}: GlassPhoneInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const phoneErrorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [internalError, setInternalError] = useState(false);

  const selectedCountry = countries.find((c) => c.code === countryCode) || countries.find((c) => c.countryCode === "ES")!;
  const hasValue = value !== "";
  const isFloating = isFocused || hasValue || countryPickerOpen;

  const validatePhone = useCallback((phoneValue: string, country: typeof selectedCountry) => {
    if (!phoneValue) return false;
    try {
      const fullNumber = `+${country.code}${phoneValue.replace(/\D/g, "")}`;
      const parsed = parsePhoneNumber(fullNumber, country.countryCode);
      return parsed.isValid();
    } catch {
      return false;
    }
  }, []);

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
      const digits = inputValue.slice(1).replace(/\D/g, "");
      for (const country of countries) {
        if (digits.startsWith(country.code)) {
          if (selectedCountry.code !== country.code) {
            onCountryCodeChange(country.code);
          }
          const localNumber = digits.slice(country.code.length);
          if (localNumber) {
            try {
              const formatter = new AsYouType(country.countryCode);
              const formatted = formatter.input(localNumber);
              onChange(formatted);
              onValidityChange?.(validatePhone(localNumber, country));
            } catch {
              onChange(localNumber);
              onValidityChange?.(false);
            }
          } else {
            onChange("");
            onValidityChange?.(false);
          }
          return;
        }
      }
      onChange(inputValue);
      onValidityChange?.(false);
    } else {
      try {
        const formatter = new AsYouType(selectedCountry.countryCode);
        const formatted = formatter.input(inputValue);
        onChange(formatted);
        const isValid = validatePhone(inputValue, selectedCountry);
        onValidityChange?.(isValid);

        if (!isValid && formatted.length > 0) {
          phoneErrorTimeoutRef.current = setTimeout(() => {
            setInternalError(true);
          }, 2000);
        }
      } catch {
        onChange(inputValue);
        onValidityChange?.(false);
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
    }
    setCountryPickerOpen(false);
  };

  const showError = error || internalError;

  const isGlass = styleMode === "glass";

  return (
    <div className="w-full">
      <div className="relative">
        {/* Floating Label */}
        <label
          className={cn(
            "absolute pointer-events-none transition-all duration-200 ease-out z-10",
            isFloating
              ? "top-2 text-xs left-[108px]"
              : "top-1/2 -translate-y-1/2 text-base left-[108px]",
            showError ? "text-destructive" : isGlass ? "text-white/60" : "text-muted-foreground"
          )}
        >
          {label}
        </label>

        {/* Combined Container */}
        <div
          className={cn(
            "flex h-14 w-full rounded-xl border transition-colors duration-200",
            isGlass ? "bg-white/10" : "bg-muted/50",
            isFocused || countryPickerOpen 
              ? isGlass ? "border-white" : "border-primary" 
              : isGlass ? "border-white/20" : "border-border",
            showError && "border-destructive"
          )}
        >
          {/* Country Selector */}
          <Popover open={countryPickerOpen} onOpenChange={setCountryPickerOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex items-center gap-1.5 px-3 h-full border-r shrink-0 rounded-l-[11px] transition-colors",
                  isGlass 
                    ? "border-white/20 bg-white/5 hover:bg-white/10 text-white" 
                    : "border-border bg-muted/50 hover:bg-muted text-foreground",
                  "outline-none ring-0 ring-offset-0 shadow-none focus:outline-none focus:ring-0"
                )}
              >
                <span className="text-lg">{selectedCountry.flag}</span>
                <span className="text-sm font-medium">+{selectedCountry.code}</span>
                <ChevronDown className={cn("w-3.5 h-3.5", isGlass ? "text-white/60" : "text-muted-foreground")} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0 pointer-events-auto" align="start">
              <Command className="flex flex-col max-h-[400px]">
                <CommandInput placeholder="Search country or code..." className="h-12 border-none focus:outline-none focus-visible:outline-none focus:ring-0 focus:ring-offset-0 flex-shrink-0" />
                <CommandEmpty>No country found.</CommandEmpty>
                <CommandList className="overflow-y-auto overscroll-contain flex-1" onWheelCapture={(e) => e.stopPropagation()}>
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
                            selectedCountry.code === country.code ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="text-xl shrink-0">{country.flag}</span>
                        <span className="font-medium shrink-0 min-w-[45px]">+{country.code}</span>
                        <span className="text-muted-foreground truncate">{country.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Phone Input */}
          <input
            ref={inputRef}
            type="tel"
            value={value}
            onChange={handlePhoneChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={onKeyDown}
            className={cn(
              "flex-1 bg-transparent text-base font-medium px-3 rounded-r-[11px]",
              isGlass ? "text-white" : "text-foreground",
              "outline-none ring-0 ring-offset-0 shadow-none focus:outline-none focus:ring-0",
              isFloating ? "pt-5 pb-1" : "py-0"
            )}
            placeholder=""
          />
        </div>
      </div>

      {/* Error Message */}
      {(showError && errorMessage) && (
        <p className="mt-1.5 text-sm text-destructive px-1">{errorMessage}</p>
      )}
    </div>
  );
}

export function Login() {
  const navigate = useNavigate();
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<LoginStep>("phone");
  const [animationDirection, setAnimationDirection] = useState<"forward" | "backward">("forward");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("34"); // Default to Spain
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidPhone, setIsValidPhone] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [phoneError, setPhoneError] = useState(false);
  const [otpError, setOtpError] = useState(false);
  
  // Dev tool state
  const [modalStyle, setModalStyle] = useState<ModalStyleMode>("solid");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Splash animation state (hero mode only)
  const [splashPhase, setSplashPhase] = useState<"idle" | "playing" | "transitioning" | "complete">("playing");
  const [imagesReady, setImagesReady] = useState(false);
  const [lottieFinished, setLottieFinished] = useState(false);
  const lottieRef = useRef<any>(null);
  
  // Clear splash flag on page unload so refresh always plays animation
  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.removeItem("huspy-login-splash-shown");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);
  
  // Handle slideshow images ready
  const handleImagesReady = useCallback(() => {
    setImagesReady(true);
  }, []);
  
  // Handle Lottie animation complete
  const handleLottieComplete = useCallback(() => {
    setLottieFinished(true);
  }, []);
  
  // Transition only when BOTH lottie finished AND images are ready
  useEffect(() => {
    if (lottieFinished && imagesReady && splashPhase === "playing") {
      setSplashPhase("transitioning");
      setTimeout(() => {
        setSplashPhase("complete");
        sessionStorage.setItem("huspy-login-splash-shown", "true");
      }, 800);
    }
  }, [lottieFinished, imagesReady, splashPhase]);
  
  // Ensure Lottie shows last frame when in complete state
  useEffect(() => {
    if (splashPhase === "complete" && lottieRef.current && !isModalOpen) {
      lottieRef.current.goToAndStop(lottieRef.current.getDuration(true) - 1, true);
    }
  }, [splashPhase, isModalOpen]);
  
  // Dev tool: trigger splash animation
  const triggerSplashAnimation = useCallback(() => {
    sessionStorage.removeItem("huspy-login-splash-shown");
    setSplashPhase("playing");
    setLottieFinished(false);
    if (lottieRef.current) {
      lottieRef.current.goToAndPlay(0);
    }
  }, []);

  // Get selected country for display
  const selectedCountry = countries.find(c => c.code === countryCode) || countries.find(c => c.countryCode === "ES")!;

  // Auto-focus phone input when modal opens or step changes to phone
  useEffect(() => {
    if (isModalOpen && step === "phone") {
      const timer = setTimeout(() => {
        phoneInputRef.current?.focus();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isModalOpen, step]);

  // Auto-focus OTP input when step changes
  useEffect(() => {
    if (step === "otp") {
      const timer = setTimeout(() => {
        otpInputRef.current?.focus();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Auto-verify when OTP is complete
  useEffect(() => {
    if (otp.length === 6 && !isLoading) {
      setIsLoading(true);
      setTimeout(() => {
        if (otp === "000000") {
          navigate("/");
        } else {
          setOtpError(true);
          setIsLoading(false);
          setOtp("");
        }
      }, 1500);
    }
  }, [otp, navigate, isLoading]);

  // Resend timer
  useEffect(() => {
    if (step === "otp" && resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, resendTimer]);

  const handleSendOTP = useCallback(() => {
    if (isValidPhone) {
      setAnimationDirection("forward");
      setStep("otp");
      setPhoneError(false);
    }
  }, [isValidPhone]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && step === "phone" && isValidPhone) {
      handleSendOTP();
    }
  };

  const handleResendCode = () => {
    setResendTimer(60);
    setOtpError(false);
    setOtp("");
  };

  const handleOtpChange = (value: string) => {
    // Only allow numeric input
    const numericValue = value.replace(/\D/g, "");
    setOtpError(false);
    setOtp(numericValue);
  };

  // Handle CTA click to open modal
  const handleHeroLogin = useCallback(() => {
    setIsModalOpen(true);
    setStep("phone");
  }, []);

  // Handle modal close or back from phone step
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setStep("phone");
    setPhoneNumber("");
    setOtp("");
    setOtpError(false);
    setResendTimer(60);
  }, []);

  // Handle back button in modal
  const handleBack = useCallback(() => {
    if (step === "otp") {
      setAnimationDirection("backward");
      setStep("phone");
      setOtp("");
      setResendTimer(60);
    } else {
      handleModalClose();
    }
  }, [step, handleModalClose]);

  // Handle next/continue button in footer
  const handleNext = useCallback(() => {
    if (step === "phone" && isValidPhone) {
      handleSendOTP();
    } else if (step === "otp" && otp.length === 6 && !isLoading) {
      setIsLoading(true);
      setTimeout(() => {
        if (otp === "000000") {
          navigate("/");
        } else {
          setOtpError(true);
          setIsLoading(false);
          setOtp("");
        }
      }, 1500);
    }
  }, [step, isValidPhone, handleSendOTP, otp, isLoading, navigate]);

  // Slideshow should always be active (it runs behind the modal too)
  const isSlideshowActive = true;

  // Current step number for wizard (1 or 2)
  const currentStepNumber = step === "phone" ? 1 : 2;

  // Step titles and descriptions for wizard modal
  const stepTitles = ["What's your phone number?", "Verification code"];
  const stepDescriptions = [
    "A verification code will be sent to this number",
    `Enter the code sent via SMS and WhatsApp to +${selectedCountry.code} ${phoneNumber}.`
  ];

  // Can proceed to next step
  const canProceed = step === "phone" ? isValidPhone : otp.length === 6;

  // Next button label
  const nextLabel = isLoading ? "Verifying..." : "Continue";

  return (
    <div className="fixed inset-0 overflow-hidden touch-none">
      {/* Background slideshow */}
      <div className="absolute inset-0 z-0">
        <SlideShow slideDuration={6000} isActive={isSlideshowActive} onImagesReady={handleImagesReady} />
      </div>
      
      {/* Splash Animation & Logo */}
      {splashPhase !== "idle" && !isModalOpen && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          {/* Solid black background - fades out during transition */}
          <div 
            className={cn(
              "absolute inset-0 bg-foreground transition-opacity duration-700 ease-out",
              splashPhase === "playing" ? "opacity-100" : "opacity-0"
            )} 
          />
          
          {/* Lottie Logo Container */}
          <div 
            className="absolute inset-0 z-20 flex items-center justify-center transition-all duration-700 ease-out"
            style={{
              transform: splashPhase === "playing" 
                ? "translateY(0) scale(1)" 
                : "translateY(calc(-50vh + 72px)) scale(0.8)",
            }}
          >
            <div className="w-80 h-40">
              <Lottie
                lottieRef={lottieRef}
                animationData={logoAnimation}
                loop={false}
                autoplay={splashPhase === "playing"}
                onComplete={handleLottieComplete}
              />
            </div>
          </div>
        </div>
      )}

      {/* CTA on page (after splash completes) */}
      {splashPhase === "complete" && !isModalOpen && (
        <div className="fixed bottom-12 left-0 right-0 flex justify-center z-10 px-4 animate-fade-in pointer-events-auto">
          <Button 
            onClick={handleHeroLogin}
            className="w-full max-w-md h-14 text-base bg-white text-foreground hover:bg-white/90 focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0"
            size="lg"
            tabIndex={-1}
          >
            Log in
          </Button>
        </div>
      )}

      {/* WizardModal */}
      {(
        <WizardModal
          open={isModalOpen}
          onOpenChange={(open) => {
            if (!open) handleModalClose();
          }}
          currentStep={currentStepNumber}
          totalSteps={2}
          stepTitles={stepTitles}
          stepDescriptions={stepDescriptions}
          maxWidth={480}
          showProgressBar={false}
          onBack={handleBack}
          onNext={handleNext}
          canProceed={canProceed}
          isLoading={isLoading}
          loadingLabel="Verifying..."
          nextLabel={nextLabel}
          
          animationDirection={animationDirection}
          showBackOnFirstStep
          hideCloseButton
          disableInternalAnimation
          preventBackdropClose
          contentClassName={
            modalStyle === "glass" 
              ? "bg-white/5 backdrop-blur-xl backdrop-saturate-150" 
              : "bg-card"
          }
        >
          {/* Container for both steps - same pattern as ClientSelectorWithCreate */}
          <div className="relative overflow-hidden h-full">
            {/* Phone Step */}
            <div 
              className={cn(
                "transition-all duration-500 ease-out",
                step === "phone" 
                  ? "opacity-100 translate-x-0" 
                  : "opacity-0 -translate-x-full absolute inset-0 pointer-events-none"
              )}
            >
              <div className="py-2">
                <GlassPhoneInput
                  inputRef={phoneInputRef}
                  label="Phone number"
                  value={phoneNumber}
                  onChange={setPhoneNumber}
                  countryCode={countryCode}
                  onCountryCodeChange={setCountryCode}
                  error={phoneError}
                  errorMessage={phoneError ? "Please enter a valid phone number" : undefined}
                  onValidityChange={setIsValidPhone}
                  onKeyDown={handleKeyDown}
                  styleMode={modalStyle}
                />
              </div>
            </div>

            {/* OTP Step */}
            <div 
              className={cn(
                "transition-all duration-500 ease-out",
                step === "otp" 
                  ? "opacity-100 translate-x-0" 
                  : "opacity-0 translate-x-full absolute inset-0 pointer-events-none"
              )}
            >
              <div className="space-y-4 py-2">
                <div className="flex flex-col items-center gap-2">
                  <InputOTP 
                    maxLength={6} 
                    value={otp}
                    onChange={handleOtpChange}
                    disabled={isLoading}
                    ref={otpInputRef}
                    inputMode="numeric"
                    pattern="[0-9]*"
                  >
                    <InputOTPGroup className="gap-2">
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <InputOTPSlot 
                          key={index}
                          index={index} 
                          className={cn(
                            "w-12 h-14 text-xl border-2 rounded-xl ring-offset-0",
                            modalStyle === "glass" 
                              ? "bg-white/10 border-white/20 text-white ring-white/70" 
                              : "bg-muted/50 border-border text-foreground ring-primary",
                            otpError && "border-destructive bg-destructive/5"
                          )} 
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                  {otpError && (
                    <p className="text-sm text-destructive mt-2">
                      Incorrect code. Please try again
                    </p>
                  )}
                </div>
                
                <div className={cn(
                  "text-sm text-center",
                  modalStyle === "glass" ? "text-white/70" : "text-muted-foreground"
                )}>
                  {resendTimer > 0 ? (
                    <>Did not receive code? Resend in {resendTimer}s</>
                  ) : (
                    <>
                      Did not receive code?{" "}
                      <button 
                        onClick={handleResendCode}
                        className={cn(
                          "underline transition-colors",
                          modalStyle === "glass" 
                            ? "text-white hover:text-white/80" 
                            : "text-primary hover:text-primary/80"
                        )}
                      >
                        Resend
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </WizardModal>
      )}

      {/* Dev Tool */}
      <LoginDevTool 
        modalStyle={modalStyle}
        onModalStyleChange={setModalStyle}
        onTriggerSplash={triggerSplashAnimation}
      />
    </div>
  );
}
