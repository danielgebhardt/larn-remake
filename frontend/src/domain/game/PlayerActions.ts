import {
	type MovementDirection,
	moveDungeonRun,
} from "../dungeon/DungeonRun.ts";
import type { GameState } from "./GameState.ts";

export type PlayerAction = { type: "move"; direction: MovementDirection };

export type ActionResolution = {
	state: GameState;
	turnAdvanced: boolean;
};

export const resolvePlayerAction = (
	state: GameState,
	action: PlayerAction,
): ActionResolution => {
	// Movement validates collision and applies at most one stair transition.
	// Only after that succeeds does the action consume a turn.
	const run = moveDungeonRun(state.run, action.direction);
	if (run === state.run) return { state, turnAdvanced: false };
	if (
		state.monsters.some(
			(monster) =>
				monster.floorNumber === run.activeFloor &&
				monster.health > 0 &&
				monster.coordinate.row === run.playerCoordinate.row &&
				monster.coordinate.col === run.playerCoordinate.col,
		)
	)
		return { state, turnAdvanced: false };
	return {
		state: { ...state, run, turn: state.turn + 1 },
		turnAdvanced: true,
	};
};
