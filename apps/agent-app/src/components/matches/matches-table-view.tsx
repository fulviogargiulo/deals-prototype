import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Trash2, Bookmark, MapPin, Bed, Building, Megaphone, FileOutput, Share, Undo2, Eye, X, Check, ArrowUp, ArrowDown, Sparkles, ChevronDown, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MatchCardImageCarousel } from "@/components/matches/match-card-image-carousel";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  PriceFilter, 
  BedroomsFilter,
  PriceRangeType,
} from "@/components/filters/filter-components";

// Portal logos
import idealistaLogo from "@/assets/idealista-logo.png";
import fotocasaLogo from "@/assets/fotocasa-logo-new.png";
import pisosLogo from "@/assets/pisos-logo.png";

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

type RowAnimationState = 'idle' | 'saving' | 'discarding' | 'saved-share-prompt' | 'discard-undo-prompt' | 'exiting';

type SortField = 'relevance' | 'price' | 'size' | 'date' | 'owned';
type SortDirection = 'asc' | 'desc';
interface SortState {
  field: SortField;
  direction: SortDirection;
}

interface BulkActionPrompt {
  type: 'save' | 'discard';
  ids: string[];
  phase: 'loading' | 'post-action' | 'exiting';
}

const AUTO_DISMISS_SAVE_MS = 10000;
const AUTO_DISMISS_DISCARD_MS = 5000;
const BULK_AUTO_DISMISS_MS = 8000;

/* ─── Circular countdown ring ─── */
function CountdownRing({ durationMs, onComplete }: { durationMs: number; onComplete: () => void }) {
  const [remaining, setRemaining] = useState(durationMs);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const left = Math.max(0, durationMs - elapsed);
      setRemaining(left);
      if (left <= 0) {
        clearInterval(interval);
        onComplete();
      }
    }, 50);
    return () => clearInterval(interval);
  }, [durationMs, onComplete]);

  const seconds = Math.ceil(remaining / 1000);
  const progress = remaining / durationMs; // 1 → 0
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="flex items-center gap-1.5">
      <svg width="24" height="24" viewBox="0 0 24 24" className="flex-shrink-0 -rotate-90">
        <circle cx="12" cy="12" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
        <circle
          cx="12" cy="12" r={radius} fill="none"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="2"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.1s linear' }}
        />
      </svg>
      <span className="text-[11px] text-zinc-500 font-medium tabular-nums w-3 text-center">{seconds}</span>
    </div>
  );
}

interface MatchesTableViewProps {
  items: (MatchProperty | MatchClient)[];
  viewMode: 'properties' | 'clients';
  viewedIds: Set<string>;
  currentIndex: number;
  showShareAction?: boolean;
  showBulkActions?: boolean;
  showHoverActions?: boolean;
  onSelect: (index: number) => void;
  onExpand: (item: MatchProperty | MatchClient) => void;
  onDiscardItem: (id: string) => void;
  onSaveItem: (id: string) => void;
  onShareItem?: (id: string) => void;
  onBulkShare?: (selectedIds: Set<string>) => void;
}

