import { useState, useEffect, useRef, useMemo } from "react";
import { Download, MessageCircle, Link2, ChevronRight, CheckCircle2, Copy, AlertCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { WizardModal } from "@/components/ui/standard-modal";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";

import { ScrollArea } from "@/components/ui/scroll-area";

import husPyIcon from "@/assets/huspy-icon.svg";
import idealistaLogo from "@/assets/idealista-logo.png";
import fotocasaLogo from "@/assets/fotocasa-logo-new.png";
import huspyLogo from "@/assets/huspy-logo.png";

export interface BulkShareItem {
  id: string;
  title: string;
  image?: string;
  name?: string;
  phone?: string;
  /** External portal link (e.g. Idealista). If absent, Huspy link is used. */
  portalLink?: string;
}

type LinkType = 'pdf' | 'idealista' | 'fotocasa' | 'huspy';

interface BulkShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: BulkShareItem[];
  direction: 'properties-to-client' | 'property-to-buyers';
  /** The opportunity's client (for properties-to-client direction) */
  client?: { id: string; name: string; phone: string };
  /** The opportunity's property (for property-to-buyers direction) */
  property?: { id: string; title: string; image: string };
  onComplete?: () => void;
}

type Step = 'menu' | 'whatsapp';

const MENU_HEIGHT = 400;
const WHATSAPP_HEIGHT = 640;

function getHuspyLink(id: string) {
  return `https://app.huspy.com/property/${id}`;
}

