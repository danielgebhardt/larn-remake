// @vitest-environment node

import { describe, expect, it } from "vitest";
import { deriveCombatStats } from "../domain/game/CombatStats";
import { createGameState } from "../domain/game/GameState";
import { resolvePlayerAction } from "../domain/game/PlayerActions";
import { createBag } from "../domain/items/Bag";
import { createEquipment } from "../domain/items/Equipment";
import { MONSTER_DEFINITIONS } from "../domain/monsters/Monster";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

const game = () => ({
	...createGameState(createCorridorEncounter()),
	monsters: [],
});
const ownership = (state: ReturnType<typeof createGameState>) =>
	[state.equipment.mainHand, state.equipment.offHand, ...state.bag.items]
		.filter((item) => item !== null)
		.map((item) => item.id)
		.sort();

describe("Gear transfers", () => {
	it("swaps a weapon into the main hand and returns the old weapon to the vacated bag slot", () => {
		const before = game();
		const snapshot = structuredClone(before);
		const result = resolvePlayerAction(before, {
			type: "equip",
			itemId: "starting:bag:1",
			slot: "mainHand",
		});
		expect(result.turnAdvanced).toBe(true);
		expect(result.state.equipment.mainHand).toBe(before.bag.items[0]);
		expect(result.state.bag.items).toEqual([
			before.equipment.mainHand,
			before.bag.items[1],
		]);
		expect(ownership(result.state)).toEqual(ownership(before));
		expect(deriveCombatStats(result.state.equipment).attack).toBe(3);
		expect(before).toEqual(snapshot);
	});
	it("swaps a shield without confusing distinct copies of the same kind", () => {
		const before = game();
		const result = resolvePlayerAction(before, {
			type: "equip",
			itemId: "starting:bag:2",
			slot: "offHand",
		}).state;
		expect(result.equipment.offHand?.id).toBe("starting:bag:2");
		expect(result.bag.items[1]?.id).toBe("starting:off-hand");
		expect(ownership(result)).toEqual(ownership(before));
	});
	it("can swap when the bag is full", () => {
		const before = {
			...game(),
			bag: createBag(
				Array.from({ length: 20 }, (_, index) => ({
					id: `sword:${index}`,
					kind: "iron-sword",
				})),
			),
		};
		const result = resolvePlayerAction(before, {
			type: "equip",
			itemId: "sword:0",
			slot: "mainHand",
		});
		expect(result.turnAdvanced).toBe(true);
		expect(result.state.bag.items).toHaveLength(20);
		expect(ownership(result.state)).toEqual(ownership(before));
	});
	it("equips an empty slot and removes the item from the bag", () => {
		const before = { ...game(), equipment: createEquipment() };
		const result = resolvePlayerAction(before, {
			type: "equip",
			itemId: "starting:bag:1",
			slot: "mainHand",
		}).state;
		expect(result.equipment.mainHand?.kind).toBe("iron-sword");
		expect(result.bag.items).toEqual([before.bag.items[1]]);
		expect(ownership(result)).toEqual(ownership(before));
	});
	it.each(["mainHand", "offHand"] as const)(
		"unequips the %s item into free bag space",
		(slot) => {
			const before = game();
			const result = resolvePlayerAction(before, {
				type: "unequip",
				slot,
			}).state;
			expect(result.equipment[slot]).toBeNull();
			expect(result.bag.items.at(-1)).toBe(before.equipment[slot]);
			expect(ownership(result)).toEqual(ownership(before));
			expect(result.turn).toBe(1);
		},
	);
	it("rejects unequipping into a full bag without using a turn or changing state", () => {
		const before = {
			...game(),
			bag: createBag(
				Array.from({ length: 20 }, (_, index) => ({
					id: `sword:${index}`,
					kind: "iron-sword",
				})),
			),
		};
		const result = resolvePlayerAction(before, {
			type: "unequip",
			slot: "mainHand",
		});
		expect(result.state).toBe(before);
		expect(result.turnAdvanced).toBe(false);
		expect(result.error).toMatch(/bag is full/i);
	});
	it.each([
		{ type: "equip", itemId: "missing", slot: "mainHand" },
		{ type: "equip", itemId: "starting:bag:1", slot: "offHand" },
		{ type: "equip", itemId: "starting:bag:2", slot: "mainHand" },
	] as const)(
		"rejects an unavailable or incompatible item: $itemId in $slot",
		(action) => {
			const before = game();
			const result = resolvePlayerAction(before, action);
			expect(result.state).toBe(before);
			expect(result.turnAdvanced).toBe(false);
			expect(result.error).toBeTruthy();
		},
	);
	it("rejects unequipping an empty slot", () => {
		const before = { ...game(), equipment: createEquipment() };
		const result = resolvePlayerAction(before, {
			type: "unequip",
			slot: "mainHand",
		});
		expect(result.state).toBe(before);
		expect(result.turnAdvanced).toBe(false);
		expect(result.error).toMatch(/empty/i);
	});
});

