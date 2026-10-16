# The Last Ember

An original dungeon crawler inspired by the classic roguelike **Larn**, built as a software-engineering and test-driven development practice project.

Your settlement’s protective beacon is dying. Descend beneath the old ruins, retrieve the last ember, and bring its light home. Taking it awakens its keepers; getting there is the quieter half of the journey.

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

The page opens with a brief adventure introduction. Begin Adventure generates a random frontend run; Load an existing save can resume before starting. The recommended default contains twenty 60×60 floors. Terrain and stair links are retained throughout exploration and ordinary React rerenders. The earlier fixed dungeon remains available as a test fixture.

Stair placement uses an independent seeded random source for each floor, derived from the run seed, floor number, and a `stairs` namespace. Down stairs choose equally among rooms outside the entry room, then choose a floor tile within that room. Up stairs choose their own seeded room and tile using a separate `stairs:up` stream, excluding the downstairs room where possible. Descending arrives on those actual upstairs, with reciprocal arrival coordinates. A single-room floor uses its center when distinct from the entry, otherwise its first distinct floor tile in row-major order; a floor with no distinct location fails clearly. The same seed and configuration reproduce the links regardless of floor generation or connection order, without changing terrain generation. Calls to the stair selector without a random source retain the deterministic last-room-center rule.

## Safe corridor running

Press **R**, then an arrow key or **WASD** to run a quiet corridor; **Any key** stops an active run; **Escape** also cancels direction selection. Each paced step takes an ordinary turn, including monsters, effects, recovery and discovery. A sole known bend can be followed. Running stops before rooms, junctions, unknown routes, doors, objects, loot, stairs or the entrance, and on visible creatures, damage, poison or newly revealed decisions. Step off a landmark manually before starting; existing poison denies the run without a turn. Manual actions, menus, focus loss and save/load or adventure lifecycle changes cancel it. A stopped run never resumes by itself. Run instructions are transient and saves remain unchanged. `CORRIDOR_STEP_MS` in `components/game/useCorridorTravel.ts` controls the visible pace, initially 120ms per step. See [engineering review](docs/corridor-travel-review.md).

## Repository layout

```text
larn-remake/
├── backend/                  # Spring Boot API
├── frontend/                 # React + TypeScript application
│   └── src/
│       ├── App.tsx           # Application entry and theme provider
│       ├── Home.tsx          # Play screen, drafts, dialogs and focus
│       ├── Header.tsx        # Floor display and toolbar
│       ├── domain/dungeon/   # Pure generation, run state, seeds, and configuration
│       ├── domain/game/      # Game state, player health, and action resolution
│       ├── components/
│       │   ├── dungeon/      # Map rendering, icons, legend, and scroll geometry
│       │   ├── game/         # Session coordination and gameplay dialogs
│       │   └── ui/           # Shared shadcn controls
│       ├── settings/         # Settings panel, draft parsing, and theme preference
│       ├── __tests__/        # Frontend/domain tests and shared fixtures
│       └── mocks/            # Mock API handlers for tests
├── docs/                     # Definition of Done and AI working agreement
└── README.md
```

Dungeon responsibilities are split into focused modules in `domain/dungeon`: `DungeonTypes.ts` defines shared shapes, `Tiles.ts` defines tile identifiers, `Terrain.ts` creates and carves grids, `DungeonGeneration.ts` coordinates generation, and `DungeonLocations.ts` selects player and stair positions. `Partitioning.ts`, `Room.ts`, and `Corridor.ts` implement the generation steps; `DungeonRun.ts` manages floors, movement validation, and stair transitions. `moveDungeonRun` accepts a direction, returns the unchanged run for blocked moves, and applies at most one stair transition after a successful move. Map components translate keyboard input into direction requests; Home applies those requests through the domain. Terrain grids and rows are readonly to preserve the references used by rendering memoization. The domain has no React or settings dependencies. The fixed dungeon and its starting coordinate live in `__tests__/testhelpers.ts`.

`components/game/useAdventureSession.ts` owns game state, active configuration, fog and exploration together. New and loaded adventures replace this session atomically; Home retains settings drafts, dialog lifecycle and focus. Player actions continue through the domain resolver, with visible history and discovery projected by the session hook.

`domain/saves/SaveSource.ts` dispatches supported source versions and derives their union from the same guard registry. `SaveValidation.ts` checks the source before migrating historical data, then checks the migrated result. Current v20 snapshots need one consistency pass. `SaveConsistency.ts` coordinates inventory ownership, resources, geometry, actors and history checks in separate modules. Historical shape guards, migration adapters and captured compatibility fixtures remain explicit.

## Prerequisites

- Java 21
- Node.js 24.20.0 (`nvm use` reads `.nvmrc`)
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

The game runs entirely in the browser and does not call the backend or display a server-status footer. Java is not required to play. The development proxy for `/initial` remains available at `http://localhost:8080` for future backend integration; the standalone `APICheck` component is not mounted by the game.

## Starting equipment

Every new or replayed run starts with a short sword in the main hand and a wooden shield in the off hand. Equipment is retained through movement, combat, waiting, and floor traversal. Each item copy has a stable run-local ID separate from its shared item kind. Starting IDs are reproducible across resets; item objects are created fresh for each run.

`domain/items/Item.ts` defines shared item names, types, floor eligibility, weights, and bonuses. `domain/items/Equipment.ts` validates four slots and creates the starting loadout. Equipment lives in `GameState`; health lives in `PlayerStats`. The centered Character dialog shows health, damage range, accuracy, and armor, alongside selectable head/chest/main-hand/off-hand slots and a compact bag. Select gear to inspect its contribution or unequip it; empty slots are labeled. Opening/browsing costs no turns, gameplay keys pause, and I/i or C/c, Escape, or Close dismisses it with focus restoration. Starting nominal attack is base 1 + short-sword bonus 1, giving a landed raw range of 1–3. Shield, chest, and head armor add once; accuracy and damage mitigation are separate. See the reproducible melee rules below.

## Starter bag

Partially drinking, enchanting with, or dropping a consumable stack keeps that stack and unrelated items in their current bag positions. Character keeps the remaining stack selected and resolves its actions against the next owned copy. Removing the final copy clears its selection and compacts the bag; picking that kind up again creates a stack at the end. Matching pickups join an existing stack. Equipment sales retain their existing removal/compaction behavior. Save format v20 retains the resulting order without a migration. See [the stack stability review](docs/stable-consumable-stacks-review.md) for the engineering walkthrough and verification.

The Character dialog also shows a 27-slot bag in a responsive grid (nine columns on laptop/desktop widths), separate from equipped gear. Identical potion kinds share one slot with a quantity; other carried items use individual slots. Every bottle retains its identity, and drinking or dropping removes one bottle. Matching potions can be picked up even when all slots are occupied. New/replayed runs start with one regular Healing potion and one regular Mana potion in the bag, an equipped short sword (weapon bonus +1) and an equipped wooden shield (armor 1). Loading an existing save preserves its carried items. Carried bonuses do not affect combat until the item is equipped.

Select an item with the mouse, or Tab to it and press Enter/Space, to read its type, description, and contribution. Browsing costs no turns and background movement/waiting stays paused. Explicit gear buttons still resolve normal turns; a dialog summary shows the current turn, health, equipment actions, and monster responses. Empty/full bags display used and available capacity; bag contents persist through combat, movement, and floor visits. `domain/items/Bag.ts` owns capacity, ownership checks, and starting contents; `BagContents.tsx` presents 27 compact slots, including non-interactive empty slots. `CharacterDialog.tsx` owns one shared selection across equipment and bag; `ItemDetails.tsx` shows the selected item and its explicit actions below the bag. Equipment stacks above the bag on narrow screens; dialog controls and action feedback remain visible while its body scrolls. Use Drop item on a carried item or Pick up in the On your tile section. Each successful transfer costs one turn and runs the monster phase; invalid/full-bag transfers cost nothing. Unequip worn gear before dropping it. Identical potions share a counted slot; gear remains individual. Spatial packing remains deferred. `EquipmentChanges.ts` validates and transfers gear; `FloorItems.ts` manages floor ownership and pickup/drop; `PlayerActions.ts` resolves its turn and monster phase.

