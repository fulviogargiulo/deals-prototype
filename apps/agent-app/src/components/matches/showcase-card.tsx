import { Megaphone, FileOutput } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { MatchingPreferencePills, type PropertyMatchData, type ClientMatchData } from "./matching-preference-pills";

// Portal logos
import idealistaLogo from "@/assets/idealista-logo.png";
import fotocasaLogo from "@/assets/fotocasa-logo-new.png";
import pisosLogo from "@/assets/pisos-logo.png";

const portalLogos: Record<string, string> = {
  'Idealista': idealistaLogo,
  'Fotocasa': fotocasaLogo,
  'Pisos': pisosLogo,
};

const sourceColors: Record<string, string> = {
  'Idealista': 'hsl(65, 85%, 70%)',      // portal-idealista
  'Fotocasa': 'hsl(236, 54%, 43%)',      // portal-fotocasa
  'Pisos': 'hsl(194, 74%, 58%)',         // portal-pisos
  'Marketing campaign': 'hsl(0, 0%, 80%, 0.8)',
  'Self created': 'hsl(0, 0%, 80%, 0.8)',
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

interface ShowcaseCardProps {
  item: MatchProperty | MatchClient;
  viewMode: 'properties' | 'clients';
  isCurrent: boolean;
  viewedIds: Set<string>;
  size?: 'main' | 'sidebar';
  onClick?: () => void;
  animationState?: {
    actionState: 'idle' | 'discarding' | 'saving' | 'undoing';
    animationPhase: 'idle' | 'color' | 'slide';
    undoPhase: 'idle' | 'slide' | 'color';
    isUndoEntering: boolean;
    undoType: 'discard' | 'save' | null;
  };
}

export function ShowcaseCard({
  item,
  viewMode,
  isCurrent,
  viewedIds,
  size = 'main',
  onClick,
  animationState,
}: ShowcaseCardProps) {
  const isPropertyCard = viewMode === 'properties';
  const propertyData = isPropertyCard ? item as MatchProperty : null;
  const clientData = !isPropertyCard ? item as MatchClient : null;
  
  const isMain = size === 'main';
  const aspectClass = isMain ? 'aspect-[3/4]' : 'aspect-[4/3]';
  
  // Animation calculations for main card
  const actionState = animationState?.actionState || 'idle';
  const animationPhase = animationState?.animationPhase || 'idle';
  const undoPhase = animationState?.undoPhase || 'idle';
  const isUndoEntering = animationState?.isUndoEntering || false;
  const undoType = animationState?.undoType || null;
  
  return (
    <div
      onClick={onClick}
      className={cn(
        "cursor-pointer relative rounded-3xl shadow-2xl overflow-hidden",
        !isMain && "opacity-60 hover:opacity-80 transition-opacity",
        isMain && isCurrent && "border-[1.5px] border-white/20"
      )}
      style={{
        // Only apply animations to main card
        ...(isMain && isCurrent ? {
          transform: animationPhase === 'slide' && actionState === 'discarding' 
            ? 'translateY(120%) rotate(-7.5deg)' 
            : animationPhase === 'slide' && actionState === 'saving'
            ? 'translateY(-120%) scale(0.95)'
            : isUndoEntering && undoType === 'discard'
            ? 'translateY(120%) rotate(-7.5deg)'
            : isUndoEntering && undoType === 'save'
            ? 'translateY(-120%) scale(0.95)'
            : 'translateY(0)',
          opacity: animationPhase === 'slide' && (actionState === 'discarding' || actionState === 'saving') ? 0 
            : isUndoEntering ? 0 
            : 1,
          transition: isUndoEntering 
            ? 'none' 
            : 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease-out',
        } : {})
      }}
    >
      {/* Action overlays - only on main card */}
      {isMain && isCurrent && (
        <>
          <div 
            className="absolute inset-0 z-30 pointer-events-none rounded-3xl bg-tier-danger"
            style={{
              opacity: actionState === 'discarding' ? 0.35 
                : (undoType === 'discard' && undoPhase === 'slide') ? 0.35 
                : 0,
              transition: isUndoEntering ? 'none' : 'opacity 0.3s ease-out',
            }}
          />
          <div
            className="absolute inset-0 z-30 pointer-events-none rounded-3xl bg-tier-success"
            style={{
              opacity: actionState === 'saving' ? 0.45 
                : (undoType === 'save' && undoPhase === 'slide') ? 0.45 
                : 0,
              transition: isUndoEntering ? 'none' : 'opacity 0.3s ease-out',
            }}
          />
        </>
      )}
      
      {/* Inner clip container */}
      <div className="rounded-[calc(1.5rem-1.5px)] overflow-hidden">
        {/* PROPERTY CARD */}
        {isPropertyCard && propertyData && (
          <div className={cn("relative bg-zinc-800 w-full", aspectClass)}>
            <img 
              src={propertyData.images[0]} 
              alt={propertyData.title}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
            
            {/* Top gradient */}
            <div 
              className="absolute z-10 pointer-events-none"
              style={{
                inset: '-2px',
                background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0) 25%)'
              }}
            />
            
            {/* Bottom gradient */}
            <div 
              className="absolute z-10 pointer-events-none"
              style={{
                inset: '-2px',
                background: 'linear-gradient(to top, #000000 0%, #00000000 100%)'
              }}
            />
            
            {/* Top badges */}
            <div className={cn(
              "absolute left-4 right-4 flex items-center justify-between z-20",
              isMain ? "top-5" : "top-3"
            )}>
              <Badge className={cn(
                "font-semibold border-0 text-white bg-[#FFFFFF33] hover:bg-[#FFFFFF4D] transition-colors",
                isMain ? "text-xs px-3 py-1" : "text-[10px] px-2 py-0.5"
              )}>
                Published {propertyData.publishedDate}
              </Badge>
              <div className="flex items-center gap-1">
                {propertyData.isTopMatch && (
                  <Badge className={cn(
                    "font-semibold border-0 bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 transition-colors",
                    isMain ? "text-xs px-3 py-1" : "text-[10px] px-2 py-0.5"
                  )}>
                    Top match
                  </Badge>
                )}
                {propertyData.isNew && !viewedIds.has(propertyData.id) && (
                  <Badge className={cn(
                    "font-semibold border-0 text-white bg-[#FFFFFF33] hover:bg-[#FFFFFF4D] transition-colors",
                    isMain ? "text-xs px-3 py-1" : "text-[10px] px-2 py-0.5"
                  )}>
                    New
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Property info overlay */}
            <div className={cn(
              "absolute bottom-0 left-0 right-0 text-white z-20",
              isMain ? "p-5" : "p-3"
            )}>
              {/* Price */}
              <p className={cn("font-semibold mb-1", isMain ? "text-3xl" : "text-lg")}>
                {propertyData.currency}{propertyData.price.toLocaleString()}
              </p>
              
              {/* Title */}
              <p className={cn(
                "font-medium line-clamp-1 text-white/90",
                isMain ? "text-base mb-2" : "text-sm mb-1"
              )}>
                {propertyData.title}
              </p>
              
              {/* Owner - only on main */}
              {isMain && (
                <div className="flex items-center gap-2 mb-4">
                  <Avatar className="h-7 w-7 border border-white/20">
                    <AvatarImage src={propertyData.owner.avatar} />
                    <AvatarFallback className="text-[10px] bg-zinc-600 text-white">
                      {propertyData.owner.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-white/70">
                    {propertyData.owner.isYou ? 'Owned by you' : `Owned by ${propertyData.owner.name}`}
                  </span>
                </div>
              )}
              
              {/* Matching preferences - only on main */}
              {isMain && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-white">Matching preferences</p>
                  <MatchingPreferencePills
                    propertyData={{
                      propertyType: propertyData.propertyType,
                      location: propertyData.location,
                      price: propertyData.price,
                      currency: propertyData.currency,
                      bedrooms: propertyData.bedrooms,
                      size: propertyData.size,
                      sizeUnit: propertyData.sizeUnit,
                      matchingPreferences: propertyData.matchingPreferences,
                    } as PropertyMatchData}
                    variant="dark"
                    showAll={false}
                  />
                </div>
              )}
              
              {/* Compact specs for sidebar */}
              {!isMain && (
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <span>{propertyData.bedrooms} bed</span>
                  <span>•</span>
                  <span>{propertyData.size} {propertyData.sizeUnit}</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* CLIENT CARD */}
        {!isPropertyCard && clientData && (() => {
          const cardBgColor = sourceColors[clientData.source] || sourceColors['Default'];
          
          return (
            <div 
              className={cn("relative w-full", aspectClass)}
              style={{ backgroundColor: cardBgColor }}
            >
              {/* Dark overlay */}
              <div 
                className="absolute pointer-events-none"
                style={{
                  inset: '-2px',
                  backgroundColor: '#000000B2',
                  zIndex: 1,
                }}
              />
              
              {/* Bottom gradient */}
              <div 
                className="absolute pointer-events-none"
                style={{
                  inset: '-2px',
                  background: 'linear-gradient(to top, #000000 0%, #00000000 100%)',
                  zIndex: 2,
                }}
              />
              
              {/* Top badges */}
              <div className={cn(
                "absolute left-4 right-4 flex items-center justify-between z-20",
                isMain ? "top-5" : "top-3"
              )}>
                <Badge 
                  className={cn(
                    "font-semibold border-0 rounded-full flex items-center gap-1.5 text-white bg-[#FFFFFF33] hover:bg-[#FFFFFF4D] transition-colors",
                    isMain ? "text-xs px-3 py-1" : "text-[10px] px-2 py-0.5"
                  )}
                >
                  {portalLogos[clientData.source] && (
                    <img 
                      src={portalLogos[clientData.source]} 
                      alt={clientData.source}
                      className="h-4 w-4 rounded-sm object-cover"
                      loading="lazy"
                    />
                  )}
                  {clientData.source === 'Marketing campaign' && <Megaphone className="h-4 w-4" />}
                  {clientData.source === 'Self created' && <FileOutput className="h-4 w-4" />}
                  {isMain && clientData.source}
                </Badge>
                <div className="flex items-center gap-1">
                  {clientData.isTopMatch && (
                    <Badge className={cn(
                      "font-semibold border-0 bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 transition-colors",
                      isMain ? "text-xs px-3 py-1" : "text-[10px] px-2 py-0.5"
                    )}>
                      Top match
                    </Badge>
                  )}
                  {clientData.isNew && !viewedIds.has(clientData.id) && (
                    <Badge className={cn(
                      "font-semibold border-0 text-white bg-[#FFFFFF33] hover:bg-[#FFFFFF4D] transition-colors",
                      isMain ? "text-xs px-3 py-1" : "text-[10px] px-2 py-0.5"
                    )}>
                      New
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Client info overlay */}
              <div className={cn(
                "absolute bottom-0 left-0 right-0 text-white z-20",
                isMain ? "p-5" : "p-3"
              )}>
                {/* Client name */}
                <p className={cn("font-semibold mb-1", isMain ? "text-3xl" : "text-lg")}>
                  {clientData.name}
                </p>
                
                {/* Client since */}
                <p className={cn(
                  "font-medium text-white/70",
                  isMain ? "text-base mb-2" : "text-xs"
                )}>
                  {isMain ? `Client since ${clientData.clientSince}` : clientData.clientSince}
                </p>
                
                {/* Owner - only on main */}
                {isMain && (
                  <div className="flex items-center gap-2 mb-4">
                    <Avatar className="h-7 w-7 border border-white/20">
                      <AvatarImage src={clientData.owner.avatar} />
                      <AvatarFallback className="text-[10px] bg-zinc-600 text-white">
                        {clientData.owner.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-white/70">
                      {clientData.owner.isYou ? 'Owned by you' : `Owned by ${clientData.owner.name}`}
                    </span>
                  </div>
                )}
                
                {/* Matching preferences - only on main */}
                {isMain && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-white">Matching preferences</p>
                    <MatchingPreferencePills
                      clientData={{
                        propertyTypes: clientData.preferences.propertyTypes,
                        locations: clientData.preferences.locations,
                        priceRange: clientData.preferences.priceRange,
                        bedrooms: clientData.preferences.bedrooms,
                        sizeRange: clientData.preferences.sizeRange,
                        extras: clientData.preferences.extras,
                      } as ClientMatchData}
                      variant="dark"
                      showAll={false}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}