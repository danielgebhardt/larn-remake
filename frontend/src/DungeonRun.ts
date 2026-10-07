import {
	type Coordinate,
	type GeneratedDungeon,
	selectPlayerStart,
} from "./LayoutTiles.ts";

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
	floors: DungeonFloor[],
): DungeonRun => {
	if (floors.length < 1) {
		throw new RangeError("Dungeon run must contain at least one floor");
	}

	for (let i = 0; i < floors.length; i++) {
		if (floors[i].floorNumber !== i + 1) {
			throw new RangeError("Dungeon floor numbers must be sequential");
		}
	}

	const startingPoint = selectPlayerStart(floors[0]);

	return {
		seed: seed,
		floors: floors,
		activeFloor: 1,
		playerCoordinate: startingPoint,
	};
};
