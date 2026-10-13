import { type Corridor, createCorridor, getRoomEndpoint } from "./Corridor";
import type { Dungeon } from "./DungeonTypes";
import { floorDistances } from "./FloorTopology";
import type { Room } from "./Room";
import { LOOP_CORRIDOR_RULES as rules } from "./RunConfiguration";
import { FLOOR, WALL } from "./Tiles";

// Keep nearby shortcuts bounded. The BSP connections remain the connectivity
// guarantee; this independent pass only improves already-connected detours.
export const createRoomLoops = (
	terrain: Dungeon,
	rooms: readonly Room[],
	random: () => number,
): Corridor[] => {
	if (rooms.length < 2) return [];
	const centers = rooms.map(getRoomEndpoint),
		cols = terrain[0].length;
	const seen = new Set<string>();
	const candidates: {
		first: number;
		second: number;
		distance: number;
		score: number;
	}[] = [];
	for (let first = 0; first < rooms.length; first++) {
		const nearby = centers
			.map((center, second) => ({
				second,
				distance:
					Math.abs(center.row - centers[first].row) +
					Math.abs(center.col - centers[first].col),
			}))
			.filter(
				(pair) => pair.second !== first && pair.distance <= rules.maxLength,
			)
			.sort((a, b) => a.distance - b.distance || a.second - b.second)
			.slice(0, rules.nearestRooms);
		for (const { second, distance } of nearby) {
			const key = [Math.min(first, second), Math.max(first, second)].join(":");
			if (seen.has(key)) continue;
			seen.add(key);
			candidates.push({
				first,
				second,
				distance,
				score: distance + random() * rules.candidateJitter,
			});
		}
	}
	candidates.sort(
		(a, b) => a.score - b.score || a.first - b.first || a.second - b.second,
	);
	const limit = Math.min(
		rules.maxPerFloor,
		Math.max(1, Math.floor(rooms.length / rules.roomsPerLoop)),
	);
	const working = terrain.map((row) => [...row]);
	const distances = new Map<number, Int32Array>();
	const loops: Corridor[] = [];
	for (const pair of candidates) {
		let paths = distances.get(pair.first);
		if (!paths) {
			paths = floorDistances(working, centers[pair.first]);
			distances.set(pair.first, paths);
		}
		const endpoint = centers[pair.second],
			existing = paths[endpoint.row * cols + endpoint.col];
		if (
			existing < 0 ||
			existing - pair.distance < rules.minSavedSteps ||
			existing < pair.distance * rules.minDetourRatio
		)
			continue;
		const path =
			random() < 0.5
				? createCorridor(rooms[pair.first], rooms[pair.second])
				: createCorridor(rooms[pair.second], rooms[pair.first]).reverse();
		if (!path.some((cell) => working[cell.row][cell.col] === WALL)) continue;
		for (const cell of path) working[cell.row][cell.col] = FLOOR;
		loops.push(path);
		distances.clear();
		if (loops.length === limit) break;
	}
	return loops;
};
