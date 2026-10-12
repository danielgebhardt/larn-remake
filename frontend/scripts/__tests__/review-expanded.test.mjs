// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createCorridorEncounter } from "../../src/__tests/MonsterEncounterTestHelpers";
import { createGameState } from "../../src/domain/game/GameState";
import { createBag } from "../../src/domain/items/Bag";
import { chooseSpellAwareAction } from "../review-policy.mjs";

const quiet = () => ({
	...createGameState(createCorridorEncounter()),
	monsters: [],
	floorItems: [],
	objects: [],
});
const route = () => ["right"];
describe("Expanded adventure diagnostic decisions", () => {
	it("learns an unknown spellbook even with a full bag", () => {
		const before = quiet();
		before.bag = createBag(
			Array.from({ length: 20 }, (_, i) => ({
				id: `copy:${i}`,
				kind: "wooden-shield",
			})),
		);
		before.floorItems = [
			{
				item: { id: "book", kind: "book-shock" },
				floorNumber: 1,
				coordinate: before.run.playerCoordinate,
			},
		];
		expect(chooseSpellAwareAction(before, route)).toEqual({
			type: "pickup",
			itemId: "book",
		});
	});
	it("equips a ring into the useful compatible slot", () => {
		const before = quiet();
		before.equipment = {
			...before.equipment,
			leftRing: { id: "left", kind: "ring-strength" },
		};
		before.bag = createBag([{ id: "right", kind: "copper-ring" }]);
		expect(chooseSpellAwareAction(before, route)).toEqual({
			type: "equip",
			itemId: "right",
			slot: "rightRing",
		});
	});
	it("uses acquired elemental damage against a weakness", () => {
		const before = quiet();
		before.knownSpells = ["magic-missile", "frost-bolt"];
		before.monsters = [
			{
				id: "1:1",
				kind: "salamander",
				health: 50,
				floorNumber: 1,
				coordinate: { row: 1, col: 3 },
				intent: { type: "idle" },
			},
		];
		expect(chooseSpellAwareAction(before, route)).toEqual({
			type: "cast",
			spell: "frost-bolt",
			targetId: "1:1",
		});
	});
	it("cleanses poison before taking its next tick", () => {
		const before = quiet();
		before.bag = createBag([{ id: "antidote", kind: "antidote" }]);
		before.effects = [
			{ actorId: "player", floorNumber: null, kind: "poisoned", remaining: 3 },
		];
		expect(chooseSpellAwareAction(before, route)).toEqual({
			type: "consume",
			itemId: "antidote",
		});
	});
	it("opens a reachable archive once and ignores it after use", () => {
		const before = quiet();
		before.objects = [
			{
				id: "archive",
				kind: "archive",
				floorNumber: 1,
				coordinate: before.run.playerCoordinate,
				activated: false,
			},
		];
		expect(chooseSpellAwareAction(before, route)).toEqual({
			type: "interact",
			objectId: "archive",
			choice: "read",
		});
		before.objects = before.objects.map((o) => ({ ...o, activated: true }));
		expect(chooseSpellAwareAction(before, route).type).toBe("move");
	});
});
