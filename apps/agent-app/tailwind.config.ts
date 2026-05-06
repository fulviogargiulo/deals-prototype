import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Figtree', 'sans-serif'],
      },
      fontSize: {
        'tiny': ['10px', { lineHeight: '1.4' }],
        'xs': ['12px', { lineHeight: '1.4' }],
        'sm': ['14px', { lineHeight: '1.4' }],
        'base': ['16px', { lineHeight: '1.4' }],
        'lg': ['18px', { lineHeight: '1.2' }],
        'xl': ['20px', { lineHeight: '1.2' }],
        '2xl': ['24px', { lineHeight: '1.2' }],
        '3xl': ['28px', { lineHeight: '1.2' }],
        '4xl': ['32px', { lineHeight: '1.2' }],
        '5xl': ['48px', { lineHeight: '1.2' }],
        '6xl': ['72px', { lineHeight: '1.2' }],
      },
      lineHeight: {
        'heading': '1.2',
        'body': '1.4',
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        "background-card": "hsl(var(--background-card))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        surface: {
          1: "hsl(var(--surface-1))",
          2: "hsl(var(--surface-2))", 
          3: "hsl(var(--surface-3))",
          4: "hsl(var(--surface-4))",
        },
        huspy: {
          buy: "hsl(var(--huspy-buy))",
          "buy-foreground": "hsl(var(--huspy-buy-foreground))",
          rent: "hsl(var(--huspy-rent))",
          "rent-foreground": "hsl(var(--huspy-rent-foreground))",
          sell: "hsl(var(--huspy-sell))",
          "sell-foreground": "hsl(var(--huspy-sell-foreground))",
          lease: "hsl(var(--huspy-lease))",
          "lease-foreground": "hsl(var(--huspy-lease-foreground))",
          mortgage: "hsl(var(--huspy-mortgage))",
          "mortgage-foreground": "hsl(var(--huspy-mortgage-foreground))",
        },
        status: {
          new: "hsl(var(--status-new))",
          "new-foreground": "hsl(var(--status-new-foreground))",
          qualified: "hsl(var(--status-qualified))",
          "qualified-foreground": "hsl(var(--status-qualified-foreground))",
          active: "hsl(var(--status-active))",
          "active-foreground": "hsl(var(--status-active-foreground))",
          "under-offer": "hsl(var(--status-under-offer))",
          "under-offer-foreground": "hsl(var(--status-under-offer-foreground))",
          closed: "hsl(var(--status-closed))",
          "closed-foreground": "hsl(var(--status-closed-foreground))",
        },
        pending: "hsl(var(--pending))",
        "pending-foreground": "hsl(var(--pending-foreground))",
        verified: "hsl(var(--verified))",
        "verified-foreground": "hsl(var(--verified-foreground))",
        "update-count": "hsl(var(--update-count))",
        "update-count-foreground": "hsl(var(--update-count-foreground))",
        "portal-badge": "hsl(var(--portal-badge))",
        "portal-badge-foreground": "hsl(var(--portal-badge-foreground))",
        warning: "hsl(var(--warning))",
        "warning-foreground": "hsl(var(--warning-foreground))",
        missing: "hsl(var(--missing))",
        "avatar-bg": "hsl(var(--avatar-bg))",
        "avatar-foreground": "hsl(var(--avatar-foreground))",
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
        nav: {
          active: "hsl(var(--nav-active))",
          "active-icon": "hsl(var(--nav-active-icon))",
        },
        // Design System Colors
        ds: {
          green: "hsl(var(--ds-green))",
          orange: "hsl(var(--ds-orange))",
          red: "hsl(var(--ds-red))",
        },
        "accent-ds": {
          teal: "hsl(var(--accent-teal))",
          terracotta: "hsl(var(--accent-terracotta))",
          indigo: "hsl(var(--accent-indigo))",
          orchid: "hsl(var(--accent-orchid))",
          olive: "hsl(var(--accent-olive))",
        },
        portal: {
          idealista: "hsl(var(--portal-idealista))",
          fotocasa: "hsl(var(--portal-fotocasa))",
          pisos: "hsl(var(--portal-pisos))",
        },
        "surface-ds": {
          page: "hsl(var(--surface-page))",
          "page-dark": "hsl(var(--surface-page-dark))",
          widget: "hsl(var(--surface-widget))",
          raised: "hsl(var(--surface-raised))",
          accent: "hsl(var(--surface-accent))",
        },
        fg: {
          primary: "hsl(var(--fg-primary))",
          secondary: "hsl(var(--fg-secondary))",
          disabled: "hsl(var(--fg-disabled))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0", opacity: "0" },
          to: { height: "var(--radix-accordion-content-height)", opacity: "1" }
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)", opacity: "1" },
          to: { height: "0", opacity: "0" }
        },
        "collapsible-down": {
          from: { height: "0", opacity: "0" },
          to: { height: "var(--radix-collapsible-content-height)", opacity: "1" }
        },
        "collapsible-up": {
          from: { height: "var(--radix-collapsible-content-height)", opacity: "1" },
          to: { height: "0", opacity: "0" }
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" }
        },
        "fade-out-only": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" }
        },
        "scale-in": {
          "0%": {
            transform: "scale(0.95)",
            opacity: "0"
          },
          "100%": {
            transform: "scale(1)",
            opacity: "1"
          }
        },
        "scale-in-fluid": {
          "0%": {
            transform: "scale(0.92)",
            opacity: "0"
          },
          "100%": {
            transform: "scale(1)",
            opacity: "1"
          }
        },
        "scale-out": {
          from: { transform: "scale(1)", opacity: "1" },
          to: { transform: "scale(0.95)", opacity: "0" }
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" }
        },
        "slide-out-right": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(100%)" }
        },
        "slide-in-left": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" }
        },
        "slide-out-left": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-100%)" }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "collapsible-down": "collapsible-down 0.2s ease-out",
        "collapsible-up": "collapsible-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out forwards",
        "fade-in-fast": "fade-in 0.5s ease-out forwards",
        "fade-in-slow": "fade-in 1.5s ease-out forwards",
        "fade-in-up": "fade-in-up 0.3s ease-out forwards",
        "fade-out": "fade-out 0.3s ease-out forwards",
        "fade-in-only": "fade-in-only 0.2s ease-out forwards",
        "fade-out-only": "fade-out-only 0.2s ease-out forwards",
        "scale-in": "scale-in 0.2s ease-out forwards",
        "scale-in-slow": "scale-in 1.5s ease-out forwards",
        "scale-out": "scale-out 0.2s ease-out forwards",
        "slide-in-right": "slide-in-right 0.3s ease-out forwards",
        "slide-out-right": "slide-out-right 0.3s ease-out forwards",
        "slide-in-left": "slide-in-left 0.3s ease-out forwards",
        "slide-out-left": "slide-out-left 0.3s ease-out forwards",
        "enter": "fade-in 0.3s ease-out forwards",
        "exit": "fade-out 0.3s ease-out forwards"
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/container-queries"),
  ],
} satisfies Config;
