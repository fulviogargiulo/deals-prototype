import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import apartmentImage1 from "@/assets/apartment-la-latina-1.jpg";
import apartmentImage2 from "@/assets/apartment-la-latina-2.jpg";
import apartmentImage3 from "@/assets/apartment-la-latina-3.jpg";
import apartmentImage4 from "@/assets/apartment-la-latina-4.jpg";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PropertyStatus, DelistReason } from "@/types";
import { cn } from "@/lib/utils";
import { EmptyMyPropertiesState } from "@/components/properties/empty-my-properties-state";
import { MyPropertiesDevTool, MyPropertiesMode, AddPropertyViewMode, AddPropertyFlowMode } from "@/components/dev-tools/my-properties-dev-tool";
import { AddPropertyDialog } from "@/components/properties/add-property-dialog/add-property-dialog";
import { PropertyCard } from "@/components/properties/property-card";
import { useDevTools } from "@/contexts/dev-tools-context";
import { TrackedTitle } from "@/components/ui/tracked-title";
import { ContentSkeleton } from "@/components/ui/content-skeleton";
import { PageContainer } from "@/components/layout/page-container";


interface MyProperty {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  location: string;
  bedrooms?: number;
  bathrooms?: number;
  size?: number;
  images: string[];
  status: PropertyStatus;
  statusDate: string;
  delistReason?: DelistReason;
  delistDate?: string;
}

