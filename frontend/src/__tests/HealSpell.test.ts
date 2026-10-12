// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createGameState } from "../domain/game/GameState";
import { resolvePlayerActionWithHits } from "./ControlledCombatTestHelpers";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

const initial = () => ({
	...createGameState(createCorridorEncounter()),
	monsters: [],
});
const cast = { type: "cast", spell: "heal" } as const;
describe("Self-healing spell", () => {
	it.each([
		[0, 3, 7],
		[30, 3, 8],
		[100, 3, 9],
		[0, 9, 10],
	])(
		"heals with %i XP from %i health to %i",
		(experience, health, expected) => {
			const before = {
				...initial(),
				progression: { experience },
				player: { health, maxHealth: 10 },
			};
			const result = resolvePlayerActionWithHits(before, cast);
			expect(result.state.player.health).toBe(expected);
			expect(result.state.mana).toBe(6);
			expect(result.state.turn).toBe(1);
			expect(result.state.run).toBe(before.run);
			expect(result.state.activityHistory.entries[0].event).toEqual({
				type: "spell-healed",
				spell: "heal",
				recovered: expected - health,
				turn: 1,
			});
		},
	);
	it("heals first, then resolves retaliation once", () => {
		const before = {
			...initial(),
			mana: 4,
			player: { health: 1, maxHealth: 10 },
			monsters: [
				{
					intent: { type: "idle" as const },
					id: "1:1",
					kind: "goblin" as const,
					floorNumber: 1,
					coordinate: { row: 1, col: 2 },
					health: 9,
				},
			],
		};
		const after = resolvePlayerActionWithHits(before, cast).state;
		expect(after).toMatchObject({ mana: 0, turn: 1, player: { health: 4 } });
		expect(after.activityHistory.entries.map((e) => e.event.type)).toEqual([
			"spell-healed",
			"monster-hit",
		]);
	});
	it.each(["full", "no mana", "unlearned", "dead", "won"])(
		"rejects %s for free",
		(scenario) => {
			let before = initial();
			if (scenario === "no mana")
				before = { ...before, mana: 3, player: { health: 1, maxHealth: 10 } };
			if (scenario === "unlearned")
				before = {
					...before,
					knownSpells: ["magic-missile"],
					player: { health: 1, maxHealth: 10 },
				};
			if (scenario === "dead")
				before = { ...before, player: { health: 0, maxHealth: 10 } };
			if (scenario === "won")
				before = {
					...before,
					quest: {
						...before.quest,
						victory: {
							seed: 123,
							floors: 2,
							turns: 1,
							monstersDefeated: 0,
							health: 10,
							level: 1,
							experience: 0,
						},
					},
				};
			const result = resolvePlayerActionWithHits(before, cast);
			expect(result.state).toBe(before);
			expect(result.turnAdvanced).toBe(false);
			expect(result.error).toBeTruthy();
		},
	);
});
