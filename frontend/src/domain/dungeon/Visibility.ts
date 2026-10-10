import type { Coordinate, Dungeon } from "./DungeonTypes.ts";
import { FOG_RADIUS_LIMITS } from "./RunConfiguration.ts";
import { FLOOR, WALL } from "./Tiles.ts";

export type VisibilityGrid = readonly (readonly boolean[])[];

// Trace from tile center to tile center. Integer boundary comparisons avoid
// floating-point corner ambiguity and work identically in every direction.
export const hasLineOfSight = (
	terrain: Dungeon,
	origin: Coordinate,
	target: Coordinate,
): boolean => {
	let row = origin.row;
	let col = origin.col;
	const rowDistance = Math.abs(target.row - row);
	const colDistance = Math.abs(target.col - col);
	const rowStep = Math.sign(target.row - row);
	const colStep = Math.sign(target.col - col);
	let crossedRows = 0;
	let crossedCols = 0;
	const opaque = (r: number, c: number) =>
		terrain[r]?.[c] === undefined || terrain[r][c] === WALL;

	while (row !== target.row || col !== target.col) {
		const colBoundary = (2 * crossedCols + 1) * rowDistance;
		const rowBoundary = (2 * crossedRows + 1) * colDistance;
		if (colBoundary === rowBoundary) {
			if (opaque(row + rowStep, col) && opaque(row, col + colStep))
				return false;
			row += rowStep;
			col += colStep;
			crossedRows++;
			crossedCols++;
		} else if (colBoundary < rowBoundary) {
			col += colStep;
			crossedCols++;
		} else {
			row += rowStep;
			crossedRows++;
		}
		// The first wall is visible; only tiles beyond it are hidden.
		if (row === target.row && col === target.col) return true;
		if (opaque(row, col)) return false;
	}
	return true;
};

export const calculateVisibility = (
	terrain: Dungeon,
	origin: Coordinate,
	radius: number,
): VisibilityGrid => {
	if (
		!Number.isInteger(radius) ||
		radius < FOG_RADIUS_LIMITS.min ||
		radius > FOG_RADIUS_LIMITS.max
	) {
		throw new RangeError(
			`Visibility radius must be a whole number from ${FOG_RADIUS_LIMITS.min} to ${FOG_RADIUS_LIMITS.max}`,
		);
	}
	if (
		!Number.isInteger(origin.row) ||
		!Number.isInteger(origin.col) ||
		terrain[origin.row]?.[origin.col] !== FLOOR
	) {
		throw new RangeError("Visibility origin must be an in-bounds floor tile");
	}
	const visible = terrain.map((row) => row.map(() => false));
	for (
		let row = Math.max(0, origin.row - radius);
		row <= Math.min(terrain.length - 1, origin.row + radius);
		row++
	) {
		for (
			let col = Math.max(0, origin.col - radius);
			col <= Math.min(terrain[row].length - 1, origin.col + radius);
			col++
		) {
			if ((row - origin.row) ** 2 + (col - origin.col) ** 2 <= radius ** 2) {
				visible[row][col] = hasLineOfSight(terrain, origin, { row, col });
			}
		}
	}
	return visible;
};
