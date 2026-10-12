# Larn Remake

A small remake and reimagining of the classic roguelike **Larn**, built as a software-engineering and test-driven development practice project.

The repository is a monorepo with a Spring Boot backend and a React/TypeScript frontend. Development is organized into small stories so game behavior can be designed, tested, and implemented incrementally.

See [ROADMAP.md](ROADMAP.md) for the remaining milestones and their GitHub stories.

## Current functionality

The application currently includes:

- A Spring Boot API with an initial frontend/backend connectivity endpoint.
- A React interface that displays a generated, connected dungeon.
- A player who starts on a valid floor tile inside a generated room.
- Keyboard movement using the arrow keys or WASD.
- Collision rules that prevent movement into walls or outside dungeon bounds.
- Committed world turns, health/mana status, earned levels and automatic Strength/Dexterity/Intelligence growth.
- Known Magic Missile and Heal spells, keyboard/mouse targeting, mana potions and slow turn-based recovery.
- Configurable dungeon creation with rectangular dimensions.
- Binary space partitioning that divides dungeon space into terminal regions.
- Rooms carved into terminal regions and corridors connecting those rooms.
- Up to 20 floors with automatic stair transitions and a depth display; twenty floors by default.
- Configurable fog of war with wall-blocked sight and exploration memory per floor.
- Current run seed display and replay of the complete dungeon from an entered seed.
- A compact play screen using Tailwind CSS and shadcn/ui (Base UI, Nova), with styled controls, a map legend in Help, and scrollable dungeon tiles.

The page opens with a brief adventure introduction. Begin Adventure generates a random frontend run; Save/Load can resume before starting. The recommended default contains twenty 60×60 floors. Terrain and stair links are retained throughout exploration and ordinary React rerenders. The earlier fixed dungeon remains available as a test fixture.

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

## Starting equipment

Every new or replayed run starts with a short sword in the main hand and a wooden shield in the off hand. Equipment is retained through movement, combat, waiting, and floor traversal. Each item copy has a stable run-local ID separate from its shared item kind. Starting IDs are reproducible across resets; item objects are created fresh for each run.

`domain/items/Item.ts` defines shared item names, types, floor eligibility, weights, and bonuses. `domain/items/Equipment.ts` validates four slots and creates the starting loadout. Equipment lives in `GameState`; health lives in `PlayerStats`. The centered Character dialog shows health, damage range, accuracy, and armor, alongside selectable head/chest/main-hand/off-hand slots and a compact bag. Select gear to inspect its contribution or unequip it; empty slots are labeled. Opening/browsing costs no turns, gameplay keys pause, and I/i or C/c, Escape, or Close dismisses it with focus restoration. Starting nominal attack is base 1 + short-sword bonus 1, giving a landed raw range of 1–3. Shield, chest, and head armor add once; accuracy and damage mitigation are separate. See the reproducible melee rules below.

## Starter bag

The Character dialog also shows a 20-slot bag in a responsive grid (seven columns on desktop), separate from equipped gear. Each carried item uses one slot; identical kinds remain distinct item copies. New/replayed runs start with an empty bag, an equipped short sword (weapon bonus +1) and an equipped wooden shield (armor 1). Loading an existing save preserves its carried items. Carried bonuses do not affect combat until the item is equipped.

Select an item with the mouse, or Tab to it and press Enter/Space, to read its type, description, and contribution. Browsing costs no turns and background movement/waiting stays paused. Explicit gear buttons still resolve normal turns; a dialog summary shows the current turn, health, equipment actions, and monster responses. Empty/full bags display used and available capacity; bag contents persist through combat, movement, and floor visits. `domain/items/Bag.ts` owns capacity, ownership checks, and starting contents; `BagContents.tsx` presents 20 compact slots, including non-interactive empty slots. `CharacterDialog.tsx` owns one shared selection across equipment and bag; `ItemDetails.tsx` shows the selected item and its explicit actions below the bag. Equipment stacks above the bag on narrow screens; dialog controls and action feedback remain visible while its body scrolls. Use Drop item on a carried item or Pick up in the On your tile section. Each successful transfer costs one turn and runs the monster phase; invalid/full-bag transfers cost nothing. Unequip worn gear before dropping it. Stacking and spatial packing are later stories. `EquipmentChanges.ts` validates and transfers gear; `FloorItems.ts` manages floor ownership and pickup/drop; `PlayerActions.ts` resolves its turn and monster phase.

Floor items are retained across visits and reset with the run. Entering an item tile announces all its item names in one activity entry before monsters respond, including after stairs. This uses the movement turn; waiting and non-movement actions do not repeat it. Leaving and returning announces remaining items again. The map shows them only in current sight (remembered tiles retain terrain), with player/monster/stair symbols taking priority. Multiple items can share a tile and do not block movement or stairs. Each floor starts with up to two items on distinct walkable room tiles, excluding stairs, arrivals, player start, and initial monsters. `ItemPlacement.ts` creates this population once per run using indexed `seed:floor:items:index` namespaces; `Loot.ts` holds the small shared loot catalog. Positions are chosen before item kinds, and loot never consumes terrain/stair/monster random streams.

Goblin deaths have a 50% chance to drop one item from the shared loot catalog. `MonsterDrops.ts` derives that decision from `seed:floor:monster-drops:monsterId`, independent of kill order and other streams. Drops appear on the death tile, may coexist with other items, and persist across visits. The hit and death log entries precede any loot announcement; the defeated monster is removed, so later actions cannot resolve its drop again.

## Healing potions

Healing potions are identified consumables in the shared floor-loot and goblin-drop catalog; the starter bag still contains its two equipment items. Each potion uses a separate bag slot and supports the same pickup/drop rules as gear. Select one in Character and choose **Drink potion**. It restores up to **5 health**, capped at maximum health, removes that specific copy, and records the actual recovery. A successful use costs one turn and heals before the normal monster phase; retaliation can still kill you. Full-health use is rejected without consuming an item or turn, and dead players cannot drink. New/replayed runs reset health, ownership, and history. `Consumables.ts` owns validation and recovery; `PlayerActions.ts` applies the turn and monster phase. Potions have no equipment slot. Assigned potion shortcuts use keys 1–4.

## Potion hotbar

