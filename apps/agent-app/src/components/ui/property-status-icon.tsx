import { cn } from "@/lib/utils";
import { PropertyStatus } from "@/types";
import { Pencil, Clock, CheckCheck, XCircle, Archive } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PropertyStatusIconProps {
  status: PropertyStatus;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  ringClassName?: string; // Custom ring/border color class (e.g., "border-[#1A1A1A] ring-[#1A1A1A]")
}

const getStatusConfig = (status: PropertyStatus) => {
  switch (status) {
    case 'published':
      return {
        Icon: CheckCheck,
        bgColor: 'bg-ds-green',
        label: 'Published',
      };
    case 'in-review':
      return {
        Icon: Clock,
        bgColor: 'bg-fg-secondary',
        label: 'In Review',
      };
    case 'draft':
      return {
        Icon: Pencil,
        bgColor: 'bg-ds-orange',
        label: 'Draft',
      };
    case 'rejected':
      return {
        Icon: XCircle,
        bgColor: 'bg-ds-red',
        label: 'Rejected',
      };
    case 'delisted':
      return {
        Icon: Archive,
        bgColor: 'bg-fg-secondary',
        label: 'Delisted',
      };
  }
};

const sizeClasses = {
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
};

const iconSizeClasses = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export function PropertyStatusIcon({ status, className, size = 'md', ringClassName }: PropertyStatusIconProps) {
  const config = getStatusConfig(status);
  const Icon = config.Icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "rounded-full flex items-center justify-center cursor-default",
              config.bgColor,
              sizeClasses[size],
              className
            )}
          >
            <Icon className={cn("text-white", iconSizeClasses[size])} strokeWidth={2.5} />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// CSS mask value to create a circular cutout for the status icon
// Use this on the image container's style prop
export const getStatusIconCutoutMask = (size: 'sm' | 'md' | 'lg' = 'md') => {
  // Icon sizes (matching sizeClasses): sm=20px, md=32px, lg=40px
  // Add gap of 4px around the icon for the visible cutout
  const cutoutRadii = {
    sm: 14, // 20px icon / 2 + 4px gap
    md: 20, // 32px icon / 2 + 4px gap  
    lg: 26, // 40px icon / 2 + 6px gap
  };
  const radius = cutoutRadii[size];
  
  // Icon center positions (icon is half-overlapping the corner)
  // For sm: icon is 20px, positioned at -2px from edge, so center is at 100% - 10px + 2px = 100% - 8px
  const centerOffsets = {
    sm: 8,   // 20px/2 - 2px offset = 8px from 100%
    md: 14,  // 32px/2 - 2px offset = 14px from 100%
    lg: 18,  // 40px/2 - 2px offset = 18px from 100%
  };
  const offset = centerOffsets[size];
  
  const maskValue = `radial-gradient(circle at calc(100% - ${offset}px) calc(100% - ${offset}px), transparent ${radius}px, black ${radius + 0.5}px)`;
  
  return {
    maskImage: maskValue,
    WebkitMaskImage: maskValue,
  };
};
