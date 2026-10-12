// @vitest-environment node
import { describe, expect, it } from "vitest";
import { deriveAttributes } from "../domain/game/Attributes";
import { createGameState } from "../domain/game/GameState";
import { growManaCapacity, maximumMana } from "../domain/game/Mana";
import { resolvePlayerActionWithHits } from "./ControlledCombatTestHelpers";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

describe("Earned Intelligence and mana", () => {
	it.each([
		[0, 10, 10],
		[29, 10, 10],
		[30, 12, 12],
		[99, 12, 12],
		[100, 14, 14],
		[1000, 20, 20],
	])(
		"derives Intelligence and capacity at %i XP",
		(experience, intelligence, capacity) => {
			expect(deriveAttributes({ experience }).intelligence).toBe(intelligence);
			expect(maximumMana({ experience })).toBe(capacity);
		},
	);
	it.each([0, 3, 10])(
		"preserves missing mana when crossing multiple levels with %i mana",
		(mana) => {
			expect(
				growManaCapacity(mana, { experience: 0 }, { experience: 100 }),
			).toBe(mana + 4);
			expect(
				growManaCapacity(mana, { experience: 100 }, { experience: 120 }),
			).toBe(mana);
		},
	);
	it("starts full, retains spent mana on stairs, and resets on replay", () => {
		const initial = createGameState(createCorridorEncounter());
		expect(initial.mana).toBe(10);
		const before = {
			...initial,
			mana: 3,
			monsters: [],
			run: { ...initial.run, playerCoordinate: { row: 1, col: 11 } },
		};
		const after = resolvePlayerActionWithHits(before, {
			type: "move",
			direction: "right",
		}).state;
		expect(after.run.activeFloor).toBe(2);
		expect(after.mana).toBe(3);
		expect(createGameState(initial.run).mana).toBe(10);
	});
	it("earns capacity on a confirmed kill before retaliation without refilling", () => {
		const initial = createGameState(createCorridorEncounter());
		const before = {
			...initial,
			mana: 1,
			progression: { experience: 29 },
			monsters: [
				{
					intent: { type: "idle" as const },
					id: "rat",
					kind: "giant-rat" as const,
					health: 1,
					floorNumber: 1,
					coordinate: { row: 1, col: 2 },
				},
			],
		};
		const after = resolvePlayerActionWithHits(before, {
			type: "move",
			direction: "right",
		}).state;
		expect(after.mana).toBe(3);
		expect(maximumMana(after.progression)).toBe(12);
		expect(
			after.activityHistory.entries.map((entry) => entry.event),
		).toContainEqual({
			type: "attribute-gained",
			attribute: "Intelligence",
			value: 12,
			turn: 1,
		});
		expect(before.mana).toBe(1);
	});
});
