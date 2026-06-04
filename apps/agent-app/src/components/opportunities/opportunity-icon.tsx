import { OpportunityType } from "@/types";
import { cn } from "@/lib/utils";

import BuyIcon from "@/assets/icons/buy-opportunity.svg";
import RentIcon from "@/assets/icons/rent-opportunity.svg";
import SellIcon from "@/assets/icons/sell-opportunity.svg";
import LeaseIcon from "@/assets/icons/lease-opportunity.svg";
import MortgageIcon from "@/assets/icons/mortgage-opportunity.svg";

import BuyIconBare from "@/assets/icons/buy-opp-bare.svg";
import RentIconBare from "@/assets/icons/rent-opp-bare.svg";
import SellIconBare from "@/assets/icons/sell-opp-bare.svg";
import LeaseIconBare from "@/assets/icons/lease-opp-bare.svg";

interface OpportunityIconProps {
  type: OpportunityType;
  className?: string;
  iconClassName?: string;
  showBackground?: boolean;
  bare?: boolean;
}

const opportunityConfig = {
  buy: {
    icon: BuyIcon,
    bareIcon: BuyIconBare,
    color: "bg-opportunity-buy",
    lightBg: "bg-opp-bg-buy",
    textColor: "text-opportunity-buy",
    label: "Buy",
    tokenColor: "var(--teal-600)",
    alphaBg: "var(--alpha-teal-16)",
    badgeClasses: "bg-opp-bg-buy",
    iconHex: "#008894",
  },
  rent: {
    icon: RentIcon,
    bareIcon: RentIconBare,
    color: "bg-opportunity-rent",
    lightBg: "bg-opp-bg-rent",
    textColor: "text-opportunity-rent",
    label: "Rent",
    tokenColor: "var(--indigo-600)",
    alphaBg: "var(--alpha-indigo-16)",
    badgeClasses: "bg-opp-bg-rent",
    iconHex: "#5959F4",
  },
  sell: {
    icon: SellIcon,
    bareIcon: SellIconBare,
    color: "bg-opportunity-sell",
    lightBg: "bg-opp-bg-sell",
    textColor: "text-opportunity-sell",
    label: "Sell",
    tokenColor: "var(--terracota-600)",
    alphaBg: "var(--alpha-terracota-16)",
    badgeClasses: "bg-opp-bg-sell",
    iconHex: "#DB6638",
  },
  lease: {
    icon: LeaseIcon,
    bareIcon: LeaseIconBare,
    color: "bg-opportunity-lease",
    lightBg: "bg-opp-bg-lease",
    textColor: "text-opportunity-lease",
    label: "Lease",
    tokenColor: "var(--orchid-600)",
    alphaBg: "var(--alpha-orchid-16)",
    badgeClasses: "bg-opp-bg-lease",
    iconHex: "#CD52C3",
  },
  mortgage: {
    icon: MortgageIcon,
    bareIcon: null,
    color: "bg-opportunity-mortgage",
    lightBg: "bg-opp-bg-mortgage",
    textColor: "text-opportunity-mortgage",
    label: "Mortgage",
    tokenColor: "var(--olive-600)",
    alphaBg: "var(--alpha-olive-16)",
    badgeClasses: "bg-opp-bg-mortgage",
    iconHex: "#8CA875",
  },
};

export function OpportunityIcon({ type, className, iconClassName, showBackground = true, bare = false }: OpportunityIconProps) {
  const config = opportunityConfig[type];
  const IconSrc = bare && config.bareIcon ? config.bareIcon : config.icon;

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
