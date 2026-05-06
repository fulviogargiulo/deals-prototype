# MONOREPO_PLAN — Karvel + Agent App

Read-only plan. **No file moves yet.**

## Assumptions to confirm before I touch anything

1. **Monorepo root = `/Users/fulviogargiulo/Documents/projects/`** (the current cwd; only the two app folders live here today). If you'd rather nest under a dedicated folder (e.g. `huspy-monorepo/`), say so before I start.
2. **`pnpm` is not installed** on this machine (`which pnpm` → not found). Will need `corepack enable && corepack prepare pnpm@latest --activate` (or `npm i -g pnpm`) before the install step. Node v24.15.0 is fine.
3. The two app folders are **not git repos** — moves will be plain `mv`, not `git mv`. If you want git history preserved, init repos before the move.

---

## 1. Current state of each app

### apps/karvel ← `Deals Management On Karvel/`

| | |
|---|---|
| Purpose | Internal back-office (Ops + Finance) — deal pipeline, P&L, invoices, payments |
| Framework | React 18.3.1 + Vite 5.4.19 (SWC) + TypeScript 5.8.3 |
| Routing | **react-router-dom ^6.30.1** |
| UI | shadcn/ui + Radix + Tailwind 3.4.17 |
| Charts | **recharts ^2.15.4** |
| Tests | **Vitest 3.2 + Testing Library + jsdom** (one placeholder test) |
| State | Module-level mutable `dealStore.ts` |
| Lovable cleanup | **Already done** (per [Deals Management On Karvel/NEXT_STEPS.md](Deals%20Management%20On%20Karvel/NEXT_STEPS.md) P0 items 1–2) |
| node_modules | Present (npm-installed) |
| Lockfile | `package-lock.json` |
| Dev port | 8080 |
| Package name | `vite_react_shadcn_ts` |

### apps/agent-app ← `Deals on H2-Web/`

| | |
|---|---|
| Purpose | External-facing app for independent agents — deals + payment status |
| Framework | React 18.3.1 + Vite 5.4.19 (SWC) + TypeScript 5.8.3 |
| Routing | **react-router-dom ^7.12.0** |
| UI | shadcn/ui + Radix + Tailwind 3.4.17 (+ `@tailwindcss/container-queries`, `@tailwindcss/typography`) |
| Charts | **recharts ^3.2.1** |
| Tests | None |
| State | DataContext + ScheduleContext + 4 other contexts |
| Lovable cleanup | **Just done** (this session) |
| Heavy extras | `framer-motion`, `mapbox-gl`, `leaflet`, `lottie-react`, `libphonenumber-js`, `react-pdf`, `react-easy-crop`, `react-is`, `embla-carousel-react`, `vaul`, `cmdk`, `input-otp`, `@types/leaflet`, `next-themes`, `date-fns` |
| node_modules | Present (npm-installed; **needs to be wiped** for pnpm) |
| Lockfile | `package-lock.json` |
| Dev port | 8080 (collides with karvel) |
| Package name | `vite_react_shadcn_ts` (collides with karvel) |

---

## 2. Dependency conflicts and resolution

pnpm's strict hoisting means each workspace package only resolves the deps it lists in its own `package.json` — different majors of the same package can coexist across apps without clashing. Resolutions below:

| Conflict | Karvel | Agent app | Resolution |
|---|---|---|---|
| **Package name** | `vite_react_shadcn_ts` | `vite_react_shadcn_ts` | Rename to `@huspy/karvel` and `@huspy/agent-app`. Required — pnpm workspace forbids duplicates. |
| **Dev port** | 8080 | 8080 | Keep karvel on 8080, change agent-app to **8081** in [apps/agent-app/vite.config.ts](Deals%20on%20H2-Web/vite.config.ts). |
| **react-router-dom** | ^6.30.1 | ^7.12.0 | Keep both at app-local versions. Don't unify yet — v6→v7 is a real upgrade with code changes; not in scope for the migration. |
| **recharts** | ^2.15.4 | ^3.2.1 | Same — keep at app-local versions. |
| **@types/node** | ^22.16.5 | ^25.5.0 | Keep at app-local versions. (Node v24 runtime is fine for both.) |
| **TypeScript / Vite / React / Tailwind / shadcn primitives** | identical or compatible minors | — | Will hoist naturally via pnpm. |
| **Tailwind plugins** | none | `@tailwindcss/container-queries`, `@tailwindcss/typography` | App-local — agent-app's [tailwind.config.ts](Deals%20on%20H2-Web/tailwind.config.ts) requires these. Keep there. |
| **Test stack** | Vitest in karvel only | — | Keep app-local. Don't add Vitest to agent-app yet. |

