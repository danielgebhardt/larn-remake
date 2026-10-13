// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createGameState } from "../domain/game/GameState";
import type { ItemKind } from "../domain/items/Item";
import { equipmentSalePrice } from "../domain/merchant/MerchantRules";
import { resolvePlayerActionWithHits as resolvePlayerAction } from "./ControlledCombatTestHelpers";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

const shop = (kind: ItemKind = "iron-sword") => ({
	...createGameState(createCorridorEncounter()),
	gold: 2000,
	monsters: [],
	floorItems: [],
	bag: {
		items: [
			{ id: "bag:gear", kind },
			{ id: "bag:other", kind: "iron-sword" as const },
		],
	},
	objects: [
		{
			id: "floor:1:object:merchant:1",
			kind: "merchant" as const,
			floorNumber: 1,
			coordinate: { row: 1, col: 2 },
			activated: false,
		},
	],
});
const sale = {
	type: "sell" as const,
	merchantId: "floor:1:object:merchant:1",
	itemId: "bag:gear",
};
describe("Merchant equipment sales", () => {
	it("sells one selected instance for its displayed value without touching shared stock", () => {
		const before = shop(),
			sold = resolvePlayerAction(before, sale);
		expect(sold.turnAdvanced).toBe(true);
		expect(sold.state.turn).toBe(1);
		expect(sold.state.gold).toBe(
			2000 + (equipmentSalePrice(before.bag.items[0]) ?? 0),
		);
		expect(sold.state.bag.items.map((i) => i.id)).toEqual(["bag:other"]);
		expect(sold.state.merchantStock).toBe(before.merchantStock);
		expect(sold.state.equipment).toBe(before.equipment);
		expect(resolvePlayerAction(sold.state, sale).state).toBe(sold.state);
	});
	it.each(["healing-potion", "book-ember-bolt", "cure"] as const)(
		"does not buy %s",
		(kind) => {
			const state = shop(kind),
				result = resolvePlayerAction(state, sale);
			expect(result.state).toBe(state);
			expect(result.turnAdvanced).toBe(false);
		},
	);
	it("rejects equipped ownership and out-of-reach requests without a turn", () => {
		const state = shop();
		expect(
			resolvePlayerAction(state, { ...sale, itemId: "starting:main-hand" })
				.state,
		).toBe(state);
		const away = { ...state, objects: [] };
		expect(resolvePlayerAction(away, sale).state).toBe(away);
	});
	it("allows a normal fatal response while retaining completed sale ownership", () => {
		const state = {
			...shop(),
			player: { health: 1, maxHealth: 10 },
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
		const result = resolvePlayerAction(state, sale);
		expect(result.state.player.health).toBe(0);
		expect(result.state.bag.items.map((i) => i.id)).toEqual(["bag:other"]);
		expect(result.state.turn).toBe(1);
	});
});
