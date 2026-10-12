# Distinct enemy tactics: review guide

Epic #146, branch `codex/enemy-tactics`. Implement stories one commit at a time and pause for developer review. No archer/brute behavior or mixed spawning is implemented yet.

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
