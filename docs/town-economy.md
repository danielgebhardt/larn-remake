# Town economy — #331

The potion store owns a finite stock separate from the existing campaign-wide wandering-merchant stock. A new adventure creates it once. There is no restock: visits, turns, buying elsewhere, re-entry, save/load, death inspection and real time cannot refill it. Replay creates a new adventure, not a carry-over account. Sold bottles remain depleted after being drunk or dropped.

| Existing potion | Gold | Initial town copies |
| --- | ---: | ---: |
| Healing (up to 5 HP) | 150 | 4 |
| Mana (up to 5 MP) | 200 | 4 |
| Greater healing (up to 15 HP) | 450 | 4 |
| Greater mana (up to 12 MP) | 600 | 4 |
| Antidote (removes current poison) | 125 | 4 |
| Strength (+2 for six committed turns) | 250 | 2 |
| Dexterity (+2 for six committed turns) | 250 | 2 |
| Intelligence (+2 for six committed turns) | 250 | 2 |

Core prices match wandering merchants. Town does not buy potions or gear; wandering merchants retain their existing carried-equipment sale rules and cannot buy potions. There is no resale loop. Town trades are free of dungeon time and change only gold, actual bottle ownership, stock, hotbar assignment and the purchase log. No healing, effects or combat occur during purchase. Drinking remains a dungeon action; town is not free recovery.

Stock is authored and identical across seeds, like the town. No generator calls or seed streams are introduced. If a later story varies stock, use a dedicated `seed:town:service:stock` namespace and persist the selected actual stock once; never derive remaining stock again on visit or load. Current saves own actual depletion and item identities. Duplicate/stale purchase confirmations, full bags and physical-copy limits reject atomically. Each displayed purchase requires a deliberate confirmation against the quoted remaining stock.

## Bounded budget review

The existing `review-merchant.mjs` generated six Normal 40×40×20 adventures (seeds 0, 1, 2, 3, 123, 987). Potential ordinary gold through floor 5 was 788–841 and across the full descent 8,371–8,588. These assume collecting every ordinary monster/loose-gold source; elites, return waves, equipment sales and spending are excluded. Town's entire stock costs 7,600; wandering stock costs 14,000, for 21,600 combined. Greater bottles consolidate recovery into one drinking turn at a higher price; they do not guarantee better restoration per gold. Limited supply preserves choices.

Human review scenarios: at 0 gold, browse freely but buy nothing; at 200, choose one mana or healing bottle rather than both; at 500, choose one greater healing or two short tactical boosts; a full bag can add an existing potion stack, but cannot add a new kind; returning with partial HP/MP and poison retains those exact values until an explicit dungeon action. Check early backtracking burden and whether short tactical boosts feel worth 250 gold. Prices are a provisional implementation baseline, not a simulated win-rate or a guarantee of human affordability; developer playtesting owns final balance.
