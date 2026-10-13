# Pursuit, escape, tactical encounters, merchant and consumables

Branch: `codex/pursuit-escape-and-merchants`. Approved epics #232, #238, #245, #256 and #252. Execution order: pursuit #233–237, escape #239–244, tactics #246–251, merchant #257–264, then consumables #253–255. One initial tested commit per story; In Review is implementation handoff, not developer acceptance. No publishing or merging.

## #233 — Pursuit baseline and rules

Current ordinary monsters require detection on every eligible phase: Euclidean catalog radius and clear wall/door sight. A corner immediately ends ordinary pursuit; prepared melee/area attacks deliberately resolve their old targets. Pursuit uses deterministic cardinal BFS, never enters protected stairs/arrivals, and preserves actor occupancy. Slow actors act only on their configured turn interval; sleep/root/fear already have distinct phase behavior.

Ordinary detection radii remain unchanged initially. Central rules define 12 eligible active phases of last-seen memory, three search phases and three blocked-path phases. Detection bonus defaults to zero and can be supplied for an explicit policy without modifying catalog definitions. The regression exercises an extended radius boundary and an intervening wall. Future memory/search phases must not grant attacks at unseen player coordinates or change prepared-attack response semantics. This foundation changes no default combat, population, XP or loot.

## #234 — Last-known-position pursuit

Detected actors remember a copied player coordinate. Losing detection follows a cardinal shortest path to that remembered tile, never the unseen current player, with normal protected/occupied tile rules. Memory updates only on renewed detection. Fear, sleep/slow intervals, rooting and prepared attacks retain their existing phase ordering. An unseen actor can move toward memory but cannot fire or attack the unseen current player. Detection updates are reused when unchanged to avoid needless actor allocations.

Save v13 is introduced alongside this state. Valid old saves migrate with implicit idle awareness; unknown awareness in historical input is discarded. Missing awareness also means idle for controlled fixtures/current idle actors. Non-idle memory validates its floor tile and bounded counters. Current continuation and captured v1 migration remain covered. Older stationary-actor tests now check retained identity/position/health instead of array reference equality: detection legitimately updates memory even during an attack. Tests first failed for lost-sight chase, then cover no prior detection, reacquisition, memory round-trip and invalid imported targets/counters. Search/disengagement is the next story.

## #235 — Search and disengagement

An unseen actor reaching its remembered tile searches there for three eligible phases, then becomes idle. Twelve unseen pursuit phases cap even a long reachable chase; three consecutive unavailable paths end a blocked chase. Successful movement clears the blocked counter. Rooting prevents motion without counting as an unavailable path, while the unseen memory budget still advances; sleep, fear and skipped slow phases pause this helper, and inactive floors never advance it. Renewed detection resets pursuit. Pure search progression is tested with exact phase boundaries, blocked routes and bounded memory; phase integration covers sleeping, slow and inactive actors. Prepared fixed-target attacks remain independent.

## #236 — Visible awareness explanations

Help's visible creature guide groups instance awareness counts by kind: Unaware, Pursuing and Searching, alongside a short explanation of remembered sight and disengagement. It lists only living actors in current player sight. After a committed Home action, a presentation projection adds a short activity entry only when a currently visible actor changes awareness state; unchanged pursuit steps, hidden actors, inactive floors, death and victory add no such entries. The reducer has no access to player fog preferences, so observation is projected after current exploration is recomputed rather than leaking hidden transitions into history. Recorded observable entries persist with the existing bounded activity log. Controlled tests cover visible searching, hidden kinds, no step spam, inactive floors and transition messages. Browser fixture verified Searching: 1 and the explanation in Help; screenshot `/tmp/larn-visible-awareness-review.png`.


## #237 — Pursuit persistence and replay

The save format was versioned alongside awareness in #234. This story completes integration coverage rather than adding a second representation of awareness. Generated 60×60 adventures exercise identical committed actions after save/load during pursuit and searching, a closed-door chase with a nearly exhausted blocked budget, inactive-floor pausing, and fresh seeded replay. Existing arrival/occupancy and legacy migration checks remain in the regression suite. The four added tests pass; the commit hook runs the full frontend suite and build.

## #239 — Explicit hunted return phase

Cure pickup now starts an escape snapshot (`startedTurn`, `activatedFloors`) and adds a prominent announcement on the same committed pickup turn. The protected pouch, normal monster retaliation, fatal pickup and entrance victory remain intact. Objective text identifies the hunted return. Save v14 writes this snapshot explicitly and validates cure ownership, chronology and unique eligible floor numbers. Captured v13 searching-actor data loads unchanged; older cure carriers enter escape with their current return floor exempted from new spawns, preventing a surprise population around a loaded player. Fresh adventures reset the snapshot. Focused cure/quest/save tests and typecheck passed; browser verified the announcement/objective (`/tmp/larn-escape-phase-review.png`). Return populations are deliberately added by the next two stories.
