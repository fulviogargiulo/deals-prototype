import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  MoreHorizontal, 
  Copy, 
  CheckCircle2, 
  Circle,
  Pencil,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Camera,
  ChevronDown,
  Phone,
  MessageCircle,
  User,
  ArrowLeftRight,
  Settings,
  Lock,
  AlertCircle,
  Calendar,
  Loader2,
  Clock,
  ChevronRight,
  X
} from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { FullscreenGallery } from "@/components/ui/fullscreen-gallery";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useDevTools } from "@/contexts/dev-tools-context";
import { SwapClientModal } from "@/components/modals/swap-client-modal";
import { DelistPropertyModal } from "@/components/modals/delist-property-modal";
import { EditPropertyTypeModal } from "@/components/modals/edit-property-type-modal";
import { EditAddressModal } from "@/components/modals/edit-address-modal";
import { EditPriceModal } from "@/components/modals/edit-price-modal";
import { EditDescriptionModal } from "@/components/modals/edit-description-modal";
import { EditFeaturesModal } from "@/components/modals/edit-features-modal";
import { EditAdditionalInfoModal } from "@/components/modals/edit-additional-info-modal";
import { EditDocumentsModal } from "@/components/modals/edit-documents-modal";
import { EditListingPortalsModal } from "@/components/modals/edit-listing-portals-modal";
import { PublishSuccessModal } from "@/components/modals/publish-success-modal";
import { PropertyRejectedModal } from "@/components/modals/property-rejected-modal";
import { SharePropertyModal } from "@/components/modals/share-property-modal";
import { OpportunityIcon } from "@/components/opportunities/opportunity-icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Trash2, AlertTriangle, Upload } from "lucide-react";
import { PropertyStatusBadge } from "@/components/ui/property-status-badge";
import { ReferenceCodeBadge } from "@/components/ui/reference-code-badge";
import { TrackedTitle } from "@/components/ui/tracked-title";
import { MyPropertyDetailsDevTool, PropertyDetailsDevConfig } from "@/components/dev-tools/my-property-details-dev-tool";
import { MockAddress } from "@/lib/mock-addresses";
import apartmentImage from "@/assets/apartment-la-latina-1.jpg";
import apartmentImage2 from "@/assets/apartment-la-latina-2.jpg";
import apartmentImage3 from "@/assets/apartment-la-latina-3.jpg";
import apartmentImage4 from "@/assets/apartment-la-latina-4.jpg";

// Portal logos
import idealistaLogo from "@/assets/idealista-logo.png";
import fotocasaLogo from "@/assets/fotocasa-logo-new.png";
import pisosLogo from "@/assets/pisos-logo.png";
import luxuryEstateLogo from "@/assets/luxury-estate-logo.png";
import jamesEditionLogo from "@/assets/james-edition-logo.png";
import properstarLogo from "@/assets/properstar-logo.png";
import huspyLogo from "@/assets/huspy-logo.png";

// Portal logo mapping
const portalLogos: Record<string, string> = {
  'Idealista': idealistaLogo,
  'Fotocasa': fotocasaLogo,
  'Pisos.com': pisosLogo,
  'Habitaclia': pisosLogo, // Using pisos as fallback
  'Luxury Estate': luxuryEstateLogo,
  'JamesEdition': jamesEditionLogo,
  'Properstar': properstarLogo,
  'Huspy': huspyLogo,
};

// Types for the property data
interface MyPropertyData {
  id: string;
  referenceCode: string;
  status: 'draft' | 'in-review' | 'published' | 'rejected' | 'delisted';
  statusDate: string;
  title: string;
  clientName: string;
  clientId: string;
  clientPhone: string;
  intent: 'sale' | 'rental';
  
  photos: string[];
  requestProfessionalPhotos: boolean;
  propertyType: string | null;
  address: {
    street: string;
    city: string;
    visibility: 'street-only' | 'full' | 'hidden';
  } | null;
  pricing: {
    price: number;
    currency: string;
    communityFees?: number;
    ibi?: number;
    contractType?: string;
  } | null;
  description: {
    translations: { text: string; language: string; flag: string }[];
  } | null;
  features: {
    size?: number;
    usableSize?: number;
    bedrooms?: number;
    bathrooms?: number;
    condition?: string;
    occupancyStatus?: string;
  } | null;
  additionalInfo: {
    exposure?: {
      view?: string;
      orientation?: string;
    };
    buildAndFinish?: {
      constructionYear?: number;
      renovationYear?: number;
      furnished?: string;
    };
    propertyAmenities?: string[];
    parkingIncluded?: boolean;
    parkingPrice?: number;
    heatingType?: string;
    buildingAmenities?: string[];
    energyCertificate?: {
      consumptionType?: string;
      consumption?: number;
      emissionsType?: string;
      emissions?: number;
    };
  } | null;
  documents: { name: string; type: string }[];
  listingPortals: { name: string; enabled: boolean }[];
}

