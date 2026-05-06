import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface AnimatedContainerProps {
  children: ReactNode;
  className?: string;
  animation?: "fade-in" | "scale-in" | "slide-in-right" | "slide-in-left" | "fade-in-only";
  delay?: "none" | "short" | "medium" | "long";
  stagger?: boolean;
  staggerIndex?: number;
}

const delayClasses = {
  none: "",
  short: "animation-delay-75",
  medium: "animation-delay-150",
  long: "animation-delay-300",
};

export function AnimatedContainer({
  children,
  className,
  animation = "fade-in",
  delay = "none",
  stagger = false,
  staggerIndex = 0,
}: AnimatedContainerProps) {
  const staggerDelay = stagger ? { animationDelay: `${staggerIndex * 50}ms` } : undefined;

  return (
    <div
      className={cn(
        `animate-${animation}`,
        "animate-fill-forwards",
        delayClasses[delay],
        className
      )}
      style={staggerDelay}
    >
      {children}
    </div>
  );
}

interface AnimatedListProps {
  children: ReactNode[];
  className?: string;
  itemClassName?: string;
  animation?: "fade-in" | "scale-in" | "fade-in-only";
  staggerDelay?: number;
}

export function AnimatedList({
  children,
  className,
  itemClassName,
  animation = "fade-in",
  staggerDelay = 50,
}: AnimatedListProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          className={cn(`animate-${animation}`, "animate-fill-forwards opacity-0", itemClassName)}
          style={{ animationDelay: `${index * staggerDelay}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
