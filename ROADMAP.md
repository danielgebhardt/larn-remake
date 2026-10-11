# Larn Remake roadmap

This project is a remake and reimagining of Larn, and a place to practice TDD and software design. The goal is a small, enjoyable dungeon crawler built in understandable increments. Fidelity to the original is useful inspiration, not a requirement to reproduce every mechanic.

[Issue #38](https://github.com/danielgebhardt/larn-remake/issues/38) is the roadmap index and discussion point. This file holds the detailed plan; individual issues hold acceptance criteria and reviewable tuning proposals. Update this file and #38 when priorities change or an epic finishes. Completed work should leave the remaining-work lists rather than continuing to appear as the next task.

## Development approach

- The developer remains the primary owner of architecture, implementation, tests, and acceptance. AI can plan, review, pair, or implement when explicitly asked. Creating issues does not authorize implementing them.
- Usually work test-first, one failing test at a time. Favor readable behavior tests and no more than one `describe` nested inside another.
- Prefer stories that demonstrate a visible capability or a small rule with a clear consumer. Complete larger systems through small dependent slices.
- When an epic is explicitly delegated, use a branch, one commit per story, and project statuses Backlog/Ready → In Progress → In Review → Done. Final acceptance remains the developer's responsibility.
- Keep the domain independent of React. Add abstractions when more than one concrete behavior needs them; avoid a generalized RPG modifier engine in advance.
- Follow [Definition of Done](docs/definition-of-done.md) and [AI working agreement](docs/ai-working-agreement.md). Run relevant checks and use browser review for actual layout, focus, scrolling, and accessibility behavior.

## Current baseline

The following milestones are implemented and merged; they are foundations, not outstanding roadmap tasks:

- Configurable seeded multi-floor generation, linked stairs, collision, player-following map scrolling, and efficient large-map rendering.
- Light/dark/system appearance, Settings, Help, a centered Character dialog, a compact bag grid, and the map legend in Help.
- Configurable fog of war, line of sight, and retained exploration memory per floor.
- Player turns, health, action resolution, death/restart, and a retained activity log.
- Multiple seeded goblins with detection, orthogonal pursuit, stable collision-safe monster phases, and Space to wait.
- Starting weapon/shield, equipment-derived attack and armor, equip/swap/unequip, a 20-slot bag, pickup/drop, seeded floor loot, and monster drops.
- Healing potions, G pickup/chooser, item-arrival announcements, four potion shortcuts with keys 1–4, and automatic assignment of newly acquired potion kinds.

Current limitations relevant to the next work:

- Only one monster kind exists; all floors use the same fixed population policy and simple loot catalog.
- Main/off hand are the only equipment slots.
- Attacks always hit and deal fixed damage. Armor subtracts damage with a minimum of one per landed hit; against a one-damage attack, additional armor has no observable benefit.
- Settings currently permits at most ten floors. The default is three 15×15 floors.
- There is no victory objective, XP, leveling, attributes, mana, spellcasting, or save/resume.

## Recommended milestone order

| Order | Milestone | Outcome |
| --- | --- | --- |
| 1 | Floor-aware monsters, loot, chest/helmet equipment | Depth changes encounters and rewards; gear choices matter. |
| 2 | Reproducible randomized melee | Hit/miss and bounded damage create uncertainty with understandable feedback. |
| 3 | First winnable adventure | A short descent, quest item, return trip, and victory give the game a purpose. |
| 4 | Experience, levels, and useful attributes | Characters grow through observable, documented rules. |
| 5 | Mana, first spells, and status effects | Players gain alternatives to bump attacks and drinking healing potions. |
| 6 | Town, gold, and broader adventure systems | Rewards and risk acquire a persistent context within the run. |

Local save/resume and CI can move earlier when they solve a concrete problem. Supporting twenty floors is a configuration/content capability; it is not a commitment to fill or balance twenty floors before the first short adventure works.

## Epic 1: Floor-aware content and armor

Epic issue: [#90](https://github.com/danielgebhardt/larn-remake/issues/90).

### Player outcome

A five-floor run contains recognizable monster variety and useful, depth-appropriate rewards. The player can find and equip chest armor and a helmet, and see how those pieces change survivability. Configurations can extend through floor twenty without selecting content outside its eligible range.

### Ordered stories

| Order | Story | Depends on |
| --- | --- | --- |
| 1 | [#91](https://github.com/danielgebhardt/larn-remake/issues/91) — Define a small floor-aware monster catalog | [#90](https://github.com/danielgebhardt/larn-remake/issues/90) |
| 2 | [#92](https://github.com/danielgebhardt/larn-remake/issues/92) — Spawn reproducible floor-appropriate monster mixtures through floor 20 | [#91](https://github.com/danielgebhardt/larn-remake/issues/91) |
| 3 | [#93](https://github.com/danielgebhardt/larn-remake/issues/93) — Define depth-eligible loot and a small armor/weapon catalog | [#90](https://github.com/danielgebhardt/larn-remake/issues/90) |
| 4 | [#94](https://github.com/danielgebhardt/larn-remake/issues/94) — Equip chest and helmet armor as turn actions | [#93](https://github.com/danielgebhardt/larn-remake/issues/93) |
| 5 | [#95](https://github.com/danielgebhardt/larn-remake/issues/95) — Show chest and helmet slots in the Character dialog | [#94](https://github.com/danielgebhardt/larn-remake/issues/94) |
| 6 | [#96](https://github.com/danielgebhardt/larn-remake/issues/96) — Generate floor-aware found loot and monster drops | [#92](https://github.com/danielgebhardt/larn-remake/issues/92), [#93](https://github.com/danielgebhardt/larn-remake/issues/93), [#95](https://github.com/danielgebhardt/larn-remake/issues/95) |
| 7 | [#97](https://github.com/danielgebhardt/larn-remake/issues/97) — Scale initial monster populations to playable floor space | [#92](https://github.com/danielgebhardt/larn-remake/issues/92) |
| 8 | [#98](https://github.com/danielgebhardt/larn-remake/issues/98) — Playtest and document a five-floor equipment progression | [#95](https://github.com/danielgebhardt/larn-remake/issues/95), [#96](https://github.com/danielgebhardt/larn-remake/issues/96), [#97](https://github.com/danielgebhardt/larn-remake/issues/97) |

The catalog and equipment work can progress alongside monster spawning; dependencies on the individual issues describe where those paths rejoin. The final playtest depends on mixed spawning, floor-aware loot, visible armor actions, and a reviewed population policy.

### Content scope

Start with three monster kinds, not a large bestiary:

| Kind | Proposed floor range | Initial distinction |
| --- | --- | --- |
| Giant rat | 1–4 | An early, relatively weak melee encounter. |
| Goblin | 1–20 | The existing baseline; ensures every supported depth has an eligible kind. |
| Orc | 3–20 | A stronger melee encounter that makes equipment upgrades useful. |

All initially use the existing detection/pursuit rules. Distinguish health, damage, detection radius if useful, and visuals; defer abilities, wandering, remembered pursuit targets, ranged attacks, reinforcements, and respawning.

Add leather/chain chest armor and leather cap/iron helmet. Retain existing swords, shield, and healing potion; add at most one stronger weapon tier if playtesting requires it. Chest and head start empty. Legs, boots, rings, necklaces, dual wielding, and two-handed gear wait until there are specific items and effects worth supporting.

Monster/item definitions need inclusive minimum/maximum floors and relative selection weights. Found loot and monster drops share floor eligibility, while source weights/preferences can differ. Relative weights determine selection among eligible content; they are distinct from a monster's chance to drop anything. Ensure supported floors retain eligible pools, and validate unusable definitions explicitly.

### Generation and state constraints

- Terrain, stairs, monsters, found loot, drops, and later combat remain independently seeded concerns. Type selection should not needlessly disturb position selection or terrain.
- Same seed/configuration reproduces initial content. Extending the run with later floors does not rewrite earlier populations or loot.
- Preserve safe player/stair arrivals, no overlapping monster spawns, stable identities, retained wounds/positions/items/deaths, and replay reset.
- Quantity should follow safe walkable floor space with an explicit cap, rather than placing the same three monsters in every map size. Keep small floors survivable and large floors responsive. Retain explicit count overrides for focused tests.
- No user-facing spawn/difficulty controls yet. Internal constants and catalog definitions are enough while learning what produces good encounters.

### Armor and actions

Armor contributions from shield, chest, and helmet are summed once. During this epic, keep subtraction with a minimum of one damage per landed hit and fixed damage. Test armor against a stronger attack so its value is observable; do not claim it protects against the current one-damage goblin merely by increasing the displayed number.

Equipping, swapping, unequipping, picking up, and dropping remain turn actions with one monster phase. Browsing, configuration, and rejected actions remain free. Do not change bag capacity, ownership rules, potion semantics, or keyboard/focus behavior as a side effect of adding slots.

### Completion gate

Play recorded seeds on a five-floor 15×15 run. Demonstrate early encounters, armor upgrades, stronger/deeper enemies, a drop, and revisits preserving state. Check 100×100 responsiveness with the capped population. Record tuning values and observations; avoid promising that every random seed guarantees a particular gear find. Combat remains always-hit until the next epic.

## Epic 2: Reproducible randomized melee

Epic issue: [#99](https://github.com/danielgebhardt/larn-remake/issues/99). Begin after the content/armor milestone is reviewed.

### Player outcome

Player and monster attacks can miss; landed hits vary within a bounded range. Players can understand their own damage, accuracy, and armor, and follow each encounter in the activity log. The same seed and sequence of actions reproduce the fight for debugging and replay.

### Ordered stories

| Order | Story | Depends on |
| --- | --- | --- |
| 1 | [#100](https://github.com/danielgebhardt/larn-remake/issues/100) — Define melee accuracy and bounded damage profiles | [#99](https://github.com/danielgebhardt/larn-remake/issues/99) |
| 2 | [#101](https://github.com/danielgebhardt/larn-remake/issues/101) — Make attack rolls reproducible independently of unrelated randomness | [#100](https://github.com/danielgebhardt/larn-remake/issues/100) |
| 3 | [#102](https://github.com/danielgebhardt/larn-remake/issues/102) — Resolve player bump attacks with hit/miss and variable damage | [#100](https://github.com/danielgebhardt/larn-remake/issues/100), [#101](https://github.com/danielgebhardt/larn-remake/issues/101) |
| 4 | [#103](https://github.com/danielgebhardt/larn-remake/issues/103) — Resolve monster melee attacks with hit/miss, damage ranges, and armor | [#102](https://github.com/danielgebhardt/larn-remake/issues/102) |
| 5 | [#104](https://github.com/danielgebhardt/larn-remake/issues/104) — Explain randomized attack values in Character and Help | [#103](https://github.com/danielgebhardt/larn-remake/issues/103) |
| 6 | [#105](https://github.com/danielgebhardt/larn-remake/issues/105) — Make mixed combat outcomes readable in the activity log | [#103](https://github.com/danielgebhardt/larn-remake/issues/103) |
| 7 | [#106](https://github.com/danielgebhardt/larn-remake/issues/106) — Playtest randomized combat and record the initial balance | [#104](https://github.com/danielgebhardt/larn-remake/issues/104), [#105](https://github.com/danielgebhardt/larn-remake/issues/105) |

The hit/miss events arrive with live player/monster integration. The activity-log story finishes cross-action ordering, narrative clarity, and accessibility; it does not postpone all combat feedback until the end.

### Proposed initial rules

These are small reviewable defaults, not a commitment to D&D or a reproduction of original Larn's formulas:

| Rule | Proposed starting value |
| --- | --- |
| Hit roll | Uniform integer D20, 1–20. |
| Player accuracy | Hit on 4–20: 85%. |
| Monster accuracy | Hit on 5–20: 80%, initially shared unless a kind needs a clear distinction. |
| Landed damage | Uniform inclusive range `max(1, nominal damage − 1)` to `nominal damage + 1`. |
| Armor | Subtract from landed incoming damage; minimum final landed damage is 1. |
| Miss | Zero damage, but the attack still uses its turn. |
| Critical hits/fumbles | Deferred; 1 and 20 have no extra effects. |

Nominal player damage is the existing base plus weapon contribution, applied once. Monster nominal damage comes from its definition. Armor and accuracy remain separate so gear does not silently change two independent rules. Damage is rolled only on a hit. For example, nominal damage 3 gives a raw range of 2–4; armor 1 makes its landed received damage 1–3. A miss still deals zero.

Start with fairly reliable attacks and modest variance. Tune after recorded encounters: repeated misses can make bump combat frustrating, and random combat by itself does not create tactical depth. Avoid adding opposed rolls, criticals, resistances, speed schedules, or attributes just to make the first random calculation more elaborate.

### Reproducibility

An outcome context includes run seed, consumed turn, stable attacker and target identities, and separate hit/damage purposes; include floor identity wherever actor identities are not already globally unique. A conceptual namespace is `seed:turn:combat:attacker:target:hit`, with a separate `damage` key.

- Same context produces the same rolls. Different contexts can legitimately produce the same numeric roll; tests must not require otherwise.
- Rendering, menu browsing, appearance/fog changes, invalid actions, and generation random calls do not perturb combat.
- Restarting the same seed and repeating the same actions reproduces the encounter. Different legitimate actions can change turns, positions, opponents, and outcomes.
- Tests supply controlled rolls for hit thresholds, damage endpoints, mitigation, kills, and misses. Do not rely on random sampling to make pass/fail assertions.
- An independent keyed approach avoids introducing a mutable global RNG sequence that unrelated actions can accidentally advance. Preserve future save/resume reproducibility.

### Turn order and feedback

Keep the existing player-first turn structure. A miss spends a turn. Killing a monster prevents its retaliation; other living active monsters still act once in stable order. A monster that moves into adjacency does not also attack. Player death stops the phase immediately. Inactive floors freeze, and stairs resolve the destination floor's phase.

Successful potion use heals before the monster phase. Successful inventory/equipment actions also trigger that phase; rejected actions and full-health potion attempts remain free. A miss must not create a drop, hit event, or damage. Kills/drops/deaths occur exactly once.

Character should display a damage range and hit chance rather than promising a fixed attack amount. Armor has a separate explanation. The activity log reports actual damage and misses in chronological order. Keep hash keys and raw dice debug output out of required gameplay text.

### Completion gate

Play several recorded five-floor seeds with starter and upgraded equipment. Evaluate hits-to-kill, miss streaks, healing availability, and armor usefulness. Verify reproducibility, floor traversal, multi-monster ordering, death/restart, fog, and hotbar behavior. Publish final formulas and worked examples in README. Twenty-floor tuning remains later work.

## Milestone 3: First winnable adventure

Write detailed stories when the previous two epics stabilize. Build an achievable five-floor loop before adding many progression systems:

1. Establish the objective: descend to recover a cure and return safely.
2. Place a unique quest item on the final floor with reproducible reachable placement; keep it distinct from a consumable healing potion.
3. Define how carrying the cure and reaching the surface/entrance produces victory. The current first floor needs an explicit return/exit interaction; do not assume an existing top-floor stair already supports this.
4. Make quest status understandable and protect it from accidental drinking or losing it through ordinary inventory interactions. Decide whether it consumes a bag slot when writing the story.
5. Add a victory state and run summary: seed, depth, turns, and a few useful accomplishments. Preserve defeat/restart and stop gameplay appropriately after either ending.
6. Play the complete descent and return loop, then tune encounters/rewards using an actual objective rather than isolated fights.

No quest timer initially. Introduce a turn-based deadline only when a normal run is reliably achievable, clearly explain its remaining time, and ensure it does not advance while menus are open. A boss, fixed final encounter, or special objective room is optional later, not a prerequisite for the first victory.

## Milestone 4: Experience, levels, and attributes

Introduce numerical complexity one visible rule at a time:

1. Award XP for a confirmed kill exactly once; specify player-only credit and whether loot/other actions award any. Add a small, documented level threshold curve.
2. Make a level-up grant one understandable benefit, such as increased maximum health. Explicitly define current-health adjustment; do not silently grant a full heal.
3. Add Strength alongside a concrete melee contribution, preserving equipment bonuses and avoiding double application.
4. Add Dexterity when it contributes to accuracy/evasion. Revisit the initial hit thresholds with clear caps and boundary tests rather than hiding a new contribution inside old values.
5. Add Constitution when it affects maximum health or resistance. Avoid retroactive unclear health changes when an attribute changes.
6. Add Intelligence with the first spell/mana feature. Wisdom/Charisma and any remaining classic attributes wait for meaningful effects.
7. Expand Character only for values the player can actually use. Distinguish base attributes, equipment contributions, and final derived values.

Document formulas, rounding, bounds, and worked examples as they arrive. Defer point allocation, respecs, skill trees, classes, and a generalized modifier framework. Depth difficulty and rewards can then be tuned against the actual progression curve. Expose difficulty settings only when their effects can be explained.

## Milestone 5: Mana, spells, and status effects

Add current/max mana together with a first usable spell, not an unused bar:

- Start with one spell that creates a meaningful alternative, such as a ranged attack or a defensive effect. Write targeting/range/line-of-sight rules explicitly.
- Define cost, recovery, successful action timing, insufficient-mana rejection, death rules, and interactions with monster turns.
- Introduce Intelligence only with its actual contribution to mana, learning, or damage.
- Add mana potion/hotbar support once there is mana to restore. Existing potion-kind assignment rules should extend naturally.
- Introduce one status effect at a time (for example poison or temporary protection), with duration, stacking, refresh, expiry, turn timing, and log/UI behavior.
- Scrolls can later provide limited-use effects without requiring a large learned spellbook.

Defer a large spell catalog, area targeting, summons, elemental resistances, cooldown systems, and equipment affixes until the first spell loop works.

## Larn-inspired adventure features

Original Larn provides useful direction beyond generic combat/leveling. Its quest is to obtain a cure for a sick child within a time limit; it includes gold, town facilities such as a shop, trading post, school and bank, spells/scrolls/potions, traps, eight-direction movement, and save/checkpoint support. Sources: [NetBSD Larn manual](https://man.netbsd.org/larn.6) and [iLarn gameplay guide](https://roguelike-palm.sourceforge.net/iLarn/play.php.html). Adapt these intentionally rather than importing every original rule.

Likely later priorities:

- **Town and gold:** start with a return location and one shop or healing service. Define gold ownership and pricing before banks, interest, school courses, or taxes.
- **Exploration choices:** doors, traps, special rooms, altars, and varied dungeon layouts can create decisions beyond walking toward monsters. Add observable interactions in small slices.
- **Diagonal movement:** consider eight-direction controls alongside monster movement, adjacency, pathfinding, vision, and corner-cutting rules. It is not merely adding four key mappings.
- **Resource pressure:** consider safe resting/regeneration and then a quest deadline. Any recovery loop needs a tradeoff to avoid removing the value of healing loot.
- **Distinct enemies:** ranged attacks, abilities, wandering, or remembered pursuit targets should create tactical differences before simply increasing catalog size.
- **Original economy extras:** banks/interest, taxes, identification/unknown consumables, and specialized services are optional late work. Decide which improve this remake's game loop.

## Local save/resume and persistence

Move this earlier if runs become long enough that closing the browser is costly:

1. Explicit local save/load for a single run with clear success/error feedback.
2. Include the state actually present: seed/configuration, generated or reconstructable floors/stairs, current floor/player, exploration, monster positions/health/deaths, floor loot, inventory/equipment/hotbar, turns/health, activity, quest/progression/mana where introduced.
3. Decide whether terrain is stored or reconstructed, and version the save format. A seed alone cannot restore a played run.
4. Preserve attack reproducibility after loading; turn and stable actor identities are part of that requirement.
5. Reject invalid/incompatible saves safely without overwriting a playable current run. Add autosave only after manual save/load is dependable.

Backend saves, accounts, authentication, sessions, and cross-device synchronization wait for a demonstrated need.

## Deferred engineering work: CI and browser smoke tests

This remains on the backlog; it does not block the next gameplay epic.

**CI first:** on PRs and main pushes, run frontend Biome checks, the full test suite, production build/typechecking, and backend tests using the Gradle wrapper. Use declared pnpm and compatible Node/Java versions. Keep useful diagnostics and the existing local hook that fixes/stages frontend changes and checks tests/build.

**Small browser suite next:** replay a seed; traverse linked stairs without bouncing; open/dismiss Settings while gameplay pauses and focus restores; follow the player through a constrained scroll viewport. Later add Character/pickup/hotbar and one combat/victory smoke flow when stable. Use controlled seeds, observable assertions, and retained failure diagnostics. Domain rules remain covered by fast unit tests.

Avoid an exhaustive browser/device matrix, screenshot baselines for every tile, or converting every unit test into an end-to-end test. Record flaky asynchronous tests as focused cleanup when they recur; do not hide failures through automatic retries.

## Explicitly deferred scope

- Balancing a full twenty-floor adventure before a short run is satisfying.
- Extra equipment slots without useful content; drag-and-drop, stacking, weight, item footprints/rotation, and spatial inventory.
- Two-handed weapons/dual wielding, affixes, crafting, item rarity systems, and unidentified/harmful potions.
- Critical hits/fumbles and a complete tabletop ruleset in the first randomized combat milestone.
- Full classic attributes, class/skill trees, and large magic catalogs introduced together.
- Mid-run spawning, respawn, reinforcement schedules, sophisticated AI, and complex speed/initiative systems.
- Multiplayer, cloud persistence, accounts, and deployment infrastructure without a concrete use case.

The next playable objective is **varied encounters and meaningful equipment**, then **understandable uncertain combat**, then **a short adventure that can be won**.
