import { createGameState, type GameState } from "../domain/game/GameState";
import { createTestDungeonFloor } from "./testhelpers";

export const quietCorridor = (): GameState => {
	const state = createGameState({
		seed: 123,
		activeFloor: 1,
		playerCoordinate: { row: 2, col: 4 },
		floors: [
			createTestDungeonFloor({
				floorNumber: 1,
				rows: 5,
				cols: 24,
				room: { startRow: 2, endRow: 2, startCol: 1, endCol: 22 },
			}),
		],
	});
	return {
		...state,
		objects: [],
		floorItems: [],
		monsters: [],
		quest: { ...state.quest, entrance: { row: 2, col: 1 } },
	};
};
