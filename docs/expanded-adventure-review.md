# Expanded adventure implementation review

Branch: `codex/expanded-adventure`. Six epics expand startup, spell acquisition, equipment, creatures, discoveries and deep-run progression. Recommended balance configuration: 60×60×20; other valid sizes retain correctness support. One commit per story, with developer acceptance pending.

## #155 — Settings keyboard focus

Applying a valid configuration with Enter, or dismissing Settings, now returns focus to the map after its close transition. Existing Settings focus assertions now expect the map rather than the toolbar trigger. Failed validation keeps the sheet and focused editor intact. Toolbar controls now retain movement keys as well as action shortcuts, removing the previous inconsistent partial-gameplay behavior.

Ten new regression cases first reproduced the missing map focus and movement through a focused button, then passed. Browser checkpoint: changed Rows to 20, pressed Enter, observed Dungeon map focus and immediate G feedback without clicking the map. Existing save/load focus behavior is retained.

## #156 — Adventure introduction

App now owns the not-started state. The opening dialog tells the cure-and-return story; Home is not mounted, terrain is not generated and gameplay cannot consume turns before Begin. Begin selects a full-range random seed, mounts Home and focuses the map. Keeping the opening outside GameState avoids inventing an unplayed placeholder save. Domain/page tests can still mount Home directly with controlled runs.

Two behavior tests first failed against the old startup, then passed. Browser inspected the opening layout and verified Begin arrives on floor one, turn zero, with map focus. Six epics and 41 scoped stories (the approved 40 plus the initial focus bug) are recorded in GitHub and the local plan. Level progression is scheduled before spell/content expansion.

## #157 — Start or resume

The opening offers the existing Save/Load sheet. Saving/exporting are disabled without an active adventure, while confirmed local loading and validated file import remain available. Successful restoration mounts Home from the restored aggregate, configuration and discovery instead of generating terrain. Cancellation and corrupt saves leave the opening and local slot untouched.

Three regression tests first failed without startup Save/Load, then passed. Browser resumed the existing seed-zero save at turn one with Dungeon map focus; the stored slot was not changed. Shared controls retain active-adventure confirmation behavior and now describe startup loading accurately.

## #158 — Recommended adventure and stable regression fixtures

Begin/new adventures now default to 60×60×20; the opening states that recommendation and Settings retains the full supported ranges. Loaded configuration remains authoritative for subsequent restarts. Focused page/domain fixtures explicitly choose 15×15×5 through TestHome/TestRunConfiguration rather than inheriting product defaults; this preserves short interaction tests and historical seeded scenarios without weakening dedicated recommended-run coverage.

Two recommended-configuration tests first failed, then passed. Browser created 3,600 displayed cells on Floor 1 of 20, focused Dungeon map and showed 60 rows × 60 columns · 20 floors in Settings. The existing startup, replay and resume tests cover no background turns and configuration ownership. Creature density, generation geometry and mana recovery are unchanged here.

## #195 — Extended progression, established before deep content

Character cap is 20. Cumulative milestones through five remain 0/10/30/60/100 XP. Above five, threshold(n) = 100 + 10 × (n × (n − 1) − 20): level 6 at 200, 10 at 800, 15 at 2,000 and 20 at 3,700. Existing automatic Strength/Dexterity/Intelligence and +2-health growth extend through the cap. No stat allocation or free refill was introduced.

Save format v3 explicitly marks the changed progression rules. Structurally valid v1/v2 snapshots are checked under their original cap-five capacity rules before migration; XP is retained, newly earned capacity preserves missing health/mana, and dead players remain dead. Prepared targets and floor snapshots are retained. A subsequent v3 round trip does not apply growth twice. Historical activity remains historical; completed summary health/level follow the migrated character.

Five matched tactical-aware seeds (0–4, 60×60×20, budget 50,000) all won both before and after. Old runs capped at five on floor three. Extended-curve runs finished at levels 13/13/13/13/14, with XP 1,598/1,622/1,645/1,625/1,745; turns were 11,162/11,268/11,256/11,117/12,024. This is a provisional curve, not final balance or human win rates. Deeper enemy rewards will increase total available XP; final pacing review must measure cap floor after expanded content exists.

