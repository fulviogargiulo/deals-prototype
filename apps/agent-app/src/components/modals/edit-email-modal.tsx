import { useState, useEffect, useRef } from "react";
import { StandardModal, StandardModalFooter } from "@/components/ui/standard-modal";
import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";

interface EditEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmailUpdated: (email: string) => void;
}

export function EditEmailModal({ open, onOpenChange, onEmailUpdated }: EditEmailModalProps) {
  const [step, setStep] = useState<"input" | "verify">("input");
  const [newEmail, setNewEmail] = useState("");
  const [isValidEmail, setIsValidEmail] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const otpInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewEmail(value);
    setEmailError(false);
    
    if (value === '') {
      setIsValidEmail(false);
      return;
    }

    const isValid = validateEmail(value);
    setIsValidEmail(isValid);
    
    if (!isValid && value.length > 0) {
      setTimeout(() => {
        if (!validateEmail(value)) {
          setEmailError(true);
        }
      }, 1000);
    }
  };

  const handleSendOTP = () => {
    if (!isValidEmail) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    
    setStep("verify");
    setResendTimer(60);
    toast({
      title: "OTP Sent",
      description: `Verification code sent to ${newEmail}`,
    });
  };

  const handleResendOTP = () => {
    setResendTimer(60);
    setOtp("");
    toast({
      title: "OTP Sent",
      description: `Verification code sent to ${newEmail}`,
    });
  };

  const handleVerifyOTP = () => {
    if (otp.length !== 6) {
      return;
    }
    
    setIsVerifying(true);
    // Simulate API call
    setTimeout(() => {
      onEmailUpdated(newEmail);
      toast({
        title: "Success",
        description: "Email address updated successfully",
        className: "bg-green-50 border-green-200 text-green-900",
      });
      setIsVerifying(false);
      handleClose();
    }, 2000);
  };

  const handleClose = () => {
    setStep("input");
    setNewEmail("");
    setOtp("");
    setIsValidEmail(false);
    setEmailError(false);
    setIsVerifying(false);
    setResendTimer(60);
    onOpenChange(false);
  };

  // Auto-focus OTP input when step changes
  useEffect(() => {
    if (step === "verify" && otpInputRef.current) {
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 100);
    }
  }, [step]);

  // Auto-verify when OTP is complete
  useEffect(() => {
    if (otp.length === 6 && !isVerifying) {
      handleVerifyOTP();
    }
  }, [otp, isVerifying]);

  // Resend timer
  useEffect(() => {
    if (step === "verify" && resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, resendTimer]);

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (step === "input" && isValidEmail) {
          handleSendOTP();
        } else if (step === "verify" && otp.length === 6 && !isVerifying) {
          handleVerifyOTP();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, step, isValidEmail, otp, isVerifying]);

  return (
    <StandardModal
      open={open}
      onOpenChange={handleClose}
      title={step === "input" ? "Update email address" : "Verify email address"}
      description={step === "input" 
        ? "Verification code will be sent to this email"
        : `Enter the 6-digit code sent to ${newEmail}`
      }
      size="md"
      preventClose={isVerifying}
    >
      <div className="pb-4">
        {step === "input" ? (
          <div className="space-y-4">
            <FloatingLabelInput
              label="Email address"
              type="email"
              value={newEmail}
              onChange={handleEmailChange}
              error={emailError}
              errorMessage={emailError ? "Please enter a valid email address" : undefined}
            />
            <Button 
              onClick={handleSendOTP} 
              className="w-full h-12" 
              disabled={!isValidEmail}
            >
              Continue
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-center">
              <InputOTP 
                maxLength={6} 
                value={otp} 
                onChange={setOtp}
                ref={otpInputRef}
                autoComplete="one-time-code"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            
            <div className="text-sm text-muted-foreground text-center">
              {resendTimer > 0 ? (
                <>Did not receive code? Resend in {resendTimer}s</>
              ) : (
                <>
                  Did not receive code?{" "}
                  <button 
                    onClick={handleResendOTP}
                    className="text-primary underline hover:text-primary/80 transition-colors"
                  >
                    Resend
                  </button>
                </>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep("input")}
                className="flex-1 h-12"
              >
                Back
              </Button>
              <Button 
                onClick={handleVerifyOTP} 
                className="flex-1 h-12" 
                disabled={otp.length !== 6 || isVerifying}
              >
                {isVerifying ? "Verifying..." : "Verify"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </StandardModal>
  );
}