Floor items are retained across visits and reset with the run. Entering an item tile announces all its item names in one activity entry before monsters respond, including after stairs. This uses the movement turn; waiting and non-movement actions do not repeat it. Leaving and returning announces remaining items again. The map shows them only in current sight (remembered tiles retain terrain), with player/monster/stair symbols taking priority. Multiple items can share a tile and do not block movement or stairs. Each floor starts with up to two items on distinct walkable room tiles, excluding stairs, arrivals, player start, and initial monsters. `ItemPlacement.ts` creates this population once per run using indexed `seed:floor:items:index` namespaces; `Loot.ts` holds the small shared loot catalog. Positions are chosen before item kinds, and loot never consumes terrain/stair/monster random streams.

Goblin deaths have a 50% chance to drop one item from the shared loot catalog. `MonsterDrops.ts` derives that decision from `seed:floor:monster-drops:monsterId`, independent of kill order and other streams. Drops appear on the death tile, may coexist with other items, and persist across visits. The hit and death log entries precede any loot announcement; the defeated monster is removed, so later actions cannot resolve its drop again.

## Healing potions

Healing potions are identified consumables in the shared floor-loot and goblin-drop catalog; new adventures start with one Healing potion on key 1 and one Mana potion on key 2. Identical potions share one counted bag slot and supports the same pickup/drop rules as gear. Select one in Character and choose **Drink potion**. It restores up to **5 health**, capped at maximum health, removes that specific copy, and records the actual recovery. A successful use costs one turn and heals before the normal monster phase; retaliation can still kill you. Full-health use is rejected without consuming an item or turn, and dead players cannot drink. New/replayed runs reset health, ownership, and history. `Consumables.ts` owns validation and recovery; `PlayerActions.ts` applies the turn and monster phase. Potions have no equipment slot. Assigned potion shortcuts use keys 1–4.

## Potion hotbar

Four run-local slots hold potion-kind assignments. Fresh adventures and replays start with Healing potion on 1 and Mana potion on 2, one carried bottle each; slots 3/4 are empty. Players can reassign or clear these defaults freely, and loading a save preserves its actual bag and shortcuts without granting supplies. Picking up the first carried copy of an unassigned potion kind automatically assigns it to the first empty slot (1–4), as part of the normal pickup turn. Existing assignments are preserved. If you clear a shortcut while still carrying that kind, additional copies do not reassign it; after carrying none, a later pickup can assign it again. A full hotbar never blocks pickup or overwrites a slot. Assigning, moving, or clearing an assignment is free and does not move bottles out of the bag. Assigning a kind to another slot moves its existing assignment, avoiding duplicate shortcuts. Availability is derived from carried copies, so dropping or drinking the last bottle leaves an unavailable assignment, and collecting another restores it. Activation consumes the first matching bag copy through the normal potion action; successful potion recovery costs one turn and runs the monster phase afterward. Empty slots, missing bottles, and a full relevant resource cost nothing. Activation is disabled after death; assignments are configuration and can still be edited. New/replayed runs restore these starting assignments. `domain/items/PotionHotbar.ts` owns assignments and inventory-derived availability. Select a potion in Character, then choose assignment button 1–4 in its details. The Potion shortcuts section shows all assignments/counts and Clear controls. Assignment controls are also available after death, since they change configuration rather than using a potion. Above the map, four numbered slots appear to the left of the player icon/status, showing the potion icon and carried count. Click a slot or press 1–4 from gameplay to use it; clicking returns focus to the map. Empty/unavailable/full-health attempts show feedback without spending a turn. Number keys ignore repeats and modified shortcuts, and respect open menus, controls, editors, and log focus. Slots wrap above player status on narrow screens.

## Controls

The header shows the current floor, **New Dungeon**, **Character**, **Save/Load**, **Settings**, and **Help**. Help opens a sheet with keyboard controls, map symbols and fog colors, and notes about exploring and combat. The potion and spell hotbars, player status, map, and activity log occupy the main play area. Settings opens a modal side panel containing the current seed and seed replay form. The game runs entirely in the frontend without a backend connectivity check.

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

**G** (or lowercase **g**) picks up the sole item on your tile immediately. With multiple items, a compact chooser lists current-tile loot; each selection uses one turn and runs the normal monster phase. Opening or dismissing it is free, and Escape/Close returns focus to the map. In the chooser, **1–9** picks the matching numbered choice rather than using a potion. Larger piles have nine choices per page; use **Page Up / Page Down** or the page buttons. Choices renumber after pickups. The chooser closes when the tile is empty or the player dies. Empty tiles and full bags show feedback without spending a turn. Held-key repeats and Ctrl/Alt/Meta shortcuts do not pick up; gameplay keys pause in all menus and the chooser, and G is ignored in focused controls, editors, and the activity log. Character pickup controls remain available. Picked-up gear automatically equips into an empty compatible slot (rings fill left, then right), even if the bag is full. Occupied slots are never replaced automatically; those items go to the bag. Pickup and automatic equip use one turn, with the gear effective before monsters act and both actions recorded in the log.

Successful stair traversal adds a turn-stamped activity message (for example, “You descend to floor 2.”). This appears before arrival loot or monster actions; arriving on the linked stair does not trigger another transition. Stair icons include directional arrow cutouts in both the map and Help legend.

The player can move through rooms and corridors but cannot move through wall tiles or beyond the dungeon boundary. **Spacebar** waits one turn without moving or attacking, allowing a lone goblin to approach or hit while you stand still. Waiting does not activate a stair or add a log message of its own. It runs the normal monster phase and costs one turn even when no monster acts. Holding Spacebar does not repeat waits; press it again for another turn. Gameplay movement and waiting are paused while Settings, Help, or Character is open. Escape dismisses the open menu and restores focus to its opener. I/i and C/c also close Character. Focus the map to resume gameplay; Space retains its normal behavior on focused controls, in editors, and in the activity log. Waiting is disabled after death.

The **Activity** log below the map retains the most recent 100 events, with turn numbers and messages in resolution order. It has its own scroll area and politely announces new entries without changing focus. New messages follow automatically while you are at the bottom; scrolling back keeps your reading position, including when older entries are trimmed. Returning to the bottom resumes following. If the entry being read is removed by the history limit, the log shows the oldest remaining entry. Keyboard users can focus the log to scroll without moving the player, then focus the map to resume movement.

History survives floor visits and Settings/appearance changes; New Dungeon and seed replay clear it. Ordinary movement does not create log entries. Gear changes emit equip/unequip events before monster responses. Combat emits hit, miss, and monster-death events in player-first, numeric monster order. Hits report resolved post-armor damage, including the rolled hit damage on overkill; misses report no damage. Before the first fight, the log shows **No activity yet.** A fatal monster attack adds player-death after the monster-hit event. `ActivityHistory.ts` stores structured events and the shared history limit; `ActivityMessages.ts` controls their readable wording, and `ActivityLog.tsx` handles display and scrolling.

A fresh run places a capped density of eligible monsters on every floor. Placement uses an independent seed namespace per actor, `seed:floor:monsters:index`, choosing without replacement from floor tiles in row-major order. Player start, stairs and linked arrival coordinates have a one-tile orthogonal spawn buffer; insufficient space reduces the count, including to zero. The deepest floor also reserves its future down-stair location and buffer, using the shared stair calculation, so increasing floor count preserves existing populations. Counts and existing placement prefixes remain independent of terrain random draws. Monsters retain their identity, location, and current health across floor visits.

There is no timed spawning or respawning. Initial population creation happens once per run; replay restores full-health actors at their original seeded positions. Reproducibility applies to the same seed/configuration and generator version; adding entry buffers changes placements from the earlier single-monster version.

Monsters are displayed only within current sight, or with fog disabled; remembered tiles retain terrain rather than monster silhouettes. Bumping a monster spends one turn and keeps the player in place, whether it hits or misses. With the starting short sword, landed raw damage is 1–3. A killing blow removes the monster and resolves its drop once, preventing that monster's retaliation; other living active monsters still take their phase. Adjacent detected monsters attack once, while a monster moving into adjacency cannot attack in the same phase. Stairs run the destination floor's phase, inactive floors freeze, and death stops later attackers. Blocked steps, menu browsing, and rejected inventory/potion actions remain free.

Goblins detect the player within a circular radius of 6 tiles with wall-blocked line of sight, independently of player fog settings. A detected nonadjacent player is pursued one orthogonal tile along a shortest legal path toward adjacency. Equal routes prefer up, right, down, then left. Moving into adjacency does not also attack that turn; without current detection the goblin stays still. Monsters avoid living actors, the player tile, stairs and linked arrival coordinates. Movement/detection does not add activity messages.

