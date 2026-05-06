import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Download, MessageCircle, Link2, FileText, ChevronRight, Check, Search, Copy, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { WizardModal } from "@/components/ui/standard-modal";
import { ClientSelectorWithCreate } from "@/components/clients/client-selector-with-create";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings } from "lucide-react";
import { PdfViewer } from "@/components/ui/pdf-viewer";
import { useData } from "@/contexts/data-context";
import { Opportunity } from "@/types";
import { OpportunityBareIcons } from "@/components/opportunities/opportunity-bare-icons";
import { getOpportunityLabel } from "@/components/opportunities/opportunity-icon";

// Import portal logos
import idealistaLogo from "@/assets/idealista-logo.png";
import fotocasaLogo from "@/assets/fotocasa-logo-new.png";
import huspyLogo from "@/assets/huspy-logo.png";
import huspyIcon from "@/assets/huspy-icon.svg";

// Mock PDF URL for testing
const MOCK_PDF_URL = "https://docs-cdn.staging.huspy.net/01KEHDJKNDNX61H9G8F6QJV5MA";

interface SharePropertyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: {
    id: string;
    title: string;
    image: string;
    images?: string[]; // Multiple images for PDF pages
    idealistaLink?: string;
    fotocasaLink?: string;
    huspyLink?: string;
  };
  /** Pre-select a client when opening the WhatsApp share step */
  preSelectedClient?: {
    id: string;
    name: string;
    phone: string;
  };
}

type ShareStep = 'menu' | 'whatsapp' | 'copy-link' | 'download-pdf';
type WhatsAppSubStep = 'client' | 'opportunity';
type WhatsAppShareType = 'pdf' | 'idealista' | 'fotocasa' | 'huspy';
type DevScenario = 'default' | 'no-clients' | 'few-clients' | 'many-clients' | 'loading';
type ShareFlowVersion = 'v1' | 'v2';

interface PortalLink {
  id: string;
  name: string;
  logo: string;
  getLink: (propertyId: string) => string;
}

const portalLinks: PortalLink[] = [
  { id: 'idealista', name: 'Idealista', logo: idealistaLogo, getLink: (id) => `https://idealista.com/property/${id}` },
  { id: 'fotocasa', name: 'Fotocasa', logo: fotocasaLogo, getLink: (id) => `https://fotocasa.es/property/${id}` },
  { id: 'huspy', name: 'Huspy', logo: huspyLogo, getLink: (id) => `https://huspy.com/property/${id}` },
];

// Fixed height for different views
const CLIENT_SELECT_HEIGHT = 600;
const MENU_HEIGHT = 320;
const COPY_LINK_HEIGHT = 320;
// PDF step uses responsive height - larger on bigger screens
const DOWNLOAD_PDF_HEIGHT_BASE = 520;
const DOWNLOAD_PDF_HEIGHT_LARGE = 680;

