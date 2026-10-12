# Distinct enemy tactics: review guide

Epic #146, branch `codex/enemy-tactics`. Implement stories one commit at a time and pause for developer review. Stories #147–150 are implemented for review. Mixed spawning and the final replay/playtest checkpoints remain outstanding.

## #147: Instance intent and compatible save evolution

This document accompanies the story's commit. The readiness cleanup is already merged into main: PlayerActions owns committed turns, protected stair arrivals are validated, and save shape/consistency checks are separate. This story reuses those contracts.

Each Monster now requires `intent`, either `{ type: "idle" }` or `{ type: "preparing-attack", target: { row, col } }`. The target is on that actor's floor; it is a fixed tile rather than a reference to the player's changing position. There is no countdown, UI-owned attack state, generic ability engine or additional turn increment. All generated actors initialize idle, and current pursuit/melee is unchanged. Existing explicit test fixtures add idle intent to satisfy the required domain contract.

Save format v2 explicitly includes intent. The original v1 aggregate and monster contract remain intact. Common adventure shape checks are shared; version-specific guards require the appropriate version and, for v2, valid intent. Semantic validation requires a prepared target to be walkable and orthogonally adjacent to the actor, and still prohibits monsters on protected stairs/arrivals. The player may be elsewhere or on another floor. Intent variants reject missing/unknown fields and idle targets.

The parse boundary validates a v1 source's shape and consistency before adapting its monsters to idle. It retains terrain, linked floors, resources, items, exploration, history and other played state. Callers always receive the current v2 document. Legacy extra monster fields cannot become a prepared attack. No content is regenerated, and the retained literal v1 fixture is unchanged.

Local storage and file import share parsing/migration. Reading a legacy slot leaves its bytes untouched; the next confirmed save writes v2. Invalid intent and unsupported versions preserve the existing progress/slot through the existing adapters. Balance compatibility still follows current rules; migration does not promise the same combat outcomes after future tuning.

## Verification and scope

The initial intent/save suite had 15 failures before implementation. Coverage now includes generated/replayed idle actors, full legacy played-data migration, a prepared target on an inactive floor, free/rejected action retention, malformed variants/coordinates, non-walkable/distant targets, and legacy protected arrivals. Adapter tests exercise legacy local read without rewriting, explicit save to v2, malformed replacement protection, and file migration. Home imports both current and literal legacy files while preserving the local slot. Existing turn, combat, floor retention, death/victory and maximum-size save regressions remain in the full suite.

There is no new visible gameplay in this story. #148 introduces ranged attacks; #149 creates and resolves preparation after one committed player response, clears it, and tests inactive-floor pauses/revisits. #150 adds threat presentation. Pending intent is stored now so those behaviors can use the shared domain/save boundary.

Before advancing, review Monster intent, source validation versus migration, the unchanged v1 fixture, and the tests. The final commit hook runs frontend checks, the full test suite and TypeScript/Vite build; exact results are reported with the commit. Backend and UI layout are unchanged.

## #148: Goblin archer range and cover

The archer definition has 5 HP, nominal damage 2 (raw damage 1–3), 6 XP, detection radius 6, shooting range 4, floors 2–20 and provisional relative weight 1. Drop chance/preferences match the basic goblin for this first slice. `spawnEnabled: false` keeps it out of the generated candidate pool until #151, preserving current seeded populations. Range and rollout are definition properties rather than hardcoded branches on monster names.

On each ordinary monster phase, existing detection runs first: Euclidean radius and terrain line of sight, including the existing closed-corner rule. Undetected or inactive actors do nothing. A detected archer uses ordinary melee at Manhattan distance 1, shoots without moving at distances 2–4, and otherwise pursues one tile using the existing collision/protected-stair pathfinding. Movement never also attacks. Blocking walls prevent detection as well as shots; this story adds no remembered pursuit target. Creatures do not intercept shots and archers do not retreat.

Shooting reuses the existing D20 threshold, Dexterity evasion, bounded damage and armor/minimum-damage resolver. Its attack context uses the actor's stable ID plus `:shot`, isolating ranged rolls from that actor's melee and from unrelated actors. Existing melee contexts are unchanged. Numeric spawn order, earlier actor positions, death stopping, player-first kills, one-time XP and seeded drops remain shared.

New `monster-shot-hit` and `monster-shot-missed` events produce distinct activity descriptions and are accepted by save validation. A basic goblin visual with the archer label keeps the visual catalog complete for controlled encounters; distinct artwork/threat presentation belongs to #150. No generated run contains archers yet, so ordinary play has no new encounter distribution or UI layout.

Controlled tests cover horizontal/diagonal range boundaries, next-turn shooting after pursuit, walls/closed corners, no detection/inactive floors, actor/stair collision, creature non-interception, order, evasion without damage rolls, armor and bounded damage, seeded repetition/actor independence, fatal shots and a seeded loot-producing kill. Catalog tests assert the profile and disabled rollout; narration and v2 actor/event round trips are covered. Fifteen initial encounter tests failed before the definition/behavior existed. Full verification runs in the story commit hook. Pause before #149 for review.

