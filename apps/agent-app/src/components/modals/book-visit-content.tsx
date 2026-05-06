import { useState, useRef, useEffect, useMemo, useImperativeHandle, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronDown, Search, Home, ArrowUpDown, Check } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { FloatingLabelSelect } from "@/components/ui/floating-label-select";
import { PropertySelector } from "@/components/tasks/property-selector";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useSchedule } from "@/contexts/schedule-context";
import { useData } from "@/contexts/data-context";
import { format } from "date-fns";
import { Opportunity, OpportunityType } from "@/types";
import { OpportunityBareIcons } from "@/components/opportunities/opportunity-bare-icons";
import { getOpportunityLabel } from "@/components/opportunities/opportunity-icon";
import { OpportunityTypeIconsRow, computeOpportunityTypeCounts } from "@/components/opportunities/opportunity-type-icons-row";

export type BookVisitStep = 'form' | 'client' | 'opportunity' | 'property';

export interface BookVisitContentHandle {
  goBack: () => void;
}

interface BookVisitContentProps {
  onClose: () => void;
  onStepChange?: (step: BookVisitStep) => void;
  onHeightChange?: (height: number) => void;
}

interface SelectedClient {
  id: string;
  name: string;
  phone: string;
}

interface SelectedProperty {
  id: string;
  title: string;
}

const FORM_VIEW_HEIGHT = 680;
const SELECT_VIEW_HEIGHT = 600;

const DURATION_OPTIONS = [
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '1 hour' },
  { value: '90', label: '1h 30 min' },
  { value: '120', label: '2 hours' },
];

// Badge background colors (15% opacity versions)
const badgeBgColors: Record<string, string> = {
  buy: 'rgba(0, 138, 138, 0.15)',
  rent: 'rgba(88, 86, 214, 0.15)',
  sell: 'rgba(217, 93, 40, 0.15)',
  lease: 'rgba(205, 82, 195, 0.15)',
  mortgage: 'rgba(92, 107, 79, 0.15)',
};

const iconColors: Record<string, string> = {
  buy: '#008A8A',
  rent: '#5856D6',
  sell: '#D95D28',
  lease: '#CD52C3',
  mortgage: '#5C6B4F',
};

