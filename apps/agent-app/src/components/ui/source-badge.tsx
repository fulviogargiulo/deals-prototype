import { FileInput, Megaphone, Laptop2 } from "lucide-react";
import idealistaLogo from "@/assets/idealista-logo.png";
import fotocasaLogo from "@/assets/fotocasa-logo-new.png";
import pisosLogo from "@/assets/pisos-logo.png";
import huspyLogo from "@/assets/huspy-logo.png";

export type SourceType = 'self-created' | 'idealista' | 'fotocasa' | 'pisos' | 'huspy' | 'marketing-campaign' | 'ops-portal';

interface SourceBadgeProps {
  source: SourceType;
  className?: string;
}

const sourceConfig: Record<SourceType, { name: string; logo?: string; icon?: React.ComponentType<{ className?: string }> }> = {
  'idealista': { name: 'Idealista', logo: idealistaLogo },
  'fotocasa': { name: 'Fotocasa', logo: fotocasaLogo },
  'pisos': { name: 'Pisos', logo: pisosLogo },
  'huspy': { name: 'Huspy', logo: huspyLogo },
  'self-created': { name: 'Self-created', icon: FileInput },
  'marketing-campaign': { name: 'Marketing campaign', icon: Megaphone },
  'ops-portal': { name: 'OPS portal', icon: Laptop2 },
};

export function SourceBadge({ source, className }: SourceBadgeProps) {
  const config = sourceConfig[source];
  
  if (!config) return null;

  const IconComponent = config.icon;
  
  return (
    <div className={`inline-flex items-center gap-1.5 h-8 pl-2 pr-3 rounded-full bg-card ${className || ''}`}>
      <div className="w-4 h-4 rounded-full overflow-hidden flex items-center justify-center">
        {config.logo ? (
          <img 
            src={config.logo} 
            alt={config.name} 
            className="w-full h-full object-cover"
          />
        ) : IconComponent ? (
          <IconComponent className="w-3.5 h-3.5 text-foreground" />
        ) : null}
      </div>
      <span className="text-xs font-semibold">{config.name}</span>
    </div>
  );
}
