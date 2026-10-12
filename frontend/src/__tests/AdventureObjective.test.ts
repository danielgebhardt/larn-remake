// @vitest-environment node
import { describe, expect, it } from "vitest";
import { DEFAULT_RUN_CONFIGURATION } from "../domain/dungeon/RunConfiguration";
import { createGameState } from "../domain/game/GameState";
import { resolvePlayerActionWithHits } from "./ControlledCombatTestHelpers";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";
import { createThreeFloorTraversalRun } from "./testhelpers";

describe("Cure-and-return objective", () => {
	it("starts a five-floor adventure by default", () => {
		expect(DEFAULT_RUN_CONFIGURATION.floorCount).toBe(5);
	});
	it("records the configured goal floor and original entrance with a fresh quest", () => {
		const run = createThreeFloorTraversalRun();
		const state = createGameState(run);
		expect(state.quest).toEqual({
			goalFloor: 3,
			entrance: { row: 1, col: 1 },
			cureRecovered: false,
			victory: null,
		});
		expect(state.monstersDefeated).toBe(0);
	});
	it("supports a single-floor objective and resets progress on replay", () => {
		const run = createThreeFloorTraversalRun();
		run.floors = run.floors.slice(0, 1);
		const state = createGameState(run);
		state.quest = { ...state.quest, cureRecovered: true };
		state.monstersDefeated = 9;
		const replay = createGameState(run);
		expect(replay.quest.goalFloor).toBe(1);
		expect(replay.quest.cureRecovered).toBe(false);
		expect(replay.quest.victory).toBeNull();
		expect(replay.monstersDefeated).toBe(0);
	});
	it("counts a confirmed kill once independently of activity entries", () => {
		const before = {
			...createGameState(createCorridorEncounter()),
			monsters: [
				{
					intent: { type: "idle" as const },
					id: "1:1",
					kind: "goblin" as const,
					floorNumber: 1,
					coordinate: { row: 1, col: 2 },
					health: 1,
				},
			],
		};
		const killed = resolvePlayerActionWithHits(before, {
			type: "move",
			direction: "right",
		}).state;
		expect(killed.monstersDefeated).toBe(1);
		expect(
			resolvePlayerActionWithHits(killed, { type: "wait" }).state
				.monstersDefeated,
		).toBe(1);
		expect(before.monstersDefeated).toBe(0);
	});
});
