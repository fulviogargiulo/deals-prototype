/**
 * @huspy/design-system
 *
 * The single source of truth for Huspy's visual language across all Deals apps.
 *
 * CSS (import once per app, in this order):
 *   @import "@huspy/design-system/tokens.css";        // 437 DS tokens
 *   @import "@huspy/design-system/shadcn-bridge.css";  // maps shadcn HSL vars → tokens
 *
 * Tailwind:
 *   import huspyPreset from "@huspy/design-system/tailwind-preset";
 *   export default { presets: [huspyPreset], content: [...] };
 *
 * Status colour rule:
 *   A deal/tranche STATE may only ever render in one of five tiers.
 *   Resolve the tier with statusTier() (lives in @huspy/shared-domain,
 *   next to the DealStatus enum) and map to the --tier-* / `tier-*`
 *   Tailwind colours. Never hard-code a hue on a status.
 *
 *   Opportunity hues (teal/terracota/indigo/orchid/olive) are for VERTICALS
 *   (buy/sell/rent/lease/mortgage) only — never for state.
 */

export type StatusTier = "success" | "info" | "warning" | "danger" | "neutral";

/** Tailwind class pair for a tier badge/pill. */
export const tierClasses: Record<StatusTier, string> = {
  success: "bg-tier-success-bg text-tier-success",
  info:    "bg-tier-info-bg text-tier-info",
  warning: "bg-tier-warning-bg text-tier-warning",
  danger:  "bg-tier-danger-bg text-tier-danger",
  neutral: "bg-tier-neutral-bg text-tier-neutral",
};

export {};
