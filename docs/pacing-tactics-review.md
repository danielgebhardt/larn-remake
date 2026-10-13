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
