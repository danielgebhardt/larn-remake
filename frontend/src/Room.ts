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

export const getRepresentativeRoom = (partition: PartitionNode): Room => {
	if (!partition.children) {
		if (!partition.room) {
			throw new Error("Terminal partition does not contain a room");
		}

		return partition.room;
	}

	return getRepresentativeRoom(partition.children[0]);
};
