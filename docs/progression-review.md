# Character progression review

Epic #116 is implemented in ordered slices on `codex/character-progression`, pending developer acceptance. See README for formulas. XP is authoritative; level and later automatic attributes are derived, independently of log retention and dungeon floor count.

## XP/health-only checkpoint (#120)

Rules: rat/goblin/orc rewards 2/5/10 XP; cumulative level thresholds 0/10/30/60/100; character cap 5; +2 maximum/current health per earned level, preserving missing health. At the cap, XP continues but health does not grow or regenerate. No damage/accuracy changes in this checkpoint.

Command: `pnpm --filter frontend exec node scripts/review-adventure.mjs`. Four default seeds use the existing omniscient walker: upgrade gear, heal at health 6 or lower, clear reachable content, recover the cure, and return. The fixed healing threshold is intentional for comparison; this policy is neither a human playtest nor an estimated human win rate. Optional `LARN_REVIEW_TRACE=1` includes the action trace.

| Seed | Outcome | Deepest | Turns | Level | XP | Health | Kills | Potions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Won | 5 | 171 | 3 | 58 | 7/14 | 12 | 4 |
| 1 | Died | 4 | 102 | 3 | 44 | 0/14 | 9 | 2 |
| 123 | Died | 4 | 105 | 3 | 46 | 0/14 | 11 | 0 |
| 987 | Won | 5 | 205 | 3 | 57 | 10/14 | 14 | 3 |

For seed 0, first arrival at floors 2/3/4/5 occurs at levels 1/2/2/3 with XP 4/13/23/33. On the return, XP remains 58 and no cleared-floor rewards repeat. Original pre-progression seeds 0/987 also won; seed 123 died on floor 2 and now reaches floor 4. Seed 1 still dies on floor 4. No tuning changes were made to force success.

Browser review used seed 0 with enabled fog through the real equipment, pickup, and movement controls. The first level-up occurred at turn 30, reaching 11 XP; maximum health became 12 and the log ordered death → XP → level-up. By turn 34, Character showed level 2, 13 XP, and health 7/12. C and I toggled the dialog without consuming turns or losing map focus. At 1280×720 the progression/equipment/bag columns and potion assignments fit together; lower inspection text remains scrollable. The final attribute UI will receive another layout/theme review.

Tests also verify rewards retained across stair revisits, no duplicate cleared-floor awards, bounded log history independent of authoritative XP, capped rewards without healing, death/victory guards, and replay reset. Existing real-seeded action replay and twenty-floor generation regressions remain in the suite. Full frontend checks/build run at every story commit.

This completes the XP/health implementation checkpoint before Strength/Dexterity. The developer remains the final reviewer; the request authorizes continuing through the full epic.