// Mock properties data aligned with MyPropertiesList
const mockMyPropertiesData: Record<string, MyPropertyData> = {
  '1': {
    id: '1',
    referenceCode: 'ARP1F3',
    status: 'published',
    statusDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    title: 'Apartment for sale in Calle de Vallehermoso',
    clientName: 'Michael Scott',
    clientId: '1',
    clientPhone: '+34 612 345 678',
    intent: 'sale',
    photos: [apartmentImage, apartmentImage2, apartmentImage3, apartmentImage4],
    requestProfessionalPhotos: false,
    propertyType: 'Apartment',
    address: {
      street: 'Calle de Vallehermoso 34, 2º C',
      city: '28003 Madrid',
      visibility: 'street-only',
    },
    pricing: {
      price: 700000,
      currency: '€',
      communityFees: 120,
      ibi: 200,
    },
    description: {
      translations: [
        { text: 'Luminoso apartamento de 3 dormitorios con dos baños completos, cocina moderna totalmente equipada y amplio balcón con vistas despejadas en el prestigioso barrio de Chamberí.', language: 'Spanish', flag: '🇪🇸' },
        { text: 'Bright 3-bedroom apartment with two full bathrooms, fully equipped modern kitchen and spacious balcony with unobstructed views in the prestigious Chamberí neighborhood.', language: 'English', flag: '🇬🇧' }
      ],
    },
    features: { size: 200, usableSize: 145, bedrooms: 3, bathrooms: 2, condition: 'Good', occupancyStatus: 'Vacant' },
    additionalInfo: {
      exposure: { view: 'Exterior facing', orientation: 'South' },
      buildAndFinish: { constructionYear: 1995, renovationYear: 2018, furnished: 'Furnished' },
      propertyAmenities: ['Air conditioning', 'Equipped kitchen', 'Built-in wardrobes', 'Terrace', 'Storage room'],
      parkingIncluded: false, parkingPrice: 35000, heatingType: 'Heat and cold pump',
      buildingAmenities: ['Elevator', 'Accessible housing', 'Concierge', 'Doorman'],
      energyCertificate: { consumptionType: 'E', consumption: 153, emissionsType: 'E', emissions: 35 },
    },
    documents: [{ name: 'Nota simple', type: 'pdf' }, { name: 'Floor plan', type: 'pdf' }],
    listingPortals: [
      { name: 'Idealista', enabled: true }, { name: 'Fotocasa', enabled: true },
      { name: 'Pisos.com', enabled: true }, { name: 'Luxury Estate', enabled: true },
    ],
  },
  '2': {
    id: '2',
    referenceCode: 'PHS2A1',
    status: 'published',
    statusDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    title: 'Penthouse for sale in Salamanca',
    clientName: 'Pam Beasly',
    clientId: '4',
    clientPhone: '+1 555 345 6789',
    intent: 'sale',
    photos: [apartmentImage2, apartmentImage3, apartmentImage4, apartmentImage],
    requestProfessionalPhotos: false,
    propertyType: 'Penthouse',
    address: {
      street: 'Calle de Serrano 45, Ático',
      city: '28001 Madrid',
      visibility: 'full',
    },
    pricing: {
      price: 1200000,
      currency: '€',
      communityFees: 250,
      ibi: 450,
    },
    description: {
      translations: [
        { text: 'Espectacular ático con terraza privada y vistas panorámicas de Madrid. Completamente renovado con acabados de alta gama.', language: 'Spanish', flag: '🇪🇸' },
        { text: 'Spectacular penthouse with private terrace and panoramic views of Madrid. Fully renovated with high-end finishes.', language: 'English', flag: '🇬🇧' }
      ],
    },
    features: { size: 280, usableSize: 220, bedrooms: 4, bathrooms: 3, condition: 'Excellent', occupancyStatus: 'Vacant' },
    additionalInfo: {
      exposure: { view: 'Panoramic', orientation: 'South-West' },
      buildAndFinish: { constructionYear: 2010, renovationYear: 2022, furnished: 'Unfurnished' },
      propertyAmenities: ['Air conditioning', 'Equipped kitchen', 'Private terrace', 'Wine cellar'],
      parkingIncluded: true, heatingType: 'Radiant floor',
      buildingAmenities: ['Elevator', 'Concierge', '24h Security', 'Gym'],
      energyCertificate: { consumptionType: 'B', consumption: 45, emissionsType: 'B', emissions: 12 },
    },
    documents: [{ name: 'Nota simple', type: 'pdf' }, { name: 'Floor plan', type: 'pdf' }],
    listingPortals: [
      { name: 'Idealista', enabled: true }, { name: 'Luxury Estate', enabled: true },
      { name: 'JamesEdition', enabled: true },
    ],
  },
  '3': {
    id: '3',
    referenceCode: 'VLP3B2',
    status: 'in-review',
    statusDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    title: 'Villa for sale in Pozuelo',
    clientName: 'Kevin Malone',
    clientId: '5',
    clientPhone: '+1 555 456 7890',
    intent: 'sale',
    photos: [apartmentImage3, apartmentImage4, apartmentImage, apartmentImage2],
    requestProfessionalPhotos: false,
    propertyType: 'Villa',
    address: {
      street: 'Urbanización Somosaguas 12',
      city: '28223 Pozuelo de Alarcón',
      visibility: 'street-only',
    },
    pricing: {
      price: 950000,
      currency: '€',
      communityFees: 0,
      ibi: 800,
    },
    description: {
      translations: [
        { text: 'Hermosa villa independiente con jardín privado y piscina. Perfecta para familias que buscan espacio y tranquilidad.', language: 'Spanish', flag: '🇪🇸' },
        { text: 'Beautiful detached villa with private garden and pool. Perfect for families looking for space and tranquility.', language: 'English', flag: '🇬🇧' }
      ],
    },
    features: { size: 350, usableSize: 300, bedrooms: 5, bathrooms: 4, condition: 'Good', occupancyStatus: 'Occupied' },
    additionalInfo: {
      exposure: { view: 'Garden', orientation: 'South' },
      buildAndFinish: { constructionYear: 2005, renovationYear: 2020, furnished: 'Partially furnished' },
      propertyAmenities: ['Air conditioning', 'Private pool', 'Garden', 'Garage', 'BBQ area'],
      parkingIncluded: true, heatingType: 'Gas boiler',
      buildingAmenities: [],
      energyCertificate: { consumptionType: 'D', consumption: 120, emissionsType: 'D', emissions: 28 },
    },
    documents: [{ name: 'Nota simple', type: 'pdf' }],
    listingPortals: [
      { name: 'Idealista', enabled: true }, { name: 'Fotocasa', enabled: true },
    ],
  },
  '4': {
    id: '4',
    referenceCode: 'LXJ4C3',
    status: 'published',
    statusDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    title: 'Luxury apartment for rent in Justicia',
    clientName: 'Stanley Hudson',
    clientId: '6',
    clientPhone: '+1 555 567 8901',
    intent: 'rental',
    photos: [apartmentImage4, apartmentImage, apartmentImage2, apartmentImage3],
    requestProfessionalPhotos: false,
    propertyType: 'Apartment',
    address: {
      street: 'Calle de Barquillo 22, 3º D',
      city: '28004 Madrid',
      visibility: 'full',
    },
    pricing: {
      price: 3500,
      currency: '€',
      contractType: 'Monthly',
    },
    description: {
      translations: [
        { text: 'Elegante apartamento totalmente amueblado en el corazón de Justicia. Perfecto para profesionales o expatriados.', language: 'Spanish', flag: '🇪🇸' },
        { text: 'Elegant fully furnished apartment in the heart of Justicia. Perfect for professionals or expats.', language: 'English', flag: '🇬🇧' }
      ],
    },
    features: { size: 120, usableSize: 100, bedrooms: 2, bathrooms: 2, condition: 'Excellent', occupancyStatus: 'Vacant' },
    additionalInfo: {
      exposure: { view: 'Street', orientation: 'East' },
      buildAndFinish: { constructionYear: 1920, renovationYear: 2021, furnished: 'Fully furnished' },
      propertyAmenities: ['Air conditioning', 'Equipped kitchen', 'Washing machine', 'Dishwasher'],
      parkingIncluded: false, heatingType: 'Central heating',
      buildingAmenities: ['Elevator', 'Classic facade'],
      energyCertificate: { consumptionType: 'C', consumption: 85, emissionsType: 'C', emissions: 20 },
    },
    documents: [{ name: 'Energy certificate', type: 'pdf' }],
    listingPortals: [
      { name: 'Idealista', enabled: true }, { name: 'Fotocasa', enabled: true },
    ],
  },
  '14': {
    id: '14',
    referenceCode: 'STM14D',
    status: 'draft',
    statusDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    title: 'Cozy Studio in Malasaña',
    clientName: 'Michael Scott',
    clientId: '1',
    clientPhone: '+1 555 123 4567',
    intent: 'sale',
    photos: [apartmentImage, apartmentImage3],
    requestProfessionalPhotos: true,
    propertyType: 'Studio',
    address: {
      street: 'Calle de Velarde 8, 1º A',
      city: '28004 Madrid',
      visibility: 'street-only',
    },
    pricing: {
      price: 280000,
      currency: '€',
    },
    description: null,
    features: { size: 55, bedrooms: 1, bathrooms: 1 },
    additionalInfo: null,
    documents: [],
    listingPortals: [],
  },
  '15': {
    id: '15',
    referenceCode: 'FHR15E',
    status: 'delisted',
    statusDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    title: 'Family Home in Las Rozas',
    clientName: 'Jim Halpert',
    clientId: '2',
    clientPhone: '+1 555 234 5678',
    intent: 'sale',
    photos: [apartmentImage2, apartmentImage4],
    requestProfessionalPhotos: false,
    propertyType: 'Detached House',
    address: {
      street: 'Calle del Pinar 15',
      city: '28231 Las Rozas',
      visibility: 'full',
    },
    pricing: {
      price: 650000,
      currency: '€',
      communityFees: 50,
      ibi: 600,
    },
    description: {
      translations: [
        { text: 'Casa familiar en urbanización tranquila con jardín y piscina comunitaria.', language: 'Spanish', flag: '🇪🇸' },
        { text: 'Family home in quiet residential area with garden and community pool.', language: 'English', flag: '🇬🇧' }
      ],
    },
    features: { size: 220, usableSize: 180, bedrooms: 4, bathrooms: 3, condition: 'Good', occupancyStatus: 'Vacant' },
    additionalInfo: {
      exposure: { view: 'Garden', orientation: 'South' },
      buildAndFinish: { constructionYear: 2000, furnished: 'Unfurnished' },
      propertyAmenities: ['Air conditioning', 'Garden', 'Garage'],
      parkingIncluded: true, heatingType: 'Gas boiler',
      buildingAmenities: ['Community pool', 'Playground'],
      energyCertificate: { consumptionType: 'D', consumption: 110, emissionsType: 'D', emissions: 25 },
    },
    documents: [{ name: 'Nota simple', type: 'pdf' }],
    listingPortals: [],
  },
};

