import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { StandardModal } from "@/components/ui/standard-modal";
import { Button } from "@/components/ui/button";
import { OpportunityType } from "@/types";
import { getOpportunityConfig } from "./opportunity-icon";
import { OpportunityBareIcons } from "./opportunity-bare-icons";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface OpportunityTypeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
}

const opportunityTypes: { type: OpportunityType; title: string; description: string }[] = [
  { type: "buy", title: "Buy", description: "Client wants to buy a property" },
  { type: "sell", title: "Sell", description: "Client has a property for sale" },
  { type: "rent", title: "Rent", description: "Client wants to rent a property" },
  { type: "lease", title: "Lease", description: "Client has a property for rent" },
];

export function OpportunityTypeSelector({ 
  open, 
  onOpenChange, 
  clientId, 
  clientName 
}: OpportunityTypeSelectorProps) {
  const [selectedType, setSelectedType] = useState<OpportunityType | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Simulate API call to create opportunity
  const createOpportunity = async (type: OpportunityType): Promise<string> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Generate a mock opportunity ID with draft suffix to indicate draft mode
    const opportunityId = `opp-${type}-draft-${Date.now()}`;
    return opportunityId;
  };

  const handleContinue = async () => {
    if (!selectedType) return;
    
    // For all types, create opportunity and navigate to draft mode
    setIsCreating(true);
    try {
      const opportunityId = await createOpportunity(selectedType);
      
      toast({
        title: "Opportunity created",
        description: `New ${selectedType} opportunity has been created for ${clientName}.`,
      });
      
      onOpenChange(false);
      setSelectedType(null);
      setIsCreating(false);
      
      // Navigate to the new opportunity in draft mode
      navigate(`/opportunities/${opportunityId}`);
    } catch (error) {
      setIsCreating(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create opportunity. Please try again.",
      });
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedType(null);
    }
    onOpenChange(isOpen);
  };

  return (
    <StandardModal
      open={open}
      onOpenChange={handleOpenChange}
      title="Select opportunity type"
      description="Choose the option that represents client's intent"
      size="md"
      footer={
        <Button
          onClick={handleContinue}
          disabled={!selectedType || isCreating}
          className="w-full h-12 rounded-full bg-foreground text-background hover:bg-foreground/90"
        >
          {isCreating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            "Continue"
          )}
        </Button>
      }
    >
      <div className="space-y-2 pb-2">
        {opportunityTypes.map((opp) => {
          const config = getOpportunityConfig(opp.type);
          const isSelected = selectedType === opp.type;
          const IconComponent = OpportunityBareIcons[opp.type];
          
          return (
            <button
              key={opp.type}
              type="button"
              onClick={() => setSelectedType(opp.type)}
              className={cn(
                "w-full p-3 rounded-xl border text-left flex items-center gap-3",
                "outline-none ring-0 ring-offset-0 shadow-none",
                "focus:outline-none focus:ring-0 focus:ring-offset-0 focus:shadow-none",
                "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
                isSelected
                  ? "bg-card"
                  : "border-border bg-card hover:border-muted-foreground/30"
              )}
              style={{ borderColor: isSelected ? 'hsl(var(--foreground))' : undefined }}
            >
              {/* Radio button */}
              <div className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                isSelected ? "border-foreground" : "border-muted-foreground/40"
              )}>
                {isSelected && (
                  <div className="w-2.5 h-2.5 rounded-full bg-foreground" />
                )}
              </div>
              
              {/* Icon with background */}
              <div className={cn("p-2.5 rounded-xl flex items-center justify-center", config.badgeClasses, config.textColor)}>
                {IconComponent && <IconComponent className="w-5 h-5" />}
              </div>
              
              {/* Text */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm">{opp.title}</h4>
                <p className="text-xs text-muted-foreground">{opp.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </StandardModal>
  );
}
