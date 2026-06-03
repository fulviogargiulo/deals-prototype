# @huspy/design-system — agent guide

The single source of truth for Huspy's visual language. Everything visual in
both apps resolves here. **Adding a raw hex/font/radius anywhere else is a bug.**

## Files
- `tokens.css` — 437 DS custom properties (colours, type, radii, spacing, shadows) + Figtree `@font-face`. Generated from Figma tokens; treat as generated — regenerate, don't hand-edit values.
- `shadcn-bridge.css` — maps shadcn's HSL triplet vars (`--primary`, `--border`, …) onto the tokens, so Karvel's existing shadcn components reskin with no component edits. **The only place a raw `H S% L%` triplet may live.** Keep it in sync with `tokens.css`.
- `tailwind-preset.cjs` — shared Tailwind theme. Both apps `presets: [huspyPreset]`.
- `index.ts` — `StatusTier` type + `tierClasses` helper.

## How an app consumes it
```css
/* src/index.css — order matters, both inside @layer base */
@import "@huspy/design-system/tokens.css";
@import "@huspy/design-system/shadcn-bridge.css";
```
```ts
// tailwind.config.ts
import huspyPreset from "@huspy/design-system/tailwind-preset";
export default { presets: [huspyPreset], content: [...] } satisfies Config;
```

## Rules when extending
- **New colour?** Almost certainly no. Use an existing token. New tokens come from the Figma source, not invented here.
- **Status colours** are the five `--tier-*` pairs. Never add a per-status hue. The `--deal-*` / `--type-*` / `--status-*` rainbow that used to live in Karvel is **deleted** — see the deny-list comment in `shadcn-bridge.css`.
- **Opportunity hues** (`--teal/terracota/indigo/orchid/olive-*`) are for verticals only.
- **Radii:** buttons 12px (`--radius-sm`), cards 16px (`--radius-md`), hero 20–24px. Chips/avatars `--radius-full`.
- **Borders over shadows.** 1px `--grey-150` to group; `--shadow-sm` only when an element must float (menus, sticky bars).
- **Type:** Figtree 400/500/600. Semibold (600) is the headline weight — never 700+ for UI. Sentence case.
