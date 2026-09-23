import { createCoordinateListOfAllRooms, type Room } from "./Room.ts";

export type Coordinate = { row: number; col: number };

export const WALL: string = "#";
export const FLOOR: string = ".";
export const PLAYER: string = "@";
export const START_COORDINATE: Coordinate = { row: 1, col: 1 };
export const MAX_SIZE = 100;

export const fixedDungeon: string[][] = [
	[WALL, WALL, WALL, WALL, WALL],
	[WALL, FLOOR, FLOOR, FLOOR, WALL],
	[WALL, FLOOR, WALL, FLOOR, WALL],
	[WALL, FLOOR, FLOOR, FLOOR, WALL],
	[WALL, WALL, WALL, WALL, WALL],
];

export const getDungeonCoordinateValue = (
	column: number,
	row: number,
	dungeon: string[][],
): string | undefined => {
	return dungeon[row]?.[column];
};

export const makeDungeon = (
	rows: number,
	cols: number,
): string[][] | undefined => {
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

	const newDungeon: string[][] = [];

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
	dungeon: string[][] | undefined,
	rooms: Room[],
): string[][] => {
	if (!dungeon) {
		throw new RangeError("Dungeon is undefined");
	}

	const carvedDungeon = dungeon.map((row) => [...row]);
	const roomCoordinates: Coordinate[] = createCoordinateListOfAllRooms(rooms);

	for (const coordinate of roomCoordinates) {
		carvedDungeon[coordinate.row][coordinate.col] = FLOOR;
	}

	return carvedDungeon;
};
