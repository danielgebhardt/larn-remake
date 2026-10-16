# Safe corridor travel — #286 and #287

## #286: observable eligibility and stop policy

`CorridorTravel.ts` projects the same visible/remembered map information as the UI before making a pure route decision. It never consults hidden room metadata, unseen terrain, hidden actors, future random rolls or an explored-floor pathfinder. With fog disabled, the policy sees the full map just as the player does. Loot is visible-only; static objects/doors and landmarks follow map memory. Player health, poison and visible damage history are observable inputs.

An explicit direction may start only on an otherwise quiet, known corridor. Each next tile and its cardinal surroundings must be known. A route stops before doors/objects, loot, stairs/the entrance, junctions and room mouths. A known 2×2 open patch is treated as a room, without consulting the generated room list. A sole onward path may bend; a dead end stops without a blocked action. Step off a landmark manually before starting. Any visible living creature blocks running, including idle or controlled creatures; this deliberately favors safety over guessing intent.

After an ordinary step, stop for terminal state, floor change, damage, poison, a visible creature, newly visible objects/loot/landmarks or newly revealed room/junction geometry. Damage history catches a hit even if same-turn healing restores the net health. Existing poison denies starting without spending a turn. The policy returns a reason or one direction; it does not move, consume, fight, interact, pick up, transition floors or spend turns.

Readable tests cover known routes/bends, unknown boundaries, junctions/rooms, ordinary and elite doors, traps, gold, chests, merchants, fountains, loot, landmarks, poison, hidden-information invariance, damage and ordinary per-step turn/mana equivalence. Controller/UI work belongs to #287; policy alone does not expose a faster-movement command. Saves and generation are unchanged.