## #160 — First found spellbook

Ember Bolt is learned by picking up its named book as a normal turn. Reading consumes the floor copy, never enters the bag, works at full capacity, and leaves duplicate/distant attempts unchanged and free. Its initial profile is guaranteed damage 3–7 plus Intelligence, cost 4, range 4: shorter and more expensive than Magic Missile, with a stronger upper bound. The book initially participates in early found loot; independent per-run book selection follows in #161.

Pickup choices describe the book before reading. G announces learning, and knowledge immediately appears in the existing hotbar and Spells tab. The current save aggregate already owns knowledge; round-trip tests retain the learned spell and consumed book, and semantic validation rejects books carried in the bag. Three domain tests first failed, then passed; a page regression covers G/library feedback. A controlled imported browser fixture verified reading and the spell's visible cost/range/damage details.

## #161 — Independent run-specific spell discovery

Books no longer compete with potion/equipment loot or repeat through ordinary drops. Each seed chooses 5–10 distinct eligible book kinds, clamped to the currently implemented pool; at this checkpoint only Ember Bolt is implemented, so one book is selected. Adding later functional book definitions automatically expands this pool. Each selected kind independently chooses a floor within its inclusive band and a safe unoccupied room tile. No suitable tile means no unsafe placement. Book selection/floor/tile seeds are independent of ordinary loot and monster streams.

Ordinary loot and books reuse one safe-location helper, preserving room iteration and normal placement order. The cure retains placement priority; books see ordinary loot and the cure and avoid both. Focused page fixtures explicitly stub book generation alongside ordinary loot. Deterministic generation tests cover floor ranges, uniqueness, occupied/protected tiles, short runs and unchanged ordinary generation; the first recommended-run test failed before independent placement. This story establishes selection rules, not a claim that the twenty-spell catalog is already complete.

## #162 — Compact spell shortcuts and library assignments

Four spell slots use 5–8 beside potion keys 1–4. Z still targets Magic Missile; H still self-casts Heal. Character → Spells assigns/moves/clears slots for free, prevents duplicate assignments and leaves casting paused while browsing. Newly learned spells fill the first empty slot; a full bar retains its existing choices. Empty slots are visibly numbered without extra interactive buttons. Knowledge remains independent of assignment.

Save format v4 stores the four slots, validates their length/kinds/uniqueness/knowledge and migrates older knowledge to initial slots. Three domain cases first failed before implementation, then passed, with malformed-save and page keyboard regressions. Browser imported a v3 encounter, learned Ember Bolt, assigned it to key 8 without advancing turn one, and activated it after closing Character. Target absence produced ordinary feedback without spending mana/turns.

## #163 — Frost Bolt and committed-phase condition timing

Frost Bolt costs 4 mana, reaches Manhattan range 5, deals 2–4 plus Intelligence and slows a surviving target. Three active phases include the cast response: skip, act, skip, then expire. Refresh replaces the old duration, never stacks. Failed/free actions do not tick; stairs advance only destination-floor effects; inactive effects pause. Dead actors lose their conditions. PlayerActions remains the single committed-turn owner and ticks conditions after the monster phase.

The book appears on floors 2–8 through independent selection. Remaining conditions appear above the map only for currently visible living monsters, avoiding hidden actor disclosure and extra map-row props. Save format v5 retains actor-owned condition kind/floor/duration, validates actual living owners and uniqueness, and migrates old formats with an empty list. Domain timing/refresh/pause/resume tests first failed, then passed; malformed durations/owners/kinds and a keyboard-cast page scenario are covered. Browser imported a controlled encounter, learned with G and cast via 7/Enter, showing the orc slowed with two phases remaining. The earlier-loot regression explicitly excludes independently selected books: total adventure depth can change their selected eligible pool or floor; ordinary loot and monsters retain the extension guarantee.

## #164 — Four additional damage spells