Four run-local slots hold potion-kind assignments, initially empty. Picking up the first carried copy of an unassigned potion kind automatically assigns it to the first empty slot (1–4), as part of the normal pickup turn. Existing assignments are preserved. If you clear a shortcut while still carrying that kind, additional copies do not reassign it; after carrying none, a later pickup can assign it again. A full hotbar never blocks pickup or overwrites a slot. Assigning, moving, or clearing an assignment is free and does not move bottles out of the bag. Assigning a kind to another slot moves its existing assignment, avoiding duplicate shortcuts. Availability is derived from carried copies, so dropping or drinking the last bottle leaves an unavailable assignment, and collecting another restores it. Activation consumes the first matching bag copy through the normal potion action; successful potion recovery costs one turn and runs the monster phase afterward. Empty slots, missing bottles, and a full relevant resource cost nothing. Activation is disabled after death; assignments are configuration and can still be edited. New/replayed runs reset assignments. `domain/items/PotionHotbar.ts` owns assignments and inventory-derived availability. Select a potion in Character, then choose assignment button 1–4 in its details. The Potion shortcuts section shows all assignments/counts and Clear controls. Assignment controls are also available after death, since they change configuration rather than using a potion. Above the map, four numbered slots appear to the left of the player icon/status, showing the potion icon and carried count. Click a slot or press 1–4 from gameplay to use it; clicking returns focus to the map. Empty/unavailable/full-health attempts show feedback without spending a turn. Number keys ignore repeats and modified shortcuts, and respect open menus, controls, editors, and log focus. Slots wrap above player status on narrow screens.

## Controls

The header shows the current floor, **New Dungeon**, **Character**, **Save/Load**, **Settings**, and **Help**. Help opens a sheet with keyboard controls, map symbols and fog colors, and notes about exploring and combat. The potion and spell hotbars, player status, map, and activity log occupy the main play area. Settings opens a modal side panel containing the current seed and seed replay form. A small footer shows the backend connectivity diagnostic. Exploration runs in the frontend and remains available if that check fails.

Shared shadcn styling and theme tokens live in `frontend/src/App.css`, imported by `App.tsx`. Page layout uses Tailwind utilities, and reusable controls live in `frontend/src/components/ui`.

Move the player with either control scheme:

| Direction | Arrow key | Letter key |
| --- | --- | --- |
| Up | ↑ | W |
| Down | ↓ | S |
| Left | ← | A |
| Right | → | D |
| Wait | Spacebar | — |
| Pick up | G | — |
| Character | I or C | — |
| Target Magic Missile | Z | Arrows or WASD cast straight in a direction; Enter or a target click casts |
| Cancel targeting | Escape or Z | — |
| Self-cast Heal | H | Click Heal in the spell hotbar |
| Use assigned potion | 1–4 | — |

**G** (or lowercase **g**) picks up the sole item on your tile immediately. With multiple items, a compact chooser lists current-tile loot; each selection uses one turn and runs the normal monster phase. Opening or dismissing it is free, and Escape/Close returns focus to the map. In the chooser, **1–9** picks the matching numbered choice rather than using a potion. Larger piles have nine choices per page; use **Page Up / Page Down** or the page buttons. Choices renumber after pickups. The chooser closes when the tile is empty or the player dies. Empty tiles and full bags show feedback without spending a turn. Held-key repeats and Ctrl/Alt/Meta shortcuts do not pick up; gameplay keys pause in all menus and the chooser, and G is ignored in focused controls, editors, and the activity log. Character pickup controls remain available.

Successful stair traversal adds a turn-stamped activity message (for example, “You descend to floor 2.”). This appears before arrival loot or monster actions; arriving on the linked stair does not trigger another transition. Stair icons include directional arrow cutouts in both the map and Help legend.

The player can move through rooms and corridors but cannot move through wall tiles or beyond the dungeon boundary. **Spacebar** waits one turn without moving or attacking, allowing a lone goblin to approach or hit while you stand still. Waiting does not activate a stair or add a log message of its own. It runs the normal monster phase and costs one turn even when no monster acts. Holding Spacebar does not repeat waits; press it again for another turn. Gameplay movement and waiting are paused while Settings, Help, or Character is open. Escape dismisses the open menu and restores focus to its opener. I/i and C/c also close Character. Focus the map to resume gameplay; Space retains its normal behavior on focused controls, in editors, and in the activity log. Waiting is disabled after death.

The **Activity** log below the map retains the most recent 100 events, with turn numbers and messages in resolution order. It has its own scroll area and politely announces new entries without changing focus. New messages follow automatically while you are at the bottom; scrolling back keeps your reading position, including when older entries are trimmed. Returning to the bottom resumes following. If the entry being read is removed by the history limit, the log shows the oldest remaining entry. Keyboard users can focus the log to scroll without moving the player, then focus the map to resume movement.

History survives floor visits and Settings/appearance changes; New Dungeon and seed replay clear it. Ordinary movement does not create log entries. Gear changes emit equip/unequip events before monster responses. Combat emits hit, miss, and monster-death events in player-first, numeric monster order. Hits report resolved post-armor damage, including the rolled hit damage on overkill; misses report no damage. Before the first fight, the log shows **No activity yet.** A fatal monster attack adds player-death after the monster-hit event. `ActivityHistory.ts` stores structured events and the shared history limit; `ActivityMessages.ts` controls their readable wording, and `ActivityLog.tsx` handles display and scrolling.

A fresh run places a capped density of eligible monsters on every floor. Placement uses an independent seed namespace per actor, `seed:floor:monsters:index`, choosing without replacement from floor tiles in row-major order. Player start, stairs and linked arrival coordinates have a one-tile orthogonal spawn buffer; insufficient space reduces the count, including to zero. The deepest floor also reserves its future down-stair location and buffer, using the shared stair calculation, so increasing floor count preserves existing populations. Counts and existing placement prefixes remain independent of terrain random draws. Monsters retain their identity, location, and current health across floor visits.

There is no timed spawning or respawning. Initial population creation happens once per run; replay restores full-health actors at their original seeded positions. Reproducibility applies to the same seed/configuration and generator version; adding entry buffers changes placements from the earlier single-monster version.

Monsters are displayed only within current sight, or with fog disabled; remembered tiles retain terrain rather than monster silhouettes. Bumping a monster spends one turn and keeps the player in place, whether it hits or misses. With the starting short sword, landed raw damage is 1–3. A killing blow removes the monster and resolves its drop once, preventing that monster's retaliation; other living active monsters still take their phase. Adjacent detected monsters attack once, while a monster moving into adjacency cannot attack in the same phase. Stairs run the destination floor's phase, inactive floors freeze, and death stops later attackers. Blocked steps, menu browsing, and rejected inventory/potion actions remain free.

