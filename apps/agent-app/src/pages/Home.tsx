import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePageTitle } from "@/contexts/page-title-context";
import { useData, DataViewMode } from "@/contexts/data-context";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { ActionCardStack, ActionCard, ActionCardStackHandle } from "@/components/home/action-card-stack";
import { OpportunityTypeGrid, OpportunitiesLayoutMode, TableFilterStyle } from "@/components/home/opportunity-type-grid";
import { DealsSummaryWidget } from "@/components/home/deals-summary-widget";
import { NewPropertiesGrid, PropertiesLayoutMode, ViewAllMode } from "@/components/home/new-properties-grid";
import { ActivityWidget, ScheduleDisplayMode, OverdueDisplayMode } from "@/components/schedule/activity-widget";
import { HomeDevTool, ActionCardCount, HomeLayoutVariant, HomeHeaderVariant, GreetingOverride, PropertiesDisplayMode, InquiryScenario } from "@/components/dev-tools/home-dev-tool";
import { MeshGradient } from "@/components/home/mesh-gradient";
import { IncomeOverviewGrid } from "@/components/home/income-overview-grid";
import { OpportunityType } from "@/types";
import { ReviewInquiryModal, InquiryData } from "@/components/modals/review-inquiry-modal";
import apartmentImage1 from "@/assets/apartment-la-latina-1.jpg";
import apartmentImage2 from "@/assets/apartment-la-latina-2.jpg";
import apartmentImage3 from "@/assets/apartment-la-latina-3.jpg";

// Opportunity action cards (controlled by dev tool count)
const opportunityActionCards: ActionCard[] = [
{
  id: 'action-1',
  type: 'buy',
  badges: [
  { label: 'Buy', variant: 'type' },
  { label: 'Portal inquiry', variant: 'source' }],

  clientName: 'Alejandro Ramírez',
  description: 'New inquiry from Idealista for apartment in Chamberí',
  countdown: '2h 15m'
},
{
  id: 'action-2',
  type: 'sell',
  badges: [
  { label: 'Sell', variant: 'type' },
  { label: 'Price review', variant: 'source' }],

  clientName: 'María López',
  description: 'Property price needs to be reviewed after market update'
},
{
  id: 'action-3',
  type: 'rent',
  badges: [
  { label: 'Rent', variant: 'type' },
  { label: 'Document missing', variant: 'source' }],

  clientName: 'Pedro Escobar',
  description: 'Missing rental contract for apartment in La Latina',
  countdown: '4h 30m'
},
{
  id: 'action-4',
  type: 'lease',
  badges: [
  { label: 'Lease', variant: 'type' },
  { label: 'Verification', variant: 'source' }],

  clientName: 'Isabel Fernández',
  description: 'Client identity verification pending for lease agreement',
  countdown: '1h 45m'
},
{
  id: 'action-5',
  type: 'buy',
  badges: [
  { label: 'Buy', variant: 'type' },
  { label: 'New match', variant: 'source' }],

  clientName: 'David Torres',
  description: 'New property match found in Salamanca matching buyer criteria'
}];

// Deals action cards (always shown)
const dealsActionCards: ActionCard[] = [
{
  id: 'deals-confirm',
  type: 'buy',
  cardVariant: 'deals',
  iconKey: 'confirm-deals',
  badges: [
    { label: 'Deals', variant: 'type' },
    { label: '3 pending', variant: 'source' },
  ],
  clientName: 'Confirm Deals for Invoicing',
  description: '€20,400 in commissions pending confirmation',
  countdown: '48h 0m',
  ctaLabel: 'Confirm',
},
{
  id: 'deals-pending-info',
  type: 'rent',
  cardVariant: 'deals',
  iconKey: 'pending-info',
  badges: [
    { label: 'Deals', variant: 'type' },
    { label: '2 pending', variant: 'source' },
  ],
  clientName: 'Deals Pending Information',
  description: '2 deals need additional details before processing',
  ctaLabel: 'Provide Info',
},
{
  id: 'deals-statement',
  type: 'sell',
  cardVariant: 'deals',
  iconKey: 'statement',
  badges: [
    { label: 'Statement', variant: 'type' },
    { label: 'Mar 2025', variant: 'source' },
  ],
  clientName: 'Statement Confirmation',
  description: 'Review and confirm your statement of account · €4,250 balance',
  countdown: '72h 0m',
  ctaLabel: 'Review',
}];

