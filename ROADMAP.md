# Larn Remake roadmap

This project is a remake and reimagining of Larn, and a place to practice TDD and software design. The goal is a small, enjoyable dungeon crawler built in understandable increments. Fidelity to the original is useful inspiration, not a requirement to reproduce every mechanic.

[Issue #38](https://github.com/danielgebhardt/larn-remake/issues/38) is the roadmap index and discussion point. This file holds the detailed plan; individual issues hold acceptance criteria and reviewable tuning proposals. Update this file and #38 when priorities change or an epic finishes. Completed work should leave the remaining-work lists rather than continuing to appear as the next task.

## Development approach

- The developer remains the primary owner of architecture, implementation, tests, and acceptance. AI can plan, review, pair, or implement when explicitly asked. Creating issues does not authorize implementing them.
- Usually work test-first, one failing test at a time. Favor readable behavior tests and no more than one `describe` nested inside another.
- Prefer stories that demonstrate a visible capability or a small rule with a clear consumer. Complete larger systems through small dependent slices.
- When an epic is explicitly delegated, use a branch, one commit per story, native GitHub epic/sub-issue links, and project statuses Backlog/Ready → In Progress → In Review → Done. Final acceptance remains the developer's responsibility.
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
- Mana potions, Magic Missile and Heal, spell targeting and hotbar, Character/Spells tabs, and automatic level-based Intelligence growth.
- Confirmed localStorage save/load, file export/import, and a dedicated Save/Load sheet with restored dungeon keyboard focus.
- Numbered pickup choices with keyboard paging (#144), and consistent Character/Spells dialog dimensions (#145), merged into main.

Current limitations relevant to the next work:

- Floor-aware rats, goblins, and orcs plus weighted found/drop loot are implemented and merged in epic #90. Populations scale with safe space and are capped.
- Main/off hand, chest, and head equipment are implemented; other slots are deferred.
- Seeded hit/miss and bounded damage are implemented and merged in epic #99. Armor affects landed damage separately from accuracy; criticals remain deferred; earned Strength and Dexterity are merged in epic #116.
- Settings permits five through twenty floors. The default is five 15×15 floors.
- The cure-and-return objective in epic #109 is merged. XP, capped leveling, Strength, and Dexterity in epic #116 are merged. Mana, Intelligence and two initially known spells in epic #127, plus manual local saves in epic #143, are merged. Other attributes remain future work.

## Recommended milestone order

| Order | Milestone | Outcome |
| --- | --- | --- |
| 1 | Floor-aware monsters, loot, chest/helmet equipment | Merged: depth changes encounters and rewards; gear choices matter. |
| 2 | Reproducible randomized melee | Merged: hit/miss and bounded damage create uncertainty with understandable feedback. |
| 3 | First winnable adventure | Merged: descent, cure recovery and return victory. |
| 4 | Experience, levels, and useful attributes | Merged: capped growth, XP, Strength and Dexterity. |
| 5 | Mana and practical spellcasting | Merged: Intelligence, two known spells, targeting and renewable mana. |
| 6 | Distinct enemy tactics | Merged #146: cover, response turns and tactical diagnostics. |
| 7 | Expanded adventure | Implemented for review: twenty creatures/spells, found books, rings, finite discoveries and gold. |
| 8 | Human playtest and pacing | Review combat/recovery and quiet travel together, then difficulty and town/economy. |

Manual local save/resume is merged. CI remains deferred until prioritized. Supporting twenty floors is a configuration/content capability; it is not a commitment to fill or balance twenty floors before the first short adventure works.

## Epic 1: Floor-aware content and armor

Implementation status: stories #91–98 are merged into main. See [review notes](docs/content-combat-review.md).

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

Implementation status: stories #100–106 are merged into main.

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

Implementation status: [epic #109](https://github.com/danielgebhardt/larn-remake/issues/109) and stories #110–115 are merged into main. See [adventure review notes](docs/adventure-review.md).

| Story | Outcome |
| --- | --- |
| [#110](https://github.com/danielgebhardt/larn-remake/issues/110) | Quest state, confirmed kill count, five-floor default. |
| [#111](https://github.com/danielgebhardt/larn-remake/issues/111) | One independently seeded, reachable cure on the deepest configured floor. |
| [#112](https://github.com/danielgebhardt/larn-remake/issues/112) | Protected pouch, full-bag recovery, quest progress, and pickup feedback. |
| [#113](https://github.com/danielgebhardt/larn-remake/issues/113) | Floor-1 entrance, return reminders, delivery victory, and ended-run action rules. |
| [#114](https://github.com/danielgebhardt/larn-remake/issues/114) | Victory summary, inspection, replay, and new adventure controls. |
| [#115](https://github.com/danielgebhardt/larn-remake/issues/115) | Complete-loop tests, seeded diagnostics, browser review, and documentation. |

The cure occupies no bag slot and cannot be drunk, equipped, or dropped. Recovery takes a normal action turn; stepping onto the entrance carrying it wins on that movement turn before monster retaliation. Custom depths 5–20 put the cure on their final floor. Inspection remains available after victory, while gameplay stops.

Recorded five-floor diagnostics complete the return for seeds 0 and 987, while seeds 1 and 123 die before recovery. No combat/loot tuning was made merely to force diagnostic wins. Further human playtesting and twenty-floor balance remain open. No quest timer, boss, or special objective room initially. Introduce a deadline only with clear remaining-time feedback and reviewed resource pressure.

## Milestone 4: Experience, levels, and attributes

Implementation status: [epic #116](https://github.com/danielgebhardt/larn-remake/issues/116), stories #117–124, is merged. See [progression review notes](docs/progression-review.md) for the ordered commits, formulas, diagnostic results, and manual checkpoint.

| Story | Outcome |
| --- | --- |
| #117 | Positive monster XP rewards; cumulative thresholds 0/10/30/60/100; level cap 5; +2 current/maximum health per level. |
| #118 | Confirmed kills award once, before retaliation, with ordered XP/level events. |
| #119 | Level/XP status, a progression column, victory snapshot, and I/C dialog shortcuts. |
| #120 | XP/health-only checkpoint before adding attributes. |
| #121 | Strength 10 → 12 → 14 at levels 1/3/5, contributing +0/+1/+2 melee damage once. |
| #122 | Dexterity 10 → 12 → 14 at levels 1/2/4, contributing +0/+5/+10 percentage points to accuracy/evasion. |
| #123 | Consistent explanations in Character, Help, and the activity log. |
| #124 | Complete-adventure regressions, configurable seed batches, and final review documentation. |

Character cap 5 is independent of dungeon depth 5–20. XP continues accumulating at cap without more healing or growth. A future character cap of 20 can extend the curve; it is not enabled yet. Keep XP authoritative and derive level/attributes, rather than storing duplicate values. Attributes grow automatically with no allocation UI.

Before expanding the rules, the developer should play several large twenty-floor runs and review progression pace, potion availability, sustained combat after the cap, and exploration behavior. The diagnostic is an omniscient coverage tool, not a human win-rate estimate. Its action-budget cutoffs and routing failures are reported separately from death.

Remaining attribute work: Constitution when it has a clear health/resistance benefit; Intelligence is merged with mana and usable spells in epic #127. Wisdom/Charisma, point allocation, respecs, classes, skill trees, criticals, and generalized modifiers wait for concrete gameplay needs. Twenty-floor balance remains open.

## Feedback polish and next epic proposals

Stories #125–126 are merged: shared low-health feedback at 1–5 HP and highlighted major activity entries. Large-map playtests found sparse encounters, redundant gear, and early capped progression. The 50×50×10 diagnostic also exposes its hoarding limitation: selecting only useful gear improves outcomes dramatically. Address the diagnostic policy before drawing supply-balance conclusions from its deaths.

The mana epic and manual local saves are merged; next priorities are:

1. **Enemies with distinct tactics:** one ranged enemy using the targeting foundation and one contrasting melee behavior. Add depth-appropriate content alongside the behavior, then revisit encounter spacing, XP pace, and obsolete gear eligibility. Raising population alone would accelerate the current level cap and increase healing demand.
2. **Dungeon interactions:** doors, a finite-use chest or fountain, and then a simple visible trap. Each should introduce a choice, seeded placement, retained state, and a defined turn cost. Introduce an interaction mechanism only when its first actual object needs it.

The [Larn monster list](https://larn.fandom.com/wiki/Monsters) describes speed differences, breath attacks, and resistances; [spells](https://larn.fandom.com/wiki/Spells) describe directional targeting and range; [dungeon objects](https://larn.fandom.com/wiki/Dungeon_Objects) include doors, fountains, chests, mirrors, and traps. These are inspiration for meaningful choices, not a requirement to copy formulas, permanent stat drains, equipment destruction, or the full catalog. The wiki home could not be fetched directly; available indexed page content informed these proposals. Existing later mana/town plans remain below; no new gameplay epic is authorized by this planning note.

## Milestone 5: Mana and practical spellcasting

[Epic #127](https://github.com/danielgebhardt/larn-remake/issues/127) is merged into main. Story order: #128 → #137 → #129 → #130 → #131 → #132 → #133 → #134 → #135. See [mana review notes](docs/mana-review.md) for the ordered commits, rules, recorded diagnostics, browser review and manual checkpoint.

- Intelligence grows automatically by level, consistent with Strength/Dexterity; it improves mana capacity and both spell effects. Growth preserves missing mana.
- Both Magic Missile and Heal start known. Knowledge is independent of levels; future spells require found spellbooks, with actual books/acquisition deferred.
- Targeted casting supports Z, arrows/Enter and map clicks; Heal supports H or a direct hotbar click. Invalid/canceled actions are free; successful casts use the ordinary turn and monster phase.
- A distinct known-spell hotbar sits beside potions. Character and Spells tabs preserve inventory and provide shared derived information.
- Mana recovers slowly on committed turns, plus identified mana potions using ordinary loot/shortcut rules.
- The diagnostic retains a named baseline and adds a spell-aware useful-gear policy. Large maps generate ample mana through travel; recorded wins are not human win-rate or complete balance claims.

Before the next gameplay epic, review these commits and manually try several short and large runs. Decide whether ranged enemy tactics or resource pressure should come first; do not treat more mana or more monsters as an automatic fix for long walks.

Later class selection should define different starting attributes and automatic level growth rather than manual point distribution. Equipment bonuses and permanent stat potions should remain separate from base earned attributes when those actual stories arrive.

Status effects remain future work: introduce one at a time, specifying duration, stacking, refresh, expiry, turn timing and feedback. Scrolls can later provide limited-use effects. Defer broad spell catalogs, area targeting, summons, resistances, cooldowns and affixes until concrete gameplay needs them.

## Larn-inspired adventure features

Original Larn provides useful direction beyond generic combat/leveling. Its quest is to obtain a cure for a sick child within a time limit; it includes gold, town facilities such as a shop, trading post, school and bank, spells/scrolls/potions, traps, eight-direction movement, and save/checkpoint support. Sources: [NetBSD Larn manual](https://man.netbsd.org/larn.6) and [iLarn gameplay guide](https://roguelike-palm.sourceforge.net/iLarn/play.php.html). Adapt these intentionally rather than importing every original rule.

Likely later priorities:

- **Town and gold:** start with a return location and one shop or healing service. Define gold ownership and pricing before banks, interest, school courses, or taxes.
- **Exploration choices:** doors, traps, special rooms, altars, and varied dungeon layouts can create decisions beyond walking toward monsters. Add observable interactions in small slices.
- **Diagonal movement:** consider eight-direction controls alongside monster movement, adjacency, pathfinding, vision, and corner-cutting rules. It is not merely adding four key mappings.
- **Resource pressure:** consider safe resting/regeneration and then a quest deadline. Any recovery loop needs a tradeoff to avoid removing the value of healing loot.
- **Distinct enemies:** ranged attacks, abilities, wandering, or remembered pursuit targets should create tactical differences before simply increasing catalog size.
- **Original economy extras:** banks/interest, taxes, identification/unknown consumables, and specialized services are optional late work. Decide which improve this remake's game loop.


## Readiness cleanup before tactical enemies

Completed, reviewed and merged into main from `codex/turn-ownership-cleanup`:

- `26cd7c9`: PlayerActions owns committed turns; effect helpers share that turn context.
- `5863a15`: imported/stored monsters must respect protected stairs and arrival tiles.
- `6dae4f5`: explicit v1 save aggregate/monster contract, separate structural and semantic validation, retained compatibility fixture and documented balance limits.
- `6b7c6f7`: selected spell definitions drive supported effects, potency, range and targeting presentation.
- `06b0846`: keyboard handling is separate from map rendering, with shared Home menu guards and retained post-run Character access.

All 1,425 frontend tests, Biome, TypeScript checks and the production build passed at the final code commit. See [the readiness review](docs/codebase-review-2026-10-11.md) for the original findings, commit explanations and deferred work. An adventure coordinator hook in Home remains optional; measure crowded pursuit and threat rendering in the tactics checkpoint before optimizing further.

## Completed epic: Distinct enemy tactics

[Epic #146](https://github.com/danielgebhardt/larn-remake/issues/146) was reviewed and merged from `codex/enemy-tactics`. Stories #147–153 implement instance-owned intent, save format v2 with validated v1 migration, controlled archer shots, the brute’s fixed-tile response opportunity, tactical visuals/Help with fog-safe threat markers, seeded floor-appropriate mixed populations within existing caps, save/replay plus complete-adventure integration coverage, and matched tactical diagnostics with a measured blocked-pursuit optimization. Implementation is merged; human playtests and balance decisions remain ongoing. Balance values remain unchanged. See [final playtest results and recommendations](docs/enemy-tactics-playtest.md). See [the story review guide](docs/enemy-tactics-review.md). The readiness cleanup above is merged; its turn and protected-arrival contracts are reused.

| Order | Story | Outcome |
| --- | --- | --- |
| 1 | [#147](https://github.com/danielgebhardt/larn-remake/issues/147) | Monster-owned intent and versioned v1 save migration, using the prepared committed-turn owner. |
| 2 | [#148](https://github.com/danielgebhardt/larn-remake/issues/148) | Goblin archer: adjacent melee, clear shots at distance 2–4, otherwise pursuit. |
| 3 | [#149](https://github.com/danielgebhardt/larn-remake/issues/149) | Brute: prepare at the current player tile, then resolve after one committed response action. |
| 4 | [#150](https://github.com/danielgebhardt/larn-remake/issues/150) | Distinct visuals, visible fixed-tile threats, accessible activity and Help. |
| 5 | [#151](https://github.com/danielgebhardt/larn-remake/issues/151) | Seeded floor-appropriate mixtures within current caps and safe-spawn rules. |
| 6 | [#152](https://github.com/danielgebhardt/larn-remake/issues/152) | Resume/replay, malformed intent, ended-run and complete-adventure regressions. |
| 7 | [#153](https://github.com/danielgebhardt/larn-remake/issues/153) | Matched diagnostics, human checkpoint and measured performance/balance review. |

Archers appear on floors 2–20, brutes on 4–20, each with relative spawn weight 1. The brute aims at a fixed tile, so moving away can avoid its prepared blow; it does not silently follow the player. Inactive floors pause intent, and save/load retains it. Actors still take at most one action per committed turn. Existing population caps and 30-turn mana recovery are retained. The recorded review recommends a separate decision on early level-cap pacing and redundant equipment after human play, rather than tuning several systems together. Creature projectile interception, retreat AI, generalized abilities, statuses, speed/initiative and respawns remain deferred.

## Local save/resume and persistence

Manual local-save epic #143 and stories #138–142 are merged into main. The dedicated Save/Load sheet provides one localStorage slot with explicit confirmation for both Save and Load, and file export/import without an extra confirmation. The versioned format stores full floor snapshots, played state, configuration/fog and discovery; loading validates before replacing progress, preserves deterministic continuation within the current rules, and retains dead/won status. No startup auto-load or autosave. See `docs/local-save-review.md` for commit order and maximum-size measurements.

Save format v2 adds monster intent; valid v1 snapshots migrate to idle actors without regenerating content. Future work, only when useful: multiple named slots, measured autosave, IndexedDB if synchronous writes become noticeable, and further explicit version migrations. Export/import already supports backups and manual cross-device transfer. Browser storage is tied to an origin/profile; seed-only reconstruction is not a substitute for played state. Keep storage separate from snapshot rules so a later adapter can reuse the format and validation.

Backend saves, accounts, authentication, sessions and automatic cross-device synchronization wait for a demonstrated need.

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

Cure-and-return, character progression, mana/spellcasting, and local save/resume are merged. Human playtesting may justify balance or exploration polish before the proposed enemy tactics and dungeon interactions.

## Expanded adventure milestone

The implementation on `codex/expanded-adventure` spans six epics, indexed in [the story plan](docs/expanded-adventure-plan.md). Recommended testing and balance configuration becomes **60×60×20**. Character cap becomes **20**, with intended late-adventure upper levels rather than reaching the cap halfway down. Establish progression early, then revisit the curve with the expanded creature catalog and matched seed evidence.

Ordered priorities: Settings keyboard-focus fix; welcome/start/resume; level progression; found books and twenty total spells with run-specific discovery; rings and useful equipment; twenty total creature kinds; doors, gold, chests, traps, fountains, thrones and shrines; resource/pacing review and complete adventure verification. Existing supports for other map sizes remain correctness requirements, not equal balance commitments. Town, manual attributes, complex initiative and crafting remain deferred. One commit per story on `codex/expanded-adventure`, completed stories In review pending developer acceptance.

The expanded milestone is now implemented for review, with a one-commit-per-story guide in [expanded adventure review notes](docs/expanded-adventure-review.md). It includes compatible save migrations through v10 and the playtest-polish stories: dedicated death dialog, below-half health tint, empty starting bag, spent-object descriptions, seven-column Character bag, five-tile camera margin, numbered object interaction and developer SVG catalog. Recovery remains every 30 turns after matched 20/30/50 comparisons; population remains capped at twelve. The review records long quiet stretches on large maps, so next gameplay tuning should consider travel, encounter strength, supplies and XP together. These are implemented branch changes awaiting developer acceptance, not a claim that main is already updated.

[Vercel/static frontend publishing #211](https://github.com/danielgebhardt/larn-remake/issues/211), [capable enemies opening doors #212](https://github.com/danielgebhardt/larn-remake/issues/212), and [difficulty controls #213](https://github.com/danielgebhardt/larn-remake/issues/213) remain backlog choices. The developer is investigating hosting; no deployment was performed. Future epics use native parent/sub-issues consistently.
