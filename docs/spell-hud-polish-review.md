# Spell library and HUD XP polish — #295 and #299

Branch: `codex/spell-cards-hud-xp`, based on the completed equipment-preview branch. Developer acceptance and merge remain pending.

## #295: readable spell cards

Assignment buttons show just 5, 6, 7, 8, 9 and 0 under Assign shortcut. Accessible names identify the spell, actual key and assigned state; aria-pressed and the primary color remain tied to the actual hotbar. Clear controls retain their existing behavior. Instructions explain assignment once, alongside shared casting controls.

Every learned card shows its full catalog description directly. Damage/healing, mana cost, range/radius and element/condition details remain visible. Self-effect durations say committed turns, and self-spells with a range expose it. The fixed Character/Spells dialog and spell calculations/actions are unchanged.

Verification:

- Updated behavior tests failed first, then passed: full descriptions for every catalog spell without disclosures; six number-only controls; accessible assignment state and keyboard activation; completed-adventure disabled controls.
- Three focused files / 11 tests passed, including learned-spell hotbar casting on keys 8, 9 and 0, tab navigation and gameplay pause.
- Manual browser review used a validated full-library import, checked both themes and keyboard reassignment, and confirmed Turn 0 remained unchanged. Full-library scrolling remains expected; descriptions are not truncated.
- The commit hook runs formatting/lint, all frontend tests and the production build.

No spell balance, acquisition, hotbar mapping or save schema changed.