Goblins detect the player within a circular radius of 6 tiles with wall-blocked line of sight, independently of player fog settings. A detected nonadjacent player is pursued one orthogonal tile along a shortest legal path toward adjacency. Equal routes prefer up, right, down, then left. Moving into adjacency does not also attack that turn; without current detection the goblin stays still. Monsters avoid living actors, the player tile, stairs and linked arrival coordinates. Movement/detection does not add activity messages.

Goblin base stats (maximum health 4, attack damage 1 and detection radius 6) live in `frontend/src/domain/monsters/Monster.ts`. Its SVG, color class, and accessible label are mapped in `frontend/src/components/monsters/MonsterVisuals.ts`; the custom SVG is `GoblinIcon.tsx`, and light/dark green colors are defined in `App.css`. Monster instances are stored in game state separately from dungeon terrain and discovery. The map renders all active-floor actors, grouped by row, and retains unchanged actor rows/cells during movement. IDs encode `floor:spawnIndex`; monster phases use numeric spawn order independently of array storage order. Each actor sees earlier actors' final positions, so collisions prevent overlaps and passing through occupied tiles. Multiple adjacent goblins can each hit once, stopping immediately on player death. Floors with no eligible tile have no monster.

The player status above the map shows **Turn** and **Health**. A fresh run starts at turn 0 with 10 / 10 health. Each wait or successful movement action costs one turn, including entering a staircase and arriving on the linked floor. Walking into a wall or beyond the map costs no turn. Settings, fog changes, appearance changes, unused keys, and manual scrolling also cost no turns. Health and the turn count are retained across floors; **New Dungeon** and seed replay reset both, even when the seed repeats. Monster attacks reduce health, clamped at zero. At zero health, the run ends with a visible death message and gameplay input stops. Settings, log scrolling, New Dungeon, and seed replay remain usable. Successful restart/replay restores full health, turn zero, initial monsters, and fresh activity/discovery; invalid input or generation failure keeps the ended run intact. Healing potions restore health before monsters act.

PlayerActions supplies one candidate committed turn to the player effect, retains the original state if the action is rejected, then runs one ordered monster phase and end-of-turn recovery on success. Movement applies at most one stair transition; victory ends the turn before retaliation. A bump into a living monster instead resolves a player hit or miss, monster death if killed, then the monster phase and ordered log entries together without committing the tentative movement. Home refreshes visibility from the final position and updates game state and discovery together. Blocked movement and all gameplay actions after death retain the original state. A broken stair link still raises the existing domain error without modifying the input state. `domain/monsters/MonsterTurns.ts` resolves the monster phase; `domain/game/PlayerActions.ts` is the turn-aware action entry point; `GameState.ts` creates fresh run/player state, and `PlayerStats.ts` holds base health/attack defaults; `CombatStats.ts` derives equipment values for both the sheet and combat. Hit events record resolved damage after armor but before clamping remaining health, preserving the existing overkill convention. Dungeon generation and fog remain separate responsibilities.

Goblin archers appear on floors 2–20 with relative spawn weight 1, with 5 HP, nominal damage 2, detection radius 6 and 6 XP. After ordinary wall-blocked detection it uses melee when adjacent, shoots at Manhattan distance 2–4, or pursues one tile beyond shooting range. A phase never moves and attacks together. Shots reuse player evasion, bounded damage and armor, with distinct activity messages and a seeded `actor-ID:shot` attack namespace. Creatures do not intercept shots. Its cyan goblin-face-and-bow icon identifies it as a creature rather than loot. It joins the existing seeded population rather than increasing the total monster count.

Dungeon brutes appear on floors 4–20 with relative spawn weight 1. A brute has 10 HP, nominal damage 5 (raw 4–6), detection radius 6 and 12 XP. A detected adjacent brute spends its phase preparing a heavy attack at a fixed tile. The next committed player action is the response: move away to avoid it, or hold position and resolve the hit/miss with ordinary evasion and armor. Healing, casting and gear actions happen before retaliation; rejected actions and browsing are free. Resolution clears intent and spends that phase even on a dodge or miss. Inactive floors pause preparation, and save/load retains its original target. Brutes use a separate seeded `actor-ID:heavy` namespace and an indigo broad-jawed silhouette. A visible prepared target has a danger border and warning badge while retaining its player/stair/item icon; hidden monsters and remembered/undiscovered targets never expose markers. Preparation messages receive warning emphasis, and Help explains both tactics. New adventures include both tactical kinds within the existing 12-monster cap and safe entry buffers. Repeating a seed/configuration reproduces kinds, positions and idle initial intent; increasing run depth preserves earlier populations. Loaded adventures keep their saved actors, wounds and intent without resampling or respawning.

For recorded five-floor content review results and browser checks, see [content and combat review notes](docs/content-combat-review.md). Catalog or combat changes can alter old keyboard scripts; replay guarantees apply to the same rules version, seed, configuration, and action sequence.

Tiles use gray brick walls, faint floor dots, and a red player from Lucide, plus custom amber staircase silhouettes. Steps rising from left to right indicate up stairs; steps falling from left to right indicate down stairs. The player icon covers a stair while occupying it; the stair reappears after moving away. Icon choices, colors, and accessible labels are centralized in `frontend/src/components/dungeon/TileVisuals.ts`; the custom SVGs live in `frontend/src/components/dungeon/StairIcons.tsx`.

Help’s **Map symbols** section identifies the player and both stair directions and explains visible, remembered, and undiscovered tiles, even when fog is disabled. Map tiles stay square, with their size controlled by `--dungeon-tile-size`. The map uses the remaining play area; scroll within it to explore portions outside the viewport. Keyboard users can focus the map and use Page Up/Page Down for vertical scrolling; arrow keys and WASD continue to move the player.

Stepping onto a stair automatically changes floors. The depth heading shows the current floor and total floor count.

To replay a dungeon, open **Settings**, enter a seed in **Dungeon seed**, and select **Start from seed** or press Enter. Seed input accepts decimal whole numbers from `0` to `4294967295`; surrounding whitespace and leading zeroes are normalized. Replay starts on floor 1 and reproduces every floor and stair link for the same generation configuration. Successful replay closes settings; invalid input keeps the panel open with an accessible error and leaves the run intact.

