import type { Coordinate, LocationSelectionSource } from "./DungeonTypes.ts";
import type { Room } from "./Room.ts";
import { FLOOR } from "./Tiles.ts";

// A valid single-room floor may have no tile distinct from its entry.
export class NoDistinctStairLocationError extends RangeError {}

const getRoomCenter = (room: Room) => {
	return {
		row: Math.floor((room.startRow + room.endRow) / 2),
		col: Math.floor((room.startCol + room.endCol) / 2),
	};
};

const roomContains = (room: Room, { row, col }: Coordinate): boolean =>
	row >= room.startRow &&
	row <= room.endRow &&
	col >= room.startCol &&
	col <= room.endCol;

const stairCandidates = (
	dungeon: LocationSelectionSource,
	room: Room,
	entry: Coordinate,
) => {
	const floorTiles: Coordinate[] = [];
	const clearTiles: Coordinate[] = [];
	for (let row = room.startRow; row <= room.endRow; row++) {
		for (let col = room.startCol; col <= room.endCol; col++) {
			if (
				dungeon.terrain[row]?.[col] !== FLOOR ||
				(row === entry.row && col === entry.col)
			)
				continue;
			const tile = { row, col };
			floorTiles.push(tile);
			// A floor neighbor outside the room is a corridor entrance. Leave
			// its first room tile free so entering the room cannot force travel.
			const opensToCorridor = [
				{ row: row - 1, col },
				{ row: row + 1, col },
				{ row, col: col - 1 },
				{ row, col: col + 1 },
			].some(
				(neighbor) =>
					!roomContains(room, neighbor) &&
					dungeon.terrain[neighbor.row]?.[neighbor.col] === FLOOR,
			);
			if (!opensToCorridor) clearTiles.push(tile);
		}
	}
	return { room, floorTiles, clearTiles };
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

	const entryRoom = dungeon.rooms.find((room) =>
		roomContains(room, entryCoordinate),
	);

	if (!entryRoom) {
		throw new RangeError(
			"Invalid start point. Starting point is not in a room.",
		);
	}

	const otherRooms = dungeon.rooms.filter((room) => room !== entryRoom);
	const rooms = otherRooms.length > 0 ? otherRooms : [entryRoom];
	const candidatesByRoom = rooms.map((room) =>
		stairCandidates(dungeon, room, entryCoordinate),
	);
	const clearRooms = candidatesByRoom.filter(
		(candidate) => candidate.clearTiles.length > 0,
	);
	// Tiny authored floors can have no clear tile. Preserve their ability to
	// link floors, preferring clear entrances whenever the geometry allows it.
	const eligibleRooms =
		clearRooms.length > 0
			? clearRooms
			: candidatesByRoom.filter((candidate) => candidate.floorTiles.length > 0);
	if (eligibleRooms.length === 0) {
		if (otherRooms.length === 0) {
			throw new NoDistinctStairLocationError(
				"No valid coordinate available for staircase",
			);
		}
		throw new RangeError("No valid coordinate available for staircase");
	}
	// Choose rooms equally, then choose a clear floor tile in that room.
	// A single-room floor keeps its deterministic, randomness-free fallback.
	const randomized = random && otherRooms.length > 0;
	const selected = randomized
		? eligibleRooms[Math.floor(random() * eligibleRooms.length)]
		: eligibleRooms[eligibleRooms.length - 1];
	const candidates =
		clearRooms.length > 0 ? selected.clearTiles : selected.floorTiles;
	if (randomized) return candidates[Math.floor(random() * candidates.length)];
	const center = getRoomCenter(selected.room);
	return (
		candidates.find(
			(tile) => tile.row === center.row && tile.col === center.col,
		) ?? candidates[0]
	);
};