export function BulkShareModal({
  open,
  onOpenChange,
  items,
  direction,
  client,
  property,
  onComplete,
}: BulkShareModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('menu');
  const [animationDirection, setAnimationDirection] = useState<'forward' | 'backward'>('forward');
  const prevStepRef = useRef<Step>('menu');
  const [linkType, setLinkType] = useState<LinkType>('pdf');

  // Count items with/without portal links
  const portalStats = useMemo(() => {
    const withPortal = items.filter(i => i.portalLink).length;
    return { withPortal, withoutPortal: items.length - withPortal };
  }, [items]);

  // Track animation direction
  useEffect(() => {
    if (currentStep !== prevStepRef.current) {
      setAnimationDirection(currentStep === 'whatsapp' ? 'forward' : 'backward');
      prevStepRef.current = currentStep;
    }
  }, [currentStep]);

  const stepToNumber = (step: Step) => step === 'menu' ? 1 : 2;

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setCurrentStep('menu');
      setAnimationDirection('forward');
      prevStepRef.current = 'menu';
      setLinkType('pdf');
    }
    onOpenChange(isOpen);
  };

  const handleBack = () => {
    if (currentStep === 'whatsapp') {
      setCurrentStep('menu');
    }
  };

  // Get the link for an item based on selected link type
  const getItemLink = (item: BulkShareItem) => {
    if (linkType === 'pdf') {
      return `https://app.huspy.com/property/${item.id}/brochure`;
    }
    if (linkType === 'idealista' && item.portalLink) {
      return item.portalLink; // portal link is idealista for now
    }
    if (linkType === 'fotocasa' && item.portalLink) {
      return item.portalLink;
    }
    return getHuspyLink(item.id);
  };

  // Subtitle text
  const getSubtitle = () => {
    if (currentStep === 'whatsapp') return 'Select content type and recipient';
    if (direction === 'property-to-buyers') {
      return `Sharing property with ${items.length} ${items.length === 1 ? 'buyer' : 'buyers'}`;
    }
    return `Sharing ${items.length} ${items.length === 1 ? 'property' : 'properties'} with ${client?.name || 'client'}`;
  };

  // Copy links
  const handleCopyLinks = () => {
    if (direction === 'properties-to-client') {
      const links = items.map(item => getItemLink(item)).join('\n');
      navigator.clipboard.writeText(links);
      toast.success(`${items.length} link${items.length !== 1 ? 's' : ''} copied to clipboard`);
    } else {
      const link = property ? getHuspyLink(property.id) : '';
      navigator.clipboard.writeText(link);
      toast.success("Link copied to clipboard");
    }
  };

  // Download PDFs
  const handleDownloadPDFs = () => {
    if (direction === 'properties-to-client') {
      toast.success(`Downloading ${items.length} PDF${items.length !== 1 ? 's' : ''}...`);
    } else {
      toast.success("Downloading PDF...");
    }
  };

  // Generate the WhatsApp message text for property-to-buyers
  const getPropertyMessage = () => {
    if (!property) return '';
    return `Hi, I have a property that I think could be a good fit for you. Here's the brochure for ${property.title}: ${getHuspyLink(property.id)}`;
  };

  // Generate multi-property message with links
  const getPropertiesMessage = () => {
    if (!client) return '';
    const firstName = client.name.split(' ')[0];
    const propertyList = items.map(item => {
      const link = getItemLink(item);
      return `• ${item.title}\n  ${link}`;
    }).join('\n\n');
    return `Hi ${firstName}, I have some properties that might interest you:\n\n${propertyList}`;
  };

  // Copy message to clipboard
  const handleCopyMessage = () => {
    const message = direction === 'properties-to-client' && client
      ? getPropertiesMessage()
      : getPropertyMessage();
    navigator.clipboard.writeText(message);
    toast.success("Message copied to clipboard");
  };

  // WhatsApp share for properties-to-client (single recipient)
  const handleWhatsAppShareClient = () => {
    if (!client) return;
    const cleanPhone = client.phone.replace(/[^0-9]/g, '');
    const message = getPropertiesMessage();
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    toast.success("Opening WhatsApp", { description: `Sharing with ${client.name}` });
    onComplete?.();
    handleOpenChange(false);
  };

  // WhatsApp share for a single buyer
  const handleWhatsAppShareBuyer = (buyer: BulkShareItem) => {
    if (!property) return;
    const cleanPhone = (buyer.phone || '').replace(/[^0-9]/g, '');
    if (!cleanPhone) {
      toast.error("No phone number available", { description: buyer.name || buyer.title });
      return;
    }
    const firstName = (buyer.name || buyer.title).split(' ')[0];
    const message = `Hi ${firstName}, I have a property that I think could be a good fit for you. Here's the brochure for ${property.title}: ${getHuspyLink(property.id)}`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    toast.success("Opening WhatsApp", { description: `Sharing with ${buyer.name || buyer.title}` });
  };

  // Open WhatsApp for all buyers (staggered tabs)
  const handleWhatsAppShareAll = () => {
    if (!property) return;
    const buyersWithPhone = items.filter(b => (b.phone || '').replace(/[^0-9]/g, ''));
    buyersWithPhone.forEach((buyer, index) => {
      const cleanPhone = (buyer.phone || '').replace(/[^0-9]/g, '');
      if (!cleanPhone) return;
      const firstName = (buyer.name || buyer.title).split(' ')[0];
      const message = `Hi ${firstName}, I have a property that I think could be a good fit for you. Here's the brochure for ${property.title}: ${getHuspyLink(property.id)}`;
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      setTimeout(() => window.open(url, '_blank'), index * 300);
    });
    toast.success(`Opening ${buyersWithPhone.length} WhatsApp ${buyersWithPhone.length === 1 ? 'tab' : 'tabs'}`);
    onComplete?.();
    handleOpenChange(false);
  };


  const getStepTitle = () => {
    if (currentStep === 'menu') return 'Share properties';
    return 'Share via WhatsApp';
  };

  const getModalHeight = () => {
    if (currentStep === 'menu') return MENU_HEIGHT;
    return WHATSAPP_HEIGHT;
  };

  return (
    <WizardModal
      open={open}
      onOpenChange={handleOpenChange}
      currentStep={stepToNumber(currentStep)}
      totalSteps={2}
      stepTitles={[getStepTitle(), getStepTitle()]}
      stepDescriptions={[getSubtitle(), getSubtitle()]}
      size="md"
      contentClassName="z-[110]"
      overlayClassName="z-[110]"
      onBack={handleBack}
      showProgressBar={false}
      fixedHeight={getModalHeight()}
      hideFooter={currentStep !== 'whatsapp' || direction === 'property-to-buyers'}
      nextLabel={`Share with ${client?.name?.split(' ')[0] || 'client'}`}
      onNext={handleWhatsAppShareClient}
      canProceed={true}
      disableInternalAnimation
    >
      <div className="relative h-full overflow-hidden">
        {/* Step 1: Menu */}
        <div
          className={cn(
            "transition-all duration-500 ease-out",
            currentStep === 'menu'
              ? "opacity-100 translate-x-0 h-full"
              : "opacity-0 -translate-x-full absolute inset-0 pointer-events-none h-0 overflow-hidden"
          )}
        >
          <div className="flex flex-col pb-4">
            {/* Preview — stacked image mosaic with count */}
            {direction === 'properties-to-client' ? (
              <div className="mb-4">
                <div className="flex items-center gap-3">
                  {/* Overlapping image stack */}
                  <div className="flex items-center flex-shrink-0">
                    {items.slice(0, 4).map((item, i) => (
                      <div
                        key={item.id}
                        className="w-12 h-12 rounded-xl overflow-hidden border-2 border-card bg-muted flex-shrink-0 shadow-sm"
                        style={{ marginLeft: i > 0 ? -12 : 0, zIndex: 4 - i }}
                      >
                        {item.image ? (
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
                            {item.title.charAt(0)}
                          </div>
                        )}
                      </div>
                    ))}
                    {items.length > 4 && (
                      <div
                        className="w-12 h-12 rounded-xl border-2 border-card bg-raised flex items-center justify-center text-xs font-semibold text-muted-foreground flex-shrink-0 shadow-sm"
                        style={{ marginLeft: -12, zIndex: 0 }}
                      >
                        +{items.length - 4}
                      </div>
                    )}
                  </div>
                  {/* Summary text */}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {items.length} {items.length === 1 ? 'property' : 'properties'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {items.slice(0, 2).map(i => i.title).join(', ')}{items.length > 2 ? ` and ${items.length - 2} more` : ''}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <div className="flex items-center gap-3">
                  {/* Overlapping avatars */}
                  <div className="flex items-center flex-shrink-0">
                    {items.slice(0, 4).map((item, i) => (
                      <div
                        key={item.id}
                        className="flex-shrink-0"
                        style={{ marginLeft: i > 0 ? -8 : 0, zIndex: 4 - i }}
                      >
                        <UserAvatar name={item.name || item.title} size="sm" className="border-2 border-card shadow-sm" />
                      </div>
                    ))}
                    {items.length > 4 && (
                      <div
                        className="w-8 h-8 rounded-full border-2 border-card bg-raised flex items-center justify-center text-[10px] font-semibold text-muted-foreground flex-shrink-0 shadow-sm"
                        style={{ marginLeft: -8, zIndex: 0 }}
                      >
                        +{items.length - 4}
                      </div>
                    )}
                  </div>
                  {/* Summary text */}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {items.length} {items.length === 1 ? 'buyer' : 'buyers'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {items.slice(0, 2).map(i => (i.name || i.title).split(' ')[0]).join(', ')}{items.length > 2 ? ` and ${items.length - 2} more` : ''}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action rows */}
            <div className="space-y-1">
              {/* Download PDFs */}
              <button
                onClick={handleDownloadPDFs}
                className="w-full flex items-center justify-between py-3 px-2 rounded-lg hover:bg-muted transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                    <Download className="w-4 h-4 text-foreground" />
                  </div>
                  <span className="text-sm font-medium">
                    {direction === 'properties-to-client'
                      ? `Download ${items.length} PDF${items.length !== 1 ? 's' : ''}`
                      : 'Download PDF'}
                  </span>
                </div>
              </button>

              {/* Share via WhatsApp */}
              <button
                onClick={() => setCurrentStep('whatsapp')}
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

              {/* Copy links */}
              <button
                onClick={handleCopyLinks}
                className="w-full flex items-center py-3 px-2 rounded-lg hover:bg-muted transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                    <Link2 className="w-4 h-4 text-foreground" />
                  </div>
                  <span className="text-sm font-medium">
                    {direction === 'properties-to-client'
                      ? `Copy ${items.length} link${items.length !== 1 ? 's' : ''}`
                      : 'Copy link'}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Step 2: WhatsApp */}
        <div
          className={cn(
            "transition-all duration-500 ease-out",
            currentStep === 'whatsapp'
              ? "opacity-100 translate-x-0 h-full"
              : "opacity-0 translate-x-full absolute inset-0 pointer-events-none h-0 overflow-hidden"
          )}
        >
          {direction === 'properties-to-client' && client ? (
            /* Buy/Rent: Share multiple properties with one client */
            <div className="flex flex-col gap-4 pb-4">
              {/* Client info */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <UserAvatar name={client.name} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{client.name}</p>
                  <p className="text-xs text-muted-foreground">{client.phone}</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-tier-success ml-auto flex-shrink-0" />
              </div>

              {/* Share as selector */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-muted-foreground">Share as</p>
                <div className="flex gap-2">
                  {/* PDF brochure */}
                  <button
                    onClick={() => setLinkType('pdf')}
                    className={cn(
                      "flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 transition-all text-left",
                      linkType === 'pdf'
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

                  {/* Idealista */}
                  <button
                    onClick={() => setLinkType('idealista')}
                    className={cn(
                      "flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 transition-all text-left",
                      linkType === 'idealista'
                        ? "border-foreground bg-foreground/5"
                        : "border-border hover:border-foreground/30"
                    )}
                  >
                    <img src={idealistaLogo} alt="Idealista" className="w-5 h-5 object-cover rounded-sm flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">Idealista</p>
                      <p className="text-[10px] text-muted-foreground">Portal link</p>
                    </div>
                  </button>

                  {/* Fotocasa */}
                  <button
                    onClick={() => setLinkType('fotocasa')}
                    className={cn(
                      "flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 transition-all text-left",
                      linkType === 'fotocasa'
                        ? "border-foreground bg-foreground/5"
                        : "border-border hover:border-foreground/30"
                    )}
                  >
                    <img src={fotocasaLogo} alt="Fotocasa" className="w-5 h-5 object-cover rounded-sm flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">Fotocasa</p>
                      <p className="text-[10px] text-muted-foreground">Portal link</p>
                    </div>
                  </button>

                  {/* Huspy */}
                  <button
                    onClick={() => setLinkType('huspy')}
                    className={cn(
                      "flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 transition-all text-left",
                      linkType === 'huspy'
                        ? "border-foreground bg-foreground/5"
                        : "border-border hover:border-foreground/30"
                    )}
                  >
                    <img src={huspyLogo} alt="Huspy" className="w-5 h-5 object-cover rounded-sm flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">Huspy</p>
                      <p className="text-[10px] text-muted-foreground">Portal link</p>
                    </div>
                  </button>
                </div>

                {/* Fallback notice when a portal is selected but some items don't have that portal link */}
                {(linkType === 'idealista' || linkType === 'fotocasa') && portalStats.withoutPortal > 0 && (
                  <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-accent-orange/10 text-xs">
                    <AlertCircle className="w-3.5 h-3.5 text-accent-orange flex-shrink-0 mt-0.5" />
                    <span className="text-foreground/80">
                      {portalStats.withoutPortal} {portalStats.withoutPortal === 1 ? 'property doesn\'t' : 'properties don\'t'} have a {linkType === 'idealista' ? 'Idealista' : 'Fotocasa'} link and will use the Huspy link instead.
                    </span>
                  </div>
                )}
              </div>

              {/* Generated message preview */}
              <div className="bg-muted/30 rounded-xl p-4 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] text-muted-foreground font-semibold">Message preview</p>
                  <button
                    onClick={handleCopyMessage}
                    className="flex items-center gap-1 text-[10px] font-medium text-foreground hover:text-foreground/70 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    Copy
                  </button>
                </div>
                <div className="max-h-[180px] overflow-y-auto">
                  <p className="text-sm leading-relaxed">
                    Hi {client.name.split(' ')[0]}, I have some properties that might interest you:
                  </p>
                  <ul className="mt-2 space-y-2">
                    {items.map(item => (
                      <li key={item.id} className="text-sm flex flex-col gap-0.5">
                        <span className="flex items-center gap-2">
                          <span className="text-foreground">•</span>
                          <span className="truncate">{item.title}</span>
                        </span>
                        <span className="text-xs text-muted-foreground ml-4 break-all">
                          {getItemLink(item)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            /* Sell/Lease: Share one property with multiple buyers */
            <div className="flex flex-col gap-3 pb-4">
              {/* Message preview with copy */}
              <div className="bg-muted/30 rounded-xl p-4 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">Message preview</p>
                  <button
                    onClick={handleCopyMessage}
                    className="flex items-center gap-1.5 text-xs font-medium text-foreground hover:text-foreground/70 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </button>
                </div>
                <div className="max-h-[180px] overflow-y-auto">
                  <p className="text-sm leading-relaxed">
                    {getPropertyMessage()}
                  </p>
                </div>
                <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
                  You can copy this message and share it via WhatsApp Broadcast or forward it to multiple contacts. Or share individually with each buyer below.
                </p>
              </div>

              {/* Main CTA: open all */}
              <Button
                className="w-full gap-2"
                onClick={handleWhatsAppShareAll}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Share with all {items.length} via WhatsApp
              </Button>

              <p className="text-[10px] text-muted-foreground text-center">
                Opens {items.length} WhatsApp {items.length === 1 ? 'tab' : 'tabs'} — one per buyer
              </p>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-muted-foreground font-semibold">Or share individually</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Individual buyer CTAs */}
              <ScrollArea className="max-h-[180px]">
                <div className="space-y-1">
                  {items.map(buyer => (
                    <div
                      key={buyer.id}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors"
                    >
                      <UserAvatar name={buyer.name || buyer.title} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{buyer.name || buyer.title}</p>
                        {buyer.phone && (
                          <p className="text-xs text-muted-foreground">{buyer.phone}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-shrink-0 gap-1.5 text-xs h-8"
                        onClick={() => handleWhatsAppShareBuyer(buyer)}
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        Share
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>
    </WizardModal>
  );
}
