# Larn Remake

A small remake and reimagining of the classic roguelike **Larn**, built as a software-engineering and test-driven development practice project.

The repository is a monorepo with a Spring Boot backend and a React/TypeScript frontend. Development is organized into small stories so game behavior can be designed, tested, and implemented incrementally.

## Current functionality

The application currently includes:

- A Spring Boot API with an initial frontend/backend connectivity endpoint.
- A React interface that displays a generated, connected dungeon.
- A player who starts on a valid floor tile inside a generated room.
- Keyboard movement using the arrow keys or WASD.
- Collision rules that prevent movement into walls or outside dungeon bounds.
- Configurable dungeon creation with rectangular dimensions.
- Binary space partitioning that divides dungeon space into terminal regions.
- Rooms carved into terminal regions and corridors connecting those rooms.
- Three-floor exploration with automatic stair transitions and a depth display.
- Current run seed display and replay of the complete dungeon from an entered seed.
- A compact play screen using Tailwind CSS and shadcn/ui (Base UI, Nova), with styled controls, a tile legend, and scrollable dungeon tiles.

The playable run is generated in the frontend when the page loads. By default it contains three rectangular floors. Terrain and stair links are retained throughout exploration and ordinary React rerenders. The earlier fixed dungeon remains available as a test fixture.

Stair placement uses an independent seeded random source for each floor, derived from the run seed, floor number, and a `stairs` namespace. Down stairs choose equally among rooms outside the entry room, then choose a floor tile within that room. Up stairs stay at the floor entry, with reciprocal arrival coordinates. A single-room floor uses its center when distinct from the entry, otherwise its first distinct floor tile in row-major order; a floor with no distinct location fails clearly. The same seed and configuration reproduce the links regardless of floor generation or connection order, without changing terrain generation. Calls to the stair selector without a random source retain the deterministic last-room-center rule.

## Repository layout

```text
larn-remake/
├── backend/                  # Spring Boot API
├── frontend/                 # React + TypeScript application
│   └── src/
│       ├── Corridor.ts      # Corridor creation and connections
│       ├── DungeonLayout.tsx # Dungeon rendering and player movement
│       ├── DungeonRun.ts    # Run state, floor seeds, stair links, and transitions
│       ├── LayoutTiles.ts   # Dungeon generation and player start
│       ├── Partitioning.ts  # Region splitting and recursive BSP
│       ├── Room.ts          # Room creation and assignment
│       └── __tests__/       # Frontend and domain tests
├── docs/                     # Definition of Done and AI working agreement
└── README.md
```

## Prerequisites

- Java 21
- Node.js
- pnpm 11.25.0

## Install dependencies

From the repository root:

```bash
pnpm install
```

## Run the application

The backend and frontend currently run as separate development processes.

Start the backend from `backend/`:

```bash
./gradlew bootRun
```

On Windows:

```powershell
.\gradlew.bat bootRun
```

Then start the frontend from the repository root:

```bash
pnpm frontend:dev
```

Vite serves the frontend and proxies `/initial` requests to the backend at `http://localhost:8080`.

## Controls

The header shows the current floor, **New Dungeon**, and **Settings**. The map and its legend occupy the main play area. Settings opens a modal side panel containing the current seed and seed replay form. A small footer shows the backend connectivity diagnostic. Exploration runs in the frontend and remains available if that check fails.