The map automatically scrolls just enough to keep the player visible, with roughly one tile of surrounding space where possible. Following works horizontally and vertically, after stairs or a fresh run, and when the map viewport resizes. You can still scroll manually to inspect the map; ordinary rerenders, Settings, and appearance changes leave that view alone. The next successful move or floor/run change resumes following. Blocked movement does not scroll, and following does not move focus or scroll the outer page.

**Dungeon configuration** in Settings lets you choose 10–100 rows, 10–100 columns, and 5–20 floors. Defaults are 15 × 15 with 5 floors, with minimum partition size 8 and room padding 1. **Start from seed** applies the seed and configuration together, starting a new run on floor 1. Editing or dismissing settings retains drafts without changing the run. **New Dungeon** uses the last successfully applied configuration and resets drafts to it. These settings last for this session; only appearance is saved across reloads.

Inputs require decimal whole numbers. Invalid fields show feedback without replacing the run. Generation failures show a retry message and preserve the current run, active configuration, and draft.

Rooms have at least 3 walkable tiles on each axis and a longest-to-shortest side ratio no greater than 3:1. Seeded generation randomly chooses height, then a width compatible with that height, then placement within the padded partition. Corridors remain one tile wide and are not subject to room proportion rules. Partition minimum 8 provides fewer, larger rooms than the previous minimum 5 without making every room fill its partition.

Smaller domain-level maps remain available for test fixtures. When padding leaves fewer than 3 tiles on an axis, the room minimum relaxes only on that axis, and the other side is capped to retain the 3:1 ratio. A region with no usable interior still throws a `RangeError`. Without a random source, the room uses the largest compatible dimensions at the padded origin.

Room sizing and the partition default intentionally changed in #45. Previously recorded seeds may produce different layouts and stair locations. Repeatability applies to the same seed, configuration, and generator version; it does not guarantee compatibility with earlier generator versions.

**Fog of war** starts enabled with a visibility radius of 6 tiles. Sight uses a circular radius and stops at walls: the first wall is visible, but tiles behind it are hidden. Two walls touching diagonally block sight through their shared corner. Visible tiles use their normal colors; previously seen tiles remain dimmed; undiscovered tiles reveal neither terrain nor stairs. Each floor remembers its own discoveries when you leave and return.

In **Settings**, **Enable fog of war** immediately switches between exploration and a full-map view. **Visibility radius** accepts whole numbers from 1 to 20; select **Apply visibility radius** or press Enter to apply it without restarting or moving the player. Reducing the radius retains previous discoveries. Disabling fog reveals the map for viewing, while exploration memory continues to record only tiles within normal sight. Re-enabling restores that memory. These preferences last for the current session and survive new dungeons, seed replay, and appearance changes; reloading restores the defaults. New dungeons and seed replay clear every floor's discovery memory, even when the seed repeats. Fog never changes generated terrain, seeded randomness, collision, or stair links.

**Appearance** in Settings offers Light, Dark, and System. Dark is the default. Your choice is saved locally on this device; System follows changes to the operating system appearance. Changing appearance preserves exploration, seed drafts, and validation feedback. UI and dungeon colors are defined together in `frontend/src/App.css`, with charcoal/amber dark colors and a warm stone light palette.

Settings focuses the seed input when opened and contains keyboard focus while open. Game movement and stair transitions are suspended throughout the panel. Use Escape or **Close** to dismiss it without applying a draft; focus returns to the dungeon map and all gameplay shortcuts resume. Focused toolbar controls retain their own keys. Opening, closing, or editing settings does not regenerate the dungeon. Unsubmitted drafts are retained during this session; **New Dungeon** resets the draft and feedback to match the new run.

**New Dungeon** requests a random seed across that same range and replaces the entire run: all floors and stair links, depth, and player position. It returns the player to floor 1 at the new run's selected start. The displayed seed and input update to the new seed. A random seed can repeat; restarting still resets exploration, including when the seed repeats.

To demonstrate the exploration milestone:

1. Note the displayed seed and explore toward a descending staircase to descend from floor 1 to floor 2, then floor 3.
2. Step onto an ascending staircase to return through the same floors to floor 1. Arrival places the player on the matching stair; move away and step back onto it to use it again.
3. Open **Settings**, enter the noted seed, and start from it to recreate the complete run at its original start.
4. Select **New Dungeon**, then explore again. Subsequent transitions use the new run's floors.

Floor 1 has no up stair, and the deepest floor has no down stair. Floor count is configurable in Settings, from five to twenty floors; the recommended default is twenty 60×60 floors. Town, broader progression, and persistence belong to later work.

## Configuration

Start with `domain/dungeon/RunConfiguration.ts` when tuning dungeon generation. Configuration is organized by responsibility:

| File | What it controls |
| --- | --- |
| [RunConfiguration.ts](frontend/src/domain/dungeon/RunConfiguration.ts) | Dungeon defaults, configuration types, and input limits: rows, columns, floor count, minimum partition size, room padding, minimum room size, maximum room aspect ratio, and fog defaults/radius limits. `MAX_FLOORS` is shared by input limits and monster/item catalog bounds. |
| [RunConfigurationDraft.ts](frontend/src/settings/RunConfigurationDraft.ts) | Settings draft types, conversion to input strings, and parsing/validation against the shared limits. |
| [FogConfigurationDraft.ts](frontend/src/settings/FogConfigurationDraft.ts) | Parsing and validation of the visibility-radius setting against the shared limits. |
| [App.css](frontend/src/App.css) | Tile size, light/dark theme colors, fog backgrounds and remembered-icon opacity, and shared styling. The `--dungeon-tile-size` variable sizes dungeon cells, grid columns, and legend icons together. |
| [TileVisuals.ts](frontend/src/components/dungeon/TileVisuals.ts) | Tile icon choices, color classes, backgrounds, and accessible labels. |
| [ActivityHistory.ts](frontend/src/domain/game/ActivityHistory.ts) | Structured activity events, stable entry IDs, and the recent-history limit (100 entries). |
| [MonsterPlacement.ts](frontend/src/domain/monsters/MonsterPlacement.ts) | Safe-space density (one per 30 eligible tiles, minimum 2 and maximum 12, bounded by available space), indexed placement seeds and protected entry buffers. |
| [Monster.ts](frontend/src/domain/monsters/Monster.ts) | Monster types and shared base stats; goblin maximum health 4, attack damage 1 and detection radius 6. |
| [MonsterVisuals.ts](frontend/src/components/monsters/MonsterVisuals.ts) | Per-monster SVG, color class, and accessible label. |
| [PlayerStats.ts](frontend/src/domain/game/PlayerStats.ts) | Internal starting maximum health (10) and base player attack damage (1), before earned Strength/weapon bonuses; fresh players start at full health. |
| [Progression.ts](frontend/src/domain/game/Progression.ts), [Attributes.ts](frontend/src/domain/game/Attributes.ts), [MeleeRules.ts](frontend/src/domain/game/MeleeRules.ts) | Internal XP curve, character level cap 20, health/attribute growth, and derived accuracy/evasion. Dungeon depth remains independently configurable up to 20. |
| [Mana.ts](frontend/src/domain/game/Mana.ts), [Spells.ts](frontend/src/domain/game/Spells.ts) | Internal mana capacity/recovery cadence and shared spell identities, costs, cast modes, range, base effects, and known-spell initialization. Intelligence derives from level in `Attributes.ts`. |
| [Item.ts](frontend/src/domain/items/Item.ts) | Item effects, including health/mana potion recovery, floor eligibility, and found/drop weights. |
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

