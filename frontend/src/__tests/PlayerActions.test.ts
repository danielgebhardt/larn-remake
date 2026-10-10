// @vitest-environment node

import { describe, expect, it } from "vitest";
import { createGameState } from "../domain/game/GameState.ts";
import { resolvePlayerAction } from "../domain/game/PlayerActions.ts";
import {
	createTestDungeonFloor,
	createThreeFloorTraversalRun,
} from "./testhelpers.ts";

describe("Player action resolution", () => {
	it("moves before advancing the turn, retaining terrain and player health", () => {
		const run = { ...createThreeFloorTraversalRun(), activeFloor: 2 };
		const game = {
			...createGameState(run),
			turn: 7,
			player: { health: 4, maxHealth: 10 },
		};
		const before = structuredClone(game);
		const result = resolvePlayerAction(game, {
			type: "move",
			direction: "right",
		});
		expect(result.turnAdvanced).toBe(true);
		expect(result.state.turn).toBe(8);
		expect(result.state.run.playerCoordinate).toEqual({ row: 1, col: 2 });
		expect(result.state.run.floors).toBe(game.run.floors);
		expect(result.state.player).toBe(game.player);
		expect(game).toEqual(before);
	});

	it("resolves a stair entry as one turn and remains on the destination floor", () => {
		const game = createGameState(createThreeFloorTraversalRun());
		const result = resolvePlayerAction(game, {
			type: "move",
			direction: "right",
		});
		expect(result.turnAdvanced).toBe(true);
		expect(result.state.turn).toBe(1);
		expect(result.state.run.activeFloor).toBe(2);
		expect(result.state.run.playerCoordinate).toEqual({ row: 1, col: 1 });
	});

	it.each(["up", "left"] as const)(
		"rejects a %s step into a wall without changing state",
		(direction) => {
			const game = createGameState(createThreeFloorTraversalRun());
			const result = resolvePlayerAction(game, { type: "move", direction });
			expect(result.turnAdvanced).toBe(false);
			expect(result.state).toBe(game);
		},
	);

	it("rejects movement beyond the map without advancing the turn", () => {
		const game = createGameState({
			seed: 123,
			activeFloor: 1,
			playerCoordinate: { row: 0, col: 0 },
			floors: [
				createTestDungeonFloor({
					floorNumber: 1,
					rows: 2,
					cols: 2,
					room: { startRow: 0, endRow: 1, startCol: 0, endCol: 1 },
				}),
			],
		});
		const result = resolvePlayerAction(game, { type: "move", direction: "up" });
		expect(result).toEqual({ state: game, turnAdvanced: false });
		expect(result.state).toBe(game);
	});

	it("continues the same turn sequence through descent, a blocked step, and ascent", () => {
		const initial = createGameState(createThreeFloorTraversalRun());
		const descended = resolvePlayerAction(initial, {
			type: "move",
			direction: "right",
		});
		const away = resolvePlayerAction(descended.state, {
			type: "move",
			direction: "right",
		});
		const blocked = resolvePlayerAction(away.state, {
			type: "move",
			direction: "up",
		});
		expect(blocked.state).toBe(away.state);
		expect(blocked.turnAdvanced).toBe(false);
		const ascended = resolvePlayerAction(blocked.state, {
			type: "move",
			direction: "left",
		});
		expect(ascended.state.run.activeFloor).toBe(1);
		expect(ascended.state.turn).toBe(3);
		expect(ascended.state.player).toBe(initial.player);
	});

	it("does not partially advance a game when a broken stair link throws", () => {
		const run = createThreeFloorTraversalRun();
		const downStair = run.floors[0].downStair;
		if (!downStair) throw new Error("Fixture requires a down stair");
		const brokenRun = {
			...run,
			floors: [
				{ ...run.floors[0], downStair: { ...downStair, destinationFloor: 99 } },
				...run.floors.slice(1),
			],
		};
		const game = createGameState(brokenRun);
		const before = structuredClone(game);
		expect(() =>
			resolvePlayerAction(game, { type: "move", direction: "right" }),
		).toThrow(RangeError);
		expect(game).toEqual(before);
	});
});
