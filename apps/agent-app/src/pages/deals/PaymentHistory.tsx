import { useState } from 'react';
import { CheckCircle2, TrendingUp, PiggyBank, Info, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/page-container';
import { TrackedTitle } from '@/components/ui/tracked-title';
import { ExpectedPayoutSection } from '@/components/deals/expected-payout-section';
import { PaidInvoicesModal } from '@/components/modals/paid-invoices-modal';
import { mockDeals, mockStatement } from '@/data/mockDeals';

const PIPELINE_STATUSES = ['under-review', 'finalised', 'pending-payment', 'pending-receivables'];
const CLOSED_STATUSES = ['paid'];

export function PaymentHistory() {
  const navigate = useNavigate();
  const [showPaidInvoices, setShowPaidInvoices] = useState(false);
  const closedDeals = mockDeals.filter(d => CLOSED_STATUSES.includes(d.status));
  const pipelineDeals = mockDeals.filter(d => PIPELINE_STATUSES.includes(d.status));

  const totalClosedDeals = closedDeals.length;
  const totalIncome = closedDeals.reduce((sum, d) => sum + d.commissionAmount, 0);
  const potentialIncome = pipelineDeals.reduce((sum, d) => sum + d.commissionAmount, 0);

  return (
    <PageContainer>
      <TrackedTitle title="Income Details">
        <h1 className="text-[28px] font-semibold leading-[120%] text-foreground">Income Details</h1>
      </TrackedTitle>

      <div className="space-y-8 mt-6">
        {/* Summary Cards */}
        <div>
          <h2 className="text-[20px] font-semibold leading-[120%] text-foreground mb-4">
            Earned Income
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Deals Closed */}
            <div className="bg-card rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'hsl(var(--ds-green) / 0.1)' }}
                >
                  <CheckCircle2 className="w-6 h-6" style={{ color: 'hsl(var(--ds-green))' }} />
                </div>
                <div className="space-y-1">
                  <p className="text-[12px] font-semibold leading-[140%] text-fg-secondary uppercase tracking-wide">
                    Deals Paid
                  </p>
                  <p className="text-[32px] font-semibold leading-[120%] tabular-nums" style={{ color: 'hsl(var(--ds-green))' }}>
                    {totalClosedDeals}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Income */}
            <div
              className="bg-card rounded-2xl p-6 cursor-pointer hover:bg-surface-raised transition-colors"
              onClick={() => setShowPaidInvoices(true)}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'hsl(var(--accent-teal) / 0.1)' }}
                >
                  <PiggyBank className="w-6 h-6" style={{ color: 'hsl(var(--accent-teal))' }} />
                </div>
                <div className="space-y-1 flex-1">
                  <p className="text-[12px] font-semibold leading-[140%] text-fg-secondary uppercase tracking-wide">
                    Total Income
                  </p>
                  <p className="text-[32px] font-semibold leading-[120%] tabular-nums" style={{ color: 'hsl(var(--accent-teal))' }}>
                    €{totalIncome.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-fg-secondary">
                  <span className="text-[12px] font-semibold leading-[140%]">View Details</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Expected Income This Cycle */}
        <ExpectedPayoutSection statement={mockStatement} title="Expected Income" />

        {/* Potential Income from Pipeline */}
        <div>
          <h2 className="text-[20px] font-semibold leading-[120%] text-foreground mb-2">
            Potential Income from Pipeline
          </h2>
          <div className="flex items-start gap-2 mb-4 px-1">
            <Info className="w-4 h-4 text-fg-secondary mt-0.5 shrink-0" />
            <p className="text-[12px] font-normal leading-[140%] text-fg-secondary">
              Only deals ready for invoicing are shown here, as commission is calculated at that stage. Deals that are recently reported or pending information are not included.
            </p>
          </div>
          <div
            className="bg-card rounded-2xl p-6 cursor-pointer hover:bg-surface-raised transition-colors"
            onClick={() => navigate('/deals#all-deals')}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'hsl(var(--accent-indigo) / 0.1)' }}
              >
                <TrendingUp className="w-6 h-6" style={{ color: 'hsl(var(--accent-indigo))' }} />
              </div>
              <div className="space-y-1 flex-1">
                <p className="text-[12px] font-semibold leading-[140%] text-fg-secondary uppercase tracking-wide">
                  {pipelineDeals.length} deals in pipeline
                </p>
                <p className="text-[32px] font-semibold leading-[120%] tabular-nums" style={{ color: 'hsl(var(--accent-indigo))' }}>
                  €{potentialIncome.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-1 text-fg-secondary">
                <span className="text-[12px] font-semibold leading-[140%]">View Deals</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Pipeline breakdown */}
            <div className="mt-6 pt-4 border-t border-border-ds-primary space-y-3">
              {pipelineDeals.map(deal => (
                <div key={deal.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-[14px] font-semibold leading-[140%] text-foreground">{deal.title}</p>
                    <p className="text-[12px] font-normal leading-[140%] text-fg-secondary">{deal.clientName}</p>
                  </div>
                  <p className="text-[14px] font-semibold leading-[140%] tabular-nums text-foreground">
                    €{deal.commissionAmount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <PaidInvoicesModal
        open={showPaidInvoices}
        onOpenChange={setShowPaidInvoices}
        deals={closedDeals}
        totalIncome={totalIncome}
      />
    </PageContainer>
  );
}