The dungeon creation and exploration milestone now supports twenty generated floors by default, seeded stair placement, automatic descent and ascent, stable revisits, depth and seed display, complete seed replay, and whole-run restart. Rendering and movement support rectangular dungeons. Repeatability is guaranteed for the same seed, configuration, and generator version. The game now tracks turns and player health through a pure movement-action resolver, with deterministic pursuit and reproducible randomized bump combat against floor-aware seeded populations and a turn-associated activity log.

## Cure-and-return adventure

Descend to the deepest configured floor, recover the blue gem **Cure** with **G** or Character's pickup controls, then return to the blue doorway **entrance** on floor 1. The entrance is the original starting tile; floor 1 still has no up stair. Step onto the entrance carrying the cure to win. Returning without it logs a reminder, and waiting at the entrance does not deliver it.

The cure is separate from a healing potion. It occupies a protected quest pouch rather than a bag slot, so a full bag cannot prevent recovery. It cannot be drunk, equipped, or dropped. Recovery takes one turn with normal monster retaliation. The final delivery movement takes one turn and ends the adventure before retaliation. There is no quest timer or required boss.

Quest progress appears above the map and in Character. Victory opens a summary of seed, floor count, turns, confirmed monster kills, remaining health, final level, and total XP. **Review run** (or Escape) dismisses it for inspection; **Victory summary** reopens it. Gameplay and item actions stay disabled after victory. **Replay this seed** resets the same configured adventure, and **New Dungeon** creates another seed with the applied configuration. Settings can also start another adventure. Death continues to prevent delivery.

`Adventure.ts` owns quest metadata and instructions; `CurePlacement.ts` places one reachable cure using `seed:floor:quest:cure`, independently of ordinary loot and monsters. Placement favors an unoccupied room tile away from stairs and arrival, with a reachable fallback for constrained test floors. Victory is captured by the pure player action resolver. Confirmed kill totals are retained separately from the bounded activity log.

For reproducible five-floor checks, run `pnpm --filter frontend exec node scripts/review-adventure.mjs`. See [adventure review notes](docs/adventure-review.md) for recorded outcomes, browser checks, and the story review guide. These diagnostic runs demonstrate achievable adventures; they are not a human playtest or a guarantee that every seed or twenty-floor run is balanced.

## Depth content catalog

Monsters use inclusive floor bands and positive relative spawn weights. Goblins (health 4, damage 1, sight 6, weight 3) are eligible on floors 1–20; giant rats (health 2, damage 1, sight 5, weight 2) on 1–4; orcs (health 7, damage 4, sight 6, weight 2) on 3–20. All initially share orthogonal melee pursuit. These are initial playtest values.

Monster kinds are chosen independently using `seed:floor:monster-kinds:index`; position selection retains `seed:floor:monsters:index`. Settings supports 5–20 floors; the default is five.

Armor catalog: leather armor/cap provide +1 armor from floor 1; chain armor/iron helmet provide +2 from floor 3. All remain eligible through floor 20. Found/drop weights are separate; healing remains the most common individual reward. Every item is a separately owned copy.

Character includes main/off hand, chest, and head slots. New characters leave chest/head empty. Select worn gear or a bag item to use the shared details and equip/unequip controls. Armor totals shield + chest + head once; gear changes use one turn with normal retaliation.

Found loot and monster drops use inclusive floor eligibility and relative source weights. Goblins drop with 50% chance and favor basic swords/shields; rats with 35%; orcs with 70% and favor chain armor/iron helmets. Drop preferences never override floor restrictions. Seed namespaces and instance identities remain independent and drops occur once per kill.

Default monster density is one actor per 30 safe spawn tiles, rounded up, with a minimum of 2 and a maximum of 12 per floor (always clamped to available tiles). Explicit count overrides replace the density policy, including zero, for fixtures and focused tests. Populations are created once per run; there is no respawning.

## Reproducible melee combat

Starting player attacks use a uniform D20 and hit on 4–20 (85%); starting monster attacks hit on 5–20 (80%). Earned Dexterity changes these thresholds as described below. There are no critical hits or special natural-1/20 effects. Nominal player damage is base 1 plus earned Strength and the weapon bonus; raw landed damage ranges inclusively from `max(1, nominal − 1)` to `nominal + 1`. Monster ranges use their catalog damage. A miss deals zero and still spends the attack turn. Damage is rolled only on a hit.

Armor sums shield + chest + head once and subtracts from landed incoming damage, with a minimum of 1. It does not affect accuracy. For example, nominal damage 3 produces 2–4 raw damage; armor 1 reduces that to 1–3. Player attacks currently face no monster armor. Character displays the damage range before armor, hit chance, and armor contributions.

`MeleeRules.ts` owns the pure outcome rules. `CombatRandomness.ts` independently keys hit/damage rolls by seed, floor, consumed turn, attacker identity, and target identity. Identities are encoded without ambiguous separators. Rendering, menus, fog/appearance, and unrelated generation calls do not advance a global combat RNG. Repeating the same seed/configuration and actions under the same rules version reproduces combat; different actions can change encounters and outcomes.

Rule/ownership/AI tests use explicit controlled rolls where random outcomes would obscure their purpose. Seeded combat tests use the real domain actions and cover reproducibility; hit-threshold and damage endpoints use supplied rolls rather than statistical assertions.

