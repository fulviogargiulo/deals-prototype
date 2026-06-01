// Replacement for the deal-detail page header. Encapsulates:
//   • C1 — contextual transition buttons keyed off `computeDealReadiness`
//   • C2 — "Saved · HH:MM" indicator (no Save button; edits autosave)
//   • C3 — readiness strip explaining what blocks the next move
//   • C5 — Cancel deal lives in the overflow ⋯ menu and opens a confirm dialog

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Ban,
  Check,
  Circle,
  Clock,
  Lock,
  MessageSquare,
  MoreHorizontal,
  Undo2,
} from "lucide-react";

import type { Deal, DealStatus } from "@/data/types";
import type { DealDocumentRequirement } from "@huspy/shared-domain";
import { DealStatusBadge } from "@/components/DealBadges";
import { CancelDealDialog } from "@/components/CancelDealDialog";
import {
  computeDealReadiness,
  type DealReadiness,
  type ReadinessAction,
} from "@/lib/dealReadiness";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  deal: Deal;
  status: DealStatus;
  pnlPendingApproval: boolean;
  pnlHasChanges: boolean;
  docs: DealDocumentRequirement[];
  clientName: string;
  amountLabel: string;
  ageInStage?: string;
  savedAt?: string;
  onTransition: (to: DealStatus, opts?: { reason?: string }) => void;
}