Goblin base stats (maximum health 4, attack damage 1 and detection radius 6) live in `frontend/src/domain/monsters/Monster.ts`. Its SVG, color class, and accessible label are mapped in `frontend/src/components/monsters/MonsterVisuals.ts`; the custom SVG is `GoblinIcon.tsx`, and the reserved hostile light/dark palette are defined in `App.css`. Monster instances are stored in game state separately from dungeon terrain and discovery. The map renders all active-floor actors, grouped by row, and retains unchanged actor rows/cells during movement. IDs encode `floor:spawnIndex`; monster phases use numeric spawn order independently of array storage order. Each actor sees earlier actors' final positions, so collisions prevent overlaps and passing through occupied tiles. Multiple adjacent goblins can each hit once, stopping immediately on player death. Floors with no eligible tile have no monster.

The player status above the map groups **Health**, **Mana**, **Gold**, and **Level** into compact cards, with turn count in the panel header. Health and mana include reserve bars; low health highlights the Health card. A fresh run starts at turn 0 with 10 / 10 health. Each wait or successful movement action costs one turn, including entering a staircase and arriving on the linked floor. Walking into a wall or beyond the map costs no turn. Settings, fog changes, appearance changes, unused keys, and manual scrolling also cost no turns. Health and the turn count are retained across floors; **New Dungeon** and seed replay reset both, even when the seed repeats. Monster attacks reduce health, clamped at zero. At zero health, the run ends with a visible death message and gameplay input stops. Settings, log scrolling, New Dungeon, and seed replay remain usable. Successful restart/replay restores full health, turn zero, initial monsters, and fresh activity/discovery; invalid input or generation failure keeps the ended run intact. Healing potions restore health before monsters act.

PlayerActions supplies one candidate committed turn to the player effect, retains the original state if the action is rejected, then runs one ordered monster phase and end-of-turn recovery on success. Movement applies at most one stair transition; victory ends the turn before retaliation. A bump into a living monster instead resolves a player hit or miss, monster death if killed, then the monster phase and ordered log entries together without committing the tentative movement. Home refreshes visibility from the final position and updates game state and discovery together. Blocked movement and all gameplay actions after death retain the original state. A broken stair link still raises the existing domain error without modifying the input state. `domain/monsters/MonsterTurns.ts` resolves the monster phase; `domain/game/PlayerActions.ts` is the turn-aware action entry point; `GameState.ts` creates fresh run/player state, and `PlayerStats.ts` holds base health/attack defaults; `CombatStats.ts` derives equipment values for both the sheet and combat. Hit events record resolved damage after armor but before clamping remaining health, preserving the existing overkill convention. Dungeon generation and fog remain separate responsibilities.

Goblin archers appear on floors 2–10 with relative spawn weight 1, with 5 HP, nominal damage 2, detection radius 6 and 6 XP. After ordinary wall-blocked detection it uses melee when adjacent, shoots at Manhattan distance 2–4, or pursues one tile beyond shooting range. A phase never moves and attacks together. Shots reuse player evasion, bounded damage and armor, with distinct activity messages and a seeded `actor-ID:shot` attack namespace. Creatures do not intercept shots. Its cyan goblin-face-and-bow icon identifies it as a creature rather than loot. It joins the existing seeded population rather than increasing the total monster count.

Dungeon brutes appear on floors 4–12 with relative spawn weight 1. A brute has 10 HP, nominal damage 5 (raw 4–6), detection radius 6 and 12 XP. A detected adjacent brute spends its phase preparing a heavy attack at a fixed tile. The next committed player action is the response: move away to avoid it, or hold position and resolve the hit/miss with ordinary evasion and armor. Healing, casting and gear actions happen before retaliation; rejected actions and browsing are free. Resolution clears intent and spends that phase even on a dodge or miss. Inactive floors pause preparation, and save/load retains its original target. Brutes use a separate seeded `actor-ID:heavy` namespace and an indigo broad-jawed silhouette. A visible prepared target has a danger border and warning badge while retaining its player/stair/item icon; hidden monsters and remembered/undiscovered targets never expose markers. Preparation messages receive warning emphasis, and Help explains both tactics. New adventures include both tactical kinds within the existing 12-monster cap and safe entry buffers. Repeating a seed/configuration reproduces kinds, positions and idle initial intent; increasing run depth preserves earlier populations. Loaded adventures keep their saved actors, wounds and intent without resampling or respawning.

For recorded five-floor content review results and browser checks, see [content and combat review notes](docs/content-combat-review.md). Catalog or combat changes can alter old keyboard scripts; replay guarantees apply to the same rules version, seed, configuration, and action sequence.

Tiles use gray brick walls, faint floor dots, and a red player from Lucide, plus custom amber staircase silhouettes. Steps rising from left to right indicate up stairs; steps falling from left to right indicate down stairs. The player icon covers a stair while occupying it; the stair reappears after moving away. Icon choices, colors, and accessible labels are centralized in `frontend/src/components/dungeon/TileVisuals.ts`; the custom SVGs live in `frontend/src/components/dungeon/StairIcons.tsx`.

Help’s **Map symbols** section identifies the player and both stair directions and explains visible, remembered, and undiscovered tiles, even when fog is disabled. Map tiles stay square, with their size controlled by `--dungeon-tile-size`. The map uses the remaining play area; scroll within it to explore portions outside the viewport. Keyboard users can focus the map and use Page Up/Page Down for vertical scrolling; arrow keys and WASD continue to move the player.

Stepping onto a stair automatically changes floors. The depth heading shows the current floor and total floor count.

To replay a dungeon, open **Settings**, enter a seed in **Dungeon seed**, and select **Start from seed** or press Enter. Seed input accepts decimal whole numbers from `0` to `4294967295`; surrounding whitespace and leading zeroes are normalized. Replay starts on floor 1 and reproduces every floor and stair link for the same generation configuration. Successful replay closes settings; invalid input keeps the panel open with an accessible error and leaves the run intact.

The map automatically scrolls just enough to keep the player visible, with a five-tile comfort margin on each axis where possible. The margins shrink on small viewports. Following works horizontally and vertically, after stairs or a fresh run, and when the map viewport resizes. You can still scroll manually to inspect the map; ordinary rerenders, Settings, and appearance changes leave that view alone. The next successful move or floor/run change resumes following. Blocked movement does not scroll, and following does not move focus or scroll the outer page.

**Dungeon configuration** in Settings lets you choose 10–100 rows, 10–100 columns, and 5–20 floors. Defaults are Medium (40 × 40) with 20 floors, with minimum partition size 8 and room padding 1. **Start from seed** applies the seed and configuration together, starting a new run on floor 1. Editing or dismissing settings retains drafts without changing the run. **New Dungeon** uses the last successfully applied configuration and resets drafts to it. These settings last for this session; only appearance is saved across reloads.

Inputs require decimal whole numbers. Invalid fields show feedback without replacing the run. Generation failures show a retry message and preserve the current run, active configuration, and draft.

Rooms have at least 3 walkable tiles on each axis and a longest-to-shortest side ratio no greater than 3:1. Seeded generation randomly chooses height, then a width compatible with that height, then placement within the padded partition. Corridors remain one tile wide and are not subject to room proportion rules. Partition minimum 8 provides fewer, larger rooms than the previous minimum 5 without making every room fill its partition.

Smaller domain-level maps remain available for test fixtures. When padding leaves fewer than 3 tiles on an axis, the room minimum relaxes only on that axis, and the other side is capped to retain the 3:1 ratio. A region with no usable interior still throws a `RangeError`. Without a random source, the room uses the largest compatible dimensions at the padded origin.

Room sizing and the partition default intentionally changed in #45. Previously recorded seeds may produce different layouts and stair locations. Repeatability applies to the same seed, configuration, and generator version; it does not guarantee compatibility with earlier generator versions.

**Fog of war** starts enabled with a visibility radius of 8 tiles. Sight uses a circular radius and stops at walls: the first wall is visible, but tiles behind it are hidden. Two walls touching diagonally block sight through their shared corner. Visible tiles use their normal colors; previously seen tiles remain dimmed; undiscovered tiles reveal neither terrain nor stairs. Each floor remembers its own discoveries when you leave and return.