// Mock data aligned with mockOpportunities IDs 1-4 (agent's own properties)
const mockMyProperties: MyProperty[] = [
  {
    id: '1',
    title: 'Apartment for sale in Calle de Vallehermoso',
    price: 700000,
    originalPrice: 780000, // Price drop example
    location: 'Chamberí',
    bedrooms: 3,
    bathrooms: 2,
    size: 200,
    images: [apartmentImage1, apartmentImage2, apartmentImage3, apartmentImage4],
    status: 'published',
    statusDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    title: 'Penthouse for sale in Salamanca',
    price: 1200000,
    originalPrice: 1450000, // Price drop example
    location: 'Salamanca',
    bedrooms: 4,
    bathrooms: 3,
    size: 280,
    images: [apartmentImage2, apartmentImage3, apartmentImage4, apartmentImage1],
    status: 'published',
    statusDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    title: 'Villa for sale in Pozuelo',
    price: 950000,
    location: 'Pozuelo',
    bedrooms: 5,
    bathrooms: 4,
    size: 350,
    images: [apartmentImage3, apartmentImage4, apartmentImage1, apartmentImage2],
    status: 'in-review',
    statusDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    title: 'Luxury apartment for rent in Justicia',
    price: 3500,
    location: 'Justicia',
    bedrooms: 2,
    bathrooms: 2,
    size: 120,
    images: [apartmentImage4, apartmentImage1, apartmentImage2, apartmentImage3],
    status: 'published',
    statusDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '14',
    title: 'Cozy Studio in Malasaña',
    price: 280000,
    originalPrice: 320000, // Price drop example
    location: 'Malasaña',
    bedrooms: 1,
    bathrooms: 1,
    size: 55,
    images: [apartmentImage1, apartmentImage3],
    status: 'draft',
    statusDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '15',
    title: 'Family Home in Las Rozas',
    price: 650000,
    location: 'Las Rozas',
    bedrooms: 4,
    bathrooms: 3,
    size: 220,
    images: [apartmentImage2, apartmentImage4],
    status: 'delisted',
    statusDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    delistReason: 'sold',
    delistDate: '18 December 2025',
  },
  // Draft with NO PHOTOS - full specs and price
  {
    id: '16',
    title: 'New listing in Chamartín',
    price: 520000,
    location: 'Chamartín',
    bedrooms: 3,
    bathrooms: 2,
    size: 140,
    images: [], // No photos uploaded yet
    status: 'draft',
    statusDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // Draft with photos - complete data
  {
    id: '17',
    title: 'Duplex in Retiro',
    price: 890000,
    location: 'Retiro',
    bedrooms: 4,
    bathrooms: 3,
    size: 195,
    images: [apartmentImage4],
    status: 'draft',
    statusDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // Draft with NO PHOTOS, NO PRICE, NO SPECS - only title
  {
    id: '18',
    title: 'Apartment in Moncloa',
    price: 0, // Price not set yet
    location: 'Moncloa',
    images: [], // No photos uploaded yet
    status: 'draft',
    statusDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // Draft with NO PHOTOS, has price but NO SPECS
  {
    id: '21',
    title: 'Penthouse in Argüelles',
    price: 1200000,
    location: 'Argüelles',
    images: [], // No photos uploaded yet
    status: 'draft',
    statusDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // Draft with photos and specs but NO PRICE
  {
    id: '22',
    title: 'Apartment in Atocha',
    price: 0,
    location: 'Atocha',
    bedrooms: 2,
    bathrooms: 1,
    size: 75,
    images: [apartmentImage2],
    status: 'draft',
    statusDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // Draft with NO PHOTOS, has specs but NO PRICE
  {
    id: '23',
    title: 'Studio in Sol',
    price: 0,
    location: 'Sol',
    bedrooms: 0, // Studio
    bathrooms: 1,
    size: 35,
    images: [],
    status: 'draft',
    statusDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // Draft with photos, price, but only bedrooms (no bathroom/size)
  {
    id: '24',
    title: 'Flat in Chueca',
    price: 450000,
    location: 'Chueca',
    bedrooms: 2,
    images: [apartmentImage1, apartmentImage4],
    status: 'draft',
    statusDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '19',
    title: 'Loft in Lavapiés',
    price: 380000,
    location: 'Lavapiés',
    bedrooms: 2,
    bathrooms: 1,
    size: 85,
    images: [apartmentImage1],
    status: 'rejected',
    statusDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '20',
    title: 'Townhouse in Majadahonda',
    price: 720000,
    location: 'Majadahonda',
    bedrooms: 5,
    bathrooms: 3,
    size: 280,
    images: [apartmentImage3, apartmentImage2],
    status: 'delisted',
    statusDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    delistReason: 'lost',
    delistDate: '5 December 2025',
  },
];

const getStatusConfig = (status: PropertyStatus) => {
  switch (status) {
    case 'published': return { label: 'Published' };
    case 'in-review': return { label: 'In review' };
    case 'draft': return { label: 'Draft' };
    case 'rejected': return { label: 'Rejected' };
    case 'delisted': return { label: 'Delisted' };
  }
};

export function MyPropertiesList() {
  const navigate = useNavigate();
  const { loadingDelay, showSubtitles, skeletonTargets } = useDevTools();
  const [statusFilter, setStatusFilter] = useState<PropertyStatus>('published');
  const [mode, setMode] = useState<MyPropertiesMode>('default');
  const [addPropertyViewMode, setAddPropertyViewMode] = useState<AddPropertyViewMode>('modal');
  const [addPropertyFlowMode, setAddPropertyFlowMode] = useState<AddPropertyFlowMode>('with-continue');
  const [showAddPropertyDialog, setShowAddPropertyDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [contentKey, setContentKey] = useState(0);

  // Trigger loading when filters change
  useEffect(() => {
    if (loadingDelay > 0) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
        setContentKey(prev => prev + 1);
      }, loadingDelay);
      return () => clearTimeout(timer);
    } else {
      setContentKey(prev => prev + 1);
    }
  }, [statusFilter, loadingDelay]);

  // Determine which mock data to use based on dev tool mode
  const getPropertiesForMode = (): MyProperty[] => {
    if (mode === 'empty') {
      return [];
    }
    if (mode === 'many') {
      // Generate many properties for testing
      return Array.from({ length: 30 }, (_, i) => ({
        id: `${i + 1}`,
        title: `Property ${i + 1} for sale`,
        price: 300000 + (i * 50000),
        location: ['Salamanca', 'Chamberí', 'Retiro', 'Centro'][i % 4],
        bedrooms: 2 + (i % 3),
        bathrooms: 1 + (i % 2),
        size: 100 + (i * 10),
        images: [apartmentImage1, apartmentImage2],
        status: (['published', 'in-review', 'draft', 'rejected', 'delisted'] as PropertyStatus[])[i % 5],
        statusDate: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        ...(i % 5 === 4 && {
          delistReason: (i % 2 === 0 ? 'sold' : 'lost') as DelistReason,
          delistDate: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        }),
      }));
    }
    return mockMyProperties;
  };

  const displayedProperties = getPropertiesForMode();

  const filteredProperties = displayedProperties.filter(
    (property) => property.status === statusFilter
  );

  const getStatusCount = (status: PropertyStatus) => {
    return displayedProperties.filter((p) => p.status === status).length;
  };


  // Show empty state if there are no properties at all
  if (displayedProperties.length === 0) {
    return (
      <PageContainer>
        {/* Invisible tracking sentinel for global header */}
        <TrackedTitle title="My properties">
          <div className="h-px w-full" aria-hidden="true" />
        </TrackedTitle>
        
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-semibold">My properties</h1>
            </div>
            <Button onClick={() => setShowAddPropertyDialog(true)}>
              + New
            </Button>
          </div>
          <EmptyMyPropertiesState onAddProperty={() => setShowAddPropertyDialog(true)} />
        <MyPropertiesDevTool 
          mode={mode} 
          setMode={setMode} 
          addPropertyViewMode={addPropertyViewMode}
          setAddPropertyViewMode={setAddPropertyViewMode}
          addPropertyFlowMode={addPropertyFlowMode}
          setAddPropertyFlowMode={setAddPropertyFlowMode}
        />
        <AddPropertyDialog 
          open={showAddPropertyDialog} 
          onOpenChange={setShowAddPropertyDialog} 
          autoAdvance={addPropertyFlowMode === 'auto-advance'}
        />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Invisible tracking sentinel for global header */}
      <TrackedTitle title="My properties">
        <div className="h-px w-full" aria-hidden="true" />
      </TrackedTitle>
      
      <div className="space-y-6">
        <div className="flex justify-between items-center animate-fade-in-fast">
          <div>
            <h1 className="text-3xl font-semibold">My properties</h1>
            {showSubtitles && <p className="text-muted-foreground">Manage your property listings</p>}
          </div>
          <Button onClick={() => setShowAddPropertyDialog(true)}>
            + New
          </Button>
        </div>

        {/* Status Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 animate-fade-in-fast">
          {(['published', 'in-review', 'draft', 'rejected', 'delisted'] as PropertyStatus[]).map(
            (status) => {
            const count = getStatusCount(status);
            const config = getStatusConfig(status);
            const isActive = statusFilter === status;

            return (
              <Button
                key={status}
                variant={isActive ? 'default' : 'outline'}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "shrink-0 gap-2",
                  isActive 
                    ? "bg-foreground text-background hover:bg-foreground/90"
                    : "bg-card"
                )}
              >
                {config.label}
                <Badge
                  variant="secondary"
                  className={cn(
                    "ml-1 h-5 min-w-5 px-1.5 text-xs flex items-center justify-center leading-none rounded-full",
                    isActive
                      ? "text-background"
                      : "bg-muted text-muted-foreground"
                  )}
                  style={isActive ? { backgroundColor: '#666666' } : undefined}
                >
                  {count}
                </Badge>
              </Button>
            );
          }
        )}
      </div>

      {/* Properties Grid */}
      {isLoading && skeletonTargets.myProperties ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 overflow-hidden">
          <ContentSkeleton variant="property-card" count={8} />
        </div>
      ) : (
        <div key={contentKey} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-fade-in overflow-hidden">
          {filteredProperties.map((property) => (
              <PropertyCard 
                key={property.id}
                variant="my-properties"
                property={{
                  ...property,
                  price: property.price,
                  originalPrice: property.originalPrice,
                  propertyStatus: property.status,
              }}
              onClick={() => navigate(`/my-properties/${property.id}`)}
            />
          ))}
        </div>
      )}

      {!isLoading && filteredProperties.length === 0 && (
        <div className="text-center py-12 animate-fade-in">
          <p className="text-muted-foreground">
            No properties found with status "{getStatusConfig(statusFilter).label}"
          </p>
        </div>
      )}

      <MyPropertiesDevTool 
        mode={mode} 
        setMode={setMode} 
        addPropertyViewMode={addPropertyViewMode}
        setAddPropertyViewMode={setAddPropertyViewMode}
        addPropertyFlowMode={addPropertyFlowMode}
        setAddPropertyFlowMode={setAddPropertyFlowMode}
      />
      <AddPropertyDialog 
        open={showAddPropertyDialog} 
        onOpenChange={setShowAddPropertyDialog} 
        autoAdvance={addPropertyFlowMode === 'auto-advance'}
      />
      </div>
    </PageContainer>
  );
}
