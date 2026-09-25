import {
	type Dungeon,
	FLOOR,
	type GeneratedDungeon,
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

export const makePlayerStartSource = (
	rooms: Room[],
): Pick<GeneratedDungeon, "rooms" | "terrain"> => {
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
