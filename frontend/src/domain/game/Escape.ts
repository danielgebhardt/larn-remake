import { generateEscapeEncounters } from "../monsters/EscapeEncounters";
import { appendActivityEvents } from "./ActivityHistory";
import type { GameState } from "./GameState";

export type EscapeState = Readonly<{
	startedTurn: number;
	activatedFloors: readonly number[];
}>;

// Activation belongs to ascent, before the new floor's ordinary monster phase.
export const activateEscapeFloor = (
	state: GameState,
	fromFloor: number,
): GameState => {
	const snapshot = state.escape;
	const floor = state.run.activeFloor;
	if (
		!snapshot ||
		!state.quest.cureRecovered ||
		state.quest.victory ||
		state.player.health <= 0 ||
		floor >= fromFloor ||
		floor >= state.quest.goalFloor ||
		snapshot.activatedFloors.includes(floor)
	)
		return state;
	const actors = generateEscapeEncounters(state, floor);
	return {
		...state,
		activityHistory: appendActivityEvents(state.activityHistory, [
			{ type: "escape-floor-activated", floorNumber: floor, turn: state.turn },
		]),
		escape: {
			...snapshot,
			activatedFloors: [...snapshot.activatedFloors, floor],
		},
		monsters: actors.length ? [...state.monsters, ...actors] : state.monsters,
	};
};