export const BookVisitContent = forwardRef<BookVisitContentHandle, BookVisitContentProps>(function BookVisitContent({ onClose, onStepChange, onHeightChange }, ref) {
  const [currentStep, setCurrentStep] = useState<BookVisitStep>('form');
  const formRef = useRef<HTMLDivElement>(null);
  const { addActivity } = useSchedule();
  const { clients, opportunities } = useData();

  // Form state
  const [dateTime, setDateTime] = useState<{ date: Date; time: string } | null>(null);
  const [duration, setDuration] = useState("30");
  const [selectedClient, setSelectedClient] = useState<SelectedClient | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<SelectedProperty | null>(null);
  const [meetingPoint, setMeetingPoint] = useState("");
  const [reminder, setReminder] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [oppSearchQuery, setOppSearchQuery] = useState("");

  // Get client opportunities - only active buy/rent
  const clientOpportunities = useMemo(() => {
    if (!selectedClient) return [];
    return opportunities.filter(o =>
      o.clientId === selectedClient.id &&
      (o.type === 'buy' || o.type === 'rent') &&
      o.status !== 'closed' && o.status !== 'under-offer'
    );
  }, [selectedClient, opportunities]);

  // Get saved properties for the selected opportunity
  const savedProperties = useMemo(() => {
    if (!selectedOpportunity) return [];
    const images = selectedOpportunity.images || [];
    return [
      {
        id: `opp-prop-${selectedOpportunity.id}`,
        title: selectedOpportunity.title,
        images: images,
        priceRange: selectedOpportunity.priceRange,
        neighborhoods: selectedOpportunity.neighborhoods,
        bedrooms: selectedOpportunity.bedrooms,
        bathrooms: selectedOpportunity.bathrooms,
        sizeRange: selectedOpportunity.sizeRange,
        propertyTypes: selectedOpportunity.propertyTypes,
      },
    ];
  }, [selectedOpportunity]);

  // Only clients that have at least one active buy or rent opportunity
  const eligibleClients = useMemo(() => {
    return clients.filter(c => {
      const clientOpps = opportunities.filter(o => o.clientId === c.id);
      return clientOpps.some(o =>
        (o.type === 'buy' || o.type === 'rent') &&
        o.status !== 'closed' && o.status !== 'under-offer'
      );
    });
  }, [clients, opportunities]);

  // Filter clients by search
  const filteredClients = useMemo(() => {
    const query = clientSearchQuery.toLowerCase();
    return eligibleClients.filter(c =>
      c.fullName.toLowerCase().includes(query) ||
      c.phone.includes(query)
    );
  }, [eligibleClients, clientSearchQuery]);

  // Filter opportunities by search
  const filteredOpportunities = useMemo(() => {
    const query = oppSearchQuery.toLowerCase();
    return clientOpportunities.filter(o =>
      o.title.toLowerCase().includes(query) ||
      o.neighborhoods.some(n => n.toLowerCase().includes(query))
    );
  }, [clientOpportunities, oppSearchQuery]);

  // Get opportunity type data for a client
  const getClientOpportunityData = (clientId: string) => {
    const clientOpps = opportunities.filter(o => o.clientId === clientId);
    return computeOpportunityTypeCounts(clientOpps);
  };

  // Notify parent of step changes
  const changeStep = (step: BookVisitStep) => {
    setCurrentStep(step);
    onStepChange?.(step);
  };

  // Expose goBack to parent via ref
  useImperativeHandle(ref, () => ({
    goBack: () => {
      const backStep = getBookVisitBackStep(currentStep);
      changeStep(backStep);
    },
  }), [currentStep]);

  // Update height based on step
  useEffect(() => {
    if (currentStep === 'form') {
      const timer = setTimeout(() => {
        if (formRef.current) {
          const height = formRef.current.scrollHeight + 130;
          onHeightChange?.(height);
        }
      }, 50);
      return () => clearTimeout(timer);
    } else {
      onHeightChange?.(SELECT_VIEW_HEIGHT);
    }
  }, [currentStep, dateTime, selectedClient, selectedOpportunity, selectedProperty, meetingPoint, duration, onHeightChange]);

  const handleSelectClient = (client: { id: string; fullName: string; phone: string }) => {
    setSelectedClient({ id: client.id, name: client.fullName, phone: client.phone });
    setSelectedOpportunity(null);
    setSelectedProperty(null);
    setOppSearchQuery("");
    const clientOpps = opportunities.filter(o => o.clientId === client.id);
    if (clientOpps.length === 1) {
      setSelectedOpportunity(clientOpps[0]);
      changeStep('form');
    } else {
      changeStep('opportunity');
    }
  };

  const handleSelectOpportunity = (opp: Opportunity) => {
    setSelectedOpportunity(opp);
    setSelectedProperty(null);
    changeStep('form');
  };

  const handleSelectProperty = (property: { id: string; title: string }) => {
    setSelectedProperty({ id: property.id, title: property.title });
    changeStep('form');
  };

  const handleSubmit = async () => {
    if (!dateTime || !selectedClient || !selectedOpportunity) return;

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const durationMin = parseInt(duration);
    const durationStr = durationMin >= 60
      ? `${Math.floor(durationMin / 60)}h${durationMin % 60 > 0 ? ` ${durationMin % 60}m` : ''}`
      : `${durationMin}m`;

    addActivity({
      type: 'viewing',
      title: selectedProperty ? `Visit ${selectedProperty.title}` : `Visit for ${selectedClient.name}`,
      description: meetingPoint || undefined,
      date: format(dateTime.date, 'yyyy-MM-dd'),
      time: dateTime.time,
      duration: durationStr,
      status: 'scheduled',
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      clientPhone: selectedClient.phone,
      opportunityId: selectedOpportunity.id,
      opportunityName: selectedOpportunity.title,
      propertyId: selectedProperty?.id,
      propertyName: selectedProperty?.title,
      meetingPointLabel: meetingPoint || undefined,
    });

    setIsSubmitting(false);

    toast({
      title: "Visit booked",
      description: `Visit has been scheduled for ${selectedClient.name}.`,
    });

    onClose();
  };

  const isFormValid = dateTime && duration && selectedClient && selectedOpportunity && selectedProperty;

  // Step title/description for parent
  const getStepClasses = (step: BookVisitStep) => {
    if (currentStep === step) return "opacity-100 translate-x-0 relative";
    const order: BookVisitStep[] = ['form', 'client', 'opportunity', 'property'];
    const currentIdx = order.indexOf(currentStep);
    const stepIdx = order.indexOf(step);
    if (stepIdx < currentIdx) {
      return "opacity-0 -translate-x-full absolute inset-0 pointer-events-none";
    }
    return "opacity-0 translate-x-full absolute inset-0 pointer-events-none";
  };

  return (
    <>
      {/* Form View */}
      <div
        ref={formRef}
        className={cn(
          "transition-all duration-500 ease-out w-full",
          getStepClasses('form')
        )}
      >
        <div className="space-y-4">
          <DateTimePicker label="Start" value={dateTime} onChange={setDateTime} required />
          <FloatingLabelSelect
            label="Duration"
            required
            value={duration}
            onValueChange={setDuration}
            options={DURATION_OPTIONS}
          />

          {/* Select Client */}
          <button
            type="button"
            onClick={() => changeStep('client')}
            className={cn(
              "relative w-full h-16 px-4 rounded-xl border text-left transition-all duration-200",
              "hover:border-muted-foreground/50 flex items-center",
              "border-input bg-background"
            )}
          >
            <span className={cn(
              "absolute left-4 transition-all duration-200 ease-out pointer-events-none",
              selectedClient ? "top-2 text-xs text-muted-foreground" : "top-1/2 -translate-y-1/2 text-base text-muted-foreground"
            )}>
              Select client <span className="text-destructive">*</span>
            </span>
            {selectedClient && <span className="truncate text-base mt-4">{selectedClient.name}</span>}
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground shrink-0" />
          </button>

          {/* Select Opportunity */}
          {selectedClient && (
            <button
              type="button"
              onClick={() => changeStep('opportunity')}
              className={cn(
                "relative w-full h-16 px-4 rounded-xl border text-left transition-all duration-200",
                "hover:border-muted-foreground/50 flex items-center",
                "border-input bg-background"
              )}
            >
              <span className={cn(
                "absolute left-4 transition-all duration-200 ease-out pointer-events-none",
                selectedOpportunity ? "top-2 text-xs text-muted-foreground" : "top-1/2 -translate-y-1/2 text-base text-muted-foreground"
              )}>
                Opportunity <span className="text-destructive">*</span>
              </span>
              {selectedOpportunity && <span className="truncate text-base mt-4">{selectedOpportunity.title}</span>}
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          )}

          {/* Select Property */}
          <button
            type="button"
            onClick={() => changeStep('property')}
            className={cn(
              "relative w-full h-16 px-4 rounded-xl border text-left transition-all duration-200",
              "hover:border-muted-foreground/50 flex items-center",
              "border-input bg-background"
            )}
          >
            <span className={cn(
              "absolute left-4 transition-all duration-200 ease-out pointer-events-none",
              selectedProperty ? "top-2 text-xs text-muted-foreground" : "top-1/2 -translate-y-1/2 text-base text-muted-foreground"
            )}>
              Select property <span className="text-destructive">*</span>
            </span>
            {selectedProperty && <span className="truncate text-base mt-4">{selectedProperty.title}</span>}
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground shrink-0" />
          </button>

          {/* Meeting Point */}
          <div>
            <Textarea
              placeholder="Share meeting point *"
              value={meetingPoint}
              onChange={(e) => setMeetingPoint(e.target.value)}
              className="min-h-[100px] rounded-xl resize-none"
            />
            <p className="mt-1.5 text-sm text-muted-foreground px-1">
              Meeting point will be included in client's invitation
            </p>
          </div>

          {/* Reminder */}
          <div>
            <div className="flex items-center justify-between p-4 rounded-xl border border-input">
              <span className="text-sm">Reminder 24h before</span>
              <Switch checked={reminder} onCheckedChange={setReminder} />
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground px-1">
              Reminders will be sent to client and you
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className="w-full h-12 rounded-xl"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Booking visit...</>
            ) : (
              'Book visit'
            )}
          </Button>
        </div>
      </div>

      {/* Client Selection */}
      <div className={cn("transition-all duration-500 ease-out h-full w-full", getStepClasses('client'))}>
        <ClientListForVisit
          clients={filteredClients}
          searchQuery={clientSearchQuery}
          onSearchChange={setClientSearchQuery}
          onSelectClient={handleSelectClient}
          selectedClientId={selectedClient?.id}
          getClientOpportunityData={getClientOpportunityData}
        />
      </div>

      {/* Opportunity Selection */}
      <div className={cn("transition-all duration-500 ease-out h-full w-full", getStepClasses('opportunity'))}>
        <OpportunityListForVisit
          opportunities={filteredOpportunities}
          searchQuery={oppSearchQuery}
          onSearchChange={setOppSearchQuery}
          onSelectOpportunity={handleSelectOpportunity}
          selectedOpportunityId={selectedOpportunity?.id}
        />
      </div>

      {/* Property Selection */}
      <div className={cn("transition-all duration-500 ease-out h-full w-full", getStepClasses('property'))}>
        {!selectedOpportunity ? (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in px-4">
            <div className="w-20 h-20 rounded-full bg-[#E4E4E4] flex items-center justify-center mb-4">
              <Home className="h-8 w-8 text-foreground" />
            </div>
            <p className="text-xl font-semibold text-foreground mb-1">Select an opportunity first</p>
            <p className="text-base text-muted-foreground">Choose a client and opportunity to see saved properties</p>
          </div>
        ) : savedProperties.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in px-4">
            <div className="w-20 h-20 rounded-full bg-[#E4E4E4] flex items-center justify-center mb-4">
              <Home className="h-8 w-8 text-foreground" />
            </div>
            <p className="text-xl font-semibold text-foreground mb-1">No properties saved</p>
            <p className="text-base text-muted-foreground">You don't have any saved properties within this opportunity</p>
          </div>
        ) : (
          <PropertySelector
            selectedPropertyId={selectedProperty?.id}
            onSelectProperty={handleSelectProperty}
            className="h-full"
            properties={savedProperties}
          />
        )}
      </div>
    </>
  );
});

