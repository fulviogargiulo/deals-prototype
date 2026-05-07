import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageContainer } from '@/components/layout/page-container';
import { TrackedTitle } from '@/components/ui/tracked-title';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle2, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { DocumentRow } from '@/components/deals/document-row';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { mockDeals, agentStakeMap } from '@/data/mockDeals';
import { computeDealFinancials, COMMISSION_RATES, getClientForDeal, computeAgentCommission } from '@huspy/shared-domain';
import { BuyBareIcon, RentBareIcon, SellBareIcon, LeaseBareIcon } from '@/components/opportunities/opportunity-bare-icons';
import { DealStatus } from '@/types';
import { toast } from 'sonner';
import { DealTimeline } from '@/components/deals/deal-timeline';
import { MissingInfoSection } from '@/components/deals/missing-info-section';

const statusLabels: Record<DealStatus, string> = {
  reported: 'Reported',
  'pending-details': 'Pending Details',
  'under-review': 'Under Review',
  'pending-agent-approval': 'Pending Approval',
  'pending-receivables': 'Pending Receivables',
  finalized: 'Finalized',
  canceled: 'Canceled',
};

const statusColors: Record<DealStatus, { color: string; bg: string }> = {
  reported: { color: 'hsl(var(--accent-indigo))', bg: 'hsl(var(--accent-indigo) / 0.1)' },
  'pending-details': { color: 'hsl(var(--ds-orange))', bg: 'hsl(var(--ds-orange) / 0.1)' },
  'under-review': { color: 'hsl(var(--accent-orchid))', bg: 'hsl(var(--accent-orchid) / 0.1)' },
  'pending-agent-approval': { color: 'hsl(var(--ds-green))', bg: 'hsl(var(--ds-green) / 0.1)' },
  'pending-receivables': { color: 'hsl(var(--accent-terracotta))', bg: 'hsl(var(--accent-terracotta) / 0.1)' },
  finalized: { color: 'hsl(var(--fg-secondary))', bg: 'hsl(var(--fg-secondary) / 0.1)' },
  canceled: { color: 'hsl(var(--ds-red))', bg: 'hsl(var(--ds-red) / 0.1)' },
};

const typeConfig: Record<string, { icon: typeof BuyBareIcon; color: string }> = {
  buy: { icon: BuyBareIcon, color: '#008A8A' },
  sell: { icon: SellBareIcon, color: '#D95D28' },
  rent: { icon: RentBareIcon, color: '#5856D6' },
  lease: { icon: LeaseBareIcon, color: '#CD52C3' },
};

function getDocumentsForMarketType(marketType: string) {
  switch (marketType) {
    case 'primary':
      return [
        { name: 'Booking Form / Reservation Form', uploaded: true },
        { name: "Buyer's Passport", uploaded: false },
        { name: "Buyer's EID", uploaded: false },
        { name: 'AML/KYC', uploaded: false },
      ];
    case 'leasing':
      return [
        { name: 'Tenancy Contract', uploaded: true },
        { name: 'Tenant Passport', uploaded: false },
        { name: 'Tenant EID', uploaded: false },
        { name: 'Ejari / AML / KYC', uploaded: false },
      ];
    case 'secondary':
    default:
      return [
        { name: 'Agent Handover Sheet', uploaded: true },
        { name: 'Form F', uploaded: true },
        { name: 'Title Deed', uploaded: false },
        { name: 'Copy of 10% deposit cheque', uploaded: false },
        { name: 'Buyer Passport', uploaded: true },
        { name: 'Buyer EID', uploaded: false },
        { name: 'Buyer Visa', uploaded: false },
        { name: 'Seller Passport', uploaded: true },
        { name: 'Seller EID', uploaded: false },
        { name: 'Seller Visa', uploaded: false },
        { name: 'AML/KYC', uploaded: false },
      ];
  }
}