export function DealHeader(props: Props) {
  const {
    deal,
    status,
    pnlPendingApproval,
    pnlHasChanges,
    docs,
    clientName,
    amountLabel,
    ageInStage,
    savedAt,
    onTransition,
  } = props;

  const navigate = useNavigate();
  const readiness = computeDealReadiness({ deal, status, docs, pnlPendingApproval, pnlHasChanges });
  const [cancelOpen, setCancelOpen] = useState(false);

  const canCancel = status !== "finalized" && status !== "canceled";
  const isREBU = deal.businessUnit === "rebu";

  const fireAction = (action: ReadinessAction) => onTransition(action.to);

  const primary = readiness.primary;
  const primaryEnabled = primary ? (readiness.mode === "ready" || readiness.mode === "waiting") : false;

  return (
    <>
      <header className="sticky top-0 z-20 bg-card border-b border-border">
        <div className="flex items-center justify-between gap-6 px-6 h-14">
          {/* Left: back + deal context */}
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => navigate("/deals")}
              className="p-1.5 rounded text-muted-foreground hover:bg-muted transition-colors"
              aria-label="Back to deals"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-[13px] font-semibold text-foreground">{deal.id}</span>
                <DealStatusBadge status={status} />
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${
                    isREBU
                      ? "bg-blue-500/15 text-blue-700"
                      : "bg-emerald-500/15 text-emerald-700"
                  }`}
                >
                  {deal.businessUnit?.toUpperCase()}
                </span>
                {ageInStage && (
                  <span className="text-[11.5px] text-muted-foreground font-medium">· {ageInStage}</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground truncate">
                <span className="text-foreground/80 font-medium truncate">{clientName}</span>
                <Dot />
                <span>{amountLabel}</span>
                {deal.market && (
                  <>
                    <Dot />
                    <span>
                      {deal.market} · {deal.country?.toUpperCase()}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: action bar */}
          <div className="flex items-center gap-2 shrink-0">
            {savedAt && (
              <span className="hidden md:inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground font-medium mr-1">
                <Check className="h-3.5 w-3.5 text-muted-foreground/70" strokeWidth={2.5} />
                Saved · {savedAt}
              </span>
            )}
            {readiness.secondary && (
              <button
                onClick={() => fireAction(readiness.secondary!)}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[13px] font-semibold border border-border bg-card text-foreground hover:bg-muted transition-colors"
              >
                {readiness.secondary.icon === "undo" && <Undo2 className="h-3.5 w-3.5" />}
                {readiness.secondary.icon === "msg" && <MessageSquare className="h-3.5 w-3.5" />}
                {readiness.secondary.label}
              </button>
            )}
            {primary && (
              <button
                onClick={() => fireAction(primary)}
                disabled={!primaryEnabled}
                title={primaryEnabled ? undefined : readiness.disabledReason}
                className={`inline-flex items-center gap-1.5 h-8 px-3.5 rounded-md text-[13px] font-semibold transition-opacity ${
                  primaryEnabled
                    ? "bg-primary text-primary-foreground hover:opacity-90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                {primary.label}
                {primaryEnabled && <ArrowRight className="h-3.5 w-3.5" />}
              </button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger
                className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:bg-muted transition-colors"
                aria-label="More actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {canCancel && (
                  <>
                    <DropdownMenuItem
                      onClick={() => setCancelOpen(true)}
                      className="text-destructive focus:text-destructive cursor-pointer"
                    >
                      <Ban className="h-3.5 w-3.5 mr-2" />
                      Cancel deal…
                    </DropdownMenuItem>
                  </>
                )}
                {!canCancel && (
                  <DropdownMenuItem disabled>No actions available</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <ReadinessStrip readiness={readiness} />
      </header>

      <CancelDealDialog
        open={cancelOpen}
        deal={deal}
        onClose={() => setCancelOpen(false)}
        onConfirm={(reason) => {
          setCancelOpen(false);
          onTransition("canceled", { reason });
        }}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────

function ReadinessStrip({ readiness }: { readiness: DealReadiness }) {
  const palette = MODE_PALETTE[readiness.mode];
  const Icon = palette.icon;

  const scrollTo = (targetId: string) => {
    const el = document.getElementById(targetId);
    if (!el) return;
    const headerOffset = 120; // sticky header (chrome + readiness strip)
    const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <div className={`border-b border-border px-6 py-3 ${palette.bg}`}>
      <div className="flex items-start gap-3">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-white/60 ${palette.text}`}>
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <span className={`text-[13.5px] font-semibold ${palette.text}`}>{readiness.headline}</span>
            {readiness.sub && (
              <span className="text-[12.5px] text-muted-foreground">{readiness.sub}</span>
            )}
          </div>
          {readiness.items.length > 0 && (
            <div className="mt-2 flex flex-col gap-1">
              {readiness.items.map((it, i) => (
                <div key={i} className="flex items-center gap-2.5 text-[12.5px]">
                  <span className="w-3.5 flex items-center justify-center">
                    {it.done ? (
                      <Check className="h-3 w-3 text-emerald-700" strokeWidth={2.5} />
                    ) : (
                      <Circle className="h-3 w-3 text-muted-foreground/40" />
                    )}
                  </span>
                  <span
                    className={
                      it.done
                        ? "flex-1 text-muted-foreground line-through decoration-muted-foreground/40"
                        : "flex-1 text-foreground"
                    }
                  >
                    {it.label}
                  </span>
                  {it.cta && (
                    <button
                      onClick={() => scrollTo(it.cta!.targetId)}
                      className="text-[12px] text-primary font-medium hover:underline inline-flex items-center gap-0.5"
                    >
                      {it.cta.label}
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const MODE_PALETTE: Record<DealReadiness["mode"], { bg: string; text: string; icon: typeof Check }> = {
  blocked:  { bg: "bg-amber-50",   text: "text-amber-800",   icon: AlertTriangle },
  ready:    { bg: "bg-emerald-50", text: "text-emerald-800", icon: Check },
  waiting:  { bg: "bg-blue-50",    text: "text-blue-800",    icon: Clock },
  locked:   { bg: "bg-muted",      text: "text-foreground",  icon: Lock },
  terminal: { bg: "bg-emerald-50", text: "text-emerald-800", icon: Check },
  canceled: { bg: "bg-red-50",     text: "text-red-700",     icon: Ban },
};

function Dot() {
  return <span className="w-1 h-1 rounded-full bg-muted-foreground/40 inline-block shrink-0" />;
}
