# Pursuit, escape, tactical encounters, merchant and consumables

Branch: `codex/pursuit-escape-and-merchants`. Approved epics #232, #238, #245, #256 and #252. Execution order: pursuit #233–237, escape #239–244, tactics #246–251, merchant #257–264, then consumables #253–255. One initial tested commit per story; In Review is implementation handoff, not developer acceptance. No publishing or merging.

## #233 — Pursuit baseline and rules

Current ordinary monsters require detection on every eligible phase: Euclidean catalog radius and clear wall/door sight. A corner immediately ends ordinary pursuit; prepared melee/area attacks deliberately resolve their old targets. Pursuit uses deterministic cardinal BFS, never enters protected stairs/arrivals, and preserves actor occupancy. Slow actors act only on their configured turn interval; sleep/root/fear already have distinct phase behavior.

Ordinary detection radii remain unchanged initially. Central rules define 12 eligible active phases of last-seen memory, three search phases and three blocked-path phases. Detection bonus defaults to zero and can be supplied for an explicit policy without modifying catalog definitions. The regression exercises an extended radius boundary and an intervening wall. Future memory/search phases must not grant attacks at unseen player coordinates or change prepared-attack response semantics. This foundation changes no default combat, population, XP or loot.
