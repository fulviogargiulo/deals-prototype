import { useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Clock, ChevronLeft, ChevronRight, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OpportunityBareIcons } from "@/components/opportunities/opportunity-bare-icons";
import { OpportunityType } from "@/types";
import { cn } from "@/lib/utils";

/** Parse "2h 15m" style countdown into total seconds */
function parseCountdownToSeconds(countdown: string): number {
  let total = 0;
  const hMatch = countdown.match(/(\d+)\s*h/);
  const mMatch = countdown.match(/(\d+)\s*m/);
  if (hMatch) total += parseInt(hMatch[1]) * 3600;
  if (mMatch) total += parseInt(mMatch[1]) * 60;
  return total;
}

/** Format seconds into HH:MM:SS */
function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "00:00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Compute absolute deadlines once on module load so they never reset
const deadlineCache = new Map<string, number>();
function getDeadlineMs(cardId: string, countdown: string): number {
  if (!deadlineCache.has(cardId)) {
    deadlineCache.set(cardId, Date.now() + parseCountdownToSeconds(countdown) * 1000);
  }
  return deadlineCache.get(cardId)!;
}

/** Hook that counts down based on an absolute deadline derived from card id + countdown string */
function useCountdown(cardId?: string, countdown?: string) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!countdown) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [!!countdown]);

  if (!cardId || !countdown) return null;
  const deadline = getDeadlineMs(cardId, countdown);
  const remaining = Math.max(0, Math.floor((deadline - now) / 1000));
  return formatCountdown(remaining);
}

export type ActionCardVariant = 'opportunity' | 'deals';

const dealsIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'confirm-deals': Clock,
  'pending-info': AlertCircle,
  'statement': FileText,
};

export interface ActionCard {
  id: string;
  type: OpportunityType;
  badges: { label: string; variant: 'type' | 'source' }[];
  clientName: string;
  description: string;
  countdown?: string;
  /** Card variant — defaults to 'opportunity' */
  cardVariant?: ActionCardVariant;
  /** Custom CTA label for non-opportunity cards */
  ctaLabel?: string;
  /** Custom icon key for deals cards */
  iconKey?: string;
}

export interface ActionCardStackHandle {
  goNext: () => void;
  goPrev: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}

interface ActionCardStackProps {
  cards: ActionCard[];
  onActiveCardChange?: (card: ActionCard) => void;
  /** Compact variant: no side arrows, no dots, CTA shows countdown */
  variant?: 'default' | 'compact';
  /** Called when the Review CTA is clicked */
  onReview?: (card: ActionCard) => void;
}

