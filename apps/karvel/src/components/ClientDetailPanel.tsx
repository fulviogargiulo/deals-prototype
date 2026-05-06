import { Client } from "@/data/clientTypes";
import { StatusBadge } from "./OpportunityBadges";
import { X, ArrowUpRight, MessageCircle, Plus } from "lucide-react";

interface Props {
  client: Client;
  onClose: () => void;
}

export function ClientDetailPanel({ client, onClose }: Props) {
  return (
    <div className="w-[400px] min-w-[400px] border-l border-border bg-card h-full overflow-y-auto animate-slide-in-right">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <h2 className="text-xl font-semibold text-foreground">{client.fullName}</h2>
          <div className="flex items-center gap-2">
            <button className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground">
              <ArrowUpRight className="h-5 w-5" />
            </button>
            <button onClick={onClose} className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mb-6">
          <button className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-md text-[13px] font-medium text-foreground bg-card hover:bg-muted transition-colors">
            <MessageCircle className="h-4 w-4" />
            Contact Client
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-md text-[13px] font-medium hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" />
            Add Opportunity
          </button>
        </div>

        <hr className="border-border mb-5" />

        {/* Overview */}
        <h3 className="text-[15px] font-semibold text-foreground mb-4">Overview</h3>

        <div className="space-y-4">
          <DetailRow label="Name" value={client.fullName} />
          <DetailRow label="Email" value={client.email} />
          <DetailRow label="Phone" value={client.phone} />
          <DetailRow label="Government ID" value="-" />
          <div className="flex items-center">
            <span className="w-[140px] text-[13px] text-muted-foreground shrink-0">Status</span>
            <StatusBadge status={client.status} />
          </div>
          <div className="flex items-center">
            <span className="w-[140px] text-[13px] text-muted-foreground shrink-0">Source</span>
            <span className="text-[13px] text-foreground font-medium border border-border rounded px-2 py-0.5">{client.source}</span>
          </div>
          <div className="flex items-center">
            <span className="w-[140px] text-[13px] text-muted-foreground shrink-0">Origin</span>
            <span className="text-[13px] text-foreground font-medium border border-border rounded px-2 py-0.5">{client.origin}</span>
          </div>
          <DetailRow label="Lead Type Tags" value="-" />
          <DetailRow label="Created At" value="Mar 7, 2026, 1:01:29 PM" />
          <DetailRow label="Updated At" value="Mar 7, 2026, 1:01:29 PM" />
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center">
      <span className="w-[140px] text-[13px] text-muted-foreground shrink-0">{label}</span>
      <span className="text-[14px] text-foreground font-medium">{value}</span>
    </div>
  );
}
