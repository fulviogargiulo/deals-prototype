import { sharedAgents } from '@huspy/shared-domain';
import type { PnlEntry, ProjectedPnL } from '@huspy/shared-domain';
import type { Deal } from '@/types';

type AgentSplit = ProjectedPnL['splits'][number];

const CURRENCY_SYMBOLS: Record<string, string> = { EUR: '€', AED: 'د.إ', SAR: '﷼' };

function fmt(amount: number, currency: string): string {
  const sym = CURRENCY_SYMBOLS[currency] ?? `${currency} `;
  return `${sym}${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-[10px] font-semibold text-muted-foreground px-4 pt-3 pb-0.5">
      {children}
    </p>
  );
}

function Row({
  label, sublabel, value, green, red, muted, indent,
}: {
  label: string; sublabel?: string; value: string;
  green?: boolean; red?: boolean; muted?: boolean; indent?: boolean;
}) {
  const valueClass = green
    ? 'text-tier-success'
    : red
    ? 'text-tier-danger'
    : muted
    ? 'text-muted-foreground'
    : 'text-foreground';
  return (
    <div className={`flex items-start justify-between gap-4 py-2 ${indent ? 'pl-8 pr-4' : 'px-4'}`}>
      <div className="min-w-0">
        <p className="text-[13px] text-muted-foreground leading-[140%]">{label}</p>
        {sublabel && <p className="text-[11px] text-muted-foreground/60 leading-[130%]">{sublabel}</p>}
      </div>
      <span className={`text-[13px] font-semibold tabular-nums shrink-0 ${valueClass}`}>{value}</span>
    </div>
  );
}

function Anchor({ label, value, currency }: { label: string; value: number; currency: string }) {
  return (
    <div className="px-4 py-2.5 border-t border-border flex items-center justify-between mt-0.5">
      <span className="text-[13px] font-semibold text-foreground">{label}</span>
      <span className="text-[15px] font-semibold text-foreground tabular-nums">{fmt(value, currency)}</span>
    </div>
  );
}

interface Props {
  deal: Deal;
  stake: PnlEntry | undefined;
  projection: ProjectedPnL | null;
  agentSplit: AgentSplit | undefined;
  personalCommission: number;
}

export function CommissionBreakdown({ deal, stake, projection, agentSplit, personalCommission }: Props) {
  const currency = deal.currency ?? 'AED';

  const revenueLines = projection?.ledger.filter(e => e.id.startsWith('gross::')) ?? [];
  const acqLines = projection?.ledger.filter(e => e.bucket === 'acquisition-cost') ?? [];
  const opLines = projection?.ledger.filter(e => e.bucket === 'operational-cost') ?? [];
  const borneCosts = agentSplit?.agentSourcedDeductions ?? [];
  const agentBorneCostsTotal = borneCosts.reduce((s, d) => s + d.amount, 0);
  const agentGrossPayout = personalCommission + agentBorneCostsTotal;

  const splitPct = stake?.splitPercentage ?? 100;
  const allocatedNet = agentSplit?.allocatedNet ?? 0;

  let rateLabel = '—';
  let rateSublabel: string | undefined;
  if (agentSplit && allocatedNet > 0) {
    if (agentSplit.strategyKind === 'flat') {
      rateLabel = `${Math.round((agentGrossPayout / allocatedNet) * 100)}% of your share of net revenue`;
    } else if (agentSplit.strategyKind === 'slab') {
      rateLabel = 'Tiered slab';
    } else if (agentSplit.strategyKind === 'max') {
      rateLabel = 'Capped';
    }
  }

  const agentRecord = stake ? sharedAgents.find(a => a.partyId === stake.partyId) : undefined;

  return (
    <div>

      {/* Revenue Sources */}
      {revenueLines.length > 0 && (
        <>
          <SectionLabel>Revenue Sources</SectionLabel>
          {revenueLines.map(line => (
            <Row
              key={line.id}
              label={line.label}
              value={`${line.side === 'DEBIT' ? '−' : '+'}${fmt(line.amount, currency)}`}
              green={line.side === 'CREDIT'}
              red={line.side === 'DEBIT'}
              indent
            />
          ))}
        </>
      )}

      {/* Gross Revenue anchor */}
      {projection && (
        <Anchor label="Gross Revenue" value={projection.grossRevenue} currency={currency} />
      )}

      {/* Acquisition Costs (bucket C — reduce net revenue) */}
      {acqLines.length > 0 && (
        <>
          <SectionLabel>Acquisition Costs</SectionLabel>
          {acqLines.map(line => (
            <Row
              key={line.id}
              label={line.label}
              sublabel="Co-broker / referral fee"
              value={`−${fmt(line.amount, currency)}`}
              red
              indent
            />
          ))}
          <Anchor label="Net Revenue" value={projection?.commissionBase ?? 0} currency={currency} />
        </>
      )}

      {/* Operational Costs (bucket D — Huspy-borne, informational) */}
      {opLines.length > 0 && (
        <>
          <SectionLabel>Deal Costs</SectionLabel>
          {opLines.map(line => (
            <Row
              key={line.id}
              label={line.label}
              sublabel="Borne by Huspy · does not affect your payout"
              value={`−${fmt(line.amount, currency)}`}
              muted
              indent
            />
          ))}
        </>
      )}

      {/* Your payout derivation */}
      {splitPct < 100 && (
        <>
          <SectionLabel>Your Share</SectionLabel>
          <Row
            label="Pool allocation"
            value={`${splitPct}%`}
            indent
          />
          {agentSplit && (
            <Row
              label="Allocated share"
              value={fmt(allocatedNet, currency)}
              indent
            />
          )}
        </>
      )}

      {/* Agent-borne costs (deducted from agent's gross before arriving at net) */}
      {borneCosts.length > 0 && (
        <>
          <SectionLabel>Costs charged to you</SectionLabel>
          {borneCosts.map(cost => (
            <Row
              key={cost.partyId}
              label={cost.label}
              value={`−${fmt(cost.amount, currency)}`}
              red
              indent
            />
          ))}
        </>
      )}

      {/* Payout total */}
      <div className="mx-4 border-t border-border mt-1 pt-3 pb-3 flex items-center justify-between">
        <div>
          <p className="text-[15px] font-semibold text-foreground">Your Commission</p>
          {rateLabel !== '—' && (
            <p className="text-[11px] text-muted-foreground/60 leading-[130%]">{rateLabel}</p>
          )}
        </div>
        <span className="text-[22px] font-semibold tabular-nums text-tier-success">
          {fmt(personalCommission, currency)}
        </span>
      </div>

      {/* Linked Agents — Huspy-borne, informational only */}
      {(agentSplit?.connectedAgentPayouts ?? []).some((cp) => cp.amount > 0) && (
        <>
          <SectionLabel>Linked Agents</SectionLabel>
          {(agentSplit?.connectedAgentPayouts ?? []).filter((cp) => cp.amount > 0).map((cp) => (
            <Row
              key={cp.agentId}
              label={cp.label}
              sublabel={`${cp.label} · paid by Huspy`}
              value={fmt(cp.amount, currency)}
              muted
              indent
            />
          ))}
        </>
      )}

    </div>
  );
}
