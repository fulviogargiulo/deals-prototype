import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageContainer } from '@/components/layout/page-container';
import { TrackedTitle } from '@/components/ui/tracked-title';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle2, AlertTriangle, ChevronDown, RotateCcw, Download } from 'lucide-react';
import { DocumentRow } from '@/components/deals/document-row';
import { CommissionBreakdown } from '@/components/deals/commission-breakdown';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { mockDeals, getAgentStakeMap, getTranchesForDeal } from '@/data/mockDeals';
import { useDevTools } from '@/contexts/dev-tools-context';
import {
  getClientForDeal, computeAgentCommission, canTransitionDealStatus,
  sharedDealDocumentRequirements, sharedDealComments, sharedDocuments, sharedInvoices,
  sharedPnlEntries,
  buildWaterfallInput, calculateProjectedPnL, dealStatusColors,
} from '@huspy/shared-domain';
import type { InvoiceStatus, Tranche } from '@huspy/shared-domain';
import { BuyBareIcon, RentBareIcon, SellBareIcon, LeaseBareIcon } from '@/components/opportunities/opportunity-bare-icons';
import { DealStatus } from '@/types';
import { toast } from 'sonner';
import { DealTimeline } from '@/components/deals/deal-timeline';
import { MissingInfoSection } from '@/components/deals/missing-info-section';

const statusLabels: Record<DealStatus, string> = {
  'pending-details': 'Pending Details',
  'under-review': 'Under Review',
  'pending-agent-approval': 'Pending Approval',
  'invoicing': 'Invoicing',
  finalized: 'Finalized',
  canceled: 'Canceled',
};

const statusColors: Record<DealStatus, { color: string; bg: string }> = Object.fromEntries(
  Object.entries(dealStatusColors).map(([k, { hsl }]) => [k, { color: `hsl(${hsl})`, bg: `hsl(${hsl} / 0.1)` }])
) as Record<DealStatus, { color: string; bg: string }>;

const typeConfig: Record<string, { icon: typeof BuyBareIcon; color: string }> = {
  buy: { icon: BuyBareIcon, color: '#008A8A' },
  sell: { icon: SellBareIcon, color: '#D95D28' },
  rent: { icon: RentBareIcon, color: '#5856D6' },
  lease: { icon: LeaseBareIcon, color: '#CD52C3' },
};

const INVOICE_BADGE: Record<InvoiceStatus, { label: string; cls: string }> = {
  draft:     { label: 'Draft',     cls: 'bg-[hsl(var(--surface-raised))] text-[hsl(var(--fg-secondary))]' },
  issued:    { label: 'Issued',    cls: 'bg-[hsl(var(--ds-orange)/0.1)] text-[hsl(var(--ds-orange))]' },
  paid:      { label: 'Paid',      cls: 'bg-[hsl(var(--ds-green)/0.1)] text-[hsl(var(--ds-green))]' },
  cancelled: { label: 'Cancelled', cls: 'bg-[hsl(var(--ds-red)/0.1)] text-[hsl(var(--ds-red))]' },
};

// Pick the first tranche that needs agent action, or fall back to tranches[0].
function pickDefaultTranche(tranches: Tranche[]): Tranche | undefined {
  return (
    tranches.find(t => t.status === 'pending-agent-approval' || t.status === 'pending-details') ??
    tranches[0]
  );
}

