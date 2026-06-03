/**
 * @huspy/design-system · Tailwind preset
 * Both apps extend this so utility classes resolve to Huspy DS tokens.
 *
 *   // apps/karvel/tailwind.config.ts
 *   import huspyPreset from "@huspy/design-system/tailwind-preset";
 *   export default {
 *     presets: [huspyPreset],
 *     content: [...],
 *   } satisfies Config;
 *
 * The shadcn HSL mappings (--primary, --border, …) keep working because
 * shadcn-bridge.css defines those vars. This preset adds the Huspy-native
 * scales (opportunity hues, status tiers, radii, fonts) on top.
 */
module.exports = {
  darkMode: ["class"],
  theme: {
    extend: {
      fontFamily: {
        // Figtree ships locally via @font-face in tokens.css
        sans: ["Figtree", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // --- shadcn bridge (HSL triplet vars) ---
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },

        // --- status tiers: the ONLY colours a state may use ---
        tier: {
          success: { DEFAULT: "hsl(var(--tier-success-fg))", bg: "hsl(var(--tier-success-bg))" },
          info:    { DEFAULT: "hsl(var(--tier-info-fg))",    bg: "hsl(var(--tier-info-bg))" },
          warning: { DEFAULT: "hsl(var(--tier-warning-fg))", bg: "hsl(var(--tier-warning-bg))" },
          danger:  { DEFAULT: "hsl(var(--tier-danger-fg))",  bg: "hsl(var(--tier-danger-bg))" },
          neutral: { DEFAULT: "hsl(var(--tier-neutral-fg))", bg: "hsl(var(--tier-neutral-bg))" },
        },

        // --- opportunity hues: VERTICALS only, never status (hex tokens) ---
        opportunity: {
          buy: "var(--teal-600)",
          sell: "var(--terracota-600)",
          rent: "var(--indigo-600)",
          lease: "var(--orchid-600)",
          mortgage: "var(--olive-600)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        card: "var(--radius-md)", // 16px — Huspy card default
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
