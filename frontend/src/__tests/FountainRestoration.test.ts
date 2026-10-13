// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createGameState } from "../domain/game/GameState";
import { experienceThreshold } from "../domain/game/Progression";
import { fountainRestoration } from "../domain/objects/DungeonFountains";
import { resolvePlayerActionWithHits as resolvePlayerAction } from "./ControlledCombatTestHelpers";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

const fountain = {
	id: "floor:1:object:fountain:1",
	kind: "fountain" as const,
	floorNumber: 1,
	coordinate: { row: 1, col: 2 },
	activated: false,
};
describe("Finite fountains worth seeking", () => {
	it("scales reliable restoration for a late-game character without exceeding capacity", () => {
		const state = {
			...createGameState(createCorridorEncounter()),
			monsters: [],
			objects: [fountain],
			progression: { experience: experienceThreshold(20) },
			player: { health: 20, maxHealth: 48 },
			mana: 0,
		};
		expect(fountainRestoration(state).sip).toEqual({ health: 12, mana: 7 });
		const result = resolvePlayerAction(state, {
			type: "interact",
			choice: "sip",
		});
		expect(result.state.player.health).toBe(32);
		expect(result.state.mana).toBe(7);
		expect(result.state.turn).toBe(1);
		expect(
			resolvePlayerAction(result.state, { type: "interact", choice: "sip" })
				.turnAdvanced,
		).toBe(false);
	});
	it("has a useful floor-one baseline and rejects full-resource drinking freely", () => {
		const state = {
			...createGameState(createCorridorEncounter()),
			monsters: [],
			objects: [fountain],
		};
		expect(fountainRestoration(state).sip).toEqual({ health: 6, mana: 4 });
		for (const choice of ["sip", "draw"] as const)
			expect(
				resolvePlayerAction(state, { type: "interact", choice }).state,
			).toBe(state);
	});
	it("restores before monsters respond, then persists the spent fountain", () => {
		const state = {
			...createGameState(createCorridorEncounter()),
			player: { health: 1, maxHealth: 10 },
			mana: 1,
			objects: [fountain],
			monsters: [
				{
					id: "1:1",
					kind: "goblin" as const,
					floorNumber: 1,
					coordinate: { row: 1, col: 2 },
					health: 4,
					intent: { type: "idle" as const },
				},
			],
		};
		const result = resolvePlayerAction(state, {
			type: "interact",
			choice: "sip",
		}).state;
		expect(result.player.health).toBe(6);
		expect(result.objects[0].activated).toBe(true);
	});
});