## Character progression

Characters start at level 1 with 0 XP. Confirmed player kills award rat/goblin/archer/orc/brute rewards of 2/5/6/10/12 XP. Total XP is retained, with levels derived from cumulative thresholds `10 × n × (n − 1) / 2`: levels 1–5 require 0/10/30/60/100 XP. Character level is capped at 20, independently of dungeon depth. Above level five, cumulative XP is `100 + 10 × (n × (n − 1) − 20)`: level 6 needs 200, level 10 needs 800, level 15 needs 2,000, and level 20 needs 3,700. This initial deep curve will be reviewed with the expanded bestiary.

Each gained level adds 2 maximum health and 2 current health, preserving missing health rather than granting a full heal. For example, 6/10 becomes 8/12. Multiple-level rewards apply every earned benefit through level 20. XP continues accumulating at the cap, but further rewards do not heal or grow attributes. `Progression.ts` owns the curve, cap, and health benefit; monster definitions own their rewards. XP and health level-ups apply within the kill action before surviving monsters retaliate, with no extra turn. The log records the reward and every crossed level after the death message. The map status shows level; Character has a progression column with total and within-level XP. At the cap, it shows maximum level reached. Victory captures final level and total XP. Both I and C toggle the combined Character/Inventory dialog; Escape also closes it.

Recorded XP/health checkpoint results are in [progression review notes](docs/progression-review.md). The diagnostic accepts seed batches, dimensions, floor count, and action budgets; reports per-seed level, total XP, attributes, equipment, health, floor checkpoints, and an aggregate summary. See the review notes for commands and results; `LARN_REVIEW_TRACE=1` includes its action trace.

Strength starts at 10 and automatically gains 2 every odd level from level 3. Its modifier is `floor((Strength − 10) / 2)`, added once to nominal player damage: base 1 + Strength modifier + weapon bonus. With the short sword, level 1 deals 1–3 raw damage; level 3 deals 2–4; level 5 deals 3–5. Unarmed attacks also use Strength. Equipment changes do not change earned attributes; capped XP grants no further growth. Strength gained from a kill affects subsequent attacks, not the blow that earned it. Enemy damage remains catalog-based.

Dexterity starts at 10 and gains 2 every even level. Each modifier point (`floor((Dexterity − 10) / 2)`) adds 5 percentage points to player hit chance and subtracts 5 from enemy hit chance against the player. Both chances are clamped to 5–95% and resolved with the same keyed D20 rolls. At level 2, player hit chance is 90% and monster hit chance is 75%; at level 4 these are 95% and 70%. Character displays evasion as the complement of enemy hit chance (25% and 30%). Armor reduces landed damage separately. Earned evasion applies before retaliation on the level-up turn.

Living players at 1–5 HP see a red current-health number, an icon/text warning, and a muted red adventure-container outline. Character uses the same health treatment. The absolute threshold stays at 5 as maximum health grows; healing above it clears the cue, and death retains its own message.

The activity log gives level-ups and adventure completion a highlighted row with a milestone icon. Attribute growth uses lighter emphasis; death uses the danger color. Routine XP, combat, loot, and travel keep their normal presentation. Message order, polite announcements, and scroll following are unchanged.

Carried gear compares against its compatible equipped slot: green **Better**, blue **Same**, red **Lower**. Comparison uses weapon attack bonus or armor in the same slot, excluding player attributes and other armor slots. Item details show carried versus equipped contribution and its signed difference; selection keeps a separate ring. Empty equipment slots compare against zero, and potions/quest items are excluded. Comparisons update after transfers and equipment changes without spending extra turns.


## Mana and spellcasting

Every new/replayed run knows **Magic Missile** and **Heal**, starts with full mana, and retains mana/knowledge across floors. Intelligence is determined by character level: 10 at levels 1–2, 12 at 3–4, and 14 at 5. Its modifier is `floor((Intelligence − 10) / 2)`. Maximum mana is `10 + 2 × modifier`, giving 10/12/14. Earned capacity adds the same amount to current mana, preserving missing mana: 3/10 becomes 5/12. Classes with different starting stats/growth and equipment or permanent potion bonuses are future work; there is no manual attribute allocation.

| Spell | Cost | Current effect | Activation |
| --- | --- | --- | --- |
| Magic Missile | 3 mana | Guaranteed hit; seeded uniform 3–5 damage plus Intelligence modifier | Z or its hotbar button enters targeting; arrows or WASD cast straight in a direction; Enter or click casts at the highlighted monster. |
| Heal | 4 mana | Restore up to 4 + Intelligence modifier health, capped at maximum | H or its hotbar button casts immediately on self. |

Magic Missile targets one living monster on the active floor within **Manhattan range 6** (horizontal + vertical distance), with clear wall-blocked sight. The UI offers only currently visible targets when fog is enabled; range/sight still apply with fog off. Other creatures do not block the bolt. Escape or Z cancels for free. During targeting, normal movement, pickup, waiting, and potion/self-heal activation are paused; Tab still navigates controls. Opening a menu, changing floors, ending, or restarting the run clears targeting. Editors, focused unrelated controls, modal browsing, modifiers and held activation keys retain their keyboard protections.

A successful cast spends its cost and **one normal turn**, applies the effect and any kill/XP/health/attribute/mana-capacity growth, then resolves surviving monsters. Melee and spells share confirmed kill rewards and loot. Invalid, unknown, unaffordable, full-health Heal, and ended-run casts spend nothing and explain the reason. Spell damage uses the existing seeded combat source with a distinct spell attacker identity; unchanged melee contexts keep their old randomness.

Recover **1 mana at global turns 30, 60, 90…**, after monster retaliation, capped by derived capacity. Every committed action counts, including waiting, inventory actions and stairs. Blocked/rejected actions, inspection, hotbar assignment and targeting/cancellation are free. Recovery cannot fund an initially unaffordable cast and never happens after death or victory. **Safe rooms allow unlimited waiting/recovery in this MVP.** Large-map travel also makes mana plentiful; later pressure/tactics work must address that deliberately.

**Mana potions** restore up to **5 mana** before monsters act, consume one bottle/turn, and reject full-mana attempts for free. They use the same bag, seeded found/drop system, first-free shortcut assignment, per-kind counts and 1–4 controls as healing potions. They are eligible on floors 1–20 with found/drop weights 5/5, and have a distinct bottle icon and blue item color. Adding catalog entries changes loot outcomes for an older seed, while the same seed/configuration/content version remains reproducible and extending floor count preserves earlier ordinary loot.

