import { OpportunityIcon } from "./opportunity-icon";
import { OpportunityType } from "@/types";

interface EmptyOpportunitiesStateProps {
  onAddOpportunity: () => void;
}

const opportunityTypes: OpportunityType[] = ['buy', 'rent', 'sell', 'lease', 'mortgage'];

export function EmptyOpportunitiesState({ onAddOpportunity }: EmptyOpportunitiesStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {/* Icons row */}
      <div className="flex items-center gap-3 mb-6">
        {opportunityTypes.map((type) => (
          <OpportunityIcon 
            key={type} 
            type={type} 
            className="w-12 h-12 cursor-pointer hover:scale-105 transition-transform"
          />
        ))}
      </div>
      
      {/* Text content */}
      <h3 className="text-xl font-semibold mb-2">No opportunities yet</h3>
      <p className="text-sm text-muted-foreground max-w-md">
        Add one to start a new buy, sell, rent, lease or mortgage deal for this client.
      </p>
    </div>
  );
}
