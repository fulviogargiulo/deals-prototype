# Huspy Deals Monorepo

This monorepo contains the applications and shared logic for Huspy Deals.

## Applications

- **[Karvel (Deals Management)](apps/karvel/)**: Internal back-office application used by Operations and Finance for managing deal pipelines, P&L, invoices, and payments.
- **[Agent App (Deals on H2-Web)](apps/agent-app/)**: External-facing application for independent agents to track deals, payment status, and interactions.

## Packages

- **[Shared Domain](packages/shared-domain/)**: Canonical TypeScript types, enums, and data models shared across both apps to ensure structural consistency.

## Setup & Development

This repository uses **pnpm** as its package manager to support isolated workspaces.

### 1. Installation

```bash
# If you don't have pnpm installed globally
corepack enable && corepack prepare pnpm@latest --activate

# Install all dependencies across apps and packages
pnpm install
```

### 2. Running Applications

You can start the development server for each application independently from the root of the repository:

```bash
# Start Karvel on port 8080
pnpm dev:karvel

# Start Agent App on port 8081
pnpm dev:agent
```

### 3. Build & Test

```bash
# Run tests across the workspace
pnpm test

# Build all applications
pnpm build
```

## Documentation

Each application contains its own localized documentation (e.g., `CODEBASE_MAP.md` and `NEXT_STEPS.md`) in its respective directory.
