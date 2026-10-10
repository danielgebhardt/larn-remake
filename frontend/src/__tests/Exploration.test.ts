// @vitest-environment node

import { describe, expect, it } from "vitest";
import {
	type DungeonRun,
	moveDungeonRun,
} from "../domain/dungeon/DungeonRun.ts";
import { updateExploration } from "../domain/dungeon/Exploration.ts";
import {
	createTestDungeonFloor,
	createThreeFloorTraversalRun,
} from "./testhelpers.ts";

const corridorRun = (rows = 3): DungeonRun => ({
	seed: 123,
	activeFloor: 1,
	playerCoordinate: { row: 1, col: 1 },
	floors: [
		createTestDungeonFloor({
			floorNumber: 1,
			rows,
			cols: 12,
			room: { startRow: 1, endRow: 1, startCol: 1, endCol: 10 },
		}),
	],
});

describe("Remembered exploration", () => {
	it("discovers only the initial visible surroundings", () => {
		const discovery = updateExploration(corridorRun(), 2);
		expect(discovery.visible[1][1]).toBe(true);
		expect(discovery.explored.get(1)?.[1][3]).toBe(true);
		expect(discovery.explored.get(1)?.[1][4]).toBe(false);
		expect(discovery.explored.has(2)).toBe(false);
	});

	it("remembers old tiles after the player moves out of sight", () => {
		const run = corridorRun();
		const initial = updateExploration(run, 2);
		const moved = { ...run, playerCoordinate: { row: 1, col: 5 } };
		const discovery = updateExploration(moved, 2, initial);
		expect(discovery.visible[1][1]).toBe(false);
		expect(discovery.explored.get(1)?.[1][1]).toBe(true);
		expect(discovery.explored.get(1)?.[1][7]).toBe(true);
		expect(initial.explored.get(1)?.[1][7]).toBe(false);
	});

	it("reveals a stair destination and restores the previous floor's memory", () => {
		const run = createThreeFloorTraversalRun();
		const initial = updateExploration(run, 1);
		const descended = moveDungeonRun(run, "right");
		const destination = updateExploration(descended, 1, initial);
		expect(destination.activeFloor).toBe(2);
		expect(destination.visible[1][1]).toBe(true);
		expect(destination.explored.get(1)).toBe(initial.explored.get(1));
		const away = moveDungeonRun(descended, "right");
		const remembered = updateExploration(away, 1, destination);
		const returned = moveDungeonRun(away, "left");
		const revisit = updateExploration(returned, 1, remembered);
		expect(revisit.activeFloor).toBe(1);
		expect(revisit.explored.get(1)?.[1][1]).toBe(true);
		expect(revisit.explored.get(2)).toBe(remembered.explored.get(2));
	});

	it("preserves discovery identity on blocked movement", () => {
		const run = corridorRun();
		const initial = updateExploration(run, 2);
		const blocked = moveDungeonRun(run, "up");
		expect(updateExploration(blocked, 2, initial)).toBe(initial);
	});

	it("keeps unchanged grid rows and terrain references stable", () => {
		const run = corridorRun(6);
		const initial = updateExploration(run, 1);
		const moved = moveDungeonRun(run, "right");
		const discovery = updateExploration(moved, 1, initial);
		expect(discovery.visible[5]).toBe(initial.visible[5]);
		expect(discovery.visible[1]).not.toBe(initial.visible[1]);
		expect(discovery.terrain).toBe(run.floors[0].terrain);
		expect(moved.floors).toBe(run.floors);
	});

	it("retains memory when reducing radius and reveals more when increasing it", () => {
		const run = corridorRun();
		const initial = updateExploration(run, 2);
		const reduced = updateExploration(run, 1, initial);
		expect(reduced.visible[1][3]).toBe(false);
		expect(reduced.explored).toBe(initial.explored);
		const expanded = updateExploration(run, 5, reduced);
		expect(expanded.visible[1][6]).toBe(true);
		expect(expanded.explored.get(1)?.[1][6]).toBe(true);
	});

	it("resets discovery for a fresh run even when seed and terrain repeat", () => {
		const run = corridorRun();
		const explored = updateExploration(
			{ ...run, playerCoordinate: { row: 1, col: 8 } },
			2,
		);
		const restarted = updateExploration(run, 2);
		expect(explored.explored.get(1)?.[1][8]).toBe(true);
		expect(restarted.explored.get(1)?.[1][8]).toBe(false);
	});
});
