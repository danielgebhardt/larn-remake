// @vitest-environment node

import { describe, expect, it } from "vitest";
import { FLOOR, WALL } from "../domain/dungeon/Tiles.ts";
import { calculateVisibility } from "../domain/dungeon/Visibility.ts";

const openRoom = (rows = 7, cols = 9) =>
	Array.from({ length: rows }, () => Array<string>(cols).fill(FLOOR));

describe("Dungeon visibility", () => {
	it("includes the player and tiles inside a circular radius", () => {
		const visible = calculateVisibility(openRoom(), { row: 3, col: 4 }, 2);
		expect(visible[3][4]).toBe(true);
		expect(visible[3][6]).toBe(true);
		expect(visible[4][5]).toBe(true);
		expect(visible[5][6]).toBe(false);
		expect(visible[3][7]).toBe(false);
	});

	it("shows the first wall but hides the floor and walls behind it", () => {
		const terrain = openRoom();
		for (const row of terrain) row[4] = WALL;
		terrain[3][6] = WALL;
		const visible = calculateVisibility(terrain, { row: 3, col: 2 }, 6);
		expect(visible[3][4]).toBe(true);
		expect(visible[3][5]).toBe(false);
		expect(visible[3][6]).toBe(false);
		expect(visible[2][3]).toBe(true);
	});

	it.each([
		{ direction: "up", rowStep: -1, colStep: 0 },
		{ direction: "down", rowStep: 1, colStep: 0 },
		{ direction: "left", rowStep: 0, colStep: -1 },
		{ direction: "right", rowStep: 0, colStep: 1 },
	])("blocks sight beyond a wall to the $direction", ({ rowStep, colStep }) => {
		const terrain = openRoom(7, 7);
		const origin = { row: 3, col: 3 };
		const wall = { row: 3 + rowStep, col: 3 + colStep };
		const behind = { row: 3 + 2 * rowStep, col: 3 + 2 * colStep };
		terrain[wall.row][wall.col] = WALL;
		const visible = calculateVisibility(terrain, origin, 6);
		expect(visible[wall.row][wall.col]).toBe(true);
		expect(visible[behind.row][behind.col]).toBe(false);
	});

	it("does not see through a diagonal crack between two walls", () => {
		const terrain = openRoom(3, 3);
		terrain[0][1] = WALL;
		terrain[1][0] = WALL;
		const visible = calculateVisibility(terrain, { row: 0, col: 0 }, 3);
		expect(visible[0][1]).toBe(true);
		expect(visible[1][0]).toBe(true);
		expect(visible[1][1]).toBe(false);
		expect(visible[2][2]).toBe(false);
	});

	it("can see past an open side of a corner", () => {
		const terrain = openRoom(3, 3);
		terrain[0][1] = WALL;
		expect(calculateVisibility(terrain, { row: 0, col: 0 }, 3)[1][1]).toBe(
			true,
		);
	});

	it.each([
		{ row: 0, col: 0 },
		{ row: 2, col: 8 },
	])("clips visibility to rectangular map edges from $row,$col", (origin) => {
		const visible = calculateVisibility(openRoom(3, 9), origin, 20);
		expect(visible).toHaveLength(3);
		expect(visible.every((row) => row.length === 9 && row.every(Boolean))).toBe(
			true,
		);
	});

	it("is repeatable and leaves terrain unchanged", () => {
		const terrain = openRoom();
		const before = structuredClone(terrain);
		for (const row of terrain) Object.freeze(row);
		Object.freeze(terrain);
		const origin = { row: 3, col: 4 };
		expect(calculateVisibility(terrain, origin, 6)).toEqual(
			calculateVisibility(terrain, origin, 6),
		);
		expect(terrain).toEqual(before);
	});

	it.each([0, -1, 1.5, 21, Number.NaN, Number.POSITIVE_INFINITY])(
		"rejects invalid radius %s",
		(radius) => {
			expect(() =>
				calculateVisibility(openRoom(), { row: 1, col: 1 }, radius),
			).toThrow(RangeError);
		},
	);

	it.each([
		{ row: -1, col: 0 },
		{ row: 7, col: 0 },
		{ row: 0.5, col: 1 },
	])("rejects invalid player origin $row,$col", (origin) => {
		expect(() => calculateVisibility(openRoom(), origin, 6)).toThrow(
			RangeError,
		);
	});

	it("rejects a player origin inside a wall", () => {
		expect(() => calculateVisibility([[WALL]], { row: 0, col: 0 }, 6)).toThrow(
			RangeError,
		);
	});
});
