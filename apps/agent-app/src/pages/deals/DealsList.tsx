import { useState, useEffect, useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { isWithinInterval, parseISO } from 'date-fns';
import { Search } from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { TrackedTitle } from '@/components/ui/tracked-title';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';

import { DealsSummaryCards } from '@/components/deals/deals-summary-cards';
import { DealsFilterBar } from '@/components/deals/deals-filter-bar';
import { ActionsRequiredSection } from '@/components/deals/actions-required-section';
import { DealsTable } from '@/components/deals/deals-table';
import { AgentEarningsView } from '@/components/deals/agent-earnings-view';
import { getAgentDeals, getAgentStakeMap } from '@/data/mockDeals';
import { useDevTools } from '@/contexts/dev-tools-context';

export function DealsList() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "deals";
  const { activeAgentId } = useDevTools();

  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(null);
  const [search, setSearch] = useState('');

  const agentDeals = getAgentDeals(activeAgentId);
  const agentStakeMap = getAgentStakeMap(activeAgentId);

  const pendingConfirmation = agentDeals.filter(d => d.status === 'pending-agent-approval');
  const pendingInfo = agentDeals.filter(d => d.status === 'pending-details');

  const filteredDeals = useMemo(() => {
    let result = dateRange
      ? agentDeals.filter(d => isWithinInterval(parseISO(d.reportDate), { start: dateRange.from, end: dateRange.to }))
      : agentDeals;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(d => d.title.toLowerCase().includes(q) || d.clientName.toLowerCase().includes(q));
    }
    return result;
  }, [activeAgentId, dateRange, search]);

  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [location.hash]);

  return (
    <PageContainer>
      <div className="space-y-6 animate-fade-in">
        <TrackedTitle title="Deals">
          <div className="h-px w-full" aria-hidden="true" />
        </TrackedTitle>

        <div className="flex items-center justify-between gap-4">
          <h1 className="text-[32px] font-semibold leading-[120%]">Deals</h1>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-secondary w-4 h-4" />
            <Input
              placeholder="Search deals..."
              className="pl-10 bg-card rounded-full h-9 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setSearchParams({ tab: v })}>
          <TabsList className="mb-6">
            <TabsTrigger value="deals">Deals</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
          </TabsList>

          <TabsContent value="deals" className="space-y-8 mt-0">
            <ActionsRequiredSection
              pendingConfirmation={pendingConfirmation}
              pendingInfo={pendingInfo}
              agentStakeMap={agentStakeMap}
            />
            <DealsFilterBar onDateRangeChange={setDateRange} />
            <DealsSummaryCards deals={filteredDeals} agentStakeMap={agentStakeMap} />
            <div id="all-deals">
              <DealsTable deals={filteredDeals} agentStakeMap={agentStakeMap} />
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