export function SharePropertyModal({ 
  open, 
  onOpenChange, 
  property,
  preSelectedClient
}: SharePropertyModalProps) {
  const { opportunities } = useData();
  const [currentStep, setCurrentStep] = useState<ShareStep>('menu');
  const [whatsAppSubStep, setWhatsAppSubStep] = useState<WhatsAppSubStep>('client');
  const [whatsAppShareType, setWhatsAppShareType] = useState<WhatsAppShareType>('pdf');
  const [devScenario, setDevScenario] = useState<DevScenario>('default');
  const [flowVersion, setFlowVersion] = useState<ShareFlowVersion>('v2');
  const [currentView, setCurrentView] = useState<'select' | 'create'>('select');
  const [goBackToSelect, setGoBackToSelect] = useState<(() => void) | null>(null);
  const [contentHeight, setContentHeight] = useState<number>(CLIENT_SELECT_HEIGHT);
  const [selectedClient, setSelectedClient] = useState<{ id: string; name: string; phone: string } | null>(preSelectedClient || null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [oppSearchQuery, setOppSearchQuery] = useState("");
  const [copiedPortalId, setCopiedPortalId] = useState<string | null>(null);
  const [animationDirection, setAnimationDirection] = useState<'forward' | 'backward'>('forward');
  const prevStepRef = useRef<ShareStep>('menu');
  
  // Update selected client when preSelectedClient changes
  useEffect(() => {
    if (preSelectedClient) {
      setSelectedClient(preSelectedClient);
    }
  }, [preSelectedClient]);

  // Get buy/rent opportunities for selected client
  const clientOpportunities = useMemo(() => {
    if (!selectedClient) return [];
    return opportunities.filter(o =>
      o.clientId === selectedClient.id &&
      (o.type === 'buy' || o.type === 'rent') &&
      o.status !== 'closed' && o.status !== 'under-offer'
    );
  }, [selectedClient, opportunities]);

  // Filter opportunities by search
  const filteredOpportunities = useMemo(() => {
    const query = oppSearchQuery.toLowerCase();
    return clientOpportunities.filter(o =>
      o.title.toLowerCase().includes(query) ||
      o.neighborhoods.some(n => n.toLowerCase().includes(query))
    );
  }, [clientOpportunities, oppSearchQuery]);
  
  // Check if we're on a larger screen for PDF modal sizing
  const [isLargeScreen, setIsLargeScreen] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerHeight > 800 : false
  );
  
  // Listen for resize to update large screen detection
  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerHeight > 800);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Track animation direction when step changes
  useEffect(() => {
    if (currentStep !== prevStepRef.current) {
      const prevNumber = stepToNumber(prevStepRef.current);
      const currentNumber = stepToNumber(currentStep);
      setAnimationDirection(currentNumber > prevNumber ? 'forward' : 'backward');
      prevStepRef.current = currentStep;
    }
  }, [currentStep]);

  // Map step to number for wizard
  const stepToNumber = (step: ShareStep): number => {
    switch (step) {
      case 'menu': return 1;
      case 'whatsapp': return 2;
      case 'copy-link': return 2;
      case 'download-pdf': return 2;
    }
  };

  const currentStepNumber = stepToNumber(currentStep);

  // Footer height when showing CTA
  const FOOTER_HEIGHT = 72;

  // Get modal height based on step
  const getModalHeight = (): number => {
    if (currentStep === 'menu') {
      return MENU_HEIGHT;
    }
    if (currentStep === 'copy-link') {
      return COPY_LINK_HEIGHT;
    }
    if (currentStep === 'download-pdf') {
      return isLargeScreen ? DOWNLOAD_PDF_HEIGHT_LARGE : DOWNLOAD_PDF_HEIGHT_BASE;
    }
    // WhatsApp step
    if (whatsAppSubStep === 'opportunity') {
      return selectedOpportunity ? CLIENT_SELECT_HEIGHT + FOOTER_HEIGHT : CLIENT_SELECT_HEIGHT;
    }
    const baseHeight = currentView === 'create' ? contentHeight : CLIENT_SELECT_HEIGHT;
    return selectedClient && currentView === 'select' ? baseHeight + FOOTER_HEIGHT : baseHeight;
  };
  
  // Get PDF viewer height based on modal height
  const getPdfViewerHeight = (): number => {
    return isLargeScreen ? 500 : 340;
  };

  // Handle content height changes from child component
  const handleContentHeightChange = useCallback((height: number | null) => {
    if (height === null) {
      setContentHeight(CLIENT_SELECT_HEIGHT);
    } else {
      setContentHeight(height + 130);
    }
  }, []);

  // Handle download PDF - navigate to PDF step
  const handleDownloadPDFClick = () => {
    setCurrentStep('download-pdf');
  };

  // Handle actual PDF download
  const handleDownloadPDF = () => {
    toast.success("PDF downloaded successfully", {
      description: `Property brochure for "${property.title}" has been downloaded.`
    });
  };

  // Handle copy link - go to portal selection (v1) or copy directly (v2)
  const handleCopyLinkClick = () => {
    if (flowVersion === 'v2') {
      // v2: Copy Idealista link if available, otherwise Huspy
      const portal = property.idealistaLink 
        ? portalLinks.find(p => p.id === 'idealista')!
        : portalLinks.find(p => p.id === 'huspy')!;
      handleCopyPortalLink(portal);
    } else {
      // v1: Go to portal selection step
      setCurrentStep('copy-link');
      setCopiedPortalId(null);
    }
  };

  // Handle copying a specific portal link
  const handleCopyPortalLink = (portal: PortalLink) => {
    const link = portal.getLink(property.id);
    navigator.clipboard.writeText(link);
    setCopiedPortalId(portal.id);
    toast.success("Link copied to clipboard", {
      description: `The ${portal.name} link has been copied.`
    });
    // Reset copied state after 2 seconds
    setTimeout(() => setCopiedPortalId(null), 2000);
  };

  // Handle WhatsApp share
  const handleWhatsAppClick = () => {
    setCurrentStep('whatsapp');
  };

  // Handle client selection - move to opportunity step
  const handleSelectClient = (clientId: string, clientName: string, clientPhone: string) => {
    console.log('[ShareModal] handleSelectClient called:', clientId);
    setSelectedClient({ id: clientId, name: clientName, phone: clientPhone });
    setSelectedOpportunity(null);
    setOppSearchQuery("");
    // Check if client has buy/rent opportunities
    const clientOpps = opportunities.filter(o =>
      o.clientId === clientId &&
      (o.type === 'buy' || o.type === 'rent') &&
      o.status !== 'closed' && o.status !== 'under-offer'
    );
    if (clientOpps.length === 0) {
      // No buy/rent opportunities - proceed directly
      setSelectedOpportunity(null);
    } else {
      // Navigate to opportunity selection step
      setWhatsAppSubStep('opportunity');
    }
  };

  // Handle client deselection
  const handleDeselectClient = () => {
    console.log('[ShareModal] handleDeselectClient called');
    setSelectedClient(null);
    setSelectedOpportunity(null);
  };

  // Handle opportunity selection
  const handleSelectOpportunity = (opp: Opportunity) => {
    setSelectedOpportunity(opp);
  };

  // Get the link for the current share type
  const getShareLink = () => {
    if (whatsAppShareType === 'pdf') {
      return `https://app.huspy.com/property/${property.id}/brochure`;
    }
    const portal = portalLinks.find(p => p.id === whatsAppShareType);
    return portal ? portal.getLink(property.id) : `https://app.huspy.com/property/${property.id}`;
  };

  // Generate WhatsApp message with link
  const getWhatsAppMessage = () => {
    if (!selectedClient) return '';
    const firstName = selectedClient.name.split(' ')[0];
    const link = getShareLink();
    if (whatsAppShareType === 'pdf') {
      return `Hi ${firstName}, I have a property that might interest you: ${property.title}\n\nHere's the brochure: ${link}`;
    }
    return `Hi ${firstName}, check out this property: ${property.title}\n\n${link}`;
  };

  // Copy message to clipboard
  const handleCopyMessage = () => {
    navigator.clipboard.writeText(getWhatsAppMessage());
    toast.success("Message copied to clipboard");
  };

  // Handle the actual WhatsApp share when CTA is clicked
  const handleShareWithClient = () => {
    if (!selectedClient) return;
    
    const cleanPhone = selectedClient.phone.replace(/[^0-9]/g, '');
    const message = getWhatsAppMessage();
    
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    toast.success("Opening WhatsApp", {
      description: `Sharing with ${selectedClient.name}`
    });
    onOpenChange(false);
  };

  // Handle back navigation
  const handleBack = () => {
    if (currentStep === 'whatsapp' && whatsAppSubStep === 'opportunity') {
      // Go back from opportunity selection to client selection
      setWhatsAppSubStep('client');
      setSelectedOpportunity(null);
    } else if (currentStep === 'whatsapp' && currentView === 'create' && goBackToSelect) {
      goBackToSelect();
    } else if (currentStep === 'whatsapp' || currentStep === 'copy-link' || currentStep === 'download-pdf') {
      setCurrentStep('menu');
      setSelectedClient(null);
      setSelectedOpportunity(null);
      setWhatsAppSubStep('client');
      setCopiedPortalId(null);
    }
  };

  // Reset state when modal closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setCurrentStep('menu');
      setWhatsAppShareType('pdf');
      setWhatsAppSubStep('client');
      setCurrentView('select');
      setContentHeight(CLIENT_SELECT_HEIGHT);
      setSelectedClient(null);
      setSelectedOpportunity(null);
      setOppSearchQuery("");
      setCopiedPortalId(null);
      setAnimationDirection('forward');
      prevStepRef.current = 'menu';
    }
    onOpenChange(isOpen);
  };

  // PDF URL for preview
  const pdfUrl = MOCK_PDF_URL;

  // Step titles
  const getStepTitle = (): string => {
    switch (currentStep) {
      case 'menu': return 'Share property';
      case 'whatsapp': 
        if (currentView === 'create') return 'Add new client';
        if (whatsAppSubStep === 'opportunity') return 'Select opportunity';
        return 'Share via WhatsApp';
      case 'copy-link': return 'Copy link';
      case 'download-pdf': return 'Download PDF';
    }
  };

  // Step descriptions
  const getStepDescription = (): string | undefined => {
    switch (currentStep) {
      case 'menu': return property.title;
      case 'whatsapp': 
        if (currentView === 'create') return "Enter the client's contact information.";
        if (whatsAppSubStep === 'opportunity') return selectedClient ? `Save this property under an opportunity for ${selectedClient.name} for easy tracking` : undefined;
        return 'Select content type and recipient';
      case 'copy-link': return 'Select a portal to copy its link';
      case 'download-pdf': return 'Preview and download property brochure';
    }
  };

  // Get the copy link label based on flow version and available links
  const getCopyLinkLabel = (): string => {
    if (flowVersion === 'v1') {
      return 'Copy link';
    }
    // v2: Show specific portal name
    return property.idealistaLink ? 'Copy Idealista link' : 'Copy Huspy link';
  };

  // Dev tools dropdown - show on menu and whatsapp steps
  const headerActions = (currentStep === 'menu' || (currentStep === 'whatsapp' && currentView === 'select')) ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Dev Tool - Flow Version</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => setFlowVersion('v1')}
          className={flowVersion === 'v1' ? 'bg-accent' : ''}
        >
          V1 (original)
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setFlowVersion('v2')}
          className={flowVersion === 'v2' ? 'bg-accent' : ''}
        >
          V2 (new flow)
        </DropdownMenuItem>
        {currentStep === 'whatsapp' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Client Scenarios</DropdownMenuLabel>
            <DropdownMenuItem 
              onClick={() => setDevScenario('default')}
              className={devScenario === 'default' ? 'bg-accent' : ''}
            >
              Default (all clients)
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setDevScenario('no-clients')}
              className={devScenario === 'no-clients' ? 'bg-accent' : ''}
            >
              No clients yet
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setDevScenario('few-clients')}
              className={devScenario === 'few-clients' ? 'bg-accent' : ''}
            >
              Few clients (3)
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setDevScenario('many-clients')}
              className={devScenario === 'many-clients' ? 'bg-accent' : ''}
            >
              Many clients (scrollable)
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setDevScenario('loading')}
              className={devScenario === 'loading' ? 'bg-accent' : ''}
            >
              Loading state
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  ) : null;

  // Header image for modal
  const headerImage = currentStep === 'menu' ? (
    <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-muted shadow-sm">
      <img 
        src={property.image} 
        alt={property.title}
        className="w-full h-full object-cover"
      />
    </div>
  ) : null;

  return (
    <WizardModal
      open={open}
      onOpenChange={handleOpenChange}
      currentStep={currentStepNumber}
      totalSteps={2}
      stepTitles={[getStepTitle(), getStepTitle()]}
      stepDescriptions={[getStepDescription(), getStepDescription()]}
      size="md"
      contentClassName="z-[110]"
      overlayClassName="z-[110]"
      onBack={handleBack}
      showProgressBar={false}
      fixedHeight={getModalHeight()}
      headerActions={headerActions}
      headerImage={headerImage}
      hideFooter={!(currentStep === 'whatsapp' && selectedClient && currentView === 'select' && (whatsAppSubStep === 'client' || (whatsAppSubStep === 'opportunity' && selectedOpportunity))) && currentStep !== 'download-pdf'}
      nextLabel={currentStep === 'download-pdf' ? 'Download PDF' : (selectedClient ? `Share with ${selectedClient.name.split(' ')[0]}` : 'Share')}
      onNext={currentStep === 'download-pdf' ? handleDownloadPDF : handleShareWithClient}
      canProceed={currentStep === 'download-pdf' ? true : !!selectedClient}
      disableInternalAnimation
    >
      {/* Container for all steps with overflow hidden for slide animations */}
      <div className="relative h-full overflow-hidden transition-smooth">
        {/* Step 1: Main Menu */}
        <div 
          className={cn(
            "transition-all duration-500 ease-out",
            currentStep === 'menu' 
              ? "opacity-100 translate-x-0 h-full" 
              : "opacity-0 -translate-x-full absolute inset-0 pointer-events-none h-0 overflow-hidden"
          )}
        >
          <div className="flex flex-col pb-4">
            <div className="space-y-1">
              {/* Download PDF */}
              <button
                onClick={handleDownloadPDFClick}
                className="w-full flex items-center justify-between py-3 px-2 rounded-lg hover:bg-muted transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                    <Download className="w-4 h-4 text-foreground" />
                  </div>
                  <span className="text-sm font-medium">Download PDF</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Share via WhatsApp */}
              <button
                onClick={handleWhatsAppClick}
                className="w-full flex items-center justify-between py-3 px-2 rounded-lg hover:bg-muted transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-foreground" />
                  </div>
                  <span className="text-sm font-medium">Share via WhatsApp</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Copy Link */}
              <button
                onClick={handleCopyLinkClick}
                className="w-full flex items-center py-3 px-2 rounded-lg hover:bg-muted transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                    <Link2 className="w-4 h-4 text-foreground" />
                  </div>
                  <span className="text-sm font-medium">{getCopyLinkLabel()}</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Step 2a: Copy Link - Portal Selection */}
        <div 
          className={cn(
            "transition-all duration-500 ease-out",
            currentStep === 'copy-link' 
              ? "opacity-100 translate-x-0 h-full" 
              : currentStep === 'menu'
                ? "opacity-0 translate-x-full absolute inset-0 pointer-events-none h-0 overflow-hidden"
                : "opacity-0 -translate-x-full absolute inset-0 pointer-events-none h-0 overflow-hidden"
          )}
        >
          <div className="flex flex-col pb-4">
            <div className="space-y-1">
              {portalLinks.map((portal) => (
                <button
                  key={portal.id}
                  onClick={() => handleCopyPortalLink(portal)}
                  className="w-full flex items-center justify-between py-3 px-2 rounded-lg hover:bg-muted transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center">
                      <img 
                        src={portal.logo} 
                        alt={portal.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-sm font-medium">{portal.name}</span>
                  </div>
                  {copiedPortalId === portal.id ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Link2 className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Step 2c: Download PDF - Inline Preview */}
        <div 
          className={cn(
            "transition-all duration-500 ease-out",
            currentStep === 'download-pdf' 
              ? "opacity-100 translate-x-0 h-full" 
              : currentStep === 'menu'
                ? "opacity-0 translate-x-full absolute inset-0 pointer-events-none h-0 overflow-hidden"
                : "opacity-0 -translate-x-full absolute inset-0 pointer-events-none h-0 overflow-hidden"
          )}
        >
          <div className="flex flex-col h-full overflow-hidden">
            <PdfViewer url={pdfUrl} height={getPdfViewerHeight()} />
          </div>
        </div>

        {/* Step 2b: WhatsApp - Merged Type Selection + Client/Opportunity Selection */}
        <div 
          className={cn(
            "transition-all duration-500 ease-out",
            currentStep === 'whatsapp' 
              ? "opacity-100 translate-x-0 h-full" 
              : currentStep === 'menu'
                ? "opacity-0 translate-x-full absolute inset-0 pointer-events-none h-0 overflow-hidden"
                : "opacity-0 -translate-x-full absolute inset-0 pointer-events-none h-0 overflow-hidden"
          )}
        >
          <div className="flex-1 flex flex-col min-h-0 h-full relative overflow-hidden">
            {/* Client sub-step */}
            <div className={cn(
              "transition-all duration-500 ease-out flex flex-col h-full min-h-0",
              whatsAppSubStep === 'client'
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-full absolute inset-0 pointer-events-none"
            )}>
              {/* Link Type Selection + Message Preview (shown when client is selected) */}
              {currentView === 'select' && selectedClient && (
                <div className="pb-4 shrink-0 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Share as</p>
                  
                  {/* Link type cards */}
                  <div className="flex gap-2">
                    {/* PDF option */}
                    <button
                      onClick={() => setWhatsAppShareType('pdf')}
                      className={cn(
                        "flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 transition-all text-left",
                        whatsAppShareType === 'pdf'
                          ? "border-foreground bg-foreground/5"
                          : "border-border hover:border-foreground/30"
                      )}
                    >
                      <FileText className="w-5 h-5 text-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">PDF brochure</p>
                        <p className="text-[10px] text-muted-foreground">Downloadable link</p>
                      </div>
                    </button>

                    {/* Portal link options */}
                    {portalLinks.map((portal) => (
                      <button
                        key={portal.id}
                        onClick={() => setWhatsAppShareType(portal.id as WhatsAppShareType)}
                        className={cn(
                          "flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 transition-all text-left",
                          whatsAppShareType === portal.id
                            ? "border-foreground bg-foreground/5"
                            : "border-border hover:border-foreground/30"
                        )}
                      >
                        <img src={portal.logo} alt={portal.name} className="w-5 h-5 object-cover rounded-sm flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{portal.name}</p>
                          <p className="text-[10px] text-muted-foreground">Portal link</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Message preview */}
                  <div className="bg-muted/30 rounded-xl p-3 border border-border">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Message preview</p>
                      <button
                        onClick={handleCopyMessage}
                        className="flex items-center gap-1 text-[10px] font-medium text-foreground hover:text-foreground/70 transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        Copy
                      </button>
                    </div>
                    <p className="text-sm leading-relaxed">
                      Hi {selectedClient.name.split(' ')[0]}, {whatsAppShareType === 'pdf' ? 'I have a property that might interest you' : 'check out this property'}: {property.title}
                    </p>
                    <p className="text-xs text-accent-teal mt-1.5 break-all">
                      {getShareLink()}
                    </p>
                  </div>
                </div>
              )}

              {/* Share type pills (shown before client selection) */}
              {currentView === 'select' && !selectedClient && (
                <div className="pb-4 shrink-0">
                  <p className="text-xs text-muted-foreground mb-3">Share as</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setWhatsAppShareType('pdf')}
                      className={cn(
                        "flex items-center gap-1.5 h-8 pl-2 pr-3 rounded-full border transition-all text-xs",
                        whatsAppShareType === 'pdf'
                          ? "border-foreground bg-foreground text-background"
                          : "border-border hover:border-muted-foreground/50 hover:bg-muted/30"
                      )}
                    >
                      <FileText className="w-4 h-4" />
                      <span className="font-medium">PDF</span>
                    </button>
                    {portalLinks.map((portal) => (
                      <button
                        key={portal.id}
                        onClick={() => setWhatsAppShareType(portal.id as WhatsAppShareType)}
                        className={cn(
                          "flex items-center gap-1.5 h-8 pl-2 pr-3 rounded-full border transition-all text-xs",
                          whatsAppShareType === portal.id
                            ? "border-foreground bg-foreground text-background"
                            : "border-border hover:border-muted-foreground/50 hover:bg-muted/30"
                        )}
                      >
                        <img src={portal.logo} alt={portal.name} className="w-4 h-4 object-cover rounded-full" />
                        <span className="font-medium">{portal.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Client Selection */}
              <div className="flex-1 flex flex-col min-h-0">
                {currentView === 'select' && (
                  <p className="text-xs text-muted-foreground mb-3">Share with</p>
                )}
                <ClientSelectorWithCreate
                  selectedClientId={selectedClient?.id}
                  preSelectedClient={preSelectedClient}
                  onSelectClient={handleSelectClient}
                  onDeselectClient={handleDeselectClient}
                  onViewChange={setCurrentView}
                  onBackCallback={(cb) => setGoBackToSelect(() => cb)}
                  onContentHeightChange={handleContentHeightChange}
                  showOpportunityIcons
                  size="compact"
                  maxHeight="100%"
                  className="h-full"
                  devScenario={devScenario}
                  hideFormHeader
                />
              </div>
            </div>

            {/* Opportunity sub-step */}
            <div className={cn(
              "transition-all duration-500 ease-out flex flex-col h-full min-h-0",
              whatsAppSubStep === 'opportunity'
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-full absolute inset-0 pointer-events-none"
            )}>
              <ShareOpportunityList
                opportunities={filteredOpportunities}
                searchQuery={oppSearchQuery}
                onSearchChange={setOppSearchQuery}
                onSelectOpportunity={handleSelectOpportunity}
                selectedOpportunityId={selectedOpportunity?.id}
              />
            </div>
          </div>
        </div>
      </div>
    </WizardModal>
  );
}

// Badge background colors (15% opacity versions)
const badgeBgColors: Record<string, string> = {
  buy: 'rgba(0, 138, 138, 0.15)',
  rent: 'rgba(88, 86, 214, 0.15)',
  sell: 'rgba(217, 93, 40, 0.15)',
  lease: 'rgba(205, 82, 195, 0.15)',
};

const iconColors: Record<string, string> = {
  buy: '#008A8A',
  rent: '#5856D6',
  sell: '#D95D28',
  lease: '#CD52C3',
};

// ---- Opportunity List for Share Flow ----

interface ShareOpportunityListProps {
  opportunities: Opportunity[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectOpportunity: (opp: Opportunity) => void;
  selectedOpportunityId?: string;
}

function ShareOpportunityList({
  opportunities,
  searchQuery,
  onSearchChange,
  onSelectOpportunity,
  selectedOpportunityId,
}: ShareOpportunityListProps) {
  const formatPrice = (opp: Opportunity) => {
    if (!opp.priceRange) return '';
    const { min, max, currency } = opp.priceRange;
    const symbol = currency === 'EUR' ? '€' : currency;
    if (min === max) return `${symbol}${(min / 1000).toFixed(0)}k`;
    return `${symbol}${(min / 1000).toFixed(0)}k - ${(max / 1000).toFixed(0)}k`;
  };

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 0 }}>
      <div className="shrink-0 px-1 pt-1">
        <div className="relative flex-1 mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search opportunities..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-11 rounded-full"
          />
        </div>
        <span className="text-sm font-normal text-muted-foreground mb-3 block">
          {opportunities.length} {opportunities.length === 1 ? 'opportunity' : 'opportunities'}
        </span>
      </div>

      <div
        className="flex-1 px-1 pb-1 overflow-y-auto overscroll-contain scrollbar-auto-hide"
        style={{ minHeight: 0 }}
      >
        {opportunities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground animate-fade-in">
            <p className="text-base font-medium mb-1">
              {searchQuery ? 'No opportunities found' : 'No buy or rent opportunities'}
            </p>
            <p className="text-sm">
              {searchQuery ? 'Try adjusting your search' : 'This client has no active buy or rent opportunities'}
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
                        <span className="text-xs font-semibold leading-[120%] text-foreground">
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