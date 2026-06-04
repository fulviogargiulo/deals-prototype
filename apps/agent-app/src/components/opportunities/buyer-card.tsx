import { MoreVertical, Upload, CalendarDays, Phone, Handshake, X, MessageCircle, Mail, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Portal logos
import idealistaLogo from "@/assets/idealista-logo.ico";
import fotocasaLogo from "@/assets/fotocasa-logo.png";
import pisosLogo from "@/assets/pisos-logo.png";

const portalLogos: Record<string, string> = {
  idealista: idealistaLogo,
  fotocasa: fotocasaLogo,
  pisos: pisosLogo,
};

export interface BuyerCardProps {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  location?: string;
  budgetRange?: string;
  bedrooms?: string;
  size?: string;
  updateIndicator?: string;
  labels?: string[];
  portalInquired?: {
    portal: 'idealista' | 'fotocasa' | 'pisos';
    timestamp: string;
  };
  buyerSaved?: {
    timestamp: string;
  };
  actions?: {
    primary?: {
      label: string;
      onClick: () => void;
    };
    secondary?: {
      label: string;
      variant?: "outline" | "default";
      onClick: () => void;
    };
  };
  // New action handlers
  onShareProperty?: () => void;
  onBookVisit?: () => void;
  onCall?: () => void;
  onWhatsApp?: () => void;
  onEmail?: () => void;
  onGoToProfile?: () => void;
  onCloseDeal?: () => void;
  onRemove?: () => void;
  /** Opportunity type for proper labeling (buyer vs renter) */
  opportunityType?: 'buy' | 'sell' | 'rent' | 'lease';
  className?: string;
  onClick?: () => void;
}

export function BuyerCard({
  name,
  phone,
  email,
  location,
  budgetRange,
  bedrooms,
  size,
  updateIndicator,
  labels = [],
  portalInquired,
  buyerSaved,
  actions,
  onShareProperty,
  onBookVisit,
  onCall,
  onWhatsApp,
  onEmail,
  onGoToProfile,
  onCloseDeal,
  onRemove,
  opportunityType = 'sell',
  className,
  onClick,
}: BuyerCardProps) {
  const hasContactMethods = phone || email;
  // Derive labels based on opportunity type
  const isRenter = opportunityType === 'lease' || opportunityType === 'rent';
  const personLabel = isRenter ? 'renter' : 'buyer';
  const personsLabel = isRenter ? 'renters' : 'buyers';

  return (
    <Card 
      className={cn("overflow-hidden hover:shadow-md transition-shadow", onClick && "cursor-pointer", className)}
      onClick={onClick}
    >
      <div className="p-4">
        {/* Header with Avatar and Name */}
        <div className="flex items-start gap-3 mb-3">
          <UserAvatar 
            name={name} 
            size="md" 
            className="w-12 h-12 flex-shrink-0" 
          />
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold leading-heading text-foreground truncate">{name}</h3>
            <div className="text-sm font-normal leading-body text-muted-foreground space-y-0.5">
              {location && <div>{location}</div>}
              {(budgetRange || bedrooms || size) && (
                <div className="flex flex-wrap gap-1">
                  {budgetRange && <span>{budgetRange}</span>}
                  {budgetRange && (bedrooms || size) && <span>·</span>}
                  {bedrooms && <span>{bedrooms}</span>}
                  {bedrooms && size && <span>·</span>}
                  {size && <span>{size}</span>}
                </div>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 flex-shrink-0 rounded-full bg-secondary hover:bg-secondary/80"
              >
                <MoreVertical className="w-4 h-4 rotate-90" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card min-w-[200px]">
              {/* Share property with buyer/renter */}
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onShareProperty?.();
                }}
              >
                <Upload className="h-4 w-4 text-muted-foreground" />
                Share property with {personLabel}
              </DropdownMenuItem>
              
              {/* Book a visit */}
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onBookVisit?.();
                }}
              >
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                Book a visit
              </DropdownMenuItem>
              
              {/* Contact client - with submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  Contact client
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="min-w-[160px]">
                  <div className="-mx-2 -mt-2 px-4 py-3 border-b border-border mb-2">
                    <span className="text-sm font-semibold">{name}</span>
                  </div>
                  {phone && (
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        onCall?.();
                      }}
                    >
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      Call
                    </DropdownMenuItem>
                  )}
                  {phone && (
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        onWhatsApp?.();
                      }}
                    >
                      <MessageCircle className="h-4 w-4 text-muted-foreground" />
                      WhatsApp
                    </DropdownMenuItem>
                  )}
                  {email && (
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        onEmail?.();
                      }}
                    >
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      Email
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      onGoToProfile?.();
                    }}
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    Go to profile
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              
              {/* Close deal */}
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseDeal?.();
                }}
              >
                <Handshake className="h-4 w-4 text-muted-foreground" />
                Close deal
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {/* Remove from saved */}
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive focus:bg-destructive/10 hover:bg-destructive/10"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove?.();
                }}
              >
                <X className="h-4 w-4" />
                Remove from saved {personsLabel}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Labels and Update Indicator */}
        {(labels.length > 0 || updateIndicator) && (
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {labels.map((label, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {label}
              </Badge>
            ))}
            {updateIndicator && (
              <span className="text-xs text-muted-foreground">{updateIndicator}</span>
            )}
          </div>
        )}

        {/* Footer - Portal Inquired or Buyer Saved */}
        {portalInquired && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                <img 
                  src={portalLogos[portalInquired.portal]} 
                  alt={portalInquired.portal}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-sm font-normal leading-body text-foreground">Portal inquired</span>
            </div>
            <span className="text-sm font-normal leading-body text-muted-foreground">{portalInquired.timestamp}</span>
          </div>
        )}

        {/* Buyer saved footer (without portal inquiry) */}
        {!portalInquired && buyerSaved && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
            <span className="text-sm font-normal leading-body text-foreground">Buyer saved</span>
            <span className="text-sm font-normal leading-body text-muted-foreground">{buyerSaved.timestamp}</span>
          </div>
        )}
      </div>
    </Card>
  );
}