export function DealDetails() {
  const { id } = useParams<{ id: string }>();
  const { activeAgentId } = useDevTools();
  const agentStakeMap = getAgentStakeMap(activeAgentId);
  const viewDeal = mockDeals.find(d => d.id === id);

  const tranches = id ? getTranchesForDeal(id) : [];
  const [selectedTrancheId, setSelectedTrancheId] = useState<string>(
    () => tranches[0]?.id ?? ''
  );

  const selectedTranche = tranches.find(t => t.id === selectedTrancheId) ?? tranches[0];

  if (!viewDeal || !selectedTranche) {
    return (
      <PageContainer>
        <div className="space-y-4 animate-fade-in">
          <p className="text-[hsl(var(--fg-secondary))]">Deal not found.</p>
        </div>
      </PageContainer>
    );
  }

  const config = typeConfig[viewDeal.type];
  const trancheStatus = selectedTranche.status as DealStatus;
  const colors = statusColors[trancheStatus] ?? statusColors['pending-details'];

  return (
    <PageContainer>
      <div className="space-y-5 animate-fade-in">
        <TrackedTitle title={viewDeal.title}>
          <div className="h-px w-full" aria-hidden="true" />
        </TrackedTitle>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {config && (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${config.color}15` }}>
                <span style={{ color: config.color }}><config.icon className="w-5 h-5" /></span>
              </div>
            )}
            <div>
              <h1 className="text-[28px] font-semibold leading-[120%] text-foreground">{viewDeal.title}</h1>
              <p className="text-[14px] text-[hsl(var(--fg-secondary))] leading-[140%] capitalize mt-0.5">
                {viewDeal.type} · {viewDeal.market}
                {viewDeal.offerId ? <> · <span className="font-mono text-[13px]" style={{ color: 'hsl(var(--accent-indigo))' }}>{viewDeal.offerId}</span></> : null}
                {viewDeal.description && <span className="ml-2 px-1.5 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground border border-border not-capitalize">{viewDeal.description}</span>}
              </p>
            </div>
          </div>
          <span className="inline-flex px-3 py-1 rounded-full text-[12px] font-semibold whitespace-nowrap"
            style={{ backgroundColor: colors.bg, color: colors.color }}>
            {statusLabels[trancheStatus] ?? trancheStatus}
          </span>
        </div>

        {/* Tranche tabs — multi-tranche deals only */}
        {tranches.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {tranches.map((t) => {
              const tStatus = t.status as DealStatus;
              const tColors = statusColors[tStatus] ?? { color: 'hsl(var(--fg-secondary))', bg: 'transparent' };
              const isActive = t.id === selectedTrancheId;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTrancheId(t.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium whitespace-nowrap transition-colors border ${
                    isActive
                      ? 'bg-card text-foreground border-border shadow-sm'
                      : 'bg-transparent text-[hsl(var(--fg-secondary))] border-transparent hover:text-foreground hover:bg-card/60'
                  }`}
                >
                  <span className="text-[11px] font-bold opacity-50">{t.index + 1}</span>
                  {t.label ?? `Tranche ${t.index + 1}`}
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: tColors.bg, color: tColors.color }}>
                    {statusLabels[tStatus] ?? tStatus}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Top row: Deal Price + Property Details + Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-2xl p-5 space-y-1.5">
            <p className="text-[12px] font-semibold text-[hsl(var(--fg-secondary))] leading-[140%] uppercase tracking-wide">Deal Price</p>
            <p className="text-[28px] font-semibold leading-[120%] text-foreground tabular-nums">
              {viewDeal.currency}{viewDeal.dealAmount.toLocaleString()}
            </p>
          </div>
          <div className="bg-card rounded-2xl p-5 space-y-3">
            <p className="text-[12px] font-semibold text-[hsl(var(--fg-secondary))] leading-[140%] uppercase tracking-wide">Property Details</p>
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
          <div className="bg-card rounded-2xl p-5 space-y-3">
            <p className="text-[12px] font-semibold text-[hsl(var(--fg-secondary))] leading-[140%] uppercase tracking-wide">Details</p>
            <div className="space-y-2">
              <div>
                <p className="text-[12px] text-[hsl(var(--fg-secondary))] leading-[140%]">Client</p>
                <Link to={`/clients/${getClientForDeal(viewDeal.id)?.id ?? ''}`} className="text-[16px] font-semibold leading-[120%] mt-0.5 hover:underline" style={{ color: 'hsl(var(--accent-indigo))' }}>{viewDeal.clientName}</Link>
              </div>
              <div>
                <p className="text-[12px] text-[hsl(var(--fg-secondary))] leading-[140%]">Report Date</p>
                <p className="text-[16px] font-semibold text-foreground leading-[120%] mt-0.5">
                  {selectedTranche.reportDate ? new Date(selectedTranche.reportDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tranche-scoped content — key forces remount on tranche switch */}
        <TrancheContent
          key={selectedTranche.id}
          deal={viewDeal}
          tranche={selectedTranche}
          agentStakeMap={agentStakeMap}
        />
      </div>
    </PageContainer>
  );
}