export const ActionCardStack = forwardRef<ActionCardStackHandle, ActionCardStackProps>(function ActionCardStack({ cards, onActiveCardChange, variant = 'default', onReview }, ref) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Clamp active index when cards change
  useEffect(() => {
    if (activeIndex >= cards.length) {
      setActiveIndex(Math.max(0, cards.length - 1));
    }
  }, [cards.length, activeIndex]);

  const scrollToCard = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, cards.length - 1));
    if (!scrollRef.current) return;
    const children = scrollRef.current.children;
    if (children[clamped]) {
      (children[clamped] as HTMLElement).scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
      setActiveIndex(clamped);
      onActiveCardChange?.(cards[clamped]);
    }
  }, [cards, onActiveCardChange]);

  const goNext = useCallback(() => scrollToCard(activeIndex + 1), [activeIndex, scrollToCard]);
  const goPrev = useCallback(() => scrollToCard(activeIndex - 1), [activeIndex, scrollToCard]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const scrollLeft = container.scrollLeft;
    const cardWidth = container.children[0]?.clientWidth || 1;
    const gap = 12;
    const index = Math.round(scrollLeft / (cardWidth + gap));
    const newIndex = Math.min(index, cards.length - 1);
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
      onActiveCardChange?.(cards[newIndex]);
    }
  }, [cards, activeIndex, onActiveCardChange]);

  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex < cards.length - 1;

  // Expose navigation to parent
  useImperativeHandle(ref, () => ({
    goNext,
    goPrev,
    canGoNext,
    canGoPrev,
  }), [goNext, goPrev, canGoNext, canGoPrev]);

  const isCompact = variant === 'compact';

  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-white/60 text-sm font-semibold">All caught up! 🎉</p>
      </div>
    );
  }

  // Single card — no carousel needed
  if (cards.length === 1) {
    return (
      <div className={cn("w-full mx-auto", !isCompact && "max-w-[560px]")}>
        {renderCard(cards[0], true)}
      </div>
    );
  }

  return (
    <div className={cn("w-full mx-auto", !isCompact && "max-w-[560px]")}>
      {/* Header with navigation arrows */}
      {!isCompact && (
        <div className="flex items-center justify-end gap-1 mb-3">
          <button
            onClick={goPrev}
            disabled={!canGoPrev}
            className="w-7 h-7 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm hover:bg-white/30 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={goNext}
            disabled={!canGoNext}
            className="w-7 h-7 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm hover:bg-white/30 disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>
      )}

      {/* Scroll-snap carousel */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {cards.map((card) => (
          <div
            key={card.id}
            className="snap-start"
            style={{ minWidth: isCompact ? "100%" : "85%", maxWidth: isCompact ? "100%" : "85%" }}
          >
            {renderCard(card, true)}
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      <div className={cn("flex items-center justify-center gap-1.5", isCompact ? "mt-3" : "mt-4")}>
        {cards.map((card, index) => (
          <button
            key={card.id}
            onClick={() => scrollToCard(index)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              index === activeIndex
                ? "bg-white w-4"
                : "bg-white/30 w-1.5"
            )}
          />
        ))}
      </div>
    </div>
  );

  function renderCard(card: ActionCard, isTop: boolean) {
    const isDeals = card.cardVariant === 'deals';
    const DealsIcon = card.iconKey ? dealsIconMap[card.iconKey] : null;

    return (
      <div
        className={cn(
          "rounded-2xl p-4 sm:p-7 backdrop-blur-xl border border-white/10",
          "bg-white/[0.12]",
          isTop && "cursor-pointer"
        )}
      >
        {/* Badges row */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
          >
            <span style={{ color: 'white' }}>
              {isDeals && DealsIcon ? (
                <DealsIcon className="w-3.5 h-3.5" />
              ) : (
                OpportunityBareIcons[card.type] && (() => {
                  const BareIcon = OpportunityBareIcons[card.type];
                  return <BareIcon />;
                })()
              )}
            </span>
            <span className="text-xs font-semibold leading-[120%] text-white">
              {card.badges[0]?.label}
            </span>
          </div>

          {card.badges[1] && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full ml-auto"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            >
              <span className="text-xs font-semibold leading-[120%] text-white">
                {card.badges[1].label}
              </span>
            </div>
          )}

          {!isCompact && card.countdown && (
            <div className="ml-auto flex items-center gap-1 text-white/70">
              <Clock className="w-3 h-3" />
              <span className="text-xs font-semibold">{card.countdown}</span>
            </div>
          )}
        </div>

        {/* Content row: title/description + CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white leading-heading mb-1 truncate">
              {card.clientName}
            </h3>
            <p className="text-sm text-white/70 leading-body line-clamp-1">
              {card.description}
            </p>
          </div>

          {/* CTA */}
          <ReviewCTA cardId={card.id} countdown={card.countdown} isCompact={isCompact} onReview={() => onReview?.(card)} ctaLabel={card.ctaLabel} />
        </div>
      </div>
    );
  }
});

function ReviewCTA({ cardId, countdown, isCompact, onReview, ctaLabel }: { cardId: string; countdown?: string; isCompact: boolean; onReview?: () => void; ctaLabel?: string }) {
  const formattedCountdown = useCountdown(cardId, countdown);
  const label = ctaLabel || 'Review';

  return (
    <Button
      size="sm"
      className={cn(
        "bg-white hover:bg-white/90 rounded-full gap-0 font-semibold shrink-0",
        isCompact ? "px-6 py-5 text-base" : ""
      )}
      onClick={(e) => { e.stopPropagation(); onReview?.(); }}
    >
      {countdown && formattedCountdown ? (
        <>
          <span className="text-foreground font-semibold leading-heading">{label}</span>
          <span className="text-muted-foreground font-semibold leading-heading mx-1.5">·</span>
          <span className="text-muted-foreground font-semibold leading-heading tabular-nums">{formattedCountdown}</span>
        </>
      ) : (
        <span className="text-foreground font-semibold leading-heading">{label}</span>
      )}
    </Button>
  );
}
