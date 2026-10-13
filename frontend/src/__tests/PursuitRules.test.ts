// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createGameState } from "../domain/game/GameState";
import { detectsPlayer } from "../domain/monsters/MonsterPursuit";
import { PURSUIT_RULES } from "../domain/monsters/PursuitRules";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

describe("Configured detection", () => {
	it("can extend detection without extending sight through walls", () => {
		const state = createGameState(createCorridorEncounter());
		const floor = state.run.floors[0];
		const terrain = Array.from({ length: 3 }, (_, r) =>
			Array.from({ length: 12 }, (_, c) =>
				r === 1 && c > 0 && c < 11 ? "." : "#",
			),
		);
		const run = {
			...state.run,
			floors: [{ ...floor, terrain }],
			playerCoordinate: { row: 1, col: 9 },
		};
		const monster = {
			...state.monsters[0],
			kind: "goblin" as const,
			coordinate: { row: 1, col: 2 },
			floorNumber: 1,
		};
		expect(detectsPlayer(run, monster)).toBe(false);
		expect(
			detectsPlayer(run, monster, { ...PURSUIT_RULES, detectionBonus: 1 }),
		).toBe(true);
		terrain[1][5] = "#";
		expect(
			detectsPlayer(run, monster, { ...PURSUIT_RULES, detectionBonus: 1 }),
		).toBe(false);
	});
});
