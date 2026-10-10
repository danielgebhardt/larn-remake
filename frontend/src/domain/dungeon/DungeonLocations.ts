import type { Coordinate, LocationSelectionSource } from "./DungeonTypes.ts";
import type { Room } from "./Room.ts";
import { FLOOR } from "./Tiles.ts";

const getRoomCenter = (room: Room) => {
	return {
		row: Math.floor((room.startRow + room.endRow) / 2),
		col: Math.floor((room.startCol + room.endCol) / 2),
	};
};

export const selectPlayerStart = (
	dungeon: LocationSelectionSource,
): Coordinate => {
	const rooms = dungeon.rooms;

	if (rooms.length === 0) {
		throw new RangeError("No eligible rooms for starting point");
	}

	const startingPoint = getRoomCenter(rooms[0]);

	if (dungeon.terrain[startingPoint.row][startingPoint.col] !== FLOOR) {
		throw new RangeError("Invalid start point");
	}

	return startingPoint;
};

export const selectStairLocation = (
	dungeon: LocationSelectionSource,
	entryCoordinate: Coordinate,
	random?: () => number,
): Coordinate => {
	if (
		!Number.isInteger(entryCoordinate.row) ||
		!Number.isInteger(entryCoordinate.col) ||
		dungeon.terrain[entryCoordinate.row]?.[entryCoordinate.col] !== FLOOR
	) {
		throw new RangeError("Invalid start point");
	}

	const entryRoom = dungeon.rooms.find(
		(room) =>
			entryCoordinate.row >= room.startRow &&
			entryCoordinate.row <= room.endRow &&
			entryCoordinate.col >= room.startCol &&
			entryCoordinate.col <= room.endCol,
	);

	if (!entryRoom) {
		throw new RangeError(
			"Invalid start point. Starting point is not in a room.",
		);
	}

	const otherRooms = dungeon.rooms.filter((room) => room !== entryRoom);

	if (otherRooms.length > 0) {
		if (!random) {
			return getRoomCenter(otherRooms[otherRooms.length - 1]);
		}

		// Choose rooms equally, then choose a floor tile in that room.
		const room = otherRooms[Math.floor(random() * otherRooms.length)];
		const candidates: Coordinate[] = [];
		for (let row = room.startRow; row <= room.endRow; row++) {
			for (let col = room.startCol; col <= room.endCol; col++) {
				if (dungeon.terrain[row]?.[col] === FLOOR) {
					candidates.push({ row, col });
				}
			}
		}

		if (candidates.length === 0) {
			throw new RangeError("No valid coordinate available for staircase");
		}
		return candidates[Math.floor(random() * candidates.length)];
	}

	// A single-room floor uses its center, then the first distinct floor tile
	// in row-major order. This constrained fallback consumes no randomness.
	const center = getRoomCenter(entryRoom);
	if (
		(center.row !== entryCoordinate.row ||
			center.col !== entryCoordinate.col) &&
		dungeon.terrain[center.row]?.[center.col] === FLOOR
	) {
		return center;
	}

	for (let row = entryRoom.startRow; row <= entryRoom.endRow; row++) {
		for (let col = entryRoom.startCol; col <= entryRoom.endCol; col++) {
			if (
				(row !== entryCoordinate.row || col !== entryCoordinate.col) &&
				dungeon.terrain[row]?.[col] === FLOOR
			) {
				return { row, col };
			}
		}
	}

	throw new RangeError("No valid coordinate available for staircase");
};
