# Larn Remake frontend

The React and TypeScript application uses Vite, Tailwind CSS, shadcn/ui, and Lucide icons. Dungeon generation and exploration currently run in the frontend.

Install dependencies from the repository root with `pnpm install`. From this directory:

```bash
pnpm dev          # Start the development server
pnpm test        # Run Vitest in watch mode
pnpm test:run    # Run the full test suite once
pnpm check       # Check formatting and lint with Biome
pnpm check:fix   # Apply Biome fixes
pnpm typecheck   # Check application, test, and tooling types
pnpm build       # Typecheck and create a production build
pnpm preview     # Preview the production build
```

The development server proxies `/initial` to the backend at `http://localhost:8080`. Dungeon exploration remains available when the backend is offline.

See the [repository README](../README.md) for backend setup, controls, configuration, testing conventions, and the project’s development approach.
