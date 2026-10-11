// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
	connectDungeonFloors,
	generateDungeonRun,
} from "../domain/dungeon/DungeonRun";
import type { Coordinate } from "../domain/dungeon/DungeonTypes";
import { DEFAULT_RUN_CONFIGURATION } from "../domain/dungeon/RunConfiguration";
import { createGameState, type GameState } from "../domain/game/GameState";
import { resolvePlayerAction } from "../domain/game/PlayerActions";
import { createThreeFloorTraversalRun, findFloorPath } from "./testhelpers";

const walk = (before: GameState, target: Coordinate) => {
	let state = before;
	const path = findFloorPath(
		state.run.floors[state.run.activeFloor - 1].terrain,
		state.run.playerCoordinate,
		target,
	);
	for (const point of path.slice(1)) {
		const previous = state.run.playerCoordinate;
		const direction =
			point.row < previous.row
				? "up"
				: point.row > previous.row
					? "down"
					: point.col < previous.col
						? "left"
						: "right";
		state = resolvePlayerAction(state, { type: "move", direction }).state;
	}
	return state;
};
describe("Complete cure-and-return adventures", () => {
	it("descends, recovers, returns through cleared floors, wins, and resets on replay", () => {
		const run = createThreeFloorTraversalRun();
		const fresh = createGameState(run);
		let state: GameState = { ...fresh, monsters: [] };
		// Each destination is the down stair on the current floor.
		state = walk(state, { row: 1, col: 2 });
		expect(state.run.activeFloor).toBe(2);
		state = walk(state, { row: 1, col: 3 });
		expect(state.run.activeFloor).toBe(3);
		const cure = state.floorItems.find((x) => x.item.kind === "cure");
		if (!cure) throw new Error("Expected one cure.");
		state = walk(state, cure.coordinate);
		state = resolvePlayerAction(state, {
			type: "pickup",
			itemId: cure.item.id,
		}).state;
		expect(state.quest.cureRecovered).toBe(true);
		// Both lower floors have their up stair at (1, 1).
		state = walk(state, { row: 1, col: 1 });
		expect(state.run.activeFloor).toBe(2);
		state = walk(state, { row: 1, col: 1 });
		expect(state.run.activeFloor).toBe(1);
		state = walk(state, state.quest.entrance);
		expect(state.quest.victory).toMatchObject({
			seed: 123,
			floors: 3,
			health: 10,
			monstersDefeated: 0,
		});
		expect(state.quest.victory?.turns).toBe(state.turn);
		expect(state.monsters).toEqual([]);
		expect(state.floorItems.some((x) => x.item.kind === "cure")).toBe(false);
		expect(createGameState(run)).toEqual(fresh);
		expect(fresh.quest.cureRecovered).toBe(false);
	});
	it("places the objective on configured floor twenty without changing ordinary earlier loot", () => {
		const make = (floors: number) =>
			createGameState(
				connectDungeonFloors(
					generateDungeonRun(123, floors, DEFAULT_RUN_CONFIGURATION),
				),
			);
		const short = make(5),
			long = make(20);
		expect(
			long.floorItems
				.filter((x) => x.item.kind === "cure")
				.map((x) => x.floorNumber),
		).toEqual([20]);
		expect(
			long.floorItems.filter(
				(x) => x.item.kind !== "cure" && x.floorNumber <= 5,
			),
		).toEqual(short.floorItems.filter((x) => x.item.kind !== "cure"));
		expect(long.monsters.filter((x) => x.floorNumber <= 5)).toEqual(
			short.monsters,
		);
	});
});
