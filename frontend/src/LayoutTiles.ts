import { type Corridor, connectPartitionRooms } from "./Corridor.ts";
import {
	makeRegion,
	type PartitionNode,
	recursivePartition,
} from "./Partitioning.ts";
import { assignRoomsToPartition, getTerminalRooms, type Room } from "./Room.ts";
import {
	DEFAULT_RUN_CONFIGURATION,
	type DungeonConfig,
	MAX_SIZE,
} from "./RunConfiguration";
import { createSeededRandom } from "./Seed.ts";

export type { DungeonConfig } from "./RunConfiguration";
export { MAX_SIZE } from "./RunConfiguration";

export type Dungeon = string[][];
export type Coordinate = { row: number; col: number };

export type GeneratedDungeon = {
	terrain: Dungeon;
	partitions: PartitionNode;
	rooms: Room[];
	corridors: Corridor[];
};

export type LocationSelectionSource = Pick<
	GeneratedDungeon,
	"rooms" | "terrain"
>;

export const WALL: string = "#";
export const FLOOR: string = ".";
export const PLAYER: string = "@";
export const STAIRS_UP = "<";
export const STAIRS_DOWN = ">";
export const START_COORDINATE: Coordinate = { row: 1, col: 1 };

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

const getRoomCenter = (room: Room) => {
	return {
		row: Math.floor((room.startRow + room.endRow) / 2),
		col: Math.floor((room.startCol + room.endCol) / 2),
	};
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

export const generateDungeon = (
	config: DungeonConfig,
	seed?: number,
): GeneratedDungeon => {
	const dungeon = makeDungeon(config.rows, config.cols);
	const region = makeRegion(dungeon);

	const random = seed === undefined ? undefined : createSeededRandom(seed);

	const partitionsWithRooms = assignRoomsToPartition(
		recursivePartition(region, config.minPartitionSize, random),
		config.roomPadding,
		random,
		{
			minRoomSize: config.minRoomSize ?? DEFAULT_RUN_CONFIGURATION.minRoomSize,
			maxRoomAspectRatio:
				config.maxRoomAspectRatio ??
				DEFAULT_RUN_CONFIGURATION.maxRoomAspectRatio,
		},
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

export const selectPlayerStart = (
	dungeon: LocationSelectionSource,
): Coordinate => {
	const rooms = dungeon.rooms;

	if (rooms.length === 0) {
		throw new RangeError("No eligible rooms for starting point");
	}

	const startingPoint = getRoomCenter(rooms[0]);

	if (dungeon.terrain[startingPoint.row][startingPoint.col] !== FLOOR) {
		throw new RangeError("Invalid start point");
	}

	return startingPoint;
};

export const selectStairLocation = (
	dungeon: LocationSelectionSource,
	entryCoordinate: Coordinate,
	random?: () => number,
): Coordinate => {
	if (
		!Number.isInteger(entryCoordinate.row) ||
		!Number.isInteger(entryCoordinate.col) ||
		dungeon.terrain[entryCoordinate.row]?.[entryCoordinate.col] !== FLOOR
	) {
		throw new RangeError("Invalid start point");
	}

	const entryRoom = dungeon.rooms.find(
		(room) =>
			entryCoordinate.row >= room.startRow &&
			entryCoordinate.row <= room.endRow &&
			entryCoordinate.col >= room.startCol &&
			entryCoordinate.col <= room.endCol,
	);

	if (!entryRoom) {
		throw new RangeError(
			"Invalid start point. Starting point is not in a room.",
		);
	}

	const otherRooms = dungeon.rooms.filter((room) => room !== entryRoom);

	if (otherRooms.length > 0) {
		if (!random) {
			return getRoomCenter(otherRooms[otherRooms.length - 1]);
		}

		// Choose rooms equally, then choose a floor tile in that room.
		const room = otherRooms[Math.floor(random() * otherRooms.length)];
		const candidates: Coordinate[] = [];
		for (let row = room.startRow; row <= room.endRow; row++) {
			for (let col = room.startCol; col <= room.endCol; col++) {
				if (dungeon.terrain[row]?.[col] === FLOOR) {
					candidates.push({ row, col });
				}
			}
		}

		if (candidates.length === 0) {
			throw new RangeError("No valid coordinate available for staircase");
		}
		return candidates[Math.floor(random() * candidates.length)];
	}

	// A single-room floor uses its center, then the first distinct floor tile
	// in row-major order. This constrained fallback consumes no randomness.
	const center = getRoomCenter(entryRoom);
	if (
		(center.row !== entryCoordinate.row ||
			center.col !== entryCoordinate.col) &&
		dungeon.terrain[center.row]?.[center.col] === FLOOR
	) {
		return center;
	}

	for (let row = entryRoom.startRow; row <= entryRoom.endRow; row++) {
		for (let col = entryRoom.startCol; col <= entryRoom.endCol; col++) {
			if (
				(row !== entryCoordinate.row || col !== entryCoordinate.col) &&
				dungeon.terrain[row]?.[col] === FLOOR
			) {
				return { row, col };
			}
		}
	}

	throw new RangeError("No valid coordinate available for staircase");
};
