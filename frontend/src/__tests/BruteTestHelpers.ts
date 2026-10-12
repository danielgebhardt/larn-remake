import { createGameState, type GameState } from "../domain/game/GameState";
import type { MonsterKind } from "../domain/monsters/Monster";
import { createTestDungeonFloor } from "./testhelpers";

// Five linked, open floors match the default save configuration. Controlled
// actors replace generated content, while stairs keep real transition rules.
export const bruteEncounter = (): GameState => ({
	...createGameState({
		seed: 0,
		activeFloor: 4,
		playerCoordinate: { row: 4, col: 4 },
		floors: Array.from({ length: 5 }, (_, index) =>
			createTestDungeonFloor({
				floorNumber: index + 1,
				rows: 15,
				cols: 15,
				room: { startRow: 1, endRow: 13, startCol: 1, endCol: 13 },
				...(index > 0
					? {
							upStair: {
								coordinate: { row: 1, col: 1 },
								destinationFloor: index,
								arrivalCoordinate: { row: 13, col: 13 },
							},
						}
					: {}),
				...(index < 4
					? {
							downStair: {
								coordinate: { row: 13, col: 13 },
								destinationFloor: index + 2,
								arrivalCoordinate: { row: 1, col: 1 },
							},
						}
					: {}),
			}),
		),
	}),
	monsters: [
		{
			id: "4:1",
			kind: "dungeon-brute" as MonsterKind,
			floorNumber: 4,
			coordinate: { row: 4, col: 5 },
			health: 10,
			intent: { type: "idle" },
		},
	],
	floorItems: [
		{
			item: { id: "quest:cure", kind: "cure" },
			floorNumber: 5,
			coordinate: { row: 7, col: 7 },
		},
	],
});
export const preparingBrute = (): GameState => {
	const state = bruteEncounter();
	return {
		...state,
		turn: 1,
		monsters: state.monsters.map((monster) => ({
			...monster,
			intent: {
				type: "preparing-attack",
				target: { ...state.run.playerCoordinate },
			},
		})),
	};
};
