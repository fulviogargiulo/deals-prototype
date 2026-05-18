import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageContainer } from '@/components/layout/page-container';
import { TrackedTitle } from '@/components/ui/tracked-title';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle2, AlertTriangle, ChevronDown, RotateCcw } from 'lucide-react';
import { DocumentRow } from '@/components/deals/document-row';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { mockDeals, agentStakeMap } from '@/data/mockDeals';
import { COMMISSION_RATES, getClientForDeal, computeAgentCommission, canTransitionDealStatus, sharedDealDocumentRequirements, sharedDealComments, buildWaterfallInput, calculateProjectedPnL, dealStatusColors } from '@huspy/shared-domain';
import { BuyBareIcon, RentBareIcon, SellBareIcon, LeaseBareIcon } from '@/components/opportunities/opportunity-bare-icons';
import { DealStatus } from '@/types';
import { toast } from 'sonner';
import { DealTimeline } from '@/components/deals/deal-timeline';
import { MissingInfoSection } from '@/components/deals/missing-info-section';

const statusLabels: Record<DealStatus, string> = {
  'pending-details': 'Pending Details',
  'under-review': 'Under Review',
  'pending-agent-approval': 'Pending Approval',
  'pending-receivables': 'Pending Receivables',
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

function getDocumentsForDeal(dealId: string) {
  return sharedDealDocumentRequirements
    .filter((r) => r.dealId === dealId)
    .map((r) => ({ name: r.label, uploaded: r.status !== 'pending' }));
}

export function DealDetails() {
  const { id } = useParams<{ id: string }>();
  const initialDeal = mockDeals.find(d => d.id === id);
  const [uploadedDocs, setUploadedDocs] = useState<Set<number>>(new Set());
  const [dealState, setDealState] = useState(initialDeal);
  const [confirmedForInvoicing, setConfirmedForInvoicing] = useState(false);
  const [reviewRequested, setReviewRequested] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [comments, setComments] = useState(() =>
    sharedDealComments.filter((c) => c.dealId === (id ?? '')).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  );
  const addComment = (text: string) => {
    setComments(prev => [...prev, {
      id: `dc-local-${Date.now()}`,
      dealId: id ?? '',
      author: 'agent' as const,
      authorName: 'Agent',
      text,
      createdAt: new Date().toISOString(),
    }]);
  };

  if (!dealState) {
    return (
      <PageContainer>
        <div className="space-y-4 animate-fade-in">
          <p className="text-[hsl(var(--fg-secondary))]">Deal not found.</p>
        </div>
      </PageContainer>
    );
  }

  const viewDeal = dealState;
  const config = typeConfig[viewDeal.type];
  const colors = statusColors[viewDeal.status];

  const handleUpload = (index: number, fileName: string) => {
    setUploadedDocs(prev => new Set(prev).add(index));
    toast.success(`"${fileName}" uploaded successfully`);
  };


  const documents = getDocumentsForDeal(viewDeal.id);

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
                {viewDeal.title}
              </h1>
              <p className="text-[14px] text-[hsl(var(--fg-secondary))] leading-[140%] capitalize mt-0.5">
                {viewDeal.type} · {viewDeal.market}{viewDeal.offerId ? <> · <span className="font-mono text-[13px]" style={{ color: 'hsl(var(--accent-indigo))' }}>{viewDeal.offerId}</span></> : null}
              </p>
            </div>
          </div>
          <span
            className="inline-flex px-3 py-1 rounded-full text-[12px] font-semibold whitespace-nowrap"
            style={{ backgroundColor: colors.bg, color: colors.color }}
          >
            {statusLabels[viewDeal.status]}
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
              {viewDeal.currency}{viewDeal.dealAmount.toLocaleString()}
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
                <Link to={`/clients/${getClientForDeal(viewDeal.id)?.id ?? ''}`} className="text-[16px] font-semibold leading-[120%] mt-0.5 hover:underline" style={{ color: 'hsl(var(--accent-indigo))' }}>{viewDeal.clientName}</Link>
              </div>
              <div>
                <p className="text-[12px] text-[hsl(var(--fg-secondary))] leading-[140%]">Report Date</p>
                <p className="text-[16px] font-semibold text-foreground leading-[120%] mt-0.5">
                  {new Date(viewDeal.reportDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              {viewDeal.status === 'finalized' && viewDeal.paymentDate && (
                <div>
                  <p className="text-[12px] text-[hsl(var(--fg-secondary))] leading-[140%]">Payment Date</p>
                  <p className="text-[16px] font-semibold text-foreground leading-[120%] mt-0.5">
                    {new Date(viewDeal.paymentDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Deal Timeline */}
        <DealTimeline currentStatus={viewDeal.status} reportDate={viewDeal.reportDate} paymentDate={viewDeal.paymentDate} />


        {/* Commission Breakdown — visible once deal is approved or further along */}
        {['pending-agent-approval', 'pending-receivables', 'finalized'].includes(viewDeal.status) && (() => {
          const stake = agentStakeMap.get(viewDeal.id);
          const waterfallInput = buildWaterfallInput(viewDeal);
          const projection = waterfallInput ? calculateProjectedPnL(waterfallInput) : null;
          const agentSplit = projection?.splits.find(s => s.partyId === stake?.partyId);
          const personalCommission = agentSplit?.agentPayout ?? computeAgentCommission(viewDeal.commissionAmount, stake);
          const splitPct = stake?.splitPercentage ?? 100;
          const isExpandable = viewDeal.status !== 'pending-agent-approval';

          const content = (
            <>
              {/* Breakdown rows — waterfall engine output */}
              <div className="divide-y divide-border-ds-primary">
                <div className="grid grid-cols-[1fr_120px] px-4 py-2.5 items-center gap-3">
                  <span className="text-[12px] text-fg-secondary leading-[140%]">Deal Price</span>
                  <span className="text-[12px] font-semibold text-foreground text-right tabular-nums">{viewDeal.currency}{viewDeal.dealAmount.toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-[1fr_120px] px-4 py-2.5 items-center gap-3">
                  <span className="text-[12px] text-fg-secondary leading-[140%]">Gross Revenue</span>
                  <span className="text-[12px] font-semibold text-right tabular-nums" style={{ color: 'hsl(var(--ds-green))' }}>{viewDeal.currency}{(projection?.grossRevenue ?? viewDeal.huspyRevenue).toLocaleString()}</span>
                </div>
                {projection && projection.totalBucketD > 0 && (
                  <div className="grid grid-cols-[1fr_120px] px-4 py-2.5 items-center gap-3">
                    <span className="text-[12px] text-fg-secondary leading-[140%]">Operational Deductions</span>
                    <span className="text-[12px] font-semibold text-right tabular-nums" style={{ color: 'hsl(var(--ds-red))' }}>−{viewDeal.currency}{projection.totalBucketD.toLocaleString()}</span>
                  </div>
                )}
                {projection && projection.totalBucketD > 0 && (
                  <div className="grid grid-cols-[1fr_120px] px-4 py-2.5 items-center gap-3">
                    <span className="text-[12px] text-fg-secondary leading-[140%]">Net Revenue</span>
                    <span className="text-[12px] font-semibold text-foreground text-right tabular-nums">{viewDeal.currency}{projection.netRevenue.toLocaleString()}</span>
                  </div>
                )}
                {splitPct < 100 && (
                  <div className="grid grid-cols-[1fr_120px] px-4 py-2.5 items-center gap-3">
                    <span className="text-[12px] text-fg-secondary leading-[140%]">Your Deal Split</span>
                    <span className="text-[12px] font-semibold text-foreground text-right tabular-nums">{splitPct}%</span>
                  </div>
                )}
                <div className="grid grid-cols-[1fr_120px] px-4 py-2.5 items-center gap-3">
                  <span className="text-[12px] text-fg-secondary leading-[140%]">Your Commission Rate</span>
                  <span className="text-[12px] font-semibold text-foreground text-right tabular-nums">
                    {agentSplit?.strategyKind === "flat" && agentSplit.allocatedNet > 0
                      ? `${Math.round((agentSplit.agentPayout / agentSplit.allocatedNet) * 100)}%`
                      : `${COMMISSION_RATES.agentGrossRate}%`}
                  </span>
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-border-ds-primary px-4 py-3 flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-foreground">Your Commission Payout</span>
                  <span className="text-[20px] font-semibold text-foreground ml-3 tabular-nums">{viewDeal.currency}{personalCommission.toLocaleString()}</span>
                </div>
                {viewDeal.status === 'pending-agent-approval' && !confirmedForInvoicing && !reviewRequested && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 rounded-full text-xs"
                      style={{ color: 'hsl(var(--ds-orange))' }}
                      onClick={() => setShowReviewForm(true)}
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" />
                      Request Review
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 rounded-full text-xs"
                      style={{ backgroundColor: 'hsl(var(--ds-green))', color: 'white' }}
                      onClick={() => {
                        if (!canTransitionDealStatus(viewDeal.status, 'pending-receivables')) {
                          toast.error('This deal cannot move to Pending Receivables from the current status.');
                          return;
                        }
                        setDealState(prev => prev ? { ...prev, status: 'pending-receivables' } : prev);
                        setConfirmedForInvoicing(true);
                        toast.success('Deal confirmed and moved to Pending Receivables');
                      }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Confirm
                    </Button>
                  </div>
                )}
              </div>

              {/* Review request form */}
              {showReviewForm && viewDeal.status === 'pending-agent-approval' && !confirmedForInvoicing && !reviewRequested && (
                <div className="border-t border-border-ds-primary px-4 py-3 space-y-2" style={{ backgroundColor: 'hsl(var(--ds-orange) / 0.04)' }}>
                  <p className="text-[12px] font-semibold" style={{ color: 'hsl(var(--ds-orange))' }}>
                    Explain why you're requesting a review <span style={{ color: 'hsl(var(--ds-orange))' }}>*</span>
                  </p>
                  <textarea
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="The commission amount doesn't match what we agreed..."
                    rows={2}
                    autoFocus
                    className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border-ds-primary))] bg-transparent text-[13px] leading-[140%] text-foreground placeholder:text-[hsl(var(--fg-secondary))] resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--fg-primary))]"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 rounded-full text-xs"
                      onClick={() => { setShowReviewForm(false); setReviewNote(''); }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 rounded-full text-xs"
                      style={{ backgroundColor: 'hsl(var(--ds-orange))', color: 'white' }}
                      disabled={!reviewNote.trim()}
                      onClick={() => {
                        if (!canTransitionDealStatus(viewDeal.status, 'under-review')) {
                          toast.error('Cannot send back to Under Review from the current status.');
                          return;
                        }
                        addComment(reviewNote.trim());
                        setDealState(prev => prev ? { ...prev, status: 'under-review' } : prev);
                        setReviewRequested(true);
                        setShowReviewForm(false);
                        setReviewNote('');
                        toast.success('Review requested — Ops will be notified.');
                      }}
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" />
                      Submit Request
                    </Button>
                  </div>
                </div>
              )}

              {/* Confirmed message */}
              {viewDeal.status === 'pending-receivables' && confirmedForInvoicing && (
                <div className="border-t border-border-ds-primary px-4 py-3 flex items-center gap-2" style={{ backgroundColor: 'hsl(var(--ds-green) / 0.06)' }}>
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(var(--ds-green))' }} />
                  <p className="text-[12px] font-semibold leading-[140%]" style={{ color: 'hsl(var(--ds-green))' }}>
                    This deal has been added for invoicing for the coming payment cycle.
                  </p>
                </div>
              )}

              {/* Review requested message */}
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

          const header = (
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" style={{ color: 'hsl(var(--accent-indigo))' }} />
              <h3 className="text-[14px] font-semibold leading-[120%] text-foreground">
                Commission Calculation Breakdown
              </h3>
            </div>
          );

          const statusBadge = reviewRequested ? (
            <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap" style={{ backgroundColor: 'hsl(var(--ds-orange) / 0.1)', color: 'hsl(var(--ds-orange))' }}>Review Requested</span>
          ) : null;

          if (isExpandable) {
            return (
              <Collapsible>
                <div className="bg-card rounded-2xl overflow-hidden">
                  <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-[hsl(var(--surface-raised))] transition-colors">
                    <div className="flex items-center gap-3">
                      {header}
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap" style={{ backgroundColor: 'hsl(var(--accent-indigo) / 0.1)', color: 'hsl(var(--accent-indigo))' }}>
                        {viewDeal.currency}{personalCommission.toLocaleString()}
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
                {statusBadge}
              </div>
              {content}
            </div>
          );
        })()}

        {/* Missing Information + Documents (combined) — only for pending-details */}
        {viewDeal.status === 'pending-details' && (
          <MissingInfoSection
            deal={viewDeal}
            documents={documents}
            uploadedDocs={uploadedDocs}
            onUploadDoc={handleUpload}
            onInfoSubmitted={() => setDealState(prev => prev ? { ...prev, status: 'under-review' } : prev)}
            onAddComment={addComment}
          />
        )}

        {/* Attached Documents — hidden for pending-details (merged above) */}
        {viewDeal.status !== 'pending-details' && (() => {
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
        {/* Ops ↔ Agent messages */}
        <CommentsSection comments={comments} canReply={viewDeal.status !== 'finalized' && viewDeal.status !== 'canceled'} onAddComment={addComment} />

      </div>
    </PageContainer>
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
            <textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Reply to Ops..."
              rows={2}
              className="flex-1 px-3 py-2 rounded-lg border border-[hsl(var(--border-ds-primary))] bg-transparent text-[13px] leading-[140%] text-foreground placeholder:text-[hsl(var(--fg-secondary))] resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--fg-primary))]"
            />
            <Button
              size="sm"
              className="h-auto self-end px-4 py-2 text-[13px] rounded-xl font-semibold"
              style={{ backgroundColor: 'hsl(var(--ds-green))', color: 'white' }}
              disabled={!newText.trim()}
              onClick={handleSend}
            >
              Send
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
