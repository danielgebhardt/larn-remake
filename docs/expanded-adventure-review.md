# Expanded adventure implementation review

Branch: `codex/expanded-adventure`. Six epics expand startup, spell acquisition, equipment, creatures, discoveries and deep-run progression. Recommended balance configuration: 60×60×20; other valid sizes retain correctness support. One commit per story, with developer acceptance pending.

## #155 — Settings keyboard focus

Applying a valid configuration with Enter, or dismissing Settings, now returns focus to the map after its close transition. Existing Settings focus assertions now expect the map rather than the toolbar trigger. Failed validation keeps the sheet and focused editor intact. Toolbar controls now retain movement keys as well as action shortcuts, removing the previous inconsistent partial-gameplay behavior.

Ten new regression cases first reproduced the missing map focus and movement through a focused button, then passed. Browser checkpoint: changed Rows to 20, pressed Enter, observed Dungeon map focus and immediate G feedback without clicking the map. Existing save/load focus behavior is retained.

## #156 — Adventure introduction

App now owns the not-started state. The opening dialog tells the cure-and-return story; Home is not mounted, terrain is not generated and gameplay cannot consume turns before Begin. Begin selects a full-range random seed, mounts Home and focuses the map. Keeping the opening outside GameState avoids inventing an unplayed placeholder save. Domain/page tests can still mount Home directly with controlled runs.

Two behavior tests first failed against the old startup, then passed. Browser inspected the opening layout and verified Begin arrives on floor one, turn zero, with map focus. Six epics and 41 scoped stories (the approved 40 plus the initial focus bug) are recorded in GitHub and the local plan. Level progression is scheduled before spell/content expansion.