The Character dialog defaults to **Character** each time it opens; **Spells** lists authoritative known spells and lets you assign four hotbar slots on keys **5–8** with derived effects, costs and controls. Tab browsing is free and does not cast or move. Close the dialog to use the hotbar or gameplay shortcuts. Levels improve potency and capacity; they **never unlock spells**. Found spellbooks teach new spells when picked up, using one turn and no bag slot. Eighteen discoverable spellbooks expand the two starting spells into a twenty-spell catalog. Each full-depth seed selects 5–10 distinct eligible books; shorter adventures clamp selection to eligible kinds. Books use separate selection/floor/tile seeds, respect floor bands and safe occupancy, and never compete with ordinary potion or equipment drops. Not every seed contains every spell.

Additional spells include direct damage (Ember Bolt, Frost Bolt, Shock, Stone Lance, Sonic Spear, Drain Life), control (Web, Sleep, Fear), effects over time (Poison Dart, Renewal), temporary boosts (Protection, Strength, Dexterity), repositioning (Blink, Teleport Away), and area damage (Fireball, Frost Nova). The Spells tab and book descriptions show costs, ranges and behavior from the functional catalog. Fireball previews its wall-aware footprint on visible tiles while targeting. Both area spells hit enemies only and pay one cost/turn for the whole area.

Conditions count committed phases including the cast response, refresh without stacking and persist in saves. Inactive monster conditions pause; player conditions follow the player between floors. Slow skips alternating phases, Sleep breaks on damage, Web permits attacks but blocks movement, and Fear replaces attacks with retreat. Poison acts after retaliation; Renewal cannot revive a fatal hit. Temporary boosts change effective combat/display stats without changing earned progression.

The adventure diagnostic retains **baseline** and **spell-aware** and adds `--policy tactical-aware` for visible fixed-target dodges, cover before recovery, and archer priority. Its bounded cover memory is local to the diagnostic run. All policies use omniscient routes and are not human win-rate estimates. Output records tactical attacks, resolved damage (including overkill), level-up floor/turn, mixtures, gear usefulness, spells and potions; budget exhaustion stays separate from death. `scripts/review-performance.mjs` measures crowded pursuit and tactical domain overhead independently of deterministic run output. See [enemy tactics playtest notes](docs/enemy-tactics-playtest.md) for matched/repeated seeds, timings, commands, limitations and your playtest checklist; earlier spell comparisons remain in [mana review notes](docs/mana-review.md).


## Manual adventure saves

Open **Save/Load** to use the single browser save slot. **Save adventure** always asks for confirmation, including the first save. Replacing a slot previews both the current adventure and the old save. **Load adventure** previews the saved run and asks before replacing current progress. Cancel or Escape preserves both; neither operation spends a turn. Gameplay stays paused while Save/Load or its confirmation is open.

**Export file** downloads the current adventure as `larn-seed-SEED-turn-TURN.json`. **Import file** opens a chooser and loads a validated file immediately, without another confirmation. Export/import do not replace the local slot. Invalid, incompatible, oversized or unreadable saves leave the current run untouched. Closing Save/Load cancels an unfinished file read.

There is no autosave or automatic startup load. New Dungeon, seed replay, and reloading the page do not overwrite the slot. Load or Import restores the saved configuration for subsequent new runs, fog preferences/memory, character/inventory/shortcuts/spells, actors/loot, quest, turns/resources and activity. Dead/won runs retain their ended status. Targeting, menu selection, drafts, focus and scroll are not saved; current visibility is recomputed. Appearance remains a separate device preference.

The version-5 JSON format stores actual floor terrain/stairs and generation metadata, not just a seed. Each monster also stores its instance intent: idle, or preparing an attack at a fixed adjacent walkable tile on its own floor. Existing monsters initialize idle; prepared attack behavior is introduced separately. Terrain and remembered fog use compact row strings; the game retains its existing arrays/Map after loading. Validation checks structure, catalog kinds, coordinate/link consistency, ownership, resources, quest and history before replacing playable state. Valid version-1 saves initialize idle monsters. Valid v1/v2 characters migrate to the extended progression curve with XP retained and missing health/mana preserved; dead characters remain dead. Prepared targets survive v2 migration. Version 3 marks extended progression; version 4 retains four unique known-spell assignments. Older saves initialize assignments from known spells. Version 5 retains active timed conditions; older saves initialize no conditions. Local load and file import share this migration. Reading a legacy local slot does not rewrite it; the next confirmed save writes v5. Unsupported versions or malformed intent are rejected before replacing progress or a slot. Later required saved fields need another explicit versioned adapter at the validation boundary. Resource and catalog limits still follow current game rules: tuning them can make an older snapshot incompatible, which is reported before replacing progress rather than silently clamping it. Reproducible continuation is checked within the current game rules; later balance changes can affect subsequent turns in an older save.

Tactical continuation coverage compares full action results and actual seeded hit/damage rolls through local load and file import, before preparation, immediately afterward, and after a mixed fight. `TacticalSaveReplay.test.ts` covers adapter parity and terminal/rejection states; `HomeTacticalSaves.test.tsx` verifies dialog pause, restored Z/H shortcuts, and safe failed imports through the real page. `TacticalAdventure.test.ts` uses a short five-floor scenario with controlled hits to exercise shots, saved preparation, dodging, potion recovery, rewards, cure delivery and replay reset. The controlled scenario verifies integration, not balance; generated-run diagnostics and human play remain separate checks.

`domain/saves/SaveFormat.ts` owns snapshots, encoding/restoration and summaries. `SaveDocumentV1.ts` retains the legacy contract; `SaveDocumentV2.ts` explicitly adds persisted monster intent. The writer selects saved fields so incidental live state does not silently enter the format. `SaveValidation.ts` dispatches by version, `SaveShapeV1.ts`/`SaveShapeV2.ts` check source shapes using `SaveShapeCommon.ts`, `SaveConsistency.ts` checks playable-state invariants, and `SaveMigration.ts` adapts validated v1/v2 documents. The captured `src/__tests/fixtures/adventure-v1.json` protects compatibility independently of the current writer; do not regenerate it when changing the format. `persistence/LocalAdventureSave.ts` owns the `larn:adventure-save` localStorage key and storage errors; `AdventureSaveFiles.ts` owns file reads/downloads. The dedicated Save/Load sheet presents the flows, while Home applies the restored run atomically. No server requests or new dependencies are needed.