// Expose step info for parent modal
export function getBookVisitStepTitle(step: BookVisitStep): string {
  switch (step) {
    case 'form': return 'Book a visit';
    case 'client': return 'Select client';
    case 'opportunity': return 'Select opportunity';
    case 'property': return 'Select property';
  }
}

export function getBookVisitStepDescription(step: BookVisitStep, clientName?: string, oppTitle?: string): string | null {
  switch (step) {
    case 'form': return null;
    case 'client': return null;
    case 'opportunity': return clientName ? `Select an opportunity for ${clientName}` : 'Select an opportunity';
    case 'property': return oppTitle ? `Properties saved in "${oppTitle}"` : null;
  }
}

export function canGoBackFromBookVisitStep(step: BookVisitStep): boolean {
  return step !== 'form';
}

export function getBookVisitBackStep(step: BookVisitStep): BookVisitStep {
  switch (step) {
    case 'client': return 'form';
    case 'opportunity': return 'client';
    case 'property': return 'form';
    default: return 'form';
  }
}

// ---- Client List Component ----

interface ClientListForVisitProps {
  clients: Array<{ id: string; fullName: string; phone: string; email?: string; updatedAt?: string; createdAt?: string }>;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectClient: (client: { id: string; fullName: string; phone: string }) => void;
  selectedClientId?: string;
  getClientOpportunityData: (clientId: string) => { typeCounts: Array<{ type: OpportunityType; activeCount: number }>; inactiveCount: number };
}

