import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Home, ChevronLeft, ChevronRight, Settings } from "lucide-react";
import { WizardModal } from "@/components/ui/standard-modal";

import { Button } from "@/components/ui/button";
import { CountdownTimer, CountdownLabels } from "@/components/ui/countdown-timer";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { OpportunityType } from "@/types";

import idealistaLogo from "@/assets/idealista-logo.png";
import fotocasaLogo from "@/assets/fotocasa-logo-new.png";
import pisosLogo from "@/assets/pisos-logo.png";
import type { InquiryScenario } from "@/components/dev-tools/home-dev-tool";

export interface InquiryPropertyData {
  id: string;
  title: string;
  image: string;
  price: string;
  beds: number;
  isExclusive?: boolean;
  badges?: string[];
  clientNote?: string;
  source: "idealista" | "fotocasa" | "pisos" | "other";
  sourceTime: string;
}

export interface InquiryData {
  id: string;
  clientName: string;
  opportunityType: OpportunityType;
  expiresAt: string;
  properties: InquiryPropertyData[];
  /** Note shown when no properties are attached */
  note?: string;
  /** Source label for the note (e.g. "From ops portal") */
  noteSource?: string;
}

interface ReviewInquiryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inquiry: InquiryData | null;
  onAccept?: (inquiry: InquiryData) => string | void;
  onDecline?: (inquiry: InquiryData) => void;
  forceExpired?: boolean;
  /** Dev tool: switch scenario without closing modal */
  onScenarioChange?: (scenario: InquiryScenario) => void;
}

const sourceLogos: Record<string, string> = {
  idealista: idealistaLogo,
  fotocasa: fotocasaLogo,
  pisos: pisosLogo,
};

const typeLabels: Record<string, string> = {
  buy: "buying",
  rent: "renting",
};

const accentColors: Record<string, string> = {
  buy: "#006D77",
  rent: "#3F3FB4",
};

type CardStyle = 'compact' | 'expanded' | 'fitted';

