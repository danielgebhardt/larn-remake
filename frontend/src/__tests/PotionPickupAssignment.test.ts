// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createGameState, type GameState } from "../domain/game/GameState";
import { resolvePlayerAction } from "../domain/game/PlayerActions";
import { BAG_CAPACITY, createBag } from "../domain/items/Bag";
import { HOTBAR_SLOTS } from "../domain/items/PotionHotbar";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

const potion = { id: "floor:potion", kind: "healing-potion" } as const;
const pickupState = () => {
	const state = createGameState(createCorridorEncounter());
	return {
		...state,
		monsters: [],
		floorItems: [
			{ item: potion, floorNumber: 1, coordinate: state.run.playerCoordinate },
		],
	};
};
const pickUp = (state: GameState) =>
	resolvePlayerAction(state, { type: "pickup", itemId: potion.id });

describe("Automatic potion assignment on pickup", () => {
	it("assigns the first carried potion to slot 1 as part of the pickup turn", () => {
		const before = pickupState();
		const snapshot = structuredClone(before);
		const result = pickUp(before);
		expect(result.state.potionHotbar).toEqual([
			"healing-potion",
			null,
			null,
			null,
		]);
		expect(result.state.bag.items).toContainEqual(potion);
		expect(result.state.floorItems).toEqual([]);
		expect(result.state.turn).toBe(1);
		expect(result.turnAdvanced).toBe(true);
		expect(
			result.state.activityHistory.entries.map((entry) => entry.event.type),
		).toEqual(["item-picked-up"]);
		expect(before).toEqual(snapshot);
	});
	it.each(HOTBAR_SLOTS)(
		"preserves an existing slot %i assignment when acquiring a new copy",
		(slot) => {
			const initial = {
				...pickupState(),
				bag: createBag([{ id: "owned:potion", kind: "healing-potion" }]),
			};
			const assigned = resolvePlayerAction(initial, {
				type: "assign-hotbar",
				slot,
				itemId: "owned:potion",
			}).state;
			const before = {
				...initial,
				potionHotbar: assigned.potionHotbar,
				bag: createBag(),
			};
			expect(pickUp(before).state.potionHotbar).toBe(before.potionHotbar);
		},
	);
	it("adds another carried copy without changing or duplicating its shortcut", () => {
		const picked = pickUp(pickupState()).state;
		const nextPotion = {
			id: "floor:second-potion",
			kind: "healing-potion",
		} as const;
		const before = {
			...picked,
			floorItems: [
				{
					item: nextPotion,
					floorNumber: 1,
					coordinate: picked.run.playerCoordinate,
				},
			],
		};
		const result = resolvePlayerAction(before, {
			type: "pickup",
			itemId: nextPotion.id,
		});
		expect(result.state.potionHotbar).toBe(before.potionHotbar);
		expect(
			result.state.bag.items.filter((item) => item.kind === "healing-potion"),
		).toEqual([potion, nextPotion]);
	});
	it("does not undo a manually cleared assignment while another copy is carried", () => {
		const initial = {
			...pickupState(),
			bag: createBag([{ id: "owned:potion", kind: "healing-potion" }]),
		};
		const assigned = resolvePlayerAction(initial, {
			type: "assign-hotbar",
			slot: 1,
			itemId: "owned:potion",
		}).state;
		const cleared = resolvePlayerAction(assigned, {
			type: "clear-hotbar",
			slot: 1,
		}).state;
		expect(
			pickUp({ ...initial, potionHotbar: cleared.potionHotbar }).state
				.potionHotbar,
		).toBe(cleared.potionHotbar);
	});
	it("assigns again after all copies are dropped and the shortcut is cleared", () => {
		const picked = pickUp(pickupState()).state;
		const dropped = resolvePlayerAction(picked, {
			type: "drop",
			itemId: potion.id,
		}).state;
		expect(dropped.potionHotbar).toBe(picked.potionHotbar);
		const cleared = resolvePlayerAction(dropped, {
			type: "clear-hotbar",
			slot: 1,
		}).state;
		expect(pickUp(cleared).state.potionHotbar).toEqual([
			"healing-potion",
			null,
			null,
			null,
		]);
	});
	it("does not assign equipment", () => {
		const before = pickupState();
		const sword = { id: "floor:sword", kind: "iron-sword" } as const;
		const result = resolvePlayerAction(
			{ ...before, floorItems: [{ ...before.floorItems[0], item: sword }] },
			{ type: "pickup", itemId: sword.id },
		);
		expect(result.state.potionHotbar).toBe(before.potionHotbar);
	});
	it.each(["full bag", "missing item", "dead player"])(
		"leaves assignments unchanged for a %s pickup",
		(scenario) => {
			const initial = pickupState();
			const before = {
				...initial,
				bag:
					scenario === "full bag"
						? createBag(
								Array.from({ length: BAG_CAPACITY }, (_, index) => ({
									id: `sword:${index}`,
									kind: "iron-sword",
								})),
							)
						: initial.bag,
				floorItems: scenario === "missing item" ? [] : initial.floorItems,
				player:
					scenario === "dead player"
						? { ...initial.player, health: 0 }
						: initial.player,
			};
			const result = pickUp(before);
			expect(result.state).toBe(before);
			expect(result.turnAdvanced).toBe(false);
		},
	);
});
