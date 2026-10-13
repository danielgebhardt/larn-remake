# Pursuit, escape, tactical encounters, merchant and consumables

Branch: `codex/pursuit-escape-and-merchants`. Approved epics #232, #238, #245, #256 and #252. Execution order: pursuit #233–237, escape #239–244, tactics #246–251, merchant #257–264, then consumables #253–255. One initial tested commit per story; In Review is implementation handoff, not developer acceptance. No publishing or merging.

## #233 — Pursuit baseline and rules

Current ordinary monsters require detection on every eligible phase: Euclidean catalog radius and clear wall/door sight. A corner immediately ends ordinary pursuit; prepared melee/area attacks deliberately resolve their old targets. Pursuit uses deterministic cardinal BFS, never enters protected stairs/arrivals, and preserves actor occupancy. Slow actors act only on their configured turn interval; sleep/root/fear already have distinct phase behavior.

Ordinary detection radii remain unchanged initially. Central rules define 12 eligible active phases of last-seen memory, three search phases and three blocked-path phases. Detection bonus defaults to zero and can be supplied for an explicit policy without modifying catalog definitions. The regression exercises an extended radius boundary and an intervening wall. Future memory/search phases must not grant attacks at unseen player coordinates or change prepared-attack response semantics. This foundation changes no default combat, population, XP or loot.

## #234 — Last-known-position pursuit

Detected actors remember a copied player coordinate. Losing detection follows a cardinal shortest path to that remembered tile, never the unseen current player, with normal protected/occupied tile rules. Memory updates only on renewed detection. Fear, sleep/slow intervals, rooting and prepared attacks retain their existing phase ordering. An unseen actor can move toward memory but cannot fire or attack the unseen current player. Detection updates are reused when unchanged to avoid needless actor allocations.

Save v13 is introduced alongside this state. Valid old saves migrate with implicit idle awareness; unknown awareness in historical input is discarded. Missing awareness also means idle for controlled fixtures/current idle actors. Non-idle memory validates its floor tile and bounded counters. Current continuation and captured v1 migration remain covered. Older stationary-actor tests now check retained identity/position/health instead of array reference equality: detection legitimately updates memory even during an attack. Tests first failed for lost-sight chase, then cover no prior detection, reacquisition, memory round-trip and invalid imported targets/counters. Search/disengagement is the next story.
