import { selectPlayerStart } from "../dungeon/DungeonLocations";
import { type DungeonRun, hashStringToUint32 } from "../dungeon/DungeonRun";
import type { Coordinate } from "../dungeon/DungeonTypes";
import { createSeededRandom } from "../dungeon/Seed";
import { FLOOR } from "../dungeon/Tiles";
import type { Monster } from "../monsters/Monster";
import type { FloorItem } from "./FloorItems";

const same = (a: Coordinate, b: Coordinate) =>
	a.row === b.row && a.col === b.col;
const key = (point: Coordinate) => `${point.row}:${point.col}`;
export const spawnRunQuestItems = (
	run: DungeonRun,
	monsters: readonly Monster[],
	loot: readonly FloorItem[],
): readonly FloorItem[] => {
	const floor = run.floors[run.floors.length - 1];
	const entry = floor.upStair?.coordinate ?? selectPlayerStart(floor);
	const reached = new Set([key(entry)]);
	const queue = [entry];
	for (let index = 0; index < queue.length; index++) {
		const point = queue[index];
		for (const [dr, dc] of [
			[-1, 0],
			[0, 1],
			[1, 0],
			[0, -1],
		]) {
			const next = { row: point.row + dr, col: point.col + dc };
			if (
				floor.terrain[next.row]?.[next.col] !== FLOOR ||
				reached.has(key(next))
			)
				continue;
			reached.add(key(next));
			queue.push(next);
		}
	}
	const occupied = (point: Coordinate) =>
		monsters.some(
			(x) => x.floorNumber === floor.floorNumber && same(x.coordinate, point),
		);
	const stairs = (point: Coordinate) =>
		[floor.upStair?.coordinate, floor.downStair?.coordinate].some(
			(x) => x && same(x, point),
		);
	const available = queue.filter(
		(point) =>
			!same(point, entry) &&
			!stairs(point) &&
			!occupied(point) &&
			!loot.some(
				(x) => x.floorNumber === floor.floorNumber && same(x.coordinate, point),
			),
	);
	const rooms = available.filter((point) =>
		floor.rooms.some(
			(room) =>
				point.row >= room.startRow &&
				point.row <= room.endRow &&
				point.col >= room.startCol &&
				point.col <= room.endCol,
		),
	);
	// Normal maps use a separate room tile. Tiny fixtures may need the entry tile,
	// which remains reachable and pickable even underneath the player/stair icon.
	const candidates = rooms.length
		? rooms
		: available.length
			? available
			: queue.filter((point) => !occupied(point));
	if (candidates.length === 0)
		throw new RangeError("No reachable tile for the cure.");
	const random = createSeededRandom(
		hashStringToUint32(`${run.seed}:${floor.floorNumber}:quest:cure`),
	);
	const coordinate = available.length
		? candidates[Math.floor(random() * candidates.length)]
		: !occupied(entry)
			? entry
			: candidates[0];
	return [
		{
			item: { id: "quest:cure", kind: "cure" },
			floorNumber: floor.floorNumber,
			coordinate: { ...coordinate },
		},
	];
};