Shock (5 mana, range 5, 5–8 base damage), Stone Lance (6, range 7, 6–10), Sonic Spear (8, range 8, 8–13) and Drain Life (6, range 2, 4–8) reuse the guaranteed-hit, independently keyed damage and ordinary turn contract. Intelligence adds once. Their books appear in respective bands 3–9, 5–12, 10–20 and 7–15, with no level-based learning. Six discoverable book kinds now permit full-depth seeds to omit a kind when five are selected.

Drain Life heals only actual target health removed, capped by missing health; overkill cannot create extra healing. Healing follows damage/kill growth and precedes surviving-enemy retaliation. Costs and ranges remain tradeoffs rather than duplicating Magic Missile with new names. Book icons share the catalog's book classification, avoiding a repeated per-book visual mapping. Five initial cases failed before definitions/effects; added coverage checks overkill, health cap and retaliation order.

## #165 — Three distinct control spells

Web (3 mana/range 4, books 2–9) prevents movement for three phases but leaves adjacent/ranged attacks available. Sleep (5/range 4, books 3–11) skips actions, expires naturally, and any landed damage wakes the target before its response. Fear (4/range 5, books 4–14) uses one legal cardinal retreat per phase instead of attacking; blocked retreat still spends the actor's action. Sleep/Fear immediately cancel old prepared strikes. Control casts spend one normal turn, require known/affordable/valid targets, and do not add damage rolls.

Retreat shares the established cardinal tie order and avoids allies, player, walls, stairs and arrivals. Existing timed-effect persistence/refresh/pause rules apply; current catalog recognizes each supported condition and the visible strip/library explains it. Four behavior tests first failed, then passed; expiry and stair protection were added. Eleven total spells are now implemented, with nine discoverable kinds in depth bands.

## #166 — Poison Dart and Renewal

Poison Dart (4 mana/range 5, books 4–13) deals 1–2 plus Intelligence initially, then 2 poison damage after monster actions for three active phases. Its eventual kill reuses ordinary XP/drop/death ownership exactly once. Renewal (5 mana, books 3–12) self-casts and restores up to 2 health after retaliation for four committed turns. It can be prepared at full health, refreshes without stacking, follows the player across floors and never revives a fatal hit.

Ticks use stable actor order after retaliation; inactive monster effects pause, player effects are global with no floor owner. Existing format v5 validation now recognizes these functional kinds and rejects invalid ownership. The visible strip separates your conditions from visible monster conditions. Three tests first failed, then passed, covering tick/kill ownership, fatal retaliation, expiry and cross-floor saved continuation. Browser learned Renewal with G, self-cast via key 7 and showed the ordered cast → orc hit → bounded healing log plus three remaining phases. Thirteen total spells are implemented.

## #167 — Temporary Protection, Strength and Dexterity

Protection adds 2 armor (3 mana, books 3–12); Strength and Dexterity each add 2 to the corresponding attribute (4 mana, books 5–15). Six committed phases include the casting response. Refreshing replaces the duration instead of stacking. These global player effects expire on turn boundaries and persist through saves without altering earned XP, level, health or mana capacity.

Combat and the Character displays derive the same effective attributes: Strength changes melee damage, Dexterity changes real hit/evasion thresholds within existing clamps, and Protection reduces incoming damage while retaining the minimum of one. A small pure bonus helper avoids a dependency cycle through condition damage and progression. Five behavior cases failed first, then passed; saved continuation and effective stat display are also covered. Sixteen total functional spells are now implemented.

## #168 — Blink and Teleport Away

Blink self-casts for 4 mana to a seeded safe tile within range 3; Teleport Away costs 6 mana and sends a target within range 5 to a safe tile farther from the player on the same floor. Both exclude occupied tiles, stairs, arrivals and the entrance. Empty candidate sets fail without a turn or mana cost. Destinations use an independent seed/turn/spell/actor stream and stable terrain traversal. Blink announces items under the landing tile; it cannot accidentally transition floors or deliver the cure.

