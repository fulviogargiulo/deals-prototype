import { useState, useEffect, useRef, useCallback } from "react";

// Import all slideshow images
import slide0 from "@/assets/slideshow/slide-0.jpg";
import slide1 from "@/assets/slideshow/slide-1.jpg";
import slide2 from "@/assets/slideshow/slide-2.jpg";
import slide3 from "@/assets/slideshow/slide-3.jpg";
import slide4 from "@/assets/slideshow/slide-4.jpg";
import slide5 from "@/assets/slideshow/slide-5.jpg";
import slide6 from "@/assets/slideshow/slide-6.jpg";
import slide7 from "@/assets/slideshow/slide-7.jpg";
import slide8 from "@/assets/slideshow/slide-8.jpg";
import slide9 from "@/assets/slideshow/slide-9.jpg";

const slides = [
  slide0,
  slide1,
  slide2,
  slide3,
  slide4,
  slide5,
  slide6,
  slide7,
  slide8,
  slide9,
];

const INITIAL_SCALE = 1.8;
const END_SCALE = 1.3; // Don't zoom all the way out
const ZOOM_DURATION = 15000; // Zoom animation is slower than slide duration
const FADE_DURATION = 1000; // ms
const INITIAL_FADE_DURATION = 800; // ms for initial image reveal

interface SlideShowProps {
  slideDuration?: number;
  isActive?: boolean;
  className?: string;
  onImagesReady?: () => void; // Called when initial images have loaded
}

export function SlideShow({
  slideDuration = 6000,
  isActive = true,
  className = "",
  onImagesReady,
}: SlideShowProps) {
  const [imageA, setImageA] = useState(slides[0]);
  const [imageB, setImageB] = useState(slides[1]);
  const [isAActive, setIsAActive] = useState(true);
  const [scaleA, setScaleA] = useState(INITIAL_SCALE);
  const [scaleB, setScaleB] = useState(INITIAL_SCALE);
  const [opacityA, setOpacityA] = useState(1);
  const [opacityB, setOpacityB] = useState(0);
  const [transitionA, setTransitionA] = useState(true);
  const [transitionB, setTransitionB] = useState(true);
  
  // Track if initial images have loaded
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [containerVisible, setContainerVisible] = useState(false);
  const loadedCountRef = useRef(0);
  const onImagesReadyCalledRef = useRef(false);
  
  const slideIndexRef = useRef(0);
  const isAActiveRef = useRef(true);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const isActiveRef = useRef(isActive);
  const isMountedRef = useRef(true);
  
  // Handle image load events
  const handleImageLoad = useCallback(() => {
    loadedCountRef.current += 1;
    // Wait for at least the first 2 images (A and B) to load
    if (loadedCountRef.current >= 2 && !imagesLoaded) {
      setImagesLoaded(true);
      // Trigger fade-in after a micro-delay
      requestAnimationFrame(() => {
        setContainerVisible(true);
        // Notify parent that images are ready
        if (onImagesReady && !onImagesReadyCalledRef.current) {
          onImagesReadyCalledRef.current = true;
          onImagesReady();
        }
      });
    }
  }, [imagesLoaded, onImagesReady]);

  // Clear all pending timeouts
  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(t => clearTimeout(t));
    timeoutsRef.current = [];
  }, []);

  // Add a timeout and track it
  const addTimeout = useCallback((callback: () => void, delay: number) => {
    const id = setTimeout(() => {
      // Remove this timeout from tracking
      timeoutsRef.current = timeoutsRef.current.filter(t => t !== id);
      callback();
    }, delay);
    timeoutsRef.current.push(id);
    return id;
  }, []);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    isMountedRef.current = true;
    
    const playCycle = () => {
      if (!isMountedRef.current || !isActiveRef.current) return;
      
      const fadeDelay = Math.max(slideDuration - FADE_DURATION, 0);

      // Re-enable transitions and start zoom after a frame gap
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!isMountedRef.current || !isActiveRef.current) return;

          if (isAActiveRef.current) {
            // Re-enable A's transition and start its zoom animation
            setTransitionA(true);
            setScaleA(END_SCALE);
            setOpacityA(1);
            setOpacityB(0);
            
            addTimeout(() => {
              if (!isMountedRef.current || !isActiveRef.current) return;
              
              // Re-enable B's transition, start B's zoom and begin crossfade
              setTransitionB(true);
              setScaleB(END_SCALE);
              setOpacityA(0);
              setOpacityB(1);
              
              addTimeout(() => {
                if (!isMountedRef.current) return;
                
                slideIndexRef.current = (slideIndexRef.current + 1) % slides.length;
                
                // Disable A's transition and reset instantly (it's now hidden)
                setTransitionA(false);
                setImageA(slides[(slideIndexRef.current + 1) % slides.length]);
                setScaleA(INITIAL_SCALE);
                
                isAActiveRef.current = false;
                setIsAActive(false);
                
                if (isActiveRef.current) {
                  playCycle();
                }
              }, FADE_DURATION);
            }, fadeDelay);
          } else {
            // Re-enable B's transition and start its zoom animation
            setTransitionB(true);
            setScaleB(END_SCALE);
            setOpacityB(1);
            setOpacityA(0);
            
            addTimeout(() => {
              if (!isMountedRef.current || !isActiveRef.current) return;
              
              // Re-enable A's transition, start A's zoom and begin crossfade
              setTransitionA(true);
              setScaleA(END_SCALE);
              setOpacityB(0);
              setOpacityA(1);
              
              addTimeout(() => {
                if (!isMountedRef.current) return;
                
                slideIndexRef.current = (slideIndexRef.current + 1) % slides.length;
                
                // Disable B's transition and reset instantly (it's now hidden)
                setTransitionB(false);
                setImageB(slides[(slideIndexRef.current + 1) % slides.length]);
                setScaleB(INITIAL_SCALE);
                
                isAActiveRef.current = true;
                setIsAActive(true);
                
                if (isActiveRef.current) {
                  playCycle();
                }
              }, FADE_DURATION);
            }, fadeDelay);
          }
        });
      });
    };

    if (isActive) {
      playCycle();
    }
    
    return () => {
      isMountedRef.current = false;
      clearAllTimeouts();
    };
  }, [isActive, slideDuration, addTimeout, clearAllTimeouts]);

  return (
    <div 
      className={`absolute inset-0 overflow-hidden transition-opacity ease-out ${className}`}
      style={{
        opacity: containerVisible ? 1 : 0,
        transitionDuration: `${INITIAL_FADE_DURATION}ms`,
      }}
    >
      {/* Layer A */}
      <div
        className="absolute inset-0 transition-opacity ease-linear"
        style={{
          opacity: opacityA,
          transitionDuration: `${FADE_DURATION}ms`,
        }}
      >
        <img
          src={imageA}
          alt=""
          className="absolute inset-0 w-full h-full object-cover ease-linear"
          style={{
            transform: `scale(${scaleA})`,
            transition: transitionA ? `transform ${ZOOM_DURATION}ms linear` : 'none',
          }}
          onLoad={handleImageLoad}
        />
      </div>

      {/* Layer B */}
      <div
        className="absolute inset-0 transition-opacity ease-linear"
        style={{
          opacity: opacityB,
          transitionDuration: `${FADE_DURATION}ms`,
        }}
      >
        <img
          src={imageB}
          alt=""
          className="absolute inset-0 w-full h-full object-cover ease-linear"
          style={{
            transform: `scale(${scaleB})`,
            transition: transitionB ? `transform ${ZOOM_DURATION}ms linear` : 'none',
          }}
          onLoad={handleImageLoad}
        />
      </div>
    </div>
  );
}
