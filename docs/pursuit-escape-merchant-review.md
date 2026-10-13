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

## #240 — Deterministic return encounters

A pure per-floor generator uses independent `seed:floor:escape:index` and `escape-kinds` streams. Eligible return floors are 1 through goal minus one; the cure floor never receives another wave. Each gets at most four new depth-eligible actors, scaled to available safe space (one per 120 candidate tiles), and no additions beyond sixteen living actors total. Existing survivors, objects and loot reserve their tiles; stairs, entrance and the current player receive a three-step buffer. Numeric actor indices start at 10001, retaining existing action-order and combat-seed contracts without reusing original identities. Unsuitable/tiny floors safely receive fewer or zero actors. Tests cover reproducibility, run-depth extension, ownership safety, eligibility and pressure limits. Activation is the next story.

## #241 — One-time return-floor activation

Committed stair ascent activates an eligible floor immediately before its ordinary monster phase. The saved marker is recorded even when no space is available; revisits, waiting and descent never trigger another wave. Survivors and terrain retain their existing identities. Death and completed victory prevent activation, including a direct arrival at the entrance. Generated-map tests cover added actors, repeated activation after clearing, non-activation boundaries and the actual one-turn movement path. Existing complete tiny adventures and victory tests pass with zero suitable extra spawn space.

## #242 — Stronger bounded escape pursuit

During a live cure-carrier escape, all surviving and newly added actors gain two tiles of detection radius, eighteen eligible phases of last-seen memory, and four search phases. Closed doors/walls still block sight, three blocked phases still end a chase, and inactive floors/condition skips retain their pauses. These values are centralized beside ordinary pursuit. Area preparation receives the same detection policy; attack ranges, damage, XP and loot are unchanged. Focused tests compare ordinary versus escape detection, wall/inactive-floor safety and finite searching.

## #243 — Return progress and integrated continuation

The existing objective line shows remaining floors to climb, switching to an entrance reminder on floor one. Each activated floor produces one restrained return-progress message; Help explains finite waves and stronger pursuit without exposing hidden actor positions. A generated 60×60 continuation test preserves actors, markers and subsequent actions exactly across save/load, proves repeated activation after reload is inert, and confirms restart resets escape. UI tests cover progress/entrance messaging and existing quest behavior; browser verified the imported surface-floor reminder (`/tmp/larn-escape-progress-review.png`). No additional persisted representation or save version was needed: v14 already stores the actual actor state and activated-floor list.


## #244 — Escape diagnostics and handoff

The diagnostic reports now separate return turns, added enemies, confirmed defeats, potions and cure-recovery resources. Defeats use the domain counter rather than a population-size difference, so spawns cannot subtract kills. A diagnostic-only comparison plugin disables return pressure without modifying production configuration. Generated 10×10, 60×60 and 100×100 twenty-floor tests activate every return floor once, preserve geometry/caps, and validate the resulting full snapshot.

Matched recommended 60×60×20 full-run seeds 0, 1, 123 and 987 with tactical-aware policy / 30,000 actions did not reach the cure: action limit on floors 6 and 14, no route on floor 2, death on floor 12. Escape enabled/disabled had identical descent results, as required. These runs provide no escape win-rate evidence and expose current diagnostic policy limitations.

A separate controlled cleared-descent return uses level 20, runeblade/tower shield/dragon mail/runic helmet/intelligence ring, 33 initial health, full mana, 3 greater health and 7 greater mana potions, and no surviving outbound enemies. Doors/discoveries are already spent and ground loot is cleared. It is an explicit supplied snapshot, not earned progression.

| Seed | Pressure off turns | Pressure on turns | Return fights | Potions used | Final health / mana | Outcome |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | 1292 | 1328 | 16 | 4 | 32 / 29 | won |
| 1 | 1339 | 1356 | 10 | 1 | 33 / 28 | won |
| 123 | 1091 | 1128 | 17 | 4 | 25 / 23 | won |
| 987 | 1492 | 1536 | 16 | 6 | 39 / 24 | won |

Each pressure-on run activated 76 finite actors; the route encountered only a subset. Pressure-off runs had zero new actors/fights/potions. Initial caps remain unchanged pending human testing: these small supplied samples demonstrate bounded mechanics, not balance across real characters or seeds. Browser keyboard verification imported a controlled floor-20 snapshot, used G to recover on turn 1, then ArrowLeft to ascend/activate floor 19 on turn 2 (`/tmp/larn-return-keyboard-review.png`). Fog was disabled for that demonstration; hidden-awareness privacy is covered separately.

## #246 — Telegraphed horned charger

