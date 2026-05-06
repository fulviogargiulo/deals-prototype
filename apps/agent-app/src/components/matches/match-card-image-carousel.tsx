import { useState, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MatchCardImageCarouselProps {
  images: string[];
  alt: string;
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onImageClick?: () => void;
  className?: string;
}

export function MatchCardImageCarousel({
  images,
  alt,
  currentIndex,
  onIndexChange,
  onImageClick,
  className,
}: MatchCardImageCarouselProps) {
  const [isLoaded, setIsLoaded] = useState<Record<number, boolean>>({});
  const [isHovered, setIsHovered] = useState(false);
  
  const totalImages = images.length;
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < totalImages - 1;
  
  // Only load images near the current index (current, prev, next)
  const imagesToRender = useMemo(() => {
    const indices = new Set<number>();
    indices.add(currentIndex);
    if (currentIndex > 0) indices.add(currentIndex - 1);
    if (currentIndex < totalImages - 1) indices.add(currentIndex + 1);
    return indices;
  }, [currentIndex, totalImages]);
  
  const handlePrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (canGoPrev) {
      onIndexChange(currentIndex - 1);
    }
  }, [canGoPrev, currentIndex, onIndexChange]);
  
  const handleNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (canGoNext) {
      onIndexChange(currentIndex + 1);
    }
  }, [canGoNext, currentIndex, onIndexChange]);
  
  const handleImageClick = useCallback(() => {
    if (onImageClick) {
      onImageClick();
    }
  }, [onImageClick]);

  return (
    <div 
      className={cn("relative w-full h-full", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleImageClick}
    >
      {/* Only render images near the current index */}
      {images.map((src, index) => {
        // Skip images that are not near the current index
        if (!imagesToRender.has(index)) {
          return null;
        }
        
        return (
          <img
            key={index}
            src={src}
            alt={`${alt} - ${index + 1}`}
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
              index === currentIndex ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setIsLoaded(prev => ({ ...prev, [index]: true }))}
            loading="lazy"
            decoding="async"
          />
        );
      })}
      
      {/* Loading skeleton for current image */}
      {!isLoaded[currentIndex] && (
        <div className="absolute inset-0 bg-zinc-700 animate-pulse" />
      )}
      
      {/* Navigation arrows - visible on hover, disabled at extremes */}
      {totalImages > 1 && isHovered && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className={cn(
              "absolute left-2 top-1/2 -translate-y-1/2 z-30",
              "h-6 w-6 rounded-full flex items-center justify-center",
              "bg-[#FFFFFF66] text-white select-none",
              canGoPrev
                ? "hover:bg-[#FFFFFF80] cursor-pointer"
                : "opacity-40 cursor-not-allowed"
            )}
            aria-label="Previous image"
          >
            <ChevronLeft className="w-3.5 h-3.5 pointer-events-none" />
          </button>
          
          <button
            type="button"
            onClick={handleNext}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 z-30",
              "h-6 w-6 rounded-full flex items-center justify-center",
              "bg-[#FFFFFF66] text-white select-none",
              canGoNext
                ? "hover:bg-[#FFFFFF80] cursor-pointer"
                : "opacity-40 cursor-not-allowed"
            )}
            aria-label="Next image"
          >
            <ChevronRight className="w-3.5 h-3.5 pointer-events-none" />
          </button>
          
          {/* Dots indicator - frosted glass style */}
          <div 
            className={cn(
              "absolute bottom-3 left-1/2 -translate-x-1/2 z-30",
              "flex items-center gap-1.5 px-2 py-1.5 rounded-full",
              "bg-white/20 backdrop-blur-sm",
              "transition-opacity duration-200",
              isHovered ? "opacity-100" : "opacity-70"
            )}
          >
            {images.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all duration-200",
                  index === currentIndex 
                    ? "bg-white w-2" 
                    : "bg-white/40"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