// ── Per-tranche content ───────────────────────────────────────────────────────
// Receives key={tranche.id} from DealDetails — full remount on tab switch.

function TrancheContent({
  deal,
  tranche,
  agentStakeMap,
}: {
  deal: typeof mockDeals[number];
  tranche: Tranche;
  agentStakeMap: Map<string, any>;
}) {
  const trancheStatus = tranche.status as DealStatus;
  const [uploadedDocs, setUploadedDocs] = useState<Set<number>>(new Set());
  const [confirmedForInvoicing, setConfirmedForInvoicing] = useState(false);
  const [reviewRequested, setReviewRequested] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [localTranchStatus, setLocalTrancheStatus] = useState<DealStatus>(trancheStatus);

  const [comments, setComments] = useState(() =>
    sharedDealComments.filter(c => c.trancheId === tranche.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  );

  const addComment = (text: string) => {
    setComments(prev => [...prev, {
      id: `dc-local-${Date.now()}`,
      trancheId: tranche.id,
      author: 'agent' as const,
      authorName: 'Agent',
      text,
      createdAt: new Date().toISOString(),
    }]);
  };

  const handleUpload = (index: number, fileName: string) => {
    setUploadedDocs(prev => new Set(prev).add(index));
    toast.success(`"${fileName}" uploaded successfully`);
  };

  // Documents scoped to this tranche
  const documents = sharedDealDocumentRequirements
    .filter(r => r.trancheId === tranche.id)
    .map(r => ({ name: r.label, uploaded: r.status !== 'pending' }));

  // Invoice documents scoped to this tranche
  const invoiceDocs = sharedDocuments
    .filter(d => d.type === 'invoice' && d.dealId === deal.id && d.invoiceId)
    .map(d => {
      const invoice = sharedInvoices.find(i => i.id === d.invoiceId && i.trancheId === tranche.id);
      if (!invoice || invoice.direction !== 'outbound') return null;
      return { document: d, invoice };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  // Commission from this tranche's stakes
  const stake = agentStakeMap.get(tranche.id);
  const waterfallInput = buildWaterfallInput({ ...deal, trancheId: tranche.id } as any);
  const projection = waterfallInput ? calculateProjectedPnL(waterfallInput) : null;
  const agentSplit = projection?.splits.find(s => s.partyId === stake?.partyId);

  // Derive gross revenue for commission calc from REVENUE_SOURCE stakes
  const trancheGross = sharedPnlEntries
    .filter(s => s.trancheId === tranche.id && s.role === 'REVENUE_SOURCE' && (s.amount ?? 0) > 0)
    .reduce((sum, s) => sum + Math.abs(s.amount ?? 0), 0);

  const personalCommission = agentSplit?.agentPayout ?? computeAgentCommission(trancheGross, stake);

  const showCommission = ['pending-agent-approval', 'invoicing', 'finalized'].includes(localTranchStatus);
  const isExpandable = localTranchStatus !== 'pending-agent-approval';

  const commissionContent = (
    <>
      <CommissionBreakdown
        deal={deal as any}
        stake={stake}
        projection={projection}
        agentSplit={agentSplit}
        personalCommission={personalCommission}
      />

      {localTranchStatus === 'pending-agent-approval' && !confirmedForInvoicing && !reviewRequested && (
        <div className="border-t border-border-ds-primary px-4 py-3 flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" className="h-7 rounded-full text-xs"
            style={{ color: 'hsl(var(--ds-orange))' }}
            onClick={() => setShowReviewForm(true)}>
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Request Review
          </Button>
          <Button size="sm" className="h-7 rounded-full text-xs"
            style={{ backgroundColor: 'hsl(var(--ds-green))', color: 'white' }}
            onClick={() => {
              if (!canTransitionDealStatus(localTranchStatus, 'invoicing')) {
                toast.error('This tranche cannot move to Invoicing from the current status.');
                return;
              }
              setLocalTrancheStatus('invoicing');
              setConfirmedForInvoicing(true);
              toast.success('Tranche confirmed and moved to Invoicing');
            }}>
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Confirm
          </Button>
        </div>
      )}

      {showReviewForm && localTranchStatus === 'pending-agent-approval' && !confirmedForInvoicing && !reviewRequested && (
        <div className="border-t border-border-ds-primary px-4 py-3 space-y-2" style={{ backgroundColor: 'hsl(var(--ds-orange) / 0.04)' }}>
          <p className="text-[12px] font-semibold" style={{ color: 'hsl(var(--ds-orange))' }}>Explain why you're requesting a review *</p>
          <textarea value={reviewNote} onChange={e => setReviewNote(e.target.value)}
            placeholder="The commission amount doesn't match what we agreed..." rows={2} autoFocus
            className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border-ds-primary))] bg-transparent text-[13px] leading-[140%] text-foreground placeholder:text-[hsl(var(--fg-secondary))] resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--fg-primary))]" />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" className="h-7 rounded-full text-xs"
              onClick={() => { setShowReviewForm(false); setReviewNote(''); }}>Cancel</Button>
            <Button size="sm" className="h-7 rounded-full text-xs"
              style={{ backgroundColor: 'hsl(var(--ds-orange))', color: 'white' }}
              disabled={!reviewNote.trim()}
              onClick={() => {
                if (!canTransitionDealStatus(localTranchStatus, 'under-review')) {
                  toast.error('Cannot send back to Under Review from the current status.');
                  return;
                }
                addComment(reviewNote.trim());
                setLocalTrancheStatus('under-review');
                setReviewRequested(true);
                setShowReviewForm(false);
                setReviewNote('');
                toast.success('Review requested — Ops will be notified.');
              }}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Submit Request
            </Button>
          </div>
        </div>
      )}

      {localTranchStatus === 'invoicing' && confirmedForInvoicing && (
        <div className="border-t border-border-ds-primary px-4 py-3 flex items-center gap-2" style={{ backgroundColor: 'hsl(var(--ds-green) / 0.06)' }}>
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(var(--ds-green))' }} />
          <p className="text-[12px] font-semibold leading-[140%]" style={{ color: 'hsl(var(--ds-green))' }}>
            This tranche has been added for invoicing for the coming payment cycle.
          </p>
        </div>
      )}

      {reviewRequested && (
        <div className="border-t border-border-ds-primary px-4 py-3 flex items-center gap-2" style={{ backgroundColor: 'hsl(var(--ds-orange) / 0.06)' }}>
          <RotateCcw className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(var(--ds-orange))' }} />
          <p className="text-[12px] font-semibold leading-[140%]" style={{ color: 'hsl(var(--ds-orange))' }}>
            Sent back to Ops for review. Add a message below to explain.
          </p>
        </div>
      )}
    </>
  );

  const commissionHeader = (
    <div className="flex items-center gap-2">
      <FileText className="w-4 h-4" style={{ color: 'hsl(var(--accent-indigo))' }} />
      <h3 className="text-[14px] font-semibold leading-[120%] text-foreground">Commission Breakdown</h3>
    </div>
  );

  return (
    <>
      <DealTimeline currentStatus={localTranchStatus} reportDate={tranche.reportDate} paymentDate={undefined} />

      {/* Commission — visible once tranche is at pending-agent-approval or beyond */}
      {showCommission && (
        isExpandable ? (
          <Collapsible>
            <div className="bg-card rounded-2xl overflow-hidden">
              <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-[hsl(var(--surface-raised))] transition-colors">
                <div className="flex items-center gap-3">
                  {commissionHeader}
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
                    style={{ backgroundColor: 'hsl(var(--accent-indigo) / 0.1)', color: 'hsl(var(--accent-indigo))' }}>
                    {deal.currency}{personalCommission.toLocaleString()}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-[hsl(var(--fg-secondary))] transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>{commissionContent}</CollapsibleContent>
            </div>
          </Collapsible>
        ) : (
          <div className="bg-card rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border-ds-primary">{commissionHeader}</div>
            {commissionContent}
          </div>
        )
      )}

      {/* Missing info + documents — pending-details only */}
      {localTranchStatus === 'pending-details' && (
        <MissingInfoSection
          deal={{ ...deal, status: localTranchStatus } as any}
          documents={documents}
          uploadedDocs={uploadedDocs}
          onUploadDoc={handleUpload}
          onInfoSubmitted={() => setLocalTrancheStatus('under-review')}
          onAddComment={addComment}
        />
      )}

      {/* Attached documents — all statuses except pending-details */}
      {localTranchStatus !== 'pending-details' && (() => {
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
                    <p className="text-[14px] font-semibold text-foreground leading-[120%]">Attached Documents</p>
                    <p className="text-[12px] text-[hsl(var(--fg-secondary))] leading-[140%] mt-0.5">{uploadedCount} of {totalCount} uploaded</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {uploadedCount === totalCount ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[hsl(var(--ds-green)/0.1)] text-[hsl(var(--ds-green))]">
                      <CheckCircle2 className="w-3 h-3" />Complete
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[hsl(var(--ds-orange)/0.1)] text-[hsl(var(--ds-orange))]">
                      <AlertTriangle className="w-3 h-3" />{totalCount - uploadedCount} pending
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
                      const aUp = a.doc.uploaded || uploadedDocs.has(a.originalIndex);
                      const bUp = b.doc.uploaded || uploadedDocs.has(b.originalIndex);
                      if (aUp === bUp) return 0; return aUp ? 1 : -1;
                    })
                    .map(({ doc, originalIndex }) => {
                      const isUploaded = doc.uploaded || uploadedDocs.has(originalIndex);
                      return (
                        <DocumentRow key={originalIndex} name={doc.name} isUploaded={isUploaded}
                          uploadedFileName={isUploaded ? `${doc.name}.pdf` : undefined}
                          onUpload={() => handleUpload(originalIndex, doc.name)}
                          onDownload={() => {}} onReplace={() => handleUpload(originalIndex, doc.name)} onDelete={() => {}} />
                      );
                    })}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })()}

      {/* Invoices */}
      {invoiceDocs.length > 0 && (
        <Collapsible defaultOpen>
          <div className="bg-card rounded-2xl overflow-hidden">
            <CollapsibleTrigger className="w-full px-5 py-4 flex items-center justify-between hover:bg-[hsl(var(--surface-raised))] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[hsl(var(--fg-primary)/0.05)]">
                  <FileText className="w-4 h-4 text-foreground" />
                </div>
                <div className="text-left">
                  <p className="text-[14px] font-semibold text-foreground leading-[120%]">Invoices</p>
                  <p className="text-[12px] text-[hsl(var(--fg-secondary))] leading-[140%] mt-0.5">
                    {invoiceDocs.length} invoice{invoiceDocs.length === 1 ? '' : 's'} — download and share with the client
                  </p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-[hsl(var(--fg-secondary))] transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-5 pb-5 pt-1">
                {invoiceDocs.map(({ document, invoice }) => {
                  const badge = INVOICE_BADGE[invoice.status];
                  const gross = invoice.subtotal + (invoice.vatAmount ?? 0);
                  return (
                    <div key={document.id} className="flex items-center justify-between py-3 border-b border-[hsl(var(--border-ds-primary))] last:border-b-0">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <FileText className="w-5 h-5 shrink-0 text-[hsl(var(--fg-secondary))]" />
                        <div className="min-w-0">
                          <p className="text-[14px] leading-[140%] truncate text-foreground font-semibold">{invoice.invoiceNumber}</p>
                          <p className="text-[12px] text-[hsl(var(--fg-secondary))] leading-[140%]">
                            {invoice.currency} {gross.toLocaleString()}
                            {invoice.dueDate && invoice.status === 'issued' ? ` · due ${invoice.dueDate}` : ''}
                            {invoice.paidDate && invoice.status === 'paid' ? ` · paid ${invoice.paidDate}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 ml-3 flex items-center gap-2">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold ${badge.cls}`}>{badge.label}</span>
                        <button onClick={() => toast.success(`Downloading ${document.name}`)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[hsl(var(--surface-raised))] transition-colors text-[hsl(var(--fg-secondary))]">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}

      {/* Messages */}
      <CommentsSection comments={comments}
        canReply={localTranchStatus !== 'finalized' && localTranchStatus !== 'canceled'}
        onAddComment={addComment} />
    </>
  );
}

function CommentsSection({ comments, canReply, onAddComment }: { comments: typeof sharedDealComments; canReply: boolean; onAddComment: (text: string) => void }) {
  const [newText, setNewText] = useState('');
  if (comments.length === 0 && !canReply) return null;
  const handleSend = () => {
    const trimmed = newText.trim();
    if (!trimmed) return;
    onAddComment(trimmed);
    setNewText('');
  };
  return (
    <div className="bg-card rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border-ds-primary">
        <p className="text-[14px] font-semibold text-foreground leading-[120%]">Messages</p>
      </div>
      <div className="px-5 py-4 space-y-3">
        {comments.length === 0 ? (
          <p className="text-[13px] text-[hsl(var(--fg-secondary))]">No messages yet.</p>
        ) : (
          comments.map((c) => {
            const isAgent = c.author === 'agent';
            return (
              <div key={c.id} className={`flex gap-3 ${isAgent ? 'flex-row-reverse' : ''}`}>
                <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${isAgent ? 'bg-[hsl(var(--ds-green)/0.12)] text-[hsl(var(--ds-green))]' : 'bg-[hsl(var(--fg-secondary)/0.1)] text-[hsl(var(--fg-secondary))]'}`}>
                  {isAgent ? 'A' : 'O'}
                </div>
                <div className={`flex-1 max-w-[85%] ${isAgent ? 'items-end flex flex-col' : ''}`}>
                  <div className={`px-3 py-2 rounded-xl text-[13px] leading-[140%] ${isAgent ? 'bg-[hsl(var(--ds-green)/0.08)] text-foreground' : 'bg-[hsl(var(--surface-raised,var(--card)))] text-foreground border border-[hsl(var(--border-ds-primary))]'}`}>
                    {c.text}
                  </div>
                  <p className="text-[11px] text-[hsl(var(--fg-secondary))] mt-1">
                    {c.authorName} · {new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        {canReply && (
          <div className="flex gap-2 pt-2 border-t border-[hsl(var(--border-ds-primary))]">
            <textarea value={newText} onChange={e => setNewText(e.target.value)}
              placeholder="Reply to Ops..." rows={2}
              className="flex-1 px-3 py-2 rounded-lg border border-[hsl(var(--border-ds-primary))] bg-transparent text-[13px] leading-[140%] text-foreground placeholder:text-[hsl(var(--fg-secondary))] resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--fg-primary))]" />
            <Button size="sm" className="h-auto self-end px-4 py-2 text-[13px] rounded-xl font-semibold"
              style={{ backgroundColor: 'hsl(var(--ds-green))', color: 'white' }}
              disabled={!newText.trim()} onClick={handleSend}>
              Send
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
