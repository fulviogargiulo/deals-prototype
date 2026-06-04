import { useState, useRef, useEffect, useCallback } from "react";
import { MoreHorizontal, ChevronLeft, ChevronRight, Upload, CalendarDays, Phone, CheckCircle, XCircle, ImageOff, ArrowDown, Handshake, X, MessageCircle, Mail, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SpecPills } from "@/components/ui/spec-pills";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Separator } from "@/components/ui/separator";
import { PropertyStatusBadge } from "@/components/ui/property-status-badge";
import { PropertyStatus, DelistReason } from "@/types";
import { SharePropertyModal } from "@/components/modals/share-property-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import idealistaLogo from "@/assets/idealista-logo.png";
import fotocasaLogo from "@/assets/fotocasa-logo-new.png";
import pisosLogo from "@/assets/pisos-logo.png";

export type CarouselStyleMode = 'current' | 'alternative';
export type PropertyCardVariant = 'search' | 'my-properties' | 'opportunities';

interface PropertyCardProps {
  property: {
    id: string;
    title: string;
    images?: string[];
    image?: string;
    priceRange?: {
      min: number;
      max: number;
      currency: string;
    };
    price?: string | number;
    originalPrice?: number; // For price drop display
    bedrooms?: number;
    bathrooms?: number;
    sizeRange?: {
      min: number;
      max: number;
      unit: string;
    };
    size?: number;
    sizeUnit?: string;
    neighborhoods?: string[];
    location?: string;
    propertyTypes?: string[];
    type?: string;
    source?: string | { type: string; name: string };
    badges?: string[];
    labels?: string[];
    updateIndicator?: string;
    createdAt?: string;
    agentName?: string;
    agentImage?: string;
    agentPhone?: string;
    agentEmail?: string;
    // My Properties specific
    propertyStatus?: PropertyStatus;
    statusDate?: string;
    delistReason?: DelistReason;
    delistDate?: string;
    // Portal inquiry footer
    portalInquired?: {
      portal: 'idealista' | 'fotocasa' | 'pisos';
      timestamp: string;
    };
    // Property saved footer (for opportunities variant)
    propertySaved?: {
      timestamp: string;
    };
    // Whether this is the user's own property
    isOwnProperty?: boolean;
    // Landlord info (for own properties in buy/rent opportunities)
    landlordName?: string;
    landlordPhone?: string;
    landlordEmail?: string;
  };
  variant?: PropertyCardVariant;
  className?: string;
  onClick?: () => void;
  carouselStyle?: CarouselStyleMode;
  // Action handlers for opportunities variant
  onShareProperty?: () => void;
  onBookVisit?: () => void;
  onCall?: () => void;
  onWhatsApp?: () => void;
  onEmail?: () => void;
  onGoToProfile?: () => void;
  onCloseDeal?: () => void;
  onRemove?: () => void;
}

const formatTimeAgo = (dateString?: string) => {
  if (!dateString) return null;
  const now = new Date();
  const date = new Date(dateString);
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInYears = Math.floor(diffInDays / 365);
  
  if (diffInYears >= 1) return `${diffInYears}y ago`;
  if (diffInDays >= 1) return `${diffInDays}d ago`;
  if (diffInHours >= 1) return `${diffInHours}h ago`;
  return 'Just now';
};

