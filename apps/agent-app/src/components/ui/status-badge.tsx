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
          return "bg-pending text-pending-foreground hover:bg-pending/80";
        }
        return "bg-verified text-verified-foreground hover:bg-verified/80";
      
      case 'opportunity-status':
        switch (status) {
          case 'new':
          case 'to-review':
            return "bg-status-new text-status-new-foreground hover:bg-status-new/80";
          case 'qualified':
            return "bg-status-qualified text-status-qualified-foreground hover:bg-status-qualified/80";
          case 'active':
            return "bg-status-active text-status-active-foreground hover:bg-status-active/80";
          case 'under-offer':
            return "bg-status-under-offer text-status-under-offer-foreground hover:bg-status-under-offer/80";
          case 'closed':
            return "bg-status-closed text-status-closed-foreground hover:bg-status-closed/80";
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
        return "bg-update-count text-update-count-foreground hover:bg-update-count/80 font-semibold min-w-5 h-5 flex items-center justify-center rounded-full text-xs px-1.5";
      
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