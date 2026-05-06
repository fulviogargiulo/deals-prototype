import { OpportunityType } from "@/types";
import { cn } from "@/lib/utils";

// Import SVG icons (with background circles)
import BuyIcon from "@/assets/icons/buy-opportunity.svg";
import RentIcon from "@/assets/icons/rent-opportunity.svg";
import SellIcon from "@/assets/icons/sell-opportunity.svg";
import LeaseIcon from "@/assets/icons/lease-opportunity.svg";
import MortgageIcon from "@/assets/icons/mortgage-opportunity.svg";

// Import bare SVG icons (no background)
import BuyIconBare from "@/assets/icons/buy-opp-bare.svg";
import RentIconBare from "@/assets/icons/rent-opp-bare.svg";
import SellIconBare from "@/assets/icons/sell-opp-bare.svg";
import LeaseIconBare from "@/assets/icons/lease-opp-bare.svg";

interface OpportunityIconProps {
  type: OpportunityType;
  className?: string;
  iconClassName?: string;
  showBackground?: boolean;
  /** Use bare icon (no background circle) */
  bare?: boolean;
}

const opportunityConfig = {
  buy: {
    icon: BuyIcon,
    bareIcon: BuyIconBare,
    color: "bg-huspy-buy",
    lightBg: "bg-huspy-buy/10",
    textColor: "text-huspy-buy",
    label: "Buy",
    hslColor: "185 100% 27%",
    badgeClasses: "bg-huspy-buy/20",
    iconHex: "#006D77",
  },
  rent: {
    icon: RentIcon,
    bareIcon: RentIconBare,
    color: "bg-huspy-rent",
    lightBg: "bg-huspy-rent/10",
    textColor: "text-huspy-rent",
    label: "Rent",
    hslColor: "240 88% 65%",
    badgeClasses: "bg-huspy-rent/20",
    iconHex: "#3F3FB4",
  },
  sell: {
    icon: SellIcon,
    bareIcon: SellIconBare,
    color: "bg-huspy-sell",
    lightBg: "bg-huspy-sell/10",
    textColor: "text-huspy-sell",
    label: "Sell",
    hslColor: "17 69% 54%",
    badgeClasses: "bg-huspy-sell/20",
    iconHex: "#B85C38",
  },
  lease: {
    icon: LeaseIcon,
    bareIcon: LeaseIconBare,
    color: "bg-huspy-lease",
    lightBg: "bg-huspy-lease/10",
    textColor: "text-huspy-lease",
    label: "Lease",
    hslColor: "304 56% 56%",
    badgeClasses: "bg-huspy-lease/20",
    iconHex: "#9C4F96",
  },
  mortgage: {
    icon: MortgageIcon,
    bareIcon: null,
    color: "bg-huspy-mortgage",
    lightBg: "bg-huspy-mortgage/10",
    textColor: "text-huspy-mortgage",
    label: "Mortgage",
    hslColor: "99 24% 56%",
    badgeClasses: "bg-huspy-mortgage/20",
    iconHex: "#5C6B4F",
  },
};

export function OpportunityIcon({ type, className, iconClassName, showBackground = true, bare = false }: OpportunityIconProps) {
  const config = opportunityConfig[type];
  
  // Use bare icon if requested and available
  const IconSrc = bare && config.bareIcon ? config.bareIcon : config.icon;

  // The SVG already contains the background circle, so we just render the img
  // Default size is w-7 h-7, use className to override
  return (
    <img 
      src={IconSrc} 
      alt={`${config.label} opportunity`}
      className={cn(
        bare ? "w-3.5 h-3.5" : "w-7 h-7",
        className,
        iconClassName
      )} 
    />
  );
}

export function getOpportunityConfig(type: OpportunityType) {
  return opportunityConfig[type];
}

export function getOpportunityBadgeClasses(type: OpportunityType): string {
  return opportunityConfig[type].badgeClasses;
}

export function getOpportunityLabel(type: OpportunityType): string {
  return opportunityConfig[type].label;
}