export function PropertyCard({ 
  property, 
  variant = 'search',
  className, 
  onClick, 
  carouselStyle = 'alternative',
  onShareProperty,
  onBookVisit,
  onCall,
  onWhatsApp,
  onEmail,
  onGoToProfile,
  onCloseDeal,
  onRemove,
}: PropertyCardProps) {
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const touchStateRef = useRef<{
    startX: number;
    startY: number;
    currentX: number;
    isSwiping: boolean;
    isScrolling: boolean;
  } | null>(null);

  // Minimum swipe distance to trigger navigation (in px)
  const minSwipeDistance = 50;

  const getImages = useCallback(() => {
    if (property.images && property.images.length > 0) return property.images;
    if (property.image) return [property.image];
    return ['/placeholder.svg'];
  }, [property.images, property.image]);

  const images = getImages();
  
  // DEBUG: Log when card renders with images
  useEffect(() => {
    console.log('[PropertyCard] Mounted with', images.length, 'images for:', property.title?.substring(0, 30));
    return () => {
      console.log('[PropertyCard] Unmounted:', property.title?.substring(0, 30));
    };
  }, []);

  // Use native event listeners for better touch control on iOS
  useEffect(() => {
    const container = imageContainerRef.current;
    if (!container || images.length <= 1) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStateRef.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        currentX: e.touches[0].clientX,
        isSwiping: false,
        isScrolling: false,
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStateRef.current) return;
      
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = Math.abs(currentX - touchStateRef.current.startX);
      const diffY = Math.abs(currentY - touchStateRef.current.startY);
      
      touchStateRef.current.currentX = currentX;
      
      // Determine direction on first significant movement
      if (!touchStateRef.current.isSwiping && !touchStateRef.current.isScrolling) {
        if (diffX > 8 || diffY > 8) {
          if (diffX > diffY) {
            // Horizontal swipe - we handle this
            touchStateRef.current.isSwiping = true;
          } else {
            // Vertical scroll - let browser handle
            touchStateRef.current.isScrolling = true;
          }
        }
      }
      
      // Prevent page scroll if we're swiping horizontally
      if (touchStateRef.current.isSwiping) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleTouchEnd = () => {
      if (!touchStateRef.current || !touchStateRef.current.isSwiping) {
        touchStateRef.current = null;
        return;
      }
      
      const distance = touchStateRef.current.startX - touchStateRef.current.currentX;
      const isLeftSwipe = distance > minSwipeDistance;
      const isRightSwipe = distance < -minSwipeDistance;
      
      if (isLeftSwipe) {
        setCurrentImageIndex(prev => Math.min(prev + 1, images.length - 1));
      } else if (isRightSwipe) {
        setCurrentImageIndex(prev => Math.max(prev - 1, 0));
      }
      
      touchStateRef.current = null;
    };

    // Add listeners with { passive: false } to allow preventDefault
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [images.length]);
  
  const isAltStyle = carouselStyle === 'alternative';
  const isMyProperties = variant === 'my-properties';
  const showTimeTag = isMyProperties && (property.propertyStatus === 'published' || property.propertyStatus === 'in-review');
  
  // Check if property has no images
  const hasNoImages = (!property.images || property.images.length === 0) && !property.image;
  
  // Check what data is available for adaptive card sizing
  const hasPrice = (typeof property.price === 'number' && property.price > 0) || 
                   (typeof property.price === 'string' && property.price.length > 0) || 
                   property.priceRange;
  const hasSpecs = property.bedrooms !== undefined || property.bathrooms !== undefined || 
                   property.size !== undefined || property.sizeRange;

  const formatPrice = () => {
    if (typeof property.price === 'number') {
      return `€${property.price.toLocaleString()}`;
    }
    if (typeof property.price === 'string') return property.price;
    
    if (!property.priceRange) return 'Price on request';
    const { max, currency } = property.priceRange;
    
    if (property.type === 'lease' || property.type === 'rent') {
      return `${currency}${max.toLocaleString()}/mo`;
    }
    return `${currency}${max.toLocaleString()}`;
  };

  const formatOriginalPrice = () => {
    if (!property.originalPrice) return null;
    return `€${property.originalPrice.toLocaleString()}`;
  };

  const getPriceDropPercentage = () => {
    if (!property.originalPrice || typeof property.price !== 'number' || property.price <= 0) return null;
    const drop = ((property.originalPrice - property.price) / property.originalPrice) * 100;
    return drop > 0 ? Math.round(drop) : null;
  };

  const hasPriceDrop = property.originalPrice && typeof property.price === 'number' && property.price < property.originalPrice;

  const formatSize = () => {
    if (property.size && property.sizeUnit) {
      return `${property.size} ${property.sizeUnit}`;
    }
    if (property.size) {
      return `${property.size} m²`;
    }
    
    if (!property.sizeRange) return null;
    const { max, unit } = property.sizeRange;
    return `${max} ${unit}`;
  };

  const getLocation = () => {
    if (property.location) return property.location;
    
    if (property.neighborhoods && property.neighborhoods.length > 0) {
      return property.neighborhoods[0];
    }
    
    return '';
  };


  // Get property type as title, properly formatted
  const getPropertyTypeTitle = () => {
    if (isMyProperties) return property.title;
    
    const location = getLocation();
    if (property.propertyTypes && property.propertyTypes.length > 0) {
      const type = property.propertyTypes[0];
      const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
      return location ? `${capitalizedType} for sale in ${location}` : capitalizedType;
    }
    return property.title;
  };

  const timeAgo = formatTimeAgo(isMyProperties ? property.statusDate : property.createdAt);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentImageIndex === 0) return;
    setCurrentImageIndex((prev) => prev - 1);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentImageIndex === images.length - 1) return;
    setCurrentImageIndex((prev) => prev + 1);
  };

  // Dropdown menu items based on variant
  const renderMenuItems = () => {
    const handleShareClick = () => {
      setShareModalOpen(true);
    };

    if (isMyProperties) {
      return (
        <div className="p-1">
          <DropdownMenuItem>View details</DropdownMenuItem>
          <DropdownMenuItem>Edit property</DropdownMenuItem>
          <DropdownMenuItem onSelect={handleShareClick}>
            <Upload className="h-4 w-4 text-muted-foreground" />
            Share
          </DropdownMenuItem>
          <DropdownMenuItem>Delist</DropdownMenuItem>
        </div>
      );
    }
    
    if (variant === 'opportunities') {
      // Determine contact label and info based on property ownership
      const isOwnProperty = property.isOwnProperty;
      const contactLabel = isOwnProperty ? 'Contact client' : 'Contact agent';
      const contactName = isOwnProperty 
        ? (property.landlordName || 'Client')
        : (property.agentName || 'Agent');
      const contactImage = isOwnProperty ? undefined : property.agentImage;
      const hasPhone = isOwnProperty ? property.landlordPhone : property.agentPhone;
      const hasEmail = isOwnProperty ? property.landlordEmail : property.agentEmail;
      
      return (
        <>
          {/* Listed by header - show agent/landlord info */}
          {contactName && (
            <>
              <div className="-mx-2 -mt-2 px-4 py-3 flex items-start gap-3 border-b border-border">
                <UserAvatar 
                  name={contactName} 
                  image={contactImage}
                  size="md" 
                  className="w-10 h-10" 
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">
                    {isOwnProperty ? 'Client' : 'Listed by'}
                  </p>
                  <span className="font-medium">{contactName}</span>
                </div>
              </div>
              <div className="h-2" /> {/* Spacer after header */}
            </>
          )}
          
          {/* Share property with client */}
          <DropdownMenuItem 
            onSelect={(e) => {
              onShareProperty?.();
            }}
          >
            <Upload className="h-4 w-4 text-muted-foreground" />
            Share property
          </DropdownMenuItem>
          
          {/* Book a visit */}
          <DropdownMenuItem 
            onSelect={() => {
              onBookVisit?.();
            }}
          >
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            Book a visit
          </DropdownMenuItem>
          
          {/* Contact agent/landlord - with submenu */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Phone className="h-4 w-4 text-muted-foreground" />
              {contactLabel}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="min-w-[160px]">
              <div className="-mx-2 -mt-2 px-4 py-3 border-b border-border mb-2">
                <span className="text-sm font-semibold">{contactName}</span>
              </div>
              {hasPhone && (
                <DropdownMenuItem 
                  onSelect={() => {
                    onCall?.();
                  }}
                >
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  Call
                </DropdownMenuItem>
              )}
              {hasPhone && (
                <DropdownMenuItem 
                  onSelect={() => {
                    onWhatsApp?.();
                  }}
                >
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  WhatsApp
                </DropdownMenuItem>
              )}
              {hasEmail && (
                <DropdownMenuItem 
                  onSelect={() => {
                    onEmail?.();
                  }}
                >
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email
                </DropdownMenuItem>
              )}
              {onGoToProfile && (
                <DropdownMenuItem 
                  onSelect={() => {
                    onGoToProfile?.();
                  }}
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  Go to profile
                </DropdownMenuItem>
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          
          {/* Close deal */}
          <DropdownMenuItem 
            onSelect={() => {
              onCloseDeal?.();
            }}
          >
            <Handshake className="h-4 w-4 text-muted-foreground" />
            Close deal
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {/* Remove from saved */}
          <DropdownMenuItem 
            className="text-destructive focus:text-destructive focus:bg-destructive/10 hover:bg-destructive/10"
            onSelect={() => {
              onRemove?.();
            }}
          >
            <X className="h-4 w-4" />
            Remove from saved properties
          </DropdownMenuItem>
        </>
      );
    }
    
    // Search variant with agent info
    return (
      <>
        {property.agentName && (
          <>
            <div className="-mx-2 -mt-2 px-4 py-3 flex items-start gap-3 border-b border-border">
              <UserAvatar 
                name={property.agentName} 
                image={property.agentImage}
                size="md" 
                className="w-10 h-10" 
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Listed by</p>
                <span className="font-medium">{property.agentName}</span>
              </div>
            </div>
            <div className="h-2" /> {/* Spacer after header */}
          </>
        )}
        <>
          <DropdownMenuItem onSelect={handleShareClick}>
            <Upload className="h-4 w-4 text-muted-foreground" />
            Share property
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            Book a visit
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Phone className="h-4 w-4 text-muted-foreground" />
            Contact agent
          </DropdownMenuItem>
        </>
      </>
    );
  };

  return (
    <>
    <Card
      className={cn(
        "overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-lg bg-card min-w-0 w-full select-none",
        className
      )}
      onClick={onClick}
      onPointerEnter={(e) => {
        // Only show hover state for mouse and pen (stylus), not touch
        if (e.pointerType === 'mouse' || e.pointerType === 'pen') {
          setIsHovered(true);
        }
      }}
      onPointerLeave={() => setIsHovered(false)}
    >
      {/* Image Section - 3:2 aspect ratio is optimal for real estate listings */}
      <div 
        ref={imageContainerRef}
        className="relative aspect-[3/2] overflow-hidden bg-muted select-none"
        style={{ touchAction: images.length > 1 ? 'pan-y pinch-zoom' : undefined }}
      >
        {/* Top gradient overlay - only show when there are images */}
        {!hasNoImages && (
          <div className={cn(
            "absolute inset-x-0 top-0 h-24 bg-gradient-to-b to-transparent z-10 pointer-events-none",
            isAltStyle ? "from-black/80" : "from-black/60"
          )} />
        )}
        
        {/* Empty state for no images */}
        {hasNoImages ? (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <ImageOff className="w-12 h-12 text-muted-foreground/50" strokeWidth={1.5} />
          </div>
        ) : (
          /* Sliding images container - only render images near current index */
          <div 
            className="flex h-full transition-transform duration-300 ease-out select-none"
            style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
          >
            {images.map((image, index) => {
              // OPTIMIZATION: Only render images within ±1 of current index
              // This prevents loading all images at once
              const shouldRender = Math.abs(index - currentImageIndex) <= 1;
              
              return (
                <div key={index} className="w-full h-full flex-shrink-0 overflow-hidden">
                  {shouldRender ? (
                    <img
                      src={imageError ? "/placeholder.svg" : image}
                      alt={`${property.title} - ${index + 1}`}
                      className={cn(
                        "w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105 will-change-transform pointer-events-none",
                        isMyProperties && property.propertyStatus === 'draft' && "opacity-70",
                        isMyProperties && property.propertyStatus === 'delisted' && "grayscale opacity-60"
                      )}
                      style={{ imageRendering: 'auto' }}
                      draggable={false}
                      onError={() => setImageError(true)}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    // Placeholder for images not yet in view
                    <div className="w-full h-full bg-muted" />
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {/* Badges on top left */}
        <div className="absolute top-3 left-3 flex gap-2 z-20">
          {isMyProperties && property.propertyStatus ? (
            <>
              <PropertyStatusBadge status={property.propertyStatus} variant={hasNoImages ? 'default' : 'card'} />
              {showTimeTag && timeAgo && (
                <Badge className={cn(
                  "text-xs font-semibold px-3 py-1 border-0 transition-colors",
                  hasNoImages 
                    ? "bg-foreground/5 hover:bg-foreground/10 text-foreground"
                    : "bg-white/20 hover:bg-white/30 text-white"
                )}>
                  {timeAgo}
                </Badge>
              )}
            </>
          ) : (
            property.badges?.map((badge, index) => (
              <Badge 
                key={index}
                className={cn(
                  "font-semibold text-xs px-3 py-1 border-0 transition-colors",
                  hasNoImages
                    ? "bg-foreground/5 hover:bg-foreground/10 text-foreground"
                    : "text-white bg-white/20 hover:bg-white/30"
                )}
              >
                {badge}
              </Badge>
            ))
          )}
        </div>
        
        {/* 3-dot menu on top right */}
        <div className="absolute top-3 right-3 z-20">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "h-8 w-8 rounded-full",
                  hasNoImages 
                    ? "bg-foreground/5 hover:bg-foreground/10 text-foreground hover:text-foreground"
                    : "text-white hover:text-white bg-white/20 hover:bg-white/30"
                )}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card" onClick={(e) => e.stopPropagation()}>
              {renderMenuItems()}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Navigation arrows - visible on hover */}
        {images.length > 1 && isHovered && (
          <>
            <button
              type="button"
              onClick={handlePrevImage}
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full text-white z-20 flex items-center justify-center bg-[#FFFFFF66] select-none",
                currentImageIndex === 0 
                  ? "opacity-40 cursor-not-allowed" 
                  : "hover:bg-[#FFFFFF80] cursor-pointer"
              )}
            >
              <ChevronLeft className="h-4 w-4 pointer-events-none" />
            </button>
            <button
              type="button"
              onClick={handleNextImage}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full text-white z-20 flex items-center justify-center bg-[#FFFFFF66] select-none",
                currentImageIndex === images.length - 1 
                  ? "opacity-40 cursor-not-allowed" 
                  : "hover:bg-[#FFFFFF80] cursor-pointer"
              )}
            >
              <ChevronRight className="h-4 w-4 pointer-events-none" />
            </button>
          </>
        )}
        
        {/* Image carousel dots with sliding window */}
        {images.length > 1 && (
          (() => {
            const maxVisibleDots = 5;
            const totalImages = images.length;
            const dotWidth = 8; // w-2 = 0.5rem = 8px
            const dotGap = 6; // gap-1.5 = 0.375rem = 6px
            const dotWithGap = dotWidth + dotGap;
            
            // Calculate the container width to show only maxVisibleDots
            const visibleCount = Math.min(maxVisibleDots, totalImages);
            const containerWidth = visibleCount * dotWidth + (visibleCount - 1) * dotGap;
            
            // Add extra width to show partial dots at edges when there are more images
            const hasMoreBefore = totalImages > maxVisibleDots && currentImageIndex > Math.floor(maxVisibleDots / 2);
            const hasMoreAfter = totalImages > maxVisibleDots && currentImageIndex < totalImages - Math.floor(maxVisibleDots / 2) - 1;
            const partialDotWidth = 4; // Show half of a dot
            const extraWidth = (hasMoreBefore ? partialDotWidth : 0) + (hasMoreAfter ? partialDotWidth : 0);
            
            // Calculate window start to keep current dot centered when possible
            let windowStart = 0;
            if (totalImages > maxVisibleDots) {
              windowStart = Math.max(0, currentImageIndex - Math.floor(maxVisibleDots / 2));
              windowStart = Math.min(windowStart, totalImages - maxVisibleDots);
            }
            
            // Calculate the translation offset - adjust for partial dot visibility
            const translateX = -windowStart * dotWithGap + (hasMoreBefore ? partialDotWidth : 0);
            
            return (
              <div 
                className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 rounded-full px-2 py-1.5 bg-white/20 backdrop-blur-sm overflow-hidden"
                style={{ width: `${containerWidth + 16 + extraWidth}px` }} // +16 for px-2 padding (8px each side)
              >
                <div 
                  className="flex gap-1.5 transition-transform duration-300 ease-out"
                  style={{ transform: `translateX(${translateX}px)` }}
                >
                  {Array.from({ length: totalImages }).map((_, imageIndex) => (
                    <div
                      key={imageIndex}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all duration-200 flex-shrink-0",
                        imageIndex === currentImageIndex 
                          ? "bg-white" 
                          : "bg-white/40"
                      )}
                    />
                  ))}
                </div>
              </div>
            );
          })()
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Title row with timestamp */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-sm font-semibold leading-[100%] text-muted-foreground line-clamp-1 flex-1">
            {getPropertyTypeTitle()}
          </h3>
          {!isMyProperties && timeAgo && (
            <span className="text-xs font-normal leading-[120%] text-muted-foreground whitespace-nowrap">
              {timeAgo}
            </span>
          )}
        </div>
        
        {/* Price - only show if available */}
        {hasPrice && (
          <div className={cn("flex items-baseline gap-2 flex-nowrap", hasSpecs && "mb-3")}>
            <p className="text-xl font-semibold leading-heading text-foreground whitespace-nowrap">
              {formatPrice()}
            </p>
            {hasPriceDrop && (
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-base font-semibold leading-heading text-muted-foreground line-through">
                  {formatOriginalPrice()}
                </span>
                <span className="inline-flex items-center gap-0.5 text-xs font-semibold leading-heading text-tier-danger">
                  <ArrowDown className="h-3 w-3" />
                  -{getPriceDropPercentage()}%
                </span>
              </span>
            )}
          </div>
        )}
        
        {/* Specs row as pills - only show if any specs are available */}
        {hasSpecs && (
          <SpecPills
            bedrooms={property.bedrooms}
            bathrooms={property.bathrooms}
            size={formatSize() || undefined}
            sizeUnit=""
            variant="compact"
          />
        )}

        {/* Portal inquired footer */}
        {property.portalInquired && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center bg-card">
                <img 
                  src={
                    property.portalInquired.portal === 'idealista' ? idealistaLogo :
                    property.portalInquired.portal === 'fotocasa' ? fotocasaLogo :
                    pisosLogo
                  } 
                  alt={property.portalInquired.portal}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-sm font-normal leading-body text-foreground">Portal inquired</span>
            </div>
            <span className="text-sm font-normal leading-body text-muted-foreground">{property.portalInquired.timestamp}</span>
          </div>
        )}

        {/* Property saved footer (for opportunities variant without portal inquiry) */}
        {!property.portalInquired && property.propertySaved && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
            <span className="text-sm font-normal leading-body text-foreground">Property saved</span>
            <span className="text-sm font-normal leading-body text-muted-foreground">{property.propertySaved.timestamp}</span>
          </div>
        )}
        
        {/* Delist reason for delisted properties (my-properties variant only) */}
        {isMyProperties && property.propertyStatus === 'delisted' && property.delistReason && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-2">
              {property.delistReason === 'sold' ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-orange-600" />
              )}
              <span className="text-sm font-medium capitalize text-muted-foreground">
                {property.delistReason}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">{property.delistDate}</span>
          </div>
        )}
      </div>
    </Card>

    {/* Share Property Modal - outside Card to prevent click propagation */}
    <SharePropertyModal
      open={shareModalOpen}
      onOpenChange={setShareModalOpen}
      property={{
        id: property.id,
        title: property.title,
        image: images[0] || '/placeholder.svg',
        images: images,
      }}
    />
    </>
  );
}
