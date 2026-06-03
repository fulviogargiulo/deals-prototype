import type { DealStatus } from "./enums";

export type StatusTier = "success" | "info" | "warning" | "danger" | "neutral";

export function statusTier(status: DealStatus): StatusTier {
  switch (status) {
    case "pending-details":        return "neutral";
    case "under-review":           return "info";
    case "pending-agent-approval": return "warning";
    case "invoicing":              return "info";
    case "finalized":              return "success";
    case "canceled":               return "danger";
  }
}

/** Legacy HSL color map — used by agent-app for inline styles. Karvel uses tier tokens instead. */
export const dealStatusColors: Record<DealStatus, { hsl: string }> = {
  "pending-details":        { hsl: "0 0% 50%" },
  "under-review":           { hsl: "216 92% 42%" },
  "pending-agent-approval": { hsl: "36 82% 36%" },
  "invoicing":              { hsl: "216 80% 45%" },
  "finalized":              { hsl: "165 84% 30%" },
  "canceled":               { hsl: "349 56% 37%" },
};
