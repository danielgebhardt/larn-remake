import type { PartitionNode, Region } from "../Partitioning.ts";
import type { Room } from "../Room.ts";

export const getTerminalRegions = (node: PartitionNode): Region[] => {
	if (!node.children) {
		return [node.region];
	}

	return node.children.flatMap(getTerminalRegions);
};

export const getTerminalRooms = (node: PartitionNode): Room[] => {
	if (node.children) {
		if (node.room) {
			throw new Error("Internal partition should not have a room");
		}

		return node.children.flatMap(getTerminalRooms);
	}

	if (!node.room) {
		throw new Error("Terminal partition is missing its room");
	}

	return [node.room];
};

export const getRegionArea = (region: Region): number => {
	const rowCount = region.endRow - region.startRow + 1;
	const colCount = region.endCol - region.startCol + 1;

	return rowCount * colCount;
};

export const makeRegion = (dungeon: string[][] | undefined): Region => {
	if (!dungeon) {
		throw new Error("Dungeon is undefined");
	}

	return {
		startRow: 0,
		endRow: dungeon.length - 1,
		startCol: 0,
		endCol: dungeon[0].length - 1,
	};
};
