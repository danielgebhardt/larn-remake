# Difficulty and new-adventure choices — epic #213

Implementation order: rules #281, saves #282, difficulty UI #283, map-size choices #279, matched verification #284. Work is on `codex/difficulty-and-adventure-choices`, one tested initial commit per story. Earlier monster eligibility is separate Backlog #291.

## Rules and ownership — #281

`GameState.difficulty` owns the immutable runtime multiplier. New state defaults to Normal (1) and validates the supported values 0.75/1/1.25. `Difficulty.ts` owns validation and round-to-nearest, minimum-one scaling; `MonsterStats.ts` exposes actual maximum health and physical damage-range endpoints for future creature displays. Baseline catalogs and seed streams remain unchanged.

Fresh ordinary and optional-elite health scales after content placement; this retains identity, positions, loot and object generation. Return encounter health uses the same maximum-health helper. Enemy healing/regeneration use scaled caps, while recovery amounts and cadence remain unchanged.

Physical melee, ranged and charge attacks roll in their original range/stream, scale the landed raw result, then apply player armor. Misses remain zero and landed minimum-damage rules remain unchanged. Enemy spells and area attacks already bypass physical armor: they scale raw damage while retaining that behavior. Player damage, accuracy, enemy defenses, ongoing conditions, environmental damage, rewards/density and mana recovery are untouched.

The gameplay field is not exposed through UI yet. Current v19 restoration explicitly uses Normal; non-normal saved continuation is the next story, before any non-normal UI control becomes available.

Behavior tests failed first, then passed. Focused rules/physical/spell/area/charge/current-save coverage passes 6 files / 49 tests. Complete frontend formatting, tests and TypeScript/production build run through the standard commit hook.

## Saved continuation — #282

Save v20 explicitly adds difficulty to saved run configuration. Runtime difficulty is derived from that field during restoration, and the writer uses the active GameState value rather than a draft or mismatched configuration argument. V1–v19 migrations force Normal; unknown legacy difficulty metadata cannot select a non-normal run. Historical shape guards/fixtures remain unchanged, and the v1 configuration type now explicitly selects its seven historical fields so future runtime fields cannot silently broaden it.

Source-version actor validation uses the corresponding scaled cap only in v20. Wounded actors, removed kills/rewards, enchants, resources, actual geometry and prepared state remain authoritative. Missing/unsupported difficulty and easier actors above their scaled limit are rejected before restoration. Player death is retained as before; defeated monsters remain removed rather than becoming zero-health saved actors.

The new continuation tests failed first; current/legacy migration and validation coverage passes 6 files / 180 tests. The all-source dispatch table now includes 20 formats. Existing current-version assertions were updated without regenerating legacy fixtures.
