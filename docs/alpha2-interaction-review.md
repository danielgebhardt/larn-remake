# Alpha run #2 interaction and UI polish

Branch `codex/alpha2-interaction-polish`, based on the reviewed difficulty/CI work. Requested stories: chest interaction #296, potion assignment indicators #300, throne/chest silhouettes #310, and a modest Save/Load refresh #298. One tested initial commit per story; developer acceptance remains pending. Balance and monster density are unchanged.

## Chest loot with E — #296

Multiple reachable objects retain the existing numbered selector, so a nearby door can still be chosen without opening the chest. A sole chest under the player opens directly with E; choosing it from the object selector opens it for the existing committed turn, then presents the existing numbered pickup dialog, including for a single item. Escape leaves loot untouched; E reopens an already-opened chest’s remaining loot without another turn. Number/mouse pickup retains existing transfer/auto-equipment rules and one turn per successful item. Adjacent opening still leaves the reward on the chest tile; move onto it before E/G pickup. Opening a chest never grants remote pickup or moves the player.

The pickup portal is gated on a living/playable character and current-tile loot, so death during the opening retaliation cannot show an actionable loot panel. Existing empty/death cleanup resets its flag. Chest log/context/Help text now explains E and G consistently.

Six behavioral regressions cover keyboard/mouse, cancel/reopen without duplicate rewards, remaining-loot object selection, adjacent opening, full-bag rejection and fatal retaliation. Five failed before implementation; all six now pass. Focused chest/pickup/context/domain checks pass 5 files / 33 tests. Keyboard rejection testing waits for the modal’s initial focus rather than assuming that mounted content has already received focus. The standard commit hook verifies the full frontend suite and production build.

## Potion assignment indicators — #300

Selected potion-assignment number buttons now use the same primary variant as assigned spell buttons; other slots remain outlined. Existing pressed-state accessibility, free assignment/moving/clearing, stacking and zero-carried assignments are preserved. A current-assignment regression complements the existing move/clear/restart coverage; no CSS snapshot or new hotbar state is introduced. Focused assignment/hotbar/auto-assignment tests pass, and a browser-imported slot-2 assignment highlights the correct button without spending a turn.
