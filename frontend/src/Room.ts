import type { PartitionNode, Region } from "./Partitioning.ts";

export type Room = {
	startRow: number;
	startCol: number;
	endRow: number;
	endCol: number;
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

export const createRoom = (
	region: Region,
	padding: number,
	random?: () => number,
): Room => {
	if (!Number.isInteger(padding) || padding < 0) {
		throw new RangeError("padding must be zero or a positive integer");
	}

	const minRow = region.startRow + padding;
	const maxRow = region.endRow - padding;
	const minCol = region.startCol + padding;
	const maxCol = region.endCol - padding;

	if (maxRow < minRow || maxCol < minCol) {
		throw new RangeError("region is too small for the configured padding");
	}

	if (!random) {
		return {
			startRow: minRow,
			endRow: maxRow,
			startCol: minCol,
			endCol: maxCol,
		};
	}

	const availableHeight = maxRow - minRow + 1;
	const availableWidth = maxCol - minCol + 1;

	const roomHeight = Math.floor(random() * availableHeight) + 1;
	const roomWidth = Math.floor(random() * availableWidth) + 1;

	const startRow =
		minRow + Math.floor(random() * (availableHeight - roomHeight + 1));
	const startCol =
		minCol + Math.floor(random() * (availableWidth - roomWidth + 1));

	return {
		startRow,
		endRow: startRow + roomHeight - 1,
		startCol,
		endCol: startCol + roomWidth - 1,
	};
};

export const assignRoomsToPartition = (
	partition: PartitionNode,
	padding: number,
	random?: () => number,
): PartitionNode => {
	const updatedPartition: PartitionNode = {
		region: { ...partition.region },
	};

	if (partition.children) {
		updatedPartition.children = [...partition.children];
		updatedPartition.children[0] = assignRoomsToPartition(
			partition.children[0],
			padding,
			random,
		);
		updatedPartition.children[1] = assignRoomsToPartition(
			partition.children[1],
			padding,
			random,
		);
	} else {
		updatedPartition.room = createRoom(
			updatedPartition.region,
			padding,
			random,
		);
	}

	return updatedPartition;
};

export const getRepresentativeRoom = (partition: PartitionNode): Room => {
	if (!partition.children) {
		if (!partition.room) {
			throw new Error("Terminal partition does not contain a room");
		}

		return partition.room;
	}

	return getRepresentativeRoom(partition.children[0]);
};
