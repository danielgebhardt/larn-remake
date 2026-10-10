import type { PartitionNode, Region } from "./Partitioning.ts";
import {
	DEFAULT_RUN_CONFIGURATION,
	type RoomConfiguration,
} from "./RunConfiguration.ts";

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
	{
		minRoomSize,
		maxRoomAspectRatio,
	}: RoomConfiguration = DEFAULT_RUN_CONFIGURATION,
): Room => {
	if (!Number.isInteger(minRoomSize) || minRoomSize < 1) {
		throw new RangeError("minRoomSize must be a positive integer");
	}
	if (!Number.isFinite(maxRoomAspectRatio) || maxRoomAspectRatio < 1) {
		throw new RangeError("maxRoomAspectRatio must be finite and at least 1");
	}
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

	const availableHeight = maxRow - minRow + 1;
	const availableWidth = maxCol - minCol + 1;
	// Small interiors relax the minimum only on the constrained axis. Cap the
	// other axis so those rooms still satisfy the aspect ratio.
	const maxHeight = Math.min(
		availableHeight,
		Math.floor(availableWidth * maxRoomAspectRatio),
	);
	const minHeight = Math.min(minRoomSize, maxHeight);
	const roomHeight = random
		? minHeight + Math.floor(random() * (maxHeight - minHeight + 1))
		: maxHeight;
	const maxWidth = Math.min(
		availableWidth,
		Math.floor(roomHeight * maxRoomAspectRatio),
	);
	const minWidth = Math.max(
		Math.min(minRoomSize, maxWidth),
		Math.ceil(roomHeight / maxRoomAspectRatio),
	);
	const roomWidth = random
		? minWidth + Math.floor(random() * (maxWidth - minWidth + 1))
		: maxWidth;

	const startRow =
		minRow +
		(random ? Math.floor(random() * (availableHeight - roomHeight + 1)) : 0);
	const startCol =
		minCol +
		(random ? Math.floor(random() * (availableWidth - roomWidth + 1)) : 0);

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
	roomConfiguration: RoomConfiguration = DEFAULT_RUN_CONFIGURATION,
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
			roomConfiguration,
		);
		updatedPartition.children[1] = assignRoomsToPartition(
			partition.children[1],
			padding,
			random,
			roomConfiguration,
		);
	} else {
		updatedPartition.room = createRoom(
			updatedPartition.region,
			padding,
			random,
			roomConfiguration,
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