In **Settings**, **Enable fog of war** immediately switches between exploration and a full-map view. **Visibility radius** accepts whole numbers from 1 to 20; select **Apply visibility radius** or press Enter to apply it without restarting or moving the player. Reducing the radius retains previous discoveries. Disabling fog reveals the map for viewing, while exploration memory continues to record only tiles within normal sight. Re-enabling restores that memory. These preferences last for the current session and survive new dungeons, seed replay, and appearance changes; reloading restores the defaults. New dungeons and seed replay clear every floor's discovery memory, even when the seed repeats. Fog never changes generated terrain, seeded randomness, collision, or stair links.

**Appearance** in Settings offers Light, Dark, and System. Dark is the default. Your choice is saved locally on this device; System follows changes to the operating system appearance. Changing appearance preserves exploration, seed drafts, and validation feedback. UI and dungeon colors are defined together in `frontend/src/App.css`, with charcoal/amber dark colors and a warm stone light palette.

Settings focuses the seed input when opened and contains keyboard focus while open. Game movement and stair transitions are suspended throughout the panel. Use Escape or **Close** to dismiss it without applying a draft; focus returns to the dungeon map and all gameplay shortcuts resume. Focused toolbar controls retain their own keys. Opening, closing, or editing settings does not regenerate the dungeon. Unsubmitted drafts are retained during this session; **New Dungeon** resets the draft and feedback to match the new run.

**New Dungeon** requests a random seed across that same range and replaces the entire run: all floors and stair links, depth, and player position. It returns the player to floor 1 at the new run's selected start. The displayed seed and input update to the new seed. A random seed can repeat; restarting still resets exploration, including when the seed repeats.

To demonstrate the exploration milestone:

1. Note the displayed seed and explore toward a descending staircase to descend from floor 1 to floor 2, then floor 3.
2. Step onto an ascending staircase to return through the same floors to floor 1. Arrival places the player on the matching stair; move away and step back onto it to use it again.
3. Open **Settings**, enter the noted seed, and start from it to recreate the complete run at its original start.
4. Select **New Dungeon**, then explore again. Subsequent transitions use the new run's floors.

Floor 1 has no up stair, and the deepest floor has no down stair. Floor count is configurable in Settings, from five to twenty floors; the recommended default is twenty 40×40 floors. Town and broader progression remain future work; local save/resume is implemented.

## Configuration

Start with `domain/dungeon/RunConfiguration.ts` when tuning dungeon generation. Configuration is organized by responsibility:

| File | What it controls |
| --- | --- |
| [RunConfiguration.ts](frontend/src/domain/dungeon/RunConfiguration.ts) | Dungeon defaults, configuration types, and input limits: rows, columns, floor count, minimum partition size, room padding, minimum room size, maximum room aspect ratio, and fog defaults/radius limits. `MAX_FLOORS` is shared by input limits and monster/item catalog bounds. |
| [FeatureFlags.ts](frontend/src/settings/FeatureFlags.ts) | Developer Catalog visibility; defaults on. |
| [UIConfiguration.ts](frontend/src/settings/UIConfiguration.ts) | Internal player-follow margins in tile units, independently configured horizontally and vertically; both default to five. These are not saved Settings controls. |
| [RunConfigurationDraft.ts](frontend/src/settings/RunConfigurationDraft.ts) | Settings draft types, conversion to input strings, and parsing/validation against the shared limits. |
| [FogConfigurationDraft.ts](frontend/src/settings/FogConfigurationDraft.ts) | Parsing and validation of the visibility-radius setting against the shared limits. |
| [App.css](frontend/src/App.css) | Tile size, light/dark theme colors, fog backgrounds and remembered-icon opacity, and shared styling. The `--dungeon-tile-size` variable sizes dungeon cells, grid columns, and legend icons together. |
| [TileVisuals.ts](frontend/src/components/dungeon/TileVisuals.ts) | Tile icon choices, color classes, backgrounds, and accessible labels. |
| [ActivityHistory.ts](frontend/src/domain/game/ActivityHistory.ts) | Structured activity events, stable entry IDs, and the recent-history limit (100 entries). |
| [MonsterPlacement.ts](frontend/src/domain/monsters/MonsterPlacement.ts) | Safe-space density (one per 30 eligible tiles, minimum 2 and maximum 12, bounded by available space), indexed placement seeds and protected entry buffers. |
| [PursuitRules.ts](frontend/src/domain/monsters/PursuitRules.ts) | Ordinary and escape detection bonuses, last-seen memory, search and blocked-phase budgets. |
| [EscapeEncounters.ts](frontend/src/domain/monsters/EscapeEncounters.ts) | Return encounter density/caps, independent seed streams and three-step arrival buffers. |
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

Run the isolated browser smoke suite against a production build:

```bash
pnpm --filter frontend exec playwright install chromium # Once per browser version
pnpm frontend:smoke
```

Five Chromium flows check start/settings choices and focus, file import and potion/spell shortcuts, confirmed local save/load and immediate healing, a fatal turn followed by replay, and native keyboard merchant comparisons followed by a deliberate sale. Each test has fresh storage; generated, validated compact saves stay under ignored `frontend/e2e/.generated`. The suite owns preview port 4179 and requires it to be free. It does not use Java or your open browser/save slot. Failures retain screenshots and traces; view the report with `pnpm --filter frontend exec playwright show-report`. Vitest and the browser suite remain separate.

The GitHub Actions workflow defines frontend Biome, complete tests, strict TypeScript and production build, plus independent Java 21/Gradle wrapper tests. The toolchain uses `.nvmrc` and the root `packageManager`; install with `pnpm install --frozen-lockfile` from the root. Tests use two workers on CI and backend reports are retained for seven days. Local commit hooks remain unchanged. See [CI and browser review notes](docs/ci-browser-review.md) for verification status.

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

## Ember-and-return adventure

Descend to the deepest configured floor, recover the amber flame-and-coal **Last Ember** with **G** or Character's pickup controls, then return to the blue doorway **entrance** on floor 1. The entrance is the original starting tile; floor 1 still has no up stair. Step onto the entrance carrying the ember to win. Returning without it logs a reminder, and waiting at the entrance does not deliver it.

The ember is separate from a healing potion. It occupies a protected quest pouch rather than a bag slot, so a full bag cannot prevent recovery. It cannot be drunk, equipped, or dropped. Recovery takes one turn with normal monster retaliation. The final delivery movement takes one turn and ends the adventure before retaliation. There is no quest timer or required boss.

Quest progress appears above the map and in Character. Victory opens a summary of seed, floor count, turns, confirmed monster kills, remaining health, final level, and total XP. **Review run** (or Escape) dismisses it for inspection; **Victory summary** reopens it. Gameplay and item actions stay disabled after victory. **Replay this seed** resets the same configured adventure, and **New Dungeon** creates another seed with the applied configuration. Settings can also start another adventure. Death continues to prevent delivery.

`Adventure.ts` owns quest metadata and instructions; `CurePlacement.ts` places one reachable ember using `seed:floor:quest:cure`, independently of ordinary loot and monsters. Placement favors an unoccupied room tile away from stairs and arrival, with a reachable fallback for constrained test floors. Victory is captured by the pure player action resolver. Confirmed kill totals are retained separately from the bounded activity log.

For reproducible five-floor checks, run `pnpm --filter frontend exec node scripts/review-adventure.mjs`. See [adventure review notes](docs/adventure-review.md) for recorded outcomes, browser checks, and the story review guide. These diagnostic runs demonstrate achievable adventures; they are not a human playtest or a guarantee that every seed or twenty-floor run is balanced.

## Depth content catalog

Monsters use inclusive floor bands and positive relative spawn weights. Goblins (health 4, damage 1, sight 6, weight 3) are eligible on floors 1–5; giant rats (health 2, damage 1, sight 5, weight 2) on 1–4; orcs (health 7, damage 4, sight 6, weight 2) on 3–10. These three kinds share orthogonal melee pursuit. These are initial playtest values.

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

Characters start at level 1 with 0 XP. Confirmed player kills award rat/goblin/archer/orc/brute rewards of 2/5/6/10/12 XP. Total XP is retained, with levels derived from cumulative thresholds `10 × n × (n − 1) / 2`: levels 1–5 require 0/10/30/60/100 XP. Character level is capped at 20, independently of dungeon depth. Above level five, cumulative XP is `100 + 10 × (n × (n − 1) − 20)`: level 6 needs 200, level 10 needs 800, level 15 needs 2,000, and level 20 needs 3,700. Matched expanded-adventure diagnostics reached levels 13–19 on floors 12–18; the current curve is retained pending human playtests.

