// @vitest-environment node
import { describe, expect, it } from "vitest";
import { appendActivityEvents } from "../domain/game/ActivityHistory";
import { createGameState, type GameState } from "../domain/game/GameState";
import { resolvePlayerActionWithHits } from "./ControlledCombatTestHelpers";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

const right = { type: "move", direction: "right" } as const;
const left = { type: "move", direction: "left" } as const;

describe("Retained experience across exploration", () => {
	it("retains rewards through stair revisits without rewarding a cleared floor again", () => {
		const initial = createGameState(createCorridorEncounter());
		let state: GameState = {
			...initial,
			run: { ...initial.run, playerCoordinate: { row: 1, col: 9 } },
			monsters: [
				{
					intent: { type: "idle" as const },
					id: "1:1",
					kind: "goblin" as const,
					floorNumber: 1,
					coordinate: { row: 1, col: 10 },
					health: 1,
				},
				{
					intent: { type: "idle" as const },
					id: "2:1",
					kind: "goblin" as const,
					floorNumber: 2,
					coordinate: { row: 1, col: 2 },
					health: 1,
				},
			],
		};
		state = resolvePlayerActionWithHits(state, right).state;
		expect(state.progression.experience).toBe(5);
		for (let step = 0; step < 3; step++)
			state = resolvePlayerActionWithHits(state, right).state;
		expect(state.run.activeFloor).toBe(2);
		state = resolvePlayerActionWithHits(state, right).state;
		expect(state.progression.experience).toBe(10);
		expect(state.player.maxHealth).toBe(12);
		state = resolvePlayerActionWithHits(state, right).state;
		state = resolvePlayerActionWithHits(state, left).state;
		expect(state.run.activeFloor).toBe(1);
		state = resolvePlayerActionWithHits(state, left).state;
		expect(state.progression.experience).toBe(10);
		expect(state.monsters).toEqual([]);
		expect(initial.progression.experience).toBe(0);
	});
	it("does not lose authoritative XP when the activity log is trimmed", () => {
		const initial = createGameState(createCorridorEncounter());
		const history = appendActivityEvents(
			initial.activityHistory,
			Array.from({ length: 120 }, (_, turn) => ({
				type: "experience-gained" as const,
				amount: 5,
				turn,
			})),
		);
		const before = {
			...initial,
			progression: { experience: 100 },
			player: { health: 3, maxHealth: 18 },
			activityHistory: history,
			monsters: [
				{
					intent: { type: "idle" as const },
					id: "1:1",
					kind: "orc" as const,
					floorNumber: 1,
					coordinate: { row: 1, col: 2 },
					health: 1,
				},
			],
		};
		const after = resolvePlayerActionWithHits(before, right).state;
		expect(after.activityHistory.entries).toHaveLength(100);
		expect(after.progression.experience).toBe(110);
		expect(after.player).toEqual(before.player);
	});
});