**No version of any dep needs to be downgraded or upgraded** as part of the migration. The two apps stay independent.

---

## 3. Exact folder moves and file changes

### Step A — Move and rename app folders

```
mv "Deals Management On Karvel"  apps/karvel
mv "Deals on H2-Web"             apps/agent-app
```

(After: `apps/karvel/` and `apps/agent-app/` both contain their full source trees, tsconfigs, vite configs, public/, src/, etc.)

### Step B — Per-app changes (minimal)

**[apps/karvel/package.json](Deals%20Management%20On%20Karvel/package.json)**
- `"name": "vite_react_shadcn_ts"` → `"name": "@huspy/karvel"`

**[apps/agent-app/package.json](Deals%20on%20H2-Web/package.json)**
- `"name": "vite_react_shadcn_ts"` → `"name": "@huspy/agent-app"`

**[apps/agent-app/vite.config.ts](Deals%20on%20H2-Web/vite.config.ts)**
- `port: 8080` → `port: 8081`

**Per-app cleanup (both apps)**
- Delete `apps/karvel/node_modules/` and `apps/agent-app/node_modules/` — pnpm will reinstall from the root.
- Delete `apps/karvel/package-lock.json` and `apps/agent-app/package-lock.json` — replaced by root `pnpm-lock.yaml`.