Each gained level adds 2 maximum health and 2 current health, preserving missing health rather than granting a full heal. For example, 6/10 becomes 8/12. Multiple-level rewards apply every earned benefit through level 20. XP continues accumulating at the cap, but further rewards do not heal or grow attributes. `Progression.ts` owns the curve, cap, and health benefit; monster definitions own their rewards. XP and health level-ups apply within the kill action before surviving monsters retaliate, with no extra turn. The log records the reward and every crossed level after the death message. The HUD Level card shows a compact progress bar and earned / required **XP**, derived from the same presentation and rules as Character. Character also shows total XP and the amount needed for the next level. At level 20 the HUD shows **Maximum level reached** and retained **XP total**, with no next-level bar. Loading, restarting and ending a run use the actual adventure XP without separate progress state. Victory captures final level and total XP. Both I and C toggle the combined Character/Inventory dialog; Escape also closes it.

Recorded XP/health checkpoint results are in [progression review notes](docs/progression-review.md). The diagnostic accepts seed batches, dimensions, floor count, and action budgets; reports per-seed level, total XP, attributes, equipment, health, floor checkpoints, and an aggregate summary. See the review notes for commands and results; `LARN_REVIEW_TRACE=1` includes its action trace.

Strength starts at 10 and automatically gains 2 every odd level from level 3. Its modifier is `floor((Strength − 10) / 2)`, added once to nominal player damage: base 1 + Strength modifier + weapon bonus. With the short sword, level 1 deals 1–3 raw damage; level 3 deals 2–4; level 5 deals 3–5. Unarmed attacks also use Strength. Equipment changes do not change earned attributes; capped XP grants no further growth. Strength gained from a kill affects subsequent attacks, not the blow that earned it. Enemy damage remains catalog-based.

Dexterity starts at 10 and gains 2 every even level. Its modifier (`floor((Dexterity − 10) / 2)`) still adds 5 percentage points per point to player hit chance. Here `floor` means round down; evasion does not depend on dungeon depth. Evasion starts at 20%, gains 5 percentage points per 2 total Dexterity through 20, then 5 per 4 additional Dexterity. Both chances are clamped to 5–95% and resolved with the same keyed D20 rolls. Total Dexterity 20/24/30/32/34 gives evasion 45%/50%/55%/60%/60%; odd Dexterity rounds down, and some +2 bonuses above 20 need another +2 before increasing evasion. Character and equipment/merchant comparisons use the same shared rule; Character's growth details show actual capped chances and explain diminishing returns. Armor reduces landed damage separately. Earned evasion applies before retaliation on the level-up turn.

The approved [shared evasion experiment](docs/evasion-balance-review.md) retains the v20 save schema and actual saved wounds, preparation, inventory and effects. Existing saves immediately derive the revised evasion from their saved XP/loadout/effects; exact combat outcomes from the previous rules version are not retained. Run `pnpm --filter frontend exec node scripts/review-evasion.mjs` for deterministic `legacy` versus live `applied` pressure, encounter and reward measurements. Final tuning awaits human playtest feedback.

Living players strictly below half their maximum health see a red current-health value, an icon/text warning and a muted red adventure-container background. Exactly half health does not warn. Character uses the same proportional health treatment; recovery/capacity changes update it immediately, and death opens the game-over dialog.

The activity log gives level-ups and adventure completion a highlighted row with a milestone icon. Attribute growth uses lighter emphasis; death uses the danger color. Routine XP, combat, loot, and travel keep their normal presentation. Message order, polite announcements, and scroll following are unchanged.

Carried gear previews the **whole current loadout** with one compatible slot replaced: green **Better**, blue **Same/Tradeoff**, red **Lower**. Item details show current → replacement maximum health, maximum mana, melee damage range, Intelligence-derived spell damage and Heal bonuses, total armor, hit chance and evasion; raw Strength, Dexterity and Intelligence remain in expandable attribute details. The calculations include current level, the other ring, enchantments and active effects. Replacement values show gains in green, losses in red, and unchanged values in the normal theme text color; signs and before/after text remain readable without color. Badges consider both practical outcomes and attributes, so gains with losses are a Tradeoff. Ring details show both destinations, while the bag badge chooses the most useful compatible slot. Capacity gains do not refill health/mana, and reduced capacity can clamp current resources. These are previews before the equipment-change turn and enemy response; browsing is free and never mutates the adventure. Potions and quest items are excluded. Spell/Heal bonus rows show the same Intelligence modifier used by casting, such as +1 → +2 (+1), in Character and merchant comparisons. The spell bonus adds to each damaging spell’s own range; Heal receives the same bonus. Control, fixed ongoing effects and repositioning do not scale this way, and target defenses and area rules remain spell-specific. These derived previews do not change combat or the v20 save format.


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

The Character dialog defaults to **Character** each time it opens; **Spells** lists authoritative known spells and lets you assign six hotbar slots on keys **5–9 and 0** with derived effects, costs and controls. Tab browsing is free and does not cast or move. Close the dialog to use the hotbar or gameplay shortcuts. Levels improve potency and capacity; they **never unlock spells**. Found spellbooks teach new spells when picked up, using one turn and no bag slot. Eighteen discoverable spellbooks expand the two starting spells into a twenty-spell catalog. Each full-depth seed selects 5–10 distinct eligible books; shorter adventures clamp selection to eligible kinds. Books use separate selection/floor/tile seeds, respect floor bands and safe occupancy, and never compete with ordinary potion or equipment drops. Not every seed contains every spell.

Additional spells include direct damage (Ember Bolt, Frost Bolt, Shock, Stone Lance, Sonic Spear, Drain Life), control (Web, Sleep, Fear), effects over time (Poison Dart, Renewal), temporary boosts (Protection, Strength, Dexterity), repositioning (Blink, Teleport Away), and area damage (Fireball, Frost Nova). The Spells tab and book descriptions show costs, ranges and behavior from the functional catalog. Learned spell cards show full descriptions directly, with shared casting instructions above the library. Number-only buttons assign keys 5–9 and 0; highlighted buttons and descriptive accessible names identify current assignments. Fireball previews its wall-aware footprint on visible tiles while targeting. Both area spells hit enemies only and pay one cost/turn for the whole area.

Conditions count committed phases including the cast response, refresh without stacking and persist in saves. Inactive monster conditions pause; player conditions follow the player between floors. Slow skips alternating phases, Sleep breaks on damage, Web permits attacks but blocks movement, and Fear replaces attacks with retreat. Poison acts after retaliation; Renewal cannot revive a fatal hit. Temporary boosts change effective combat/display stats without changing earned progression.

The adventure diagnostic retains **baseline** and **spell-aware** and adds `--policy tactical-aware` for visible fixed-target dodges, cover before recovery, and archer priority. Its bounded cover memory is local to the diagnostic run. All policies use omniscient routes and are not human win-rate estimates. Output records tactical attacks, resolved damage (including overkill), level-up floor/turn, mixtures, gear usefulness, spells and potions; budget exhaustion stays separate from death. `scripts/review-performance.mjs` measures crowded pursuit and tactical domain overhead independently of deterministic run output. See [enemy tactics playtest notes](docs/enemy-tactics-playtest.md) for matched/repeated seeds, timings, commands, limitations and your playtest checklist; earlier spell comparisons remain in [mana review notes](docs/mana-review.md).


## Manual adventure saves

Open **Save/Load** to use the single browser save slot. **Save adventure** always asks for confirmation, including the first save. Replacing a slot previews both the current adventure and the old save. **Load adventure** previews the saved run and asks before replacing current progress. Cancel or Escape preserves both; neither operation spends a turn. Gameplay stays paused while Save/Load or its confirmation is open.

**Export file** downloads the current adventure as `larn-seed-SEED-turn-TURN.json`. **Import file** opens a chooser and loads a validated file immediately, without another confirmation. Export/import do not replace the local slot. Invalid, incompatible, oversized or unreadable saves leave the current run untouched. Closing Save/Load cancels an unfinished file read.

