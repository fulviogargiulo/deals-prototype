import { useRef, useState, useEffect, ReactNode } from "react";

interface AnimatedHeightContainerProps {
  children: ReactNode;
  className?: string;
  /** Duration in ms */
  duration?: number;
}

/**
 * A container that smoothly animates height changes when its content changes.
 * Uses CSS transitions instead of framer-motion to avoid spring animations.
 */
export function AnimatedHeightContainer({ 
  children, 
  className = "",
  duration = 250 
}: AnimatedHeightContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | "auto">("auto");

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newHeight = entry.contentRect.height;
        setHeight(newHeight);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div 
      className={className}
      style={{ 
        height: height === "auto" ? "auto" : `${height}px`,
        transition: `height ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        overflow: "hidden"
      }}
    >
      <div ref={containerRef}>
        {children}
      </div>
    </div>
  );
}
