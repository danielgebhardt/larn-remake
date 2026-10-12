// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createGameState } from "../domain/game/GameState";
import { isSpellTarget } from "../domain/game/SpellCasting";
import { spellPotency } from "../domain/game/Spells";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

// Alternate profiles exercise the extension seam without adding learned spells.
const shortBolt = {
	name: "Short bolt",
	mode: "targeted",
	effect: "damage",
	cost: 2,
	range: 2,
	minimumDamage: 7,
	maximumDamage: 9,
	description: "A short-range bolt.",
} as const;
const strongHeal = {
	name: "Strong heal",
	mode: "self",
	effect: "heal",
	cost: 6,
	healing: 8,
	description: "A stronger healing spell.",
} as const;

describe("Selected spell rules", () => {
	it("derives damage from the chosen profile and earned Intelligence", () => {
		expect(spellPotency({ experience: 30 }, shortBolt)).toEqual({
			effect: "damage",
			minimumDamage: 8,
			maximumDamage: 10,
		});
	});
	it("derives healing from the chosen profile and earned Intelligence", () => {
		expect(spellPotency({ experience: 30 }, strongHeal)).toEqual({
			effect: "heal",
			healing: 9,
		});
	});
	it.each([
		{ col: 3, eligible: true },
		{ col: 4, eligible: false },
	])(
		"uses the selected range for a monster in column $col",
		({ col, eligible }) => {
			const state = createGameState(createCorridorEncounter());
			const target = {
				id: "1:1",
				kind: "goblin" as const,
				floorNumber: 1,
				coordinate: { row: 1, col },
				health: 4,
			};
			expect(isSpellTarget(state, target, shortBolt)).toBe(eligible);
		},
	);
	it("does not offer monster targets for a self-healing profile", () => {
		const state = createGameState(createCorridorEncounter());
		const target = {
			id: "1:1",
			kind: "goblin" as const,
			floorNumber: 1,
			coordinate: { row: 1, col: 2 },
			health: 4,
		};
		expect(isSpellTarget(state, target, strongHeal)).toBe(false);
	});
});