Saves belong to the same browser profile and origin (protocol, hostname and port). Localhost and a deployed site have separate slots; clearing site data/private-session closure can remove local saves. Export files provide backups and manual transfer. Input is capped at 4 MiB; storage failures are reported without erasing the previous slot. Measured fully explored 100×100×20 samples fit a conservative 5 MiB storage budget; see [local-save review notes](docs/local-save-review.md) for size measurements, tests and commit guidance. IndexedDB, multiple slots, autosave, further migrations and server synchronization remain future choices.

Two ring slots are available in Character. Rings fit either slot; choosing a slot, swapping or unequipping uses the ordinary equipment turn rules. Save format v10 migrates older adventures with empty left/right ring slots.

Ring bonuses are derived from equipped item definitions: Strength/Dexterity/Intelligence +2, Vitality/Mana capacity +4, copper armor +1. Capacity increases do not heal/refill; removing capacity clamps current resources. Effective combat, spells and status displays use the same loadout calculations.

Equipment comparisons list all relevant contributions. Green/red indicate clear upgrades/downgrades, blue indicates equal gear or an explicitly explained tradeoff. Rings compare each compatible slot. Basic equipment has upper floor limits so the deepest loot pool contains stronger gear and supplies rather than repeated starter equipment.

Giant spider bites poison on a landed hit: 1 damage after retaliation for three committed phases, refreshed rather than stacked. A red condition badge shows the remaining timer. Player poison travels with you across floors/saves and a fatal tick cannot be reversed by ongoing Renewal.

Trolls recover 2 HP per active phase, up to their maximum. Damage suppresses recovery on that phase and the next. Version 7 saves retain actor-owned injury timing; older actors migrate with an unknown last-injury time while preserving health and intent.

Cultists cast Ember Bolt, or Heal when badly wounded, once per three phases with actor-based staggering. Spell damage always hits and bypasses physical armor; walls and control spells can prevent the cast. Recovery phases do not grant a second attack.

Elemental resistance halves damage (minimum 1) and weakness doubles it; activity messages explain the result. Salamanders and frost giants warn a fixed, wall-aware blast area for two response turns. Walk out, reposition or interrupt the source before it resolves. The source-visible countdown and marked visible tiles pause off-floor and persist in version 8 saves. Enemy area attacks currently harm only the player.

### Dungeon doors

New adventures can contain closed doors in passages. Bump a door to open it, or press **E** to open/close a nearby door. A successful interaction uses one turn. Closed doors block movement and sight, including spells; monsters currently cannot open them. Occupied doors cannot be closed. Door state persists in saves; older saved adventures keep their original floors without newly added doors.

Gold is tracked separately from bag capacity. Walk onto coin caches to collect them automatically; defeated monsters also grant seeded, depth-scaled gold. The total appears above the dungeon, in Character and in the victory summary. Shops are deferred.

Treasure chests can appear in safe room tiles. Press **E** within reach to open one for a turn. Its seeded, depth-appropriate reward remains on the floor even with a full bag. Walk onto the reward and press **G** to collect it. An opened chest cannot pay again, including after loading.

Visible traps (floor 2+) show red warning icons. Crossing springs one for 2–6 damage within the movement turn. **E** attempts disarm: starting chance 55%, increasing 5% per Dexterity modifier up to 95%. Failure springs it. Both outcomes spend the trap permanently; protected stairs and starts never contain one.

Ancient fountains (floor 2+) offer a safe sip or risky draw. **E** opens a choice dialog; **1/2** select and **Escape** cancels without a turn. Safe sip recovers up to 3 health/2 mana. Risky draw has a 60% chance to recover up to 8 health/6 mana; otherwise it deals 3 damage and poisons for three phases. A chosen draw uses one turn and empties the fountain.

Forgotten thrones (floor 4+) offer **sit**, **pry treasure**, or free cancellation. The dialog describes the fixed risk distribution before choosing. Blessings grant ordinary XP; other outcomes restore resources, poison/wound the player, relocate safely within the same floor, or grant gold. A committed choice spends the throne for the rest of the adventure.

Shrines of insight (floor 3+) exchange **10 + 5 × floor gold** for **20 + 4 × floor XP** with ordinary automatic growth. **E** displays the exact price and benefit before accepting with **1**; **Escape** cancels freely. An offering takes one turn and spends the shrine. Insufficient gold changes nothing. Paid gold, XP and spent state persist in saves.

Visible nearby dungeon objects show their controls and live/spent state below the map. Entering an object tile adds a description to the activity log. Opened chests remain as faded crossed-chest markers; their remaining loot is on the floor for G pickup. Inspecting a spent object explains its state without taking a turn.

Rare safe-room discoveries include **sealed reliquaries** (floor 8+) and **abandoned spell archives** (floor 3+), each with a 12% per-floor chance. Reliquaries trade a confirmed 3-damage wound for a special ring. Archives release an unknown eligible book from the run’s selected spell pool, or a mana potion. Both are one-use; rewards remain on the floor for G pickup. They use existing rooms and leave dungeon terrain unchanged.

Death opens a game-over summary with the final run values and last recorded damage. Choose **New Adventure**, **Replay this seed**, or **Inspect run**; Escape also inspects without restarting. After inspection, the ended run remains available for Character, activity and save/export review. Loading a dead save shows its summary once again.

Living players below **50% of maximum health** receive a red HP value, low-health badge and a muted red adventure-container background. Exactly half health does not warn. Recovery or capacity changes update the warning immediately; death uses the game-over dialog.

Identified utility potions include Antidote (floor 2+, removes current poison), Greater healing potion (floor 8+, up to 15 HP), and Greater mana potion (floor 8+, up to 12 mana). They share normal pickup, bag, hotbar and one-turn drinking rules. A potion with no useful effect remains in the bag and spends no turn. Antidote does not grant immunity to a subsequent attack.

The dungeon camera follows with a five-tile comfort margin on each axis. On small viewports, the margin shrinks to keep the player visible; map boundaries still clamp scrolling. Manual scrolling remains intact until accepted movement, a floor change or viewport resize requires following again.

The Character dialog keeps combat and stat-growth explanations in expandable sections so the seven-column bag, equipment and potion assignments fit on a 1280×720 display. Longer selected-item details remain scrollable.
