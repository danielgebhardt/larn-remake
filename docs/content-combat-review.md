# Content and combat review

## Fixed-damage content milestone (#98)

Configuration: five 15×15 floors, default room generation, starter health 10, initial iron sword in the bag, and the catalog/density values documented in README. Combat still always hits at this milestone.

`pnpm --filter frontend exec node scripts/review-adventure.mjs` runs a reproducible diagnostic walker for seeds 0, 1, 123, and 987. It heals at health 6 or lower, equips carried improvements, attacks adjacent monsters, then visits nearest reachable monsters/items before descending. It knows unseen terrain/content and is not a player strategy, human playtest, or statistical win-rate test. It does not avoid dangerous opponents or optimize equipment changes under attack. Numeric seeds can be passed to inspect another run. The 500-action safety limit prevents a diagnostic loop from hanging.

| Seed | Deepest floor | Result | Turns | Health | Kills | Potions used |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | 5 | Cleared final floor | 118 | 8 | 12 | 4 |
| 1 | 4 | Died | 99 | 0 | 8 | 2 |
| 123 | 2 | Died | 23 | 0 | 4 | 0 |
| 987 | 5 | Cleared final floor | 151 | 8 | 14 | 3 |

Observations:

- Seeds 0 and 987 permit a complete descent with upgraded chest/head protection and timely healing. This does not establish that every seed is fair or winnable.
- Seed 123 supplies no initially found healing until floor 4; attacking everything without retreat runs out of health early. Loot weights remain probabilistic rather than guaranteeing a potion every floor.
- Seed 1 demonstrates that multiple deeper orcs can punish equipment/action choices even with leather protection. Chest/head protection matters against their four-damage hits, while every landed hit still deals at least one damage.
- No constants were changed solely to make this simple walker succeed. Reassess thresholds, healing supply, armor and crowding once randomized combat and a victory objective exist. In particular, stronger late-floor variety beyond two eligible monster kinds remains future work.

Browser review:

- Seed 0, five 15×15 floors: `w w d d g` from the start reaches and picks up leather armor. Open Character, select it, and equip in chest. Armor rises from 1 to 2, and the equip turn triggers normal retaliation.
- Character reviewed in dark/light desktop layouts and at 390×700; equipment, shared details, body scrolling, pinned stats/footer, and bag controls remain usable.
- Seed 0, five 100×100 floors: density caps each floor at 12 monsters. Ten alternating movement inputs resolved promptly. This is a responsiveness check with automation overhead, not a frame-time benchmark.
- Floor-count validation/settings now allow 20; monster and loot eligibility tests cover that boundary. Extension tests verify earlier floor populations/loot remain unchanged.
- Full frontend checks and production build pass at each story commit. Fixed corridor encounter tests explicitly request three actors so density tuning does not rewrite their intended scenario.

There is no quest/victory state yet. “Cleared final floor” is a diagnostic outcome, not a player-facing win condition. Twenty-floor configurations are supported but have not been balanced as complete adventures.
