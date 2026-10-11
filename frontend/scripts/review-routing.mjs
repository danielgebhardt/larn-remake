const steps = [
	["up", -1, 0],
	["right", 0, 1],
	["down", 1, 0],
	["left", 0, -1],
];
const key = (p) => `${p.row}:${p.col}`;

// One breadth-first traversal per decision, instead of one per possible target.
// Stairs may be endpoints, but never intermediate tiles: entering one changes floors.
export function createRoutes(floor, start) {
	const stairs = new Set(
		[floor.upStair?.coordinate, floor.downStair?.coordinate]
			.filter(Boolean)
			.map(key),
	);
	const parents = new Map([[key(start), null]]);
	const queue = [start];
	for (let index = 0; index < queue.length; index++) {
		const point = queue[index];
		for (const [direction, dr, dc] of steps) {
			const next = { row: point.row + dr, col: point.col + dc };
			const nextKey = key(next);
			if (floor.terrain[next.row]?.[next.col] !== "." || parents.has(nextKey))
				continue;
			parents.set(nextKey, { previous: key(point), direction });
			if (!stairs.has(nextKey)) queue.push(next);
		}
	}
	return (target) => {
		let current = key(target);
		if (!parents.has(current)) return null;
		const path = [];
		while (parents.get(current)) {
			const { previous, direction } = parents.get(current);
			path.push(direction);
			current = previous;
		}
		return path.reverse();
	};
}
