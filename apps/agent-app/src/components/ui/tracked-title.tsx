import { ReactNode } from "react";
import { useRegisterPageTitle } from "@/contexts/page-title-context";
import { cn } from "@/lib/utils";

interface TrackedTitleProps {
  /** Text shown in global header when this content scrolls out of view */
  title: string;
  /** Optional: Custom ReactNode to render in global header (overrides title) */
  headerContent?: ReactNode;
  /** The content to wrap and track for visibility */
  children: ReactNode;
  /** Optional styling for the wrapper div */
  className?: string;
}

/**
 * TrackedTitle - A wrapper component for page titles that integrates with the global header.
 * 
 * When the wrapped content scrolls out of view, the title (or headerContent) will appear
 * in the global header (TopBar).
 * 
 * @example
 * // Simple usage with just title text
 * <TrackedTitle title="€700,000">
 *   <h1 className="text-3xl font-bold">€700,000</h1>
 * </TrackedTitle>
 * 
 * @example
 * // With custom header content
 * <TrackedTitle 
 *   title="Property Details"
 *   headerContent={
 *     <div className="flex items-center gap-2">
 *       <span className="font-bold">€700,000</span>
 *       <Badge>Exclusive</Badge>
 *     </div>
 *   }
 * >
 *   <div className="space-y-4">
 *     <h1>€700,000</h1>
 *     <Badge>Exclusive</Badge>
 *   </div>
 * </TrackedTitle>
 */
export function TrackedTitle({ 
  title, 
  headerContent, 
  children, 
  className 
}: TrackedTitleProps) {
  const setRef = useRegisterPageTitle(title, headerContent);
  
  return (
    <div ref={setRef} className={cn(className)}>
      {children}
    </div>
  );
}
