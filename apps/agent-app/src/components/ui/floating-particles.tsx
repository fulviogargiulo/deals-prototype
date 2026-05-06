import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  dx: number;
  dy: number;
  opacity: number;
}

interface FloatingParticlesProps {
  className?: string;
  particleCount?: number;
  tooltipText?: string;
}

/**
 * FloatingParticles — dense cloud of tiny animated dots that mask hidden content.
 * Shows a tooltip on hover as an easter egg.
 */
export function FloatingParticles({
  className,
  particleCount = 80,
  tooltipText = "Accept the client inquiry to reveal contact details",
}: FloatingParticlesProps) {
  const particles = useMemo<Particle[]>(() => {
    const cols = Math.ceil(Math.sqrt(particleCount * 3));
    const rows = Math.ceil(particleCount / cols);
    return Array.from({ length: particleCount }, (_, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cellW = 100 / cols;
      const cellH = 100 / rows;
      return {
        id: i,
        // Start roughly grid-distributed but with generous jitter
        x: cellW * col + cellW * 0.1 + Math.random() * cellW * 0.8,
        y: cellH * row + cellH * 0.1 + Math.random() * cellH * 0.8,
        size: 2.5,
        duration: 1.5 + Math.random() * 2.5,
        delay: Math.random() * 2,
        dx: -8 + Math.random() * 16,
        dy: -5 + Math.random() * 10,
        opacity: i % 2 === 0 ? 0.6 : 0.25,
      };
    });
  }, [particleCount]);

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "relative overflow-hidden cursor-default select-none p-1",
              className
            )}
          >
            {particles.map((p) => (
              <span
                key={p.id}
                className="absolute rounded-full"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: p.size,
                  height: p.size,
                  backgroundColor: "hsl(var(--muted-foreground))",
                  opacity: p.opacity,
                  animation: `floatParticle ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
                  ["--float-dx" as any]: `${p.dx}px`,
                  ["--float-dy" as any]: `${p.dy}px`,
                }}
              />
            ))}
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="text-xs max-w-[200px] text-center"
        >
          {tooltipText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
