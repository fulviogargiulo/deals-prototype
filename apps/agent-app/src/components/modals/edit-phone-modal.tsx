import { useState, useRef, useEffect, useCallback } from "react";
import { WizardModal } from "@/components/ui/standard-modal";
import { FloatingLabelPhone } from "@/components/ui/floating-label-phone";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { countries } from "@/lib/countries";
import { cn } from "@/lib/utils";

type PhoneStep = "phone" | "otp";

interface EditPhoneModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPhoneUpdated: (phone: string) => void;
}

export function EditPhoneModal({ open, onOpenChange, onPhoneUpdated }: EditPhoneModalProps) {
  const [step, setStep] = useState<PhoneStep>("phone");
  const [animationDirection, setAnimationDirection] = useState<"forward" | "backward">("forward");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("34"); // Default to Spain
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidPhone, setIsValidPhone] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [phoneError, setPhoneError] = useState(false);
  const [otpError, setOtpError] = useState(false);
  
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Get selected country for display
  const selectedCountry = countries.find(c => c.code === countryCode) || countries.find(c => c.countryCode === "ES")!;

  // Auto-focus phone input when modal opens or step changes to phone
  useEffect(() => {
    if (open && step === "phone") {
      const timer = setTimeout(() => {
        phoneInputRef.current?.focus();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [open, step]);

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
        // Simulate verification - accept any 6-digit code
        const fullPhone = `+${selectedCountry.code} ${phoneNumber}`;
        onPhoneUpdated(fullPhone);
        toast({
          title: "Success",
          description: "Phone number updated successfully",
          className: "bg-green-50 border-green-200 text-green-900",
        });
        setIsLoading(false);
        handleClose();
      }, 1500);
    }
  }, [otp, isLoading]);

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
      setResendTimer(60);
      toast({
        title: "OTP Sent",
        description: `Verification code sent to +${selectedCountry.code} ${phoneNumber}`,
      });
    }
  }, [isValidPhone, selectedCountry.code, phoneNumber, toast]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && step === "phone" && isValidPhone) {
      handleSendOTP();
    }
  };

  const handleResendCode = () => {
    setResendTimer(60);
    setOtpError(false);
    setOtp("");
    toast({
      title: "OTP Sent",
      description: `Verification code sent to +${selectedCountry.code} ${phoneNumber}`,
    });
  };

  const handleOtpChange = (value: string) => {
    // Only allow numeric input
    const numericValue = value.replace(/\D/g, "");
    setOtpError(false);
    setOtp(numericValue);
  };

  const handleClose = useCallback(() => {
    setStep("phone");
    setPhoneNumber("");
    setOtp("");
    setPhoneError(false);
    setOtpError(false);
    setIsLoading(false);
    setResendTimer(60);
    setAnimationDirection("forward");
    onOpenChange(false);
  }, [onOpenChange]);

  // Handle back button in modal
  const handleBack = useCallback(() => {
    if (step === "otp") {
      setAnimationDirection("backward");
      setStep("phone");
      setOtp("");
      setResendTimer(60);
    } else {
      handleClose();
    }
  }, [step, handleClose]);

  // Handle next/continue button in footer
  const handleNext = useCallback(() => {
    if (step === "phone" && isValidPhone) {
      handleSendOTP();
    } else if (step === "otp" && otp.length === 6 && !isLoading) {
      setIsLoading(true);
      setTimeout(() => {
        const fullPhone = `+${selectedCountry.code} ${phoneNumber}`;
        onPhoneUpdated(fullPhone);
        toast({
          title: "Success",
          description: "Phone number updated successfully",
          className: "bg-green-50 border-green-200 text-green-900",
        });
        setIsLoading(false);
        handleClose();
      }, 1500);
    }
  }, [step, isValidPhone, handleSendOTP, otp, isLoading, selectedCountry.code, phoneNumber, onPhoneUpdated, toast, handleClose]);

  // Current step number for wizard (1 or 2)
  const currentStepNumber = step === "phone" ? 1 : 2;

  // Step titles and descriptions for wizard modal
  const stepTitles = ["Update phone number", "Verification code"];
  const stepDescriptions = [
    "A verification code will be sent to this number",
    `Enter the code sent via SMS and WhatsApp to +${selectedCountry.code} ${phoneNumber}`
  ];

  // Can proceed to next step
  const canProceed = step === "phone" ? isValidPhone : otp.length === 6;

  // Next button label
  const nextLabel = isLoading ? "Verifying..." : "Continue";

  return (
    <WizardModal
      open={open}
      onOpenChange={(openState) => {
        if (!openState) handleClose();
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
      showBackOnFirstStep={false}
      hideCloseButton={false}
      disableInternalAnimation
      preventBackdropClose={isLoading}
      contentClassName="bg-card"
    >
      {/* Container for both steps */}
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
          <div className="py-2" onKeyDown={handleKeyDown}>
            <FloatingLabelPhone
              ref={phoneInputRef}
              label="Phone number"
              value={phoneNumber}
              onChange={setPhoneNumber}
              countryCode={countryCode}
              onCountryCodeChange={setCountryCode}
              error={phoneError}
              errorMessage={phoneError ? "Please enter a valid phone number" : undefined}
              onValidityChange={setIsValidPhone}
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
                        "bg-muted/50 border-border text-foreground ring-primary",
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
            
            <div className="text-sm text-center text-muted-foreground">
              {resendTimer > 0 ? (
                <>Did not receive code? Resend in {resendTimer}s</>
              ) : (
                <>
                  Did not receive code?{" "}
                  <button 
                    onClick={handleResendCode}
                    className="text-primary underline hover:text-primary/80 transition-colors"
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
  );
}
