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
describe("Temporary attribute potions", () => {
	it.each([
		["strength-potion", "strength"],
		["dexterity-potion", "dexterity"],
		["intelligence-potion", "intelligence"],
	] as const)(
		"drinks %s for a temporary +2 %s bonus, refreshing instead of stacking",
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
			).toBe(12);
			expect(result.state.effects[0].remaining).toBe(5);
			const refreshed = resolvePlayerAction(result.state, {
				type: "consume",
				itemId: "bag:2",
			}).state;
			expect(refreshed.effects).toHaveLength(1);
			expect(refreshed.effects[0].remaining).toBe(5);
			let expired = refreshed;
			for (let turn = 0; turn < 5; turn++)
				expired = resolvePlayerAction(expired, { type: "wait" }).state;
			expect(expired.effects).toEqual([]);
			expect(
				deriveAttributes(
					expired.progression,
					expired.effects,
					expired.equipment,
				)[attribute],
			).toBe(10);
		},
	);
	it("raises spell potency and mana capacity without refilling, and clamps capacity on expiry", () => {
		const { result } = drink("intelligence-potion");
		let state = result.state;
		expect(state.mana).toBe(10);
		expect(maximumMana(state.progression, state.equipment, state.effects)).toBe(
			12,
		);
		expect(
			spellPotency(
				state.progression,
				SPELL_DEFINITIONS["magic-missile"],
				state.equipment,
				state.effects,
			),
		).toMatchObject({ minimumDamage: 4, maximumDamage: 6 });
		state = { ...state, mana: 12 };
		for (let turn = 0; turn < 5; turn++)
			state = resolvePlayerAction(state, { type: "wait" }).state;
		expect(state.mana).toBe(10);
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
