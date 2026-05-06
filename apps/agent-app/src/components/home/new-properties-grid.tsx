import { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PropertyCard } from "@/components/properties/property-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
import apartmentLatina1 from "@/assets/apartment-la-latina-1.jpg";
import apartmentLatina2 from "@/assets/apartment-la-latina-2.jpg";

import { ArrowRight } from "lucide-react";

export type PropertiesLayoutMode = 'grid' | 'carousel' | 'featured' | 'compact';
export type ViewAllMode = 'header' | 'card';

const mockProperties = [
  {
    id: 'new-1',
    title: 'Apartment in Chamberí',
    images: [propertyInterior1, propertyInterior2],
    price: 520000,
    bedrooms: 3,
    bathrooms: 2,
    size: 145,
    sizeUnit: 'm²',
    location: 'Chamberí, Madrid',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    agentName: 'María García',
  },
  {
    id: 'new-2',
    title: 'Penthouse in Salamanca',
    images: [propertyPenthouse1, propertyPenthouse2],
    price: 1250000,
    bedrooms: 4,
    bathrooms: 3,
    size: 280,
    sizeUnit: 'm²',
    location: 'Salamanca, Madrid',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    agentName: 'Carlos Ruiz',
  },
  {
    id: 'new-3',
    title: 'Villa in Pozuelo',
    images: [propertyVilla1, propertyVilla2],
    price: 890000,
    bedrooms: 5,
    bathrooms: 4,
    size: 350,
    sizeUnit: 'm²',
    location: 'Pozuelo, Madrid',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    agentName: 'Ana Martínez',
  },
  {
    id: 'new-4',
    title: 'Modern Loft in Malasaña',
    images: [propertyModern1, propertyModern2],
    price: 385000,
    bedrooms: 2,
    bathrooms: 1,
    size: 95,
    sizeUnit: 'm²',
    location: 'Malasaña, Madrid',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    agentName: 'Pedro Sánchez',
  },
  {
    id: 'new-5',
    title: 'Studio in Retiro',
    images: [propertyStudio1, propertyStudio2],
    price: 295000,
    bedrooms: 1,
    bathrooms: 1,
    size: 48,
    sizeUnit: 'm²',
    location: 'Retiro, Madrid',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    agentName: 'Laura Fernández',
  },
  {
    id: 'new-6',
    title: 'Luxury Flat in Chamartín',
    images: [propertyLuxury1, propertyLuxury2],
    price: 750000,
    bedrooms: 3,
    bathrooms: 2,
    size: 190,
    sizeUnit: 'm²',
    location: 'Chamartín, Madrid',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    agentName: 'Diego López',
  },
  {
    id: 'new-7',
    title: 'Duplex in La Latina',
    images: [propertyInterior2, propertyModern1],
    price: 620000,
    bedrooms: 4,
    bathrooms: 2,
    size: 210,
    sizeUnit: 'm²',
    location: 'La Latina, Madrid',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    agentName: 'Isabel Torres',
  },
  {
    id: 'new-8',
    title: 'Bright Apartment in Chueca',
    images: [propertyPenthouse2, propertyLuxury1],
    price: 445000,
    bedrooms: 2,
    bathrooms: 1,
    size: 110,
    sizeUnit: 'm²',
    location: 'Chueca, Madrid',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    agentName: 'Miguel Ángel',
  },
  {
    id: 'new-9',
    title: 'Elegant Flat in Sol',
    images: [propertyVilla2, propertyStudio1],
    price: 510000,
    bedrooms: 3,
    bathrooms: 2,
    size: 130,
    sizeUnit: 'm²',
    location: 'Sol, Madrid',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    agentName: 'Sofía Navarro',
  },
];

interface NewPropertiesGridProps {
  layoutMode?: PropertiesLayoutMode;
  viewAllMode?: ViewAllMode;
  isEmpty?: boolean;
}

