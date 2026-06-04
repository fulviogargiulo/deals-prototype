import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { VerificationStatus, OpportunityStatus, OpportunityType } from "@/types";
import { getOpportunityBadgeClasses } from "@/components/opportunities/opportunity-icon";

interface StatusBadgeProps {
  variant: 'verification' | 'opportunity-status' | 'opportunity-type' | 'portal' | 'update-count' | 'tag';
  status?: VerificationStatus | OpportunityStatus | OpportunityType;
  children?: React.ReactNode;
  count?: number;
  className?: string;
}

export function StatusBadge({ variant, status, children, count, className }: StatusBadgeProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'verification':
        if (status === 'pending') {
          return "bg-tier-warning-bg text-tier-warning hover:bg-tier-warning-bg/80";
        }
        return "bg-tier-info-bg text-tier-info hover:bg-tier-info-bg/80";

      case 'opportunity-status':
        switch (status) {
          case 'new':
          case 'to-review':
            return "bg-tier-neutral-bg text-tier-neutral hover:bg-tier-neutral-bg/80";
          case 'qualified':
            return "bg-tier-info-bg text-tier-info hover:bg-tier-info-bg/80";
          case 'active':
            return "bg-tier-success-bg text-tier-success hover:bg-tier-success-bg/80";
          case 'under-offer':
            return "bg-tier-warning-bg text-tier-warning hover:bg-tier-warning-bg/80";
          case 'closed':
            return "bg-tier-success-bg text-tier-success hover:bg-tier-success-bg/80";
          default:
            return "bg-muted text-muted-foreground";
        }

      case 'opportunity-type':
        if (status) {
          return getOpportunityBadgeClasses(status as OpportunityType);
        }
        return "bg-muted text-muted-foreground";

      case 'portal':
        return "bg-portal-badge text-portal-badge-foreground hover:bg-portal-badge/80 font-semibold";

      case 'update-count':
        return "bg-tier-danger-bg text-tier-danger hover:bg-tier-danger-bg/80 font-semibold min-w-5 h-5 flex items-center justify-center rounded-full text-xs px-1.5";

      case 'tag':
        return "bg-muted text-muted-foreground hover:bg-muted/80";

      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (variant === 'update-count') {
    return (
      <span className={cn(getVariantClasses(), className)}>
        {count !== undefined ? count : children}
      </span>
    );
  }

  return (
    <Badge variant="secondary" className={cn(getVariantClasses(), className)}>
      {children}
    </Badge>
  );
}
