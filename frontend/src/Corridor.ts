import type { Coordinate } from "./LayoutTiles.ts";
import type { Room } from "./Room.ts";

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

	const corridor: Corridor = [];

	for (let i = room1Endpoint.col + 1; i < room2Endpoint.col; i++) {
		corridor.push({
			row: room1Endpoint.row,
			col: i,
		});
	}

	for (let i = room1Endpoint.row + 1; i < room2Endpoint.row; i++) {
		corridor.push({
			col: room1Endpoint.col,
			row: i,
		});
	}

	return corridor;
};
