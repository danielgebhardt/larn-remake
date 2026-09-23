import type { Coordinate } from "./LayoutTiles.ts";
import type { PartitionNode, Region } from "./Partitioning.ts";

export type Room = {
	startRow: number;
	startCol: number;
	endRow: number;
	endCol: number;
};

export const createRoom = (region: Region, padding: number): Room => {
	if (!Number.isInteger(padding) || padding < 0) {
		throw new RangeError("padding must be zero or a positive integer");
	}

	const startRow = region.startRow + padding;
	const endRow = region.endRow - padding;
	const startCol = region.startCol + padding;
	const endCol = region.endCol - padding;

	if (endRow < startRow || endCol < startCol) {
		throw new RangeError("region is too small for the configured padding");
	}

	return {
		startRow,
		endRow,
		startCol,
		endCol,
	};
};

export const assignRoomsToPartition = (
	partition: PartitionNode,
	padding: number,
): PartitionNode => {
	const updatedPartition: PartitionNode = {
		region: { ...partition.region },
	};

	if (partition.children) {
		updatedPartition.children = [...partition.children];
		updatedPartition.children[0] = assignRoomsToPartition(
			partition.children[0],
			padding,
		);
		updatedPartition.children[1] = assignRoomsToPartition(
			partition.children[1],
			padding,
		);
	} else {
		updatedPartition.room = createRoom(updatedPartition.region, padding);
	}

	return updatedPartition;
};

export const createCoordinateListFromRoom = (room: Room): Coordinate[] => {
	if (!room) {
		return [];
	}

	const coordinates: Coordinate[] = [];

	for (let row: number = room.startRow; row <= room.endRow; row++) {
		for (let col: number = room.startCol; col <= room.endCol; col++) {
			coordinates.push({ row, col });
		}
	}

	return coordinates;
};

export const createCoordinateListOfAllRooms = (rooms: Room[]): Coordinate[] => {
	if (!rooms) {
		return [];
	}

	const coordinates: Coordinate[] = [];

	for (const room of rooms) {
		coordinates.push(...createCoordinateListFromRoom(room));
	}

	return coordinates;
};
