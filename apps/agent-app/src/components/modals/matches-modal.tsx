import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Trash2, Bookmark, MapPin, Euro, Bed, TrendingUp, Share, Building, Undo2, User, Megaphone, FileOutput, ExternalLink, ArrowLeft, GalleryHorizontalEnd, List } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PropertyPreviewModal } from "@/components/modals/property-preview-modal";
import { PropertyDetails } from "@/pages/properties/PropertyDetails";
import { ClientDetails, type EmbeddedClientData, type OpportunityContext } from "@/pages/clients/ClientDetails";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { MatchesDevTool, MatchViewMode, PreviewMode, LayoutMode } from "@/components/dev-tools/matches-dev-tool";
import { KeyboardShortcutsTutorial, ShortcutsHintButton } from "@/components/matches/keyboard-shortcuts-tutorial";
import { MatchCardImageCarousel } from "@/components/matches/match-card-image-carousel";
import type { OpportunityType } from "@/types";
import { MatchesTableView } from "@/components/matches/matches-table-view";
import { SharePropertyModal } from "@/components/modals/share-property-modal";
import { BulkShareModal, BulkShareItem } from "@/components/modals/bulk-share-modal";

// Image component with loading state and lazy loading
function LoadingImage({ 
  src, 
  alt, 
  className,
  eager = false 
}: { 
  src: string; 
  alt: string; 
  className?: string;
  eager?: boolean;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // Reset loading state when src changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);
  
  return (
    <>
      {/* Loading skeleton */}
      {!isLoaded && !hasError && (
        <div className={cn("absolute inset-0 bg-zinc-700 animate-pulse", className)} />
      )}
      <img 
        src={src} 
        alt={alt}
        className={cn(
          className,
          "transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
      />
    </>
  );
}
import apartmentImage1 from "@/assets/apartment-la-latina-1.jpg";
import apartmentImage2 from "@/assets/apartment-la-latina-2.jpg";
import apartmentImage3 from "@/assets/apartment-la-latina-3.jpg";
import apartmentImage4 from "@/assets/apartment-la-latina-4.jpg";
import propertyInterior1 from "@/assets/property-interior-1.jpg";
import propertyInterior2 from "@/assets/property-interior-2.jpg";
import propertyLuxury1 from "@/assets/property-luxury-1.jpg";
import propertyLuxury2 from "@/assets/property-luxury-2.jpg";
import propertyModern1 from "@/assets/property-modern-1.jpg";
import propertyModern2 from "@/assets/property-modern-2.jpg";
import propertyPenthouse1 from "@/assets/property-penthouse-1.jpg";
import propertyPenthouse2 from "@/assets/property-penthouse-2.jpg";
import propertyStudio1 from "@/assets/property-studio-1.jpg";
import propertyStudio2 from "@/assets/property-studio-2.jpg";
import propertyVilla1 from "@/assets/property-villa-1.jpg";
import propertyVilla2 from "@/assets/property-villa-2.jpg";

// Portal logos
import idealistaLogo from "@/assets/idealista-logo.png";
import fotocasaLogo from "@/assets/fotocasa-logo-new.png";
import pisosLogo from "@/assets/pisos-logo.png";

// Image sets for variety
const imageSets = [
  [apartmentImage1, apartmentImage2, apartmentImage3, apartmentImage4],
  [propertyInterior1, propertyInterior2, apartmentImage1, apartmentImage2],
  [propertyLuxury1, propertyLuxury2, propertyInterior1, propertyInterior2],
  [propertyModern1, propertyModern2, propertyLuxury1, propertyLuxury2],
  [propertyPenthouse1, propertyPenthouse2, propertyModern1, propertyModern2],
  [propertyStudio1, propertyStudio2, propertyPenthouse1, propertyPenthouse2],
  [propertyVilla1, propertyVilla2, propertyStudio1, propertyStudio2],
  [propertyLuxury1, propertyModern1, propertyVilla1, propertyPenthouse1],
  [propertyInterior2, propertyLuxury2, propertyModern2, propertyVilla2],
  [propertyStudio1, propertyInterior1, propertyPenthouse2, apartmentImage3],
];

// Source badge colors
const sourceColors: Record<string, string> = {
  'Idealista': 'hsl(65, 85%, 70%)',      // portal-idealista
  'Fotocasa': 'hsl(236, 54%, 43%)',      // portal-fotocasa
  'Pisos': 'hsl(194, 74%, 58%)',         // portal-pisos
  'Marketing campaign': 'hsl(0, 0%, 80%, 0.8)',
  'Self created': 'hsl(0, 0%, 80%, 0.8)',
};

// Portal logo mapping
const portalLogos: Record<string, string> = {
  'Idealista': idealistaLogo,
  'Fotocasa': fotocasaLogo,
  'Pisos': pisosLogo,
};

interface MatchProperty {
  id: string;
  title: string;
  location: string;
  price: number;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  size: number;
  sizeUnit: string;
  propertyType: string;
  images: string[];
  publishedDate: string;
  isTopMatch: boolean;
  isNew: boolean;
  owner: {
    name: string;
    initials: string;
    avatar?: string;
    isYou?: boolean;
  };
  matchingPreferences: string[];
}

interface MatchClient {
  id: string;
  name: string;
  clientSince: string;
  source: 'Idealista' | 'Fotocasa' | 'Pisos' | 'Marketing campaign' | 'Self created';
  isNew: boolean;
  isTopMatch: boolean;
  owner: {
    name: string;
    initials: string;
    avatar?: string;
    isYou?: boolean;
  };
  preferences: {
    propertyTypes: string[];
    locations: string[];
    priceRange: { min: number; max: number; currency: string };
    bedrooms: number;
    sizeRange: { min: number; max: number; unit: string };
    extras: string[];
  };
}

interface MatchesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunityId: string;
  opportunityTitle?: string;
  opportunityType?: string;
  opportunityClient?: {
    id: string;
    name: string;
    phone: string;
  };
  opportunityProperty?: {
    id: string;
    type: OpportunityType;
    propertyType: string;
    location: string;
    price: number;
    currency: string;
    bedrooms: number;
    size: number;
    sizeUnit: string;
    image?: string;
  };
}

// Generate mock matches data
// Mock avatar URLs
const avatarUrls = [
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
];

const generateMockMatches = (): MatchProperty[] => {
  const properties = [
    {
      id: "1",
      title: "Piso en venta en Calle de Don Ramón de la Cruz",
      location: "Salamanca, Madrid",
      price: 1150000,
      currency: "€",
      bedrooms: 3,
      bathrooms: 2,
      size: 120,
      sizeUnit: "m²",
      propertyType: "Apartment",
      images: imageSets[0],
      publishedDate: "1 year ago",
      isTopMatch: true,
      isNew: true,
      owner: { name: "you", initials: "ME", avatar: avatarUrls[0], isYou: true },
      matchingPreferences: ["Apartment", "Madrid", "€1.1M", "3 beds", "120 m²", "Terrace", "Parking", "Pool"]
    },
    {
      id: "2",
      title: "Ático en Venta en Valdefuentes (Hortaleza)",
      location: "Hortaleza, Madrid",
      price: 3000,
      currency: "€",
      bedrooms: 3,
      bathrooms: 2,
      size: 200,
      sizeUnit: "m²",
      propertyType: "Penthouse",
      images: imageSets[1],
      publishedDate: "1 month ago",
      isTopMatch: true,
      isNew: true,
      owner: { name: "Matthieu Capelle", initials: "MC", avatar: avatarUrls[1], isYou: false },
      matchingPreferences: ["Penthouse", "Madrid", "€3k", "3 beds", "200 m²", "Gym", "Concierge"]
    },
    {
      id: "3",
      title: "Piso en Venta en Recoletos (Salamanca)",
      location: "Salamanca, Madrid",
      price: 8000000,
      currency: "€",
      bedrooms: 5,
      bathrooms: 3,
      size: 150,
      sizeUnit: "m²",
      propertyType: "Apartment",
      images: imageSets[2],
      publishedDate: "2 months ago",
      isTopMatch: true,
      isNew: false,
      owner: { name: "you", initials: "ME", avatar: avatarUrls[0], isYou: true },
      matchingPreferences: ["Apartment", "Madrid", "€8M", "5 beds", "150 m²", "Garden", "Security", "Views", "Storage"]
    },
    {
      id: "4",
      title: "Villa de lujo en La Moraleja",
      location: "La Moraleja, Madrid",
      price: 4500000,
      currency: "€",
      bedrooms: 6,
      bathrooms: 4,
      size: 450,
      sizeUnit: "m²",
      propertyType: "Villa",
      images: imageSets[3],
      publishedDate: "3 weeks ago",
      isTopMatch: false,
      isNew: true,
      owner: { name: "Carlos Mendez", initials: "CM", avatar: avatarUrls[4], isYou: false },
      matchingPreferences: ["Villa", "Madrid", "€4.5M", "6 beds", "450 m²", "Pool", "Garden", "Garage"]
    },
    {
      id: "5",
      title: "Apartamento en el centro histórico",
      location: "Centro, Madrid",
      price: 750000,
      currency: "€",
      bedrooms: 2,
      bathrooms: 1,
      size: 85,
      sizeUnit: "m²",
      propertyType: "Apartment",
      images: imageSets[4],
      publishedDate: "5 days ago",
      isTopMatch: false,
      isNew: true,
      owner: { name: "Ana García", initials: "AG", avatar: avatarUrls[2], isYou: false },
      matchingPreferences: ["Apartment", "Madrid", "€750k", "2 beds", "85 m²"]
    },
  ];
  
  // Generate more mock data
  const extraPreferences = ["Terrace", "Parking", "Pool", "Gym", "Garden", "Security", "Concierge", "Views", "Storage", "Balcony"];
  const agentNames = ["Sofia Martinez", "Pablo Ruiz", "Elena Torres", "Miguel Santos", "Laura Fernandez"];
  
  for (let i = 6; i <= 15; i++) {
    // Randomly add 0-5 extra preferences to make +x pill appear on some cards
    const numExtra = Math.floor(Math.random() * 6);
    const shuffled = [...extraPreferences].sort(() => Math.random() - 0.5);
    const extras = shuffled.slice(0, numExtra);
    const isOwnedByYou = Math.random() > 0.6;
    const agentName = agentNames[Math.floor(Math.random() * agentNames.length)];
    const avatarIndex = Math.floor(Math.random() * avatarUrls.length);
    
    properties.push({
      id: String(i),
      title: `Propiedad ${i} en Madrid`,
      location: "Madrid Centro",
      price: Math.floor(Math.random() * 2000000) + 500000,
      currency: "€",
      bedrooms: Math.floor(Math.random() * 4) + 1,
      bathrooms: Math.floor(Math.random() * 3) + 1,
      size: Math.floor(Math.random() * 150) + 50,
      sizeUnit: "m²",
      propertyType: ["Apartment", "Penthouse", "Villa"][Math.floor(Math.random() * 3)],
      images: imageSets[(i - 1) % imageSets.length],
      publishedDate: `${Math.floor(Math.random() * 12) + 1} months ago`,
      isTopMatch: Math.random() > 0.7,
      isNew: Math.random() > 0.6,
      owner: isOwnedByYou 
        ? { name: "you", initials: "ME", avatar: avatarUrls[0], isYou: true }
        : { name: agentName, initials: agentName.split(' ').map(n => n[0]).join(''), avatar: avatarUrls[avatarIndex], isYou: false },
      matchingPreferences: ["Apartment", "Madrid", "€1M", "3 beds", "120 m²", ...extras]
    });
  }
  
  return properties;
};

// Generate mock client matches
const generateMockClients = (): MatchClient[] => {
  const clientNames = [
    "Alejandro Ramirez",
    "Sofia Martinez",
    "Carlos Mendez",
    "Elena Torres",
    "Miguel Santos",
    "Laura Fernandez",
    "Pablo Ruiz",
    "Ana García",
    "Diego Lopez",
    "Maria Rodriguez",
  ];
  
  const sources: ('Idealista' | 'Fotocasa' | 'Pisos' | 'Marketing campaign' | 'Self created')[] = ['Idealista', 'Fotocasa', 'Pisos', 'Marketing campaign', 'Self created'];
  const propertyTypes = ['Apartment', 'Penthouse', 'Villa', 'Studio', 'Loft'];
  const locations = ['La Latina', 'Salamanca', 'Chamberí', 'Centro', 'Retiro', 'Malasaña'];
  const extras = ['Terrace', 'Parking', 'Pool', 'Gym', 'Garden', 'Security', 'Elevator', 'Storage'];
  
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  return clientNames.map((name, i) => {
    const numLocations = Math.floor(Math.random() * 3) + 1;
    const numTypes = Math.floor(Math.random() * 2) + 1;
    const numExtras = Math.floor(Math.random() * 8);
    const shuffledLocations = [...locations].sort(() => Math.random() - 0.5);
    const shuffledTypes = [...propertyTypes].sort(() => Math.random() - 0.5);
    const shuffledExtras = [...extras].sort(() => Math.random() - 0.5);
    const isOwnedByYou = Math.random() > 0.6;
    const agentName = clientNames[Math.floor(Math.random() * clientNames.length)];
    const avatarIndex = Math.floor(Math.random() * avatarUrls.length);
    
    // First 5 clients get one of each source type
    const clientSource = i < 5 ? sources[i] : sources[Math.floor(Math.random() * sources.length)];
    
    return {
      id: `client-${i + 1}`,
      name,
      clientSince: `${months[Math.floor(Math.random() * 12)]} 202${Math.floor(Math.random() * 3) + 3}`,
      source: clientSource,
      isNew: Math.random() > 0.6,
      isTopMatch: numExtras >= 4, // Top match if has 4+ matching extras
      owner: isOwnedByYou 
        ? { name: "you", initials: "ME", avatar: avatarUrls[0], isYou: true }
        : { name: agentName, initials: agentName.split(' ').map(n => n[0]).join(''), avatar: avatarUrls[avatarIndex], isYou: false },
      preferences: {
        propertyTypes: shuffledTypes.slice(0, numTypes),
        locations: shuffledLocations.slice(0, numLocations),
        priceRange: { 
          min: Math.floor(Math.random() * 300 + 200) * 1000, 
          max: Math.floor(Math.random() * 500 + 400) * 1000, 
          currency: '€' 
        },
        bedrooms: Math.floor(Math.random() * 4) + 1,
        sizeRange: { 
          min: Math.floor(Math.random() * 80 + 60), 
          max: Math.floor(Math.random() * 100 + 120), 
          unit: 'm²' 
        },
        extras: shuffledExtras.slice(0, numExtras),
      },
    };
  });
};

type ActionState = 'idle' | 'discarding' | 'saving' | 'undoing';


export function MatchesModal({ 
  open, 
  onOpenChange, 
  opportunityId,
  opportunityTitle,
  opportunityType = "Buy",
  opportunityClient,
  opportunityProperty
}: MatchesModalProps) {
  const [matches] = useState<MatchProperty[]>(() => 
    generateMockMatches().sort((a, b) => (b.isTopMatch ? 1 : 0) - (a.isTopMatch ? 1 : 0))
  );
  const [clientMatches] = useState<MatchClient[]>(() => 
    generateMockClients().sort((a, b) => (b.isTopMatch ? 1 : 0) - (a.isTopMatch ? 1 : 0))
  );
  const [viewMode, setViewMode] = useState<MatchViewMode>('properties');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('expand');
  
  // Image carousel is always enabled now (no longer a toggle)

  // Share action toggle with localStorage persistence
  const SHARE_ACTION_STORAGE_KEY = 'matches-share-action-enabled';
  const [showShareAction, setShowShareActionState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(SHARE_ACTION_STORAGE_KEY);
      return stored === 'true';
    }
    return false;
  });
  const setShowShareAction = useCallback((enabled: boolean) => {
    setShowShareActionState(enabled);
    localStorage.setItem(SHARE_ACTION_STORAGE_KEY, String(enabled));
  }, []);

   // Bulk actions toggle with localStorage persistence
  const BULK_ACTIONS_STORAGE_KEY = 'matches-bulk-actions-enabled';
  const [showBulkActions, setShowBulkActionsState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(BULK_ACTIONS_STORAGE_KEY);
      return stored === null ? true : stored === 'true';
    }
    return true;
  });
  const setShowBulkActions = useCallback((enabled: boolean) => {
    setShowBulkActionsState(enabled);
    localStorage.setItem(BULK_ACTIONS_STORAGE_KEY, String(enabled));
  }, []);

  // Hover actions toggle with localStorage persistence
  const HOVER_ACTIONS_STORAGE_KEY = 'matches-hover-actions-enabled';
  const [showHoverActions, setShowHoverActionsState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(HOVER_ACTIONS_STORAGE_KEY);
      return stored === 'true';
    }
    return false;
  });
  const setShowHoverActions = useCallback((enabled: boolean) => {
    setShowHoverActionsState(enabled);
    localStorage.setItem(HOVER_ACTIONS_STORAGE_KEY, String(enabled));
  }, []);

  // Bulk share modal state
  const [bulkShareModalOpen, setBulkShareModalOpen] = useState(false);
  const [bulkShareItems, setBulkShareItems] = useState<BulkShareItem[]>([]);
  const [bulkShareDirection, setBulkShareDirection] = useState<'properties-to-client' | 'property-to-buyers'>('properties-to-client');

  const handleBulkShare = useCallback((selectedIds: Set<string>) => {
    if (viewMode === 'properties') {
      // Buy/Rent: share selected property matches with the opportunity's client
      const selectedProperties = matches.filter(m => selectedIds.has(m.id));
      setBulkShareItems(selectedProperties.map(p => ({
        id: p.id,
        title: p.title,
        image: p.images[0],
        // Properties not owned by "you" simulate having an external portal link
        portalLink: !p.owner.isYou ? `https://www.idealista.com/inmueble/${p.id}/` : undefined,
      })));
      setBulkShareDirection('properties-to-client');
    } else {
      // Sell/Lease: share the opportunity's property with selected client matches
      const selectedClients = clientMatches.filter(c => selectedIds.has(c.id));
      setBulkShareItems(selectedClients.map(c => ({
        id: c.id,
        title: c.name,
        name: c.name,
        phone: '+34 612 345 678',
      })));
      setBulkShareDirection('property-to-buyers');
    }
    setBulkShareModalOpen(true);
  }, [viewMode, matches, clientMatches]);

  
  // Track current image index per card for carousel feature
  const [cardImageIndices, setCardImageIndices] = useState<Map<string, number>>(new Map());
  
  // Layout mode with localStorage persistence - default to carousel
  const LAYOUT_MODE_STORAGE_KEY = 'matches-layout-mode';
  const [layoutMode, setLayoutModeState] = useState<LayoutMode>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LAYOUT_MODE_STORAGE_KEY);
      if (stored === 'carousel' || stored === 'table') {
        return stored;
      }
    }
    return 'table'; // Default to table
  });
  const isMobile = useIsMobile();
  
  // Desktop detection (1280px+ for showcase mode)
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1280;
    }
    return true;
  });
  
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1280);
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Check on mount
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Sidebar scroll state for gradient fades
  const sidebarScrollRef = useRef<HTMLDivElement>(null);
  const [sidebarScrollState, setSidebarScrollState] = useState({ atTop: true, atBottom: false });
  
  // Force carousel mode on mobile and tablet (< 1280px)
  const effectiveLayoutMode = useMemo(() => {
    if (!isDesktop && layoutMode === 'table') return 'table';
    return layoutMode;
  }, [isDesktop, layoutMode]);
  
  const [isCardExpanded, setIsCardExpanded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCardTransitioning, setIsCardTransitioning] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());
  const [actionState, setActionState] = useState<ActionState>('idle');
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'color' | 'slide'>('idle');
  const [undoPhase, setUndoPhase] = useState<'idle' | 'slide' | 'color'>('idle');
  const [lastAction, setLastAction] = useState<{ type: 'discard' | 'save', property?: MatchProperty, client?: MatchClient } | null>(null);
  const [isEntering, setIsEntering] = useState(false);
  const [isUndoEntering, setIsUndoEntering] = useState(false);
  const [undoType, setUndoType] = useState<'discard' | 'save' | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [expandedMatch, setExpandedMatch] = useState<MatchProperty | null>(null);
  const [expandedCardRect, setExpandedCardRect] = useState<DOMRect | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const sidebarCardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  
  // Client expansion state (for sell/lease opportunities)
  const [expandedClient, setExpandedClient] = useState<MatchClient | null>(null);
  const [expandedClientCardRect, setExpandedClientCardRect] = useState<DOMRect | null>(null);
  const [isClientCardExpanded, setIsClientCardExpanded] = useState(false);
  const clientCardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Share modal state
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareModalProperty, setShareModalProperty] = useState<{ id: string; title: string; image: string; images?: string[] } | null>(null);
  const [sharePreSelectedClient, setSharePreSelectedClient] = useState<{ id: string; name: string; phone: string } | undefined>(undefined);
  
  // Check if user has seen the tutorial before
  const TUTORIAL_STORAGE_KEY = 'matches-shortcuts-tutorial-seen';
  
  // Disabled auto-showing tutorial on first visit - users can open it via the shortcuts hint button
  // useEffect(() => {
  //   if (open && isVisible) {
  //     const hasSeenTutorial = localStorage.getItem(TUTORIAL_STORAGE_KEY);
  //     if (!hasSeenTutorial) {
  //       // Show tutorial after a short delay for better UX
  //       const timer = setTimeout(() => {
  //         setShowTutorial(true);
  //       }, 800);
  //       return () => clearTimeout(timer);
  //     }
  //   }
  // }, [open, isVisible]);
  
  const handleCloseTutorial = useCallback(() => {
    setShowTutorial(false);
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
  }, []);
  
  // Swipe/drag gesture state (shared between touch and mouse)
  // scrollPosition represents the continuous scroll offset in pixels (0 = first card centered)
  const [scrollPosition, setScrollPosition] = useState(0);
  const [dragStart, setDragStart] = useState<{ x: number; time: number; scrollStart: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [cardSpacing, setCardSpacing] = useState(350); // Dynamic card spacing
  const [cardWidth, setCardWidth] = useState(326); // Dynamic card width
  const [isLayoutTransitioning, setIsLayoutTransitioning] = useState(false);
  
  // Persist layout mode changes to localStorage and sync scroll position with fade transition
  const setLayoutMode = useCallback((newMode: LayoutMode) => {
    if (newMode === layoutMode) return;
    
    // Start fade out
    setIsLayoutTransitioning(true);
    
    // After fade out, change mode and fade in
    setTimeout(() => {
      setLayoutModeState(newMode);
      localStorage.setItem(LAYOUT_MODE_STORAGE_KEY, newMode);
      
      // Reset scroll position when switching to carousel to ensure scrolling works
      if (newMode === 'carousel') {
        setScrollPosition(currentIndex * cardSpacing);
      }
      
      // Fade back in after a brief moment for DOM to update
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsLayoutTransitioning(false);
        });
      });
    }, 150);
  }, [currentIndex, cardSpacing, layoutMode]);
  // Measure actual card spacing from container width - responsive sizing
  useEffect(() => {
    const updateSpacing = () => {
      const screenWidth = window.innerWidth;
      // Mobile: 80% of screen width
      // Tablet (md): 50% clamped to 380-440px
      // Desktop (lg): 35% clamped to 400-520px  
      // Large desktop (xl): 30% clamped to 440-580px
      // Extra large (2xl): 28% clamped to 480-640px
      let width: number;
      let gap: number;
      
      if (screenWidth < 768) {
        // Mobile
        width = screenWidth * 0.80;
        gap = 16;
      } else if (screenWidth < 1024) {
        // Tablet (md)
        width = Math.max(340, Math.min(screenWidth * 0.50, 400));
        gap = 20;
      } else if (screenWidth < 1280) {
        // Desktop (lg)
        width = Math.max(360, Math.min(screenWidth * 0.32, 440));
        gap = 24;
      } else if (screenWidth < 1536) {
        // Large desktop (xl)
        width = Math.max(380, Math.min(screenWidth * 0.26, 460));
        gap = 28;
      } else {
        // Extra large (2xl)
        width = Math.max(400, Math.min(screenWidth * 0.22, 480));
        gap = 32;
      }
      
      const spacing = width + gap;
      setCardWidth(width);
      setCardSpacing(spacing);
    };
    updateSpacing();
    window.addEventListener('resize', updateSpacing);
    return () => window.removeEventListener('resize', updateSpacing);
  }, []);
  
  // Use cardSpacing as the constant
  const CARD_SPACING = cardSpacing;
  
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const carouselContainerRef = useRef<HTMLDivElement>(null);
  
  // Use different data based on view mode
  const activeMatches = viewMode === 'properties' 
    ? matches.filter(m => !dismissedIds.has(m.id) && !savedIds.has(m.id))
    : clientMatches.filter(c => !dismissedIds.has(c.id) && !savedIds.has(c.id));
  const currentMatch = viewMode === 'properties' ? activeMatches[currentIndex] as MatchProperty : null;
  const currentClient = viewMode === 'clients' ? activeMatches[currentIndex] as MatchClient : null;
  const totalMatches = activeMatches.length;
  
  // Preload images for nearby cards to prevent loading delay when navigating
  useEffect(() => {
    if (viewMode === 'properties') {
      // Preload images for current, previous, and next 2 cards
      const indicesToPreload = [
        currentIndex - 1,
        currentIndex,
        currentIndex + 1,
        currentIndex + 2,
      ].filter(i => i >= 0 && i < activeMatches.length);
      
      indicesToPreload.forEach(index => {
        const match = activeMatches[index] as MatchProperty;
        if (match?.images) {
          match.images.forEach(imgSrc => {
            const img = new Image();
            img.src = imgSrc;
          });
        }
      });
    }
  }, [currentIndex, activeMatches, viewMode]);
  
  // Handle animation states and body scroll lock
  useEffect(() => {
    if (open) {
      // Lock body scroll when modal is open
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      setIsMounted(true);
      setCurrentIndex(0);
      setScrollPosition(0); // Reset scroll position when opening
      setActionState('idle');
      setLastAction(null);
      setShowToast(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
          setIsEntering(true);
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setIsEntering(false);
            });
          });
        });
      });
      
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setIsMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Auto-hide toast after delay
  useEffect(() => {
    if (showToast) {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      toastTimeoutRef.current = setTimeout(() => {
        setShowToast(false);
        setLastAction(null);
      }, 4000);
    }
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, [showToast]);

  // (showcase sidebar scroll removed)

  const triggerCardEntrance = useCallback(() => {
    setIsEntering(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsEntering(false);
      });
    });
  }, []);

  const handleDiscard = useCallback(() => {
    const currentItem = viewMode === 'properties' ? currentMatch : currentClient;
    if (!currentItem || actionState !== 'idle') return;
    
    setActionState('discarding');
    setAnimationPhase('color');
    setLastAction({ 
      type: 'discard', 
      property: viewMode === 'properties' ? currentMatch : undefined,
      client: viewMode === 'clients' ? currentClient : undefined
    });
    
    // Phase 1: Show color for 300ms
    setTimeout(() => {
      setAnimationPhase('slide');
      
      // Phase 2: Slide out for 400ms
      setTimeout(() => {
        setDismissedIds(prev => new Set([...prev, currentItem.id]));
        setActionState('idle');
        setAnimationPhase('idle');
        setShowToast(true);
        
        if (currentIndex >= totalMatches - 1 && currentIndex > 0) {
          setCurrentIndex(prev => prev - 1);
        }
        
        triggerCardEntrance();
      }, 400);
    }, 300);
  }, [currentMatch, currentClient, viewMode, actionState, currentIndex, totalMatches, triggerCardEntrance]);

  const handleSave = useCallback(() => {
    const currentItem = viewMode === 'properties' ? currentMatch : currentClient;
    if (!currentItem || actionState !== 'idle') return;
    
    setActionState('saving');
    setAnimationPhase('color');
    setLastAction({ 
      type: 'save', 
      property: viewMode === 'properties' ? currentMatch : undefined,
      client: viewMode === 'clients' ? currentClient : undefined
    });
    
    // Phase 1: Show color for 300ms
    setTimeout(() => {
      setAnimationPhase('slide');
      
      // Phase 2: Slide out for 400ms
      setTimeout(() => {
        setSavedIds(prev => new Set([...prev, currentItem.id]));
        setActionState('idle');
        setAnimationPhase('idle');
        setShowToast(true);
        
        if (currentIndex >= totalMatches - 1 && currentIndex > 0) {
          setCurrentIndex(prev => prev - 1);
        }
        
        triggerCardEntrance();
      }, 400);
    }, 300);
  }, [currentMatch, currentClient, viewMode, actionState, currentIndex, totalMatches, triggerCardEntrance]);

  const handleUndo = useCallback(() => {
    if (!lastAction) return;
    
    setShowToast(false);
    
    const itemId = lastAction.property?.id || lastAction.client?.id;
    if (!itemId) return;
    
    // First, restore the card to the list (it will appear at its original position)
    if (lastAction.type === 'discard') {
      setDismissedIds(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    } else {
      setSavedIds(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
    
    // Find the index of the restored card and navigate to it
    const dataSource = viewMode === 'properties' ? matches : clientMatches;
    const newActiveMatches = dataSource.filter(m => 
      (m.id === itemId) || (!dismissedIds.has(m.id) && !savedIds.has(m.id))
    );
    const newIndex = newActiveMatches.findIndex(m => m.id === itemId);
    
    if (newIndex >= 0) {
      setCurrentIndex(newIndex);
    }
    
    // Reverse animation: start at slid-out position with color, then slide in, then fade color
    setUndoType(lastAction.type);
    setIsUndoEntering(true); // Start at the slid-out position
    setUndoPhase('slide'); // Show color immediately
    
    // Phase 1: After initial frame, start sliding in (400ms)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsUndoEntering(false); // Trigger slide animation to center
        
        // Phase 2: After slide completes, fade out color (300ms)
        setTimeout(() => {
          setUndoPhase('color'); // Now fading out color
          
          setTimeout(() => {
            setUndoPhase('idle');
            setUndoType(null);
          }, 300);
        }, 400);
      });
    });
    
    setLastAction(null);
    
    const itemType = viewMode === 'properties' ? 'Property' : 'Client';
    toast({
      title: `${itemType} restored`,
      description: `The ${itemType.toLowerCase()} has been added back to your matches.`
    });
  }, [lastAction, matches, clientMatches, viewMode, dismissedIds, savedIds]);

  const handleShare = useCallback(() => {
    if (!lastAction?.property && !lastAction?.client) return;
    const itemName = lastAction.property?.title || lastAction.client?.name || '';
    const itemType = lastAction.property ? 'property' : 'client';
    toast({
      title: `Share ${itemType}`,
      description: `Sharing ${itemName} with your client.`
    });
    setShowToast(false);
    setLastAction(null);
  }, [lastAction]);

  const handleSelectFromList = useCallback((index: number) => {
    if (actionState !== 'idle' || isCardTransitioning) return;
    if (index === currentIndex) return; // Already on this card
    
    // Trigger fade out, then change index, then fade in
    setIsCardTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setScrollPosition(index * CARD_SPACING); // Sync scroll position
      setTimeout(() => {
        setIsCardTransitioning(false);
        triggerCardEntrance();
      }, 50);
    }, 150);
  }, [actionState, isCardTransitioning, currentIndex, triggerCardEntrance, CARD_SPACING]);

  const handleExpandCard = useCallback((match: MatchProperty | MatchClient) => {
    if (actionState !== 'idle') return;
    // Mark as viewed
    setViewedIds(prev => new Set([...prev, match.id]));
    
    if (viewMode === 'properties') {
      // Capture the card's position for morph animation
      const cardElement = cardRefs.current.get(match.id);
      if (cardElement) {
        setExpandedCardRect(cardElement.getBoundingClientRect());
      }
      setExpandedMatch(match as MatchProperty);
      if (previewMode === 'modal') {
        setIsPreviewOpen(true);
      } else {
        // In-place expansion mode - use requestAnimationFrame for smooth animation
        requestAnimationFrame(() => {
          setIsCardExpanded(true);
        });
      }
    } else if (viewMode === 'clients') {
      // Client expansion logic
      const cardElement = clientCardRefs.current.get(match.id);
      if (cardElement) {
        setExpandedClientCardRect(cardElement.getBoundingClientRect());
      }
      setExpandedClient(match as MatchClient);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsClientCardExpanded(true);
        });
      });
    }
  }, [actionState, viewMode, previewMode]);

  const handleCollapseCard = useCallback(() => {
    if (previewMode === 'modal') {
      // Close the preview modal first (triggers animation)
      setIsPreviewOpen(false);
      // Clear the match data after animation completes
      setTimeout(() => {
        setExpandedMatch(null);
      }, 350);
    } else {
      // Collapse the expanded card (property or client)
      setIsCardExpanded(false);
      setIsClientCardExpanded(false);
      // Clear the match data after animation completes
      setTimeout(() => {
        setExpandedMatch(null);
        setExpandedClient(null);
      }, 350);
    }
  }, [previewMode]);
  
  const handleCollapseClientCard = useCallback(() => {
    setIsClientCardExpanded(false);
    setTimeout(() => {
      setExpandedClient(null);
    }, 350);
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // Fluid position-based scrolling - scrollPosition drives everything
  const VELOCITY_THRESHOLD = 0.3; // px/ms for momentum
  
  // Calculate current card based on scroll position (center card = selected)
  const getCenteredIndex = useCallback((pos: number) => {
    return Math.max(0, Math.min(Math.round(pos / CARD_SPACING), totalMatches - 1));
  }, [totalMatches, CARD_SPACING]);
  
  // Sync scrollPosition when currentIndex changes externally (keyboard, click)
  const lastSyncedIndex = useRef(currentIndex);
  useEffect(() => {
    if (!isDragging && currentIndex !== lastSyncedIndex.current) {
      setScrollPosition(currentIndex * CARD_SPACING);
      lastSyncedIndex.current = currentIndex;
    }
  }, [currentIndex, isDragging, CARD_SPACING]);
  
  // Refs for wheel handler to access current state values
  const scrollPositionRef = useRef(scrollPosition);
  const currentIndexRef = useRef(currentIndex);
  const actionStateRef = useRef(actionState);
  const expandedMatchRef = useRef(expandedMatch);
  const expandedClientRef = useRef(expandedClient);
  
  // Keep refs in sync with state
  useEffect(() => { scrollPositionRef.current = scrollPosition; }, [scrollPosition]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { actionStateRef.current = actionState; }, [actionState]);
  useEffect(() => { expandedMatchRef.current = expandedMatch; }, [expandedMatch]);
  useEffect(() => { expandedClientRef.current = expandedClient; }, [expandedClient]);

  // Snap to nearest card with optional momentum
  const snapToCard = useCallback((velocity: number = 0) => {
    const currentPos = scrollPositionRef.current;
    const momentumOffset = velocity * 120; // How far momentum carries
    const targetPosition = currentPos + momentumOffset;
    const targetIndex = getCenteredIndex(targetPosition);
    const finalPosition = targetIndex * CARD_SPACING;
    
    scrollPositionRef.current = finalPosition;
    setScrollPosition(finalPosition);
    setCurrentIndex(targetIndex);
    lastSyncedIndex.current = targetIndex;
  }, [getCenteredIndex, CARD_SPACING]);
  
  const handleDragStart = useCallback((x: number) => {
    if (actionState !== 'idle' || expandedMatch) return;
    setDragStart({ x, time: Date.now(), scrollStart: scrollPosition });
    setIsDragging(true);
  }, [actionState, expandedMatch, scrollPosition]);

  const handleDragMove = useCallback((x: number, deltaY: number, preventDefault?: () => void) => {
    if (!dragStart || actionState !== 'idle' || expandedMatch) return;
    const deltaX = x - dragStart.x;
    
    // Only track horizontal swipes
    if (Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      preventDefault?.();
      // Directly update scroll position - negative deltaX = scroll forward
      let newPosition = dragStart.scrollStart - deltaX;
      
      // Rubber-band effect at boundaries
      const minPos = 0;
      const maxPos = (totalMatches - 1) * CARD_SPACING;
      
      if (newPosition < minPos) {
        newPosition = minPos + (newPosition - minPos) * 0.25;
      } else if (newPosition > maxPos) {
        newPosition = maxPos + (newPosition - maxPos) * 0.25;
      }
      
      setScrollPosition(newPosition);
      
      // Update currentIndex based on centered card
      const centeredIdx = getCenteredIndex(newPosition);
      if (centeredIdx !== currentIndex) {
        setCurrentIndex(centeredIdx);
        lastSyncedIndex.current = centeredIdx;
      }
    }
  }, [dragStart, actionState, expandedMatch, totalMatches, currentIndex, getCenteredIndex, CARD_SPACING]);

  const handleDragEnd = useCallback(() => {
    if (!dragStart || actionState !== 'idle') {
      setDragStart(null);
      setIsDragging(false);
      return;
    }
    
    const elapsed = Math.max(1, Date.now() - dragStart.time);
    const distance = scrollPosition - dragStart.scrollStart;
    const velocity = distance / elapsed;
    
    setDragStart(null);
    setIsDragging(false);
    
    // Snap with momentum if velocity is high enough
    snapToCard(Math.abs(velocity) > VELOCITY_THRESHOLD ? velocity : 0);
  }, [dragStart, scrollPosition, actionState, snapToCard]);

  // Touch event handlers
  const lastTouchY = useRef(0);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    lastTouchY.current = touch.clientY;
    handleDragStart(touch.clientX);
  }, [handleDragStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const deltaY = touch.clientY - lastTouchY.current;
    handleDragMove(touch.clientX, deltaY, () => e.preventDefault());
  }, [handleDragMove]);

  const handleTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Mouse event handlers for click-hold-drag scrolling
  const mouseDragRef = useRef<{ startX: number; startTime: number; scrollStart: number } | null>(null);
  const didDragRef = useRef(false); // Track if we actually dragged (moved beyond threshold)
  const DRAG_THRESHOLD = 5; // Minimum pixels to consider it a drag vs a click
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only handle left mouse button
    if (e.button !== 0) return;
    // Prevent default to stop image dragging
    e.preventDefault();
    mouseDragRef.current = { startX: e.clientX, startTime: Date.now(), scrollStart: scrollPosition };
    didDragRef.current = false; // Reset drag flag
    handleDragStart(e.clientX);
  }, [handleDragStart, scrollPosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !mouseDragRef.current) return;
    e.preventDefault();
    
    // Check if we've moved beyond threshold
    const deltaX = Math.abs(e.clientX - mouseDragRef.current.startX);
    if (deltaX > DRAG_THRESHOLD) {
      didDragRef.current = true;
    }
    
    handleDragMove(e.clientX, 0);
  }, [isDragging, handleDragMove]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging || !mouseDragRef.current) {
      mouseDragRef.current = null;
      return;
    }
    
    // Calculate velocity for momentum
    const elapsed = Math.max(1, Date.now() - mouseDragRef.current.startTime);
    const distance = scrollPosition - mouseDragRef.current.scrollStart;
    const velocity = distance / elapsed;
    
    mouseDragRef.current = null;
    setDragStart(null);
    setIsDragging(false);
    
    // Snap with momentum if velocity is high enough
    snapToCard(Math.abs(velocity) > VELOCITY_THRESHOLD ? velocity : 0);
    
    // Keep didDragRef.current true briefly so click handler can check it
    setTimeout(() => {
      didDragRef.current = false;
    }, 50);
  }, [isDragging, scrollPosition, snapToCard, VELOCITY_THRESHOLD]);

  const handleMouseLeave = useCallback(() => {
    if (!isDragging) return;
    handleMouseUp();
  }, [isDragging, handleMouseUp]);
  
  // Card click handler that ignores clicks after dragging
  const handleCardClick = useCallback((index: number, isCurrent: boolean, item: MatchProperty | MatchClient) => {
    // Ignore click if we just finished dragging
    if (didDragRef.current) return;
    
    if (isCurrent) {
      handleExpandCard(item);
    } else {
      handleSelectFromList(index);
    }
  }, [handleExpandCard, handleSelectFromList]);

  // Wheel event handler for trackpad/mouse horizontal scrolling
  const wheelTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedDeltaRef = useRef(0);
  
  // Attach wheel event with passive: false to prevent browser back gesture
  useEffect(() => {
    const container = carouselContainerRef.current;
    if (!container || !open || effectiveLayoutMode !== 'carousel') return;
    
    const wheelHandler = (e: WheelEvent) => {
      if (actionStateRef.current !== 'idle' || expandedMatchRef.current || expandedClientRef.current) return;
      
      // Always prevent default to stop browser back/forward gestures
      e.preventDefault();
      e.stopPropagation();
      
      // Use deltaX for horizontal scroll, or deltaY for trackpad gestures
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      
      // Calculate bounds
      const minPos = 0;
      const maxPos = (totalMatches - 1) * CARD_SPACING;
      
      // Accumulate delta for smooth scrolling
      accumulatedDeltaRef.current += delta;
      
      // Calculate new position from current ref value
      let newPosition = scrollPositionRef.current + delta * 0.8;
      
      // Clamp to bounds with rubber-band effect
      if (newPosition < minPos) {
        newPosition = minPos + (newPosition - minPos) * 0.15;
      } else if (newPosition > maxPos) {
        newPosition = maxPos + (newPosition - maxPos) * 0.15;
      }
      
      // Update ref immediately for next wheel event
      scrollPositionRef.current = newPosition;
      setScrollPosition(newPosition);
      
      // Update current index based on position
      const centeredIdx = getCenteredIndex(newPosition);
      if (centeredIdx !== currentIndexRef.current) {
        currentIndexRef.current = centeredIdx;
        setCurrentIndex(centeredIdx);
        lastSyncedIndex.current = centeredIdx;
      }
      
      // Debounce snap after scrolling stops
      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }
      wheelTimeoutRef.current = setTimeout(() => {
        accumulatedDeltaRef.current = 0;
        snapToCard(0);
      }, 150);
    };
    
    // Use passive: false to allow preventDefault
    container.addEventListener('wheel', wheelHandler, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', wheelHandler);
      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }
    };
  }, [open, isMounted, isVisible, effectiveLayoutMode, totalMatches, CARD_SPACING, getCenteredIndex, snapToCard]);

  // No mouse drag on desktop - touch only for mobile/tablet

  // Keyboard navigation — table view handles its own D/S/arrows
  useEffect(() => {
    if (!open) return;
    // Skip keyboard shortcuts if tutorial or shortcuts modal is open
    if (showTutorial || showShortcutsModal) return;
    const isTableMode = effectiveLayoutMode === 'table';
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Cmd+Z / Ctrl+Z or U key (works in any state)
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
        return;
      }
      if (e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        handleUndo();
        return;
      }
      
      // Enter/Space toggles preview (works whether expanded or not)
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (expandedMatch || expandedClient) {
          handleCollapseCard();
        } else {
          const currentItem = viewMode === 'properties' ? currentMatch : currentClient;
          if (currentItem) {
            handleExpandCard(currentItem as any);
          }
        }
        return;
      }
      
      // Escape closes preview or modal
      if (e.key === 'Escape') {
        if (expandedMatch || expandedClient) {
          handleCollapseCard();
        } else {
          handleClose();
        }
        return;
      }
      
      // Discard and Save — table view handles its own
      if (!isTableMode) {
        if (e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          if (expandedMatch || expandedClient) {
            handleCollapseCard();
            setTimeout(handleDiscard, 100);
          } else {
            handleDiscard();
          }
          return;
        }
        if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          if (expandedMatch || expandedClient) {
            handleCollapseCard();
            setTimeout(handleSave, 100);
          } else {
            handleSave();
          }
          return;
        }
      }
      
      // Arrow navigation — table view handles its own up/down/enter
      if (!isTableMode) {
        if (expandedMatch || expandedClient) {
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            const scrollContainer = document.querySelector('[data-preview-scroll]');
            if (scrollContainer) {
              e.preventDefault();
              const scrollAmount = e.key === 'ArrowUp' ? -100 : 100;
              scrollContainer.scrollBy({ top: scrollAmount, behavior: 'smooth' });
            }
          }
        } else {
          if (e.key === 'ArrowUp' && currentIndex > 0) {
            e.preventDefault();
            setCurrentIndex(prev => prev - 1);
            triggerCardEntrance();
          } else if (e.key === 'ArrowDown' && currentIndex < totalMatches - 1) {
            e.preventDefault();
            setCurrentIndex(prev => prev + 1);
            triggerCardEntrance();
          }
          if (e.key === 'ArrowLeft' && currentIndex > 0) {
            e.preventDefault();
            setCurrentIndex(prev => prev - 1);
            triggerCardEntrance();
          } else if (e.key === 'ArrowRight' && currentIndex < totalMatches - 1) {
            e.preventDefault();
            setCurrentIndex(prev => prev + 1);
            triggerCardEntrance();
          }
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handleClose, handleCollapseCard, expandedMatch, expandedClient, currentIndex, totalMatches, handleDiscard, handleSave, handleUndo, triggerCardEntrance, showTutorial, showShortcutsModal, viewMode, currentMatch, currentClient, handleExpandCard, effectiveLayoutMode]);

  if (!isMounted) return null;

  const portalContent = createPortal(
    <div 
      className={cn(
        "fixed inset-0 z-[100] flex flex-col transition-opacity duration-300",
        isVisible ? "opacity-100" : "opacity-0"
      )}
      style={{ backgroundColor: '#1A1A1A' }}
    >
      {/* Header */}
      <div className="relative flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 flex-shrink-0">
        {/* Left buttons */}
        <div className="flex items-center gap-2 z-10">
          <MatchesDevTool 
            viewMode={viewMode} 
            setViewMode={setViewMode}
            previewMode={previewMode}
            setPreviewMode={setPreviewMode}
            layoutMode={layoutMode}
            setLayoutMode={setLayoutMode}
            showShareAction={showShareAction}
            setShowShareAction={setShowShareAction}
            showBulkActions={showBulkActions}
            setShowBulkActions={setShowBulkActions}
            showHoverActions={showHoverActions}
            setShowHoverActions={setShowHoverActions}
          />
          <ShortcutsHintButton onClick={() => setShowShortcutsModal(true)} />
        </div>
        
        {/* Centered title - absolutely positioned */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <h1 className="text-base sm:text-lg font-semibold text-white">Matches</h1>
            <p className="text-xs sm:text-sm text-zinc-400">{opportunityTitle || 'Opportunity'}</p>
          </div>
        </div>
        
        {/* Right button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="h-12 w-12 rounded-xl hover:bg-zinc-800 text-white transition-colors z-10"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>
      
      {/* Desktop-only layout mode toggle - under the title */}
      {isDesktop && (
        <div className="flex justify-center pb-3 flex-shrink-0">
          <div className="flex items-center gap-1 bg-zinc-800/50 rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLayoutMode('table')}
              className={cn(
                "h-8 w-8 rounded-md transition-colors",
                layoutMode === 'table' 
                  ? "bg-zinc-700 text-white" 
                  : "text-zinc-400 hover:text-black hover:bg-white"
              )}
            >
              <List className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLayoutMode('carousel')}
              className={cn(
                "h-8 w-8 rounded-md transition-colors",
                layoutMode === 'carousel' 
                  ? "bg-zinc-700 text-white" 
                  : "text-zinc-400 hover:text-black hover:bg-white"
              )}
            >
              <GalleryHorizontalEnd className="h-4 w-4 -scale-x-100" />
            </Button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div 
        className={cn(
          "flex-1 flex overflow-hidden min-h-0 px-6 pb-4 transition-opacity duration-150",
          isLayoutTransitioning ? "opacity-0" : "opacity-100"
        )}
      >
        {totalMatches === 0 ? (
          <div className="flex-1 flex items-center justify-center text-center text-white">
            <div>
              <h2 className="text-xl font-semibold mb-2">All caught up!</h2>
              <p className="text-zinc-400">No more matches to review.</p>
            </div>
          </div>
        ) : effectiveLayoutMode === 'carousel' ? (
          /* CAROUSEL VIEW */
          <div className="flex-1 flex flex-col items-center justify-center w-full">
            {/* Horizontal scrolling carousel with centered current card */}
            <div 
              ref={carouselContainerRef}
              className={cn(
                "relative w-full flex items-center justify-center flex-1 select-none",
                isDragging ? "cursor-grabbing" : "cursor-grab"
              )}
              style={{ height: 'clamp(400px, 55vh, 560px)', touchAction: 'pan-y pinch-zoom' }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onDragStart={(e) => e.preventDefault()}
            >
              {activeMatches.map((item, index) => {
                // VIRTUALIZATION: Only render cards within ±5 of current index
                // This prevents loading all images at once and crashing the browser
                const RENDER_WINDOW = 5;
                if (Math.abs(index - currentIndex) > RENDER_WINDOW) {
                  return null;
                }
                
                const isCurrent = index === currentIndex;
                const isAnimating = isCurrent && actionState !== 'idle';
                // Card width from state (responsive)
                
                // Position based on continuous scrollPosition for fluid movement
                // Each card's position = (index * CARD_SPACING) - scrollPosition
                // This makes scrollPosition the "camera" position in the carousel
                const cardCenterOffset = index * CARD_SPACING - scrollPosition;
                
                // Type guards
                const isPropertyCard = viewMode === 'properties';
                const propertyData = isPropertyCard ? item as MatchProperty : null;
                const clientData = !isPropertyCard ? item as MatchClient : null;
                
                return (
                  <div
                    key={item.id}
                    ref={(el) => {
                      if (el) {
                        cardRefs.current.set(item.id, el);
                      } else {
                        cardRefs.current.delete(item.id);
                      }
                    }}
                    onClick={() => handleCardClick(index, isCurrent, item as MatchProperty | MatchClient)}
                    className={cn(
                      "absolute cursor-pointer",
                      isCurrent 
                        ? "opacity-100 z-10" 
                        : "opacity-25 hover:opacity-40",
                      // Smooth transition only when not dragging
                      isDragging ? "" : "transition-all duration-300 ease-out",
                      // Hide the current card when expanded
                      expandedMatch?.id === item.id && isCardExpanded && "opacity-0"
                    )}
                    style={{ 
                      width: cardWidth,
                      transform: `translateX(${cardCenterOffset}px) scale(${isCurrent ? 1 : 0.85})`,
                      touchAction: 'none',
                    }}
                  >
                    <div 
                      className="relative rounded-3xl shadow-2xl"
                      style={{
                        border: isCurrent ? '1.5px solid rgba(255, 255, 255, 0.2)' : '1.5px solid transparent',
                        // Only slide when in 'slide' phase, not during 'color' phase
                        transform: isCurrent && animationPhase === 'slide' && actionState === 'discarding' 
                          ? 'translateY(120%) rotate(-7.5deg)' 
                          : isCurrent && animationPhase === 'slide' && actionState === 'saving'
                          ? 'translateY(-120%) scale(0.95)'
                          : isCurrent && isUndoEntering && undoType === 'discard'
                          ? 'translateY(120%) rotate(-7.5deg)'
                          : isCurrent && isUndoEntering && undoType === 'save'
                          ? 'translateY(-120%) scale(0.95)'
                          : 'translateY(0)',
                        // Only fade out during slide phase
                        opacity: isCurrent && animationPhase === 'slide' && (actionState === 'discarding' || actionState === 'saving') ? 0 
                          : isCurrent && isUndoEntering ? 0 
                          : 1,
                        transition: isUndoEntering 
                          ? 'none' 
                          : 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease-out',
                      }}
                    >
                      {/* Discard overlay */}
                      {isCurrent && (
                        <div 
                          className="absolute inset-0 z-30 pointer-events-none rounded-3xl"
                          style={{
                            backgroundColor: '#F6445C',
                            opacity: actionState === 'discarding' ? 0.35 
                              : (undoType === 'discard' && undoPhase === 'slide') ? 0.35 
                              : 0,
                            transition: isUndoEntering ? 'none' : 'opacity 0.3s ease-out',
                          }}
                        />
                      )}
                      
                      {/* Save overlay */}
                      {isCurrent && (
                        <div
                          className="absolute inset-0 z-30 pointer-events-none rounded-3xl"
                          style={{
                            backgroundColor: '#10B189',
                            opacity: actionState === 'saving' ? 0.45 
                              : (undoType === 'save' && undoPhase === 'slide') ? 0.45 
                              : 0,
                            transition: isUndoEntering ? 'none' : 'opacity 0.3s ease-out',
                          }}
                        />
                      )}
                      
                      {/* Inner clip container to prevent image bleeding */}
                      <div className="rounded-[calc(1.5rem-1.5px)] overflow-hidden">
                        {/* PROPERTY CARD */}
                      {isPropertyCard && propertyData && (
                        <div className="relative bg-zinc-800 w-full" style={{ aspectRatio: '3/4', maxHeight: 'clamp(400px, 55vh, 560px)' }}>
                          {/* Image carousel - always enabled for current card */}
                          {isCurrent ? (
                            <MatchCardImageCarousel
                              images={propertyData.images}
                              alt={propertyData.title}
                              currentIndex={cardImageIndices.get(propertyData.id) || 0}
                              onIndexChange={(newIndex) => {
                                setCardImageIndices(prev => new Map(prev).set(propertyData.id, newIndex));
                              }}
                              className="w-full h-full"
                            />
                          ) : (
                            <LoadingImage 
                              src={propertyData.images[cardImageIndices.get(propertyData.id) || 0] || propertyData.images[0]} 
                              alt={propertyData.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                          
                          {/* Top gradient overlay - extends 2px beyond to prevent bleeding */}
                          <div 
                            className="absolute z-10 pointer-events-none"
                            style={{
                              inset: '-2px',
                              background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0) 25%)'
                            }}
                          />
                          
                          {/* Bottom gradient overlay - extends 2px beyond to prevent bleeding */}
                          <div 
                            className="absolute z-10 pointer-events-none"
                            style={{
                              inset: '-2px',
                              background: 'linear-gradient(to top, #000000 0%, #00000000 100%)'
                            }}
                          />
                          
                        {/* Top badges */}
                        <div className="absolute top-3 left-3 right-3 sm:top-5 sm:left-5 sm:right-5 flex items-center justify-between z-20">
                          <Badge className="font-semibold text-[10px] sm:text-xs px-2 py-0.5 sm:px-3 sm:py-1 border-0 text-white bg-[#FFFFFF33] hover:bg-[#FFFFFF4D] transition-colors">
                            Published {propertyData.publishedDate}
                          </Badge>
                          <div className="flex items-center gap-1 sm:gap-2">
                            {propertyData.isTopMatch && (
                              <Badge className="font-semibold text-[10px] sm:text-xs px-2 py-0.5 sm:px-3 sm:py-1 border-0 text-white bg-[#FFFFFF33] hover:bg-[#FFFFFF4D] transition-colors">
                                Top match
                              </Badge>
                            )}
                            {propertyData.isNew && !viewedIds.has(propertyData.id) && (
                              <Badge className="font-semibold text-[10px] sm:text-xs px-2 py-0.5 sm:px-3 sm:py-1 border-0 text-white bg-[#FFFFFF33] hover:bg-[#FFFFFF4D] transition-colors">
                                New
                              </Badge>
                            )}
                          </div>
                        </div>
                          
                        {/* Property info overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-5 text-white z-20">
                          {/* Price */}
                          <p className="text-xl sm:text-3xl font-bold mb-0.5 sm:mb-1">
                            {propertyData.currency}{propertyData.price.toLocaleString()}
                          </p>
                          
                          {/* Title */}
                          <p className="text-sm sm:text-base font-medium mb-1.5 sm:mb-2 line-clamp-1 text-white/90">
                            {propertyData.title}
                          </p>
                          
                          {/* Owner */}
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-4">
                            <Avatar className="h-5 w-5 sm:h-7 sm:w-7 border border-white/20">
                              <AvatarImage src={propertyData.owner.avatar} />
                              <AvatarFallback className="text-[8px] sm:text-[10px] bg-zinc-600 text-white">
                                {propertyData.owner.initials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs sm:text-sm text-white/70">
                              {propertyData.owner.isYou ? 'Owned by you' : `Owned by ${propertyData.owner.name}`}
                            </span>
                          </div>
                          
                          {/* Matching preferences - all in single row */}
                          <div className="space-y-1.5 sm:space-y-2">
                            <p className="text-xs sm:text-sm font-semibold text-white">Matching preferences</p>
                            <div className="flex flex-wrap gap-1 sm:gap-2">
                              {/* Property type - green */}
                              <Badge className="text-[10px] sm:text-xs px-2 py-1 sm:px-3 sm:py-1.5 border-0 text-white rounded-full font-medium" style={{ backgroundColor: 'rgba(16, 177, 137, 0.4)' }}>
                                <Building className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                                {propertyData.propertyType}
                              </Badge>
                              {/* Location - green */}
                              <Badge className="text-[10px] sm:text-xs px-2 py-1 sm:px-3 sm:py-1.5 border-0 text-white rounded-full font-medium" style={{ backgroundColor: 'rgba(16, 177, 137, 0.4)' }}>
                                <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                                {propertyData.location}
                              </Badge>
                              {/* Budget - green */}
                              <Badge className="text-[10px] sm:text-xs px-2 py-1 sm:px-3 sm:py-1.5 border-0 text-white rounded-full font-medium" style={{ backgroundColor: 'rgba(16, 177, 137, 0.4)' }}>
                                <Euro className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                                {propertyData.currency}{(propertyData.price / 1000).toFixed(0)}k
                              </Badge>
                              {/* Bedrooms - orange */}
                              <Badge className="text-[10px] sm:text-xs px-2 py-1 sm:px-3 sm:py-1.5 border-0 text-white rounded-full font-medium" style={{ backgroundColor: 'rgba(237, 153, 23, 0.4)' }}>
                                <Bed className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                                {propertyData.bedrooms}
                              </Badge>
                              {/* Size - orange */}
                              <Badge className="text-[10px] sm:text-xs px-2 py-1 sm:px-3 sm:py-1.5 border-0 text-white rounded-full font-medium" style={{ backgroundColor: 'rgba(237, 153, 23, 0.4)' }}>
                                <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                                {propertyData.size} {propertyData.sizeUnit}
                              </Badge>
                              {/* More count - with border and transparent background */}
                              {propertyData.matchingPreferences.length > 5 && (
                                <Badge className="font-semibold text-[10px] sm:text-xs px-2 py-0.5 sm:px-3 sm:py-1 border-0 text-white bg-[#FFFFFF33] hover:bg-[#FFFFFF4D] transition-colors">
                                  +{propertyData.matchingPreferences.length - 5}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        </div>
                      )}
                      
                      {/* CLIENT CARD */}
                      {!isPropertyCard && clientData && (() => {
                        // Get background color based on source
                        const cardBgColor = sourceColors[clientData.source] || sourceColors['Default'];
                        
                        return (
                          <div 
                            className="relative w-full"
                            style={{
                              aspectRatio: '3/4',
                              maxHeight: 'clamp(400px, 55vh, 560px)',
                              backgroundColor: cardBgColor,
                            }}
                          >
                            {/* Layer 2: Overall dark overlay - extends 2px beyond to prevent bleeding */}
                            <div 
                              className="absolute pointer-events-none"
                              style={{
                                inset: '-2px',
                                backgroundColor: '#000000B2',
                                zIndex: 1,
                              }}
                            />
                            
                            {/* Layer 3: Bottom gradient - extends 2px beyond to prevent bleeding */}
                            <div 
                              className="absolute pointer-events-none"
                              style={{
                                inset: '-2px',
                                background: 'linear-gradient(to top, #000000 0%, #00000000 100%)',
                                zIndex: 2,
                              }}
                            />
                            
                            {/* Top badges */}
                            <div className="absolute top-3 left-3 right-3 sm:top-5 sm:left-5 sm:right-5 flex items-center justify-between z-20">
                              {/* Source badge with logo/icon - same styling as other badges */}
                              <Badge 
                                className="font-semibold text-[10px] sm:text-xs px-2 py-0.5 sm:px-3 sm:py-1 border-0 rounded-full flex items-center gap-1 sm:gap-1.5 text-white bg-[#FFFFFF33] hover:bg-[#FFFFFF4D] transition-colors"
                              >
                                {/* Portal logos */}
                                {portalLogos[clientData.source] && (
                                  <img 
                                    src={portalLogos[clientData.source]} 
                                    alt={clientData.source}
                                    className="h-3 w-3 sm:h-4 sm:w-4 rounded-sm object-cover"
                                    loading="lazy"
                                  />
                                )}
                                {/* Lucide icons for non-portal sources */}
                                {clientData.source === 'Marketing campaign' && (
                                  <Megaphone className="h-3 w-3 sm:h-4 sm:w-4" />
                                )}
                                {clientData.source === 'Self created' && (
                                  <FileOutput className="h-3 w-3 sm:h-4 sm:w-4" />
                                )}
                                {clientData.source}
                              </Badge>
                              <div className="flex items-center gap-1 sm:gap-2">
                                {clientData.isTopMatch && (
                                  <Badge className="font-semibold text-[10px] sm:text-xs px-2 py-0.5 sm:px-3 sm:py-1 border-0 text-white bg-[#FFFFFF33] hover:bg-[#FFFFFF4D] transition-colors">
                                    Top match
                                  </Badge>
                                )}
                                {clientData.isNew && !viewedIds.has(clientData.id) && (
                                  <Badge className="font-semibold text-[10px] sm:text-xs px-2 py-0.5 sm:px-3 sm:py-1 border-0 text-white bg-[#FFFFFF33] hover:bg-[#FFFFFF4D] transition-colors">
                                    New
                                  </Badge>
                                )}
                              </div>
                            </div>
                          
                          {/* Client info overlay */}
                          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-5 text-white z-20">
                            {/* Client name */}
                            <p className="text-xl sm:text-3xl font-bold mb-0.5 sm:mb-1">
                              {clientData.name}
                            </p>
                            
                            {/* Client since */}
                            <p className="text-sm sm:text-base font-medium mb-1.5 sm:mb-2 text-white/70">
                              Client since {clientData.clientSince}
                            </p>
                            
                            {/* Owner */}
                            <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-4">
                              <Avatar className="h-5 w-5 sm:h-7 sm:w-7 border border-white/20">
                                <AvatarImage src={clientData.owner.avatar} />
                                <AvatarFallback className="text-[8px] sm:text-[10px] bg-zinc-600 text-white">
                                  {clientData.owner.initials}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs sm:text-sm text-white/70">
                                {clientData.owner.isYou ? 'Owned by you' : `Owned by ${clientData.owner.name}`}
                              </span>
                            </div>
                            
                            {/* Matching preferences */}
                            <div className="space-y-1.5 sm:space-y-2">
                              <p className="text-xs sm:text-sm font-semibold text-white">Matching preferences</p>
                              <div className="flex flex-wrap gap-1 sm:gap-2">
                                {/* Property type - green */}
                                <Badge className="text-[10px] sm:text-xs px-2 py-1 sm:px-3 sm:py-1.5 border-0 text-white rounded-full font-medium" style={{ backgroundColor: 'rgba(16, 177, 137, 0.4)' }}>
                                  <Building className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                                  {clientData.preferences.propertyTypes[0]}
                                </Badge>
                                {/* Location - green */}
                                <Badge className="text-[10px] sm:text-xs px-2 py-1 sm:px-3 sm:py-1.5 border-0 text-white rounded-full font-medium" style={{ backgroundColor: 'rgba(16, 177, 137, 0.4)' }}>
                                  <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                                  {clientData.preferences.locations[0]}
                                  {clientData.preferences.locations.length > 1 && ` +${clientData.preferences.locations.length - 1}`}
                                </Badge>
                                {/* Budget - green */}
                                <Badge className="text-[10px] sm:text-xs px-2 py-1 sm:px-3 sm:py-1.5 border-0 text-white rounded-full font-medium" style={{ backgroundColor: 'rgba(16, 177, 137, 0.4)' }}>
                                  <Euro className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                                  {clientData.preferences.priceRange.currency}{(clientData.preferences.priceRange.min / 1000).toFixed(0)}-{(clientData.preferences.priceRange.max / 1000).toFixed(0)}k
                                </Badge>
                                {/* Bedrooms - orange */}
                                <Badge className="text-[10px] sm:text-xs px-2 py-1 sm:px-3 sm:py-1.5 border-0 text-white rounded-full font-medium" style={{ backgroundColor: 'rgba(237, 153, 23, 0.4)' }}>
                                  <Bed className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                                  {clientData.preferences.bedrooms}
                                </Badge>
                                {/* Size - orange */}
                                <Badge className="text-[10px] sm:text-xs px-2 py-1 sm:px-3 sm:py-1.5 border-0 text-white rounded-full font-medium" style={{ backgroundColor: 'rgba(237, 153, 23, 0.4)' }}>
                                  <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                                  {clientData.preferences.sizeRange.min}-{clientData.preferences.sizeRange.max} {clientData.preferences.sizeRange.unit}
                                </Badge>
                                {/* More count - with border and transparent background */}
                                {clientData.preferences.extras.length > 0 && (
                                  <Badge 
                                    className="text-[10px] sm:text-xs px-2 py-1 sm:px-3 sm:py-1.5 text-white rounded-full font-medium"
                                    style={{ 
                                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                      border: '1px solid rgba(255, 255, 255, 0.2)'
                                    }}
                                  >
                                    +{clientData.preferences.extras.length}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        );
                      })()}
                      </div>{/* End inner clip container */}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Counter */}
            <div className="text-center py-3 sm:py-6 w-full flex-shrink-0 mt-auto">
              <span className="text-white font-medium text-sm sm:text-lg">
                {totalMatches > 9 
                  ? (currentIndex + 1).toString().padStart(totalMatches.toString().length, '0')
                  : currentIndex + 1}
              </span>
              <span className="text-zinc-500 text-sm sm:text-lg"> / {totalMatches}</span>
            </div>
          </div>
        ) : effectiveLayoutMode === 'table' ? (
          /* TABLE VIEW */
          <MatchesTableView
            items={activeMatches}
            viewMode={viewMode}
            viewedIds={viewedIds}
            currentIndex={currentIndex}
            showShareAction={showShareAction}
            showBulkActions={showBulkActions}
            showHoverActions={showHoverActions}
            onSelect={(index) => {
              setCurrentIndex(index);
              setViewedIds(prev => new Set([...prev, activeMatches[index].id]));
            }}
            onExpand={(item) => handleExpandCard(item as any)}
            onDiscardItem={(id) => {
              setDismissedIds(prev => new Set([...prev, id]));
              setShowToast(true);
              setLastAction({ type: 'discard', property: matches.find(m => m.id === id), client: clientMatches.find(c => c.id === id) });
              if (currentIndex >= totalMatches - 1 && currentIndex > 0) {
                setCurrentIndex(prev => prev - 1);
              }
            }}
            onSaveItem={(id) => {
              setSavedIds(prev => new Set([...prev, id]));
              setShowToast(true);
              setLastAction({ type: 'save', property: matches.find(m => m.id === id), client: clientMatches.find(c => c.id === id) });
              if (currentIndex >= totalMatches - 1 && currentIndex > 0) {
                setCurrentIndex(prev => prev - 1);
              }
            }}
            onShareItem={(id) => {
              const propertyMatch = matches.find(m => m.id === id);
              const clientMatch = clientMatches.find(c => c.id === id);
              if (propertyMatch) {
                // Sharing a property match (buy/rent opp) → pre-select the opportunity's client
                setSharePreSelectedClient(opportunityClient);
                setShareModalProperty({
                  id: propertyMatch.id,
                  title: propertyMatch.title,
                  image: propertyMatch.images[0],
                  images: propertyMatch.images,
                });
                setShareModalOpen(true);
              } else if (clientMatch) {
                // Sharing a client match (sell/lease opp) → pre-select the matched client
                setSharePreSelectedClient({
                  id: clientMatch.id,
                  name: clientMatch.name,
                  phone: '+34 612 345 678',
                });
                if (opportunityProperty) {
                  setShareModalProperty({
                    id: opportunityProperty.id,
                    title: `${opportunityProperty.propertyType} in ${opportunityProperty.location}`,
                    image: opportunityProperty.image || '',
                  });
                  setShareModalOpen(true);
                }
              }
            }}
            onBulkShare={handleBulkShare}
          />
        ) : null}
      </div>

      {/* Action buttons - hidden in table mode since each row has its own */}
      {totalMatches > 0 && effectiveLayoutMode !== 'table' && (
        <div className="px-6 pb-6 flex gap-3 flex-shrink-0 max-w-md mx-auto w-full lg:max-w-lg">
          <Button
            variant="secondary"
            className="flex-1 h-14 bg-zinc-800 hover:bg-zinc-700 text-white border-0 rounded-xl text-base font-medium transition-all duration-200 active:scale-95"
            onClick={() => {
              if (expandedMatch) {
                handleCollapseCard();
                setTimeout(handleDiscard, 100);
              } else {
                handleDiscard();
              }
            }}
            disabled={actionState !== 'idle'}
          >
            <Trash2 className="h-5 w-5 mr-2" />
            Discard
          </Button>
          <Button
            variant="secondary"
            className="flex-1 h-14 bg-white hover:bg-zinc-100 text-black border-0 rounded-xl text-base font-medium transition-all duration-200 active:scale-95"
            onClick={() => {
              if (expandedMatch) {
                handleCollapseCard();
                setTimeout(handleSave, 100);
              } else {
                handleSave();
              }
            }}
            disabled={actionState !== 'idle'}
          >
            <Bookmark className="h-5 w-5 mr-2" />
            Save
          </Button>
        </div>
      )}

      {/* Toast popup for undo/share — hidden in table layout (table has its own inline UX) */}
      {effectiveLayoutMode !== 'table' && <div
        className="fixed bottom-28 left-1/2 z-[101] pointer-events-none"
        style={{
          transform: showToast 
            ? 'translateX(-50%) translateY(0)' 
            : 'translateX(-50%) translateY(20px)',
          opacity: showToast ? 1 : 0,
          transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease-out',
        }}
      >
        <div className="bg-white rounded-full px-4 py-3 shadow-lg flex items-center gap-3 pointer-events-auto">
          {lastAction?.type === 'discard' ? (
            <>
              <div className="flex items-center gap-2 text-zinc-800">
                <div className="h-6 w-6 rounded-full bg-zinc-200 flex items-center justify-center">
                  <Trash2 className="h-3 w-3" />
                </div>
                <span className="text-sm font-medium">Property discarded</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-zinc-600 hover:text-zinc-900 h-auto py-1 px-2"
                onClick={handleUndo}
              >
                <Undo2 className="h-4 w-4 mr-1" />
                Undo
              </Button>
            </>
          ) : lastAction?.type === 'save' ? (
            <>
              <Avatar className="h-8 w-8">
                <AvatarImage src={lastAction.property.images[0]} />
                <AvatarFallback className="text-xs bg-zinc-200">
                  {lastAction.property.owner.initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-zinc-800">Property saved</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-zinc-600 hover:text-zinc-900 h-auto py-1 px-2"
                onClick={handleShare}
              >
                <Share className="h-4 w-4 mr-1" />
                Share
              </Button>
            </>
          ) : null}
        </div>
      </div>}

      {/* Expanded Card Preview (in-place expansion mode) */}
      {expandedMatch && previewMode === 'expand' && (
        <div 
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center",
            "transition-all duration-400 ease-out",
            isCardExpanded 
              ? "opacity-100" 
              : "opacity-0 pointer-events-none"
          )}
          onClick={(e) => {
            // Close when clicking backdrop
            if (e.target === e.currentTarget) {
              handleCollapseCard();
            }
          }}
        >
          {/* Backdrop - consistent with design system (bg-black/50 backdrop-blur-sm) */}
          <div 
            className={cn(
              "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
              isCardExpanded ? "opacity-100" : "opacity-0"
            )}
            onClick={handleCollapseCard}
          />
          
          {/* Popover container with morph animation from card position - always centered */}
          <div 
            className={cn(
              "relative rounded-3xl overflow-hidden shadow-2xl",
              "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
            )}
            style={{ 
              backgroundColor: '#FFFFFF',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              // Responsive width: narrower on large screens (700px on lg, 800px on xl, 900px on 2xl)
              width: isCardExpanded 
                ? `min(95vw, ${window.innerWidth >= 1536 ? '900px' : window.innerWidth >= 1280 ? '800px' : window.innerWidth >= 1024 ? '700px' : '600px'})` 
                : (expandedCardRect?.width || cardWidth),
              height: isCardExpanded ? 'min(92vh, 900px)' : (expandedCardRect?.height || 'auto'),
              // Always center in viewport, morph from card position
              transform: isCardExpanded 
                ? 'translate(0, 0) scale(1)' 
                : expandedCardRect 
                  ? `translate(${expandedCardRect.left + expandedCardRect.width / 2 - window.innerWidth / 2}px, ${expandedCardRect.top + expandedCardRect.height / 2 - window.innerHeight / 2}px) scale(0.8)`
                  : 'translate(0, 50px) scale(0.8)',
              opacity: isCardExpanded ? 1 : 0,
            }}
          >
            <PropertyDetails
              propertyId={expandedMatch.id}
              embedded={true}
              onClose={handleCollapseCard}
              onOpenFullPage={() => window.open(`/properties/${expandedMatch.id}`, '_blank')}
              onDiscard={() => {
                handleCollapseCard();
                setTimeout(() => handleDiscard(), 400);
              }}
              onSave={() => {
                handleCollapseCard();
                setTimeout(() => handleSave(), 400);
              }}
              showMatchingPreferences={true}
              matchingPreferences={expandedMatch.matchingPreferences}
            />
          </div>
        </div>
      )}

      {/* Expanded Client Card Preview (for sell/lease opportunities) */}
      {expandedClient && viewMode === 'clients' && (
        <div 
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center",
            "transition-all duration-400 ease-out",
            isClientCardExpanded 
              ? "opacity-100" 
              : "opacity-0 pointer-events-none"
          )}
          onClick={(e) => {
            // Close when clicking backdrop
            if (e.target === e.currentTarget) {
              handleCollapseClientCard();
            }
          }}
        >
          {/* Backdrop */}
          <div 
            className={cn(
              "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
              isClientCardExpanded ? "opacity-100" : "opacity-0"
            )}
            onClick={handleCollapseClientCard}
          />
          
          {/* Popover container with morph animation */}
          <div 
            className={cn(
              "relative rounded-3xl overflow-hidden shadow-2xl",
              "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
            )}
            style={{ 
              backgroundColor: '#1A1A1A',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              width: isClientCardExpanded 
                ? `min(95vw, ${window.innerWidth >= 1536 ? '900px' : window.innerWidth >= 1280 ? '800px' : window.innerWidth >= 1024 ? '700px' : '600px'})` 
                : (expandedClientCardRect?.width || cardWidth),
              height: isClientCardExpanded ? 'min(92vh, 900px)' : (expandedClientCardRect?.height || 'auto'),
              transform: isClientCardExpanded 
                ? 'translate(0, 0) scale(1)' 
                : expandedClientCardRect 
                  ? `translate(${expandedClientCardRect.left + expandedClientCardRect.width / 2 - window.innerWidth / 2}px, ${expandedClientCardRect.top + expandedClientCardRect.height / 2 - window.innerHeight / 2}px) scale(0.8)`
                  : 'translate(0, 50px) scale(0.8)',
              opacity: isClientCardExpanded ? 1 : 0,
            }}
          >
            <ClientDetails
              embedded={true}
              embeddedClientData={expandedClient as unknown as EmbeddedClientData}
              opportunityContext={{
                id: opportunityId,
                type: (opportunityProperty?.type || 'sell') as OpportunityType,
                title: opportunityTitle || 'Opportunity',
                property: opportunityProperty ? {
                  propertyType: opportunityProperty.propertyType,
                  location: opportunityProperty.location,
                  price: opportunityProperty.price,
                  currency: opportunityProperty.currency,
                  bedrooms: opportunityProperty.bedrooms,
                  size: opportunityProperty.size,
                  sizeUnit: opportunityProperty.sizeUnit,
                  image: opportunityProperty.image,
                } : undefined,
              }}
              onClose={handleCollapseClientCard}
              onOpenFullPage={() => window.open(`/clients/${expandedClient.id}`, '_blank')}
              onDiscard={() => {
                handleCollapseClientCard();
                setTimeout(() => handleDiscard(), 400);
              }}
              onSave={() => {
                handleCollapseClientCard();
                setTimeout(() => handleSave(), 400);
              }}
            />
          </div>
        </div>
      )}

      {/* Property Preview Modal (modal mode) */}
      <PropertyPreviewModal
        open={isPreviewOpen && previewMode === 'modal'}
        onOpenChange={(open) => !open && handleCollapseCard()}
        property={expandedMatch}
      />
      
      {/* First-time tutorial */}
      <KeyboardShortcutsTutorial 
        open={showTutorial} 
        onClose={handleCloseTutorial}
        layoutMode={effectiveLayoutMode}
      />
      
      {/* Shortcuts reference modal */}
      <KeyboardShortcutsTutorial 
        open={showShortcutsModal} 
        onClose={() => setShowShortcutsModal(false)}
        layoutMode={effectiveLayoutMode}
      />
    </div>,
    document.body
  );

  return (
    <>
      {portalContent}
      {/* Share property modal — z-[110] overlay renders above the z-[100] matches modal */}
      {shareModalProperty && (
        <SharePropertyModal
          open={shareModalOpen}
          onOpenChange={(open) => {
            setShareModalOpen(open);
            if (!open) {
              setShareModalProperty(null);
              setSharePreSelectedClient(undefined);
            }
          }}
          property={shareModalProperty}
          preSelectedClient={sharePreSelectedClient}
        />
      )}
      <BulkShareModal
        open={bulkShareModalOpen}
        onOpenChange={setBulkShareModalOpen}
        items={bulkShareItems}
        direction={bulkShareDirection}
        client={opportunityClient ? { id: opportunityClient.id, name: opportunityClient.name, phone: opportunityClient.phone } : undefined}
        property={opportunityProperty ? { id: opportunityProperty.id, title: `${opportunityProperty.propertyType} in ${opportunityProperty.location}`, image: opportunityProperty.image || '' } : undefined}
      />
    </>
  );
}
