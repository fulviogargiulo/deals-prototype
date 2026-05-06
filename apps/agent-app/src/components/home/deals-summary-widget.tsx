import { useNavigate } from "react-router-dom";
import { ArrowRight, AlertCircle, FileText, Clock } from "lucide-react";
import { mockDeals } from "@/data/mockDeals";
import { cn } from "@/lib/utils";

export function DealsSummaryWidget({ className }: { className?: string }) {
  const navigate = useNavigate();

  const needsAttention = mockDeals.filter(d =>
    ['pending-details', 'under-review'].includes(d.status)
  ).length;

  const pendingPayment = mockDeals.filter(d => d.status === 'pending-payment').length;

  const now = new Date();
  const reportedThisMonth = mockDeals.filter(d => {
    const date = new Date(d.reportDate);
    return date.getMonth() === now.getMonth();
  }).length;

  return (
    <section className={cn("space-y-4 flex flex-col", className)}>
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[20px] font-semibold leading-[120%] text-foreground">My Deals</h2>
        <button
          onClick={() => navigate('/deals')}
          className="text-[14px] font-medium text-fg-secondary hover:text-foreground transition-colors flex items-center gap-1"
        >
          View all <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Card */}
      <div
        className="bg-card rounded-2xl border border-border-ds-primary p-4 flex flex-col gap-3 flex-1 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate('/deals')}
      >
        {/* Reported This Month */}
        <div className="flex items-center gap-3 pr-4">
          <div className="flex items-center gap-3 flex-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'hsl(var(--accent-teal) / 0.1)' }}
            >
              <FileText className="w-5 h-5" style={{ color: 'hsl(var(--accent-teal))' }} />
            </div>
            <div className="min-w-0">
              <p className="text-[16px] font-normal leading-[140%] text-fg-secondary">Reported this month</p>
              <p className="text-[14px] font-normal leading-[140%]" style={{ color: 'hsl(var(--accent-teal))' }}>+3 vs last month</p>
            </div>
          </div>
          <p className="text-[22px] font-semibold leading-[120%] text-foreground">{reportedThisMonth}</p>
        </div>

        {/* Divider */}
        <div className="h-px bg-border-ds-primary" />

        {/* Needs Attention */}
        <div className="flex items-center gap-3 pr-4">
          <div className="flex items-center gap-3 flex-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'hsl(var(--ds-orange) / 0.1)' }}
            >
              <AlertCircle className="w-5 h-5" style={{ color: 'hsl(var(--ds-orange))' }} />
            </div>
            <div className="min-w-0">
              <p className="text-[16px] font-normal leading-[140%] text-fg-secondary">Need attention</p>
              <p className="text-[14px] font-normal leading-[140%]" style={{ color: 'hsl(var(--ds-orange))' }}>Oldest: 4 days</p>
            </div>
          </div>
          <p className="text-[22px] font-semibold leading-[120%] text-foreground">{needsAttention}</p>
        </div>

        {/* Divider */}
        <div className="h-px bg-border-ds-primary" />

        {/* Pending Payment */}
        <div className="flex items-center gap-3 pr-4">
          <div className="flex items-center gap-3 flex-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'hsl(var(--ds-orange) / 0.1)' }}
            >
              <Clock className="w-5 h-5" style={{ color: 'hsl(var(--ds-orange))' }} />
            </div>
            <div className="min-w-0">
              <p className="text-[16px] font-normal leading-[140%] text-fg-secondary">Pending payment</p>
              <p className="text-[14px] font-normal leading-[140%]" style={{ color: 'hsl(var(--accent-teal))' }}>€2,400 expected</p>
            </div>
          </div>
          <p className="text-[22px] font-semibold leading-[120%] text-foreground">{pendingPayment}</p>
        </div>
      </div>
    </section>
  );
}
