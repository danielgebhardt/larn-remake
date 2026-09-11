import { describe, expect, it } from "vitest";
import {
	dungeon,
	FLOOR,
	getDungeonCoordinateValue,
	WALL,
} from "../LayoutTiles.ts";

describe("LayoutTiles Tests", () => {
	it("should return a # for WALL values in dungeon map", () => {
		expect(getDungeonCoordinateValue(0, 0, dungeon)).toBe(WALL);
		expect(getDungeonCoordinateValue(1, 4, dungeon)).toBe(WALL);
		expect(getDungeonCoordinateValue(2, 0, dungeon)).toBe(WALL);
	});

	it("should return a . for FLOOR values in dungeon map", () => {
		expect(getDungeonCoordinateValue(1, 1, dungeon)).toBe(FLOOR);
		expect(getDungeonCoordinateValue(2, 1, dungeon)).toBe(FLOOR);
		expect(getDungeonCoordinateValue(3, 2, dungeon)).toBe(FLOOR);
	});

	it("should return undefined for range outside of dungeon", () => {
		expect(getDungeonCoordinateValue(6, 6, dungeon)).toBeUndefined();
		expect(getDungeonCoordinateValue(-1, 3, dungeon)).toBeUndefined();
		expect(getDungeonCoordinateValue(3, -1, dungeon)).toBeUndefined();
	});

	it("should expose the expected fixed dungeon layout", () => {
		expect(dungeon).toEqual([
			[WALL, WALL, WALL, WALL, WALL],
			[WALL, FLOOR, FLOOR, FLOOR, WALL],
			[WALL, FLOOR, WALL, FLOOR, WALL],
			[WALL, FLOOR, FLOOR, FLOOR, WALL],
			[WALL, WALL, WALL, WALL, WALL],
		]);
	});
});
