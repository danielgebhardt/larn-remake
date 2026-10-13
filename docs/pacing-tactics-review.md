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
