# Larn Remake roadmap

Updated October 13, 2026. This project reimagines Larn while providing a place to practice TDD and software design. The aim is an enjoyable, understandable dungeon crawler; original Larn is inspiration rather than a specification.

[Issue #38](https://github.com/danielgebhardt/larn-remake/issues/38) is the running index and discussion point. This file owns the detailed order; individual stories own acceptance criteria. Planning does not authorize implementation. Future epics use native GitHub parent/sub-issue links.

## Development approach

- The developer owns architecture, acceptance and release decisions. AI reviews, pairs or implements when explicitly asked.
- Usually work test-first, one failing behavior at a time. Keep tests readable, with at most one nested `describe`.
- Build small visible slices. Keep domain rules independent of React and avoid a generalized RPG engine before concrete behaviors require it.
- For delegated epics: a branch, one initial commit per story, and Backlog/Ready → In Progress → In Review → Done. Review adjustments may add follow-up commits. Implementation is not final acceptance.
- Follow [Definition of Done](docs/definition-of-done.md) and [AI working agreement](docs/ai-working-agreement.md). Verify actual layout, focus and scrolling in the browser.

## Current playable baseline

Already merged before this release branch:

- Seeded multi-floor terrain, linked stairs, collision, player-following scrolling, efficient large maps, fog and per-floor discovery memory.
- Welcome/start/resume, cure recovery and return victory, death dialog, turn resolution and activity history.
- Twenty floor-eligible creature kinds, melee/ranged/prepared attacks, announced threats and bounded conditions/defenses.
- Level-based Strength, Dexterity and Intelligence, a level-20 cap, reproducible hit/miss and damage, armor and mana.
- Twenty spells in the catalog. Magic Missile and Heal start known; other knowledge comes from seeded, depth-eligible spellbooks. A run does not guarantee every spell.
- Main hand, off hand, head, chest and two rings; derived equipment bonuses and comparison feedback.
- Found/dropped loot, healing/mana/antidote supplies, gold, doors, finite chests, visible traps, fountains, thrones and shrines.
- Character/Spells tabs, Settings, Help, developer catalog tabs, keyboard pickup/object choices and potion shortcuts.
- Confirmed localStorage Save/Load plus validated file export/import. Actual played floors and state are saved; backend/accounts are not required to play.

The reference adventure is **60×60 tiles, 20 floors**. Supported sizes remain **10–100 rows/columns and 5–20 floors**; support does not promise equal balance for every size. Mana recovers **1 point every 30 committed turns**. Normal monster populations remain capped at twelve per floor. These are current rules, not commitments against later tuning.

## Published alpha: inventory, exploration and interface polish

Merged, tagged and published by the developer before this program. These are the established alpha contents, not future tasks:

| Stories | Outcome |
| --- | --- |
| #217 | Identical potion kinds occupy one bag slot; 27 slots with nine columns on desktop. Drinking/dropping still affects one bottle. |
| #218 | Upstairs vary by seeded room and tile, with reciprocal arrivals. |
| #219–220 | Named hotbar slots, compact spell cards, shared instructions and colored Assigned controls. |
| #221–222 | Distinct potion shapes/colors and counted visible loot piles. |
| #223–225 | Six spell shortcuts on 5–9/0, four potion shortcuts on 1–4, default visibility radius 8 and automatic equipment pickup into empty compatible slots. |
| #227–229 | Quieter map focus, seeded layout diagnostics and bounded short corridor loops for alternate routes. |
| #230–231 | Resource panel on the left, hotbars on the right, stable low-health color cues, consistent dark hotbar boxes and wider two-column Settings. |

Epics [#216](https://github.com/danielgebhardt/larn-remake/issues/216) and [#226](https://github.com/danielgebhardt/larn-remake/issues/226). Review guides: [inventory polish](docs/alpha-polish-review.md), [exploration/status polish](docs/release-polish-review.md). Release text: [next alpha notes](docs/alpha-release-notes.md).

The published alpha used **v12**: old valid saves migrate, retaining their items and four assigned spell slots with two empty slots added. Played saves retain their terrain/stairs. New or replayed runs can have changed geometry and upstairs placement, even with a historical seed; seed equality is not a cross-release layout guarantee.

Matched layout measurements on five seeds at 60×60×20 (100 floors) show mean bottleneck tiles falling from **181.46 to 119.00**, and entry-to-downstairs distance from **66.18 to 62.58**. No unreachable tiles were found; a separate sixty-floor 100×100 batch also stayed connected. These measure topology, not human run duration or combat difficulty. The final gameplay commit passes **1,839 tests**, Biome, TypeScript and the frontend production build.

## Current program: five epics ready for review

Implemented locally on `codex/pursuit-escape-and-merchants`, with **28 story commits**. Stories and native parent epics are **In Review**; acceptance, push/merge and release remain developer-owned. No deployment is part of this work. Review logic, tests and diagnostic limits in [the program review guide](docs/pursuit-escape-merchant-review.md).

| Epic / stories | Implemented outcome |
| --- | --- |
| [#232](https://github.com/danielgebhardt/larn-remake/issues/232), #233–237 | Remembered last-seen positions, bounded pursuit/search, visible cues and saved continuation. |
| [#238](https://github.com/danielgebhardt/larn-remake/issues/238), #239–244 | Explicit hunted return, one finite seeded wave per return floor, stronger bounded pursuit and progress/diagnostics. |
| [#245](https://github.com/danielgebhardt/larn-remake/issues/245), #246–251 | Telegraphed chargers, interruptible one-shot alarm sentries, nearby alerts and optional skull-gated champions/rewards. |
| [#256](https://github.com/danielgebhardt/larn-remake/issues/256), #257–264 | Shared finite potion merchant on floors 5/10/15 below the goal, keyboard Buy/Sell, deliberate prices and saved ownership. |
| [#252](https://github.com/danielgebhardt/larn-remake/issues/252), #253–255 | Capacity-scaled finite fountains, temporary attribute potions and guaranteed per-item enchantment capped at +3. |

Current branch save format is **v18**. Valid older saves migrate without regenerating played terrain/actors/loot; old merchant-free formats initialize reachable stalls/stock once. Current saves retain pursuit, alarms, escape activation, stock and actual enchantments. The reference remains 60×60×20 with level cap 20 and mana recovery every 30 turns. Ordinary population remains twelve per floor; return waves cap total living actors at sixteen. Human difficulty/pacing still needs playtesting.

The six-seed generated merchant budget found 776–841 ordinary gold by floor 5 and 8,371–8,576 across 20 floors if everything is collected, versus 14,000 for full stock. Controlled return and budget diagnostics are not human win-rate evidence. Review chargers/alarms, optional challenges, supply spending and return pressure before another broad balance change.

## Pacing and tactical clarity ready for review

Implemented locally on `codex/pacing-and-tactical-clarity`, based on the preceding five-epic branch, with eight initial story commits and a separate post-review fix commit. Both native parent epics and all eight stories are **In Review**. Acceptance, merge and publishing remain developer-owned.

| Epic | Stories / outcome |
| --- | --- |
| [#265](https://github.com/danielgebhardt/larn-remake/issues/265), Pacing and meaningful rewards | #266 per-visit pacing reports; #267 depth-sensitive ordinary equipment weights; #268 supply budgets; #269 twenty-floor XP audit. Supply probabilities and XP thresholds were retained based on available evidence. |
| [#270](https://github.com/danielgebhardt/larn-remake/issues/270), Tactical clarity and counterplay | #271 visible threat/condition counterplay; #272 recent damage defeat recap; #273 spell elements/duration/target-adjusted damage; existing #212 intelligent enemies opening ordinary doors for one action. |

Current branch save format is **v19**: validated enemy door-opening history is added, while all v18 played state and enchantments migrate intact. Orcs, cultists and necromancers can open ordinary doors during remembered pursuit; elite gates remain player-only. Loaded items remain authoritative; only new/replayed loot selection changes.

[Story review guide](docs/pacing-tactics-review.md) contains logic and six-seed evidence. [Post-epic codebase review](docs/codebase-review-2026-10-13.md) records immediate fixes to diagnostic stacking/capacity, elite routing, current resource estimates and stale Help, with structural recommendations left for developer review. Scripted policies remain limited; human playtesting is still the next balance gate.

## Recommended next work

These are proposals, not authorization or newly created issues. Review the current program and playtest before another feature batch.

| Order | Story / epic | Why |
| --- | --- | --- |
| 1 | Human pacing and counterplay feedback | Compare a few recommended 60×60×20 runs against per-floor reports. Note supplies actually available at fights, optional challenges, level growth, merchant spending and return pressure. Generated supply/XP potential cannot replace human decisions. |
| 2 | A bounded engineering cleanup | Review the proposed adventure-session extraction, save-validation organization and CI/browser smoke checks before implementation. Preserve state/focus ownership and historical save fixtures. |
| 3 | New-run difficulty presets (#213) | Offer bounded easier/normal/harder enemy health/damage scaling only after normal has a human baseline. Freeze the choice in saves; avoid simultaneously scaling XP, density or loot. |
| 4 | Interruptible safe travel | One corridor-run command before automatic exploration. Stop at threats, junctions, doors, stairs, items and discoveries; every tile remains a committed turn. Define interruption rules first. |
| 5 | Extend the gold economy into town services | Reuse tested merchant transactions at the entrance, or add one healing service after supply/pricing feedback. Avoid banks/taxes or a broad economy until needed. |
| 6 | Starting classes | Different starting attributes and automatic growth, with existing equipment/effect ownership. Defer manual stat allocation and large skill trees. |

Further loot/supply/XP tuning should be separate evidence-backed slices, not a simultaneous formula overhaul. More enemy/spell content can follow feedback showing which choices are missing.

### Alpha feedback gate

Release this branch first and gather a small set of feedback before more content work. Keep seed, dimensions, depth, release version and a save near the reported problem. Include several 60×60×20 runs, a shorter 15×15×5 correctness/survival check, and maximum-map performance checks when relevant. Human play remains essential: diagnostics know routes and follow a limited policy, so their win rate is not a player difficulty rating.

Look specifically for bag frustration after stacking, usefulness of deep-floor loot, spell choice, ranged-threat readability, floor-by-floor level growth and quiet travel. Fix reproducible input/save/combat bugs before balance proposals. Tune one system at a time and retain before/after seed comparisons.

## Engineering and sharing alongside playtesting

- **Frontend publishing #211:** share a static build when deployment is explicitly authorized; the backend check is already disabled. Confirm actual hosting configuration/limits at implementation time. Browser saves belong to an origin/profile; export/import is the existing transfer mechanism. No accounts or Java deployment are needed for this alpha.
- **CI:** before the next large feature batch, consider PR/main checks for frontend Biome, tests, build/typecheck and Gradle backend tests, using declared tool versions. This supports releases without changing game rules.
- **Small browser smoke suite:** welcome/start, Settings focus restoration, hotbar/pickup, save/load and one death/victory flow. Prefer stable controlled fixtures over a screenshot matrix or duplicating all domain tests.
- **Performance:** retain large-map movement regressions. Measure startup before further lazy loading; the approximately 600kB main chunk currently produces a non-blocking build warning. Measure pursuit, targeting and saves if new behavior makes them slow.
- **Persistence:** version changed saved contracts and retain captured legacy fixtures. Named save slots can follow demonstrated demand; autosave/IndexedDB should follow measured need, not replace working manual saves by default.

## Later gameplay directions

After the pacing/tactical milestones:

1. Starting classes with different initial attributes and automatic growth, rather than manual point allocation. Keep base growth separate from equipment/permanent effects.
2. Town services and a modest gold economy, expanded only after the first service proves useful.
3. More varied special rooms/discoveries that create visible decisions, not merely longer catalogs.
4. Selective gear/stat effects, two-handed weapons or extra equipment slots when concrete content warrants their ownership and UI rules.
5. Eight-direction movement only with explicit player/enemy adjacency, corner-cutting, pathfinding, vision and targeting rules.
6. Quest time pressure or resting tradeoffs only after normal resource pacing is enjoyable and clearly explained.

Use [Larn's monsters](https://larn.fandom.com/wiki/Monsters), [spells](https://larn.fandom.com/wiki/Spells) and [dungeon objects](https://larn.fandom.com/wiki/Dungeon_Objects) as optional design references. These links are inspiration; this update does not introduce or verify new original-game rules.

## Explicitly deferred

- Inventory weight, item footprints/rotation, drag-and-drop and mandatory management friction. Potion stacking and 27 slots are deliberate quality-of-life choices.
- Crafting, large affix/rarity systems, unidentified/harmful consumables and a complete tabletop combat ruleset.
- Manual stat distribution, large skill trees, classes and a broad modifier engine introduced together.
- Respawning, reinforcement schedules, complex speed/initiative, summons and sophisticated AI without a concrete tactical need.
- Multiplayer, backend saves, accounts and automatic cloud synchronization.
- Banks, interest, taxes and a large town before one useful service exists.
- Equal balance guarantees across every supported size or exhaustive device/browser testing.

## Completed milestone history

| Milestone | Reference |
| --- | --- |
| Floor-aware content and armor #90; randomized combat #99 | [Content/combat review](docs/content-combat-review.md) |
| Cure-and-return adventure #109 | [Adventure review](docs/adventure-review.md) |
| Progression #116 | [Progression review](docs/progression-review.md) |
| Mana and casting #127 | [Mana review](docs/mana-review.md) |
| Local saves #143 | [Save review](docs/local-save-review.md) |
| Domain/action/save readiness cleanup | [Codebase review](docs/codebase-review-2026-10-11.md) |
| Distinct enemy tactics #146 | [Tactics review](docs/enemy-tactics-review.md), [diagnostics](docs/enemy-tactics-playtest.md) |
| Expanded adventure #154/#159/#170/#176/#185/#194 and prior UI polish | [Story plan](docs/expanded-adventure-plan.md), [implementation review](docs/expanded-adventure-review.md) |
| Current alpha polish #216/#226 | [Inventory review](docs/alpha-polish-review.md), [exploration/status review](docs/release-polish-review.md) |

Completed milestone details live in these review guides and GitHub stories. They should not reappear as outstanding roadmap work.

## Engineering follow-up from October 13 review

Epic [#274](https://github.com/danielgebhardt/larn-remake/issues/274) contains session ownership #275 and save-validation ownership #276. Review notes: [session/save maintainability](docs/session-save-maintainability-review.md).

Backlog: declared-toolchain CI and browser smoke coverage [#277](https://github.com/danielgebhardt/larn-remake/issues/277), measured startup/dialog splitting [#278](https://github.com/danielgebhardt/larn-remake/issues/278), and fixed Small/Medium/Large start-dialog choices [#279](https://github.com/danielgebhardt/larn-remake/issues/279) after or alongside difficulty #213. Size and difficulty should remain separate choices; confirm the three dimensions during that work.