function PropertyCard({
  property,
  onNavigate,
  cardStyle = 'compact',
}: {
  property: InquiryPropertyData;
  onNavigate: (id: string) => void;
  cardStyle?: CardStyle;
}) {
  const [noteExpanded, setNoteExpanded] = useState(false);
  const sourceLogo = sourceLogos[property.source];
  const sourceLabel = property.source.charAt(0).toUpperCase() + property.source.slice(1);

  const noteSection = property.clientNote && (
    <div className="px-4 pb-3">
      <div
        className="rounded-xl p-3.5"
        style={{ backgroundColor: '#F4F4F4' }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-semibold leading-body text-muted-foreground mb-1">
          Client's note
        </p>
        <p className={cn("text-sm leading-body", !noteExpanded && "line-clamp-2")}>
          {property.clientNote}
        </p>
        {property.clientNote.length > 80 && (
          <button
            onClick={(e) => { e.stopPropagation(); setNoteExpanded(!noteExpanded); }}
            className="text-sm font-semibold leading-body underline underline-offset-2 mt-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            {noteExpanded ? "See less" : "See more"}
          </button>
        )}
      </div>
    </div>
  );

  const sourceSection = (
    <div
      className="px-4 pb-4 flex items-center justify-between pt-2 mx-4 border-t border-border"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2">
        {sourceLogo && (
          <img src={sourceLogo} alt={sourceLabel} className="w-5 h-5 rounded object-contain" />
        )}
        <span className="text-sm text-muted-foreground leading-body">
          Inquired from {sourceLabel}
        </span>
      </div>
      <span className="text-sm text-muted-foreground leading-body">
        {property.sourceTime}
      </span>
    </div>
  );

  if (cardStyle === 'expanded') {
    return (
      <div
        className="rounded-2xl border border-border overflow-hidden cursor-pointer hover:shadow-md transition-shadow flex-shrink-0"
        onClick={() => onNavigate(property.id)}
      >
        {/* Hero image with badge overlay */}
        <div className="relative w-full aspect-[16/6] overflow-hidden">
          <img
            src={property.image}
            alt={property.title}
            className="w-full h-full object-cover"
          />
          {property.badges && property.badges.length > 0 && (
            <div className="absolute top-3 left-3 flex gap-2">
              {property.badges.map((badge) => (
                <span
                  key={badge}
                  className="text-xs font-semibold leading-body bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1"
                >
                  <Home className="w-3 h-3" />
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Title & specs */}
        <div className="px-4 pt-4 pb-2">
          <h4 className="text-base font-semibold leading-heading line-clamp-2">
            {property.title}
          </h4>
          <p className="text-sm text-muted-foreground leading-body mt-1">
            {property.price} · {property.beds} beds
          </p>
        </div>

        {noteSection}
        {sourceSection}
      </div>
    );
  }

  // Fitted: same side-by-side layout but larger image
  if (cardStyle === 'fitted') {
    return (
      <div
        className="rounded-2xl border border-border overflow-hidden cursor-pointer hover:shadow-md transition-shadow flex-shrink-0"
        onClick={() => onNavigate(property.id)}
      >
        <div className="p-4 flex gap-4">
          <div className="relative w-28 h-28 rounded-[6px] overflow-hidden shrink-0">
            <img src={property.image} alt={property.title} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0 flex-1 flex flex-col justify-center">
            {property.badges && property.badges.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-1.5">
                {property.badges.map((badge) => (
                  <span key={badge} className="text-xs font-semibold leading-body bg-muted px-2.5 py-0.5 rounded-full">
                    {badge}
                  </span>
                ))}
              </div>
            )}
            <h4 className="text-base font-semibold leading-heading line-clamp-2">{property.title}</h4>
            <p className="text-sm text-muted-foreground leading-body mt-1">{property.price} · {property.beds} beds</p>
          </div>
        </div>

        {noteSection}
        {sourceSection}
      </div>
    );
  }

  // Compact (current) layout
  return (
    <div
      className="rounded-2xl border border-border overflow-hidden cursor-pointer hover:shadow-md transition-shadow flex-shrink-0"
      onClick={() => onNavigate(property.id)}
    >
      <div className="p-4 flex gap-3">
        <div className="relative w-16 h-16 rounded-[6px] overflow-hidden shrink-0">
          <img src={property.image} alt={property.title} className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          {property.badges && property.badges.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-1">
              {property.badges.map((badge) => (
                <span key={badge} className="text-xs font-semibold leading-body bg-muted px-2.5 py-0.5 rounded-full">
                  {badge}
                </span>
              ))}
            </div>
          )}
          <h4 className="text-sm font-semibold leading-heading line-clamp-2">{property.title}</h4>
          <p className="text-sm text-muted-foreground leading-body mt-0.5">{property.price} · {property.beds} beds</p>
        </div>
      </div>

      {noteSection}
      {sourceSection}
    </div>
  );
}

export function ReviewInquiryModal({
  open,
  onOpenChange,
  inquiry,
  onAccept,
  onDecline,
  forceExpired = false,
  onScenarioChange,
}: ReviewInquiryModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [cardStyle, setCardStyle] = useState<CardStyle>('fitted');
  const [activePropertyIndex, setActivePropertyIndex] = useState(0);

  const expired = forceExpired || isExpired;

  const handleExpire = useCallback(() => {
    setIsExpired(true);
  }, []);

  if (!inquiry) return null;

  const properties = inquiry.properties;
  const propertyCount = properties.length;
  const isMultiProperty = propertyCount > 1;

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const clientId = onAccept?.(inquiry);
      onOpenChange(false);
      if (clientId) {
        setTimeout(() => {
          navigate(`/clients/${clientId}?newOpportunity=${inquiry.opportunityType}`);
        }, 300);
      }
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    setIsDeclining(true);
    try {
      onDecline?.(inquiry);
      onOpenChange(false);
      resetState();
    } finally {
      setIsDeclining(false);
    }
  };

  const resetState = () => {
    setStep(1);
    setIsExpired(false);
    setActivePropertyIndex(0);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) resetState();
    onOpenChange(isOpen);
  };

  const handleNavigateToProperty = (propertyId: string) => {
    onOpenChange(false);
    resetState();
    navigate(`/my-properties/${propertyId}`);
  };

  const scrollToProperty = (index: number) => {
    if (!scrollRef.current) return;
    const cards = scrollRef.current.children;
    if (cards[index]) {
      (cards[index] as HTMLElement).scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
      setActivePropertyIndex(index);
    }
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const scrollLeft = container.scrollLeft;
    const cardWidth = container.children[0]?.clientWidth || 1;
    const gap = 12; // gap-3 = 12px
    const index = Math.round(scrollLeft / (cardWidth + gap));
    setActivePropertyIndex(Math.min(index, propertyCount - 1));
  };

  const typeLabel = typeLabels[inquiry.opportunityType] || inquiry.opportunityType;
  const accent = accentColors[inquiry.opportunityType] || "#1A1A1A";

  const titleText = propertyCount === 0
    ? `${inquiry.clientName} is interested in ${typeLabel} a property`
    : isMultiProperty
      ? `${inquiry.clientName} is interested in ${typeLabel} ${propertyCount} properties`
      : `${inquiry.clientName} is interested in ${typeLabel} this property`;

  const stepTitles = expired
    ? [`Access to ${inquiry.clientName} has expired`]
    : [titleText, "Decline this client?"];

  const stepDescriptions = expired
    ? [undefined]
    : ["Do you want to work with them?", undefined];

  const step1Footer = (
    <div className="flex items-center gap-3">
      <Button
        variant="secondary"
        className="flex-1 h-12 text-base font-semibold"
        onClick={() => setStep(2)}
        disabled={isAccepting}
      >
        Decline
      </Button>
      <Button
        className="flex-1 h-12 text-base font-semibold"
        onClick={handleAccept}
        disabled={isAccepting || isDeclining}
      >
        {isAccepting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Accepting...
          </>
        ) : (
          "Accept"
        )}
      </Button>
    </div>
  );

  const step2Footer = (
    <div className="flex flex-col gap-3">
      <Button
        className="w-full h-12 text-base font-semibold"
        onClick={handleDecline}
        disabled={isDeclining}
      >
        {isDeclining ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Declining...
          </>
        ) : (
          "Yes, decline"
        )}
      </Button>
      <Button
        variant="outline"
        className="w-full h-12 text-base font-semibold"
        onClick={() => setStep(1)}
        disabled={isDeclining}
      >
        Cancel
      </Button>
    </div>
  );

  const expiredFooter = (
    <Button
      className="w-full h-12 text-base font-semibold"
      onClick={() => handleOpenChange(false)}
    >
      Got it
    </Button>
  );

  const scenarioButtons: { label: string; value: InquiryScenario }[] = [
    { label: '0 Props', value: '0-props' },
    { label: '1 Prop', value: '1-prop' },
    { label: '3 Props', value: '3-props' },
    { label: 'Expired', value: 'expired' },
  ];

  const devToolHeaderAction = onScenarioChange ? (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
          <Settings className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 p-2">
        <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">Inquiry Scenario</p>
        <div className="grid grid-cols-2 gap-1">
          {scenarioButtons.map((s) => (
            <Button
              key={s.value}
              variant="ghost"
              size="sm"
              className="text-xs justify-start h-7"
              onClick={() => {
                resetState();
                onScenarioChange(s.value);
              }}
            >
              {s.label}
            </Button>
          ))}
        </div>
        <div className="border-t border-border mt-2 pt-2">
          <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">Card Style</p>
          <div className="grid grid-cols-3 gap-1">
            <Button
              variant={cardStyle === 'compact' ? 'secondary' : 'ghost'}
              size="sm"
              className="text-[10px] justify-center h-7"
              onClick={() => setCardStyle('compact')}
            >
              Compact
            </Button>
            <Button
              variant={cardStyle === 'fitted' ? 'secondary' : 'ghost'}
              size="sm"
              className="text-[10px] justify-center h-7"
              onClick={() => setCardStyle('fitted')}
            >
              Fitted
            </Button>
            <Button
              variant={cardStyle === 'expanded' ? 'secondary' : 'ghost'}
              size="sm"
              className="text-[10px] justify-center h-7"
              onClick={() => setCardStyle('expanded')}
            >
              Expanded
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ) : undefined;

  return (
    <WizardModal
      open={open}
      onOpenChange={handleOpenChange}
      currentStep={expired ? 1 : step}
      totalSteps={expired ? 1 : 2}
      stepTitles={stepTitles}
      stepDescriptions={stepDescriptions}
      size="md"
      showProgressBar={false}
      hideFooter
      showBackOnFirstStep={false}
      onBack={() => setStep(1)}
      preventClose={isAccepting || isDeclining}
      disableInternalAnimation
      hideCloseButton={expired}
      headerActions={devToolHeaderAction}
    >
      <div className="relative overflow-hidden">
        {expired ? (
          <div className="pb-4 space-y-5">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground leading-body">
                After not being accepted within a 4-hour period, the opportunity to secure {inquiry.clientName} as your client has expired.
              </p>
              <p className="text-sm text-muted-foreground leading-body">
                Stay active to maintain future opportunities in your portfolio.
              </p>
            </div>
            <div className="rounded-2xl bg-muted/50 p-5">
              <p className="text-sm font-semibold leading-body text-muted-foreground mb-4 text-center">
                Client acceptance window
              </p>
              <div className="flex flex-col items-center">
                <CountdownTimer expiresAt={new Date(0).toISOString()} variant="light" />
                <CountdownLabels variant="light" />
              </div>
            </div>
            {expiredFooter}
          </div>
        ) : (
          <>
            {/* Step 1: Review */}
            <div
              className={cn(
                "transition-all duration-500 ease-out",
                step === 1
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-full absolute inset-0 pointer-events-none h-0 overflow-hidden"
              )}
            >
              <div className="space-y-5 pb-2">
                {/* Countdown section */}
                <div
                  className="rounded-2xl p-5 text-white"
                  style={{ background: `linear-gradient(135deg, ${accent}, #1A1A1A)` }}
                >
                  <p className="text-sm font-semibold leading-body text-white/80 mb-4 text-center">
                    Accept client before it expires
                  </p>
                  <div className="flex flex-col items-center">
                    <CountdownTimer expiresAt={inquiry.expiresAt} variant="dark" onExpire={handleExpire} accentColor={accent} />
                    <CountdownLabels variant="dark" />
                  </div>
                </div>

                {/* Properties section or Note */}
                {propertyCount > 0 ? (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-semibold leading-heading">
                        {isMultiProperty ? `Properties related (${propertyCount})` : "Property related"}
                      </h3>
                      {isMultiProperty && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => scrollToProperty(Math.max(0, activePropertyIndex - 1))}
                            disabled={activePropertyIndex === 0}
                            className="w-7 h-7 rounded-full flex items-center justify-center bg-muted hover:bg-muted/80 disabled:opacity-30 transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => scrollToProperty(Math.min(propertyCount - 1, activePropertyIndex + 1))}
                            disabled={activePropertyIndex === propertyCount - 1}
                            className="w-7 h-7 rounded-full flex items-center justify-center bg-muted hover:bg-muted/80 disabled:opacity-30 transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {isMultiProperty ? (
                      <>
                        <div
                          ref={scrollRef}
                          onScroll={handleScroll}
                          className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-1"
                          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                        >
                          {properties.map((property) => (
                            <div
                              key={property.id}
                              className="snap-start"
                              style={{ minWidth: "85%", maxWidth: "85%" }}
                            >
                              <PropertyCard
                                property={property}
                                onNavigate={handleNavigateToProperty}
                                cardStyle={cardStyle}
                              />
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-center gap-1.5 mt-3">
                          {properties.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => scrollToProperty(i)}
                              className={cn(
                                "w-1.5 h-1.5 rounded-full transition-all",
                                i === activePropertyIndex
                                  ? "bg-foreground w-4"
                                  : "bg-muted-foreground/30"
                              )}
                            />
                          ))}
                        </div>
                      </>
                    ) : (
                      <PropertyCard
                        property={properties[0]}
                        onNavigate={handleNavigateToProperty}
                        cardStyle={cardStyle}
                      />
                    )}
                  </div>
                ) : inquiry.note ? (
                  /* No properties — show note */
                  <div>
                    <h3 className="text-base font-semibold leading-heading mb-3">
                      Note
                    </h3>
                    <div
                      className="rounded-2xl p-4"
                      style={{ backgroundColor: '#F4F4F4' }}
                    >
                      <p className="text-sm leading-body text-foreground">
                        {inquiry.note}
                      </p>
                      {inquiry.noteSource && (
                        <p className="text-sm text-muted-foreground leading-body mt-2">
                          {inquiry.noteSource}
                        </p>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="py-4">{step1Footer}</div>
            </div>

            {/* Step 2: Decline confirmation */}
            <div
              className={cn(
                "transition-all duration-500 ease-out",
                step === 2
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-full absolute inset-0 pointer-events-none h-0 overflow-hidden"
              )}
            >
              <div className="flex flex-col flex-1">
                <div className="flex-1 flex items-center pb-6">
                  <p className="text-sm text-foreground leading-body">
                    By confirming you will not be able to access this client again.
                  </p>
                </div>
                <div className="pb-4">{step2Footer}</div>
              </div>
            </div>
          </>
        )}
      </div>
    </WizardModal>
  );
}