Teleport preserves identity, health and conditions and cancels prepared attacks. Its log says the monster moved without revealing hidden coordinates. Books occupy respective floor bands 4–14 and 6–18. Three initial behavior tests failed, then passed; actor avoidance and landing item feedback are covered too. Eighteen functional spells now exist.

## #169 — Fireball, Frost Nova and the twenty-spell catalog

Fireball costs 8 mana, targets at range 6 and damages enemies in a wall-aware Manhattan radius 1 (6–10 plus Intelligence). Frost Nova costs 8 mana, self-centers at radius 2, deals 3–5 plus Intelligence and slows survivors. Both exclude friendly fire, hold potency fixed before kill-driven level gains, process stable actor IDs, reuse individual kill rewards and consume only one cost/turn/monster phase. An empty Nova is free. Books appear on floors 9–20 and 8–20 respectively.

The preview and resolver share one footprint function. Targeted Fireball outlines only currently visible affected tiles, clearing when targeting ends; it adds no preview computation during ordinary movement. Existing row memoization compares affected columns. The twenty functional definitions include eighteen discoverable books, with 5–10 selected per full-depth seed. Tests first failed for area behavior and map preview, then passed, including walls, fog, order and multi-kill ownership. Browser imported a valid controlled encounter, learned Fireball with G, displayed five preview cells with key 7, and Enter spent one turn for damage plus normal retaliation.

## #171 — Two independently owned ring slots

Left and right ring slots use the existing equip/swap/unequip turn actions. A shared fitting rule permits a ring in either slot while keeping weapons and armor in their own slots. The dialog shows both slots and two explicit equip choices. Swapping exchanges items in place even with a full bag; unequipping requires room. The same physical item cannot occupy two slots or also remain in the bag. A plain copper ring exercises the ownership framework; magical bonuses follow in #172.

Save format v6 explicitly persists both slots. The v1–v5 equipment contract is frozen to its four original slots, and migration initializes empty rings without changing played gear. New tests failed before implementation and cover both slots, full-bag swap/rejection, wrong slots, duplicate identities, normal turn charging, old-save migration and saved ring continuation. Browser imported a v5 encounter with a carried ring, selected it by keyboard and equipped the right ring, showing one committed turn and the expected activity message.

## #172 — Rings that alter effective attributes and capacity

Strength/Dexterity rings add 2 to their attribute (floors 4–15), Intelligence adds 2 (6–20), and Vitality/Mana add 4 capacity (5–20). The introductory copper ring now contributes 1 armor, making its loot useful. Both physical rings contribute; item identity remains authoritative. A pure equipment bonus calculation feeds effective attributes, melee accuracy/damage, spell potency, capacities and all corresponding UI surfaces. Earned XP and automatic growth stay unchanged.

Equipping capacity never heals or refills mana. Removing/swapping clamps current resources to the reduced capacity. Ordinary level-up growth remains additive; potion/recovery caps use the loadout. Version 6 already stores ring identity, so current validation derives capacities from that gear and old versions retain their original rules. Seven domain cases cover actual retaliation, shared potency/capacity, swap safety, recovery and saved continuation without double application. A details test ensures stat rings describe their actual bonus. Browser equipped Intelligence: Intelligence 12, mana 10/12, one normal turn. Multi-stat bag comparisons follow in #175 rather than claiming every ring is an armor upgrade.

## #173 — Deeper melee weapon tiers

Steel sword (+3 attack, floors 4–10), battle axe (+4, 8–15), runeblade (+6, 12–20) and star-forged blade (+8, 16–20) join found and dropped loot. All remain main-hand melee weapons; no ranged weapon mechanics are implied. They reuse item identity, bag swaps, turn charging, saved catalog validation and existing seeded melee rolls. Sword/axe variants make the icons readable without changing map tile size.

Eight behavior cases failed before adding the catalog: both loot sources honor inclusive depth bands, equipping replaces the starting sword for one turn, and the next real bump attack uses the new damage. These are initial equipment values, with obsolete early-loot eligibility and final deep-run balance handled by later stories.

## #174 — Deeper armor and a caster tradeoff

