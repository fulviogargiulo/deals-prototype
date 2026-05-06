import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { PropertyPreviewContent, MatchPropertyData } from "./property-preview-content";

interface PropertyPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: MatchPropertyData | null;
}

export function PropertyPreviewModal({ 
  open, 
  onOpenChange,
  property
}: PropertyPreviewModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Track if we're in the process of closing (for animation)
  const [isClosing, setIsClosing] = useState(false);
  
  // Handle animation states with proper exit animation
  useEffect(() => {
    if (open) {
      setIsMounted(true);
      setIsClosing(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else if (isMounted && !isClosing) {
      // Start closing animation
      setIsClosing(true);
      setIsVisible(false);
    }
  }, [open, isMounted, isClosing]);
  
  // Delay unmount until exit animation completes
  useEffect(() => {
    if (isClosing && !isVisible) {
      const timer = setTimeout(() => {
        setIsMounted(false);
        setIsClosing(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isClosing, isVisible]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  if (!isMounted || !property) return null;

  const handleOpenFullPage = () => {
    window.open(`/properties/${property.id}`, '_blank');
  };

  return createPortal(
    <div 
      className={cn(
        "fixed inset-0 z-[100] flex transition-all duration-300",
        isVisible ? "opacity-100" : "opacity-0"
      )}
    >
      {/* Backdrop - consistent with design system (bg-black/50 backdrop-blur-sm) */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Slide-in Panel */}
      <div 
        className={cn(
          "absolute right-0 top-0 bottom-0 w-full max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl shadow-2xl transition-transform duration-300 ease-out flex flex-col overflow-hidden",
          isVisible ? "translate-x-0" : "translate-x-full"
        )}
      >
        <PropertyPreviewContent
          property={property}
          onClose={() => onOpenChange(false)}
          onOpenFullPage={handleOpenFullPage}
          variant="modal"
        />
      </div>
    </div>,
    document.body
  );
}

// Re-export the MatchPropertyData type for convenience
export type { MatchPropertyData };