Shared shadcn styling and theme tokens live in `frontend/src/App.css`, imported by `App.tsx`. Page layout uses Tailwind utilities, and reusable controls live in `frontend/src/components/ui`. A [Light/Dark/System preference](https://github.com/danielgebhardt/larn-remake/issues/42) is planned next.

Move the player with either control scheme:

| Direction | Arrow key | Letter key |
| --- | --- | --- |
| Up | ↑ | W |
| Down | ↓ | S |
| Left | ← | A |
| Right | → | D |

The player can move through rooms and corridors but cannot move through wall tiles or beyond the dungeon boundary.

Tiles use gray brick walls, faint floor dots, and a red player from Lucide, plus custom amber staircase silhouettes. Steps rising from left to right indicate up stairs; steps falling from left to right indicate down stairs. The player icon covers a stair while occupying it; the stair reappears after moving away. Icon choices, colors, and accessible labels are centralized in `frontend/src/TileVisuals.ts`; the custom SVGs live in `frontend/src/StairIcons.tsx`.

A compact legend above the map identifies the player and both stair directions. Map tiles stay square at 24×24 pixels. Scroll within the map to explore portions outside the viewport; the map container is capped at 70% of the window height. Keyboard users can focus the map and use Page Up/Page Down for vertical scrolling; arrow keys and WASD continue to move the player.

Stepping onto a stair automatically changes floors. The depth heading shows the current floor and total floor count.

To replay a dungeon, open **Settings**, enter a seed in **Dungeon seed**, and select **Start from seed** or press Enter. Seed input accepts decimal whole numbers from `0` to `4294967295`; surrounding whitespace and leading zeroes are normalized. Replay starts on floor 1 and reproduces every floor and stair link for the same generation configuration. Successful replay closes settings; invalid input keeps the panel open with an accessible error and leaves the run intact.

Settings focuses the seed input when opened and contains keyboard focus while open. Game movement and stair transitions are suspended throughout the panel. Use Escape or **Close** to dismiss it without applying a draft; focus returns to the Settings button and game controls resume. Opening, closing, or editing settings does not regenerate the dungeon. Unsubmitted drafts are retained during this session; **New Dungeon** resets the draft and feedback to match the new run.

**New Dungeon** requests a random seed across that same range and replaces the entire run: all floors and stair links, depth, and player position. It returns the player to floor 1 at the new run's selected start. The displayed seed and input update to the new seed. A random seed can repeat; restarting still resets exploration, including when the seed repeats.

To demonstrate the exploration milestone:

1. Note the displayed seed and explore toward a descending staircase to descend from floor 1 to floor 2, then floor 3.
2. Step onto an ascending staircase to return through the same floors to floor 1. Arrival places the player on the matching stair; move away and step back onto it to use it again.
3. Open **Settings**, enter the noted seed, and start from it to recreate the complete run at its original start.
4. Select **New Dungeon**, then explore again. Subsequent transitions use the new run's floors.

Floor 1 has no up stair, and the deepest floor has no down stair. The domain supports configurable floor counts, including a one-floor run with no transitions; the current UI uses three floors. Town, monsters, combat, inventory, and persistence belong to later work.

## Testing and quality checks

Run frontend formatting and lint checks:

```bash
pnpm frontend:check
```

Run strict TypeScript checks for application code, tests, and Vite configuration:

```bash
pnpm frontend:typecheck
```

Apply Biome fixes explicitly:

```bash
pnpm frontend:check:fix
```

Run the frontend test suite once:

```bash
pnpm frontend:test
```

Create a production frontend build:

```bash
pnpm frontend:build
```

Run backend tests from `backend/`:

```bash
./gradlew test
```

On Windows:

```powershell
.\gradlew.bat test
```

## Technology

### Backend

- Java 21
- Spring Boot 4.1.1
- Gradle 9.7.1 wrapper configuration
- Spring Web MVC
- Spring Validation
- JUnit Platform

### Frontend

- React 19
- TypeScript 6
- Vite 8
- Tailwind CSS 4
- Vitest
- React Testing Library
- Mock Service Worker
- Biome
- pnpm workspaces

## Git hooks

Husky runs the following pre-commit workflow:

```bash
pnpm frontend:check:fix
git add frontend
pnpm frontend:test
pnpm frontend:build
```

The hook applies Biome fixes and stages all frontend changes, then runs frontend tests and a production build, including strict TypeScript checks. A failed check, test, or build prevents the commit. Checks use the current working tree.

## Development approach

This project is intentionally being built through small, test-driven stories. AI is used primarily for planning, review, quality assurance, and identifying edge cases while implementation remains a deliberate developer learning exercise.

Project standards are documented in:

- [`docs/definition-of-done.md`](docs/definition-of-done.md)
- [`docs/ai-working-agreement.md`](docs/ai-working-agreement.md)

Backlog and completed stories are tracked in [GitHub Issues](https://github.com/danielgebhardt/larn-remake/issues).

## Current development status

The dungeon creation and exploration milestone now supports three generated floors, seeded stair placement, automatic descent and ascent, stable revisits, depth and seed display, complete seed replay, and whole-run restart. Rendering and movement support rectangular dungeons. Repeatability is guaranteed for the same seed, configuration, and generator version. UI improvements and later gameplay can build on this foundation.
