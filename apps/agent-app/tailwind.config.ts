import type { Config } from "tailwindcss";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const huspyPreset = require("@huspy/design-system/tailwind-preset");

export default {
  darkMode: ["class"],
  presets: [huspyPreset],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        sans: ['Figtree', 'sans-serif'],
      },
      fontSize: {
        'tiny': ['10px', { lineHeight: '1.4' }],
        'xs':   ['12px', { lineHeight: '1.4' }],
        'sm':   ['14px', { lineHeight: '1.4' }],
        'base': ['16px', { lineHeight: '1.4' }],
        'lg':   ['18px', { lineHeight: '1.2' }],
        'xl':   ['20px', { lineHeight: '1.2' }],
        '2xl':  ['24px', { lineHeight: '1.2' }],
        '3xl':  ['28px', { lineHeight: '1.2' }],
        '4xl':  ['32px', { lineHeight: '1.2' }],
        '5xl':  ['48px', { lineHeight: '1.2' }],
        '6xl':  ['72px', { lineHeight: '1.2' }],
      },
      lineHeight: {
        'heading': '1.2',
        'body': '1.4',
      },
      colors: {
        // nav tab active state
        nav: {
          active: "hsl(var(--background))",
          "active-icon": "hsl(var(--foreground))",
        },
        // opportunity alpha-16 backgrounds — pair with opportunity.* foregrounds
        "opp-bg": {
          buy:      "var(--alpha-teal-16)",
          sell:     "var(--alpha-terracota-16)",
          rent:     "var(--alpha-indigo-16)",
          lease:    "var(--alpha-orchid-16)",
          mortgage: "var(--alpha-olive-16)",
        },
        // External listing portal brand colours — not part of the DS palette
        portal: {
          idealista: "hsl(65, 85%, 70%)",
          fotocasa:  "hsl(236, 54%, 43%)",
          pisos:     "hsl(194, 74%, 58%)",
          badge:     "hsl(45, 93%, 70%)",
          "badge-foreground": "hsl(30, 40%, 15%)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        card: "var(--radius-md)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0", opacity: "0" },
          to:   { height: "var(--radix-accordion-content-height)", opacity: "1" }
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)", opacity: "1" },
          to:   { height: "0", opacity: "0" }
        },
        "collapsible-down": {
          from: { height: "0", opacity: "0" },
          to:   { height: "var(--radix-collapsible-content-height)", opacity: "1" }
        },
        "collapsible-up": {
          from: { height: "var(--radix-collapsible-content-height)", opacity: "1" },
          to:   { height: "0", opacity: "0" }
        },
        "fade-in":       { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        "fade-in-up":    { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "fade-out":      { "0%": { opacity: "1" }, "100%": { opacity: "0" } },
        "fade-out-only": { "0%": { opacity: "1" }, "100%": { opacity: "0" } },
        "scale-in":      { "0%": { transform: "scale(0.95)", opacity: "0" }, "100%": { transform: "scale(1)", opacity: "1" } },
        "scale-in-fluid":{ "0%": { transform: "scale(0.92)", opacity: "0" }, "100%": { transform: "scale(1)", opacity: "1" } },
        "scale-out":     { from: { transform: "scale(1)", opacity: "1" }, to: { transform: "scale(0.95)", opacity: "0" } },
        "slide-in-right":  { "0%": { transform: "translateX(100%)" }, "100%": { transform: "translateX(0)" } },
        "slide-out-right": { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(100%)" } },
        "slide-in-left":   { "0%": { transform: "translateX(-100%)" }, "100%": { transform: "translateX(0)" } },
        "slide-out-left":  { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-100%)" } },
      },
      animation: {
        "accordion-down":    "accordion-down 0.2s ease-out",
        "accordion-up":      "accordion-up 0.2s ease-out",
        "collapsible-down":  "collapsible-down 0.2s ease-out",
        "collapsible-up":    "collapsible-up 0.2s ease-out",
        "fade-in":           "fade-in 0.2s ease-out forwards",
        "fade-in-fast":      "fade-in 0.5s ease-out forwards",
        "fade-in-slow":      "fade-in 1.5s ease-out forwards",
        "fade-in-up":        "fade-in-up 0.3s ease-out forwards",
        "fade-out":          "fade-out 0.3s ease-out forwards",
        "fade-in-only":      "fade-in-only 0.2s ease-out forwards",
        "fade-out-only":     "fade-out-only 0.2s ease-out forwards",
        "scale-in":          "scale-in 0.2s ease-out forwards",
        "scale-in-slow":     "scale-in 1.5s ease-out forwards",
        "scale-out":         "scale-out 0.2s ease-out forwards",
        "slide-in-right":    "slide-in-right 0.3s ease-out forwards",
        "slide-out-right":   "slide-out-right 0.3s ease-out forwards",
        "slide-in-left":     "slide-in-left 0.3s ease-out forwards",
        "slide-out-left":    "slide-out-left 0.3s ease-out forwards",
        "enter":             "fade-in 0.3s ease-out forwards",
        "exit":              "fade-out 0.3s ease-out forwards",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/container-queries"),
  ],
} satisfies Config;
