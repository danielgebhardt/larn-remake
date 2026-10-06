import type { Coordinate, GeneratedDungeon } from "./LayoutTiles.ts";

export type DungeonFloor = GeneratedDungeon & {
	floorNumber: number;
};

export type DungeonRun = {
	seed: number;
	floors: DungeonFloor[];
	activeFloor: number;
	playerCoordinate: Coordinate;
};

export const createDungeonRun = (
	seed: number,
	floorCount: number,
	floors: DungeonFloor[],
): DungeonRun => {
	return {
		seed: seed,
		floors: floors,
		activeFloor: floorCount,
		playerCoordinate: {
			row: 0,
			col: 0,
		},
	};
};
