import type { DungeonRun } from "./DungeonRun.ts";
import type { Coordinate, Dungeon } from "./DungeonTypes.ts";
import { calculateVisibility, type VisibilityGrid } from "./Visibility.ts";

export type ExplorationState = {
	activeFloor: number;
	terrain: Dungeon;
	origin: Coordinate;
	radius: number;
	visible: VisibilityGrid;
	explored: ReadonlyMap<number, VisibilityGrid>;
};

const preserveRows = (
	next: VisibilityGrid,
	previous?: VisibilityGrid,
): VisibilityGrid => {
	if (!previous) return next;
	const rows = next.map((row, index) => {
		const old = previous[index];
		return old?.length === row.length &&
			row.every((value, col) => value === old[col])
			? old
			: row;
	});
	return rows.length === previous.length &&
		rows.every((row, index) => row === previous[index])
		? previous
		: rows;
};

// Start a fresh exploration by omitting previous. Otherwise, only the active
// floor is updated; other floors retain their discovery and row identities.
export const updateExploration = (
	run: DungeonRun,
	radius: number,
	previous?: ExplorationState,
): ExplorationState => {
	const floor = run.floors[run.activeFloor - 1];
	if (!Number.isInteger(run.activeFloor) || !floor)
		throw new RangeError("Cannot explore a missing active floor");
	if (
		previous?.terrain === floor.terrain &&
		previous.activeFloor === run.activeFloor &&
		previous.radius === radius &&
		previous.origin.row === run.playerCoordinate.row &&
		previous.origin.col === run.playerCoordinate.col
	)
		return previous;

	const visible = preserveRows(
		calculateVisibility(floor.terrain, run.playerCoordinate, radius),
		previous?.activeFloor === run.activeFloor ? previous.visible : undefined,
	);
	const oldExplored = previous?.explored.get(run.activeFloor);
	const remembered = preserveRows(
		visible.map((row, index) =>
			row.map((value, col) => value || (oldExplored?.[index]?.[col] ?? false)),
		),
		oldExplored,
	);
	let explored = previous?.explored ?? new Map<number, VisibilityGrid>();
	if (remembered !== oldExplored) {
		explored = new Map(explored).set(run.activeFloor, remembered);
	}
	return {
		activeFloor: run.activeFloor,
		terrain: floor.terrain,
		origin: run.playerCoordinate,
		radius,
		visible,
		explored,
	};
};
