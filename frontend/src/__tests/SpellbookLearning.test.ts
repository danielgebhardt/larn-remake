// @vitest-environment node
import { expect, it } from "vitest";
import { createGameState } from "../domain/game/GameState";
import { resolvePlayerAction } from "../domain/game/PlayerActions";
import {
	createSaveDocument,
	parseSave,
	restoreSave,
	serializeSave,
} from "../domain/saves/SaveFormat";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";
import { savedAdventure } from "./SaveTestHelpers";

const bookRun = () => {
	const initial = createGameState(createCorridorEncounter());
	return {
		...initial,
		monsters: [],
		floorItems: [
			{
				item: { id: "book", kind: "book-ember-bolt" as const },
				floorNumber: 1,
				coordinate: initial.run.playerCoordinate,
			},
		],
	};
};
it("learns Ember Bolt on pickup without using a bag slot and commits one turn", () => {
	const state = bookRun();
	const result = resolvePlayerAction(state, { type: "pickup", itemId: "book" });
	expect(result.turnAdvanced).toBe(true);
	expect(result.state.turn).toBe(1);
	expect(result.state.knownSpells).toEqual([
		"magic-missile",
		"heal",
		"ember-bolt",
	]);
	expect(result.state.bag).toBe(state.bag);
	expect(result.state.floorItems).toEqual([]);
	expect(state.knownSpells).toEqual(["magic-missile", "heal"]);
});
it("can learn while the bag is full, but leaves duplicate or distant books untouched", () => {
	const initial = bookRun();
	const state = {
		...initial,
		bag: {
			items: Array.from({ length: 27 }, (_, i) => ({
				id: `bag:${i}`,
				kind: "healing-potion" as const,
			})),
		},
	};
	const learned = resolvePlayerAction(state, {
		type: "pickup",
		itemId: "book",
	}).state;
	expect(learned.knownSpells).toContain("ember-bolt");
	const duplicate = { ...learned, floorItems: state.floorItems };
	const rejected = resolvePlayerAction(duplicate, {
		type: "pickup",
		itemId: "book",
	});
	expect(rejected.state).toBe(duplicate);
	expect(rejected.turnAdvanced).toBe(false);
	expect(rejected.error).toMatch(/already know/i);
	const distant = {
		...state,
		run: { ...state.run, playerCoordinate: { row: 1, col: 2 } },
	};
	expect(
		resolvePlayerAction(distant, { type: "pickup", itemId: "book" }).state,
	).toBe(distant);
});
it("retains newly learned knowledge in a validated save and resumes without the book", () => {
	const restored = restoreSave(savedAdventure());
	const initial = {
		...restored.state,
		monsters: [],
		floorItems: [
			...restored.state.floorItems,
			{
				item: { id: "new-book", kind: "book-ember-bolt" as const },
				floorNumber: restored.state.run.activeFloor,
				coordinate: restored.state.run.playerCoordinate,
			},
		],
	};
	const learned = resolvePlayerAction(initial, {
		type: "pickup",
		itemId: "new-book",
	}).state;
	const parsed = parseSave(
		serializeSave(
			createSaveDocument(
				learned,
				restored.exploration,
				restored.configuration,
				restored.fog,
			),
		),
	);
	expect(parsed.ok).toBe(true);
	if (!parsed.ok) throw new Error(parsed.error);
	expect(restoreSave(parsed.value).state.knownSpells).toContain("ember-bolt");
	expect(
		parsed.value.state.floorItems.some((entry) => entry.item.id === "new-book"),
	).toBe(false);
});
