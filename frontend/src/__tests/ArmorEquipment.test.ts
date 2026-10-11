// @vitest-environment node
import { describe, expect, it } from "vitest";
import { deriveCombatStats } from "../domain/game/CombatStats";
import { createGameState } from "../domain/game/GameState";
import { BAG_CAPACITY, createBag } from "../domain/items/Bag";
import { createEquipment } from "../domain/items/Equipment";
import { resolvePlayerActionWithHits as resolvePlayerAction } from "./ControlledCombatTestHelpers";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

const chest = { id: "chest:1", kind: "leather-armor" } as const;
const head = { id: "head:1", kind: "leather-cap" } as const;
const game = () => ({
	...createGameState(createCorridorEncounter()),
	monsters: [],
	bag: createBag([chest, head]),
});
describe("Chest and head equipment", () => {
	it.each([
		["chest", chest],
		["head", head],
	] as const)(
		"equips and unequips %s with one turn per action",
		(slot, item) => {
			const before = game();
			const snapshot = structuredClone(before);
			const equipped = resolvePlayerAction(before, {
				type: "equip",
				slot,
				itemId: item.id,
			});
			expect(equipped.state.equipment[slot]).toEqual(item);
			expect(equipped.state.bag.items).not.toContainEqual(item);
			expect(equipped.state.turn).toBe(1);
			const unequipped = resolvePlayerAction(equipped.state, {
				type: "unequip",
				slot,
			});
			expect(unequipped.state.equipment[slot]).toBeNull();
			expect(unequipped.state.bag.items).toContainEqual(item);
			expect(unequipped.state.turn).toBe(2);
			expect(before).toEqual(snapshot);
		},
	);
	it("sums all armor once and reduces an orc hit during the equip turn", () => {
		const before = {
			...game(),
			equipment: createEquipment(
				null,
				{ id: "shield", kind: "wooden-shield" },
				null,
				head,
			),
			monsters: [
				{
					id: "1:1",
					kind: "orc" as const,
					floorNumber: 1,
					coordinate: { row: 1, col: 2 },
					health: 7,
				},
			],
		};
		const equipped = resolvePlayerAction(before, {
			type: "equip",
			slot: "chest",
			itemId: chest.id,
		}).state;
		expect(deriveCombatStats(equipped.equipment).armor).toBe(3);
		expect(equipped.player.health).toBe(9);
		expect(
			equipped.activityHistory.entries.map((entry) => entry.event.type),
		).toEqual(["item-equipped", "monster-hit"]);
	});
	it("swaps armor without needing spare bag capacity", () => {
		const upgraded = { id: "chest:2", kind: "chain-armor" } as const;
		const before = {
			...game(),
			equipment: createEquipment(null, null, chest),
			bag: createBag([
				upgraded,
				...Array.from({ length: BAG_CAPACITY - 1 }, (_, i) => ({
					id: `sword:${i}`,
					kind: "short-sword" as const,
				})),
			]),
		};
		const swapped = resolvePlayerAction(before, {
			type: "equip",
			slot: "chest",
			itemId: upgraded.id,
		}).state;
		expect(swapped.equipment.chest).toEqual(upgraded);
		expect(swapped.bag.items[0]).toEqual(chest);
		expect(
			resolvePlayerAction(swapped, { type: "unequip", slot: "chest" }).state,
		).toBe(swapped);
	});
	it("rejects wrong slots, duplicate ownership, and dropping worn armor", () => {
		const before = game();
		expect(
			resolvePlayerAction(before, {
				type: "equip",
				slot: "head",
				itemId: chest.id,
			}).state,
		).toBe(before);
		const equipped = resolvePlayerAction(before, {
			type: "equip",
			slot: "chest",
			itemId: chest.id,
		}).state;
		expect(
			resolvePlayerAction(equipped, { type: "drop", itemId: chest.id }).state,
		).toBe(equipped);
		expect(() =>
			createEquipment(null, null, chest, { ...head, id: chest.id }),
		).toThrow(/same item/i);
	});
});
