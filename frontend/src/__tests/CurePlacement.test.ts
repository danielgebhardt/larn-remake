// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
	connectDungeonFloors,
	generateDungeonRun,
} from "../domain/dungeon/DungeonRun";
import { DEFAULT_RUN_CONFIGURATION } from "../domain/dungeon/RunConfiguration";
import { createGameState } from "../domain/game/GameState";
import { spawnRunQuestItems } from "../domain/items/CurePlacement";
import { eligibleLootKinds } from "../domain/items/Item";
import { createThreeFloorTraversalRun, findFloorPath } from "./testhelpers";

describe("Unique seeded cure placement", () => {
	it("places one reachable cure on the final floor without occupying ordinary content or stairs", () => {
		const run = connectDungeonFloors(
			generateDungeonRun(0, 5, DEFAULT_RUN_CONFIGURATION),
		);
		const state = createGameState(run);
		const cures = state.floorItems.filter((x) => x.item.kind === "cure");
		expect(cures).toHaveLength(1);
		const cure = cures[0];
		expect(cure.floorNumber).toBe(5);
		const floor = run.floors[4];
		const entry = floor.upStair?.coordinate;
		if (!entry) throw new Error("Fixture needs an entry stair.");
		expect(
			findFloorPath(floor.terrain, entry, cure.coordinate).length,
		).toBeGreaterThan(0);
		expect(
			state.floorItems.filter(
				(x) =>
					x.floorNumber === 5 &&
					x.coordinate.row === cure.coordinate.row &&
					x.coordinate.col === cure.coordinate.col,
			),
		).toHaveLength(1);
		expect(
			state.monsters.some(
				(x) =>
					x.floorNumber === 5 &&
					x.coordinate.row === cure.coordinate.row &&
					x.coordinate.col === cure.coordinate.col,
			),
		).toBe(false);
		expect(createGameState(run)).toEqual(state);
	});
	it("keeps the cure out of all random loot pools", () => {
		for (const source of ["found", "drop"] as const)
			for (const floor of [1, 5, 20])
				expect(eligibleLootKinds(floor, source)).not.toContain("cure");
	});
	it("uses the reachable entry when a tiny single-floor fixture has no separate tile", () => {
		const run = createThreeFloorTraversalRun();
		run.floors = run.floors.slice(0, 1);
		run.floors[0].rooms = [{ startRow: 1, endRow: 1, startCol: 1, endCol: 1 }];
		const cure = spawnRunQuestItems(run, [], [])[0];
		expect(cure.coordinate).toEqual({ row: 1, col: 1 });
	});
});
