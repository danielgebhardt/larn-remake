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

## Recommended next ten stories

These are planning proposals, not newly created issues or implementation authorization. Use playtest findings to refine their scope before creating native epic/sub-issues. Existing issue numbers are included where work is already tracked.

| Order | Story | Why / completion evidence |
| --- | --- | --- |
| 1 | Record a per-floor alpha pacing baseline | Capture representative human runs and matched seeded diagnostics after stacking and loops. Record turns, fights, useful upgrades, supplies, level, deaths and arrival/exit health/mana per floor. Distinguish exploration, combat and return travel where possible. Establish what is actually slow or easy before changing formulas. |
| 2 | Reduce obsolete ordinary gear by depth | Make deep-floor finds less repetitive while preserving useful equipment tradeoffs and occasional alternatives. Compare catalog eligibility/weights and useful-upgrade counts; never guarantee a best item for every seed or remove meaningful ring choices. |
| 3 | Tune healing, mana and antidote supply budgets | Stacking removes inventory friction but can change practical hoarding. Measure use and remaining supplies, then adjust source probabilities or quantities in an isolated slice. Keep recovery at 30 unless evidence justifies a separate change. Avoid silently changing enemies, loot and regeneration together. |
| 4 | Review XP pacing through twenty floors | Use the new population and travel baseline to check when levels are earned. Target late-adventure upper levels rather than cap by mid-run. Change thresholds or rewards with clear evidence, keeping automatic stat growth and earned equipment bonuses intact. |
| 5 | Add new-run difficulty presets (#213) | After normal has a documented baseline, offer bounded easier/normal/harder enemy health/damage scaling. Freeze difficulty per run, preserve it in saves, migrate old saves to normal and show actual scaled values. Do not also scale XP, loot or density implicitly. |
| 6 | Improve threat and defeat explanations | Make ranged/prepared attack sources and active harmful conditions easy to identify. Add a concise defeat recap showing recent damage sources without another blocking warning during play. Preserve fog privacy and use existing activity emphasis before adding new panels. |
| 7 | Clarify situational spell choices | Show range, relevant conditions/defenses and duration clearly enough to choose between owned spells. Compare mana efficiency and control value in real encounters; fix unclear descriptions before adding another large spell catalog. Reject/cancel actions remain free. |
| 8 | Let selected enemies open doors (#212) | Give explicitly capable creatures a one-action door opening with visible feedback and deterministic ordering. Ordinary creatures remain blocked. Preserve the value of closing doors, protected arrivals and saved door state. |
| 9 | Reduce repetitive safe travel | If quiet walking remains the main complaint after loops, try one interruptible corridor-run command before automatic exploration/pathfinding. Stop at threats, junctions, doors, stairs, items or discoveries; every traveled tile remains a committed turn. Establish exact interruption and keyboard rules first. |
| 10 | Extend the first gold economy into town services | The wandering merchant now supplies the first use for gold. After playtesting prices and finite stock, consider moving/reusing those transactions at the entrance or adding one healing service. Avoid banks/taxes or a broad economy until needed. |

The first four form a **pacing and rewards** epic. Difficulty is a separate follow-up so comparisons remain interpretable. Threat/spell clarity and capable-door behavior form a **tactical readability** epic. Travel assistance and town services deserve separate epics because they change the exploration loop. Do not require completing all ten before another alpha.

### Alpha feedback gate

Release this branch first and gather a small set of feedback before more content work. Keep seed, dimensions, depth, release version and a save near the reported problem. Include several 60×60×20 runs, a shorter 15×15×5 correctness/survival check, and maximum-map performance checks when relevant. Human play remains essential: diagnostics know routes and follow a limited policy, so their win rate is not a player difficulty rating.

Look specifically for bag frustration after stacking, usefulness of deep-floor loot, spell choice, ranged-threat readability, floor-by-floor level growth and quiet travel. Fix reproducible input/save/combat bugs before balance proposals. Tune one system at a time and retain before/after seed comparisons.

## Engineering and sharing alongside playtesting

- **Frontend publishing #211:** share a static build when deployment is explicitly authorized; the backend check is already disabled. Confirm actual hosting configuration/limits at implementation time. Browser saves belong to an origin/profile; export/import is the existing transfer mechanism. No accounts or Java deployment are needed for this alpha.
- **CI:** before the next large feature batch, consider PR/main checks for frontend Biome, tests, build/typecheck and Gradle backend tests, using declared tool versions. This supports releases without changing game rules.
- **Small browser smoke suite:** welcome/start, Settings focus restoration, hotbar/pickup, save/load and one death/victory flow. Prefer stable controlled fixtures over a screenshot matrix or duplicating all domain tests.
- **Performance:** retain large-map movement regressions. Measure startup before further lazy loading; the approximately 554kB main chunk currently produces a non-blocking build warning. Measure pursuit, targeting and saves if new behavior makes them slow.
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
