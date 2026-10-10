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
- Turn counting for successful movement and a current/max-health status display.
- Configurable dungeon creation with rectangular dimensions.
- Binary space partitioning that divides dungeon space into terminal regions.
- Rooms carved into terminal regions and corridors connecting those rooms.
- Three-floor exploration with automatic stair transitions and a depth display.
- Configurable fog of war with wall-blocked sight and exploration memory per floor.
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
│       ├── App.tsx           # Application entry and theme provider
│       ├── Home.tsx          # Play screen and run/settings state
│       ├── Header.tsx        # Floor display and toolbar
│       ├── domain/dungeon/   # Pure generation, run state, seeds, and configuration
│       ├── domain/game/      # Game state, player health, and action resolution
│       ├── components/
│       │   ├── dungeon/      # Map rendering, icons, legend, and scroll geometry
│       │   ├── game/         # Player status display
│       │   └── ui/           # Shared shadcn controls
│       ├── settings/         # Settings panel, draft parsing, and theme preference
│       ├── __tests__/        # Frontend/domain tests and shared fixtures
│       └── mocks/            # Mock API handlers for tests
├── docs/                     # Definition of Done and AI working agreement
└── README.md
```

Dungeon responsibilities are split into focused modules in `domain/dungeon`: `DungeonTypes.ts` defines shared shapes, `Tiles.ts` defines tile identifiers, `Terrain.ts` creates and carves grids, `DungeonGeneration.ts` coordinates generation, and `DungeonLocations.ts` selects player and stair positions. `Partitioning.ts`, `Room.ts`, and `Corridor.ts` implement the generation steps; `DungeonRun.ts` manages floors, movement validation, and stair transitions. `moveDungeonRun` accepts a direction, returns the unchanged run for blocked moves, and applies at most one stair transition after a successful move. Map components translate keyboard input into direction requests; Home applies those requests through the domain. Terrain grids and rows are readonly to preserve the references used by rendering memoization. The domain has no React or settings dependencies. The fixed dungeon and its starting coordinate live in `__tests__/testhelpers.ts`.

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

Shared shadcn styling and theme tokens live in `frontend/src/App.css`, imported by `App.tsx`. Page layout uses Tailwind utilities, and reusable controls live in `frontend/src/components/ui`.

Move the player with either control scheme:

| Direction | Arrow key | Letter key |
| --- | --- | --- |
| Up | ↑ | W |
| Down | ↓ | S |
| Left | ← | A |
| Right | → | D |

The player can move through rooms and corridors but cannot move through wall tiles or beyond the dungeon boundary.

The **Activity** log below the map retains the most recent 100 events, with turn numbers and messages in resolution order. It has its own scroll area and politely announces new entries without changing focus. New messages follow automatically while you are at the bottom; scrolling back keeps your reading position, including when older entries are trimmed. Returning to the bottom resumes following. If the entry being read is removed by the history limit, the log shows the oldest remaining entry. Keyboard users can focus the log to scroll without moving the player, then focus the map to resume movement.

History survives floor visits and Settings/appearance changes; New Dungeon and seed replay clear it. Ordinary movement does not create log entries. Combat emits player-hit, monster-hit, and monster-death events. Before the first fight, the log shows **No activity yet.** Fatal retaliation adds player-death after the monster-hit event. `ActivityHistory.ts` stores structured events and the shared history limit; `ActivityMessages.ts` controls their readable wording, and `ActivityLog.tsx` handles display and scrolling.

A fresh run places one goblin on floor 1 when an eligible floor tile exists. Placement uses an independent seed namespace, `seed:floor:monsters:1`, excluding the player and stairs. The goblin retains its identity, location, and current health across floor visits. It is displayed only within current sight, or with fog disabled; remembered tiles retain terrain rather than a monster silhouette. Bumping the goblin with either movement scheme attacks for 2 damage, keeps the player in place, and spends one turn. Both attacks always hit. If the goblin survives, it retaliates once for 1 damage in that same turn; a killing blow removes it without retaliation. A later movement can enter the empty tile. After each successful player action, living monsters on the resulting active floor get one action. An adjacent goblin attacks once, including after walking into adjacency. Bump retaliation is this same action, so it never produces a duplicate hit. Blocked steps and Settings do not trigger monster actions. Stair traversal runs the destination floor phase only; inactive floors freeze, and fatal damage stops the phase. Injured health survives floor travel; new runs and replay restore the goblin and player.

Goblins detect the player within a circular radius of 6 tiles with wall-blocked line of sight, independently of player fog settings. A detected nonadjacent player is pursued one orthogonal tile along a shortest legal path toward adjacency. Equal routes prefer up, right, down, then left. Moving into adjacency does not also attack that turn; without current detection the goblin stays still. Monsters avoid living actors, the player tile, stairs and linked arrival coordinates. Movement/detection does not add activity messages.

Goblin base stats (maximum health 4, attack damage 1 and detection radius 6) live in `frontend/src/domain/monsters/Monster.ts`. Its SVG, color class, and accessible label are mapped in `frontend/src/components/monsters/MonsterVisuals.ts`; the custom SVG is `GoblinIcon.tsx`, and light/dark green colors are defined in `App.css`. Monster instances are stored in game state separately from dungeon terrain and discovery. Floors with no eligible tile have no monster.

The player status above the legend shows **Turn** and **Health**. A fresh run starts at turn 0 with 10 / 10 health. Each successful movement action costs one turn, including entering a staircase and arriving on the linked floor. Walking into a wall or beyond the map costs no turn. Settings, fog changes, appearance changes, unused keys, and manual scrolling also cost no turns. Health and the turn count are retained across floors; **New Dungeon** and seed replay reset both, even when the seed repeats. Goblin retaliation reduces health, clamped at zero. At zero health, the run ends with a visible death message and gameplay input stops. Settings, log scrolling, New Dungeon, and seed replay remain usable. Successful restart/replay restores full health, turn zero, initial monsters, and fresh activity/discovery; invalid input or generation failure keeps the ended run intact. Healing is later work.

Player actions resolve in this order: validate and apply movement, apply at most one stair transition, then advance the turn once if movement succeeded. A bump into a living goblin instead resolves the player hit, monster death if killed, then the monster phase and ordered log entries together without committing the tentative movement. Home refreshes visibility from the final position and updates game state and discovery together. Blocked movement and all gameplay actions after death retain the original state. A broken stair link still raises the existing domain error without modifying the input state. `domain/monsters/MonsterTurns.ts` resolves the monster phase; `domain/game/PlayerActions.ts` is the turn-aware action entry point; `GameState.ts` creates fresh run/player state, and `PlayerStats.ts` holds the shared health and attack defaults. Dungeon generation and fog remain separate responsibilities.

Tiles use gray brick walls, faint floor dots, and a red player from Lucide, plus custom amber staircase silhouettes. Steps rising from left to right indicate up stairs; steps falling from left to right indicate down stairs. The player icon covers a stair while occupying it; the stair reappears after moving away. Icon choices, colors, and accessible labels are centralized in `frontend/src/components/dungeon/TileVisuals.ts`; the custom SVGs live in `frontend/src/components/dungeon/StairIcons.tsx`.

A compact legend above the map identifies the player and both stair directions. Map tiles stay square at 24×24 pixels. Scroll within the map to explore portions outside the viewport; the map container is capped at 70% of the window height. Keyboard users can focus the map and use Page Up/Page Down for vertical scrolling; arrow keys and WASD continue to move the player.

Stepping onto a stair automatically changes floors. The depth heading shows the current floor and total floor count.

To replay a dungeon, open **Settings**, enter a seed in **Dungeon seed**, and select **Start from seed** or press Enter. Seed input accepts decimal whole numbers from `0` to `4294967295`; surrounding whitespace and leading zeroes are normalized. Replay starts on floor 1 and reproduces every floor and stair link for the same generation configuration. Successful replay closes settings; invalid input keeps the panel open with an accessible error and leaves the run intact.

The map automatically scrolls just enough to keep the player visible, with roughly one tile of surrounding space where possible. Following works horizontally and vertically, after stairs or a fresh run, and when the map viewport resizes. You can still scroll manually to inspect the map; ordinary rerenders, Settings, and appearance changes leave that view alone. The next successful move or floor/run change resumes following. Blocked movement does not scroll, and following does not move focus or scroll the outer page.

**Dungeon configuration** in Settings lets you choose 10–100 rows, 10–100 columns, and 1–10 floors. Defaults are 15 × 15 with 3 floors, with minimum partition size 8 and room padding 1. **Start from seed** applies the seed and configuration together, starting a new run on floor 1. Editing or dismissing settings retains drafts without changing the run. **New Dungeon** uses the last successfully applied configuration and resets drafts to it. These settings last for this session; only appearance is saved across reloads.

Inputs require decimal whole numbers. Invalid fields show feedback without replacing the run. Generation failures show a retry message and preserve the current run, active configuration, and draft.

Rooms have at least 3 walkable tiles on each axis and a longest-to-shortest side ratio no greater than 3:1. Seeded generation randomly chooses height, then a width compatible with that height, then placement within the padded partition. Corridors remain one tile wide and are not subject to room proportion rules. Partition minimum 8 provides fewer, larger rooms than the previous minimum 5 without making every room fill its partition.

Smaller domain-level maps remain available for test fixtures. When padding leaves fewer than 3 tiles on an axis, the room minimum relaxes only on that axis, and the other side is capped to retain the 3:1 ratio. A region with no usable interior still throws a `RangeError`. Without a random source, the room uses the largest compatible dimensions at the padded origin.

Room sizing and the partition default intentionally changed in #45. Previously recorded seeds may produce different layouts and stair locations. Repeatability applies to the same seed, configuration, and generator version; it does not guarantee compatibility with earlier generator versions.

**Fog of war** starts enabled with a visibility radius of 6 tiles. Sight uses a circular radius and stops at walls: the first wall is visible, but tiles behind it are hidden. Two walls touching diagonally block sight through their shared corner. Visible tiles use their normal colors; previously seen tiles remain dimmed; undiscovered tiles reveal neither terrain nor stairs. Each floor remembers its own discoveries when you leave and return.

In **Settings**, **Enable fog of war** immediately switches between exploration and a full-map view. **Visibility radius** accepts whole numbers from 1 to 20; select **Apply visibility radius** or press Enter to apply it without restarting or moving the player. Reducing the radius retains previous discoveries. Disabling fog reveals the map for viewing, while exploration memory continues to record only tiles within normal sight. Re-enabling restores that memory. These preferences last for the current session and survive new dungeons, seed replay, and appearance changes; reloading restores the defaults. New dungeons and seed replay clear every floor's discovery memory, even when the seed repeats. Fog never changes generated terrain, seeded randomness, collision, or stair links.

**Appearance** in Settings offers Light, Dark, and System. Dark is the default. Your choice is saved locally on this device; System follows changes to the operating system appearance. Changing appearance preserves exploration, seed drafts, and validation feedback. UI and dungeon colors are defined together in `frontend/src/App.css`, with charcoal/amber dark colors and a warm stone light palette.

Settings focuses the seed input when opened and contains keyboard focus while open. Game movement and stair transitions are suspended throughout the panel. Use Escape or **Close** to dismiss it without applying a draft; focus returns to the Settings button and game controls resume. Opening, closing, or editing settings does not regenerate the dungeon. Unsubmitted drafts are retained during this session; **New Dungeon** resets the draft and feedback to match the new run.

**New Dungeon** requests a random seed across that same range and replaces the entire run: all floors and stair links, depth, and player position. It returns the player to floor 1 at the new run's selected start. The displayed seed and input update to the new seed. A random seed can repeat; restarting still resets exploration, including when the seed repeats.

To demonstrate the exploration milestone:

1. Note the displayed seed and explore toward a descending staircase to descend from floor 1 to floor 2, then floor 3.
2. Step onto an ascending staircase to return through the same floors to floor 1. Arrival places the player on the matching stair; move away and step back onto it to use it again.
3. Open **Settings**, enter the noted seed, and start from it to recreate the complete run at its original start.
4. Select **New Dungeon**, then explore again. Subsequent transitions use the new run's floors.

Floor 1 has no up stair, and the deepest floor has no down stair. Floor count is configurable in Settings, including a one-floor run with no transitions; the default is three floors. Town, monster AI, inventory, and persistence belong to later work.

## Configuration

Start with `domain/dungeon/RunConfiguration.ts` when tuning dungeon generation. Configuration is organized by responsibility:

| File | What it controls |
| --- | --- |
| [RunConfiguration.ts](frontend/src/domain/dungeon/RunConfiguration.ts) | Dungeon defaults, configuration types, and input limits: rows, columns, floor count, minimum partition size, room padding, minimum room size, maximum room aspect ratio, and fog defaults/radius limits. |
| [RunConfigurationDraft.ts](frontend/src/settings/RunConfigurationDraft.ts) | Settings draft types, conversion to input strings, and parsing/validation against the shared limits. |
| [FogConfigurationDraft.ts](frontend/src/settings/FogConfigurationDraft.ts) | Parsing and validation of the visibility-radius setting against the shared limits. |
| [App.css](frontend/src/App.css) | Tile size, light/dark theme colors, fog backgrounds and remembered-icon opacity, and shared styling. The `--dungeon-tile-size` variable sizes dungeon cells, grid columns, and legend icons together. |
| [TileVisuals.ts](frontend/src/components/dungeon/TileVisuals.ts) | Tile icon choices, color classes, backgrounds, and accessible labels. |
| [ActivityHistory.ts](frontend/src/domain/game/ActivityHistory.ts) | Structured activity events, stable entry IDs, and the recent-history limit (100 entries). |
| [Monster.ts](frontend/src/domain/monsters/Monster.ts) | Monster types and shared base stats; goblin maximum health 4, attack damage 1 and detection radius 6. |
| [MonsterVisuals.ts](frontend/src/components/monsters/MonsterVisuals.ts) | Per-monster SVG, color class, and accessible label. |
| [PlayerStats.ts](frontend/src/domain/game/PlayerStats.ts) | Internal starting maximum health (10) and fixed player attack damage (2); fresh players start at full health. |
| [Seed.ts](frontend/src/domain/dungeon/Seed.ts) | Seed range, input validation, and seeded randomness. |
| [ThemeProvider.tsx](frontend/src/settings/ThemeProvider.tsx) | Default appearance and saved Light/Dark/System preference. |
| [vite.config.ts](frontend/vite.config.ts) | Frontend tooling, import aliases, backend development proxy, and test environment. |

Settings exposes rows, columns, floor count, fog enablement, and visibility radius. Partition size, padding, room size, and aspect ratio remain internal configuration values and are preserved when applying a Settings draft. Appearance is saved locally; dungeon and fog settings last for the current session. `Visibility.ts` calculates sight independently of React; `Exploration.ts` combines it with per-floor discovery memory. Unchanged visibility and discovery rows retain their references so memoized map rows and cells can avoid unnecessary rendering.

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

Frontend suites in `frontend/src/__tests__` are grouped by behavior. Home has separate suites for turns, player status, complete action cycles, rendering/movement, configuration, settings/appearance, seed replay, restarts, floor traversal, fog settings and discovery, and complete exploration scenarios. Domain suites cover terrain, generation, location selection, floor seeds, stair links, transitions, partitioning, line of sight, and per-floor exploration memory separately. Game-domain tests cover fresh state, health retention, turn-aware action results, blocked steps, stair travel, combat order, overkill clamping, and post-death state retention. Home encounter suites cover victory, loss with an injured player fixture, fog/log/status consistency, and successful or failed recovery. A maximum-size map regression checks that movement redraws nearby icons rather than the whole map.

Pure domain and geometry tests use the Node environment; React interaction tests use jsdom. Keep suites to a top-level `describe` with at most one nested `describe`. Prefer named scenario fixtures, explicit actions, and observable outcomes. `testhelpers.ts` contains domain fixtures and shared connectivity/path checks; `HomeTestHelpers.tsx` contains page rendering and settings interactions. Dungeon comparisons use cell labels rather than complete HTML, while icon-specific tests verify SVG rendering separately.

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

The dungeon creation and exploration milestone now supports three generated floors, seeded stair placement, automatic descent and ascent, stable revisits, depth and seed display, complete seed replay, and whole-run restart. Rendering and movement support rectangular dungeons. Repeatability is guaranteed for the same seed, configuration, and generator version. The game now tracks turns and player health through a pure movement-action resolver, with deterministic bump combat against one goblin and a turn-associated activity log.
