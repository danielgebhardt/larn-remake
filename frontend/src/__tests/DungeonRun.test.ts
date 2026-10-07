import { describe, expect, it } from "vitest";
import { createDungeonRun, type DungeonFloor } from "../DungeonRun.ts";
import {
	type DungeonConfig,
	FLOOR,
	generateDungeon,
	PLAYER,
	selectPlayerStart,
} from "../LayoutTiles.ts";

describe("Dungeon run tests", () => {
	const config: DungeonConfig = {
		rows: 12,
		cols: 20,
		minPartitionSize: 5,
		roomPadding: 1,
	};

	const makeFloor = (floorNumber: number, seed: number): DungeonFloor => ({
		floorNumber,
		...generateDungeon(config, seed),
	});

	it("should create a three-floor run with the supplied seed", () => {
		const floors = [makeFloor(1, 101), makeFloor(2, 102), makeFloor(3, 103)];

		const run = createDungeonRun(123, floors);

		expect(run.seed).toBe(123);
		expect(run.floors).toHaveLength(3);
		expect(run.floors.map((floor) => floor.floorNumber)).toStrictEqual([
			1, 2, 3,
		]);
	});

	it("should begin a new run on floor 1", () => {
		const floors = [makeFloor(1, 101), makeFloor(2, 102), makeFloor(3, 103)];

		const run = createDungeonRun(123, floors);

		expect(run.activeFloor).toBe(1);
	});

	it("should place the player at floor 1's selected valid start", () => {
		const floors = [makeFloor(1, 101), makeFloor(2, 102), makeFloor(3, 103)];

		const expectedStart = selectPlayerStart(floors[0]);

		const run = createDungeonRun(123, floors);

		expect(run.playerCoordinate).toStrictEqual(expectedStart);
		expect(
			run.floors[0].terrain[run.playerCoordinate.row][run.playerCoordinate.col],
		).toBe(FLOOR);
	});

	it("should support a one-floor run", () => {
		const floors = [makeFloor(1, 101)];

		const run = createDungeonRun(123, floors);

		expect(run.seed).toBe(123);
		expect(run.floors).toHaveLength(1);
		expect(run.floors[0].floorNumber).toBe(1);
		expect(run.activeFloor).toBe(1);
		expect(run.playerCoordinate).toStrictEqual(selectPlayerStart(floors[0]));
	});

	it("should keep player position separate from floor terrain", () => {
		const floors = [makeFloor(1, 101), makeFloor(2, 102), makeFloor(3, 103)];

		const run = createDungeonRun(123, floors);

		expect(
			run.floors[0].terrain[run.playerCoordinate.row][run.playerCoordinate.col],
		).toBe(FLOOR);

		expect(run.floors[0].terrain.flat().includes(PLAYER)).toBe(false);
	});

	it("should keep floor data independent", () => {
		const floors = [makeFloor(1, 101), makeFloor(2, 102), makeFloor(3, 103)];

		const run = createDungeonRun(123, floors);

		const originalFloor2 = structuredClone(run.floors[1]);
		const originalFloor3 = structuredClone(run.floors[2]);

		run.floors[0].terrain[0][0] = FLOOR;

		expect(run.floors[1]).toStrictEqual(originalFloor2);
		expect(run.floors[2]).toStrictEqual(originalFloor3);

		expect(run.floors[0].terrain).not.toBe(run.floors[1].terrain);
		expect(run.floors[0].terrain).not.toBe(run.floors[2].terrain);
		expect(run.floors[1].terrain).not.toBe(run.floors[2].terrain);
	});

	it("should reject a run with no floors", () => {
		expect(() => createDungeonRun(123, [])).toThrow(
			new RangeError("Dungeon run must contain at least one floor"),
		);
	});

	it("should reject floors that are not numbered consecutively starting at 1", () => {
		const floors = [makeFloor(1, 101), makeFloor(3, 103)];

		expect(() => createDungeonRun(123, floors)).toThrow(
			new RangeError("Dungeon floor numbers must be sequential"),
		);
	});
});
