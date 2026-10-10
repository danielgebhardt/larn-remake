// @vitest-environment node

import { describe, expect, it } from "vitest";
import { createGameState, movePlayer } from "../domain/game/GameState.ts";
import {
	createTestDungeonFloor,
	createThreeFloorTraversalRun,
} from "./testhelpers.ts";

describe("Game turns", () => {
	it("starts each new game at turn zero without changing the dungeon", () => {
		const run = createThreeFloorTraversalRun();
		const game = createGameState(run);
		expect(game.turn).toBe(0);
		expect(game.run).toBe(run);
	});

	it("counts an ordinary floor step once", () => {
		const run = { ...createThreeFloorTraversalRun(), activeFloor: 2 };
		const game = createGameState(run);
		const moved = movePlayer(game, "right");
		expect(moved.turn).toBe(1);
		expect(moved.run.playerCoordinate).toEqual({ row: 1, col: 2 });
		expect(moved.run.floors).toBe(run.floors);
		expect(game.turn).toBe(0);
		expect(run.playerCoordinate).toEqual({ row: 1, col: 1 });
	});

	it("counts descent and ascent once each, with no extra turn for arrival", () => {
		const game = createGameState(createThreeFloorTraversalRun());
		const descended = movePlayer(game, "right");
		expect(descended.run.activeFloor).toBe(2);
		expect(descended.run.playerCoordinate).toEqual({ row: 1, col: 1 });
		expect(descended.turn).toBe(1);
		const away = movePlayer(descended, "right");
		const ascended = movePlayer(away, "left");
		expect(ascended.run.activeFloor).toBe(1);
		expect(ascended.turn).toBe(3);
	});

	it("retains the same game and turn when movement hits a wall or map boundary", () => {
		const game = createGameState(createThreeFloorTraversalRun());
		expect(movePlayer(game, "up")).toBe(game);
		const edge = createGameState({
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
		expect(movePlayer(edge, "up")).toBe(edge);
	});

	it("replaying the same dungeon creates a fresh turn counter", () => {
		const run = createThreeFloorTraversalRun();
		const moved = movePlayer(createGameState(run), "right");
		expect(moved.turn).toBe(1);
		expect(createGameState(run).turn).toBe(0);
	});
});
