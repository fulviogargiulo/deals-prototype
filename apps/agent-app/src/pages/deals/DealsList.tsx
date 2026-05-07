import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { startOfWeek, endOfWeek } from 'date-fns';
import { PageContainer } from '@/components/layout/page-container';
import { TrackedTitle } from '@/components/ui/tracked-title';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import { DealsSummaryCards } from '@/components/deals/deals-summary-cards';
import { DealsDateRangeSelector } from '@/components/deals/deals-date-range-selector';
import { ActionsRequiredSection } from '@/components/deals/actions-required-section';
import { DealsTable } from '@/components/deals/deals-table';
import { AgentEarningsView } from '@/components/deals/agent-earnings-view';
import { agentDeals, agentStakeMap } from '@/data/mockDeals';

export function DealsList() {
  const location = useLocation();
  const [disputedDealIds, setDisputedDealIds] = useState<Set<string>>(new Set());
  const now = new Date();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfWeek(now, { weekStartsOn: 1 }),
    to: endOfWeek(now, { weekStartsOn: 1 }),
  });
  const pendingConfirmation = agentDeals.filter(d => d.status === 'pending-agent-approval');
  const pendingInfo = agentDeals.filter(d => d.status === 'pending-details');

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
      <div className="space-y-6 animate-fade-in">
        <TrackedTitle title="Deals">
          <div className="h-px w-full" aria-hidden="true" />
        </TrackedTitle>

        <h1 className="text-[32px] font-semibold leading-[120%]">Deals</h1>

        <Tabs defaultValue="deals">
          <TabsList className="mb-6">
            <TabsTrigger value="deals">Deals</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
          </TabsList>

          <TabsContent value="deals" className="space-y-8 mt-0">
            <DealsDateRangeSelector onChange={setDateRange} />
            <DealsSummaryCards deals={agentDeals} dateRange={dateRange} agentStakeMap={agentStakeMap} />
            <ActionsRequiredSection
              pendingConfirmation={pendingConfirmation}
              pendingInfo={pendingInfo}
              disputedDealIds={disputedDealIds}
              onDealDisputed={handleDealDisputed}
            />
            <div id="all-deals">
              <DealsTable deals={agentDeals} disputedDealIds={disputedDealIds} agentStakeMap={agentStakeMap} />
            </div>
          </TabsContent>

          <TabsContent value="earnings" className="mt-0">
            <AgentEarningsView />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