// Default fallback property
const defaultProperty = mockMyPropertiesData['1'];


const formatTimeAgo = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return '1 day ago';
  return `${diffInDays} days ago`;
};

interface SectionHeaderProps {
  title: string;
  isComplete: boolean;
  onEdit: () => void;
  disabled?: boolean;
  isRequired?: boolean;
  isInReview?: boolean;
}

function SectionHeader({ title, isComplete, onEdit, disabled, isRequired = false, isInReview = false }: SectionHeaderProps) {
  const tooltipMessage = isInReview 
    ? "This field cannot be edited while the property is under review"
    : "This field cannot be edited after the property is published";

  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        {isComplete ? (
          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
        ) : isRequired ? (
          <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
        ) : (
          <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
        )}
        <h3 className="font-semibold text-sm">{title}</h3>
        {disabled && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full cursor-help">
                <Lock className="w-3 h-3" />
                Locked
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{tooltipMessage}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      {!disabled && (
        <Button variant="ghost" size="icon" onClick={onEdit} className="h-7 w-7">
          <Pencil className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
}

export function MyPropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loadingDelay, skeletonTargets } = useDevTools();
  const [isLoading, setIsLoading] = useState(loadingDelay > 0 && skeletonTargets.myPropertyDetails);
  const [baseProperty] = useState<MyPropertyData>(mockMyPropertiesData[id || '1'] || defaultProperty);
  const [propertyOverrides, setPropertyOverrides] = useState<Partial<MyPropertyData>>({});
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isAdditionalInfoExpanded, setIsAdditionalInfoExpanded] = useState(false);
  const [isSwapClientModalOpen, setIsSwapClientModalOpen] = useState(false);
  const [isPropertyTypeModalOpen, setIsPropertyTypeModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [isFeaturesModalOpen, setIsFeaturesModalOpen] = useState(false);
  const [isAdditionalInfoModalOpen, setIsAdditionalInfoModalOpen] = useState(false);
  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false);
  const [isListingPortalsModalOpen, setIsListingPortalsModalOpen] = useState(false);
  const [isPublishSuccessModalOpen, setIsPublishSuccessModalOpen] = useState(false);
  const [isRejectedModalOpen, setIsRejectedModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDelistDialogOpen, setIsDelistDialogOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Dev tool config
  const [devConfig, setDevConfig] = useState<PropertyDetailsDevConfig>({
    status: 'published',
    photosMode: 'many',
    hasPropertyType: true,
    hasAddress: true,
    hasPricing: true,
    hasDescription: true,
    hasFeatures: true,
    hasAdditionalInfo: true,
    hasDocuments: true,
    allowEditing: false,
  });

  // Compute property based on dev config
  const property: MyPropertyData = {
    ...baseProperty,
    ...propertyOverrides,
    status: devConfig.status,
    photos: devConfig.photosMode === 'none' 
      ? [] 
      : devConfig.photosMode === 'few' 
        ? baseProperty.photos.slice(0, 3) 
        : baseProperty.photos,
    propertyType: devConfig.hasPropertyType ? (propertyOverrides.propertyType ?? baseProperty.propertyType) : null,
    address: devConfig.hasAddress ? (propertyOverrides.address ?? baseProperty.address) : null,
    pricing: devConfig.hasPricing ? (propertyOverrides.pricing ?? baseProperty.pricing) : null,
    description: devConfig.hasDescription ? (propertyOverrides.description ?? baseProperty.description) : null,
    features: devConfig.hasFeatures ? (propertyOverrides.features ?? baseProperty.features) : null,
    additionalInfo: devConfig.hasAdditionalInfo ? (propertyOverrides.additionalInfo ?? baseProperty.additionalInfo) : null,
    documents: devConfig.hasDocuments ? (propertyOverrides.documents ?? baseProperty.documents) : [],
  };

  // Helper to update property (stores in overrides)
  const setProperty = (updater: (prev: MyPropertyData) => MyPropertyData) => {
    const updated = updater(property);
    setPropertyOverrides(prev => ({
      ...prev,
      propertyType: updated.propertyType,
      address: updated.address,
      pricing: updated.pricing,
      description: updated.description,
      features: updated.features,
      additionalInfo: updated.additionalInfo,
      documents: updated.documents,
      listingPortals: updated.listingPortals,
    }));
  };
  
  

  const handleCopyReference = () => {
    navigator.clipboard.writeText(property.referenceCode);
    toast.success('Reference code copied to clipboard');
  };

  const handleEdit = (section: string) => {
    toast.info(`Edit ${section} - Coming soon`);
  };

  const canPublish = 
    property.photos.length > 0 &&
    property.propertyType &&
    property.address &&
    property.pricing &&
    property.description &&
    property.features;

  const isPublished = property.status === 'published';
  const isInReview = property.status === 'in-review';
  const isDraft = property.status === 'draft';
  // In dev mode with allowEditing, override the locks
  // When in review: ALL sections are locked
  // When published: ONLY property type, address, and swap client are locked
  const isLockedForReview = isInReview && !devConfig.allowEditing;
  const isLockedForPublished = isPublished && !devConfig.allowEditing;
  // Combined lock for property type, address, swap client (locked in both published and in-review)
  const isLockedCoreFields = (isPublished || isInReview) && !devConfig.allowEditing;

  const handlePublish = async () => {
    setIsPublishing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsPublishing(false);
    setIsPublishSuccessModalOpen(true);
  };

  const handleDeleteProperty = () => {
    toast.success('Property deleted successfully');
    navigate('/my-properties');
  };

  const handleDelistProperty = () => {
    // Update property status to delisted
    setDevConfig(prev => ({ ...prev, status: 'delisted' }));
  };

  // Calculate missing required sections for tooltip
  const missingSections: string[] = [];
  if (property.photos.length === 0) missingSections.push('Photos');
  if (!property.propertyType) missingSections.push('Property type');
  if (!property.address) missingSections.push('Address');
  if (!property.pricing) missingSections.push('Pricing');
  if (!property.description) missingSections.push('Description');
  // Simulate loading delay
  useEffect(() => {
    if (loadingDelay > 0 && skeletonTargets.myPropertyDetails) {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), loadingDelay);
      return () => clearTimeout(timer);
    }
  }, [id, loadingDelay, skeletonTargets.myPropertyDetails]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-0 animate-fade-in">
        {/* Header Skeleton - matches actual header structure */}
        <div className="bg-background/95 backdrop-blur-lg border-b">
          <PageContainer className="py-4">
            {/* Top row: Back + More */}
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-9 w-44" />
              <Skeleton className="h-9 w-9 rounded-md" />
            </div>
            
            {/* Status row */}
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-20" />
            </div>
            
            {/* Title row with CTAs */}
            <div className="flex items-start md:items-center justify-between gap-4 mb-2">
              <Skeleton className="h-8 w-80" />
              <div className="hidden md:flex items-center gap-2 shrink-0">
                <Skeleton className="h-10 w-28" />
                <Skeleton className="h-10 w-28" />
              </div>
            </div>
            
            {/* Client pill */}
            <Skeleton className="h-9 w-36 rounded-full" />
          </PageContainer>
        </div>

        {/* View Opportunity Link Skeleton */}
        <PageContainer className="py-4">
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-5 w-5" />
            </div>
          </Card>
        </PageContainer>
        
        {/* Content Grid Skeleton */}
        <PageContainer className="pb-6">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Photos Section */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-7 w-7 rounded" />
              </div>
              <Skeleton className="aspect-[4/3] rounded-lg mb-3" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-40" />
              </div>
            </Card>

            {/* Description Section */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <Skeleton className="h-7 w-7 rounded" />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </Card>

            {/* Property Type Section */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-5 w-28" />
                </div>
              </div>
              <Skeleton className="h-5 w-24" />
            </Card>

            {/* Property Features Section */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <Skeleton className="h-7 w-7 rounded" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </Card>

            {/* Address Section */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
              <Skeleton className="h-5 w-48 mb-1" />
              <Skeleton className="h-4 w-32" />
            </Card>

            {/* Pricing Section */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-7 w-7 rounded" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </Card>
          </div>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0 animate-fade-in">
      {/* Header */}
      <div className="bg-background border-b">
        <PageContainer className="py-4">
          {/* Property Info */}
          <div className="flex items-center gap-3 mb-2 justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <PropertyStatusBadge status={property.status} />
              <ReferenceCodeBadge code={property.referenceCode} />
              <span className="text-sm text-muted-foreground">
                {formatTimeAgo(property.statusDate)}
              </span>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setIsShareModalOpen(true)}>
                  <Upload className="w-4 h-4" />
                  Share property
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {isDraft ? (
                  <DropdownMenuItem 
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="text-destructive focus:text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete property
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem 
                    onClick={() => setIsDelistDialogOpen(true)}
                    className="text-destructive focus:text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delist property
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => toast.info('Report a problem - Coming soon')}>
                  <AlertTriangle className="w-4 h-4" />
                  Report a problem
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Title row with CTAs - CTAs hidden on mobile */}
          <div className="flex items-start md:items-center justify-between gap-4 mb-2">
            <TrackedTitle 
              title={property.title}
              headerContent={
                <div className="flex items-center gap-2 min-w-0">
                  <PropertyStatusBadge status={property.status} />
                  <span className="text-muted-foreground">·</span>
                  <span className="font-medium truncate">{property.title}</span>
                </div>
              }
            >
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold leading-tight">{property.title}</h1>
            </TrackedTitle>
            
            {/* Desktop CTAs - hidden on mobile */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
              <Button 
                variant="outline" 
                size="lg" 
                className="gap-2"
                onClick={() => navigate(`/properties/${id}`)}
              >
                <Eye className="w-5 h-5" />
                <span className="hidden lg:inline">Preview</span>
              </Button>
              {isPublished ? (
                <Button 
                  size="lg"
                  className="gap-2"
                  onClick={() => toast.info('Book visit - Coming soon')}
                >
                  <Calendar className="w-5 h-5" />
                  Book visit
                </Button>
              ) : isInReview ? null : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button 
                        size="lg"
                        className="gap-2"
                        disabled={!canPublish || isPublishing}
                        onClick={handlePublish}
                      >
                        {isPublishing && <Loader2 className="w-5 h-5 animate-spin" />}
                        {isPublishing ? 'Publishing...' : 'Publish'}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!canPublish && !isPublishing && (
                    <TooltipContent className="max-w-xs">
                      <p className="font-medium mb-1">Complete these sections to publish:</p>
                      <ul className="text-sm list-disc pl-4">
                        {missingSections.map((section) => (
                          <li key={section}>{section}</li>
                        ))}
                      </ul>
                    </TooltipContent>
                  )}
                </Tooltip>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                className="rounded-full gap-2 bg-[#E4E4E4] hover:bg-[#D4D4D4] text-foreground"
              >
                {property.clientName}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem 
                onClick={() => {
                  window.location.href = `tel:${property.clientPhone}`;
                }}
                className="gap-3 py-3"
              >
                <Phone className="w-4 h-4" />
                Call
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  const phoneNumber = property.clientPhone.replace(/\s+/g, '');
                  window.open(`https://wa.me/${phoneNumber.replace('+', '')}`, '_blank');
                }}
                className="gap-3 py-3"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate(`/clients/${property.clientId}`)}
                className="gap-3 py-3"
              >
                <User className="w-4 h-4" />
                Go to profile
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setIsSwapClientModalOpen(true)}
                className="gap-3 py-3"
                disabled={isLockedCoreFields}
              >
                <ArrowLeftRight className="w-4 h-4" />
                Swap client
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </PageContainer>
      </div>

      {/* Swap Client Modal */}
      <SwapClientModal
            open={isSwapClientModalOpen}
            onOpenChange={setIsSwapClientModalOpen}
            currentClientId={property.clientId}
            onSelectClient={(clientId, clientName, clientPhone) => {
              setProperty(prev => ({
                ...prev,
                clientId,
                clientName,
                clientPhone
              }));
              toast.success(`Client changed to ${clientName}`);
            }}
          />

          {/* Edit Address Modal */}
          <EditAddressModal
            open={isAddressModalOpen}
            onOpenChange={setIsAddressModalOpen}
            currentAddress={property.address ? {
              id: '1',
              streetName: property.address.street.split(',')[0] || property.address.street,
              streetNumber: '',
              neighborhood: '',
              city: property.address.city,
              postalCode: '',
              latitude: 40.4168,
              longitude: -3.7038
            } as MockAddress : null}
            currentVisibility={property.address?.visibility === 'full' ? 'full-address' : property.address?.visibility === 'hidden' ? 'hidden' : 'street-only'}
            parentType={property.propertyType?.toLowerCase() || null}
            onSave={(data) => {
              if (data.address) {
                setProperty(prev => ({
                  ...prev,
                  address: {
                    street: `${data.address!.streetName}${data.address!.streetNumber ? ` ${data.address!.streetNumber}` : ''}`,
                    city: data.address!.city,
                    visibility: data.visibility === 'full-address' ? 'full' : data.visibility || 'street-only'
                  }
                }));
                toast.success('Address updated');
              }
            }}
          />

          {/* Edit Price Modal */}
          <EditPriceModal
            open={isPriceModalOpen}
            onOpenChange={setIsPriceModalOpen}
            intent={property.intent}
            currentPricing={property.pricing}
            onSave={(pricing) => {
              setProperty(prev => ({
                ...prev,
                pricing
              }));
              toast.success('Pricing updated');
            }}
          />

          {/* Edit Description Modal */}
          <EditDescriptionModal
            open={isDescriptionModalOpen}
            onOpenChange={setIsDescriptionModalOpen}
            currentDescription={property.description}
            onSave={(description) => {
              setProperty(prev => ({
                ...prev,
                description
              }));
              toast.success('Description updated');
            }}
          />

          {/* Edit Features Modal */}
          <EditFeaturesModal
            open={isFeaturesModalOpen}
            onOpenChange={setIsFeaturesModalOpen}
            currentFeatures={property.features}
            onSave={(features) => {
              setProperty(prev => ({
                ...prev,
                features
              }));
              toast.success('Features updated');
            }}
          />

          {/* Edit Additional Info Modal */}
          <EditAdditionalInfoModal
            open={isAdditionalInfoModalOpen}
            onOpenChange={setIsAdditionalInfoModalOpen}
            currentInfo={property.additionalInfo}
            onSave={(additionalInfo) => {
              setProperty(prev => ({
                ...prev,
                additionalInfo
              }));
              toast.success('Additional information updated');
            }}
          />

          {/* Edit Documents Modal */}
          <EditDocumentsModal
            open={isDocumentsModalOpen}
            onOpenChange={setIsDocumentsModalOpen}
            currentDocuments={property.documents}
            onSave={(documents) => {
              setProperty(prev => ({
                ...prev,
                documents
              }));
              toast.success('Documents updated');
            }}
          />

      <PageContainer>
        {/* Status Cards */}
        <div className="space-y-3 mb-6">
          {/* Editing Paused Banner - only shown when in review */}
          {isInReview && (
            <Card className="p-4 bg-card">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center mb-4">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <h3 className="font-semibold text-foreground">Editing paused for review</h3>
              <p className="text-muted-foreground">
                We are currently reviewing this property. You will be able to edit any details after the review
              </p>
            </Card>
          )}

          {/* Property Rejected Banner - only shown when rejected */}
          {property.status === 'rejected' && (
            <Card className="p-4 bg-card">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-ds-red/10 flex items-center justify-center shrink-0">
                  <X className="w-5 h-5 text-ds-red" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">Property rejected</h3>
                  <p className="text-sm text-fg-secondary">
                    This property didn't pass our review and wasn't published.
                  </p>
                </div>
                <Button 
                  size="sm"
                  className="shrink-0 self-center"
                  onClick={() => setIsRejectedModalOpen(true)}
                >
                  Learn more
                </Button>
              </div>
            </Card>
          )}

          {/* Property Delisted Banner - only shown when delisted */}
          {property.status === 'delisted' && (
            <Card className="p-4 bg-card">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-4">
                <EyeOff className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <h3 className="font-semibold text-foreground">Property delisted</h3>
              <p className="text-muted-foreground">
                This property was delisted on {new Date(property.statusDate).toLocaleDateString()} after property sold by another agency.
              </p>
            </Card>
          )}

          <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/opportunities/1')}>
            <div className="flex items-center gap-4">
              <OpportunityIcon type={property.intent === 'sale' ? 'sell' : 'lease'} className="w-10 h-10" />
              <div className="flex-1">
                <p className="font-semibold">View {property.intent === 'sale' ? 'Sell' : 'Lease'} opportunity</p>
                <p className="text-muted-foreground">Manage clients and activity</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Card>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Column: Photos, Property Type, Address, Pricing */}
          <div className="space-y-4">
            {/* Photos */}
            <Card className="p-4">
              <SectionHeader
                title="Photos"
                isComplete={property.photos.length > 0}
                isRequired={true}
                onEdit={() => handleEdit('photos')}
                disabled={isLockedForReview}
                isInReview={isInReview}
              />
              <div className="space-y-3">
                {property.photos.length > 0 ? (
                  <div className="flex gap-2 h-[208px]">
                    <div 
                      className="flex-1 bg-muted rounded-lg overflow-hidden h-full cursor-pointer transition-transform hover:scale-[1.02]"
                      onClick={() => {
                        setGalleryInitialIndex(0);
                        setGalleryOpen(true);
                      }}
                    >
                      <img 
                        src={property.photos[0]} 
                        alt="Main property photo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      {[1, 2, 3].map((index) => {
                        const isLastThumbnail = index === 3;
                        const remainingPhotos = property.photos.length - 4;
                        const hasMorePhotos = isLastThumbnail && remainingPhotos > 0;
                        
                        return (
                          <div 
                            key={index}
                            className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden relative flex-shrink-0 cursor-pointer transition-transform hover:scale-105"
                            onClick={() => {
                              if (property.photos[index]) {
                                setGalleryInitialIndex(index);
                                setGalleryOpen(true);
                              }
                            }}
                          >
                            {property.photos[index] ? (
                              <>
                                <img 
                                  src={property.photos[index]} 
                                  alt={`Property photo ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                {hasMorePhotos && (
                                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <span className="text-white font-semibold text-sm">+{remainingPhotos}</span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <ImageIcon className="w-5 h-5 text-muted-foreground/30" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="aspect-[3/1] bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                      <p className="text-sm">No photos added yet</p>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Request professional photos</span>
                    </div>
                    <Switch 
                      checked={property.requestProfessionalPhotos}
                      onCheckedChange={(checked) => 
                        setProperty(prev => ({ ...prev, requestProfessionalPhotos: checked }))
                      }
                    />
                  </div>
                  {property.requestProfessionalPhotos && (
                    <p className="text-xs text-muted-foreground px-3 pb-1">
                      Once you submit the property for publishing, our team will contact you to schedule a professional photography session. The photos will be added automatically once they're ready.
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Property Type */}
            <Card className="p-4">
              <SectionHeader
                title="Property type"
                isComplete={!!property.propertyType}
                isRequired={true}
                onEdit={() => setIsPropertyTypeModalOpen(true)}
                disabled={isLockedCoreFields}
                isInReview={isInReview}
              />
              {property.propertyType ? (
                <p className="text-foreground text-sm">{property.propertyType}</p>
              ) : (
                <p className="text-muted-foreground text-sm">Not set</p>
              )}
            </Card>

            {/* Edit Property Type Modal */}
            <EditPropertyTypeModal
              open={isPropertyTypeModalOpen}
              onOpenChange={setIsPropertyTypeModalOpen}
              currentPropertyType={property.propertyType}
              onSave={(parentType, subType, label) => {
                setProperty(prev => ({
                  ...prev,
                  propertyType: label
                }));
                toast.success('Property type updated');
              }}
            />

            {/* Address */}
            <Card className="p-4">
              <SectionHeader
                title="Address"
                isComplete={!!property.address}
                isRequired={true}
                onEdit={() => setIsAddressModalOpen(true)}
                disabled={isLockedCoreFields}
                isInReview={isInReview}
              />
              {property.address ? (
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-foreground">{property.address.street}</p>
                    <p className="text-foreground">{property.address.city}</p>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Address visibility</span>
                    <span className="text-foreground text-right">
                      {property.address.visibility === 'street-only' ? 'Street name only' : 
                       property.address.visibility === 'full' ? 'Full address' : 'Hidden'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Not set</p>
              )}
            </Card>

            {/* Pricing */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {property.pricing ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
                  )}
                  <h3 className="font-semibold text-sm">Pricing</h3>
                  {isLockedForReview && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full cursor-help">
                          <Lock className="w-3 h-3" />
                          Locked
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isInReview ? "This field cannot be edited while the property is under review" : "This field cannot be edited after the property is published"}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                {!isLockedForReview && (
                  <div className="flex items-center gap-1">
                    {/* Dev Tool */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Settings className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Intent (Dev Tool)</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => setProperty(prev => ({
                            ...prev,
                            intent: 'sale',
                            pricing: prev.pricing ? {
                              price: prev.pricing.price,
                              currency: prev.pricing.currency,
                              communityFees: 120,
                              ibi: 200,
                            } : null
                          }))}
                          className={property.intent === 'sale' ? 'bg-accent' : ''}
                        >
                          Sale
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setProperty(prev => ({
                            ...prev,
                            intent: 'rental',
                            pricing: prev.pricing ? {
                              price: 2500,
                              currency: prev.pricing.currency,
                              contractType: 'long-term',
                            } : null
                          }))}
                          className={property.intent === 'rental' ? 'bg-accent' : ''}
                        >
                          Rental
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="ghost" size="icon" onClick={() => setIsPriceModalOpen(true)} className="h-7 w-7">
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
              {property.pricing ? (
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {property.intent === 'sale' ? 'Property price' : 'Rental price'}
                    </span>
                    <span className="font-medium">
                      {property.pricing.price.toLocaleString()} {property.pricing.currency}
                      {property.intent === 'rental' && '/month'}
                    </span>
                  </div>
                  {property.intent === 'sale' && property.pricing.communityFees && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Community fees</span>
                      <span>{property.pricing.communityFees} {property.pricing.currency}/month</span>
                    </div>
                  )}
                  {property.intent === 'sale' && property.pricing.ibi && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IBI</span>
                      <span>{property.pricing.ibi} {property.pricing.currency}/year</span>
                    </div>
                  )}
                  {property.intent === 'rental' && property.pricing.contractType && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Contract type</span>
                      <span className="capitalize">{property.pricing.contractType.replace('-', ' ')}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Not set</p>
              )}
            </Card>
          </div>

          {/* Right Column: Description, Features, Additional Info, Documents, Listing Portals */}
          <div className="space-y-4">
            {/* Description */}
            <Card className="p-4">
              <SectionHeader
                title="Description"
                isComplete={!!property.description}
                isRequired={true}
                onEdit={() => setIsDescriptionModalOpen(true)}
                disabled={isLockedForReview}
                isInReview={isInReview}
              />
              {property.description ? (
                <div className="space-y-3">
                  {/* First translation - always visible with line clamp when collapsed */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">{property.description.translations[0].language}</span>
                      <span>{property.description.translations[0].flag}</span>
                    </div>
                    <p className={cn(
                      "text-foreground text-sm leading-relaxed whitespace-pre-line transition-all duration-300",
                      !isDescriptionExpanded && "line-clamp-3"
                    )}>
                      {property.description.translations[0].text}
                    </p>
                  </div>
                  
                  {/* Additional translations - smooth expand/collapse */}
                  <div className={cn(
                    "expandable-content",
                    isDescriptionExpanded && "expanded"
                  )}>
                    <div className="space-y-3">
                      {property.description.translations.slice(1).map((translation) => (
                        <div key={translation.language} className="space-y-2 pt-3 border-t border-border">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">{translation.language}</span>
                            <span>{translation.flag}</span>
                          </div>
                          <p className="text-foreground text-sm leading-relaxed whitespace-pre-line">
                            {translation.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="text-sm text-muted-foreground flex items-center gap-1 hover:text-foreground transition-smooth"
                  >
                    {isDescriptionExpanded ? 'Show less' : 'Show more'} 
                    <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", isDescriptionExpanded && "rotate-180")} />
                  </button>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Not set</p>
              )}
            </Card>

            {/* Property Features */}
            <Card className="p-4">
              <SectionHeader
                title="Property features"
                isComplete={!!property.features}
                isRequired={true}
                onEdit={() => setIsFeaturesModalOpen(true)}
                disabled={isLockedForReview}
                isInReview={isInReview}
              />
              {property.features ? (
                <div className="space-y-1 text-sm">
                  {property.features.size && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Size</span>
                      <span>{property.features.size} m²</span>
                    </div>
                  )}
                  {property.features.usableSize && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Usable size</span>
                      <span>{property.features.usableSize} m²</span>
                    </div>
                  )}
                  {property.features.bedrooms && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bedrooms</span>
                      <span>{property.features.bedrooms}</span>
                    </div>
                  )}
                  {property.features.bathrooms && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bathrooms</span>
                      <span>{property.features.bathrooms}</span>
                    </div>
                  )}
                  {property.features.condition && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Condition</span>
                      <span>{property.features.condition}</span>
                    </div>
                  )}
                  {property.features.occupancyStatus && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Occupancy status</span>
                      <span>{property.features.occupancyStatus}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Not set</p>
              )}
            </Card>

            {/* Additional Information */}
            <Card className="p-4">
              <SectionHeader
                title="Additional information"
                isComplete={!!property.additionalInfo}
                onEdit={() => setIsAdditionalInfoModalOpen(true)}
                disabled={isLockedForReview}
                isInReview={isInReview}
              />
              {property.additionalInfo ? (
                <div className="space-y-3 text-sm">
                  {/* Exposure */}
                  {property.additionalInfo.exposure && (
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">Exposure</p>
                      {property.additionalInfo.exposure.view && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">View</span>
                          <span>{property.additionalInfo.exposure.view}</span>
                        </div>
                      )}
                      {property.additionalInfo.exposure.orientation && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Orientation</span>
                          <span>{property.additionalInfo.exposure.orientation}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Build and Finish */}
                  {property.additionalInfo.buildAndFinish && (
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">Build and finish</p>
                      {property.additionalInfo.buildAndFinish.constructionYear && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Construction year</span>
                          <span>{property.additionalInfo.buildAndFinish.constructionYear}</span>
                        </div>
                      )}
                      {property.additionalInfo.buildAndFinish.renovationYear && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Renovation year</span>
                          <span>{property.additionalInfo.buildAndFinish.renovationYear}</span>
                        </div>
                      )}
                      {property.additionalInfo.buildAndFinish.furnished && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Furnished</span>
                          <span>{property.additionalInfo.buildAndFinish.furnished}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Expandable content */}
                  <div className={cn(
                    "expandable-content",
                    isAdditionalInfoExpanded && "expanded"
                  )}>
                    <div className="space-y-3">
                      {/* Property Amenities */}
                      {property.additionalInfo.propertyAmenities && property.additionalInfo.propertyAmenities.length > 0 && (
                        <div className="space-y-2 pt-3">
                          <p className="font-medium text-foreground">Property amenities</p>
                          <div className="flex flex-wrap gap-1.5">
                            {property.additionalInfo.propertyAmenities.map((amenity, i) => (
                              <Badge key={i} variant="secondary" className="text-xs font-normal">
                                {amenity}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Parking */}
                      {property.additionalInfo.parkingIncluded !== undefined && (
                        <div className="space-y-1 pt-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Parking included</span>
                            <span>{property.additionalInfo.parkingIncluded ? 'Yes' : 'No'}</span>
                          </div>
                          {!property.additionalInfo.parkingIncluded && property.additionalInfo.parkingPrice && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Parking price</span>
                              <span>€{property.additionalInfo.parkingPrice.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Heating Type */}
                      {property.additionalInfo.heatingType && (
                        <div className="flex justify-between pt-2">
                          <span className="text-muted-foreground">Heating type</span>
                          <span>{property.additionalInfo.heatingType}</span>
                        </div>
                      )}
                      
                      {/* Building Amenities */}
                      {property.additionalInfo.buildingAmenities && property.additionalInfo.buildingAmenities.length > 0 && (
                        <div className="space-y-2 pt-2">
                          <p className="font-medium text-foreground">Building amenities</p>
                          <div className="flex flex-wrap gap-1.5">
                            {property.additionalInfo.buildingAmenities.map((amenity, i) => (
                              <Badge key={i} variant="secondary" className="text-xs font-normal">
                                {amenity}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Energy Certificate */}
                      {property.additionalInfo.energyCertificate && (
                        <div className="space-y-1 pt-2">
                          <p className="font-medium text-foreground">Energy certificate</p>
                          {property.additionalInfo.energyCertificate.consumptionType && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Energy consumption type</span>
                              <span>{property.additionalInfo.energyCertificate.consumptionType}</span>
                            </div>
                          )}
                          {property.additionalInfo.energyCertificate.consumption && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Energy consumption</span>
                              <span>{property.additionalInfo.energyCertificate.consumption} kWh/m² year</span>
                            </div>
                          )}
                          {property.additionalInfo.energyCertificate.emissionsType && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Emissions type</span>
                              <span>{property.additionalInfo.energyCertificate.emissionsType}</span>
                            </div>
                          )}
                          {property.additionalInfo.energyCertificate.emissions && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Emissions</span>
                              <span>{property.additionalInfo.energyCertificate.emissions} kg CO²/m² year</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setIsAdditionalInfoExpanded(!isAdditionalInfoExpanded)}
                    className="text-muted-foreground flex items-center gap-1 hover:text-foreground transition-smooth"
                  >
                    {isAdditionalInfoExpanded ? 'Show less' : 'Show more'} 
                    <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", isAdditionalInfoExpanded && "rotate-180")} />
                  </button>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Not set</p>
              )}
            </Card>

            {/* Documents */}
            <Card className="p-4">
              <SectionHeader
                title="Documents"
                isComplete={property.documents.length > 0}
                onEdit={() => setIsDocumentsModalOpen(true)}
                disabled={isLockedForReview}
                isInReview={isInReview}
              />
              {property.documents.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {property.documents.map((doc, index) => (
                    <Badge key={index} variant="secondary" className="text-xs font-normal">
                      {doc.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No documents uploaded</p>
              )}
            </Card>

            {/* Listing Portals */}
            <Card className="p-4">
              <SectionHeader
                title="Listing portals"
                isComplete={property.listingPortals.some(p => p.enabled)}
                onEdit={() => setIsListingPortalsModalOpen(true)}
                disabled={isLockedForReview}
                isInReview={isInReview}
              />
              <div className="flex flex-wrap gap-2">
                {property.listingPortals.filter(p => p.enabled).map((portal, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="text-xs font-normal flex items-center gap-2 py-1.5 px-3"
                  >
                    {portalLogos[portal.name] && (
                      <img 
                        src={portalLogos[portal.name]} 
                        alt={portal.name} 
                        className="w-4 h-4 rounded-sm object-cover"
                      />
                    )}
                    {portal.name}
                  </Badge>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </PageContainer>

      {/* Edit Listing Portals Modal */}
      <EditListingPortalsModal
        open={isListingPortalsModalOpen}
        onOpenChange={setIsListingPortalsModalOpen}
        currentPortals={property.listingPortals.filter(p => p.enabled).map(p => {
          // Map portal names to IDs
          const nameToId: Record<string, string> = {
            'Huspy': 'huspy',
            'Idealista': 'idealista',
            'Fotocasa': 'fotocasa',
            'Pisos.com': 'pisos',
            'Properstar': 'properstar',
            'JamesEdition': 'james-edition',
            'Luxury Estate': 'luxury-estate',
          };
          return nameToId[p.name] || p.name.toLowerCase();
        })}
        onSave={(portalIds) => {
          // Map IDs back to portal names
          const idToName: Record<string, string> = {
            'huspy': 'Huspy',
            'idealista': 'Idealista',
            'fotocasa': 'Fotocasa',
            'pisos': 'Pisos.com',
            'properstar': 'Properstar',
            'james-edition': 'JamesEdition',
            'luxury-estate': 'Luxury Estate',
          };
          const updatedPortals = property.listingPortals.map(portal => {
            const portalId = Object.entries(idToName).find(([_, name]) => name === portal.name)?.[0];
            return {
              ...portal,
              enabled: portalId ? portalIds.includes(portalId) : false,
            };
          });
          setProperty(prev => ({
            ...prev,
            listingPortals: updatedPortals,
          }));
          toast.success('Listing portals updated');
        }}
      />

      {/* Publish Success Modal */}
      <PublishSuccessModal
        open={isPublishSuccessModalOpen}
        onClose={() => setIsPublishSuccessModalOpen(false)}
      />

      {/* Property Rejected Modal */}
      <PropertyRejectedModal
        open={isRejectedModalOpen}
        onOpenChange={setIsRejectedModalOpen}
      />

      {/* Fullscreen Gallery */}
      <FullscreenGallery
        images={property.photos}
        initialIndex={galleryInitialIndex}
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        alt="Property"
      />

      {/* Dev Tool */}
      <MyPropertyDetailsDevTool config={devConfig} setConfig={setDevConfig} />

      {/* Mobile Bottom CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t p-4 md:hidden">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="lg" className="gap-2" onClick={() => navigate(`/properties/${id}`)}>
            <Eye className="w-5 h-5" />
          </Button>
          {isPublished ? (
            <Button 
              size="lg"
              className="flex-1 gap-2"
              onClick={() => toast.info('Book visit - Coming soon')}
            >
              <Calendar className="w-5 h-5" />
              Book visit
            </Button>
          ) : isInReview ? null : (
            <Button 
              size="lg"
              className="flex-1 gap-2"
              disabled={!canPublish || isPublishing}
              onClick={handlePublish}
            >
              {isPublishing && <Loader2 className="w-5 h-5 animate-spin" />}
              {isPublishing ? 'Publishing...' : 'Publish'}
            </Button>
          )}
        </div>
      </div>

      {/* Delete Property Dialog (Draft only) */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete the property?</AlertDialogTitle>
            <AlertDialogDescription>
              Once this is confirmed, you will lose access to this property and all related information will be permanently removed
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">No, keep property</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProperty} className="w-full sm:w-auto">
              Yes, delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delist Property Modal (Published/In-review) */}
      <DelistPropertyModal 
        open={isDelistDialogOpen} 
        onOpenChange={setIsDelistDialogOpen}
        onConfirm={handleDelistProperty}
      />

      {/* Share Property Modal */}
      <SharePropertyModal
        open={isShareModalOpen}
        onOpenChange={setIsShareModalOpen}
        property={{
          id: property.id,
          title: property.title,
          image: property.photos[0] || '/placeholder.svg',
          images: property.photos,
        }}
      />
    </div>
  );
}