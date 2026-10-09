import { expect } from "vitest";
import type { DungeonFloor, StairLink } from "../DungeonRun.ts";
import {
	type Coordinate,
	type Dungeon,
	FLOOR,
	type LocationSelectionSource,
	WALL,
} from "../LayoutTiles.ts";
import type { PartitionNode, Region } from "../Partitioning.ts";
import type { Room } from "../Room.ts";

export const getTerminalRegions = (node: PartitionNode): Region[] => {
	if (!node.children) {
		return [node.region];
	}

	return node.children.flatMap(getTerminalRegions);
};

export const getRegionArea = (region: Region): number => {
	const rowCount = region.endRow - region.startRow + 1;
	const colCount = region.endCol - region.startCol + 1;

	return rowCount * colCount;
};

export const makeLocationSelectionSource = (
	rooms: Room[],
): LocationSelectionSource => {
	if (rooms.length === 0) {
		return {
			rooms: [],
			terrain: [],
		};
	}

	const maxRow = Math.max(...rooms.map((room) => room.endRow));
	const maxCol = Math.max(...rooms.map((room) => room.endCol));

	const terrain: Dungeon = Array.from({ length: maxRow + 1 }, () =>
		Array.from({ length: maxCol + 1 }, () => WALL),
	);

	for (const room of rooms) {
		for (let row = room.startRow; row <= room.endRow; row++) {
			for (let col = room.startCol; col <= room.endCol; col++) {
				terrain[row][col] = FLOOR;
			}
		}
	}

	return {
		rooms,
		terrain,
	};
};

export const expectAllFloorTilesReachable = (
	terrain: Dungeon,
	start: Coordinate,
) => {
	expect(terrain[start.row][start.col]).toBe(FLOOR);

	const visited = new Set<string>();
	const queue = [start];

	while (queue.length > 0) {
		const current = queue.shift();

		if (!current) {
			continue;
		}

		const key = `${current.row},${current.col}`;

		if (visited.has(key)) {
			continue;
		}

		visited.add(key);

		const neighbors = [
			{ row: current.row - 1, col: current.col },
			{ row: current.row + 1, col: current.col },
			{ row: current.row, col: current.col - 1 },
			{ row: current.row, col: current.col + 1 },
		];

		for (const neighbor of neighbors) {
			if (
				terrain[neighbor.row]?.[neighbor.col] === FLOOR &&
				!visited.has(`${neighbor.row},${neighbor.col}`)
			) {
				queue.push(neighbor);
			}
		}
	}

	for (const [rowIndex, row] of terrain.entries()) {
		for (const [colIndex, tile] of row.entries()) {
			if (tile === FLOOR) {
				expect(visited.has(`${rowIndex},${colIndex}`)).toBe(true);
			}
		}
	}
};

type TestDungeonFloorOptions = {
	floorNumber: number;
	rows: number;
	cols: number;
	room: Room;
	upStair?: StairLink;
	downStair?: StairLink;
};

export const createTestDungeonFloor = ({
	floorNumber,
	rows,
	cols,
	room,
	upStair,
	downStair,
}: TestDungeonFloorOptions): DungeonFloor => {
	// These traversal fixtures describe one room, with no corridors or RNG.
	const terrain: Dungeon = Array.from({ length: rows }, (_, row) =>
		Array.from({ length: cols }, (_, col) =>
			row >= room.startRow &&
			row <= room.endRow &&
			col >= room.startCol &&
			col <= room.endCol
				? FLOOR
				: WALL,
		),
	);

	return {
		floorNumber,
		terrain,
		rooms: [{ ...room }],
		corridors: [],
		partitions: {
			region: { startRow: 0, endRow: rows - 1, startCol: 0, endCol: cols - 1 },
			room: { ...room },
		},
		upStair,
		downStair,
	};
};