Iron/tower shields give 2/3 armor (floors 4–11/10–20); plate/dragon chest armor and steel/runic helmets give 3/4 (8–16/14–20). Found/drop bands remain inclusive. Distinct shield, layered armor and crown icons reuse the existing item color family. Scholar robe (floors 7–16) gives only 1 armor but +2 Intelligence, exercising a meaningful equipment tradeoff through the shared derived-stat path.

Seven tests failed before content addition, then passed: eligible sources/depth bands, the correct equipped slot, turn charging, total armor/incoming mitigation, and robe Intelligence. Item details show non-ring attribute bonuses as well as armor. Browser equipped battle axe (Attack 4–6) and scholar robe (Armor 2, Intelligence 12), each advancing one turn. #175 expands the comparison beyond the still-simple armor-only badge.

## #175 — Honest equipment comparisons and fewer obsolete deep drops

Comparisons include relevant armor, attack/Strength, Dexterity, Intelligence and health/mana capacity contributions. Mixed gains/losses use a neutral blue “Tradeoff” badge with every value explained, rather than reducing a caster robe to an armor downgrade. Ring details show left and right separately; the bag badge chooses the most useful compatible slot and names it. Comparison never equips or mutates gear.

Basic weapons/shields/leather gear stop appearing by floors 4–8, while chain armor and iron helmets stop at 12. Existing carried/saved equipment remains valid. At floor 20 the base found pool previously included 15 obsolete weight out of 33 (45.5%); the base drop pool included 14 out of 32 (43.8%), before individual monster preferences. Both now contain ten useful kinds with total weight 18 and zero obsolete basics. Supplies keep full-depth eligibility. These are catalog-weight calculations, not sampled player outcomes.

Four domain cases initially failed where behavior was absent, then passed; two display cases verify the robe’s losses/gains and separate ring slots. Existing simple comparison assertions retain their behavior without freezing the new explanatory rows. Browser showed the robe’s −2 armor, +2 Intelligence and +2 mana capacity as a Tradeoff while inspection stayed on turn zero.

## #177 — Five early creatures and supported roles

Skeleton (floors 2–8, 8 HP/4 attack), zombie (3–10, 12/5), wolf (2–9, 9/4), kobold slinger (3–10, 7/3) and giant spider (3–12, 8/3) bring the catalog to ten kinds. Zombies act every other committed phase; wolves detect farther; slingers reuse wall-aware ranged attacks at range 4. Spider poison follows in #178. Names, HP, rewards, weights and inclusive bands live in the catalog; MonsterKind derives from its keys rather than a second hand-maintained identity list.

Seven new cases cover floor bounds, zombie cadence, a real slinger shot, and twenty deterministic compact seed mixtures with protected stairs/starts. All five appeared in that fixed seed range. Custom eight-legged spider and face/slingshot vectors distinguish the new actors, with a neutral undead color and existing monster colors separate from gold equipment. Browser imported a controlled encounter and displayed all five icons/names. Identically shaped hit/miss activity variants share payload branches, avoiding TypeScript union expansion failure as the catalog grows while preserving saved event data. Old catalog tests retain boundary behavior without freezing five-kind percentile offsets.

## #178 — Visible, bounded spider poison

A landed spider attack refreshes one global player poison timer for three committed phases, including this turn. It deals 1 damage after retaliation; monster Poison Dart remains 2 damage under the same named condition. Misses and free blocked actions do not apply/tick it. Player poison follows floor transitions and saved continuation, while monster poison still pauses on inactive floors. No extra hit roll is introduced.

Poison is visibly red above the map, with a clear bite → poisoned → tick activity sequence and remaining duration. Fatal ticks append one death and prevent Renewal/recovery or later turns from reviving the player. Explicit player/monster condition allowlists now share poison without permitting self-only buffs on monsters. Four tests cover refresh, misses/free actions, expiry/floor changes, death ordering and save continuation without replaying the bite. Browser waited beside a spider and showed the three ordered events plus two remaining phases. Antidotes follow in #196.
