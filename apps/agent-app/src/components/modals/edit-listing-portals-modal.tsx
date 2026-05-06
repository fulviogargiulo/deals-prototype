import { useState, useEffect } from "react";
import { StandardModal, StandardModalFooter, MandatoryFieldsNote } from "@/components/ui/standard-modal";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { EyeOff, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Import portal logos
import huspyLogo from "@/assets/huspy-logo.png";
import idealistaLogo from "@/assets/idealista-logo.png";
import fotocasaLogo from "@/assets/fotocasa-logo-new.png";
import pisosLogo from "@/assets/pisos-logo.png";
import properstarLogo from "@/assets/properstar-logo.png";
import jamesEditionLogo from "@/assets/james-edition-logo.png";
import luxuryEstateLogo from "@/assets/luxury-estate-logo.png";

interface Portal {
  id: string;
  name: string;
  logo: string;
  category: 'national' | 'international-non-luxury' | 'international-luxury';
}

const portals: Portal[] = [
  { id: 'huspy', name: 'Huspy.com', logo: huspyLogo, category: 'national' },
  { id: 'idealista', name: 'Idealista', logo: idealistaLogo, category: 'national' },
  { id: 'fotocasa', name: 'Fotocasa', logo: fotocasaLogo, category: 'national' },
  { id: 'pisos', name: 'Pisos.com', logo: pisosLogo, category: 'national' },
  { id: 'properstar', name: 'Properstar', logo: properstarLogo, category: 'international-non-luxury' },
  { id: 'james-edition', name: 'James Edition', logo: jamesEditionLogo, category: 'international-luxury' },
  { id: 'luxury-estate', name: 'Luxury Estate', logo: luxuryEstateLogo, category: 'international-luxury' },
];

interface EditListingPortalsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPortals: string[];
  onSave: (portals: string[]) => void;
}

export function EditListingPortalsModal({
  open,
  onOpenChange,
  currentPortals,
  onSave,
}: EditListingPortalsModalProps) {
  const [selectedPortals, setSelectedPortals] = useState<string[]>([]);
  const [dontPublish, setDontPublish] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedPortals(currentPortals);
      setDontPublish(currentPortals.length === 0);
    }
  }, [open, currentPortals]);

  const handlePortalToggle = (portalId: string) => {
    if (dontPublish) return;
    
    setSelectedPortals(prev => 
      prev.includes(portalId)
        ? prev.filter(id => id !== portalId)
        : [...prev, portalId]
    );
  };

  const handleDontPublishToggle = (checked: boolean) => {
    setDontPublish(checked);
    if (checked) {
      setSelectedPortals([]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    onSave(selectedPortals);
    setIsSaving(false);
    onOpenChange(false);
  };

  const handleClose = () => {
    if (!isSaving) {
      onOpenChange(false);
    }
  };

  const nationalPortals = portals.filter(p => p.category === 'national');
  const internationalNonLuxury = portals.filter(p => p.category === 'international-non-luxury');
  const internationalLuxury = portals.filter(p => p.category === 'international-luxury');

  return (
    <StandardModal
      open={open}
      onOpenChange={handleClose}
      title="Listing portals"
      description="Select the portals where you want your property to be listed"
      size="md"
      preventClose={isSaving}
      footer={
        <StandardModalFooter
          label="Save changes"
          loadingLabel="Saving..."
          onClick={handleSave}
          isLoading={isSaving}
        />
      }
    >
      <div className="pb-2">
        {/* Info banner */}
        <div className="bg-primary/10 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-foreground">
            Make sure you have the client's permission to publish to any portal
          </p>
        </div>

        {/* National portals */}
        <div className="mt-6">
          <h3 className="text-base font-semibold mb-3">National portals</h3>
          <div className="space-y-1">
            {nationalPortals.map((portal) => (
              <PortalRow
                key={portal.id}
                portal={portal}
                isSelected={selectedPortals.includes(portal.id)}
                onToggle={() => handlePortalToggle(portal.id)}
                disabled={dontPublish}
              />
            ))}
          </div>
        </div>

        {/* International portals */}
        <div className="mt-6">
          <h3 className="text-base font-semibold mb-3">International portals</h3>
          
          <p className="text-sm text-muted-foreground mb-2">Non-luxury</p>
          <div className="space-y-1 mb-4">
            {internationalNonLuxury.map((portal) => (
              <PortalRow
                key={portal.id}
                portal={portal}
                isSelected={selectedPortals.includes(portal.id)}
                onToggle={() => handlePortalToggle(portal.id)}
                disabled={dontPublish}
              />
            ))}
          </div>

          <p className="text-sm text-muted-foreground mb-2">Luxury</p>
          <div className="space-y-1">
            {internationalLuxury.map((portal) => (
              <PortalRow
                key={portal.id}
                portal={portal}
                isSelected={selectedPortals.includes(portal.id)}
                onToggle={() => handlePortalToggle(portal.id)}
                disabled={dontPublish}
              />
            ))}
          </div>
        </div>

        {/* Don't publish toggle */}
        <div className="mt-6 flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <EyeOff className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="font-medium text-sm">Don't publish to listing portals</span>
          </div>
          <Switch
            checked={dontPublish}
            onCheckedChange={handleDontPublishToggle}
          />
        </div>
      </div>
    </StandardModal>
  );
}

interface PortalRowProps {
  portal: Portal;
  isSelected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

function PortalRow({ portal, isSelected, onToggle, disabled }: PortalRowProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "w-full flex items-center justify-between p-3 rounded-xl transition-colors",
        "hover:bg-muted/50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-background border border-border flex items-center justify-center">
          <img 
            src={portal.logo} 
            alt={portal.name} 
            className="w-8 h-8 object-contain"
          />
        </div>
        <span className="font-medium text-sm">{portal.name}</span>
      </div>
      <Checkbox
        checked={isSelected}
        disabled={disabled}
        className="h-5 w-5 rounded-md"
      />
    </button>
  );
}
