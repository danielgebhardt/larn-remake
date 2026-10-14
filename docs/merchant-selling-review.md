# Merchant selling — #317 and #322

Branch: `codex/merchant-selling`. Each story has its own initial commit and awaits developer acceptance.

## #317: stable transactions

The production browser reproduced an unsafe layout: selling the first of twenty items shifted the second item into the first button's position. The old dialog also used content-driven height and automatically focused the next sale button.

The dialog now has fixed viewport-bounded height. Its header, gold, tabs and instructions remain outside the scrolling trading content. Sold equipment retains a disabled, inaccessible copy of its card solely to reserve the previous geometry, with a visible Sold placeholder. Its comparison expansion also retains its space. This transient list belongs to the open merchant UI; it is cleared on close, never saved, and never grants ownership or enables a sale. New carried equipment is appended if it appears while open.

After a sale, focus returns to Sell with scrolling suppressed. Another Enter cannot sell a different item; select the next item deliberately. A repeated pointer click hits the sold placeholder. Individual transactions still use their existing domain action, price, turn and monster response. Existing comparison calculations and Buy controls remain.

Test-first evidence: the Home test failed on the missing Sold placeholder; the baseline production browser failed because the second sale button moved from x=653 to x=290. Regression coverage checks repeated clicks, actual dialog/panel/Close bounds over twenty sales, stable remaining-item coordinates, many/few/zero inventory, keyboard focus and clean reopening. Browser viewport: 1280×720. The complete browser suite also retains Buy, comparison, save/load and lifecycle coverage.

## #322: bulk Lower sales

Authorized companion story; implementation follows the #317 commit. Only the existing Lower comparison label qualifies. Same, Better and Tradeoff remain owned; ring eligibility uses both destinations through the existing comparison rule. Each successful sale retains normal turn and enemy-response rules.
