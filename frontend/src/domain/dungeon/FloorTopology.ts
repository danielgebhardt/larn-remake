import type { Coordinate, Dungeon } from "./DungeonTypes";
import { FLOOR } from "./Tiles";

const neighbors = (terrain: Dungeon, index: number): number[] => {
	const cols = terrain[0].length,
		row = Math.floor(index / cols),
		col = index % cols;
	const adjacent: number[] = [];
	if (terrain[row - 1]?.[col] === FLOOR) adjacent.push(index - cols);
	if (terrain[row]?.[col + 1] === FLOOR) adjacent.push(index + 1);
	if (terrain[row + 1]?.[col] === FLOOR) adjacent.push(index + cols);
	if (terrain[row]?.[col - 1] === FLOOR) adjacent.push(index - 1);
	return adjacent;
};

// -1 includes walls and disconnected floor tiles. A cursor keeps BFS linear.
export const floorDistances = (
	terrain: Dungeon,
	start: Coordinate,
): Int32Array => {
	const cols = terrain[0]?.length ?? 0,
		size = terrain.length * cols;
	const distances = new Int32Array(size).fill(-1);
	if (terrain[start.row]?.[start.col] !== FLOOR) return distances;
	const origin = start.row * cols + start.col;
	const queue = new Int32Array(size);
	queue[0] = origin;
	distances[origin] = 0;
	let end = 1;
	for (let cursor = 0; cursor < end; cursor++) {
		const current = queue[cursor];
		for (const next of neighbors(terrain, current)) {
			if (distances[next] !== -1) continue;
			distances[next] = distances[current] + 1;
			queue[end++] = next;
		}
	}
	return distances;
};

// Iterative articulation-point search: removing a counted tile disconnects
// its walkable component. Avoid recursive calls on maximum-size corridors.
export const countFloorBottlenecks = (terrain: Dungeon): number => {
	const cols = terrain[0]?.length ?? 0,
		size = terrain.length * cols;
	const discovered = new Int32Array(size).fill(-1),
		low = new Int32Array(size),
		parent = new Int32Array(size).fill(-1),
		children = new Int32Array(size),
		cuts = new Uint8Array(size);
	let clock = 0;
	for (let root = 0; root < size; root++) {
		if (
			terrain[Math.floor(root / cols)][root % cols] !== FLOOR ||
			discovered[root] !== -1
		)
			continue;
		discovered[root] = low[root] = clock++;
		const stack = [
			{ node: root, adjacent: neighbors(terrain, root), cursor: 0 },
		];
		while (stack.length) {
			const frame = stack[stack.length - 1],
				current = frame.node;
			if (frame.cursor < frame.adjacent.length) {
				const next = frame.adjacent[frame.cursor++];
				if (discovered[next] === -1) {
					parent[next] = current;
					children[current]++;
					discovered[next] = low[next] = clock++;
					stack.push({
						node: next,
						adjacent: neighbors(terrain, next),
						cursor: 0,
					});
				} else if (next !== parent[current])
					low[current] = Math.min(low[current], discovered[next]);
			} else {
				stack.pop();
				const ancestor = parent[current];
				if (ancestor === -1) {
					if (children[current] > 1) cuts[current] = 1;
				} else {
					low[ancestor] = Math.min(low[ancestor], low[current]);
					if (parent[ancestor] !== -1 && low[current] >= discovered[ancestor])
						cuts[ancestor] = 1;
				}
			}
		}
	}
	return cuts.reduce((sum, n) => sum + n, 0);
};
