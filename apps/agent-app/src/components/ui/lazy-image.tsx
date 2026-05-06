import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  onLoad?: () => void;
  onError?: () => void;
  // If true, load immediately without waiting for intersection
  eager?: boolean;
  // Root margin for intersection observer (how early to start loading)
  rootMargin?: string;
}

export function LazyImage({
  src,
  alt,
  className,
  placeholderClassName,
  onLoad,
  onError,
  eager = false,
  rootMargin = "200px",
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(eager);
  const imgRef = useRef<HTMLDivElement>(null);

  // Reset state when src changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
    if (eager) {
      setShouldLoad(true);
    }
  }, [src, eager]);

  // Intersection observer for lazy loading
  useEffect(() => {
    if (eager || shouldLoad) return;

    const element = imgRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin,
        threshold: 0,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [eager, shouldLoad, rootMargin]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  return (
    <div ref={imgRef} className={cn("relative", className)}>
      {/* Loading skeleton - show until image loads */}
      {!isLoaded && !hasError && (
        <div
          className={cn(
            "absolute inset-0 bg-zinc-700 animate-pulse",
            placeholderClassName
          )}
        />
      )}
      
      {/* Only render img tag when should load */}
      {shouldLoad && (
        <img
          src={src}
          alt={alt}
          className={cn(
            className,
            "transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
}
