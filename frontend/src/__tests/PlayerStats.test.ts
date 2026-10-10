// @vitest-environment node

import { describe, expect, it } from "vitest";
import { createGameState } from "../domain/game/GameState.ts";
import { resolvePlayerAction } from "../domain/game/PlayerActions.ts";
import { createThreeFloorTraversalRun } from "./testhelpers.ts";

describe("Player health", () => {
	it("starts a new player at full health using the shared default", () => {
		const game = createGameState(createThreeFloorTraversalRun());
		expect(game.player).toEqual({ health: 10, maxHealth: 10 });
	});

	it("preserves injured health through walking, descent, ascent, and blocked movement", () => {
		const run = createThreeFloorTraversalRun();
		const game = {
			...createGameState(run),
			player: { health: 4, maxHealth: 10 },
		};
		const descended = resolvePlayerAction(game, {
			type: "move",
			direction: "right",
		}).state;
		const away = resolvePlayerAction(descended, {
			type: "move",
			direction: "right",
		}).state;
		const returned = resolvePlayerAction(away, {
			type: "move",
			direction: "left",
		}).state;
		const blocked = resolvePlayerAction(returned, {
			type: "move",
			direction: "up",
		}).state;
		expect(returned.run.activeFloor).toBe(1);
		expect(blocked.player).toBe(game.player);
		expect(blocked.player).toEqual({ health: 4, maxHealth: 10 });
		expect(game.run).toBe(run);
		expect(game.turn).toBe(0);
	});

	it("starts fresh health and turn state when the same dungeon is replayed", () => {
		const run = createThreeFloorTraversalRun();
		const injured = {
			...createGameState(run),
			turn: 7,
			player: { health: 4, maxHealth: 10 },
		};
		const restarted = createGameState(injured.run);
		expect(restarted.player).toEqual({ health: 10, maxHealth: 10 });
		expect(restarted.player).not.toBe(injured.player);
		expect(restarted.turn).toBe(0);
		expect(injured.player.health).toBe(4);
	});
});
