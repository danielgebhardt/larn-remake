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

The playable dungeon is generated in the frontend when the page loads. It remains stable during ordinary React rerenders. The earlier fixed dungeon remains available as a test fixture.

## Repository layout

```text
larn-remake/
├── backend/                  # Spring Boot API
├── frontend/                 # React + TypeScript application
│   └── src/
│       ├── Corridor.ts      # Corridor creation and connections
│       ├── DungeonLayout.tsx # Dungeon rendering and player movement
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

Move the player with either control scheme:

| Direction | Arrow key | Letter key |
| --- | --- | --- |
| Up | ↑ | W |
| Down | ↓ | S |
| Left | ← | A |
| Right | → | D |

The player can move through rooms and corridors but cannot move through wall tiles or beyond the dungeon boundary.

## Testing and quality checks

Run frontend formatting and lint checks:

```bash
pnpm frontend:check
```

Apply Biome fixes:

```bash
pnpm frontend:check:fix
```

Run the frontend test suite once:

```bash
pnpm frontend:test
```

Create a production frontend build:

```bash
pnpm --filter frontend build
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
```

Biome fixes are applied and frontend changes are staged before the test suite runs. A failed check or test prevents the commit.

## Development approach

This project is intentionally being built through small, test-driven stories. AI is used primarily for planning, review, quality assurance, and identifying edge cases while implementation remains a deliberate developer learning exercise.

Project standards are documented in:

- [`docs/definition-of-done.md`](docs/definition-of-done.md)
- [`docs/ai-working-agreement.md`](docs/ai-working-agreement.md)

Backlog and completed stories are tracked in [GitHub Issues](https://github.com/danielgebhardt/larn-remake/issues).

## Current development status

The playable UI now uses a generated dungeon with connected rooms and corridors and a valid player starting position. Rendering and movement support rectangular dungeons. Future stories can build additional gameplay on this foundation.