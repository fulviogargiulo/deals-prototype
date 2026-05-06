import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { startOfWeek, endOfWeek } from 'date-fns';
import { PageContainer } from '@/components/layout/page-container';
import { TrackedTitle } from '@/components/ui/tracked-title';

import { DealsSummaryCards } from '@/components/deals/deals-summary-cards';
import { DealsDateRangeSelector } from '@/components/deals/deals-date-range-selector';
import { ActionsRequiredSection } from '@/components/deals/actions-required-section';
import { ExpectedPayoutSection } from '@/components/deals/expected-payout-section';
import { DealsTable } from '@/components/deals/deals-table';
import { mockDeals, mockStatement } from '@/data/mockDeals';

export function DealsList() {
  const location = useLocation();
  const [invoiceCreated, setInvoiceCreated] = useState(false);
  const [disputedDealIds, setDisputedDealIds] = useState<Set<string>>(new Set());
  const now = new Date();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfWeek(now, { weekStartsOn: 1 }),
    to: endOfWeek(now, { weekStartsOn: 1 }),
  });
  const pendingConfirmation = mockDeals.filter(d => d.status === 'finalised');
  const pendingInfo = mockDeals.filter(d => d.status === 'pending-details');

  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [location.hash]);

  const handleDealDisputed = (dealId: string) => {
    setDisputedDealIds(prev => new Set(prev).add(dealId));
  };

  return (
    <PageContainer>
      <div className="space-y-8 animate-fade-in">
        <TrackedTitle title="Deals">
          <div className="h-px w-full" aria-hidden="true" />
        </TrackedTitle>

        <h1 className="text-[32px] font-semibold leading-[120%]">Deals</h1>

        <DealsDateRangeSelector onChange={setDateRange} />

        <DealsSummaryCards deals={mockDeals} dateRange={dateRange} />

        <ActionsRequiredSection
          pendingConfirmation={pendingConfirmation}
          pendingInfo={pendingInfo}
          statement={invoiceCreated ? null : mockStatement}
          onInvoiceCreated={() => setInvoiceCreated(true)}
          disputedDealIds={disputedDealIds}
          onDealDisputed={handleDealDisputed}
        />

        {invoiceCreated && <ExpectedPayoutSection statement={mockStatement} />}

        <div id="all-deals">
          <DealsTable deals={mockDeals} disputedDealIds={disputedDealIds} />
        </div>
      </div>
    </PageContainer>
  );
}