There is no autosave or automatic startup load. New Dungeon, seed replay, and reloading the page do not overwrite the slot. Load or Import restores the saved configuration for subsequent new runs, fog preferences/memory, character/inventory/shortcuts/spells, actors/loot, quest, turns/resources and activity. Dead/won runs retain their ended status. Targeting, menu selection, drafts, focus and scroll are not saved; current visibility is recomputed. Appearance remains a separate device preference.

The current version-20 JSON format stores actual floor terrain/stairs and generation metadata, not just a seed. Each monster retains its own intent and awareness, including prepared melee/area attacks, fixed charge targets/recovery and one-shot alarms. Validation checks source-specific targets and bounded memory. Terrain and remembered fog use compact row strings; the game retains its existing arrays/Map after loading. Validation checks structure, catalog kinds, coordinate/link consistency, ownership, resources, quest and history before replacing playable state. Valid version-1 saves initialize idle monsters. Valid v1/v2 characters migrate to the extended progression curve with XP retained and missing health/mana preserved; dead characters remain dead. Prepared targets survive v2 migration. Version 3 marks extended progression; version 4 retains four unique known-spell assignments. Older saves initialize assignments from known spells. Version 12 expands spell shortcuts to six; v4–v11 assignments are preserved with two appended empty slots. Version 5 retains active timed conditions; older saves initialize no conditions. Local load and file import share this migration. Reading a legacy local slot does not rewrite it; the next confirmed save writes v20. Unsupported versions or malformed intent are rejected before replacing progress or a slot. Later required saved fields need another explicit versioned adapter at the validation boundary. Resource and catalog limits still follow current game rules: tuning them can make an older snapshot incompatible, which is reported before replacing progress rather than silently clamping it. Reproducible continuation is checked within the current game rules; later balance changes can affect subsequent turns in an older save.

Tactical continuation coverage compares full action results and actual seeded hit/damage rolls through local load and file import, before preparation, immediately afterward, and after a mixed fight. `TacticalSaveReplay.test.ts` covers adapter parity and terminal/rejection states; `HomeTacticalSaves.test.tsx` verifies dialog pause, restored Z/H shortcuts, and safe failed imports through the real page. `TacticalAdventure.test.ts` uses a short five-floor scenario with controlled hits to exercise shots, saved preparation, dodging, potion recovery, rewards, ember delivery and replay reset. The controlled scenario verifies integration, not balance; generated-run diagnostics and human play remain separate checks.

`domain/saves/SaveFormat.ts` owns snapshots, encoding/restoration and summaries. `SaveDocumentV1.ts` retains the legacy contract; `SaveDocumentV2.ts` explicitly adds persisted monster intent. The writer selects saved fields so incidental live state does not silently enter the format. `SaveValidation.ts` dispatches by version, explicit `SaveShapeV1.ts` through `SaveShapeV20.ts` check source shapes using `SaveShapeCommon.ts`, `SaveConsistency.ts` checks playable-state invariants, and `SaveMigration.ts` adapts validated historical documents to current v20. The captured `src/__tests/fixtures/adventure-v1.json` protects compatibility independently of the current writer; do not regenerate it when changing the format. `persistence/LocalAdventureSave.ts` owns the `larn:adventure-save` localStorage key and storage errors; `AdventureSaveFiles.ts` owns file reads/downloads. The dedicated Save/Load sheet presents the flows, while Home applies the restored run atomically. No server requests or new dependencies are needed.

Saves belong to the same browser profile and origin (protocol, hostname and port). Localhost and a deployed site have separate slots; clearing site data/private-session closure can remove local saves. Export files provide backups and manual transfer. Input is capped at 4 MiB; storage failures are reported without erasing the previous slot. Measured fully explored 100×100×20 samples fit a conservative 5 MiB storage budget; see [local-save review notes](docs/local-save-review.md) for size measurements, tests and commit guidance. IndexedDB, multiple slots, autosave, further migrations and server synchronization remain future choices.

Two ring slots are available in Character. Rings fit either slot; choosing a slot, swapping or unequipping uses the ordinary equipment turn rules. Save format v10 migrates older adventures with empty left/right ring slots.

Ring bonuses are derived from equipped item definitions: Strength/Dexterity/Intelligence +2, Vitality/Mana capacity +4, copper armor +1. Capacity increases do not heal/refill; removing capacity clamps current resources. Effective combat, spells and status displays use the same loadout calculations.

Equipment comparisons list all relevant contributions. Green/red indicate clear upgrades/downgrades, blue indicates equal gear or an explicitly explained tradeoff. Rings compare each compatible slot. Basic equipment has upper floor limits so the deepest loot pool contains stronger gear and supplies rather than repeated starter equipment.

Giant spider bites poison on a landed hit: 1 damage after retaliation for three committed phases, refreshed rather than stacked. A red condition badge shows the remaining timer. Player poison travels with you across floors/saves and a fatal tick cannot be reversed by ongoing Renewal.

Trolls recover 2 HP per active phase, up to their maximum. Damage suppresses recovery on that phase and the next. Version 7 saves retain actor-owned injury timing; older actors migrate with an unknown last-injury time while preserving health and intent.

Cultists cast Ember Bolt, or Heal when badly wounded, once per three phases with actor-based staggering. Spell damage always hits and bypasses physical armor; walls and control spells can prevent the cast. Recovery phases do not grant a second attack.

Elemental resistance halves damage (minimum 1) and weakness doubles it; activity messages explain the result. Salamanders and frost giants warn a fixed, wall-aware blast area for two response turns. Walk out, reposition or interrupt the source before it resolves. The source-visible countdown and marked visible tiles pause off-floor and persist in version 8 saves. Enemy area attacks currently harm only the player.

### Dungeon doors

New adventures can contain closed doors in passages. Bump a door to open it, or press **E** to open/close a nearby door. A successful interaction uses one turn. Closed doors block movement and sight, including spells; orcs, cultists and necromancers can open ordinary doors on a remembered pursuit route, spending their entire action. Occupied doors cannot be closed. Door state persists in saves; older saved adventures keep their original floors without newly added doors.

Gold is tracked separately from bag capacity. Walk onto coin caches to collect them automatically; defeated monsters also grant seeded, depth-scaled gold. The total appears above the dungeon, in Character and in the victory summary. Shops are deferred.

Treasure chests can appear in safe room tiles. Press **E** within reach to open one for a turn. Its seeded, depth-appropriate reward remains on the floor even with a full bag. Walk onto the reward and press **G** to collect it. An opened chest cannot pay again, including after loading.

Visible traps (floor 2+) show red warning icons. Crossing springs one for 2–6 damage within the movement turn. **E** attempts disarm: starting chance 55%, increasing 5% per Dexterity modifier up to 95%. Failure springs it. Both outcomes spend the trap permanently; protected stairs and starts never contain one.

Ancient fountains (floor 2+) offer a safe sip or risky draw. **E** opens a choice dialog; **1/2** select and **Escape** cancels without a turn. Safe sip recovers up to 6 health/4 mana or a quarter of resource capacity, whichever is greater. Risky draw has a 70% chance to recover up to 12 health/8 mana or half capacity; otherwise it deals 3 damage ignoring armor and poisons for three phases. The choice dialog displays current amounts; drinking at full resources is a free rejection. A chosen draw uses one turn and empties the fountain.

Forgotten thrones (floor 4+) offer **sit**, **pry treasure**, or free cancellation. The dialog describes the fixed risk distribution before choosing. Blessings grant ordinary XP; other outcomes restore resources, poison/wound the player, relocate safely within the same floor, or grant gold. A committed choice spends the throne for the rest of the adventure.

Shrines of insight (floor 3+) exchange **10 + 5 × floor gold** for **20 + 4 × floor XP** with ordinary automatic growth. **E** displays the exact price and benefit before accepting with **1**; **Escape** cancels freely. An offering takes one turn and spends the shrine. Insufficient gold changes nothing. Paid gold, XP and spent state persist in saves.

Visible nearby dungeon objects show their controls and live/spent state below the map. Entering an object tile adds a description to the activity log. Opened chests remain as faded crossed-chest markers; their remaining loot is on the floor for G pickup. Inspecting a spent object explains its state without taking a turn.

Rare safe-room discoveries include **sealed reliquaries** (floor 8+) and **abandoned spell archives** (floor 3+), each with a 12% per-floor chance. Reliquaries trade a confirmed 3-damage wound for a special ring. Archives release an unknown eligible book from the run’s selected spell pool, or a mana potion. Both are one-use; rewards remain on the floor for G pickup. They use existing rooms and leave dungeon terrain unchanged.

