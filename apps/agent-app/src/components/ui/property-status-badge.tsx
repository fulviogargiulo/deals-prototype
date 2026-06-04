import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PropertyStatus } from "@/types";
import { Pencil, Clock, CheckCheck, XCircle, Archive } from "lucide-react";

interface PropertyStatusBadgeProps {
  status: PropertyStatus;
  className?: string;
  showIcon?: boolean;
  variant?: 'card' | 'default';
}

const getPropertyStatusConfig = (status: PropertyStatus, variant: 'card' | 'default' = 'default') => {
  const isCard = variant === 'card';
  
  switch (status) {
    case 'published':
      return {
        label: 'Published',
        className: isCard 
          ? 'bg-tier-success/40 hover:bg-tier-success text-white border-0 transition-colors'
          : 'bg-tier-success/40 hover:bg-tier-success text-foreground hover:text-white border-0 transition-colors',
        iconClassName: 'text-tier-success',
        Icon: CheckCheck,
      };
    case 'in-review':
      return {
        label: 'In review',
        className: isCard
          ? 'bg-white/20 hover:bg-white hover:text-foreground text-white border-0 transition-colors'
          : 'bg-foreground/5 hover:bg-foreground/10 text-foreground border-0 transition-colors',
        iconClassName: isCard ? 'text-white' : 'text-muted-foreground',
        Icon: Clock,
      };
    case 'draft':
      return {
        label: 'Draft',
        className: isCard
          ? 'bg-tier-warning/20 hover:bg-tier-warning text-white border-0 transition-colors'
          : 'bg-tier-warning/20 hover:bg-tier-warning text-foreground hover:text-white border-0 transition-colors',
        iconClassName: 'text-tier-warning',
        Icon: Pencil,
      };
    case 'rejected':
      return {
        label: 'Rejected',
        className: isCard
          ? 'bg-tier-danger/20 hover:bg-tier-danger text-white border-0 transition-colors'
          : 'bg-tier-danger/20 hover:bg-tier-danger text-foreground hover:text-white border-0 transition-colors',
        iconClassName: 'text-tier-danger',
        Icon: XCircle,
      };
    case 'delisted':
      return {
        label: 'Delisted',
        className: isCard
          ? 'bg-white/20 hover:bg-white hover:text-foreground text-white border-0 transition-colors'
          : 'bg-foreground/5 hover:bg-foreground/10 text-foreground border-0 transition-colors',
        iconClassName: isCard ? 'text-white' : 'text-muted-foreground',
        Icon: Archive,
      };
  }
};

export function PropertyStatusBadge({ status, className, showIcon = true, variant = 'default' }: PropertyStatusBadgeProps) {
  const config = getPropertyStatusConfig(status, variant);
  const Icon = config.Icon;

  return (
    <Badge className={cn("group/badge font-semibold text-xs px-3 py-1.5 gap-1.5", config.className, className)}>
      {showIcon && <Icon className={cn("w-4 h-4 group-hover/badge:text-white transition-colors", config.iconClassName)} strokeWidth={2.5} />}
      {config.label}
    </Badge>
  );
}

export { getPropertyStatusConfig };