export function DealDetails() {
  const { id } = useParams<{ id: string }>();
  const deal = mockDeals.find(d => d.id === id);
  const [uploadedDocs, setUploadedDocs] = useState<Set<number>>(new Set());
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeSubmitted, setDisputeSubmitted] = useState(false);
  
  const [confirmedForInvoicing, setConfirmedForInvoicing] = useState(false);

  if (!deal) {
    return (
      <PageContainer>
        <div className="space-y-4 animate-fade-in">
          <p className="text-[hsl(var(--fg-secondary))]">Deal not found.</p>
        </div>
      </PageContainer>
    );
  }

  const config = typeConfig[deal.type];
  const colors = statusColors[deal.status];

  const handleUpload = (index: number, fileName: string) => {
    setUploadedDocs(prev => new Set(prev).add(index));
    toast.success(`"${fileName}" uploaded successfully`);
  };


  const allDocsUploaded = ['pending-agent-approval', 'pending-receivables', 'finalized'].includes(deal.status);
  const documents = getDocumentsForMarketType(deal.marketType).map(doc => 
    allDocsUploaded ? { ...doc, uploaded: true } : doc
  );

  return (
    <PageContainer>
      <div className="space-y-5 animate-fade-in">
        <TrackedTitle title={deal.title}>
          <div className="h-px w-full" aria-hidden="true" />
        </TrackedTitle>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {config && (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${config.color}15` }}
              >
                <span style={{ color: config.color }}>
                  <config.icon className="w-5 h-5" />
                </span>
              </div>
            )}
            <div>
              <h1 className="text-[28px] font-semibold leading-[120%] text-foreground">
                {deal.title}
              </h1>
              <p className="text-[14px] text-[hsl(var(--fg-secondary))] leading-[140%] capitalize mt-0.5">
                {deal.type} · {deal.marketType} · <Link to={`/opportunities/${deal.opportunityId}`} className="hover:underline normal-case" style={{ color: 'hsl(var(--accent-indigo))' }}>{deal.opportunityName}</Link>
              </p>
            </div>
          </div>
          <span
            className="inline-flex px-3 py-1 rounded-full text-[12px] font-semibold whitespace-nowrap"
            style={{ backgroundColor: colors.bg, color: colors.color }}
          >
            {statusLabels[deal.status]}
          </span>
        </div>

        {/* Top row: Deal Price + Property Details + Commission */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Deal Price */}
          <div className="bg-card rounded-2xl p-5 space-y-1.5">
            <p className="text-[12px] font-semibold text-[hsl(var(--fg-secondary))] leading-[140%] uppercase tracking-wide">
              Deal Price
            </p>
            <p className="text-[28px] font-semibold leading-[120%] text-foreground tabular-nums">
              {deal.currency}{deal.dealAmount.toLocaleString()}
            </p>
          </div>

          {/* Property Details */}
          <div className="bg-card rounded-2xl p-5 space-y-3">
            <p className="text-[12px] font-semibold text-[hsl(var(--fg-secondary))] leading-[140%] uppercase tracking-wide">
              Property Details
            </p>
            <div className="space-y-2">
              <div>
                <p className="text-[12px] text-[hsl(var(--fg-secondary))] leading-[140%]">Building Name</p>
                <Link to="/my-properties" className="text-[16px] font-semibold leading-[120%] mt-0.5 hover:underline" style={{ color: 'hsl(var(--accent-indigo))' }}>Edificio Luna</Link>
              </div>
              <div>
                <p className="text-[12px] text-[hsl(var(--fg-secondary))] leading-[140%]">Unit Number</p>
                <p className="text-[16px] font-semibold text-foreground leading-[120%] mt-0.5">3B</p>
              </div>
            </div>
          </div>

          {/* Client & Dates */}
          <div className="bg-card rounded-2xl p-5 space-y-3">
            <p className="text-[12px] font-semibold text-[hsl(var(--fg-secondary))] leading-[140%] uppercase tracking-wide">
              Details
            </p>
            <div className="space-y-2">
              <div>
                <p className="text-[12px] text-[hsl(var(--fg-secondary))] leading-[140%]">Client</p>
                <Link to={`/clients/${getClientForDeal(deal.id)?.id ?? ''}`} className="text-[16px] font-semibold leading-[120%] mt-0.5 hover:underline" style={{ color: 'hsl(var(--accent-indigo))' }}>{deal.clientName}</Link>
              </div>
              <div>
                <p className="text-[12px] text-[hsl(var(--fg-secondary))] leading-[140%]">Report Date</p>
                <p className="text-[16px] font-semibold text-foreground leading-[120%] mt-0.5">
                  {new Date(deal.reportDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              {deal.status === 'finalized' && deal.paymentDate && (
                <div>
                  <p className="text-[12px] text-[hsl(var(--fg-secondary))] leading-[140%]">Payment Date</p>
                  <p className="text-[16px] font-semibold text-foreground leading-[120%] mt-0.5">
                    {new Date(deal.paymentDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Deal Timeline */}
        <DealTimeline currentStatus={deal.status} reportDate={deal.reportDate} paymentDate={deal.paymentDate} />


        {/* Commission Breakdown — visible once deal is approved or further along */}
        {['pending-agent-approval', 'pending-receivables', 'finalized'].includes(deal.status) && (() => {
          const f = computeDealFinancials(deal.dealAmount);
          const stake = agentStakeMap.get(deal.id);
          const personalCommission = computeAgentCommission(f.agentCommissionPayout, stake);
          const splitPct = stake?.splitPercentage ?? 100;
          const isExpandable = deal.status !== 'pending-agent-approval';

          const content = (
            <>
              {/* Formula */}
              <div className="px-4 py-3 border-b border-border-ds-primary">
                <p className="text-[12px] text-fg-secondary leading-[140%]">
                  Your Payout = Deal Price × {COMMISSION_RATES.takeRate}% (Huspy rate) × {COMMISSION_RATES.agentGrossRate}% (your commission rate){splitPct < 100 ? ` × ${splitPct}% (your deal split)` : ''}
                </p>
              </div>

              {/* Breakdown rows */}
              <div className="divide-y divide-border-ds-primary">
                <div className="grid grid-cols-[1fr_120px] px-4 py-2.5 items-center gap-3">
                  <span className="text-[12px] text-fg-secondary leading-[140%]">Deal Price</span>
                  <span className="text-[12px] font-semibold text-foreground text-right tabular-nums">{deal.currency}{deal.dealAmount.toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-[1fr_120px] px-4 py-2.5 items-center gap-3">
                  <span className="text-[12px] text-fg-secondary leading-[140%]">Huspy Revenue (×{COMMISSION_RATES.takeRate}%)</span>
                  <span className="text-[12px] font-semibold text-right tabular-nums" style={{ color: 'hsl(var(--ds-green))' }}>{deal.currency}{f.huspyRevenue.toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-[1fr_120px] px-4 py-2.5 items-center gap-3">
                  <span className="text-[12px] text-fg-secondary leading-[140%]">Your Commission Rate</span>
                  <span className="text-[12px] font-semibold text-foreground text-right tabular-nums">{COMMISSION_RATES.agentGrossRate}%</span>
                </div>
                {splitPct < 100 && (
                  <div className="grid grid-cols-[1fr_120px] px-4 py-2.5 items-center gap-3">
                    <span className="text-[12px] text-fg-secondary leading-[140%]">Your Deal Split</span>
                    <span className="text-[12px] font-semibold text-foreground text-right tabular-nums">{splitPct}%</span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="border-t border-border-ds-primary px-4 py-3 flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-foreground">Your Commission Payout</span>
                  <span className="text-[20px] font-semibold text-foreground ml-3 tabular-nums">{deal.currency}{personalCommission.toLocaleString()}</span>
                </div>
                {deal.status === 'pending-agent-approval' && !confirmedForInvoicing && !disputeSubmitted && (
                  <Button
                    size="sm"
                    className="h-7 rounded-full text-xs"
                    style={{ backgroundColor: 'hsl(var(--ds-green))', color: 'white' }}
                    onClick={() => {
                      setConfirmedForInvoicing(true);
                      toast.success('Deal confirmed for invoicing');
                    }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Confirm
                  </Button>
                )}
              </div>

              {/* Confirmed message */}
              {deal.status === 'pending-agent-approval' && confirmedForInvoicing && (
                <div className="border-t border-border-ds-primary px-4 py-3 flex items-center gap-2" style={{ backgroundColor: 'hsl(var(--ds-green) / 0.06)' }}>
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(var(--ds-green))' }} />
                  <p className="text-[12px] font-semibold leading-[140%]" style={{ color: 'hsl(var(--ds-green))' }}>
                    This deal has been added for invoicing for the coming payment cycle.
                  </p>
                </div>
              )}

              {/* Dispute form — only for finalised */}
              {deal.status === 'pending-agent-approval' && showDisputeForm && !disputeSubmitted && (
                <div className="border-t border-border-ds-primary px-4 py-4 space-y-3">
                  <p className="text-[14px] font-semibold text-foreground leading-[140%]">Raise a Dispute</p>
                  <textarea
                    className="w-full rounded-lg border border-[hsl(var(--border-ds-primary))] bg-transparent p-3 text-[14px] leading-[140%] text-foreground placeholder:text-[hsl(var(--fg-secondary))] resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--fg-primary))]"
                    rows={3}
                    placeholder="Describe what seems incorrect..."
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" className="text-xs text-fg-secondary h-8 rounded-full" onClick={() => { setShowDisputeForm(false); setDisputeReason(''); }}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 rounded-full text-xs"
                      style={{ backgroundColor: 'hsl(var(--ds-red))', color: 'white' }}
                      disabled={!disputeReason.trim()}
                      onClick={() => {
                        setDisputeSubmitted(true);
                        setShowDisputeForm(false);
                        toast.success('Dispute raised successfully');
                      }}
                    >
                      Submit Dispute
                    </Button>
                  </div>
                </div>
              )}
            </>
          );

          const header = (
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" style={{ color: 'hsl(var(--accent-indigo))' }} />
              <h3 className="text-[14px] font-semibold leading-[120%] text-foreground">
                Commission Calculation Breakdown
              </h3>
            </div>
          );

          const disputeBadges = (
            <div className="flex items-center gap-2">
              {deal.status === 'pending-agent-approval' && (
                disputeSubmitted ? (
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap" style={{ backgroundColor: 'hsl(var(--ds-orange) / 0.1)', color: 'hsl(var(--ds-orange))' }}>Under Review</span>
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap" style={{ backgroundColor: 'hsl(var(--ds-red) / 0.1)', color: 'hsl(var(--ds-red))' }}>Disputed</span>
                  </div>
                ) : !showDisputeForm ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-fg-secondary h-8 rounded-full"
                    onClick={(e) => { e.stopPropagation(); setShowDisputeForm(true); }}
                  >
                    Raise Dispute
                  </Button>
                ) : null
              )}
            </div>
          );

          if (isExpandable) {
            return (
              <Collapsible>
                <div className="bg-card rounded-2xl overflow-hidden">
                  <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-[hsl(var(--surface-raised))] transition-colors">
                    <div className="flex items-center gap-3">
                      {header}
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap" style={{ backgroundColor: 'hsl(var(--accent-indigo) / 0.1)', color: 'hsl(var(--accent-indigo))' }}>
                        {deal.currency}{f.agentCommissionPayout.toLocaleString()}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-[hsl(var(--fg-secondary))] transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {content}
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          }

          return (
            <div className="bg-card rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border-ds-primary flex items-center justify-between">
                {header}
                {disputeBadges}
              </div>
              {content}
            </div>
          );
        })()}

        {/* Missing Information + Documents (combined) — only for pending-details */}
        {deal.status === 'pending-details' && (
          <MissingInfoSection
            deal={deal}
            documents={documents}
            uploadedDocs={uploadedDocs}
            onUploadDoc={handleUpload}
          />
        )}

        {/* Attached Documents — hidden for pending-details (merged above) */}
        {deal.status !== 'pending-details' && (() => {
          const uploadedCount = documents.filter((doc, i) => doc.uploaded || uploadedDocs.has(i)).length;
          const totalCount = documents.length;
          return (
            <Collapsible>
              <div className="bg-card rounded-2xl overflow-hidden">
                <CollapsibleTrigger className="w-full px-5 py-4 flex items-center justify-between hover:bg-[hsl(var(--surface-raised))] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[hsl(var(--fg-primary)/0.05)]">
                      <FileText className="w-4 h-4 text-foreground" />
                    </div>
                    <div className="text-left">
                      <p className="text-[14px] font-semibold text-foreground leading-[120%]">
                        Attached Documents
                      </p>
                      <p className="text-[12px] text-[hsl(var(--fg-secondary))] leading-[140%] mt-0.5">
                        {uploadedCount} of {totalCount} uploaded
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {uploadedCount === totalCount ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[hsl(var(--ds-green)/0.1)] text-[hsl(var(--ds-green))]">
                        <CheckCircle2 className="w-3 h-3" />
                        Complete
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[hsl(var(--ds-orange)/0.1)] text-[hsl(var(--ds-orange))]">
                        <AlertTriangle className="w-3 h-3" />
                        {totalCount - uploadedCount} pending
                      </span>
                    )}
                    <ChevronDown className="w-4 h-4 text-[hsl(var(--fg-secondary))] transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-5 pb-5 pt-1">
                    {[...documents]
                      .map((doc, i) => ({ doc, originalIndex: i }))
                      .sort((a, b) => {
                        const aUploaded = a.doc.uploaded || uploadedDocs.has(a.originalIndex);
                        const bUploaded = b.doc.uploaded || uploadedDocs.has(b.originalIndex);
                        if (aUploaded === bUploaded) return 0;
                        return aUploaded ? 1 : -1;
                      })
                      .map(({ doc, originalIndex }) => {
                        const isUploaded = doc.uploaded || uploadedDocs.has(originalIndex);
                        return (
                          <DocumentRow
                            key={originalIndex}
                            name={doc.name}
                            isUploaded={isUploaded}
                            uploadedFileName={isUploaded ? `${doc.name}.pdf` : undefined}
                            onUpload={() => handleUpload(originalIndex, doc.name)}
                            onDownload={() => {}}
                            onReplace={() => handleUpload(originalIndex, doc.name)}
                            onDelete={() => {}}
                          />
                        );
                      })}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })()}
      </div>
    </PageContainer>
  );
}
