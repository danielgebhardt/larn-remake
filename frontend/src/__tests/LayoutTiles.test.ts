import { describe, expect, it } from "vitest";
import { type Corridor, createCorridor } from "../Corridor.ts";
import {
	carveCorridor,
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

			const expectedDungeon: string[][] = [
				[WALL, WALL, WALL],
				[WALL, FLOOR, WALL],
				[WALL, WALL, WALL],
			];

			expect(carvedDungeon).toStrictEqual(expectedDungeon);
		});

		it("should carve every tile inside a hand-built multi-tile room", () => {
			const testDungeon = makeDungeon(5, 6);

			const testRoom: Room = {
				startRow: 1,
				endRow: 3,
				startCol: 2,
				endCol: 4,
			};

			const carvedDungeon = carveRooms(testDungeon, [testRoom]);

			const expectedDungeon: string[][] = [
				[WALL, WALL, WALL, WALL, WALL, WALL],
				[WALL, WALL, FLOOR, FLOOR, FLOOR, WALL],
				[WALL, WALL, FLOOR, FLOOR, FLOOR, WALL],
				[WALL, WALL, FLOOR, FLOOR, FLOOR, WALL],
				[WALL, WALL, WALL, WALL, WALL, WALL],
			];

			expect(carvedDungeon).toStrictEqual(expectedDungeon);
		});

		it("should throw RangeError when any room is outside the dungeon bounds", () => {
			const testDungeon = makeDungeon(2, 3);

			const testRoomOutsideRows: Room = {
				startRow: 1,
				endRow: 3,
				startCol: 0,
				endCol: 1,
			};

			const testRoomOutsideCols: Room = {
				startRow: 0,
				endRow: 1,
				startCol: 1,
				endCol: 4,
			};

			const testRoomOutsideBoth: Room = {
				startRow: 2,
				endRow: 4,
				startCol: 1,
				endCol: 5,
			};

			const testRoomOutsideNegativeCoordinates: Room = {
				startRow: -1,
				endRow: 1,
				startCol: 0,
				endCol: 1,
			};

			for (const invalidRoom of [
				testRoomOutsideRows,
				testRoomOutsideCols,
				testRoomOutsideBoth,
				testRoomOutsideNegativeCoordinates,
			]) {
				expect(() => carveRooms(testDungeon, [invalidRoom])).toThrow(
					new RangeError("room is outside dungeon bounds"),
				);
			}
		});

		it("should carve multiple separated rooms while leaving walls between them", () => {
			const testDungeon = makeDungeon(5, 9);

			const rooms: Room[] = [
				{
					startRow: 1,
					endRow: 3,
					startCol: 1,
					endCol: 2,
				},
				{
					startRow: 1,
					endRow: 3,
					startCol: 6,
					endCol: 7,
				},
			];

			const carvedDungeon = carveRooms(testDungeon, rooms);

			const expectedDungeon: string[][] = [
				[WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL],
				[WALL, FLOOR, FLOOR, WALL, WALL, WALL, FLOOR, FLOOR, WALL],
				[WALL, FLOOR, FLOOR, WALL, WALL, WALL, FLOOR, FLOOR, WALL],
				[WALL, FLOOR, FLOOR, WALL, WALL, WALL, FLOOR, FLOOR, WALL],
				[WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL, WALL],
			];

			expect(carvedDungeon).toStrictEqual(expectedDungeon);
		});

		it("should not modify the original dungeon", () => {
			const testDungeon = makeDungeon(5, 9);
			const rooms: Room[] = [
				{
					startRow: 1,
					endRow: 3,
					startCol: 1,
					endCol: 2,
				},
			];

			const originalDungeon = structuredClone(testDungeon);

			const carvedDungeon = carveRooms(testDungeon, rooms);

			expect(testDungeon).toStrictEqual(originalDungeon);
			expect(carvedDungeon).not.toBe(testDungeon);
			expect(carvedDungeon[1]).not.toBe(testDungeon?.[1]);

			expect(testDungeon?.[1][1]).toBe(WALL);
			expect(carvedDungeon[1][1]).toBe(FLOOR);
		});

		it("should not modify the supplied rooms", () => {
			const testDungeon = makeDungeon(5, 9);
			const rooms: Room[] = [
				{
					startRow: 1,
					endRow: 3,
					startCol: 1,
					endCol: 2,
				},
			];

			const originalRooms = structuredClone(rooms);
			const originalRoomReference = rooms[0];

			carveRooms(testDungeon, rooms);

			expect(originalRooms).toStrictEqual(rooms);
			expect(rooms[0]).toBe(originalRoomReference);
		});

		it("should leave the original dungeon unchanged when one of multiple rooms is invalid", () => {
			const testDungeon = makeDungeon(2, 3);
			const originalDungeon = structuredClone(testDungeon);

			const validRoom: Room = {
				startRow: 0,
				endRow: 0,
				startCol: 0,
				endCol: 1,
			};

			const roomOutsideDungeon: Room = {
				startRow: 1,
				endRow: 3,
				startCol: 0,
				endCol: 1,
			};

			expect(() =>
				carveRooms(testDungeon, [validRoom, roomOutsideDungeon]),
			).toThrow(new RangeError("room is outside dungeon bounds"));

			expect(testDungeon).toStrictEqual(originalDungeon);
		});

		it("should throw RangeError when the dungeon is undefined", () => {
			expect(() => carveRooms(undefined, [])).toThrow(
				new RangeError("Dungeon is undefined"),
			);
		});

		it("should return an unchanged dungeon when no rooms are provided", () => {
			const testDungeon = makeDungeon(5, 6);

			const carvedDungeon = carveRooms(testDungeon, []);

			expect(carvedDungeon).toStrictEqual(testDungeon);
			expect(carvedDungeon).not.toBe(testDungeon);
			expect(carvedDungeon[0]).not.toBe(testDungeon?.[0]);
		});
	});

	describe("Carve Corridor tests", () => {
		it("should carve every corridor coordinate as floor", () => {
			const dungeon = makeDungeon(4, 7);

			const corridor: Corridor = [
				{ row: 1, col: 1 },
				{ row: 1, col: 2 },
				{ row: 1, col: 3 },
				{ row: 1, col: 4 },
			];

			const carvedDungeon = carveCorridor(dungeon, corridor);

			const expectedDungeon: string[][] = [
				[WALL, WALL, WALL, WALL, WALL, WALL, WALL],
				[WALL, FLOOR, FLOOR, FLOOR, FLOOR, WALL, WALL],
				[WALL, WALL, WALL, WALL, WALL, WALL, WALL],
				[WALL, WALL, WALL, WALL, WALL, WALL, WALL],
			];

			expect(carvedDungeon).toStrictEqual(expectedDungeon);
		});

		it("should preserve room floors when carving a connecting corridor", () => {
			const dungeon = makeDungeon(4, 7);

			const room1: Room = {
				startRow: 1,
				endRow: 2,
				startCol: 1,
				endCol: 2,
			};

			const room2: Room = {
				startRow: 1,
				endRow: 2,
				startCol: 4,
				endCol: 5,
			};

			const dungeonWithRooms = carveRooms(dungeon, [room1, room2]);
			const corridor = createCorridor(room1, room2);
			const connectedDungeon = carveCorridor(dungeonWithRooms, corridor);

			const expectedDungeon: string[][] = [
				[WALL, WALL, WALL, WALL, WALL, WALL, WALL],
				[WALL, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, WALL],
				[WALL, FLOOR, FLOOR, WALL, FLOOR, FLOOR, WALL],
				[WALL, WALL, WALL, WALL, WALL, WALL, WALL],
			];

			expect(connectedDungeon).toStrictEqual(expectedDungeon);
		});

		it("should not modify the original dungeon or corridor", () => {
			const dungeon = makeDungeon(4, 7);

			const corridor: Corridor = [
				{ row: 1, col: 1 },
				{ row: 1, col: 2 },
				{ row: 1, col: 3 },
				{ row: 1, col: 4 },
			];

			const originalDungeon = structuredClone(dungeon);
			const originalCorridor = structuredClone(corridor);

			const carvedDungeon = carveCorridor(dungeon, corridor);

			expect(dungeon).toStrictEqual(originalDungeon);
			expect(corridor).toStrictEqual(originalCorridor);

			expect(carvedDungeon).not.toBe(dungeon);
			expect(carvedDungeon[1]).not.toBe(dungeon?.[1]);

			expect(dungeon?.[1][1]).toBe(WALL);
			expect(carvedDungeon[1][1]).toBe(FLOOR);
		});

		it("should throw RangeError when a corridor coordinate is outside the dungeon", () => {
			const dungeon = makeDungeon(3, 3);
			const originalDungeon = structuredClone(dungeon);

			const invalidCoordinates: Corridor = [
				{ row: 0, col: 0 },
				{ row: 3, col: 0 },
			];

			expect(() => carveCorridor(dungeon, invalidCoordinates)).toThrow(
				new RangeError("corridor is outside dungeon bounds"),
			);

			expect(dungeon).toStrictEqual(originalDungeon);
		});
	});
});
