import { describe, expect, it } from "vitest";
import {
	type DungeonRun,
	moveDungeonRun,
} from "../domain/dungeon/DungeonRun.ts";
import type { Coordinate, Dungeon } from "../domain/dungeon/DungeonTypes.ts";
import { FLOOR, WALL } from "../domain/dungeon/Tiles.ts";
import { createTestDungeonFloor } from "./testhelpers.ts";

const makeRun = (
	terrain: Dungeon = Array.from({ length: 3 }, () =>
		Array<string>(5).fill(FLOOR),
	),
	playerCoordinate: Coordinate = { row: 1, col: 2 },
): DungeonRun => ({
	seed: 123,
	activeFloor: 1,
	playerCoordinate,
	floors: [
		{
			...createTestDungeonFloor({
				floorNumber: 1,
				rows: 3,
				cols: 5,
				room: { startRow: 0, endRow: 2, startCol: 0, endCol: 4 },
			}),
			terrain,
		},
	],
});

const makeLinkedRun = (): DungeonRun => {
	const room = { startRow: 1, endRow: 2, startCol: 1, endCol: 3 };
	return {
		seed: 123,
		activeFloor: 1,
		playerCoordinate: { row: 1, col: 1 },
		floors: [
			createTestDungeonFloor({
				floorNumber: 1,
				rows: 4,
				cols: 5,
				room,
				downStair: {
					coordinate: { row: 1, col: 2 },
					destinationFloor: 2,
					arrivalCoordinate: { row: 1, col: 1 },
				},
			}),
			createTestDungeonFloor({
				floorNumber: 2,
				rows: 4,
				cols: 5,
				room,
				upStair: {
					coordinate: { row: 1, col: 1 },
					destinationFloor: 1,
					arrivalCoordinate: { row: 1, col: 2 },
				},
			}),
		],
	};
};

describe("Dungeon movement", () => {
	it.each([
		["up", { row: 0, col: 2 }],
		["down", { row: 2, col: 2 }],
		["left", { row: 1, col: 1 }],
		["right", { row: 1, col: 3 }],
	] as const)(
		"moves one tile %s without changing terrain or the input run",
		(direction, coordinate) => {
			const run = makeRun();
			const before = structuredClone(run);
			for (const row of run.floors[0].terrain) Object.freeze(row);
			Object.freeze(run.floors[0].terrain);
			Object.freeze(run.playerCoordinate);
			Object.freeze(run);
			const next = moveDungeonRun(run, direction);
			expect(next.playerCoordinate).toEqual(coordinate);
			expect(next.activeFloor).toBe(1);
			expect(next.seed).toBe(run.seed);
			expect(next.floors).toBe(run.floors);
			expect(next.floors[0].terrain).toBe(run.floors[0].terrain);
			expect(run).toEqual(before);
		},
	);

	it.each(["up", "down", "left", "right"] as const)(
		"keeps the same run when %s is blocked by a wall",
		(direction) => {
			const run = makeRun(
				[
					[WALL, WALL, WALL],
					[WALL, FLOOR, WALL],
					[WALL, WALL, WALL],
				],
				{ row: 1, col: 1 },
			);
			expect(moveDungeonRun(run, direction)).toBe(run);
		},
	);

	it.each([
		["up", { row: 0, col: 2 }],
		["down", { row: 2, col: 2 }],
		["left", { row: 1, col: 0 }],
		["right", { row: 1, col: 4 }],
	] as const)(
		"keeps the same run at the %s boundary of a rectangular map",
		(direction, position) => {
			const run = makeRun(undefined, position);
			expect(moveDungeonRun(run, direction)).toBe(run);
		},
	);

	it("blocks movement into a missing tile in an uneven row", () => {
		const run = makeRun([[FLOOR, FLOOR], [FLOOR]], { row: 0, col: 1 });
		expect(moveDungeonRun(run, "down")).toBe(run);
	});

	it("descends when entering a down stair and stays at the arrival stair", () => {
		const run = makeLinkedRun();
		const next = moveDungeonRun(run, "right");
		expect(next.activeFloor).toBe(2);
		expect(next.playerCoordinate).toEqual({ row: 1, col: 1 });
		expect(next.floors).toBe(run.floors);
		expect(run.activeFloor).toBe(1);
	});

	it("ascends only after leaving and reentering an up stair", () => {
		const descended = moveDungeonRun(makeLinkedRun(), "right");
		const away = moveDungeonRun(descended, "right");
		expect(away.activeFloor).toBe(2);
		const returned = moveDungeonRun(away, "left");
		expect(returned.activeFloor).toBe(1);
		expect(returned.playerCoordinate).toEqual({ row: 1, col: 2 });
		expect(returned.floors).toBe(descended.floors);
	});

	it("does not transition when a move is blocked while standing on an arrival stair", () => {
		const descended = moveDungeonRun(makeLinkedRun(), "right");
		expect(moveDungeonRun(descended, "up")).toBe(descended);
	});

	it("rejects a stair with a missing destination when entering it", () => {
		const run = makeLinkedRun();
		run.floors = [run.floors[0]];
		expect(() => moveDungeonRun(run, "right")).toThrow(
			"Stair destination floor 2 does not exist",
		);
	});

	it("rejects a run with an invalid active floor", () => {
		const run = { ...makeRun(), activeFloor: 0 };
		expect(() => moveDungeonRun(run, "right")).toThrow(
			"Active floor 0 does not exist",
		);
	});
});