## #149: Brute preparation and a fixed response opportunity

The dungeon brute definition has 10 HP, nominal damage 5 (raw 4–6), 12 XP, detection radius 6, floors 4–20 and provisional relative weight 1. Its drop policy follows the orc. It remains disabled for seeded spawning until #151, with provisional skull artwork until #150. A definition flag enables melee preparation; validation rejects combining that preparation with ranged attacks in this first tactics slice.

An idle, detected brute pursues one tile when distant. When adjacent it copies the player's current coordinate into instance intent, emits a preparation event and ends its phase without rolling or dealing damage. A move into adjacency never also prepares. There is no timer, additional turn increment or UI state governing its attack.

On its next active-floor phase, a pending intent is handled before ordinary detection. It clears intent and checks both the fixed target and adjacency. If the player has moved, it emits an avoided attack without rolls; even moving beyond detection clears the old threat. If still on the target and adjacent, it resolves existing D20/evasion/armor/damage rules using the stable actor-ID `:heavy` namespace. A failed hit roll produces a distinct missed outcome. Both hit and miss consume the phase; it cannot pursue, retarget or immediately prepare again. A following committed turn may start a new preparation.

PlayerActions still owns response timing. Rejected movement, missing items, invalid casts and free hotbar changes preserve preparation. A successful wait, heal, cast, pickup/drop, equipment change or surviving bump attack spends the response turn, applying the player effect first. Killing the brute removes the actor before retaliation and uses existing one-time rewards. Death stops later actors; quest completion skips the entire pending phase.

Stairs change the active floor before the monster phase. The departing brute stays paused with its original target across additional turns and save/load. On return it resolves that target once, rather than aiming at the stair arrival. V2 already supports the intent shape; this story adds the new activity variants to source validation and narration without another format bump. Presentation/highlighting belongs to #150.

The focused suite covers preparation without rolls, sequential phases, fixed-target dodging, out-of-detection cleanup, evasion, raw 4–6 damage with armor/minimum damage, pursuit, rejected/free actions, nine committed response types, kills, fatal stopping, victory, real linked stair revisits and exact saved/uninterrupted next-turn equality. Narration distinguishes preparation, landed blow, failed roll and avoided blow. Sixteen behavior tests failed after the catalog existed but before phase implementation. Existing archer tests pass. Full frontend verification runs in the story commit hook; backend and generated populations are unchanged. Pause before #150 for review.

## #150: Readable tactical enemies and visible threats

Archers use Lucide's bow-and-arrow SVG in cyan; brutes use a custom broad-shouldered, square-jawed SVG in indigo. Both have separate light/dark tokens within the monster palette, rather than loot colors. The catalog remains the single source of monster labels. No spawn flag or gameplay rule changes in this story.

The map derives a sparse set of threatened columns per row from living prepared actors. Both the source monster and its fixed target must be currently visible; the player tile follows the map's existing always-visible rule. Hidden/remembered sources never reveal a warning on a visible target, and hidden/remembered targets never reveal a warning from a visible source. Fog-off treats valid floor tiles as visible. Overlapping threats share one marker; dead or cleared intent removes it.

A target cell keeps its existing content and gains an inset danger border, faint tint and a small warning badge. Its accessible label appends “prepared heavy attack,” with a native explanatory title. The overlay is decorative and ignores pointer events, preserving item/player/stair icons and spell-target buttons. Violet spell selection remains separate from the danger border. Preparation activity gets a warning icon, stronger text and subtle danger styling; routine shots, blows and dodges retain ordinary narration. Existing log order, announcements and scrolling are unchanged.

Help explains both silhouettes, Manhattan archer range, walls/creature interception, one committed response action, healing/gear timing and paused intent across floors. No menu or keyboard mapping changes.

Row memoization compares the sparse threat columns by value. Each cell receives a consistent boolean warning prop: the performance test caught undefined-to-false changes that otherwise redrew unthreatened cells when a marker appeared. Preparation and clearing on a 100×100 map now perform fewer than five TileIcon renders and no MonsterIcon rerender for unchanged actor visuals. This is a focused render contract, not a browser frame-time benchmark; broader profiling remains #153.

Tests cover fixed targets, source/target fog combinations, removal/death, overlap, player/stair/item preservation, clickable selected monster targets, new labels, Help and activity emphasis. Five initial marker tests and three presentation/performance tests failed before their fixes. Existing keyboard targeting regressions pass.

Browser review used validated controlled 15×15×5 and 100×100×5 snapshots at the isolated `127.0.0.1:5174` origin, in both themes and at 1280×720 laptop dimensions. It exercised imported focus, Z selection/cancellation beside the warning, keyboard dodge, repeated preparation, Heal before retaliation, Help and player-following scrolling. The large fixture also contained a hidden prepared brute: source/target stayed remembered floor with no leaked monster/warning label. No browser warnings/errors were observed; the existing unavailable backend diagnostic remained visible. Temporary tab/server and viewport override were cleaned up. Dark/light screenshots accompany the implementation response.

Final frontend verification runs in the story commit hook. Pause before #151, which enables floor-appropriate mixed populations and initial idle intent.
