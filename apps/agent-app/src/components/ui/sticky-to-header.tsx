import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StickyToHeaderProps {
  /** The content to make sticky */
  children: ReactNode;
  /** Optional additional offset from the header (in pixels) */
  offset?: number;
  /** Optional styling for the wrapper div */
  className?: string;
}

/**
 * StickyToHeader - A wrapper component that makes its children sticky to the global header.
 * 
 * The component sticks content below the fixed header (64px height by default).
 * You can provide an additional offset if needed.
 * 
 * @example
 * // Basic usage - content sticks right below the header
 * <StickyToHeader>
 *   <Card>I'm sticky!</Card>
 * </StickyToHeader>
 * 
 * @example
 * // With additional offset
 * <StickyToHeader offset={16}>
 *   <Card>I'm sticky with 16px extra space from header!</Card>
 * </StickyToHeader>
 * 
 * @example
 * // With custom styling
 * <StickyToHeader className="space-y-4">
 *   <Card>First sticky card</Card>
 *   <Card>Second sticky card</Card>
 * </StickyToHeader>
 */
export function StickyToHeader({ 
  children, 
  offset = 24,
  className 
}: StickyToHeaderProps) {
  // Header height is 64px (h-16), add the offset
  const topValue = 64 + offset;
  
  console.log('[StickyToHeader] Rendering with top:', topValue);
  
  return (
    <div 
      className={cn("sticky z-10", className)}
      style={{ top: `${topValue}px` }}
    >
      {children}
    </div>
  );
}