function useRowAnimation(onComplete: (id: string) => void) {
  const [animatingRows, setAnimatingRows] = useState<Map<string, RowAnimationState>>(new Map());

  const startDiscard = useCallback((id: string) => {
    setAnimatingRows(prev => new Map(prev).set(id, 'discarding'));
    setTimeout(() => {
      setAnimatingRows(prev => new Map(prev).set(id, 'discard-undo-prompt'));
    }, 500);
  }, []);

  const confirmDiscard = useCallback((id: string) => {
    setAnimatingRows(prev => new Map(prev).set(id, 'exiting'));
    setTimeout(() => {
      setAnimatingRows(prev => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
      onComplete(id);
    }, 450);
  }, [onComplete]);

  const undoDiscard = useCallback((id: string) => {
    setAnimatingRows(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const startSave = useCallback((id: string) => {
    setAnimatingRows(prev => new Map(prev).set(id, 'saving'));
    setTimeout(() => {
      setAnimatingRows(prev => new Map(prev).set(id, 'saved-share-prompt'));
    }, 500);
  }, []);

  const startSaveAndExit = useCallback((id: string, onSave: (id: string) => void) => {
    setAnimatingRows(prev => new Map(prev).set(id, 'saving'));
    setTimeout(() => {
      setAnimatingRows(prev => new Map(prev).set(id, 'exiting'));
      setTimeout(() => {
        setAnimatingRows(prev => {
          const next = new Map(prev);
          next.delete(id);
          return next;
        });
        onSave(id);
      }, 450);
    }, 500);
  }, []);

  const finishSave = useCallback((id: string, onSave: (id: string) => void) => {
    setAnimatingRows(prev => new Map(prev).set(id, 'exiting'));
    setTimeout(() => {
      setAnimatingRows(prev => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
      onSave(id);
    }, 450);
  }, []);

  const getState = useCallback((id: string): RowAnimationState => {
    return animatingRows.get(id) || 'idle';
  }, [animatingRows]);

  return { startDiscard, confirmDiscard, undoDiscard, startSave, startSaveAndExit, finishSave, getState };
}

/* ─── Shared row wrapper with crossfade between content/prompt ─── */
function AnimatedRow({
  children,
  sharePromptContent,
  discardPromptContent,
  animState,
  showPrompt,
  isSelected,
  isAnimating,
  onClick,
  gridTemplate,
  bulkState,
}: {
  children: React.ReactNode;
  sharePromptContent: React.ReactNode;
  discardPromptContent: React.ReactNode;
  animState: RowAnimationState;
  showPrompt: boolean;
  isSelected: boolean;
  isAnimating: boolean;
  onClick?: () => void;
  gridTemplate?: string;
  bulkState?: 'pending' | 'exiting' | null;
}) {
  // Measure row height for smooth collapse — use ResizeObserver to track content changes
  const rowRef = useRef<HTMLDivElement>(null);
  const [measuredHeight, setMeasuredHeight] = useState<number>(0);

  useEffect(() => {
    if (!rowRef.current) return;
    const el = rowRef.current;
    setMeasuredHeight(el.offsetHeight);
    const ro = new ResizeObserver(() => {
      if (animState !== 'exiting') {
        setMeasuredHeight(el.offsetHeight);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [animState]);

  const isExiting = animState === 'exiting' || bulkState === 'exiting';
  const isBulkPending = bulkState === 'pending';
  const isDiscardPrompt = animState === 'discard-undo-prompt';
  const isSavePrompt = animState === 'saved-share-prompt';

  return (
    <div
      style={{
        height: isExiting ? 0 : undefined,
        opacity: isExiting ? 0 : isBulkPending ? 0.35 : 1,
        transform: isBulkPending ? 'scale(0.98)' : undefined,
        transition: isExiting
          ? 'height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease-out, margin 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          : 'opacity 0.4s ease-out, transform 0.4s ease-out',
        overflow: isExiting ? 'hidden' : 'visible',
        marginTop: isExiting ? 0 : undefined,
        marginBottom: isExiting ? 0 : undefined,
        filter: isBulkPending ? 'grayscale(0.5)' : undefined,
        pointerEvents: isBulkPending ? 'none' : undefined,
      }}
    >
      <div
        ref={rowRef}
        onClick={isAnimating ? undefined : onClick}
        className={cn(
          "relative rounded-xl cursor-pointer group",
          "transition-all duration-300 ease-out",
          !isAnimating && isSelected && "bg-zinc-700/60 ring-1 ring-zinc-600",
          !isAnimating && !isSelected && "hover:bg-zinc-800/60",
          (animState === 'saving' || animState === 'saved-share-prompt') && "bg-[#10B18926] ring-1 ring-[#10B18950]",
          (animState === 'discarding' || animState === 'discard-undo-prompt') && "bg-[#F6445C26] ring-1 ring-[#F6445C50]",
        )}
      >
        {/* Normal content — crossfades with prompts */}
        <div
          className={gridTemplate ? "grid items-center px-4 py-3" : "flex items-center gap-4 px-4 py-3"}
          style={{
            opacity: showPrompt ? 0 : 1,
            transform: showPrompt ? 'scale(0.98)' : 'scale(1)',
            transition: 'opacity 0.25s ease-out, transform 0.25s ease-out',
            pointerEvents: showPrompt ? 'none' : 'auto',
            ...(showPrompt ? { position: 'absolute' as const, inset: 0, zIndex: 0 } : {}),
            ...(gridTemplate ? { gridTemplateColumns: gridTemplate } : {}),
          }}
        >
          {children}
        </div>

        {/* Share prompt — fades in, takes flow position */}
        {(isSavePrompt || (showPrompt && !isDiscardPrompt)) && (
          <div
            className="flex items-center gap-4 px-4 py-3"
            style={{
              opacity: isSavePrompt ? 1 : 0,
              transform: isSavePrompt ? 'scale(1)' : 'scale(0.98)',
              transition: 'opacity 0.3s ease-out 0.05s, transform 0.3s ease-out 0.05s',
            }}
          >
            {sharePromptContent}
          </div>
        )}

        {/* Discard undo prompt — fades in, takes flow position */}
        {(isDiscardPrompt || (showPrompt && !isSavePrompt)) && (
          <div
            className="flex items-center gap-4 px-4 py-3"
            style={{
              opacity: isDiscardPrompt ? 1 : 0,
              transform: isDiscardPrompt ? 'scale(1)' : 'scale(0.98)',
              transition: 'opacity 0.3s ease-out 0.05s, transform 0.3s ease-out 0.05s',
            }}
          >
            {discardPromptContent}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Property Row ─── */
function PropertyRow({ 
  item, isSelected, isViewed, animState, showShareAction, showHoverActions, bulkCheckbox, gridTemplate, bulkState,
  onClick, onExpand, onDiscard, onSave, onShare, onSaveAndShare, onJustSave, onUndo, onConfirmDiscard,
}: { 
  item: MatchProperty; isSelected: boolean; isViewed: boolean;
  animState: RowAnimationState; showShareAction: boolean; showHoverActions: boolean;
  bulkCheckbox?: React.ReactNode; gridTemplate?: string; bulkState?: 'pending' | 'exiting' | null;
  onClick: () => void; onExpand: () => void; onDiscard: () => void;
  onSave: () => void; onShare: () => void; onSaveAndShare: () => void; onJustSave: () => void;
  onUndo: () => void; onConfirmDiscard: () => void;
}) {
  const isAnimating = animState !== 'idle';
  const showPrompt = animState === 'saved-share-prompt' || animState === 'discard-undo-prompt';
  const [imageIndex, setImageIndex] = useState(0);

  const formatPrice = (price: number, currency: string) => {
    if (price >= 1000000) return `${currency}${(price / 1000000).toFixed(1)}M`;
    if (price >= 1000) return `${currency}${(price / 1000).toFixed(0)}k`;
    return `${currency}${price.toLocaleString()}`;
  };

  const sharePrompt = (
    <>
      {/* Thumbnail matching the row's image area */}
      <div className="w-[130px] h-[130px] rounded-xl overflow-hidden flex-shrink-0 bg-zinc-700">
        <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
      </div>
      {/* Info + action */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
        <p className="text-sm font-semibold text-white truncate">{item.title}</p>
        <p className="text-xs text-emerald-300 font-medium">✓ Saved to opportunity</p>
        <p className="text-xs text-zinc-500">Would you like to share it with your client?</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button variant="ghost" size="sm"
          className="h-8 px-3 rounded-lg text-white hover:text-white bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors"
          onClick={(e) => { e.stopPropagation(); onSaveAndShare(); }}>
          <Share className="h-3.5 w-3.5 mr-1.5" />Share
        </Button>
        {animState === 'saved-share-prompt' && (
          <CountdownRing durationMs={AUTO_DISMISS_SAVE_MS} onComplete={onJustSave} />
        )}
      </div>
    </>
  );

  const discardPrompt = (
    <>
      {/* Thumbnail matching the row's image area */}
      <div className="w-[130px] h-[130px] rounded-xl overflow-hidden flex-shrink-0 bg-zinc-700 opacity-50 grayscale">
        <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
      </div>
      {/* Info + action */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
        <p className="text-sm font-semibold text-white truncate">{item.title}</p>
        <p className="text-xs text-red-400 font-medium">Discarded</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button variant="ghost" size="sm"
          className="h-8 px-3 rounded-lg text-white hover:text-white bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors"
          onClick={(e) => { e.stopPropagation(); onUndo(); }}>
          <Undo2 className="h-3.5 w-3.5 mr-1.5" />Undo
        </Button>
        {animState === 'discard-undo-prompt' && (
          <CountdownRing durationMs={AUTO_DISMISS_DISCARD_MS} onComplete={onConfirmDiscard} />
        )}
      </div>
    </>
  );

  return (
    <AnimatedRow
      animState={animState}
      showPrompt={showPrompt}
      isSelected={isSelected}
      isAnimating={isAnimating}
      onClick={onClick}
      sharePromptContent={sharePrompt}
      discardPromptContent={discardPrompt}
      gridTemplate={gridTemplate || 'minmax(280px, 3fr) 1fr 0.8fr 0.5fr 0.6fr 1.5fr auto'}
      bulkState={bulkState}
    >
      <>
        {bulkCheckbox}
        {/* Property: image + title */}
        <div className="flex items-center gap-4 min-w-0 self-center">
          <div 
            className="w-[240px] h-[160px] rounded-xl overflow-hidden flex-shrink-0 bg-zinc-700 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); onExpand(); }}
          >
            <MatchCardImageCarousel
              images={item.images}
              alt={item.title}
              currentIndex={imageIndex}
              onIndexChange={setImageIndex}
              onImageClick={onExpand}
              className="w-full h-full"
            />
          </div>
          <div className="min-w-0">
            {(item.isTopMatch || (item.isNew && !isViewed)) && (
              <div className="flex items-center gap-1.5 mb-1">
                {item.isTopMatch && (
                  <Badge className="text-xs px-2 py-0.5 border-0 bg-amber-400/20 text-amber-300 font-medium flex-shrink-0">Top match</Badge>
                )}
                {item.isNew && !isViewed && (
                  <Badge className="text-xs px-2 py-0.5 border-0 bg-white/15 text-white font-medium flex-shrink-0">New</Badge>
                )}
              </div>
            )}
            <p className="text-base font-semibold text-white">{item.title}</p>
            <p className="text-sm text-zinc-500 mt-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />{item.location}
            </p>
          </div>
        </div>
        {/* Owner */}
        <div className="flex items-center gap-2 min-w-0 self-center">
          <Avatar className="h-8 w-8 border border-white/10 flex-shrink-0">
            <AvatarImage src={item.owner.avatar} />
            <AvatarFallback className="text-[10px] bg-zinc-600 text-white">{item.owner.initials}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-zinc-400">{item.owner.isYou ? 'You' : item.owner.name}</span>
        </div>
        {/* Price */}
        <span className="text-base font-semibold text-white self-center">{formatPrice(item.price, item.currency)}</span>
        {/* Beds */}
        <span className="text-sm text-zinc-300 flex items-center gap-1.5 self-center">
          <Bed className="w-4 h-4 text-zinc-500" />{item.bedrooms}
        </span>
        {/* Size */}
        <span className="text-sm text-zinc-300 self-center">{item.size} {item.sizeUnit}</span>
        {/* Match pills */}
        <div className="flex flex-wrap gap-2 self-center">
          <Badge className="text-sm px-2.5 py-1 border-0 text-white rounded-full font-medium" style={{ backgroundColor: 'rgba(16, 177, 137, 0.35)' }}>
            <Building className="h-3.5 w-3.5 mr-1" />{item.propertyType}
          </Badge>
          <Badge className="text-sm px-2.5 py-1 border-0 text-white rounded-full font-medium" style={{ backgroundColor: 'rgba(16, 177, 137, 0.35)' }}>
            <MapPin className="h-3.5 w-3.5 mr-1" />{item.location.split(',')[0]}
          </Badge>
          <Badge className="text-sm px-2.5 py-1 border-0 text-white rounded-full font-medium" style={{ backgroundColor: 'rgba(237, 153, 23, 0.35)' }}>
            <Bed className="h-3.5 w-3.5 mr-1" />{item.bedrooms}
          </Badge>
          {item.matchingPreferences.slice(3).map((pref, i) => (
            <Badge key={i} className="text-sm px-2.5 py-1 border-0 text-white rounded-full font-medium" style={{ backgroundColor: 'rgba(237, 153, 23, 0.35)' }}>
              {pref}
            </Badge>
          ))}
        </div>
        {/* Actions - always rendered for layout stability */}
        <div className={cn("flex flex-col gap-1.5 items-end self-center transition-opacity duration-150", (isSelected) ? "opacity-100" : showHoverActions ? "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto" : "opacity-0 pointer-events-none")} onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm"
            className={cn(
              "h-8 rounded-lg bg-white/8 text-zinc-300 hover:text-white hover:bg-white/15 transition-all duration-300 font-medium overflow-hidden flex items-center justify-center",
              isSelected ? "w-[80px] px-2.5 gap-1.5" : "w-8 p-0 gap-0"
            )}
            onClick={() => onExpand()}>
            <Eye className="h-4 w-4 flex-shrink-0" />
            <span className={cn("text-xs whitespace-nowrap transition-all duration-300", isSelected ? "opacity-100 max-w-[40px]" : "opacity-0 max-w-0 overflow-hidden")}>View</span>
          </Button>
          <Button variant="ghost" size="sm"
            className={cn(
              "h-8 rounded-lg bg-red-500/10 text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all duration-300 font-medium overflow-hidden flex items-center justify-center",
              isSelected ? "w-[80px] px-2.5 gap-1.5" : "w-8 p-0 gap-0"
            )}
            onClick={onDiscard}>
            <Trash2 className="h-4 w-4 flex-shrink-0" />
            <span className={cn("text-xs whitespace-nowrap transition-all duration-300", isSelected ? "opacity-100 max-w-[40px]" : "opacity-0 max-w-0 overflow-hidden")}>Discard</span>
          </Button>
          <Button variant="ghost" size="sm"
            className={cn(
              "h-8 rounded-lg bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 transition-all duration-300 font-medium overflow-hidden flex items-center justify-center",
              isSelected ? "w-[80px] px-2.5 gap-1.5" : "w-8 p-0 gap-0"
            )}
            onClick={onSave}>
            <Bookmark className="h-4 w-4 flex-shrink-0" />
            <span className={cn("text-xs whitespace-nowrap transition-all duration-300", isSelected ? "opacity-100 max-w-[40px]" : "opacity-0 max-w-0 overflow-hidden")}>Save</span>
          </Button>
        </div>
      </>
    </AnimatedRow>
  );
}

/* ─── Client Row ─── */
function ClientRow({ 
  item, isSelected, isViewed, animState, showShareAction, showHoverActions, bulkCheckbox, gridTemplate, bulkState,
  onClick, onExpand, onDiscard, onSave, onShare, onSaveAndShare, onJustSave, onUndo, onConfirmDiscard,
}: { 
  item: MatchClient; isSelected: boolean; isViewed: boolean;
  animState: RowAnimationState; showShareAction: boolean; showHoverActions: boolean;
  bulkCheckbox?: React.ReactNode; gridTemplate?: string; bulkState?: 'pending' | 'exiting' | null;
  onClick: () => void; onExpand: () => void; onDiscard: () => void;
  onSave: () => void; onShare: () => void; onSaveAndShare: () => void; onJustSave: () => void;
  onUndo: () => void; onConfirmDiscard: () => void;
}) {
  const isAnimating = animState !== 'idle';
  const showPrompt = animState === 'saved-share-prompt' || animState === 'discard-undo-prompt';

  const sourceIcon = portalLogos[item.source] ? (
    <img src={portalLogos[item.source]} alt={item.source} className="h-5 w-5 rounded-sm object-cover" />
  ) : item.source === 'Marketing campaign' ? (
    <Megaphone className="h-4 w-4 text-zinc-300" />
  ) : (
    <FileOutput className="h-4 w-4 text-zinc-300" />
  );

  const sharePrompt = (
    <>
      <div className="w-[100px] h-[100px] rounded-xl flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
          {sourceIcon}
        </div>
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
        <p className="text-sm font-semibold text-white truncate">{item.name}</p>
        <p className="text-xs text-emerald-300 font-medium">✓ Saved to opportunity</p>
        <p className="text-xs text-zinc-500">Would you like to share with this client?</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button variant="ghost" size="sm"
          className="h-8 px-3 rounded-lg text-white hover:text-white bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors"
          onClick={(e) => { e.stopPropagation(); onSaveAndShare(); }}>
          <Share className="h-3.5 w-3.5 mr-1.5" />Share
        </Button>
        {animState === 'saved-share-prompt' && (
          <CountdownRing durationMs={AUTO_DISMISS_SAVE_MS} onComplete={onJustSave} />
        )}
      </div>
    </>
  );

  const discardPrompt = (
    <>
      <div className="w-[100px] h-[100px] rounded-xl flex-shrink-0 flex items-center justify-center opacity-50" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
          {sourceIcon}
        </div>
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
        <p className="text-sm font-semibold text-white truncate">{item.name}</p>
        <p className="text-xs text-red-400 font-medium">Discarded</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button variant="ghost" size="sm"
          className="h-8 px-3 rounded-lg text-white hover:text-white bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors"
          onClick={(e) => { e.stopPropagation(); onUndo(); }}>
          <Undo2 className="h-3.5 w-3.5 mr-1.5" />Undo
        </Button>
        {animState === 'discard-undo-prompt' && (
          <CountdownRing durationMs={AUTO_DISMISS_DISCARD_MS} onComplete={onConfirmDiscard} />
        )}
      </div>
    </>
  );

  return (
    <AnimatedRow
      animState={animState}
      showPrompt={showPrompt}
      isSelected={isSelected}
      isAnimating={isAnimating}
      onClick={onClick}
      sharePromptContent={sharePrompt}
      discardPromptContent={discardPrompt}
      gridTemplate={gridTemplate || 'minmax(280px, 3fr) 1fr 0.8fr 0.5fr 0.6fr 1.5fr auto'}
      bulkState={bulkState}
    >
      <>
        {bulkCheckbox}
        <div className="flex items-center gap-4 min-w-0 self-center">
          <div 
            className="w-[120px] h-[120px] rounded-xl flex-shrink-0 flex items-center justify-center cursor-pointer"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
            onClick={(e) => { e.stopPropagation(); onExpand(); }}
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              {sourceIcon}
            </div>
          </div>
          <div className="min-w-0">
            {(item.isTopMatch || (item.isNew && !isViewed)) && (
              <div className="flex items-center gap-1.5 mb-1">
                {item.isTopMatch && (
                  <Badge className="text-xs px-2 py-0.5 border-0 bg-amber-400/20 text-amber-300 font-medium flex-shrink-0">Top match</Badge>
                )}
                {item.isNew && !isViewed && (
                  <Badge className="text-xs px-2 py-0.5 border-0 bg-white/15 text-white font-medium flex-shrink-0">New</Badge>
                )}
              </div>
            )}
            <p className="text-base font-semibold text-white">{item.name}</p>
            <p className="text-sm text-zinc-500 mt-1">{item.source}</p>
          </div>
        </div>
        {/* Owner */}
        <div className="flex items-center gap-2 min-w-0 self-center">
          <Avatar className="h-8 w-8 border border-white/10 flex-shrink-0">
            <AvatarImage src={item.owner.avatar} />
            <AvatarFallback className="text-[10px] bg-zinc-600 text-white">{item.owner.initials}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-zinc-400">{item.owner.isYou ? 'You' : item.owner.name}</span>
        </div>
        {/* Budget */}
        <span className="text-base font-semibold text-white self-center">
          {item.preferences.priceRange.currency}{(item.preferences.priceRange.min / 1000).toFixed(0)}-{(item.preferences.priceRange.max / 1000).toFixed(0)}k
        </span>
        {/* Beds */}
        <span className="text-sm text-zinc-300 flex items-center gap-1.5 self-center">
          <Bed className="w-4 h-4 text-zinc-500" />{item.preferences.bedrooms}
        </span>
        {/* Size */}
        <span className="text-sm text-zinc-300 self-center">{item.preferences.sizeRange.min}-{item.preferences.sizeRange.max} {item.preferences.sizeRange.unit}</span>
        {/* Match pills */}
        <div className="flex flex-wrap gap-2 self-center">
          <Badge className="text-sm px-2.5 py-1 border-0 text-white rounded-full font-medium" style={{ backgroundColor: 'rgba(16, 177, 137, 0.35)' }}>
            <Building className="h-3.5 w-3.5 mr-1" />{item.preferences.propertyTypes[0]}
          </Badge>
          <Badge className="text-sm px-2.5 py-1 border-0 text-white rounded-full font-medium" style={{ backgroundColor: 'rgba(16, 177, 137, 0.35)' }}>
            <MapPin className="h-3.5 w-3.5 mr-1" />{item.preferences.locations[0]}
          </Badge>
          {item.preferences.extras.length > 0 && item.preferences.extras.map((extra, i) => (
            <Badge key={i} className="text-sm px-2.5 py-1 border-0 text-white rounded-full font-medium" style={{ backgroundColor: 'rgba(237, 153, 23, 0.35)' }}>
              {extra}
            </Badge>
          ))}
        </div>
        {/* Actions - always rendered for layout stability */}
        <div className={cn("flex flex-col gap-1.5 items-end self-center transition-opacity duration-150", (isSelected) ? "opacity-100" : showHoverActions ? "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto" : "opacity-0 pointer-events-none")} onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm"
            className={cn(
              "h-8 rounded-lg bg-white/8 text-zinc-300 hover:text-white hover:bg-white/15 transition-all duration-300 font-medium overflow-hidden flex items-center justify-center",
              isSelected ? "w-[80px] px-2.5 gap-1.5" : "w-8 p-0 gap-0"
            )}
            onClick={() => onExpand()}>
            <Eye className="h-4 w-4 flex-shrink-0" />
            <span className={cn("text-xs whitespace-nowrap transition-all duration-300", isSelected ? "opacity-100 max-w-[40px]" : "opacity-0 max-w-0 overflow-hidden")}>View</span>
          </Button>
          <Button variant="ghost" size="sm"
            className={cn(
              "h-8 rounded-lg bg-red-500/10 text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all duration-300 font-medium overflow-hidden flex items-center justify-center",
              isSelected ? "w-[80px] px-2.5 gap-1.5" : "w-8 p-0 gap-0"
            )}
            onClick={onDiscard}>
            <Trash2 className="h-4 w-4 flex-shrink-0" />
            <span className={cn("text-xs whitespace-nowrap transition-all duration-300", isSelected ? "opacity-100 max-w-[40px]" : "opacity-0 max-w-0 overflow-hidden")}>Discard</span>
          </Button>
          <Button variant="ghost" size="sm"
            className={cn(
              "h-8 rounded-lg bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 transition-all duration-300 font-medium overflow-hidden flex items-center justify-center",
              isSelected ? "w-[80px] px-2.5 gap-1.5" : "w-8 p-0 gap-0"
            )}
            onClick={onSave}>
            <Bookmark className="h-4 w-4 flex-shrink-0" />
            <span className={cn("text-xs whitespace-nowrap transition-all duration-300", isSelected ? "opacity-100 max-w-[40px]" : "opacity-0 max-w-0 overflow-hidden")}>Save</span>
          </Button>
        </div>
      </>
    </AnimatedRow>
  );
}

/* ─── Main Table View ─── */
export function MatchesTableView({
  items,
  viewMode,
  viewedIds,
  currentIndex,
  showShareAction = false,
  showBulkActions = false,
  onSelect,
  onExpand,
  onDiscardItem,
  onSaveItem,
  onShareItem,
  onBulkShare,
  showHoverActions = false,
}: MatchesTableViewProps) {
  const isPropertyView = viewMode === 'properties';
  const [bulkSelectedIds, setBulkSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<BulkActionPrompt | null>(null);
  const [sort, setSort] = useState<SortState>({ field: 'relevance', direction: 'desc' });

  // Filter state
  const [filterPriceRange, setFilterPriceRange] = useState<PriceRangeType>([undefined, undefined]);
  const [filterBedrooms, setFilterBedrooms] = useState<string[]>([]);
  const [filterOwnerOnly, setFilterOwnerOnly] = useState(false);



  const hasPriceFilter = filterPriceRange[0] !== undefined || filterPriceRange[1] !== undefined;
  const activeFilterCount = [hasPriceFilter, filterBedrooms.length > 0, filterOwnerOnly].filter(Boolean).length;

  const clearAllFilters = useCallback(() => {
    setFilterPriceRange([undefined, undefined]);
    setFilterBedrooms([]);
    setFilterOwnerOnly(false);
  }, []);

  // Filtered + sorted items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Price filter
      if (filterPriceRange[0] !== undefined || filterPriceRange[1] !== undefined) {
        const price = 'price' in item ? item.price : (item as MatchClient).preferences.priceRange.min;
        if (filterPriceRange[0] !== undefined && price < filterPriceRange[0]) return false;
        if (filterPriceRange[1] !== undefined && price > filterPriceRange[1]) return false;
      }
      // Bedrooms filter
      if (filterBedrooms.length > 0) {
        const beds = 'bedrooms' in item ? item.bedrooms : (item as MatchClient).preferences.bedrooms;
        const matches = filterBedrooms.some(f => {
          if (f === 'studio') return beds === 0;
          if (f === '5+') return beds >= 5;
          return beds === parseInt(f);
        });
        if (!matches) return false;
      }
      // Owner filter
      if (filterOwnerOnly) {
        if (!item.owner.isYou) return false;
      }
      return true;
    });
  }, [items, filterPriceRange, filterBedrooms, filterOwnerOnly]);

  // Sorted items
  const sortedItems = useMemo(() => {
    if (sort.field === 'relevance') return filteredItems;
    const sorted = [...filteredItems].sort((a, b) => {
      let aVal: number, bVal: number;
      switch (sort.field) {
        case 'price':
          aVal = 'price' in a ? a.price : (a as MatchClient).preferences.priceRange.min;
          bVal = 'price' in b ? b.price : (b as MatchClient).preferences.priceRange.min;
          break;
        case 'size':
          aVal = 'size' in a ? a.size : (a as MatchClient).preferences.sizeRange.min;
          bVal = 'size' in b ? b.size : (b as MatchClient).preferences.sizeRange.min;
          break;
        case 'date':
          aVal = 'publishedDate' in a ? new Date(a.publishedDate).getTime() : 0;
          bVal = 'publishedDate' in b ? new Date(b.publishedDate).getTime() : 0;
          break;
        case 'owned':
          // Owned by me first
          aVal = ('owner' in a && a.owner.isYou) ? 1 : 0;
          bVal = ('owner' in b && b.owner.isYou) ? 1 : 0;
          break;
        default:
          return 0;
      }
      return sort.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return sorted;
  }, [filteredItems, sort]);
  // Clear bulk selection when items change or bulk mode is toggled off
  useEffect(() => {
    if (!showBulkActions) {
      setBulkSelectedIds(new Set());
      setBulkAction(null);
    }
  }, [showBulkActions]);

  const toggleBulkSelect = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBulkSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setBulkSelectedIds(prev => {
      if (prev.size === sortedItems.length) return new Set();
      return new Set(sortedItems.map(i => i.id));
    });
  }, [sortedItems]);

  const bulkGrid = showBulkActions
    ? '40px minmax(280px, 3fr) 1fr 0.8fr 0.5fr 0.6fr 1.5fr auto'
    : 'minmax(280px, 3fr) 1fr 0.8fr 0.5fr 0.6fr 1.5fr auto';

  const { startDiscard, confirmDiscard, undoDiscard, startSave, startSaveAndExit, finishSave, getState } = useRowAnimation(onDiscardItem);

  // Bulk action handlers
  const handleBulkSave = useCallback(() => {
    const ids = Array.from(bulkSelectedIds);
    setBulkAction({ type: 'save', ids, phase: 'loading' });
    setBulkSelectedIds(new Set());
    // Simulate API call
    setTimeout(() => {
      setBulkAction(prev => prev ? { ...prev, phase: 'post-action' } : null);
    }, 1200);
  }, [bulkSelectedIds]);

  const handleBulkDiscard = useCallback(() => {
    const ids = Array.from(bulkSelectedIds);
    setBulkAction({ type: 'discard', ids, phase: 'loading' });
    setBulkSelectedIds(new Set());
    // Simulate API call
    setTimeout(() => {
      setBulkAction(prev => prev ? { ...prev, phase: 'post-action' } : null);
    }, 1200);
  }, [bulkSelectedIds]);

  // Track IDs that are animating out after bulk confirm
  const [bulkExitingIds, setBulkExitingIds] = useState<Set<string>>(new Set());

  // Trigger row exits as soon as the process completes (loading → post-action)
  useEffect(() => {
    if (bulkAction?.phase === 'post-action') {
      const ids = bulkAction.ids;
      ids.forEach((id, i) => {
        setTimeout(() => {
          setBulkExitingIds(prev => new Set(prev).add(id));
        }, i * 80);
      });
    }
  }, [bulkAction?.phase]);

  // When countdown ends, finalize: remove from data and clear toolbar
  const handleBulkConfirm = useCallback(() => {
    if (!bulkAction) return;
    const ids = bulkAction.ids;
    const callback = bulkAction.type === 'save' ? onSaveItem : onDiscardItem;
    
    // Start toolbar exit
    setBulkAction(prev => prev ? { ...prev, phase: 'exiting' } : null);
    
    // Rows already exited visually — now actually remove from data
    const delay = 300; // let toolbar animate out
    setTimeout(() => {
      ids.forEach((id, i) => {
        setTimeout(() => callback(id), i * 30);
      });
      setTimeout(() => {
        setBulkExitingIds(new Set());
        setBulkAction(null);
      }, ids.length * 30 + 50);
    }, delay);
  }, [bulkAction, onSaveItem, onDiscardItem]);

  const handleBulkUndo = useCallback(() => {
    // Clear exiting state so rows animate back in
    setBulkExitingIds(new Set());
    setBulkAction(null);
  }, []);

  const handleBulkShareAll = useCallback(() => {
    if (!bulkAction) return;
    const ids = new Set(bulkAction.ids);
    const idsArr = bulkAction.ids;
    setBulkAction(prev => prev ? { ...prev, phase: 'exiting' } : null);
    
    const delay = 300;
    setTimeout(() => {
      idsArr.forEach((id, i) => {
        setTimeout(() => onSaveItem(id), i * 30);
      });
      setTimeout(() => {
        setBulkExitingIds(new Set());
        setBulkAction(null);
        onBulkShare?.(ids);
      }, idsArr.length * 30 + 50);
    }, delay);
  }, [bulkAction, onSaveItem, onBulkShare]);

  // Set of IDs currently in a bulk action (hidden from normal rendering)
  const bulkActionIds = useMemo(() => new Set(bulkAction?.ids || []), [bulkAction]);

  const handleShare = useCallback((id: string) => {
    onShareItem?.(id);
  }, [onShareItem]);

  const handleSaveAndShare = useCallback((id: string) => {
    finishSave(id, (savedId) => {
      onSaveItem(savedId);
      setTimeout(() => onShareItem?.(savedId), 100);
    });
  }, [finishSave, onSaveItem, onShareItem]);

  const handleJustSave = useCallback((id: string) => {
    finishSave(id, onSaveItem);
  }, [finishSave, onSaveItem]);

  // Expose keyboard-triggered save/discard for the current row
  const handleKeyDiscard = useCallback(() => {
    const currentItem = sortedItems[currentIndex];
    if (!currentItem) return;
    const state = getState(currentItem.id);
    if (state !== 'idle') return;
    startDiscard(currentItem.id);
    if (currentIndex < sortedItems.length - 1) onSelect(currentIndex + 1);
  }, [sortedItems, currentIndex, getState, startDiscard, onSelect]);

  const handleKeySave = useCallback(() => {
    const currentItem = sortedItems[currentIndex];
    if (!currentItem) return;
    const state = getState(currentItem.id);
    if (state !== 'idle') return;
    startSave(currentItem.id);
    if (currentIndex < sortedItems.length - 1) onSelect(currentIndex + 1);
  }, [sortedItems, currentIndex, getState, showShareAction, startSave, startSaveAndExit, onSaveItem, onSelect]);

  // Keyboard shortcuts for table view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check we're in a context where these make sense
      // D = discard, S = save, Arrow Up/Down = navigate
      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        handleKeyDiscard();
        return;
      }
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleKeySave();
        return;
      }
      if (e.key === 'ArrowUp' && currentIndex > 0) {
        e.preventDefault();
        onSelect(currentIndex - 1);
        return;
      }
      if (e.key === 'ArrowDown' && currentIndex < sortedItems.length - 1) {
        e.preventDefault();
        onSelect(currentIndex + 1);
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const currentItem = sortedItems[currentIndex];
        if (currentItem) onExpand(currentItem);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDiscard, handleKeySave, currentIndex, sortedItems, onSelect, onExpand]);

  // Auto-scroll selected row into view
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollContainerRef.current) {
      const selectedRow = scrollContainerRef.current.children[currentIndex] as HTMLElement;
      if (selectedRow) {
        selectedRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [currentIndex]);

  // Sort label mapping
  const sortLabels: Record<SortField, string> = {
    relevance: 'Top matches',
    price: isPropertyView ? 'Price' : 'Budget',
    size: 'Size',
    date: 'Date added',
    owned: 'Owned by me',
  };


  return (
    <div className="flex-1 flex flex-col w-full max-w-[1400px] mx-auto min-h-0 px-4 relative">
      {/* Filter & Sort bar — using shared filter components */}
      <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0 flex-wrap">
        {/* Price filter */}
        <PriceFilter
          priceRange={filterPriceRange}
          onChange={setFilterPriceRange}
          resultCount={filteredItems.length}
          isRent={!isPropertyView}
          darkMode
        />

        {/* Bedrooms filter */}
        <BedroomsFilter
          bedroomFilters={filterBedrooms}
          onChange={setFilterBedrooms}
          resultCount={filteredItems.length}
          darkMode
        />

        {/* Owner filter pill */}
        <Button
          variant={filterOwnerOnly ? "default" : "outline"}
          onClick={() => setFilterOwnerOnly(prev => !prev)}
          className={cn(
            "rounded-full shrink-0",
            filterOwnerOnly
              ? "bg-white text-zinc-900 hover:bg-white/90 border-white"
              : "bg-white/10 text-white border-white/20 hover:bg-white/20"
          )}
        >
          <User className="w-4 h-4 mr-2" />
          Mine only
        </Button>

        {/* Clear all */}
        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-white/60 hover:text-white underline underline-offset-2 transition-colors"
          >
            Clear all
          </button>
        )}

        {/* Result count + Sort — pushed to right */}
        <div className="flex items-center gap-2 ml-auto">
          {(activeFilterCount > 0 || sort.field !== 'relevance') && (
            <span className="text-xs text-white/50 tabular-nums">
              {sortedItems.length} of {items.length}
            </span>
          )}

          {/* Sort dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={sort.field !== 'relevance' ? "default" : "outline"}
                className={cn(
                  "rounded-full shrink-0",
                  sort.field !== 'relevance'
                    ? "bg-white text-zinc-900 hover:bg-white/90 border-white"
                    : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                )}
              >
                {sort.field !== 'relevance' ? (
                  <>
                    {sortLabels[sort.field]}
                    {sort.direction === 'asc' ? <ArrowUp className="w-4 h-4 ml-1" /> : <ArrowDown className="w-4 h-4 ml-1" />}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Top matches
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52" style={{ zIndex: 200 }}>
              <DropdownMenuRadioGroup
                value={`${sort.field}-${sort.direction}`}
                onValueChange={(v) => {
                  const [field, dir] = v.split('-') as [SortField, SortDirection];
                  setSort({ field, direction: dir });
                }}
              >
                <DropdownMenuRadioItem value="relevance-desc">
                  <Sparkles className="w-3.5 h-3.5 mr-2 text-amber-400" />Top matches
                </DropdownMenuRadioItem>
                <DropdownMenuSeparator />
                <DropdownMenuRadioItem value="price-asc">
                  {isPropertyView ? 'Price' : 'Budget'}: Low → High
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="price-desc">
                  {isPropertyView ? 'Price' : 'Budget'}: High → Low
                </DropdownMenuRadioItem>
                <DropdownMenuSeparator />
                <DropdownMenuRadioItem value="size-asc">
                  Size: Small → Large
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="size-desc">
                  Size: Large → Small
                </DropdownMenuRadioItem>
                <DropdownMenuSeparator />
                <DropdownMenuRadioItem value="date-desc">
                  Date: Newest first
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="date-asc">
                  Date: Oldest first
                </DropdownMenuRadioItem>
                <DropdownMenuSeparator />
                <DropdownMenuRadioItem value="owned-desc">
                  Owned by me first
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Column headers */}
      <div
        className="grid items-center text-sm font-semibold text-zinc-500 px-4 py-3 border-b border-zinc-700/50 flex-shrink-0"
        style={{ gridTemplateColumns: bulkGrid }}
      >
        {showBulkActions && (
          <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={toggleSelectAll}
              className={cn(
                "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                bulkSelectedIds.size === sortedItems.length && sortedItems.length > 0
                  ? "bg-white border-white"
                  : bulkSelectedIds.size > 0
                  ? "border-zinc-400 bg-white/20"
                  : "border-zinc-500 hover:border-zinc-400"
              )}
            >
              {bulkSelectedIds.size === sortedItems.length && sortedItems.length > 0 && (
                <Check className="w-3.5 h-3.5 text-zinc-900" />
              )}
              {bulkSelectedIds.size > 0 && bulkSelectedIds.size < sortedItems.length && (
                <div className="w-2.5 h-0.5 bg-white rounded-full" />
              )}
            </button>
          </div>
        )}
        {(isPropertyView
          ? ['Property', 'Owner', 'Price', 'Beds', 'Size', 'Match criteria']
          : ['Client', 'Owner', 'Budget', 'Beds', 'Size', 'Match criteria']
        ).map((label, i) => (
          <span key={i}>{label}</span>
        ))}
        <span />
      </div>
      {/* Scrollable rows */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 py-2 px-1">
        {sortedItems.map((item, index) => {
          // Determine bulk state for this row
          const itemBulkState = bulkExitingIds.has(item.id) 
            ? 'exiting' as const
            : bulkActionIds.has(item.id) 
              ? 'pending' as const 
              : null;

          const isSelected = index === currentIndex && !itemBulkState;
          const isViewed = viewedIds.has(item.id);
          const animState = getState(item.id);
          const isBulkChecked = bulkSelectedIds.has(item.id);

          const bulkCheckbox = showBulkActions ? (
            <div className="flex items-center justify-center self-center" onClick={(e) => toggleBulkSelect(item.id, e)}>
              <button
                className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                  isBulkChecked
                    ? "bg-white border-white"
                    : "border-zinc-500 hover:border-zinc-400"
                )}
              >
                {isBulkChecked && <Check className="w-3.5 h-3.5 text-zinc-900" />}
              </button>
            </div>
          ) : null;

          if (isPropertyView) {
            return (
              <PropertyRow
                key={item.id}
                item={item as MatchProperty}
                isSelected={isSelected}
                isViewed={isViewed}
                animState={animState}
                showShareAction={showShareAction}
                showHoverActions={showHoverActions}
                bulkCheckbox={bulkCheckbox}
                gridTemplate={bulkGrid}
                bulkState={itemBulkState}
                onClick={() => onSelect(index)}
                onExpand={() => onExpand(item)}
                onDiscard={() => { startDiscard(item.id); if (index < sortedItems.length - 1) onSelect(index + 1); }}
                onSave={() => { startSave(item.id); if (index < sortedItems.length - 1) onSelect(index + 1); }}
                onShare={() => handleShare(item.id)}
                onSaveAndShare={() => handleSaveAndShare(item.id)}
                onJustSave={() => handleJustSave(item.id)}
                onUndo={() => undoDiscard(item.id)}
                onConfirmDiscard={() => confirmDiscard(item.id)}
              />
            );
          } else {
            return (
              <ClientRow
                key={item.id}
                item={item as MatchClient}
                isSelected={isSelected}
                isViewed={isViewed}
                animState={animState}
                showShareAction={showShareAction}
                showHoverActions={showHoverActions}
                bulkCheckbox={bulkCheckbox}
                gridTemplate={bulkGrid}
                bulkState={itemBulkState}
                onClick={() => onSelect(index)}
                onExpand={() => onExpand(item)}
                onDiscard={() => { startDiscard(item.id); if (index < sortedItems.length - 1) onSelect(index + 1); }}
                onSave={() => { startSave(item.id); if (index < sortedItems.length - 1) onSelect(index + 1); }}
                onShare={() => handleShare(item.id)}
                onSaveAndShare={() => handleSaveAndShare(item.id)}
                onJustSave={() => handleJustSave(item.id)}
                onUndo={() => undoDiscard(item.id)}
                onConfirmDiscard={() => confirmDiscard(item.id)}
              />
            );
          }
        })}
      </div>

      {/* Floating bulk action bar — morphs between selection, loading, and post-action */}
      <div className="absolute bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <AnimatePresence>
        {showBulkActions && (bulkSelectedIds.size > 0 || bulkAction) && (
          <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: bulkAction?.phase === 'exiting' ? 0 : 1, 
              y: bulkAction?.phase === 'exiting' ? 10 : 0, 
              scale: bulkAction?.phase === 'exiting' ? 0.95 : 1 
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ 
              layout: { type: "spring", stiffness: 400, damping: 30 },
              opacity: { duration: 0.25 },
              y: { type: "spring", stiffness: 400, damping: 30 },
              scale: { duration: 0.25 },
            }}
            className={cn(
              "flex items-center gap-3 px-5 py-3 rounded-2xl backdrop-blur-sm shadow-2xl pointer-events-auto",
              !bulkAction && "bg-white/95 border border-zinc-200/50",
              bulkAction?.phase === 'loading' && bulkAction.type === 'save' && "bg-emerald-950/95 border border-emerald-500/30",
              bulkAction?.phase === 'loading' && bulkAction.type === 'discard' && "bg-red-950/95 border border-red-500/30",
              bulkAction?.phase === 'post-action' && bulkAction.type === 'save' && "bg-emerald-950/95 border border-emerald-500/30",
              bulkAction?.phase === 'post-action' && bulkAction.type === 'discard' && "bg-red-950/95 border border-red-500/30",
            )}
          >
            <AnimatePresence mode="wait">
              {/* Selection state */}
              {!bulkAction && (
                <motion.div
                  key="selection"
                  initial={{ opacity: 0, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, filter: 'blur(4px)' }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-sm font-semibold text-zinc-900 whitespace-nowrap">
                    {bulkSelectedIds.size} match{bulkSelectedIds.size !== 1 ? 'es' : ''} selected
                  </span>
                  <div className="w-px h-6 bg-zinc-200" />
                  <Button
                    size="sm"
                    className="h-8 px-3 rounded-lg bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 hover:text-emerald-700 text-xs font-semibold"
                    variant="ghost"
                    onClick={handleBulkSave}
                  >
                    <Bookmark className="h-3.5 w-3.5 mr-1.5" />Save
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 px-3 rounded-lg bg-red-500/15 text-red-700 hover:bg-red-500/25 hover:text-red-700 text-xs font-semibold"
                    variant="ghost"
                    onClick={handleBulkDiscard}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />Discard
                  </Button>
                  <button
                    onClick={() => setBulkSelectedIds(new Set())}
                    className="ml-1 p-1 rounded-full hover:bg-zinc-100 transition-colors"
                  >
                    <X className="h-4 w-4 text-zinc-500" />
                  </button>
                </motion.div>
              )}

              {/* Loading state */}
              {bulkAction?.phase === 'loading' && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, filter: 'blur(4px)' }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3"
                >
                  <div className="relative w-5 h-5 flex-shrink-0">
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" className={bulkAction.type === 'save' ? 'text-emerald-500/20' : 'text-red-500/20'} />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={bulkAction.type === 'save' ? 'text-emerald-400' : 'text-red-400'} />
                    </svg>
                  </div>
                  <span className={cn("text-sm font-semibold whitespace-nowrap", bulkAction.type === 'save' ? "text-emerald-300" : "text-red-300")}>
                    {bulkAction.type === 'save' ? 'Saving' : 'Discarding'} {bulkAction.ids.length} match{bulkAction.ids.length !== 1 ? 'es' : ''}…
                  </span>
                </motion.div>
              )}

              {/* Post-action: Save */}
              {bulkAction?.phase === 'post-action' && bulkAction.type === 'save' && (
                <motion.div
                  key="post-save"
                  initial={{ opacity: 0, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, filter: 'blur(4px)' }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-4"
                >
                  {/* Success icon with pulse */}
                  <motion.div 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }} 
                    transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.1 }}
                    className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 ring-1 ring-emerald-500/30"
                  >
                    <Check className="w-4 h-4 text-emerald-400" />
                  </motion.div>
                  
                  {/* Info block */}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-white whitespace-nowrap">
                      {bulkAction.ids.length} {bulkAction.ids.length === 1 ? 'match' : 'matches'} saved
                    </span>
                    <span className="text-[11px] text-emerald-400/70">
                      Added to opportunity · Share with your client?
                    </span>
                  </div>
                  
                  <div className="w-px h-8 bg-emerald-500/20 mx-1" />
                  
                  {/* Actions */}
                  <Button
                    size="sm"
                    className="h-9 px-4 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 hover:text-white text-xs font-semibold border border-emerald-500/20"
                    variant="ghost"
                    onClick={handleBulkShareAll}
                  >
                    <Share className="h-3.5 w-3.5 mr-1.5" />Share all
                  </Button>
                  <Button
                    size="sm"
                    className="h-9 px-3 rounded-xl bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white text-xs font-medium"
                    variant="ghost"
                    onClick={handleBulkConfirm}
                  >
                    Dismiss
                  </Button>
                  <CountdownRing durationMs={BULK_AUTO_DISMISS_MS} onComplete={handleBulkConfirm} />
                </motion.div>
              )}

              {/* Post-action: Discard */}
              {bulkAction?.phase === 'post-action' && bulkAction.type === 'discard' && (
                <motion.div
                  key="post-discard"
                  initial={{ opacity: 0, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, filter: 'blur(4px)' }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-4"
                >
                  {/* Discard icon */}
                  <motion.div 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }} 
                    transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.1 }}
                    className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 ring-1 ring-red-500/30"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </motion.div>
                  
                  {/* Info block */}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-white whitespace-nowrap">
                      {bulkAction.ids.length} {bulkAction.ids.length === 1 ? 'match' : 'matches'} discarded
                    </span>
                    <span className="text-[11px] text-red-400/70">
                      Removed from suggestions · Undo to restore
                    </span>
                  </div>
                  
                  <div className="w-px h-8 bg-red-500/20 mx-1" />
                  
                  {/* Actions */}
                  <Button
                    size="sm"
                    className="h-9 px-4 rounded-xl bg-white/10 text-white hover:bg-white/20 hover:text-white text-xs font-semibold border border-white/10"
                    variant="ghost"
                    onClick={handleBulkUndo}
                  >
                    <Undo2 className="h-3.5 w-3.5 mr-1.5" />Undo
                  </Button>
                  <Button
                    size="sm"
                    className="h-9 px-3 rounded-xl bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white text-xs font-medium"
                    variant="ghost"
                    onClick={handleBulkConfirm}
                  >
                    Dismiss
                  </Button>
                  <CountdownRing durationMs={BULK_AUTO_DISMISS_MS} onComplete={handleBulkConfirm} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