Death opens a game-over summary with the final run values and last recorded damage. Choose **New Adventure**, **Replay this seed**, or **Inspect run**; Escape also inspects without restarting. After inspection, the ended run remains available for Character, activity and save/export review. Loading a dead save shows its summary once again.

Living players below **50% of maximum health** receive a red HP value, highlighted Health card and reserve bar, and a muted red adventure-container background. Exactly half health does not warn. Recovery or capacity changes update the warning immediately; death uses the game-over dialog.

Identified utility potions include Antidote (floor 2+, removes current poison), Greater healing potion (floor 8+, up to 15 HP), and Greater mana potion (floor 8+, up to 12 mana). They share normal pickup, bag, hotbar and one-turn drinking rules. A potion with no useful effect remains in the bag and spends no turn. Antidote does not grant immunity to a subsequent attack.

The dungeon camera follows with a five-tile comfort margin on each axis. On small viewports, the margin shrinks to keep the player visible; map boundaries still clamp scrolling. Manual scrolling remains intact until accepted movement, a floor change or viewport resize requires following again.

The Character dialog keeps combat and stat-growth explanations in expandable sections so the seven-column bag, equipment and potion assignments fit on a 1280×720 display. Longer selected-item details remain scrollable.

Expanded adventure diagnostics now learn unknown spellbooks, compare both ring slots, use stronger potions/antidotes, choose acquired damage spells using catalog damage ranges and elemental traits, and visit conservative discoveries (chests, archives, affordable shrines, safe fountain sips and survivable reliquaries). Tactical runs also step outward from announced area attacks. These policies use omniscient routing, avoid deliberate regeneration waiting, and are reproducibility tools rather than human win-rate estimates; they do not optimize every control, buff or gambling option.

For matched recovery experiments, the review script accepts `--mana-recovery N` (1–1000 committed turns per +1 mana). This overrides only the isolated diagnostic process and records the interval in its JSON output; browser gameplay and saved settings stay unchanged. The current recommendation remains every 30 turns after matched 60×60×20 comparisons at 20, 30 and 50; see the expanded adventure review notes for evidence and limitations.

Pacing diagnostic output includes per-floor walkable tiles/population/items/objects, committed movement counts, unchallenged movement and longest quiet streak. Recommended and maximum maps still have substantial quiet travel; population remains capped at 12 while future pacing changes are evaluated together with combat strength, rewards and XP. The review notes include matched minimum/recommended/maximum-size evidence.

Press E beside an open door to close it for one turn. A player or monster in the doorway prevents closing and costs nothing. When multiple usable objects are reachable, E opens a numbered keyboard chooser; selecting, inspecting and canceling are free. Most monsters cannot open closed doors. Orcs, cultists and necromancers can spend one action opening an ordinary door while pursuing their last seen target; they cannot open skull-marked elite gates. Closing still breaks sight and delays an attack.

The header's **Catalog** button opens a searchable developer sheet with every monster, spell, item, terrain icon and live/spent object variant. Cards use the actual domain/visual registries, show 24px and 48px SVG previews, and include stats, floor bands and effect descriptions. It reveals undiscovered content for visual review, pauses dungeon shortcuts and spends no turns. Set `APP_FEATURES.developerCatalog` to `false` in `frontend/src/settings/FeatureFlags.ts` to hide the entry point. This is a UI visibility flag, not account authorization. Catalog content loads in a separate chunk.

Save format v11 supports 27 grouped bag slots while retaining individual item identities. Valid v1–v10 saves keep every carried item; their historical 20-copy limit remains validated. Imported bags are also bounded to 10,000 physical copies and the existing 4MiB file limit.

### Layout diagnostics

From `frontend`, run `node scripts/review-layout.mjs 0 1 123 987 2215353587 --summary-only` for reproducible travel/connectivity measurements. Omit `--summary-only` for per-floor records. The tool reports stair/room distances, planned corridor lengths, actual bottleneck tiles and unreachable floor tiles; it does not simulate human exploration or combat. See `docs/release-polish-review.md` for the matched baseline.

Seeded generation adds occasional bounded corridor loops between nearby rooms using an independent random stream. The original BSP connections remain; shortcuts reduce detours and provide alternate routes. Internal loop rules live in `RunConfiguration.ts`. New/replayed seed layouts intentionally change with this generation improvement; loaded played saves retain their actual terrain and stairs.


## Pursuit and hunted return

Detected monsters remember your last seen tile when you break sight, chase it for up to 12 eligible active phases, then search briefly (3 phases) and disengage. Three blocked phases end an unreachable chase. Inactive floors and skipped actions pause memory. Visible creatures in Help show unaware/pursuing/searching counts; visible state changes produce restrained activity messages. Hidden actors do not disclose their awareness.

Recovering the ember starts a hunted return on the pickup turn. Each ascending return floor awakens once, with up to four additional hunters selected from the ordinary **floor-20 pool**, regardless of current depth or adventure length. Optional champions are excluded; original survivors keep their actual kind and health. Placement favors connected stair approaches and the ascent route, alternating between arrival and exit approaches with seeded variation. Small/occupied floors receive fewer, and living actors remain capped at sixteen. The ember floor receives no extra wave. Spawn buffers protect stairs, arrivals, the entrance, objects, loot and sealed rooms; ranged hunters spawn beyond their attack range from protected arrival tiles.

All enemies on the active floor sense the ember within **24 horizontal/vertical steps**, even through walls, and update their pursuit target while in range. This grants movement toward the ember, not attack sight: shots, spells and telegraphs retain normal ranges, walls and line-of-sight checks. Door-opening creatures can approach and spend actions opening ordinary doors; sealed gates remain sealed. Outside sensing range, enemies retain the existing eighteen-phase last-known-position pursuit and four-phase search. Sleep, Fear and Web still provide counterplay. Inactive floors stay paused. Revisit and save/load never regenerate another wave. There are no periodic reinforcements. Tune `ESCAPE_ENCOUNTER_RULES.maximumNewMonsters` in `EscapeEncounters.ts` for the primary hunter-count experiment; sensing lives in `ESCAPE_PURSUIT_RULES.cureSenseRadius`. See the [return-pressure review](docs/urgent-return-review.md) for evidence and compatibility.

Save v13 adds awareness; v14 adds the escape start turn and activated-floor list. Pre-awareness saves initialize unaware actors. Older ember carriers initialize escape but exempt their current return floor from new spawns, avoiding a surprise around a loaded player. Captured v1 and v13 fixtures protect migration.

For diagnostics, run `node scripts/review-adventure.mjs 0 1 123 987 --policy tactical-aware --max-actions 30000` from `frontend`. `--without-escape-pressure` compares the same seeds without new return encounters or aggression inside the diagnostic process only. The full-run report includes recovery resources and separate return counters. `node scripts/review-return.mjs 0 1 123 987 --max-actions 20000` exercises a controlled cleared-descent return: level 20, fixed late-game gear, 33 health, full mana, three greater healing and seven greater mana potions. Add `--direct-ascent` to prioritize stairs and healing over clearing threats; `--legacy-return` compares the previous return rules from commit `33207d1`, requiring that Git history. Reports separate spawned, visibly encountered and engaged actors. Its fixed resources and omniscient routing make it a mechanics check, not a human win-rate estimate.


### Horned chargers

Horned chargers (floors 5–20) prepare a fixed straight charge from two to four tiles away. Sidestep the marked line or interrupt preparation with Sleep/Fear; rooting also stops the charge. Walls, closed doors, other actors and stairs block the rush. A charger uses one normal physical attack roll and then spends one phase recovering. Only currently visible sources and tiles reveal warnings. Save v15 retains fixed charge preparation and recovery across loading.


### Alarm sentries

Alarm sentries (floors 3–20) stay at their posts. They prepare one alarm, then sound it on their next eligible active phase using a fixed last-seen target. Kill the source, use Sleep or Fear to interrupt it; rooting does not prevent shouting. After sounding the alarm once, they can still defend themselves in adjacent melee. A completed alarm alerts up to six existing enemies within eight cardinal steps and clear wall/door sight. It passes along the last-seen tile, preserves independent fresh detection, and grants no extra actions or reinforcements. Visible preparation appears in the warning log, and Help distinguishes preparing/spent alarms. Save v16 preserves the preparation and one-shot flag.


