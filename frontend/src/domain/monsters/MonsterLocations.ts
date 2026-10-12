import { NoDistinctStairLocationError } from "../dungeon/DungeonLocations";
import {
	type DungeonFloor,
	type DungeonRun,
	selectFloorDownStair,
} from "../dungeon/DungeonRun";
import type { Coordinate } from "../dungeon/DungeonTypes";

export const coordinateKey = ({ row, col }: Coordinate): string =>
	`${row}:${col}`;
export const orthogonalDistance = (a: Coordinate, b: Coordinate): number =>
	Math.abs(a.row - b.row) + Math.abs(a.col - b.col);

// Arrivals are read from links too, even if a fixture does not use reciprocal stairs.
export const protectedFloorLocations = (
	run: { floors: readonly Pick<DungeonFloor, "upStair" | "downStair">[] },
	floorNumber: number,
): Coordinate[] => {
	const floor = run.floors[floorNumber - 1];
	const locations = [floor.upStair?.coordinate, floor.downStair?.coordinate];
	for (const source of run.floors) {
		for (const link of [source.upStair, source.downStair]) {
			if (link?.destinationFloor === floorNumber)
				locations.push(link.arrivalCoordinate);
		}
	}
	return locations.filter(
		(location): location is Coordinate => location !== undefined,
	);
};

// Reserve a future down stair so extending the run does not displace spawns.
export const protectedSpawnLocations = (
	run: DungeonRun,
	floorNumber: number,
): Coordinate[] => {
	const locations = protectedFloorLocations(run, floorNumber);
	const floor = run.floors[floorNumber - 1];
	if (!floor.downStair) {
		try {
			locations.push(selectFloorDownStair(run.seed, floor));
		} catch (error) {
			if (!(error instanceof NoDistinctStairLocationError)) throw error;
		}
	}
	return locations;
};
