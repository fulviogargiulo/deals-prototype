import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FullscreenGalleryProps {
  images: string[];
  initialIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alt?: string;
}

function GalleryThumbnail({ 
  src, 
  index, 
  isSelected, 
  onClick 
}: { 
  src: string; 
  index: number; 
  isSelected: boolean; 
  onClick: () => void;
}) {
  const [loaded, setLoaded] = React.useState(false);
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative min-w-0 flex-[0_0_80px] overflow-hidden rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-white/40",
        isSelected
          ? "ring-2 ring-white"
          : "opacity-50 hover:opacity-75"
      )}
      aria-label={`Go to image ${index + 1}`}
    >
      <div className="aspect-square bg-white/10">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-4 w-4 animate-pulse rounded-full bg-white/20" />
          </div>
        )}
        <img
          src={src}
          alt={`Thumbnail ${index + 1}`}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-200",
            loaded ? "opacity-100" : "opacity-0"
          )}
          draggable={false}
          onLoad={() => setLoaded(true)}
        />
      </div>
    </button>
  );
}

export function FullscreenGallery({
  images,
  initialIndex = 0,
  open,
  onOpenChange,
  alt = "Property image",
}: FullscreenGalleryProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ startIndex: initialIndex });
  const [thumbsRef, thumbsApi] = useEmblaCarousel({
    containScroll: "keepSnaps",
    dragFree: true,
    skipSnaps: true,
  });
  const [selectedIndex, setSelectedIndex] = React.useState(initialIndex);
  const [loadedImages, setLoadedImages] = React.useState<Set<number>>(new Set());
  const [canScrollThumbsPrev, setCanScrollThumbsPrev] = React.useState(false);
  const [canScrollThumbsNext, setCanScrollThumbsNext] = React.useState(false);
  const thumbsContainerRef = React.useRef<HTMLDivElement>(null);

  const handleImageLoad = (index: number) => {
    setLoadedImages(prev => new Set(prev).add(index));
  };

  // Sync carousel position when opening with different initial index
  React.useEffect(() => {
    if (open && emblaApi) {
      emblaApi.scrollTo(initialIndex, true);
      setSelectedIndex(initialIndex);
    }
  }, [open, initialIndex, emblaApi]);

  // Update selected index on scroll
  React.useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      const index = emblaApi.selectedScrollSnap();
      setSelectedIndex(index);
      thumbsApi?.scrollTo(index);
    };

    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, thumbsApi]);

  // Update thumbnail scroll buttons state
  React.useEffect(() => {
    if (!thumbsApi) return;

    const updateScrollButtons = () => {
      setCanScrollThumbsPrev(thumbsApi.canScrollPrev());
      setCanScrollThumbsNext(thumbsApi.canScrollNext());
    };

    updateScrollButtons();
    thumbsApi.on("scroll", updateScrollButtons);
    thumbsApi.on("reInit", updateScrollButtons);
    
    return () => {
      thumbsApi.off("scroll", updateScrollButtons);
      thumbsApi.off("reInit", updateScrollButtons);
    };
  }, [thumbsApi]);

  // Mouse wheel horizontal scroll for thumbnails - fluid scrolling
  React.useEffect(() => {
    const container = thumbsContainerRef.current;
    if (!container || !thumbsApi) return;

    let accumulatedDelta = 0;
    const threshold = 30; // Pixels needed to trigger a scroll

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY !== 0 ? e.deltaY : e.deltaX;
      accumulatedDelta += delta;

      // Only scroll when we've accumulated enough delta
      if (Math.abs(accumulatedDelta) >= threshold) {
        const direction = accumulatedDelta > 0 ? 1 : -1;
        const currentIndex = thumbsApi.selectedScrollSnap();
        const newIndex = Math.max(0, Math.min(images.length - 1, currentIndex + direction));
        thumbsApi.scrollTo(newIndex, false);
        accumulatedDelta = 0;
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [thumbsApi, images.length]);

  // Keyboard navigation
  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        emblaApi?.scrollPrev();
      } else if (e.key === "ArrowRight") {
        emblaApi?.scrollNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, emblaApi]);

  const canScrollPrev = selectedIndex > 0;
  const canScrollNext = selectedIndex < images.length - 1;

  // Handle click on background to close
  const handleBackgroundClick = (e: React.MouseEvent) => {
    // Only close if clicking directly on the background div
    if (e.target === e.currentTarget) {
      onOpenChange(false);
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex flex-col outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          onEscapeKeyDown={() => onOpenChange(false)}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          {/* Clickable background layer */}
          <div 
            className="absolute inset-0 z-0" 
            onClick={() => onOpenChange(false)}
          />

          {/* Header */}
          <div className="relative z-10 flex items-center justify-end px-4 py-3">
            <DialogPrimitive.Close className="rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20">
              <X className="h-6 w-6" />
              <span className="sr-only">Close gallery</span>
            </DialogPrimitive.Close>
          </div>

          {/* Main carousel */}
          <div 
            className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-16"
            onClick={handleBackgroundClick}
          >
            {/* Previous button */}
            {canScrollPrev && (
              <button
                onClick={() => emblaApi?.scrollPrev()}
                className="absolute left-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/20"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {/* Images */}
            <div 
              className="h-full w-full max-w-6xl overflow-hidden" 
              ref={emblaRef}
              onClick={handleBackgroundClick}
            >
              <div className="flex h-full">
                {images.map((src, index) => (
                  <div
                    key={index}
                    className="flex min-w-0 flex-[0_0_100%] items-center justify-center px-4"
                    onClick={handleBackgroundClick}
                  >
                    {/* Loading spinner */}
                    {!loadedImages.has(index) && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
                      </div>
                    )}
                    <img
                      src={src}
                      alt={`${alt} ${index + 1}`}
                      className={cn(
                        "max-h-full max-w-full rounded-lg object-contain transition-opacity duration-300",
                        loadedImages.has(index) ? "opacity-100" : "opacity-0"
                      )}
                      draggable={false}
                      onLoad={() => handleImageLoad(index)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Next button */}
            {canScrollNext && (
              <button
                onClick={() => emblaApi?.scrollNext()}
                className="absolute right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/20"
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Counter above thumbnails */}
          <div className="relative z-10 text-center pb-2">
            <span className="text-sm font-medium text-white/70">
              {selectedIndex + 1} / {images.length}
            </span>
          </div>

          {/* Thumbnail strip with navigation */}
          <div className="relative z-10 px-4 pb-6">
            <div className="mx-auto max-w-3xl flex items-center gap-3">
              {/* Prev thumbnails button */}
              <button
                onClick={() => thumbsApi?.scrollPrev()}
                disabled={!canScrollThumbsPrev}
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all focus:outline-none",
                  canScrollThumbsPrev 
                    ? "bg-white/10 text-white hover:bg-white/20" 
                    : "text-white/20 cursor-not-allowed"
                )}
                aria-label="Scroll thumbnails left"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Thumbnails - scrollable with mouse */}
              <div 
                ref={thumbsContainerRef}
                className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing py-2"
              >
                <div ref={thumbsRef} className="px-1">
                  <div className="flex gap-2 py-1 justify-center">
                    {images.map((src, index) => (
                      <GalleryThumbnail
                        key={index}
                        src={src}
                        index={index}
                        isSelected={selectedIndex === index}
                        onClick={() => emblaApi?.scrollTo(index)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Next thumbnails button */}
              <button
                onClick={() => thumbsApi?.scrollNext()}
                disabled={!canScrollThumbsNext}
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all focus:outline-none",
                  canScrollThumbsNext 
                    ? "bg-white/10 text-white hover:bg-white/20" 
                    : "text-white/20 cursor-not-allowed"
                )}
                aria-label="Scroll thumbnails right"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
