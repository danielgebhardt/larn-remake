import { describe, expect, it } from "vitest";
import { FLOOR, getDungeonCoordinateValue, WALL } from "../LayoutTiles.ts";

describe("LayoutTiles Tests", () => {
	const testDungeon: string[][] = [
		[WALL, WALL, WALL, WALL, WALL],
		[WALL, FLOOR, FLOOR, FLOOR, WALL],
		[WALL, FLOOR, WALL, FLOOR, WALL],
		[WALL, FLOOR, FLOOR, FLOOR, WALL],
		[WALL, WALL, WALL, WALL, WALL],
	];

	it("should return a # for WALL values in dungeon map", () => {
		expect(getDungeonCoordinateValue(0, 0, testDungeon)).toBe("#");
	});

	it("should return a . for FLOOR values in dungeon map", () => {
		expect(getDungeonCoordinateValue(1, 1, testDungeon)).toBe(".");
	});

	it("should return undefined for range outside of dungeon", () => {
		expect(getDungeonCoordinateValue(6, 6, testDungeon)).toBe(undefined);
	});
});
