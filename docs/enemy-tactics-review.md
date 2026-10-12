# Distinct enemy tactics: review guide

Epic #146, branch `codex/enemy-tactics`. Implement stories one commit at a time and pause for developer review. Stories #147 and #148 are implemented for review. Brute behavior, tactical presentation and mixed spawning remain outstanding.

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
