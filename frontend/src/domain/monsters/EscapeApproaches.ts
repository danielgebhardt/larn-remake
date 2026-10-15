import type { DungeonFloor } from "../dungeon/DungeonRun";
import type { Coordinate } from "../dungeon/DungeonTypes";
import { coordinateKey } from "./MonsterLocations";

// Two traversals per wave. Door tiles remain part of the route; sealed rooms do not.
export const approachDistances = (
	floor: DungeonFloor,
	start: Coordinate,
	sealed: ReadonlySet<string>,
) => {
	const distances = new Map<string, number>([[coordinateKey(start), 0]]);
	const queue = [start];
	for (let index = 0; index < queue.length; index++) {
		const point = queue[index];
		const distance = distances.get(coordinateKey(point)) ?? 0;
		for (const [dr, dc] of [
			[-1, 0],
			[0, 1],
			[1, 0],
			[0, -1],
		]) {
			const next = { row: point.row + dr, col: point.col + dc };
			const key = coordinateKey(next);
			if (
				floor.terrain[next.row]?.[next.col] !== "." ||
				sealed.has(key) ||
				distances.has(key)
			)
				continue;
			distances.set(key, distance + 1);
			queue.push(next);
		}
	}
	return distances;
};