export default function Home() {
  const { setPageTitle } = usePageTitle();
  const { addClient, addOpportunity } = useData();
  const navigate = useNavigate();
  const actionCardRef = useRef<ActionCardStackHandle>(null);

  useEffect(() => {
    setPageTitle('Home');
  }, [setPageTitle]);

  // Dev tool states
  const [scheduleDisplayMode, setScheduleDisplayMode] = useState<ScheduleDisplayMode>('few');
  const [overdueDisplayMode, setOverdueDisplayMode] = useState<OverdueDisplayMode>('some');
  const [dataViewMode, setDataViewMode] = useState<DataViewMode>('default');
  const [actionCardCount, setActionCardCount] = useState<ActionCardCount>(3);
  const [showSchedule, setShowSchedule] = useState(true);
  const [showNewProperties, setShowNewProperties] = useState<PropertiesDisplayMode>('show');
  const [layoutVariant, setLayoutVariant] = useState<HomeLayoutVariant>('compact');
  const [headerVariant, setHeaderVariant] = useState<HomeHeaderVariant>('compact-box');
  const [propertiesLayoutMode, setPropertiesLayoutMode] = useState<PropertiesLayoutMode>('carousel');
  const [viewAllMode, setViewAllMode] = useState<ViewAllMode>('header');
  const [opportunitiesLayoutMode, setOpportunitiesLayoutMode] = useState<OpportunitiesLayoutMode>('table');
  const [tableFilterStyle, setTableFilterStyle] = useState<TableFilterStyle>('cards');
  const [greetingOverride, setGreetingOverride] = useState<GreetingOverride>('auto');

  // Review inquiry modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [activeInquiry, setActiveInquiry] = useState<InquiryData | null>(null);
  const [forceInquiryExpired, setForceInquiryExpired] = useState(false);

  // Map action cards with countdowns to inquiry data
  const inquiryDataMap: Record<string, InquiryData> = {
    'action-1': {
      id: 'action-1',
      clientName: 'Alejandro R.',
      opportunityType: 'buy',
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(),
      properties: [
        {
          id: 'prop-1',
          title: 'Apartment in Calle de las Mártires Concepcionistas',
          image: apartmentImage1,
          price: '€1,199,000',
          beds: 3,
          isExclusive: true,
          badges: ['Exclusive'],
          clientNote: "Hi there! I'm very interested in the apartment. It looks great and I'd love to arrange a viewing at your earliest convenience.",
          source: 'idealista',
          sourceTime: '1h ago',
        },
        {
          id: 'prop-2',
          title: 'Apartment in Calle de las Mártires Concepcionistas',
          image: apartmentImage2,
          price: '€1,199,000',
          beds: 3,
          isExclusive: true,
          badges: ['Exclusive', 'Off-plan'],
          clientNote: "Hello! I hope this message finds you well. I came across the charming townhouse you have listed.",
          source: 'fotocasa',
          sourceTime: '3h ago',
        },
        {
          id: 'prop-3',
          title: 'Apartment in Calle de las Mártires Concepcionistas',
          image: apartmentImage3,
          price: '€1,199,000',
          beds: 3,
          isExclusive: true,
          badges: ['Exclusive'],
          clientNote: "Hi there! I recently stumbled upon your listing for a cozy apartment, and it piqued my interest.",
          source: 'pisos',
          sourceTime: '3h ago',
        },
      ],
    },
    'action-3': {
      id: 'action-3',
      clientName: 'Pedro E.',
      opportunityType: 'rent',
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
      properties: [
        {
          id: 'prop-4',
          title: 'Studio in La Latina, Madrid',
          image: apartmentImage1,
          price: '€1,800/mo',
          beds: 1,
          isExclusive: false,
          clientNote: "I'm interested in renting this studio. Could we schedule a visit this week?",
          source: 'fotocasa',
          sourceTime: '2h ago',
        },
      ],
    },
  };

  const handleInquiryScenario = useCallback((scenario: InquiryScenario) => {
    const isExpired = scenario.includes('expired');
    setForceInquiryExpired(isExpired);
    const base = Object.values(inquiryDataMap)[0];
    if (!base) return;
    let inquiryData: InquiryData;
    if (scenario.startsWith('0-props')) {
      inquiryData = { ...base, id: 'dev-0-props', properties: [], note: 'Client interested in properties in Salamanca region. Contact within 30 min.', noteSource: 'From ops portal' };
    } else if (scenario.startsWith('1-prop')) {
      inquiryData = { ...base, id: 'dev-1-prop', properties: [base.properties[0]] };
    } else {
      inquiryData = base;
    }
    setActiveInquiry(inquiryData);
    setReviewModalOpen(true);
  }, []);

  const handleReview = useCallback((card: ActionCard) => {
    if (card.cardVariant === 'deals') {
      navigate('/deals');
      return;
    }
    const inquiry = inquiryDataMap[card.id];
    if (inquiry) {
      setActiveInquiry(inquiry);
      setReviewModalOpen(true);
    }
  }, [navigate]);

  const activeCards = [...opportunityActionCards.slice(0, actionCardCount), ...dealsActionCards];
  const [activeGradientType, setActiveGradientType] = useState<OpportunityType>(activeCards[0]?.type ?? 'buy');

  const getGreeting = () => {
    if (greetingOverride === 'morning') return 'Good morning';
    if (greetingOverride === 'afternoon') return 'Good afternoon';
    if (greetingOverride === 'evening') return 'Good evening';
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getSubtitle = () => {
    if (greetingOverride === 'morning' || (greetingOverride === 'auto' && new Date().getHours() < 12)) return "Let's start the day strong";
    if (greetingOverride === 'afternoon' || (greetingOverride === 'auto' && new Date().getHours() < 18)) return "Keep the momentum going";
    return "Wrapping up for the day";
  };

  const greetingElement = (variant: 'light' | 'dark') => (
    <div className={cn("space-y-1", variant === 'light' ? "text-white" : "text-foreground")}>
      <h1 className="text-4xl font-semibold leading-heading">{getGreeting()}, Nino</h1>
      <p className={cn("text-base leading-body", variant === 'light' ? "text-white/60" : "text-muted-foreground")}>{getSubtitle()}</p>
    </div>
  );

  const actionCardsElement = activeCards.length > 0 ? (
    <div className="mt-6">
      <ActionCardStack ref={actionCardRef} cards={activeCards} onReview={handleReview} onActiveCardChange={(card) => setActiveGradientType(card.type)} />
    </div>
  ) : null;

  const compactActionCardsElement = activeCards.length > 0 ? (
    <ActionCardStack ref={actionCardRef} cards={activeCards} variant="compact" onReview={handleReview} onActiveCardChange={(card) => setActiveGradientType(card.type)} />
  ) : null;

  const opportunitiesElement = <OpportunityTypeGrid layoutMode={opportunitiesLayoutMode} tableFilterStyle={tableFilterStyle} />;
  const dealsAndIncomeElement = (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <DealsSummaryWidget />
      <IncomeOverviewGrid />
    </div>
  );
  const scheduleElement = showSchedule ? <ActivityWidget displayMode={scheduleDisplayMode} overdueDisplayMode={overdueDisplayMode} /> : null;
  const propertiesElement = showNewProperties !== 'hidden' ? <NewPropertiesGrid layoutMode={propertiesLayoutMode} viewAllMode={viewAllMode} isEmpty={showNewProperties === 'empty'} /> : null;
  

  // ===== FULL GRADIENT HEADER =====
  const fullGradientHeader = (
    <div className="relative">
      <MeshGradient activeType={activeGradientType} />
      <div className="absolute inset-0 z-0 bg-black/20 pointer-events-none" />
      <div className="relative z-10 pt-24 pb-8">
        <PageContainer>
          <div className={cn("flex items-start justify-between", activeCards.length > 0 && "mb-6")}>
            {greetingElement('light')}
            {activeCards.length > 1 && (
              <div className="flex items-center gap-2 mt-1">
                <button onClick={() => actionCardRef.current?.goPrev()} className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors">
                  <ChevronLeft className="w-4 h-4 text-white" />
                </button>
                <button onClick={() => actionCardRef.current?.goNext()} className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors">
                  <ChevronRight className="w-4 h-4 text-white" />
                </button>
              </div>
            )}
          </div>
          {compactActionCardsElement}
        </PageContainer>
      </div>
    </div>
  );

  // ===== COMPACT BAR HEADER =====
  const compactBarHeader =
  <div className="border-b bg-card">
      <PageContainer className="py-6">
        {greetingElement('dark')}
        {actionCardsElement}
      </PageContainer>
    </div>;


  // ===== COMPACT BOX HEADER (rendered inline in layout, not as separate header) =====
  const emptyGradient = 'linear-gradient(189.58deg, #343434 33.51%, #1A1A1A 92.33%)';
  const hasActions = activeCards.length > 0;

  const compactBoxElement =
  <div className="relative rounded-3xl overflow-hidden">
      {hasActions ? (
        <>
          <MeshGradient activeType={activeGradientType} className="z-0 rounded-3xl" />
          <div className="absolute inset-0 z-0 bg-black/20 pointer-events-none rounded-3xl" />
        </>
      ) : (
        <div className="absolute inset-0 z-0 rounded-3xl" style={{ background: emptyGradient }} />
      )}

      <div className="relative z-10 p-6 pb-6">
        {/* Greeting row with nav arrows */}
        <div className={cn("flex items-start justify-between", hasActions && "mb-6")}>
          <div>
            <h1 className="text-4xl font-semibold leading-heading text-white">
              {getGreeting()}, Nino
            </h1>
            <p className="text-base mt-1 leading-body text-white/60">
              {getSubtitle()}
            </p>
          </div>
          {activeCards.length > 1 &&
        <div className="flex items-center gap-2 mt-1">
              <button
            onClick={() => actionCardRef.current?.goPrev()}
            className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors">
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              <button
            onClick={() => actionCardRef.current?.goNext()}
            className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors">
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </div>
        }
        </div>
        {compactActionCardsElement}
      </div>
    </div>;


  const isCompactBox = headerVariant === 'compact-box';
  const headerElement = headerVariant === 'full-gradient' ?
  fullGradientHeader :
  isCompactBox ?
  null // compact-box header is rendered inline in the layout
  : compactBarHeader;

  // ===== CONTENT WRAPPER =====
  const contentWrapper = (children: React.ReactNode) =>
  <div className={cn(
    headerVariant === 'full-gradient' ? "bg-surface-ds-page -mt-4 rounded-t-3xl relative z-10 pt-8" : "pt-8",
    "min-h-[calc(100vh-200px)]"
  )}>
      <PageContainer className="space-y-10 py-0">
        {children}
      </PageContainer>
    </div>;


  // ===== LAYOUT: STACKED =====
  const renderStacked = () => contentWrapper(
    <>
      {isCompactBox && compactBoxElement}
      {opportunitiesElement}
      {dealsAndIncomeElement}
      {scheduleElement}
      {propertiesElement}
    </>
  );

  // ===== LAYOUT: TWO-COLUMN (like opp details two-column: 4/8 split) =====
  const renderTwoColumn = () => {
    // When compact-box, embed the header box in the grid so schedule sits alongside
    if (isCompactBox) {
      return (
        <div className="pt-6 min-h-[calc(100vh-200px)]">
          <PageContainer className="space-y-10 py-0">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-8">
                {compactBoxElement}
                {opportunitiesElement}
                {dealsAndIncomeElement}
                {/* Schedule inline on mobile */}
                {scheduleElement && (
                  <div className="lg:hidden">
                    {scheduleElement}
                  </div>
                )}
              </div>
              {scheduleElement &&
              <div className="hidden lg:flex lg:col-span-4 flex-col">
                  {scheduleElement}
                </div>
              }
            </div>
            {propertiesElement}
          </PageContainer>
        </div>);

    }
    return contentWrapper(
      <>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            {opportunitiesElement}
            {dealsAndIncomeElement}
            {/* Schedule inline on mobile */}
            {scheduleElement && (
              <div className="lg:hidden">
                {scheduleElement}
              </div>
            )}
          </div>
          {scheduleElement &&
          <div className="hidden lg:flex lg:col-span-4 flex-col">
              {scheduleElement}
            </div>
          }
        </div>
        {propertiesElement}
      </>
    );
  };

  // ===== LAYOUT: SIDEBAR (like opp details sidebar-main: 3/9 narrow sidebar) =====
  const renderSidebar = () => contentWrapper(
    <>
      {isCompactBox && compactBoxElement}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Narrow sidebar: schedule + properties compact */}
        <div className="lg:col-span-3 space-y-5">
          {scheduleElement &&
          <Card className="p-5 space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Schedule</h3>
              {scheduleElement}
            </Card>
          }
          {propertiesElement &&
          <Card className="p-5 space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">New in Madrid</h3>
              {propertiesElement}
            </Card>
          }
        </div>
        {/* Wide main: opportunities */}
        <div className="lg:col-span-9">
          {opportunitiesElement}
          {dealsAndIncomeElement}
        </div>
      </div>
    </>
  );

  // ===== LAYOUT: COMPACT (like opp details compact-wide: 9/3 main+side) =====
  const renderCompact = () => {
    if (isCompactBox) {
      return (
        <div className="pt-6 min-h-[calc(100vh-200px)]">
          <PageContainer className="space-y-10 py-0">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 space-y-10">
                {compactBoxElement}
                {opportunitiesElement}
                {dealsAndIncomeElement}
                {/* Schedule inline on mobile, hidden on desktop */}
                {scheduleElement && (
                  <div className="lg:hidden">
                    {scheduleElement}
                  </div>
                )}
                {propertiesElement}
              </div>
              {/* Schedule sidebar on desktop only */}
              {scheduleElement &&
              <div className="hidden lg:flex lg:col-span-4 flex-col">
                  <Card className="p-5 space-y-3 sticky top-20">
                    {scheduleElement}
                  </Card>
                </div>
              }
            </div>
          </PageContainer>
        </div>);
    }
    return contentWrapper(
      <>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-10">
            {opportunitiesElement}
            {dealsAndIncomeElement}
            {/* Schedule inline on mobile */}
            {scheduleElement && (
              <div className="lg:hidden">
                {scheduleElement}
              </div>
            )}
            {propertiesElement}
          </div>
          {scheduleElement &&
          <div className="hidden lg:flex lg:col-span-4 flex-col">
              <Card className="p-5 space-y-3 sticky top-20">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Activity</h3>
                {scheduleElement}
              </Card>
            </div>
          }
        </div>
      </>
    );
  };

  const layoutRenderers: Record<HomeLayoutVariant, () => React.ReactNode> = {
    'stacked': renderStacked,
    'two-column': renderTwoColumn,
    'sidebar': renderSidebar,
    'compact': renderCompact
  };

  return (
    <div className={cn("min-h-screen bg-surface-ds-page animate-fade-in", headerVariant === 'full-gradient' ? "-mt-16" : "")}>
      {headerElement}
      {layoutRenderers[layoutVariant]()}

      {/* Dev Tools */}
      <HomeDevTool
        scheduleDisplayMode={scheduleDisplayMode}
        setScheduleDisplayMode={setScheduleDisplayMode}
        overdueDisplayMode={overdueDisplayMode}
        setOverdueDisplayMode={setOverdueDisplayMode}
        dataViewMode={dataViewMode}
        setDataViewMode={setDataViewMode}
        actionCardCount={actionCardCount}
        setActionCardCount={setActionCardCount}
        showSchedule={showSchedule}
        setShowSchedule={setShowSchedule}
        showNewProperties={showNewProperties}
        setShowNewProperties={setShowNewProperties}
        layoutVariant={layoutVariant}
        setLayoutVariant={setLayoutVariant}
        headerVariant={headerVariant}
        setHeaderVariant={setHeaderVariant}
        propertiesLayoutMode={propertiesLayoutMode}
        setPropertiesLayoutMode={setPropertiesLayoutMode}
        viewAllMode={viewAllMode}
        setViewAllMode={setViewAllMode}
        opportunitiesLayoutMode={opportunitiesLayoutMode}
        setOpportunitiesLayoutMode={setOpportunitiesLayoutMode}
        tableFilterStyle={tableFilterStyle}
        setTableFilterStyle={setTableFilterStyle}
        greetingOverride={greetingOverride}
        setGreetingOverride={setGreetingOverride}
        onOpenInquiry={handleInquiryScenario}
      />

      {/* Review Inquiry Modal */}
      <ReviewInquiryModal
        open={reviewModalOpen}
        onOpenChange={(open) => {
          setReviewModalOpen(open);
          if (!open) setForceInquiryExpired(false);
        }}
        inquiry={activeInquiry}
        forceExpired={forceInquiryExpired}
        onAccept={(inquiry) => {
          const clientId = `inquiry-client-${Date.now()}`;
          const oppId = `opp-${inquiry.opportunityType}-draft-${Date.now()}`;
          
          // Create the new client
          addClient({
            id: clientId,
            fullName: inquiry.clientName,
            phone: '+34 600 000 000',
            verificationStatus: 'incoming',
            source: inquiry.properties[0]?.source === 'idealista' ? 'idealista' : inquiry.properties[0]?.source === 'fotocasa' ? 'fotocasa' : 'self-created',
            lastActivity: 'Accepted from inquiry',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          
          // Create the new opportunity
          addOpportunity({
            id: oppId,
            clientId,
            type: inquiry.opportunityType,
            status: 'new',
            title: `${inquiry.opportunityType === 'buy' ? 'Buy' : 'Rent'} – ${inquiry.properties[0]?.title || 'Property'}`,
            neighborhoods: [],
            tags: [],
            portalBadges: [inquiry.properties[0]?.source || 'other'],
            source: inquiry.properties[0]?.source || 'other',
            updatesCount: 0,
            pendingActions: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          
          return clientId;
        }}
        onDecline={(inquiry) => console.log('Declined inquiry:', inquiry.id)}
        onScenarioChange={handleInquiryScenario}
      />
    </div>);

}