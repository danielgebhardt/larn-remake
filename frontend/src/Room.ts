import type { Region } from "./Partitioning.ts";

export type Room = {
	startRow: number;
	startCol: number;
	endRow: number;
	endCol: number;
};

export const createRoom = (region: Region, padding: number): Room => {
	const startRow = region.startRow + padding;
	const endRow = region.endRow - padding;
	const startCol = region.startCol + padding;
	const endCol = region.endCol - padding;

	if (!Number.isInteger(padding) || padding < 0) {
		throw new RangeError("padding must be zero or a positive integer");
	}

	if (endRow - startRow < 1 || endCol - startCol < 1) {
		throw new RangeError("region is too small for the configured padding");
	}

	return {
		startRow,
		endRow,
		startCol,
		endCol,
	};
};
