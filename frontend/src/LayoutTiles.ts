export type Coordinate = { row: number; col: number };
export type Region = {
	startRow: number;
	startCol: number;
	endRow: number;
	endCol: number;
};

export type SplitDirection = "horizontal" | "vertical";

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

export const splitRegion = (
	region: Region,
	direction: SplitDirection,
	minChildSize: number,
): [Region, Region] | undefined => {
	const regionWidth = region.endCol - region.startCol + 1;
	const regionHeight = region.endRow - region.startRow + 1;

	if (direction === "vertical") {
		if (regionWidth < minChildSize * 2 || regionHeight < minChildSize) {
			return undefined;
		}

		const firstChildWidth = Math.floor(regionWidth / 2);
		const firstChildEndCol = region.startCol + firstChildWidth - 1;

		const child1: Region = {
			startRow: region.startRow,
			endRow: region.endRow,
			startCol: region.startCol,
			endCol: region.startCol + firstChildWidth - 1,
		};
		const child2: Region = {
			startRow: region.startRow,
			endRow: region.endRow,
			startCol: firstChildEndCol + 1,
			endCol: region.endCol,
		};

		return [child1, child2];
	} else if (direction === "horizontal") {
		if (regionHeight < minChildSize * 2 || regionWidth < minChildSize) {
			return undefined;
		}

		const firstChildHeight = Math.floor(regionHeight / 2);
		const firstChildEndRow = region.startRow + firstChildHeight - 1;

		const child1: Region = {
			startRow: region.startRow,
			endRow: region.startRow + firstChildHeight - 1,
			startCol: region.startCol,
			endCol: region.endCol,
		};
		const child2: Region = {
			startRow: firstChildEndRow + 1,
			endRow: region.endRow,
			startCol: region.startCol,
			endCol: region.endCol,
		};

		return [child1, child2];
	}

	return undefined;
};
