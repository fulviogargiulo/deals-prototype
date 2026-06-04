import { DealStatus } from '@/types';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusSentence {
  text: string;
  actionText?: string;
  suffix?: string;
}

const statusSentences: Record<DealStatus, StatusSentence> = {
  'pending-details': {
    text: 'We need a bit more info — ',
    actionText: 'provide the requested details',
    suffix: ' so we can move forward.',
  },
  'under-review': {
    text: "We've logged your deal and are reviewing the details — once verified, we'll approve your commission.",
  },
  'pending-agent-approval': {
    text: "We've approved this deal — ",
    actionText: 'confirm your commission',
    suffix: ' to proceed.',
  },
  'invoicing': {
    text: "We've sent the invoice to the client — waiting for payment to be received.",
  },
  finalized: {
    text: "The deal is finalized and your commission has been crystallised.",
  },
  canceled: {
    text: '',
  },
};

const timelineSteps: { status: DealStatus; label: string }[] = [
  { status: 'pending-details',        label: 'Pending Details' },
  { status: 'under-review',           label: 'Under Review' },
  { status: 'pending-agent-approval', label: 'Approval' },
  { status: 'invoicing',              label: 'Invoicing' },
  { status: 'finalized',              label: 'Finalized' },
];

function getStepIndex(status: DealStatus): number {
  const idx = timelineSteps.findIndex(s => s.status === status);
  return idx === -1 ? -1 : idx;
}

interface DealTimelineProps {
  currentStatus: DealStatus;
  reportDate: string;
  paymentDate?: string;
}

export function DealTimeline({ currentStatus }: DealTimelineProps) {
  const isCanceled   = currentStatus === 'canceled';
  const currentIndex = isCanceled ? -1 : getStepIndex(currentStatus);
  const stepCount    = timelineSteps.length;
  const sentence     = statusSentences[currentStatus];

  const gridCols = Array.from({ length: stepCount * 2 - 1 }, (_, i) =>
    i % 2 === 0 ? 'auto' : '1fr'
  ).join(' ');

  return (
    <div className="bg-card rounded-2xl px-5 py-4">
      <p className="text-[12px] font-semibold text-muted-foreground leading-[140%] mb-4">
        Progress
      </p>

      <div className="grid items-center gap-y-1.5" style={{ gridTemplateColumns: gridCols }}>
        {/* Row 1: Nodes + Connectors */}
        {timelineSteps.map((step, i) => {
          const isTerminal  = currentStatus === 'finalized';
          const isCompleted = !isCanceled && (i < currentIndex || (isTerminal && i === currentIndex));
          const isCurrent   = !isCanceled && !isTerminal && i === currentIndex;

          return (
            <div key={step.status} className="contents">
              <div className="flex items-center justify-center">
                <div className="relative flex items-center justify-center w-6 h-6">
                  {isCurrent && (
                    <div className="absolute -inset-1 rounded-full bg-tier-success-bg animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
                  )}
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center relative z-10",
                    isCompleted || isCurrent ? "bg-tier-success" : "bg-secondary border border-border"
                  )}>
                    {isCompleted ? (
                      <Check className="w-3 h-3 text-white" />
                    ) : isCurrent ? (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                    )}
                  </div>
                </div>
              </div>

              {i < stepCount - 1 && (
                <div className={cn(
                  "h-[2px] rounded-full",
                  isCompleted ? "bg-tier-success" : "bg-border"
                )} />
              )}
            </div>
          );
        })}

        {/* Row 2: Labels */}
        {timelineSteps.map((step, i) => {
          const isTerminal  = currentStatus === 'finalized';
          const isCompleted = !isCanceled && (i < currentIndex || (isTerminal && i === currentIndex));
          const isCurrent   = !isCanceled && !isTerminal && i === currentIndex;

          return (
            <div key={`label-${step.status}`} className="contents">
              <span className={cn(
                "text-[10px] font-semibold leading-[130%] text-center whitespace-nowrap",
                isCompleted ? "text-tier-success" :
                isCurrent   ? "text-foreground" :
                "text-muted-foreground"
              )}>
                {step.label}
              </span>
              {i < stepCount - 1 && <div />}
            </div>
          );
        })}
      </div>

      {/* Canceled banner */}
      {isCanceled && (
        <div className="mt-3 flex items-center gap-2">
          <div className="w-5 h-5 rounded-full flex items-center justify-center bg-tier-danger-bg">
            <X className="w-3 h-3 text-tier-danger" />
          </div>
          <span className="text-[12px] font-semibold leading-[140%] text-tier-danger">
            This deal has been canceled
          </span>
        </div>
      )}

      {/* Contextual sentence */}
      {!isCanceled && sentence.text && (
        <p className="mt-3 text-[12px] font-normal leading-[140%] text-muted-foreground">
          {sentence.actionText ? (
            <>
              {sentence.text}
              <span className="font-semibold text-foreground">{sentence.actionText}</span>
              {sentence.suffix}
            </>
          ) : (
            sentence.text
          )}
        </p>
      )}
    </div>
  );
}
