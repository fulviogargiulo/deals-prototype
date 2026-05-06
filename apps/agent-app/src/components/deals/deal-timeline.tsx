import { DealStatus } from '@/types';
import { Check } from 'lucide-react';

interface StatusSentence {
  text: string;
  actionText?: string;
  suffix?: string;
}

const statusSentences: Record<DealStatus, StatusSentence> = {
  reported: {
    text: "We\u2019ve logged your deal \u2014 we\u2019ll review it and may ask for more details.",
  },
  'pending-details': {
    text: 'We need a bit more info \u2014 ',
    actionText: 'provide the requested details',
    suffix: ' so we can move forward.',
  },
  'under-review': {
    text: "We\u2019re reviewing the details \u2014 once verified, we\u2019ll approve it for invoicing.",
  },
  'ready-for-invoicing': {
    text: "We\u2019ve approved this deal \u2014 ",
    actionText: 'confirm for invoicing',
    suffix: ' to proceed.',
  },
  'pending-receivables': {
    text: "We\u2019ve sent the invoice to the buyer \u2014 we\u2019re now collecting payment.",
  },
  'pending-payment': {
    text: "We\u2019re transferring the commission to your account.",
  },
  paid: {
    text: "We\u2019ve paid your commission.",
  },
  canceled: {
    text: '',
  },
};

const timelineSteps: { status: DealStatus; label: string }[] = [
  { status: 'reported', label: 'Reported' },
  { status: 'pending-details', label: 'Pending Details' },
  { status: 'under-review', label: 'Under Review' },
  { status: 'ready-for-invoicing', label: 'Invoicing' },
  { status: 'pending-receivables', label: 'Receivables' },
  { status: 'pending-payment', label: 'Payment' },
  { status: 'paid', label: 'Paid' },
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
  const isCanceled = currentStatus === 'canceled';
  const currentIndex = isCanceled ? -1 : getStepIndex(currentStatus);
  const stepCount = timelineSteps.length;
  const sentence = statusSentences[currentStatus];

  const gridCols = Array.from({ length: stepCount * 2 - 1 }, (_, i) =>
    i % 2 === 0 ? 'auto' : '1fr'
  ).join(' ');

  return (
    <div className="bg-card rounded-2xl px-5 py-4">
      <p className="text-[12px] font-semibold text-[hsl(var(--fg-secondary))] leading-[140%] uppercase tracking-wide mb-4">
        Deal Progress
      </p>

      <div className="grid items-center gap-y-1.5" style={{ gridTemplateColumns: gridCols }}>
        {/* Row 1: Nodes + Connectors */}
        {timelineSteps.map((step, i) => {
          const isTerminal = currentStatus === 'paid';
          const isCompleted = !isCanceled && (i < currentIndex || (isTerminal && i === currentIndex));
          const isCurrent = !isCanceled && !isTerminal && i === currentIndex;

          return (
            <div key={step.status} className="contents">
              <div className="flex items-center justify-center">
                <div className="relative flex items-center justify-center w-6 h-6">
                  {isCurrent && (
                    <div
                      className="absolute -inset-1 rounded-full animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]"
                      style={{ backgroundColor: 'hsl(var(--ds-green) / 0.15)' }}
                    />
                  )}
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center relative z-10"
                    style={
                      isCompleted || isCurrent
                        ? { backgroundColor: 'hsl(var(--ds-green))' }
                        : { backgroundColor: 'hsl(var(--surface-raised))' }
                    }
                  >
                    {isCompleted ? (
                      <Check className="w-3 h-3 text-white" />
                    ) : isCurrent ? (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--fg-disabled))]" />
                    )}
                  </div>
                </div>
              </div>

              {i < stepCount - 1 && (
                <div
                  className="h-[2px] rounded-full"
                  style={{
                    backgroundColor: isCompleted
                      ? 'hsl(var(--ds-green))'
                      : 'hsl(var(--border))',
                  }}
                />
              )}
            </div>
          );
        })}

        {/* Row 2: Labels */}
        {timelineSteps.map((step, i) => {
          const isTerminal = currentStatus === 'paid';
          const isCompleted = !isCanceled && (i < currentIndex || (isTerminal && i === currentIndex));

          return (
            <div key={`label-${step.status}`} className="contents">
              <span
                className="text-[10px] font-semibold leading-[130%] text-center whitespace-nowrap"
                style={{
                  color: isCompleted
                    ? 'hsl(var(--ds-green))'
                    : 'hsl(var(--fg-disabled))',
                }}
              >
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
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'hsl(var(--ds-red) / 0.1)' }}
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(var(--ds-red))' }} />
          </div>
          <span className="text-[12px] font-semibold leading-[140%]" style={{ color: 'hsl(var(--ds-red))' }}>
            This deal has been canceled
          </span>
        </div>
      )}

      {/* Single contextual sentence */}
      {!isCanceled && sentence.text && (
        <p className="mt-3 text-[12px] font-normal leading-[140%]" style={{ color: 'hsl(var(--fg-secondary))' }}>
          {sentence.actionText ? (
            <>
              {sentence.text}
              <span className="font-semibold" style={{ color: 'hsl(var(--fg-primary))' }}>
                {sentence.actionText}
              </span>
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
