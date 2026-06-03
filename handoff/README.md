# Deals — design-system handoff

Drop-in scaffold that gives Claude Code (and humans) a permanent, enforceable
reference to the Huspy design system. Mirrors your repo layout — copy each path
to the matching place in the monorepo.

```
CLAUDE.md                              → /CLAUDE.md          (root rulebook, auto-loaded)
packages/design-system/                → /packages/design-system/   (new workspace pkg)
  package.json                            @huspy/design-system
  tokens.css                              437 DS tokens + Figtree @font-face
  shadcn-bridge.css                       maps shadcn HSL vars → tokens (the reskin keystone)
  tailwind-preset.cjs                     shared Tailwind theme
  index.ts                                StatusTier type + tierClasses helper
  CLAUDE.md                               how to extend the DS
apps/karvel/CLAUDE.md                  → /apps/karvel/CLAUDE.md      (Karvel conventions)
apps/karvel/src/index.css              → REPLACES the current file   (migrated: imports DS, drops navy/Inter/rainbow)
```

## Install (≈10 min)

1. **Copy the tree** into the monorepo at the paths above. `pnpm-workspace.yaml` already globs `packages/*`, so the package is picked up automatically.
2. **Add the dep** to each app's `package.json`:
   ```jsonc
   "dependencies": { "@huspy/design-system": "workspace:*" }
   ```
   then `pnpm install`.
3. **Fonts/icons (optional but recommended):** copy the Figtree TTFs into
   `packages/design-system/fonts/` and the SVG set into `packages/design-system/icons/`
   so nothing is fetched at runtime. `tokens.css` already references the local fonts.
4. **Wire Tailwind** in `apps/karvel/tailwind.config.ts` (and the agent app):
   ```ts
   import huspyPreset from "@huspy/design-system/tailwind-preset";
   export default { presets: [huspyPreset], content: [...] } satisfies Config;
   ```
   Remove the now-duplicated `theme.extend.colors` rainbow from the app config —
   the preset owns it.
5. **Use the migrated `index.css`** (provided) in place of Karvel's current one.
6. `pnpm build && pnpm test` — confirm both apps build and `waterfall.test.ts` is green.

## Why two layers
- The **package** makes tokens importable and enforceable at build time — the navy/Inter drift literally can't return once the app reads its theme from here.
- The **`CLAUDE.md` files** make the agent reach for it by default. Claude Code auto-loads the root one every session and the nested ones when working in a subtree.

One without the other drifts: tokens with no instruction get ignored; instruction with no package has nothing concrete to point at.

## Next (the actual refactor)
This is **Task 0** of the build prompt in `Deals UX Review.html`. Once it's in,
run Tasks 1–6 from that prompt (status tiers at the source, deal-vs-tranche
scoping, honest stepper, true waterfall, less chrome) — they all assume this
package exists.
