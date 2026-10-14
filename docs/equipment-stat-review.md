# Equipment previews — stories #301 and #303

Branch: `codex/equipment-stat-previews`. Acceptance and merge remain with the developer.

## #301: practical Character comparisons

The previous implementation compared item contributions independently, estimating Strength and Intelligence bonuses with item-local rounding. The replacement derives full before/after loadouts with the same `deriveCombatStats`, `deriveAccuracy`, `deriveAttributes`, `attackProfile` and `maximumMana` functions used in play. Only the requested equipment slot changes; the other ring remains equipped.

Health capacity starts from the current stored maximum and applies the gear health delta, matching equipment changes. Current health/mana and all adventure state stay untouched. Previews use effects as they are now; they do not predict expiry or the monsters' response after an equip turn.

The primary display shows maximum health/mana, melee damage range and armor; hit chance and evasion are included. Expandable attribute details retain Strength, Dexterity and Intelligence. Badges consider these outcomes and attributes (Intelligence also matters to spell power). Any gain plus any loss is Tradeoff; only gains are Better, only losses Lower, and no differences Same. This avoids hiding Dexterity's evasion improvement when hit chance is capped. Both ring destinations have explicit previews; the bag's badge keeps its existing preference for the most useful compatible slot.

Capacity increases do not refill resources; removing capacity may clamp them. The UI states this and distinguishes a preview from committing equipment actions.

### Verification

- New domain behavior tests failed against the old comparison implementation, then passed with full-loadout derivation.
- Coverage includes level-derived damage, enchanted weapons/armor, other-ring preservation, player versus monster effects, mana capacity, capped accuracy with improved evasion, resource/state immutability and incompatible/non-equipment candidates.
- Character tests cover keyboard inspection of both ring destinations, live progression/effects, no turns/refills while browsing, and actual stats after equipping. Existing swap/drop/pickup/restart and enchantment tests were updated to assert total outcomes.
- Manual browser review used a validated file-import fixture at level 3, with protected armor and enchanted gear, without writing the browser save slot. Both ring previews matched current stats.
- The commit hook runs formatting/lint, all frontend tests and the production build before committing.

The seed-review policies and equipment metrics also pass the whole character context; this changes their definition of useful equipment to match the UI. Existing diagnostic continuation/policy/metric tests verify those callers.

No combat formula, equipment action, economy or save-format change is part of this story.
