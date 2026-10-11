// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { DungeonRun } from "../domain/dungeon/DungeonRun";
import { WALL } from "../domain/dungeon/Tiles";
import { protectedSpawnLocations } from "../domain/monsters/MonsterLocations";
import { createTestDungeonFloor } from "./testhelpers";

const singleRoomRun = (): DungeonRun => ({
	seed: 0,
	activeFloor: 1,
	playerCoordinate: { row: 1, col: 1 },
	floors: [
		createTestDungeonFloor({
			floorNumber: 1,
			rows: 3,
			cols: 3,
			room: { startRow: 1, endRow: 1, startCol: 1, endCol: 1 },
		}),
	],
});

describe("Future stair reservation", () => {
	it("allows a valid one-tile room with no distinct future stair location", () => {
		expect(protectedSpawnLocations(singleRoomRun(), 1)).toEqual([]);
	});
	it("reports a room center that is not a walkable start", () => {
		const run = singleRoomRun();
		run.floors[0].terrain = [
			[WALL, WALL, WALL],
			[WALL, WALL, WALL],
			[WALL, WALL, WALL],
		];
		expect(() => protectedSpawnLocations(run, 1)).toThrow(
			"Invalid start point",
		);
	});
	it("reports missing room metadata instead of treating it as a small floor", () => {
		const run = singleRoomRun();
		run.floors[0].rooms = [];
		expect(() => protectedSpawnLocations(run, 1)).toThrow("No eligible rooms");
	});
	it("reports an additional room with no walkable stair tiles", () => {
		const run = singleRoomRun();
		run.floors[0].rooms.push({
			startRow: 0,
			endRow: 0,
			startCol: 0,
			endCol: 0,
		});
		expect(() => protectedSpawnLocations(run, 1)).toThrow(
			"No valid coordinate available for staircase",
		);
	});
});
