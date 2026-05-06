import { cn } from "@/lib/utils";

interface NewClientBadgeProps {
  className?: string;
  variant?: 'light' | 'dark';
  type?: 'new' | 'new-matches';
}

/**
 * NewClientBadge - A badge to indicate new clients or new matches
 * 
 * Design specs:
 * - Height: 32px, padding: 8px 10px, border-radius: max (pill)
 * - Dot: 8x8px, #F6445C (Red)
 * - Label: SemiBold, small size (12px), line-height 120%
 * - Light variant: #1A1A1A text (default)
 * - Dark variant: #FFFFFF text (for dark backgrounds)
 * 
 * Types:
 * - 'new': Background #F6445C26 (Red 15% opacity), label "New"
 * - 'new-matches': Background #CCCCCC, label "New matches"
 */
export function NewClientBadge({ className, variant = 'light', type = 'new' }: NewClientBadgeProps) {
  const backgroundColor = type === 'new-matches' ? '#F2F2F2' : 'rgba(246, 68, 92, 0.15)';
  const label = type === 'new-matches' ? 'New matches' : 'New';

  return (
    <div 
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full",
        className
      )}
      style={{ backgroundColor }}
    >
      {/* Dot */}
      <div 
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: '#F6445C' }}
      />
      {/* Label */}
      <span 
        className="text-xs font-semibold leading-[120%]"
        style={{ color: variant === 'dark' ? '#FFFFFF' : '#1A1A1A' }}
      >
        {label}
      </span>
    </div>
  );
}
