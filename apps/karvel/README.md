# Deals Management on Karvel

Internal back-office application used by Operations and Finance for managing deal pipelines, P&L, invoices, and payments.

## Architecture

- **Framework**: React 18 + Vite + TypeScript
- **Routing**: `react-router-dom`
- **UI**: shadcn/ui + Radix + Tailwind CSS
- **State**: Module-level store (planned migration to React Context / Zustand)

## Development

This application is part of the Huspy Deals monorepo. It relies on the `@huspy/shared-domain` package for core data types.

To start the development server, run the following from the **monorepo root**:

```bash
pnpm dev:karvel
```

The application will be available at `http://localhost:8080`.

## Documentation

- `CODEBASE_MAP.md`: Overview of the folder structure and components.
- `NEXT_STEPS.md`: Tracked technical debt, required refactors, and future feature planning.
