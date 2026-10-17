// @vitest-environment node
import { describe, expect, it } from "vitest";
import { deriveAttributes } from "../domain/game/Attributes";
import { createGameState } from "../domain/game/GameState";
import { maximumMana } from "../domain/game/Mana";
import { resolvePlayerAction } from "../domain/game/PlayerActions";
import { SPELL_DEFINITIONS, spellPotency } from "../domain/game/Spells";
import { bagSlots } from "../domain/items/Bag";
import type { ItemKind } from "../domain/items/Item";
import {
	parseSave,
	restoreSave,
	serializeSave,
} from "../domain/saves/SaveFormat";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";
import { savedAdventure } from "./SaveTestHelpers";

const drink = (kind: ItemKind) => {
	const state = {
		...createGameState(createCorridorEncounter()),
		monsters: [],
		objects: [],
		floorItems: [],
		bag: {
			items: [
				{ id: "bag:1", kind },
				{ id: "bag:2", kind },
			],
		},
	};
	return {
		state,
		result: resolvePlayerAction(state, { type: "consume", itemId: "bag:1" }),
	};
};
describe("Permanent attribute potions", () => {
	it.each([
		["strength-potion", "strength"],
		["dexterity-potion", "dexterity"],
		["intelligence-potion", "intelligence"],
	] as const)(
		"drinks %s for a permanent +1 %s gain, stacking each owned bottle",
		(kind, attribute) => {
			const { state, result } = drink(kind);
			expect(bagSlots(state.bag)).toHaveLength(1);
			expect(result.turnAdvanced).toBe(true);
			expect(result.state.turn).toBe(1);
			expect(result.state.bag.items).toHaveLength(1);
			expect(
				deriveAttributes(
					result.state.progression,
					result.state.effects,
					result.state.equipment,
				)[attribute],
			).toBe(11);
			expect(result.state.effects).toEqual([]);
			expect(result.state.progression.permanentAttributes?.[attribute]).toBe(1);
			const secondDose = resolvePlayerAction(result.state, {
				type: "consume",
				itemId: "bag:2",
			}).state;
			expect(secondDose.effects).toEqual([]);
			expect(secondDose.progression.permanentAttributes?.[attribute]).toBe(2);
			let later = secondDose;
			for (let turn = 0; turn < 5; turn++)
				later = resolvePlayerAction(later, { type: "wait" }).state;
			expect(later.effects).toEqual([]);
			expect(
				deriveAttributes(later.progression, later.effects, later.equipment)[
					attribute
				],
			).toBe(12);
		},
	);
	it("raises Intelligence modifiers at the normal two-point threshold without refilling mana or expiring", () => {
		const { result } = drink("intelligence-potion");
		let state = result.state;
		expect(state.mana).toBe(10);
		expect(maximumMana(state.progression, state.equipment, state.effects)).toBe(
			10,
		);
		state = { ...state, mana: 4 };
		state = resolvePlayerAction(state, {
			type: "consume",
			itemId: "bag:2",
		}).state;
		expect(maximumMana(state.progression, state.equipment, state.effects)).toBe(
			12,
		);
		expect(state.mana).toBe(4);
		expect(
			spellPotency(
				state.progression,
				SPELL_DEFINITIONS["magic-missile"],
				state.equipment,
				state.effects,
			),
		).toMatchObject({ minimumDamage: 4, maximumDamage: 6 });
		for (let turn = 0; turn < 8; turn++)
			state = resolvePlayerAction(state, { type: "wait" }).state;
		expect(maximumMana(state.progression, state.equipment, state.effects)).toBe(
			12,
		);
		expect(state.mana).toBe(4);
	});
	it("preserves an active intelligence boost and elevated mana through save/resume", () => {
		const document = savedAdventure();
		document.state.effects = [
			{
				actorId: "player",
				floorNumber: null,
				kind: "enlightened",
				remaining: 1,
			},
		];
		document.state.mana = 12;
		const parsed = parseSave(serializeSave(document));
		if (!parsed.ok) throw new Error(parsed.error);
		const restored = restoreSave(parsed.value).state;
		expect(restored.effects[0].remaining).toBe(1);
		expect(resolvePlayerAction(restored, { type: "wait" }).state.mana).toBe(10);
	});
});