**Files NOT touched:**
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` per app — `@/*` → `./src/*` aliases stay scoped to each app.
- Each app's `.gitignore`, `README.md`, `index.html`, `tailwind.config.ts`, `postcss.config.js`, `eslint.config.js`, source tree.
- Each app's existing `CODEBASE_MAP.md` / `NEXT_STEPS.md` (per-app docs).

### Step C — New files at the monorepo root

```
/Users/fulviogargiulo/Documents/projects/
├── package.json                  ← NEW
├── pnpm-workspace.yaml           ← NEW
├── .npmrc                        ← NEW (optional, for hoisting/strictness)
├── .gitignore                    ← NEW (covers node_modules, dist, .turbo, etc.)
├── tsconfig.base.json            ← NEW (shared compiler defaults)
├── apps/
│   ├── karvel/                   (moved)
│   └── agent-app/                (moved)
└── packages/
    └── shared-domain/            ← NEW (skeleton, empty)
        ├── package.json
        ├── tsconfig.json
        └── src/index.ts
```

**Root `package.json`**
```json
{
  "name": "huspy-monorepo",
  "private": true,
  "packageManager": "pnpm@9.x",
  "scripts": {
    "dev:karvel":    "pnpm --filter @huspy/karvel dev",
    "dev:agent":     "pnpm --filter @huspy/agent-app dev",
    "build:karvel":  "pnpm --filter @huspy/karvel build",
    "build:agent":   "pnpm --filter @huspy/agent-app build",
    "build":         "pnpm -r build",
    "lint":          "pnpm -r lint",
    "test":          "pnpm -r test"
  }
}
```

**Root `pnpm-workspace.yaml`**
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

**`packages/shared-domain/package.json`**
```json
{
  "name": "@huspy/shared-domain",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
```
(Source-only export — no build step. Apps import via `import { … } from "@huspy/shared-domain"` once they declare `"@huspy/shared-domain": "workspace:*"` in their deps.)

**`packages/shared-domain/src/index.ts`** — empty placeholder export so TS doesn't choke:
```ts
export {};
```

**`packages/shared-domain/tsconfig.json`** — extends `tsconfig.base.json`.

**`tsconfig.base.json`** — non-binding shared compiler defaults; per-app tsconfigs `extends` it. (Apps keep their existing `paths` + `strictNullChecks: false` until you decide to tighten them globally.)

**`.npmrc`**
```
node-linker=isolated
strict-peer-dependencies=false
```

---

## 4. Running each app independently after the migration

```bash
# one-time
corepack enable && corepack prepare pnpm@latest --activate
pnpm install                       # at the monorepo root

# karvel only
pnpm dev:karvel                    # → http://localhost:8080
# or:  pnpm --filter @huspy/karvel dev

# agent-app only
pnpm dev:agent                     # → http://localhost:8081
# or:  pnpm --filter @huspy/agent-app dev

# both (in separate terminals)
pnpm dev:karvel
pnpm dev:agent

# build / test / lint a single app
pnpm --filter @huspy/karvel build
pnpm --filter @huspy/karvel test
pnpm --filter @huspy/agent-app build
```

Each app keeps its own dev/build/lint/test scripts in its own `package.json` — the root scripts are pure delegations via `--filter`. Independent release cadences are preserved.

---

## 5. Risks and what could break

| # | Risk | Likelihood | Mitigation |
|---|---|---|---|
| 1 | **pnpm not installed** — install step blocks before anything else works | High | Install via corepack first; verify `pnpm --version` before moving folders. |
| 2 | **node_modules / lockfile remnants** — agent-app has 425 npm-installed packages from this session; karvel has its own | High | Delete both `node_modules/` and both `package-lock.json` before `pnpm install`. |
| 3 | **Folder renames break absolute path references** in source files | Low | I checked: all imports use `@/*` (relative to each app's `src/`), no hardcoded paths to `Deals on H2-Web` / `Deals Management On Karvel`. |
| 4 | **Port collision** if you forget to change agent-app to 8081 and run both `dev` together | Med | Plan changes the port up front; documented above. |
| 5 | **pnpm's strict resolution surfaces hidden peer-dep issues** that npm's flat node_modules was hiding | Med | `strict-peer-dependencies=false` in `.npmrc` mutes warnings; if real breakage occurs it'll show as a missing module at dev-server boot. |
| 6 | **Vitest in karvel** uses jsdom and Testing Library — these resolve from app-local deps and should "just work" under pnpm | Low | Run `pnpm --filter @huspy/karvel test` immediately after install to confirm. |
| 7 | **Folder names with spaces** (current state) survive `mv` fine, but any external tool config (VS Code workspace files, shell history) referencing the old paths will be stale | Low | Heads-up only. |
| 8 | **TypeScript `paths` in tsconfigs** still resolve `@/*` per app. shared-domain isn't in any app's `paths`, so it'll only work after each app declares the workspace dep | Low | Plan does this only when the app actually imports from shared-domain — initially shared-domain is unused. |
| 9 | **`react-is` 19.x in agent-app** alongside `react` 18.x — odd but pnpm tolerates; was already the case under npm | Low | Out of scope for the migration. Flagged in agent-app's NEXT_STEPS as a separate cleanup. |
| 10 | **The two pre-existing `CODEBASE_MAP.md` / `NEXT_STEPS.md` files inside each app** stay where they are (now `apps/karvel/CODEBASE_MAP.md` and `apps/agent-app/CODEBASE_MAP.md`) | — | Intentional. The root-level [MONOREPO_PLAN.md](MONOREPO_PLAN.md) covers the workspace; per-app docs cover each app. |

---

## What happens after you approve

I'll execute Steps A→C in order, run `pnpm install` from the root, then verify both apps boot independently:
- `pnpm dev:karvel` returns 200 at `localhost:8080`
- `pnpm dev:agent` returns 200 at `localhost:8081`
- `pnpm --filter @huspy/karvel test` runs the existing placeholder Vitest suite

If anything fails, I'll stop and report — won't try to fix in flight.
