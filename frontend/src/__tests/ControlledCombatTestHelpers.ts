import type { AttackRollSource } from "../domain/game/CombatRandomness";
import type { GameState } from "../domain/game/GameState";
import {
	type PlayerAction,
	resolvePlayerAction,
} from "../domain/game/PlayerActions";

// Ownership, UI, and AI tests use landed nominal hits to isolate their rules.
// Seeded outcome tests import the domain action directly and never use this wrapper.
export const predictableAttackRolls: AttackRollSource = () => ({
	d20: () => 20,
	damage: (min, max) => Math.floor((min + max) / 2),
});
export const resolvePlayerActionWithHits = (
	state: GameState,
	action: PlayerAction,
) => resolvePlayerAction(state, action, predictableAttackRolls);
