import { deriveAttributes } from "./Attributes";
import type { GameState } from "./GameState";
import type { Progression } from "./Progression";

export const BASE_MAXIMUM_MANA = 10;
export const MANA_PER_INTELLIGENCE_MODIFIER = 2;
export const maximumMana = (progression: Progression): number =>
	BASE_MAXIMUM_MANA +
	MANA_PER_INTELLIGENCE_MODIFIER *
		deriveAttributes(progression).intelligenceModifier;

export const growManaCapacity = (
	mana: number,
	before: Progression,
	after: Progression,
): number => mana + maximumMana(after) - maximumMana(before);

export const MANA_RECOVERY_INTERVAL = 30;
export const recoverManaAfterTurn = (state: GameState): GameState => {
	if (
		state.player.health <= 0 ||
		state.quest.victory ||
		state.turn === 0 ||
		state.turn % MANA_RECOVERY_INTERVAL !== 0
	)
		return state;
	const mana = Math.min(maximumMana(state.progression), state.mana + 1);
	return mana === state.mana ? state : { ...state, mana };
};