The horned charger appears on floors 5–20 within existing density caps. From two to four tiles away on a clear cardinal line, it prepares without moving. Its next eligible phase commits to the fixed line, stops before the player/another actor/protected stair or at walls/closed doors, and makes at most one ordinary accuracy/armor-governed hit. It then spends one phase recovering. Sidestepping avoids retargeting; Sleep/Fear clear preparation, and rooting stops the charge. Adjacent ordinary melee remains possible. No damage multiplier or extra phase action was added.

A custom horned face distinguishes it from loot. Visible path tiles show charge warnings; hidden sources/tiles and non-damaging charge messages remain private. Row memoization includes charge-column changes. Save v15 explicitly adds preparation/recovery intents, keeps historical intent unions frozen, and rejects charge intent on non-chargers or invalid fixed lines. Tests cover phase order, sidestep, closed doors, actor/stair collision, interruption, fog privacy, active/inactive resume and migration. Browser loaded a prepared snapshot, verified three marked cells, sidestepped and waited through recovery without damage (`/tmp/larn-charge-line-review.png`).


## #247 — Interruptible one-shot alarm sentry

A stationary sentry appears on floors 3–20. Detection prepares one warning; its next eligible action sounds an alarm with the fixed last-seen tile, even if current sight is lost. Kill/Sleep/Fear interrupts it. Rooting does not silence shouting. It stays at its post (including when afraid or remembering a hidden player), and may use adjacent melee after its alarm is spent. Visible messages/Help show preparation and spent status; hidden sources do not reveal alarm details. Stationary awareness is labeled Alert rather than misleadingly announcing a moving pursuit.

Save v16 persists preparation and `alarmUsed`, rejects malformed flags, already-spent preparation and ordinary actors with alarm state. Focused tests cover one-shot timing, interruption/death, lost sight, inactive-floor pause and resume without re-sounding. Browser verified sentry/charger warnings in dark and light themes, then completed one alarm while dodging the charger (`/tmp/larn-sentry-dark-review.png`, `/tmp/larn-sentry-light-review.png`). Nearby-actor alerting is intentionally connected in #248.


## #248 — Bounded alarms alert existing enemies

A sounded alarm broadcasts its fixed last-seen tile to at most six living actors on the active floor, within eight cardinal steps and clear wall/closed-door sight of the source. Numeric identity ordering selects recipients deterministically. Independent current detection is never overwritten by stale alarm information. Alerts change only awareness: they do not spawn enemies, remove conditions, replace prepared intent, or grant a second phase action.

The phase owner now fetches each actor’s latest state before its scheduled action, allowing a later recipient to use a just-received alert once. Earlier recipients retain the memory for next phase. Tests cover both orders, range/caps/storage-order determinism, fresh sight, closed doors and inactive floors. Private alarm messages remain filtered; pursuit messages say “begins pursuit” without incorrectly claiming direct sight after an alarm. Existing v16 awareness/one-shot persistence needs no new state or version.


## #249 — Initial optional elite and reward

The iron champion is a stronger charger (32 health, base attack 8, XP 24) with arcane resistance and cold weakness. It uses existing charge/interruption/resistance mechanics and is excluded from ordinary/escape spawning. A custom crowned face and Help/Catalog traits identify the encounter. Optional placement follows in #250.

Its guaranteed seeded equipment drop uses an independent elite-reward namespace and existing floor-eligible drop weights, favoring gear introduced in the latter half of the current depth. It does not inspect the player’s equipment or guarantee an upgrade. Normal drops remain unchanged. Tests cover floor 8/12/20 eligibility and determinism, elemental behavior, exclusion from ordinary spawning, one reward after death, repeated-death rejection and saved ownership. No new per-run reward state or save version was required.

## #250 — Optional chambers behind skull-marked gates

Eligible empty side rooms on floors 8–20 have a seeded 20% opportunity, with at most one chamber per floor. A room qualifies only when it has exactly one external entrance and blocking that entrance leaves all stairs, arrivals and the cure connected outside. Existing monsters, loot, objects and terrain are preserved. No suitable room means no encounter.

The gate uses a colored door with a skull and an explicit accessible label. Closed gates block movement, sight and enemy navigation. Opening requires an explicit domain choice; the next story exposes its warning/confirmation UI. Actual gate and champion ownership use the existing save schema. Imports reject gates that fail the optional-room proof. Random relocation and escape reinforcements exclude sealed chambers so they cannot force participation.

Validation: geometry tests cover alternate entrances and required objectives; generated 10/60/100×20-floor maps verify deterministic placement, navigation, return-spawn exclusion and save continuation. Ordinary generated population remains unchanged.
