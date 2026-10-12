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