function SectionHeader({ showViewAll }: { showViewAll: boolean }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-semibold text-foreground">New in Madrid</h2>
      {showViewAll && (
        <button
          onClick={() => navigate('/properties')}
          className="text-sm font-semibold text-fg-secondary hover:text-foreground transition-colors flex items-center gap-1"
        >
          View all <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

/* ===== View All Card ===== */
function ViewAllCard() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate('/properties')}
      className="rounded-2xl border-2 border-dashed border-border-ds-primary flex flex-col items-center justify-center gap-3 min-h-[200px] hover:bg-surface-ds-raised transition-colors group"
    >
      <div className="w-10 h-10 rounded-full bg-surface-ds-raised flex items-center justify-center group-hover:bg-surface-ds-widget transition-colors">
        <ArrowRight className="h-5 w-5 text-fg-secondary" />
      </div>
      <span className="text-sm font-semibold text-fg-secondary">View all properties</span>
    </button>
  );
}

/* ===== Layout A: Grid (original) ===== */
function GridLayout({ showViewAllCard }: { showViewAllCard: boolean }) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(mockProperties.length);

  const maxProperties = 8;

  const calculateVisibleCount = useCallback(() => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.offsetWidth;
    const gap = 20; // gap-5 = 20px
    const minCardWidth = 240;
    const cols = Math.floor((containerWidth + gap) / (minCardWidth + gap));
    if (cols <= 1) {
      setVisibleCount(maxProperties);
      return;
    }
    const availableSlots = showViewAllCard ? maxProperties + 1 : maxProperties;
    const completeRows = Math.floor(availableSlots / cols);
    const slotsToShow = completeRows * cols;
    const propertySlots = showViewAllCard ? Math.max(slotsToShow - 1, 0) : slotsToShow;
    setVisibleCount(Math.min(Math.max(propertySlots, cols), maxProperties));
  }, [showViewAllCard]);

  useEffect(() => {
    calculateVisibleCount();
    const observer = new ResizeObserver(() => calculateVisibleCount());
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [calculateVisibleCount]);

  return (
    <div ref={containerRef} className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
      {mockProperties.slice(0, visibleCount).map((property) => (
        <PropertyCard
          key={property.id}
          property={property}
          variant="search"
          onClick={() => navigate(`/properties/${property.id}`)}
        />
      ))}
      {showViewAllCard && <ViewAllCard />}
    </div>
  );
}

