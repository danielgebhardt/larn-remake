# Merchant selling — #317 and #322

Branch: `codex/merchant-selling`. Each story has its own initial commit and awaits developer acceptance.

## #317: stable transactions

The production browser reproduced an unsafe layout: selling the first of twenty items shifted the second item into the first button's position. The old dialog also used content-driven height and automatically focused the next sale button.

The dialog now has fixed viewport-bounded height. Its header, gold, tabs and instructions remain outside the scrolling trading content. Sold equipment retains a disabled, inaccessible copy of its card solely to reserve the previous geometry, with a visible Sold placeholder. Its comparison expansion also retains its space. This transient list belongs to the open merchant UI; it is cleared on close, never saved, and never grants ownership or enables a sale. New carried equipment is appended if it appears while open.

After a sale, focus returns to Sell with scrolling suppressed. Another Enter cannot sell a different item; select the next item deliberately. A repeated pointer click hits the sold placeholder. Individual transactions still use their existing domain action, price, turn and monster response. Existing comparison calculations and Buy controls remain.

Test-first evidence: the Home test failed on the missing Sold placeholder; the baseline production browser failed because the second sale button moved from x=653 to x=290. Regression coverage checks repeated clicks, actual dialog/panel/Close bounds over twenty sales, stable remaining-item coordinates, many/few/zero inventory, keyboard focus and clean reopening. Browser viewport: 1280×720. The complete browser suite also retains Buy, comparison, save/load and lifecycle coverage.

## #322: bulk Lower sales

The Sell tab offers **Sell all Lower items (count) · total gold**. Only the existing Lower comparison label qualifies. Same, Better and Tradeoff remain owned; ring eligibility uses both destinations through the existing comparison rule. The count and total use the same pure `lowerEquipmentSale` calculation as execution, including enchantments, progression and active effects. Worn equipment and non-equipment never enter the candidate list.

The developer clarified that bulk selling may take one action/turn. The implementation follows that atomic rule: validate merchant access, current candidates and total gold capacity before changing ownership; remove the qualifying copies together; append one existing `merchant-sold` event per copy, all on the same turn. Then the existing action resolver runs one normal enemy phase, effects and recovery. A fatal response retains every completed sale. Empty, out-of-reach and overflow requests spend nothing; ended adventures retain the existing action guard. There is no transaction queue or new persisted contract.

The UI first presents a confirmation showing count, gold and the single-turn cost. It focuses the confirmation group rather than the destructive button, so another Enter alone cannot confirm. Canceling is free. Confirmation returns focus to Sell, and the fixed footer reserves its space throughout. Sold placeholders follow the same rules as individual sales. Execution recomputes eligibility from actual state rather than trusting a UI-provided list of IDs. Screenshot review also caught disabled button content showing through a sold card's inherited visibility; the reserved content now has zero opacity as well, keeping the visible placeholder clear.

Test-first evidence: the domain behavior initially failed because the bulk action did not advance a turn; the UI behavior failed on the missing bulk-sale control. Coverage includes mixed Lower/Same/Better/Tradeoff copies, duplicate swords with different enchantments, both ring destinations, changed loadout eligibility, atomic gold-overflow rejection, one adjacent enemy response, effects/recovery, fatal response and deterministic v20 save continuation. Browser checks cover cancellation, keyboard confirmation without accidental repeat activation, the displayed quote, retained non-Lower items, one committed turn, unchanged dialog/Close bounds and map focus restoration.

## Verification and review

Final checks: Biome, strict TypeScript, full Vitest suite and production build through the required commit hook, plus **nine production Chromium flows** at 1280×720. Browser saves are isolated generated fixtures. No backend behavior changed; no backend tests or human balance playtest were performed. The existing approximately 618 kB main-chunk warning remains.

Review commit #317 first for layout/focus and transient UI ownership, then #322 for the shared eligibility calculation, atomic domain action and UI confirmation. Saves remain v20: existing sale events already support multiple item records on one turn, and actual inventory/gold continue to be saved normally. Existing adventures gain the bulk-sale action without regenerating their played state.
