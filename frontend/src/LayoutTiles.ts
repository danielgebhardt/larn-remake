import { type Corridor, connectPartitionRooms } from "./Corridor.ts";
import {
	makeRegion,
	type PartitionNode,
	recursivePartition,
} from "./Partitioning.ts";
import { assignRoomsToPartition, getTerminalRooms, type Room } from "./Room.ts";
import { createSeededRandom } from "./Seed.ts";

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

export type PlayerStartSource = Pick<GeneratedDungeon, "rooms" | "terrain">;

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

export const selectPlayerStart = (dungeon: PlayerStartSource): Coordinate => {
	const rooms = dungeon.rooms;

	if (rooms.length === 0) {
		throw new RangeError("No eligible rooms for starting point");
	}

	const startingPoint = {
		row: Math.floor((rooms[0].endRow + rooms[0].startRow) / 2),
		col: Math.floor((rooms[0].endCol + rooms[0].startCol) / 2),
	};

	if (dungeon.terrain[startingPoint.row][startingPoint.col] !== FLOOR) {
		throw new RangeError("Invalid start point");
	}

	return startingPoint;
};

export const selectStairLocation = (
	dungeon: PlayerStartSource,
	entryCoordinate: Coordinate,
): Coordinate => {
	if (
		entryCoordinate.row < 0 ||
		entryCoordinate.row > dungeon.terrain.length - 1 ||
		entryCoordinate.col < 0 ||
		entryCoordinate.col > dungeon.terrain[0].length - 1 ||
		dungeon.terrain[entryCoordinate.row][entryCoordinate.col] !== FLOOR
	) {
		throw new RangeError("Invalid start point");
	}

	if (dungeon.rooms.length === 1) {
		const room = dungeon.rooms[0];

		const middleOfRoom = getRoomCenter(room);

		if (
			middleOfRoom.row === entryCoordinate.row &&
			middleOfRoom.col === entryCoordinate.col
		) {
			const candidates = [
				{ row: room.startRow, col: room.startCol },
				{ row: room.startRow, col: room.endCol },
				{ row: room.endRow, col: room.startCol },
				{ row: room.endRow, col: room.endCol },
			];

			const fallback = candidates.find(
				(coordinate) =>
					coordinate.row !== entryCoordinate.row ||
					coordinate.col !== entryCoordinate.col,
			);

			if (!fallback) {
				throw new RangeError("No valid coordinate available for staircase");
			}

			return fallback;
		} else {
			return middleOfRoom;
		}
	}

	let startingRoomIndex = -1;

	for (let i = 0; i < dungeon.rooms.length; i++) {
		const room = dungeon.rooms[i];

		if (
			entryCoordinate.row >= room.startRow &&
			entryCoordinate.col >= room.startCol &&
			entryCoordinate.row <= room.endRow &&
			entryCoordinate.col <= room.endCol
		) {
			startingRoomIndex = i;
			break;
		}
	}

	if (startingRoomIndex === -1) {
		throw new RangeError("Invalid start point");
	}

	const rooms: Room[] = dungeon.rooms.toSpliced(startingRoomIndex, 1);

	return getRoomCenter(rooms[rooms.length - 1]);
};
