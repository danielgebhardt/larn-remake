import type { DungeonRun } from "../domain/dungeon/DungeonRun";
import { createTestDungeonFloor } from "./testhelpers";

// A one-tile corridor lets three seeded goblins approach without surrounding
// the player. The tiny destination floor tests the zero-population fallback.
export const createCorridorEncounter = (): DungeonRun => ({
	seed: 123,
	activeFloor: 1,
	playerCoordinate: { row: 1, col: 1 },
	floors: [
		createTestDungeonFloor({
			floorNumber: 1,
			rows: 3,
			cols: 14,
			room: { startRow: 1, endRow: 1, startCol: 1, endCol: 12 },
			downStair: {
				coordinate: { row: 1, col: 12 },
				destinationFloor: 2,
				arrivalCoordinate: { row: 1, col: 1 },
			},
		}),
		createTestDungeonFloor({
			floorNumber: 2,
			rows: 3,
			cols: 4,
			room: { startRow: 1, endRow: 1, startCol: 1, endCol: 2 },
			upStair: {
				coordinate: { row: 1, col: 1 },
				destinationFloor: 1,
				arrivalCoordinate: { row: 1, col: 12 },
			},
		}),
	],
});