function ClientListForVisit({
  clients,
  searchQuery,
  onSearchChange,
  onSelectClient,
  selectedClientId,
  getClientOpportunityData,
}: ClientListForVisitProps) {
  type SortOption = 'interaction-newest' | 'interaction-oldest' | 'created-newest' | 'created-oldest';
  const [sortBy, setSortBy] = useState<SortOption>('interaction-newest');

  const sortedClients = useMemo(() => {
    return [...clients].sort((a, b) => {
      switch (sortBy) {
        case 'interaction-newest':
          return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
        case 'interaction-oldest':
          return new Date(a.updatedAt || 0).getTime() - new Date(b.updatedAt || 0).getTime();
        case 'created-newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'created-oldest':
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        default:
          return 0;
      }
    });
  }, [clients, sortBy]);

  const sortLabels: Record<SortOption, string> = {
    'interaction-newest': 'Interaction: Newest first',
    'interaction-oldest': 'Interaction: Oldest first',
    'created-newest': 'Created: Newest first',
    'created-oldest': 'Created: Oldest first',
  };

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 0 }}>
      <div className="shrink-0 px-1 pt-1">
        <div className="relative flex-1 mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone number"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-11 rounded-full"
          />
        </div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-normal text-muted-foreground">
            {sortedClients.length} {sortedClients.length === 1 ? 'client' : 'clients'}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-sm text-muted-foreground hover:text-foreground rounded-full">
                <ArrowUpDown className="h-3.5 w-3.5" />
                {sortLabels[sortBy]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover z-50">
              {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                <DropdownMenuItem
                  key={option}
                  onClick={() => setSortBy(option)}
                  className="px-3 py-2.5 gap-3 flex items-center justify-between"
                >
                  <span className={cn(sortBy === option && "font-semibold")}>{sortLabels[option]}</span>
                  {sortBy === option && <Check className="h-4 w-4 text-muted-foreground" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div
        className="flex-1 px-1 pb-1 overflow-y-auto overscroll-contain scrollbar-auto-hide"
        style={{ minHeight: 0 }}
      >
        {sortedClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground animate-fade-in">
            <p className="text-base font-medium mb-1">
              {searchQuery ? 'No clients found' : 'No clients yet'}
            </p>
            <p className="text-sm">
              {searchQuery ? 'Try adjusting your search' : 'Add clients to get started'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {sortedClients.map((client, index) => {
              const initials = client.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
              const { typeCounts, inactiveCount } = getClientOpportunityData(client.id);
              const isSelected = selectedClientId === client.id;

              return (
                <button
                  key={client.id}
                  onClick={() => onSelectClient(client)}
                  className={cn(
                    "w-full flex items-center gap-3 text-left p-3 rounded-xl transition-colors duration-150",
                    "opacity-0 animate-fade-in hover:bg-muted/50",
                    isSelected && "bg-muted/50"
                  )}
                  style={{
                    animationDelay: `${Math.min(index * 40, 200)}ms`,
                    animationFillMode: 'forwards'
                  }}
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-[#E4E4E4] flex items-center justify-center text-foreground font-semibold text-sm shrink-0">
                    {initials}
                  </div>

                  {/* Name + subtitle */}
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold leading-[120%] text-foreground truncate">
                      {client.fullName}
                    </p>
                    <p className="text-sm font-normal leading-[140%] text-muted-foreground truncate mt-0.5">
                      {client.phone}
                    </p>
                  </div>

                  {/* Opportunity type icons */}
                  <div className="shrink-0">
                    <OpportunityTypeIconsRow
                      typeCounts={typeCounts}
                      inactiveCount={inactiveCount}
                      variant="card"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Opportunity List Component ----

interface OpportunityListForVisitProps {
  opportunities: Opportunity[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectOpportunity: (opp: Opportunity) => void;
  selectedOpportunityId?: string;
}

function OpportunityListForVisit({
  opportunities,
  searchQuery,
  onSearchChange,
  onSelectOpportunity,
  selectedOpportunityId,
}: OpportunityListForVisitProps) {
  const formatPrice = (opp: Opportunity) => {
    if (!opp.priceRange) return '';
    const { min, max, currency } = opp.priceRange;
    const symbol = currency === 'EUR' ? '€' : currency;
    if (min === max) return `${symbol}${(min / 1000).toFixed(0)}k`;
    return `${symbol}${(min / 1000).toFixed(0)}k - ${(max / 1000).toFixed(0)}k`;
  };

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 0 }}>
      <div className="flex gap-3 mb-4 shrink-0 px-1 pt-1">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search opportunities..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-11 rounded-full"
          />
        </div>
      </div>

      <div
        className="flex-1 px-1 pb-1 overflow-y-auto overscroll-contain scrollbar-auto-hide"
        style={{ minHeight: 0 }}
      >
        {opportunities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground animate-fade-in">
            <p className="text-base font-medium mb-1">
              {searchQuery ? 'No opportunities found' : 'No opportunities'}
            </p>
            <p className="text-sm">
              {searchQuery ? 'Try adjusting your search' : 'This client has no opportunities'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {opportunities.map((opp, index) => {
              const isSelected = selectedOpportunityId === opp.id;
              const IconComponent = OpportunityBareIcons[opp.type as keyof typeof OpportunityBareIcons];
              const images = opp.images || [];
              const mainImage = images[0];

              return (
                <button
                  key={opp.id}
                  onClick={() => onSelectOpportunity(opp)}
                  className={cn(
                    "w-full p-4 rounded-xl border text-left transition-all duration-200",
                    "opacity-0 animate-fade-in",
                    isSelected
                      ? "border-foreground bg-muted/50"
                      : "border-border hover:border-muted-foreground/50 hover:bg-muted/50"
                  )}
                  style={{
                    animationDelay: `${Math.min(index * 40, 200)}ms`,
                    animationFillMode: 'forwards'
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full mb-2"
                        style={{ backgroundColor: badgeBgColors[opp.type] || '#0000000D' }}
                      >
                        {IconComponent && (
                          <span style={{ color: iconColors[opp.type] || '#1A1A1A' }}>
                            <IconComponent />
                          </span>
                        )}
                        <span className="text-xs font-semibold leading-[120%]" style={{ color: '#1A1A1A' }}>
                          {getOpportunityLabel(opp.type)}
                        </span>
                      </div>
                      <h4 className="text-base font-semibold leading-tight line-clamp-2">{opp.title}</h4>
                      {opp.priceRange && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {formatPrice(opp)}{opp.bedrooms ? ` · ${opp.bedrooms} beds` : ''}
                        </p>
                      )}
                    </div>
                    {mainImage && (
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                        <img src={mainImage} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
