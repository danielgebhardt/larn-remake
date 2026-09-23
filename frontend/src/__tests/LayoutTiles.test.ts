import { describe, expect, it } from "vitest";
import {
	type Coordinate,
	carveRooms,
	FLOOR,
	fixedDungeon,
	getDungeonCoordinateValue,
	MAX_SIZE,
	makeDungeon,
	WALL,
} from "../LayoutTiles.ts";
import { recursivePartition } from "../Partitioning.ts";
import { assignRoomsToPartition, type Room } from "../Room.ts";
import { getTerminalRooms, makeRegion } from "./testhelpers.ts";

describe("LayoutTiles Tests", () => {
	it("should return a # for WALL values in dungeon map", () => {
		expect(getDungeonCoordinateValue(0, 0, fixedDungeon)).toBe(WALL);
		expect(getDungeonCoordinateValue(1, 4, fixedDungeon)).toBe(WALL);
		expect(getDungeonCoordinateValue(2, 0, fixedDungeon)).toBe(WALL);
	});

	it("should return a . for FLOOR values in dungeon map", () => {
		expect(getDungeonCoordinateValue(1, 1, fixedDungeon)).toBe(FLOOR);
		expect(getDungeonCoordinateValue(2, 1, fixedDungeon)).toBe(FLOOR);
		expect(getDungeonCoordinateValue(3, 2, fixedDungeon)).toBe(FLOOR);
	});

	it("should return undefined for range outside of dungeon", () => {
		expect(getDungeonCoordinateValue(6, 6, fixedDungeon)).toBeUndefined();
		expect(getDungeonCoordinateValue(-1, 3, fixedDungeon)).toBeUndefined();
		expect(getDungeonCoordinateValue(3, -1, fixedDungeon)).toBeUndefined();
	});

	it("should expose the expected fixed dungeon layout", () => {
		expect(fixedDungeon).toEqual([
			[WALL, WALL, WALL, WALL, WALL],
			[WALL, FLOOR, FLOOR, FLOOR, WALL],
			[WALL, FLOOR, WALL, FLOOR, WALL],
			[WALL, FLOOR, FLOOR, FLOOR, WALL],
			[WALL, WALL, WALL, WALL, WALL],
		]);
	});

	it("should return undefined for custom size dungeon with < 1 row or < 1 col>", () => {
		expect(makeDungeon(0, 1)).toBeUndefined();
		expect(makeDungeon(-1, 1)).toBeUndefined();
		expect(makeDungeon(1, 0)).toBeUndefined();
		expect(makeDungeon(1, -1)).toBeUndefined();
	});

	it("should return undefined for custom size dungeon with dimensions greater than MAX_SIZE", () => {
		expect(makeDungeon(MAX_SIZE + 1, 1)).toBeUndefined();
		expect(makeDungeon(1, MAX_SIZE + 1)).toBeUndefined();
	});

	it("should return undefined for custom size dungeon with fractional numbers", () => {
		expect(makeDungeon(1.5, 1)).toBeUndefined();
		expect(makeDungeon(1, 1.3)).toBeUndefined();
	});

	it("should create a custom sized dungeon defaulted to all WALLS", () => {
		const newDungeon = makeDungeon(4, 7);

		expect(newDungeon).toHaveLength(4);
		expect(newDungeon?.[0]).toHaveLength(7);

		if (newDungeon) {
			for (let row = 0; row < 4; row++) {
				for (let col = 0; col < 7; col++) {
					expect(getDungeonCoordinateValue(col, row, newDungeon)).toBe(WALL);
				}
			}
		}
	});

	it("should allow coordinates to change independently", () => {
		const dungeon = makeDungeon(2, 2);

		expect(dungeon).toBeDefined();

		if (!dungeon) {
			throw new Error("Expected dungeon to be created");
		}

		dungeon[0][0] = FLOOR;

		expect(dungeon[0][0]).toBe(FLOOR);
		expect(dungeon[1][0]).toBe(WALL);
	});

	describe("Carve Room tests", () => {
		it("should carve a single room into a wall-filled dungeon", () => {
			const testDungeon = makeDungeon(3, 3);
			const testRegion = makeRegion(testDungeon);
			const partitionTree = recursivePartition(testRegion, 3);
			const partitionsWithRooms = assignRoomsToPartition(partitionTree, 1);
			const rooms: Room[] = getTerminalRooms(partitionsWithRooms);
			const carvedDungeon: string[][] = carveRooms(testDungeon, rooms);

			const expectedWalls: Coordinate[] = [
				{
					row: 0,
					col: 0,
				},
				{
					row: 0,
					col: 1,
				},
				{
					row: 0,
					col: 2,
				},
				{
					row: 1,
					col: 0,
				},
				{
					row: 1,
					col: 2,
				},
				{
					row: 2,
					col: 0,
				},
				{
					row: 2,
					col: 1,
				},
				{
					row: 2,
					col: 2,
				},
			];

			const expectedFloors: Coordinate[] = [
				{
					row: 1,
					col: 1,
				},
			];

			for (const wall of expectedWalls) {
				expect(
					getDungeonCoordinateValue(wall.col, wall.row, carvedDungeon),
				).toBe(WALL);
			}

			for (const floor of expectedFloors) {
				expect(
					getDungeonCoordinateValue(floor.col, floor.row, carvedDungeon),
				).toBe(FLOOR);
			}
		});
	});
});
