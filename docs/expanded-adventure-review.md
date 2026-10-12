# Expanded adventure implementation review

Branch: `codex/expanded-adventure`. Six epics expand startup, spell acquisition, equipment, creatures, discoveries and deep-run progression. Recommended balance configuration: 60×60×20; other valid sizes retain correctness support. One commit per story, with developer acceptance pending.

## #155 — Settings keyboard focus

Applying a valid configuration with Enter, or dismissing Settings, now returns focus to the map after its close transition. Existing Settings focus assertions now expect the map rather than the toolbar trigger. Failed validation keeps the sheet and focused editor intact. Toolbar controls now retain movement keys as well as action shortcuts, removing the previous inconsistent partial-gameplay behavior.

Ten new regression cases first reproduced the missing map focus and movement through a focused button, then passed. Browser checkpoint: changed Rows to 20, pressed Enter, observed Dungeon map focus and immediate G feedback without clicking the map. Existing save/load focus behavior is retained.
