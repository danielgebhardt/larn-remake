# Pacing and tactical clarity review

Branch: `codex/pacing-and-tactical-clarity`, based on the completed pursuit/escape/merchant program. Developer acceptance and publishing remain pending. Two native parent epics: #265 (pacing), #270 (tactical clarity).

## #266 — Per-floor pacing baseline

`review-adventure.mjs` now emits `pacing.visits`: separate visits for descent, cure pickup and return, with arrival/exit turn, level/XP, health/capacity, mana/capacity and gold. Each visit counts committed turns, turns containing combat events, unchallenged moves, kills, useful equipment upgrades, potion consumption and logged incoming damage. Rejected actions do not count; stair actions belong to the floor being left, while resulting resource snapshots include that action's destination response. Damage includes logged overkill, matching the activity contract. Charger damage is now included in existing diagnostics.

Run from `frontend`:

```sh
node scripts/review-adventure.mjs 0 1 123 987 --policy tactical-aware --max-actions 1500
```

The policy knows unexplored geometry and chooses a limited set of actions. It does not reproduce human decisions, merchant shopping or every new mechanic. An action limit or no-route result is not a difficulty verdict. The report can measure partial floors; do not present them as completed journeys.

### Human playtest template

Record release/commit, seed, dimensions/depth and a save near a concern. For each floor/return visit note entry/exit turn, level/XP, health/mana, fights, useful upgrades, potions used/remaining, merchant purchases, and whether exploration or combat felt repetitive. Note deliberate avoided encounters. Human observations are needed alongside seeded reports before broad supply or XP changes.

## #267 — Depth-sensitive equipment

Ordinary found/drop selection discounts plain equipment by `1 / (1 + 2 × same-slot value gap)` relative to the strongest currently eligible plain alternative. The adjusted plain-equipment band is normalized back to its original total weight. Potions, rings, scrolls and stat-bearing tradeoffs keep their original probability weights. Monster preferences still apply, and all eligible alternatives retain a positive chance. Elite reward rules and actual saved items are unchanged.

A matched six-seed draw comparison (0, 1, 123, 987, 42, 4294967295; 1,000 found draws per seed/floor) at floor 8 reduced iron swords from 315 to 99, while battle axes increased from 165 to 300 and plate armor from 132 to 244. This isolates selection probabilities, not actual useful upgrades in a human run; individual outcomes are not guaranteed. All potion counts in that comparison remained identical. Replay generation changes, while loaded played loot remains authoritative.

## #268 — Supply budgets

`node scripts/review-rewards.mjs 0 1 123 987 42 4294967295` (from frontend) reports actual seeded ordinary floor/drop/chest supply potential by floor, restoration capacity, antidotes/boost bottles and unused fountain counts. Shared merchant stock is reported separately with actual stall floors and prices; its 40 initial bottles offer at most 200 health and 170 mana for 14,000 gold. Stock is not guaranteed affordable or even accessible in short/custom adventures. Optional elite/return/discovery rewards, spell healing and passive recovery are excluded deliberately.

Supply probabilities and the 30-turn mana interval are retained. The new pursuit/return pressure, merchant and fountains have not yet been human-playtested enough to justify reducing supplies. Generated potential assumes all ordinary enemies/chests are found and looted; it is an upper bound, not available resources at every fight. Use the per-visit consumption report to identify shortages before changing one source at a time. An unlucky early floor remains possible; finite merchants provide an expensive later fallback rather than a guaranteed potion.

## #269 — Twenty-floor XP audit

The rewards diagnostic also reports per-floor ordinary XP, cumulative XP, derived level and distance to the next level. It excludes elites, shrines, thrones and escape rewards; players can earn extra XP from those or skip ordinary fights. This reports all generated ordinary kills in floor order, not earned progress of a surviving character.

Six recommended 60×60×20 seeds yielded:

| Seed | XP by floor 10 | XP by floor 20 | First possible ordinary level 20 |
| --- | ---: | ---: | --- |
| 0 | 1,158 | 4,128 | Floor 19 |
| 1 | 1,103 | 3,951 | Floor 20 |
| 123 | 1,102 | 4,052 | Floor 20 |
| 987 | 1,043 | 3,839 | Floor 20 |
| 42 | 1,035 | 3,789 | Floor 20 |
| 4294967295 | 996 | 3,582 | Not reached (level 19) |

The existing 3,700-XP level-20 threshold meets the late-adventure goal in this ordinary baseline. Thresholds, automatic growth, enemy rewards and level cap are retained; no save migration or wound/capacity change is needed. More optional challenges could accelerate this, so compare human floor-level reports before changing thresholds. Short adventures are not guaranteed to reach the cap.

Supply totals across the same seeds were 295–450 health and 293–353 mana, with 3–18 antidotes; these are collectible potential, not resources available before each encounter. The low-antidote seed is a useful human playtest case.
