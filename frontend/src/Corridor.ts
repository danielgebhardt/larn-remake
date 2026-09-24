import type { Coordinate } from "./LayoutTiles.ts";
import type { PartitionNode } from "./Partitioning.ts";
import { getRepresentativeRoom, type Room } from "./Room.ts";

export type Corridor = Coordinate[];

export const getRoomEndpoint = (room: Room): Coordinate => {
	return {
		row: Math.floor((room.startRow + room.endRow) / 2),
		col: Math.floor((room.startCol + room.endCol) / 2),
	};
};

export const createCorridor = (room1: Room, room2: Room): Corridor => {
	const room1Endpoint = getRoomEndpoint(room1);
	const room2Endpoint = getRoomEndpoint(room2);

	const corridor: Corridor = [{ ...room1Endpoint }];

	const horizontalStep = Math.sign(room2Endpoint.col - room1Endpoint.col);

	let currentCol = room1Endpoint.col;

	while (currentCol !== room2Endpoint.col) {
		currentCol += horizontalStep;

		corridor.push({
			row: room1Endpoint.row,
			col: currentCol,
		});
	}

	const verticalStep = Math.sign(room2Endpoint.row - room1Endpoint.row);

	let currentRow = room1Endpoint.row;

	while (currentRow !== room2Endpoint.row) {
		currentRow += verticalStep;

		corridor.push({
			col: currentCol,
			row: currentRow,
		});
	}

	return corridor;
};

export const connectPartitionRooms = (partition: PartitionNode): Corridor[] => {
	if (!partition.children) {
		return [];
	}

	const [firstChild, secondChild] = partition.children;

	const firstChildCorridors = connectPartitionRooms(firstChild);
	const secondChildCorridors = connectPartitionRooms(secondChild);

	const connectingCorridor = createCorridor(
		getRepresentativeRoom(firstChild),
		getRepresentativeRoom(secondChild),
	);

	return [...firstChildCorridors, ...secondChildCorridors, connectingCorridor];
};
