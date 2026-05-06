import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { motion, AnimatePresence, type Transition } from "framer-motion";

interface AnimatedListItemProps {
  children: ReactNode;
  className?: string;
  /** Unique key for the item - required for AnimatePresence */
  itemKey: string;
  /** Duration in ms for animations */
  duration?: number;
}

// Smooth, flowing easing as tuple for framer-motion
const EASE_FLUID: [number, number, number, number] = [0.4, 0, 0.2, 1];

const createTransition = (duration: number): Transition => ({
  duration,
  ease: EASE_FLUID,
});

/**
 * AnimatedListItem - Wraps list items with smooth layout animations using framer-motion.
 * Provides fluid enter/exit animations and automatic position transitions.
 */
export function AnimatedListItem({
  children,
  className,
  itemKey,
  duration = 0.4,
}: AnimatedListItemProps) {
  return (
    <motion.div
      layout
      layoutId={itemKey}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{
        opacity: createTransition(duration * 0.5),
        scale: createTransition(duration * 0.5),
        layout: {
          duration: duration * 0.9,
          ease: [0.25, 0.1, 0.25, 1],
        }
      }}
      className={cn("origin-center", className)}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedListProps {
  children: ReactNode;
  className?: string;
}

/**
 * AnimatedList - Container for AnimatedListItem components.
 * Wraps children in AnimatePresence for exit animations.
 */
export function AnimatedList({ children, className }: AnimatedListProps) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.div 
        layout
        className={cn("flex flex-wrap", className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
