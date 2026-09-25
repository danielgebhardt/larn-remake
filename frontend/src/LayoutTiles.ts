import { getTerminalRooms, makeRegion } from "./__tests/testhelpers.ts";
import { type Corridor, connectPartitionRooms } from "./Corridor.ts";
import { type PartitionNode, recursivePartition } from "./Partitioning.ts";
import { assignRoomsToPartition, type Room } from "./Room.ts";

export type Dungeon = string[][];
export type Coordinate = { row: number; col: number };
export type DungeonConfig = {
	rows: number;
	cols: number;
	minPartitionSize: number;
	roomPadding: number;
};

export type GeneratedDungeon = {
	terrain: Dungeon;
	partitions: PartitionNode;
	rooms: Room[];
	corridors: Corridor[];
};

export const WALL: string = "#";
export const FLOOR: string = ".";
export const PLAYER: string = "@";
export const START_COORDINATE: Coordinate = { row: 1, col: 1 };
export const MAX_SIZE = 100;

export const fixedDungeon: Dungeon = [
	[WALL, WALL, WALL, WALL, WALL],
	[WALL, FLOOR, FLOOR, FLOOR, WALL],
	[WALL, FLOOR, WALL, FLOOR, WALL],
	[WALL, FLOOR, FLOOR, FLOOR, WALL],
	[WALL, WALL, WALL, WALL, WALL],
];

export const getDungeonCoordinateValue = (
	column: number,
	row: number,
	dungeon: Dungeon,
): string | undefined => {
	return dungeon[row]?.[column];
};

export const makeDungeon = (
	rows: number,
	cols: number,
): Dungeon | undefined => {
	if (
		!Number.isInteger(rows) ||
		!Number.isInteger(cols) ||
		rows <= 0 ||
		cols <= 0 ||
		rows > MAX_SIZE ||
		cols > MAX_SIZE
	) {
		return undefined;
	}

	const newDungeon: Dungeon = [];

	for (let row = 0; row < rows; row++) {
		const currentRow: string[] = [];

		for (let col = 0; col < cols; col++) {
			currentRow.push(WALL);
		}

		newDungeon.push(currentRow);
	}

	return newDungeon;
};

export const carveRooms = (
	dungeon: Dungeon | undefined,
	rooms: Room[],
): Dungeon => {
	if (!dungeon) {
		throw new RangeError("Dungeon is undefined");
	}

	const carvedDungeon = dungeon.map((row) => [...row]);

	const dungeonMaxHeightCoordinate = carvedDungeon.length - 1;
	const dungeonMaxWidthCoordinate = carvedDungeon[0].length - 1;

	for (const room of rooms) {
		if (
			room.startRow < 0 ||
			room.endRow > dungeonMaxHeightCoordinate ||
			room.startCol < 0 ||
			room.endCol > dungeonMaxWidthCoordinate
		) {
			throw new RangeError("room is outside dungeon bounds");
		}

		for (let row = room.startRow; row <= room.endRow; row++) {
			for (let col = room.startCol; col <= room.endCol; col++) {
				carvedDungeon[row][col] = FLOOR;
			}
		}
	}

	return carvedDungeon;
};

export const carveCorridors = (
	dungeon: Dungeon | undefined,
	corridors: Corridor[],
): Dungeon => {
	if (!dungeon) {
		throw new RangeError("Dungeon is undefined");
	}

	const dungeonMaxRow = dungeon.length - 1;
	const dungeonMaxCol = dungeon[0].length - 1;

	const carvedDungeon = dungeon.map((row) => [...row]);

	for (const corridor of corridors) {
		for (const coordinate of corridor) {
			if (
				coordinate.row < 0 ||
				coordinate.row > dungeonMaxRow ||
				coordinate.col < 0 ||
				coordinate.col > dungeonMaxCol
			) {
				throw new RangeError("corridor is outside dungeon bounds");
			}
		}

		for (const coordinate of corridor) {
			carvedDungeon[coordinate.row][coordinate.col] = FLOOR;
		}
	}

	return carvedDungeon;
};

export const generateDungeon = (config: DungeonConfig): GeneratedDungeon => {
	const dungeon = makeDungeon(config.rows, config.cols);
	const region = makeRegion(dungeon);

	const partitionsWithRooms = assignRoomsToPartition(
		recursivePartition(region, config.minPartitionSize),
		config.roomPadding,
	);
	const rooms: Room[] = getTerminalRooms(partitionsWithRooms);
	const corridors: Corridor[] = connectPartitionRooms(partitionsWithRooms);

	const carvedDungeon: Dungeon = carveCorridors(
		carveRooms(dungeon, rooms),
		corridors,
	);

	return {
		terrain: carvedDungeon,
		partitions: partitionsWithRooms,
		rooms,
		corridors,
	};
};
