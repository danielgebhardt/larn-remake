import { describe, expect, it } from "vitest";
import {
	FLOOR,
	getDungeonCoordinateValue,
	startingDungeon,
	WALL,
} from "../LayoutTiles.ts";

describe("LayoutTiles Tests", () => {
	it("should return a # for WALL values in dungeon map", () => {
		expect(getDungeonCoordinateValue(0, 0, startingDungeon)).toBe(WALL);
		expect(getDungeonCoordinateValue(1, 4, startingDungeon)).toBe(WALL);
		expect(getDungeonCoordinateValue(2, 0, startingDungeon)).toBe(WALL);
	});

	it("should return a . for FLOOR values in dungeon map", () => {
		expect(getDungeonCoordinateValue(1, 1, startingDungeon)).toBe(FLOOR);
		expect(getDungeonCoordinateValue(2, 1, startingDungeon)).toBe(FLOOR);
		expect(getDungeonCoordinateValue(3, 2, startingDungeon)).toBe(FLOOR);
	});

	it("should return undefined for range outside of dungeon", () => {
		expect(getDungeonCoordinateValue(6, 6, startingDungeon)).toBeUndefined();
		expect(getDungeonCoordinateValue(-1, 3, startingDungeon)).toBeUndefined();
		expect(getDungeonCoordinateValue(3, -1, startingDungeon)).toBeUndefined();
	});

	it("should expose the expected fixed dungeon layout", () => {
		expect(startingDungeon).toEqual([
			[WALL, WALL, WALL, WALL, WALL],
			[WALL, FLOOR, FLOOR, FLOOR, WALL],
			[WALL, FLOOR, WALL, FLOOR, WALL],
			[WALL, FLOOR, FLOOR, FLOOR, WALL],
			[WALL, WALL, WALL, WALL, WALL],
		]);
	});
});
