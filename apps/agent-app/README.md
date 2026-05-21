# Deals on H2-Web (Agent App)

External-facing application for independent agents to track deals, payment status, and interactions.

## Architecture

- **Framework**: React 18 + Vite + TypeScript
- **Routing**: `react-router-dom`
- **UI**: shadcn/ui + Tailwind CSS (plus `@tailwindcss/container-queries`, `@tailwindcss/typography`)
- **State**: Multiple React Contexts (DataContext, ScheduleContext)

## Development

This application is part of the Huspy Deals monorepo. It relies on the `@huspy/shared-domain` package for core data types.

To start the development server, run the following from the **monorepo root**:

```bash
pnpm dev:agent
```

The application will be available at `http://localhost:8081`.

## Documentation

- `CODEBASE_MAP.md`: Overview of the folder structure and components.
- `NEXT_STEPS.md`: Tracked technical debt, required refactors, and future feature planning.
