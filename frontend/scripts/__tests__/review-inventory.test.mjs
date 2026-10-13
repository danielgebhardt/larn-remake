// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createCorridorEncounter } from "../../src/__tests/MonsterEncounterTestHelpers";
import { createGameState } from "../../src/domain/game/GameState";
import { createBag } from "../../src/domain/items/Bag";
import { canReviewPickUp } from "../review-inventory.mjs";
import { chooseSpellAwareAction } from "../review-policy.mjs";
import { createRoutes } from "../review-routing.mjs";
import { reviewRoutingFloor } from "../review-terrain.mjs";

const quiet = () => ({
	...createGameState(createCorridorEncounter()),
	monsters: [],
	objects: [],
});
describe("Diagnostic inventory and elite boundaries", () => {
	it("still picks up useful supplies after carrying more bottles than slot capacity", () => {
		const state = quiet();
		state.bag = createBag(
			Array.from({ length: 30 }, (_, i) => ({
				id: `mana:${i}`,
				kind: "mana-potion",
			})),
		);
		state.floorItems = [
			{
				item: { id: "healing", kind: "healing-potion" },
				floorNumber: 1,
				coordinate: state.run.playerCoordinate,
			},
		];
		expect(chooseSpellAwareAction(state, () => ["right"])).toEqual({
			type: "pickup",
			itemId: "healing",
		});
	});
	it("accepts another existing potion stack when all 27 occupied slots are full", () => {
		const state = quiet();
		state.bag = createBag([
			...Array.from({ length: 26 }, (_, i) => ({
				id: `shield:${i}`,
				kind: "wooden-shield",
			})),
			{ id: "bottle", kind: "healing-potion" },
		]);
		state.floorItems = [
			{
				item: { id: "another", kind: "healing-potion" },
				floorNumber: 1,
				coordinate: state.run.playerCoordinate,
			},
		];
		expect(chooseSpellAwareAction(state, () => ["right"])).toEqual({
			type: "pickup",
			itemId: "another",
		});
	});
	it("can route through a bump-open ordinary door but not a closed elite gate", () => {
		const state = quiet();
		const door = {
			id: "gate",
			kind: "elite-door",
			floorNumber: 1,
			coordinate: { row: 1, col: 2 },
			activated: false,
		};
		state.objects = [door];
		expect(
			createRoutes(
				reviewRoutingFloor(state),
				state.run.playerCoordinate,
			)({ row: 1, col: 3 }),
		).toBeNull();
		state.objects = [{ ...door, kind: "door" }];
		expect(
			createRoutes(
				reviewRoutingFloor(state),
				state.run.playerCoordinate,
			)({ row: 1, col: 3 }),
		).toEqual(["right", "right"]);
	});
	it("keeps book, cure and empty-slot pickup available even with a full bag", () => {
		const state = quiet();
		state.bag = createBag(
			Array.from({ length: 27 }, (_, i) => ({
				id: `shield:${i}`,
				kind: "wooden-shield",
			})),
		);
		expect(canReviewPickUp(state, { id: "book", kind: "book-sleep" })).toBe(
			true,
		);
		expect(canReviewPickUp(state, { id: "cure", kind: "cure" })).toBe(true);
		expect(canReviewPickUp(state, { id: "chest", kind: "leather-armor" })).toBe(
			true,
		);
		expect(canReviewPickUp(state, { id: "sword", kind: "iron-sword" })).toBe(
			false,
		);
		expect(
			canReviewPickUp(
				{ ...state, knownSpells: [...state.knownSpells, "sleep"] },
				{ id: "book", kind: "book-sleep" },
			),
		).toBe(false);
	});
});
