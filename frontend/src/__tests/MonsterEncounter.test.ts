// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
	connectDungeonFloors,
	generateDungeonRun,
	type MovementDirection,
} from "../domain/dungeon/DungeonRun";
import { DEFAULT_RUN_CONFIGURATION } from "../domain/dungeon/RunConfiguration";
import { createGameState } from "../domain/game/GameState";
import { resolvePlayerAction } from "../domain/game/PlayerActions";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

const play = (
	directions: readonly MovementDirection[],
	run = createCorridorEncounter(),
) => {
	let state = createGameState(run);
	for (const direction of directions)
		state = resolvePlayerAction(state, { type: "move", direction }).state;
	return state;
};

describe("Complete moving encounters", () => {
	it("defeats the seeded population, descends and revisits without respawning, then replays identically", () => {
		const run = createCorridorEncounter();
		const initial = createGameState(run);
		expect(initial.monsters).toHaveLength(3);
		// Eleven walk steps and two bump attacks for each of three goblins.
		const directions: MovementDirection[] = [
			...Array<MovementDirection>(17).fill("right"),
			"right",
			"left",
		];
		const result = play(directions, run);
		expect(result.player.health).toBeGreaterThan(0);
		expect(result.run.activeFloor).toBe(1);
		expect(result.run.playerCoordinate).toEqual({ row: 1, col: 12 });
		expect(result.turn).toBe(19);
		expect(result.monsters).toEqual([]);
		expect(
			result.activityHistory.entries.filter(
				(entry) => entry.event.type === "player-hit",
			),
		).toHaveLength(6);
		expect(
			result.activityHistory.entries.filter(
				(entry) => entry.event.type === "monster-died",
			),
		).toHaveLength(3);
		expect(
			result.activityHistory.entries.some(
				(entry) => entry.event.type === "player-died",
			),
		).toBe(false);
		expect(result.run.floors[0].terrain).toBe(initial.run.floors[0].terrain);
		expect(play(directions)).toEqual(result);
		const restarted = createGameState(run);
		expect(restarted.monsters).toEqual(initial.monsters);
		expect(restarted.turn).toBe(0);
		expect(restarted.player.health).toBe(10);
		expect(restarted.activityHistory.entries).toEqual([]);
	});
	it("does not evolve populated inactive floors while playing on another floor", () => {
		const { floorCount, ...configuration } = DEFAULT_RUN_CONFIGURATION;
		const initial = createGameState(
			connectDungeonFloors(generateDungeonRun(123, floorCount, configuration)),
		);
		const inactive = initial.monsters.filter(
			(monster) => monster.floorNumber !== 1,
		);
		let state = initial;
		for (const direction of ["right", "left", "down", "up"] as const)
			state = resolvePlayerAction(state, { type: "move", direction }).state;
		expect(state.run.activeFloor).toBe(1);
		expect(
			state.monsters.filter((monster) => monster.floorNumber !== 1),
		).toEqual(inactive);
		for (const monster of inactive)
			expect(state.monsters.find((actor) => actor.id === monster.id)).toBe(
				monster,
			);
	});
});