### Optional iron champion

The iron champion is reserved for optional floor-8–20 encounters. On Normal it starts at 72 health and nominal damage 18 on floor 8, gaining 6 maximum health and 1 nominal damage per deeper floor (144 health, raw damage 29–31 on floor 20). Difficulty scales those depth-specific values. It prepares straight charges, spends the following phase recovering, resists arcane damage and is weak to cold. Gate warnings and visible-creature Help show the actual floor/difficulty profile before armor. Existing saves retain wounded health, identity and preparation; future champion attacks use the revised profile without refilling health. Its seeded reward is guaranteed eligible equipment, favoring recently introduced tiers without considering the player’s current loadout. Normal monster generation excludes it. Defeat/reward ownership uses the shared kill path and persists without resampling on reload.

Optional elite chambers may appear from floor 8. A skull-marked gate seals a single-entry side room; stairs, the ember and required routes remain outside. Unsuitable or occupied rooms are skipped. The champion and its guaranteed depth-appropriate equipment reward are saved as actual run content.
Press E beside a skull-marked gate to inspect the optional challenge, then choose Open (or 1). Canceling is free; opening takes a turn. Bumping cannot open elite gates. Open gates can be closed with E when unoccupied, including during the return with the ember.

Shared merchant economy lives in `domain/merchant/MerchantRules.ts`: ten each of healing (150 gold), mana (200), greater healing (450) and greater mana (600) per adventure. Equipment sale values are nominal tier-based amounts; consumables/books/quest items cannot be sold. Save v17 stores actual shared stock; older saves initialize it once when migrated.
Merchants appear on every fifth floor strictly before the final floor (normally 5, 10, 15). Placement is deterministic in a free reachable room. Set `APP_FEATURES.wanderingMerchant` in `settings/FeatureFlags.ts` to false to suppress new stalls, display and trading; saved stock is retained. Stall decoration is traversable and does not block routes.
The merchant uses four item columns on desktop, two on medium screens and one on phones. Buy fits its offers; Sell keeps a fixed scrolling area during transactions, with compact cards and a separate bulk-sale footer. The merchant Sell list marks every carried gear option Better/Lower/Same/Tradeoff using the same full-loadout previews as Character. Expand **Compare [item]** with a click or Tab/Enter to inspect each compatible destination without selling or spending a turn. Ring previews explicitly identify Left ring and Right ring; all items stay available for deliberate sale, including inferior gear.
Merchant purchases and individual bag-equipment sales each cost one turn with normal monster actions. The Sell tab also offers **Sell all Lower items**, quoting the count and total gold before confirmation. It sells only red/Lower carried gear in one action/turn, then monsters act once; Same, Tradeoff, Better, worn gear and supplies remain yours. Sold slots keep their place until the merchant closes, and keyboard focus returns to Sell so another sale requires a deliberate selection. Press E nearby, B/S for Buy/Sell, 1–4 to buy, or Tab/Enter to sell. All appearances share the same finite stock; returning with the ember does not restock it. Older saves initialize reachable stalls and stock on migration, preserving existing played content. Current saves retain actual transactions and owned bottles.

For a generated gold-budget diagnostic, run `node scripts/review-merchant.mjs 0 1 123 987` from `frontend`. It reports ordinary monster/coin income assuming all are collected, before spending; it excludes optional rewards, return waves and sales, and does not simulate human wins. The initial six-seed 60×60×20 review found roughly 776–841 gold by floor 5 and 8,371–8,576 across the dungeon, versus 14,000 to buy the full shared stock.

From floor 3, Strength/Dexterity/Intelligence potions can appear in found and dropped supplies. They add +2 to one attribute for six committed turns including drinking; reusing refreshes rather than stacks. S/D/I markings distinguish the bottles. Intelligence increases spell potency and mana capacity without refilling it; extra mana is clamped when the effect expires. They stack and use the existing four potion shortcuts.

Enchantment scrolls can appear from floor 5. Select one in Character, then choose carried or worn weapon/shield/chest/helmet equipment using click or Tab/Enter. Success adds +1 attack or armor, consumes one stacked scroll and commits one turn; canceling/rejections are free. Each item caps at +3; rings are excluded. Labels, combat, comparisons and nominal sale values include the instance bonus. Save v18 retains it on carried, equipped and dropped gear while historical item records remain unchanged.

### Pacing and tactical clarity

Ordinary loot favors stronger eligible plain equipment for each slot while preserving the total equipment weight, potion probabilities and ring/stat tradeoffs. Existing supply rules and XP thresholds remain supported by the generated-depth audit; see [pacing and tactical review](docs/pacing-tactics-review.md) for evidence and human playtest limits. `scripts/review-rewards.mjs` reports per-floor supply and ordinary XP potential; `review-adventure.mjs` also records separate descent/return resource visits.

Visible threat chips explain heavy strikes, charging, recovery and alarms. Spell cards show elements and condition durations, and targeting previews selected-enemy damage after resistance/weakness. The death dialog lists recent incoming damage and emphasizes the last recorded hit. Save v19 adds validated monster door-opening activity, preserving all played v18 state and enchantments.

### Icon readability

Monster icons use a reserved palette of ember/rust orange, rose, fuchsia, teal and cyan (`--monster-*` tokens in `App.css`); each kind has a distinct SVG silhouette registered in `MonsterVisuals.ts`. Terrain colors and icons are unchanged. Merchant and gold coins use `text-item-gear`, the existing gold palette. The merchant is a shopping-cart marker and still occupies one normal walkable tile. Fountains use a basin-and-water-jet silhouette.

Rings use a gold outline with S/D/I attribute letters, a red Vitality heart or a blue Mana bottle; the Band of the Forgotten has an ornate ring silhouette. Dragon mail has a decorated chest-armor outline. Web has curved web strands; Poison Dart uses a skull-and-crossbones bottle. The developer catalog groups item types for browsing, including all potions together; this display sort does not alter seeded loot definition order.

Difficulty is recorded in v20 run configuration. Valid v1–v19 saves migrate to Normal (1), retaining played state; unintroduced legacy difficulty metadata cannot change that baseline. Current actors are checked against their scaled maximum health. The writer records the active runtime difficulty and the loader derives it from validated saved configuration.

### Adventure difficulty

Choose Easier (×0.75), Normal (×1), or Harder (×1.25) before beginning. Settings edits the next adventure; the active choice is fixed for the current run and shown in the player status panel. New Dungeon/replay reuse the last applied setting; loaded adventures retain their own difficulty.

Enemy maximum health and direct damage round to the nearest integer with a minimum of 1. Physical melee/ranged/charge rolls scale before armor. Enemy spells and area attacks retain their existing armor bypass. Enemy healing/regeneration use scaled caps with unchanged recovery amounts. XP, loot, population, accuracy, defenses, ongoing conditions, environmental damage and player resources are unchanged. Help shows scaled creature values; the developer catalog explicitly shows Normal baseline definitions.

The welcome dialog offers Small (20×20), Medium (40×40), and Large (60×60) map dimensions. Large is the default. These choices preserve difficulty and floor count; custom dimensions and floor count remain editable in Settings.

To audit matched difficulty seeds, run `node scripts/review-difficulty.mjs` from `frontend` (optional positional seeds). It checks 20×20×5 and 60×60×20 in all three modes, unchanged generated content, scaled actor health/physical ranges, return actors, and played save/turn continuation. This is a mechanics diagnostic, not a human win-rate simulation; see [the difficulty review guide](docs/difficulty-adventure-review.md).

On a chest tile, E opens the chest and its numbered loot chooser. E can reopen remaining chest loot without spending another turn; each successful pickup still spends a turn. Adjacent opening leaves loot on the chest tile until you move onto it. G remains available for floor pickup. See [alpha run #2 interaction review](docs/alpha2-interaction-review.md).

Save/Load groups the browser slot and save-file transfers separately. The opening screen offers **Load an existing save**, with local load/import only; save/export actions appear after an adventure starts. Browser save/load still require confirmation, and imports remain validated before restoring gameplay.

The Last Ember retains Larn as an inspiration, with an original beacon-and-ember premise and sparse dry humor. Historical item/save keys (`cure`, `cureRecovered`, `quest:cure`, `larn:adventure-save`), export filenames, repository/package identifiers and seeded placement streams remain unchanged. Existing saves display the new story and icon without regenerating gameplay state.