describe("Gear action turns", () => {
	it.each(["equip", "unequip"] as const)(
		"uses the new armor value during the %s action's monster phase",
		(type) => {
			const originalDamage = MONSTER_DEFINITIONS.goblin.attackDamage;
			MONSTER_DEFINITIONS.goblin.attackDamage = 4;
			try {
				const before = game();
				const state = {
					...before,
					equipment:
						type === "equip"
							? createEquipment(before.equipment.mainHand)
							: before.equipment,
					monsters: [
						{
							id: "1:1",
							kind: "goblin" as const,
							floorNumber: 1,
							coordinate: { row: 1, col: 2 },
							health: 4,
						},
					],
				};
				const action =
					type === "equip"
						? { type, itemId: "starting:bag:2", slot: "offHand" as const }
						: { type, slot: "offHand" as const };
				const result = resolvePlayerAction(state, action).state;
				expect(result.player.health).toBe(type === "equip" ? 7 : 6);
				expect(result.activityHistory.entries[1].event).toMatchObject({
					type: "monster-hit",
					damage: type === "equip" ? 3 : 4,
				});
			} finally {
				MONSTER_DEFINITIONS.goblin.attackDamage = originalDamage;
			}
		},
	);
	it("does not activate stairs or wake inactive-floor monsters while changing gear", () => {
		const before = game();
		const inactive = {
			id: "2:1",
			kind: "goblin" as const,
			floorNumber: 2,
			coordinate: { row: 1, col: 1 },
			health: 4,
		};
		const state = {
			...before,
			run: { ...before.run, playerCoordinate: { row: 1, col: 12 } },
			monsters: [inactive],
		};
		const result = resolvePlayerAction(state, {
			type: "unequip",
			slot: "mainHand",
		}).state;
		expect(result.run).toBe(state.run);
		expect(result.run.activeFloor).toBe(1);
		expect(result.monsters[0]).toBe(inactive);
		expect(result.player.health).toBe(10);
	});
	it("changes gear before exactly one monster phase and logs actions in order", () => {
		const before = {
			...game(),
			monsters: [
				{
					id: "1:1",
					kind: "goblin" as const,
					floorNumber: 1,
					coordinate: { row: 1, col: 2 },
					health: 4,
				},
			],
		};
		const result = resolvePlayerAction(before, {
			type: "equip",
			itemId: "starting:bag:1",
			slot: "mainHand",
		}).state;
		expect(result.run).toBe(before.run);
		expect(result.turn).toBe(1);
		expect(result.player.health).toBe(9);
		expect(result.monsters[0].health).toBe(4);
		expect(
			result.activityHistory.entries.map((entry) => entry.event.type),
		).toEqual(["item-equipped", "monster-hit"]);
		expect(
			result.activityHistory.entries.every((entry) => entry.event.turn === 1),
		).toBe(true);
		const attacked = resolvePlayerAction(result, {
			type: "move",
			direction: "right",
		}).state;
		expect(attacked.monsters[0].health).toBe(1);
	});
	it("runs the monster phase for unequipping too", () => {
		const before = {
			...game(),
			monsters: [
				{
					id: "1:1",
					kind: "goblin" as const,
					floorNumber: 1,
					coordinate: { row: 1, col: 2 },
					health: 4,
				},
			],
		};
		const result = resolvePlayerAction(before, {
			type: "unequip",
			slot: "offHand",
		}).state;
		expect(result.player.health).toBe(9);
		expect(
			result.activityHistory.entries.map((entry) => entry.event.type),
		).toEqual(["item-unequipped", "monster-hit"]);
	});
	it("retains a completed transfer after fatal retaliation and prevents later gear changes", () => {
		const before = {
			...game(),
			player: { health: 1, maxHealth: 10 },
			monsters: [
				{
					id: "1:1",
					kind: "goblin" as const,
					floorNumber: 1,
					coordinate: { row: 1, col: 2 },
					health: 4,
				},
			],
		};
		const dead = resolvePlayerAction(before, {
			type: "equip",
			itemId: "starting:bag:1",
			slot: "mainHand",
		}).state;
		expect(dead.player.health).toBe(0);
		expect(dead.equipment.mainHand?.kind).toBe("iron-sword");
		expect(
			dead.activityHistory.entries.map((entry) => entry.event.type),
		).toEqual(["item-equipped", "monster-hit", "player-died"]);
		const rejected = resolvePlayerAction(dead, {
			type: "unequip",
			slot: "mainHand",
		});
		expect(rejected.state).toBe(dead);
		expect(rejected.turnAdvanced).toBe(false);
	});
});