/* ===== Layout B: Horizontal Carousel ===== */
function CarouselLayout() {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="relative group">
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
        style={{
          maskImage: 'linear-gradient(to right, black calc(100% - 48px), transparent)',
        }}
      >
        {mockProperties.map((property) => (
          <div key={property.id} className="flex-shrink-0 w-[260px]">
            <PropertyCard
              property={property}
              variant="search"
              onClick={() => navigate(`/properties/${property.id}`)}
            />
          </div>
        ))}
      </div>
      {/* Nav buttons */}
      <Button
        variant="outline"
        size="icon"
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 h-9 w-9 rounded-full bg-background shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
        onClick={() => scroll('left')}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 h-9 w-9 rounded-full bg-background shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
        onClick={() => scroll('right')}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

/* ===== Layout C: Featured + Grid (Bento) ===== */
function FeaturedLayout({ showViewAllCard }: { showViewAllCard: boolean }) {
  const navigate = useNavigate();
  const [featured, ...rest] = mockProperties;

  const formatPrice = (price: number) => `€${price.toLocaleString()}`;

  return (
    <div className="space-y-5">
      {/* Bento grid: hero left (tall) + 2x2 right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 auto-rows-auto">
        {/* Hero card — spans 2 rows on desktop */}
        <button
          onClick={() => navigate(`/properties/${featured.id}`)}
          className="lg:col-span-1 lg:row-span-2 relative rounded-2xl overflow-hidden group text-left min-h-[320px] lg:min-h-0"
        >
          <img
            src={featured.images[0]}
            alt={featured.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/70 mb-1">Featured</p>
            <h3 className="text-xl font-semibold leading-heading">{featured.title}</h3>
            <p className="text-sm text-white/70 mt-1">{featured.location}</p>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-lg font-semibold">{formatPrice(featured.price)}</span>
              <span className="text-xs text-white/60">{featured.bedrooms} bd · {featured.size} {featured.sizeUnit}</span>
            </div>
          </div>
        </button>

        {/* 4 smaller cards in a 2x2 sub-grid */}
        {rest.slice(0, 4).map((property) => (
          <button
            key={property.id}
            onClick={() => navigate(`/properties/${property.id}`)}
            className="relative rounded-2xl overflow-hidden group text-left min-h-[160px]"
          >
            <img
              src={property.images[0]}
              alt={property.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              <h3 className="text-sm font-semibold leading-heading truncate">{property.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-semibold">{formatPrice(property.price)}</span>
                <span className="text-xs text-white/60">{property.bedrooms} bd · {property.size} {property.sizeUnit}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Remaining in standard grid */}
      {(rest.length > 4 || showViewAllCard) && (
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
          {rest.slice(4).map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              variant="search"
              onClick={() => navigate(`/properties/${property.id}`)}
            />
          ))}
          {showViewAllCard && <ViewAllCard />}
        </div>
      )}
    </div>
  );
}

/* ===== Layout D: Compact List ===== */
function CompactLayout({ showViewAllCard }: { showViewAllCard: boolean }) {
  const navigate = useNavigate();

  const formatPrice = (price: number) => `€${price.toLocaleString()}`;

  return (
    <div className="space-y-2">
      {mockProperties.map((property) => (
        <button
          key={property.id}
          onClick={() => navigate(`/properties/${property.id}`)}
          className="w-full flex items-center gap-4 p-3 rounded-xl bg-surface-ds-widget hover:bg-surface-ds-raised transition-colors text-left"
        >
          {/* Thumbnail */}
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
          />
          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{property.title}</p>
            <p className="text-xs text-fg-secondary mt-0.5">{property.location}</p>
          </div>
          {/* Specs */}
          <div className="hidden sm:flex items-center gap-3 text-xs text-fg-secondary flex-shrink-0">
            {property.bedrooms && <span>{property.bedrooms} bd</span>}
            {property.size && <span>{property.size} {property.sizeUnit}</span>}
          </div>
          {/* Price */}
          <div className="text-sm font-semibold text-foreground flex-shrink-0">
            {formatPrice(property.price)}
          </div>
        </button>
      ))}
      {showViewAllCard && (
        <button
          onClick={() => navigate('/properties')}
          className="w-full flex items-center justify-center gap-3 p-3 rounded-xl border-2 border-dashed border-border-ds-primary hover:bg-surface-ds-raised transition-colors"
        >
          <ArrowRight className="h-4 w-4 text-fg-secondary" />
          <span className="text-sm font-semibold text-fg-secondary">View all properties</span>
        </button>
      )}
    </div>
  );
}

export function NewPropertiesGrid({ layoutMode = 'grid', viewAllMode = 'header', isEmpty = false }: NewPropertiesGridProps) {
  const navigate = useNavigate();
  const showViewAllCard = viewAllMode === 'card';

  if (isEmpty) {
    return (
      <div className="space-y-4 pb-6">
        <SectionHeader showViewAll={false} />
        <button
          onClick={() => navigate('/properties')}
          className="w-full rounded-2xl border-2 border-dashed border-border-ds-primary flex flex-col items-center justify-center gap-2 py-12 hover:bg-surface-ds-raised transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-surface-ds-raised flex items-center justify-center group-hover:bg-surface-ds-widget transition-colors">
            <ArrowRight className="h-5 w-5 text-fg-secondary" />
          </div>
          <p className="text-base font-semibold text-foreground">No new properties</p>
          <p className="text-sm text-fg-secondary">Browse all available properties in your area</p>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      <SectionHeader showViewAll={viewAllMode === 'header'} />
      {layoutMode === 'grid' && <GridLayout showViewAllCard={showViewAllCard} />}
      {layoutMode === 'carousel' && <CarouselLayout />}
      {layoutMode === 'featured' && <FeaturedLayout showViewAllCard={showViewAllCard} />}
      {layoutMode === 'compact' && <CompactLayout showViewAllCard={showViewAllCard} />}
    </div>
  );
}
