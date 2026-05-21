import { DealStatus } from "./enums";

// HSL triplets without the hsl() wrapper so consumers can compose with opacity:
// hsl(${token.hsl})          → solid color
// hsl(${token.hsl} / 0.1)   → 10% tint background

export interface DealStatusColor {
  hsl: string;
}

export const dealStatusColors: Record<DealStatus, DealStatusColor> = {
  "pending-details":        { hsl: "38 85% 51%" },   // orange
  "under-review":           { hsl: "262 50% 52%" },  // purple
  "pending-agent-approval": { hsl: "205 75% 48%" },  // sky blue
  "invoicing":              { hsl: "176 55% 38%" },  // teal
  finalized:                { hsl: "152 60% 40%" },  // green
  canceled:                 { hsl: "0 0% 50%" },     // muted gray
};
