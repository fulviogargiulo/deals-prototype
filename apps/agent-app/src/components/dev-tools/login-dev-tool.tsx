import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Settings2, X, Play } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export type ModalStyleMode = "glass" | "solid";

interface LoginDevToolProps {
  modalStyle: ModalStyleMode;
  onModalStyleChange: (style: ModalStyleMode) => void;
  onTriggerSplash?: () => void;
}

export function LoginDevTool({ 
  modalStyle, 
  onModalStyleChange,
  onTriggerSplash 
}: LoginDevToolProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  return (
    <>
      {/* Floating trigger button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed bottom-4 right-4 z-[9999] h-10 w-10 rounded-full bg-black/20 backdrop-blur-md border border-white/20 hover:bg-black/30 text-white pointer-events-auto"
        onClick={() => setIsOpen(true)}
      >
        <Settings2 className="h-5 w-5" />
      </Button>

      {/* Dev tool panel */}
      {isOpen && (
        <div className="fixed bottom-16 right-4 z-[9999] w-72 rounded-xl border border-white/20 bg-black/30 backdrop-blur-xl shadow-xl p-4 space-y-4 pointer-events-auto">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-white">Login Dev Tools</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg hover:bg-white/10 text-white"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {/* Modal Style Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="modal-style" className="text-sm text-white/70">
                  Solid white modal
                </Label>
                <Switch
                  id="modal-style"
                  checked={modalStyle === "solid"}
                  onCheckedChange={(checked) => onModalStyleChange(checked ? "solid" : "glass")}
                />
              </div>
              <p className="text-xs text-white/60">
                {modalStyle === "solid" 
                  ? "White background with dark text" 
                  : "Glassmorphism with white text"}
              </p>
            </div>

            {/* Splash Animation Trigger */}
            {onTriggerSplash && (
              <div className="pt-2 border-t border-white/10">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-white/70 hover:text-white hover:bg-white/10"
                  onClick={() => {
                    onTriggerSplash();
                    setIsOpen(false);
                  }}
                >
                  <Play className="h-4 w-4" />
                  Play Splash Animation
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
