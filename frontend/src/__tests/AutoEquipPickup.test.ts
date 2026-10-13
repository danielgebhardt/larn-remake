// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createGameState, type GameState } from "../domain/game/GameState";
import { createBag } from "../domain/items/Bag";
import { createEquipment, type EquipmentSlot } from "../domain/items/Equipment";
import type { ItemKind } from "../domain/items/Item";
import { resolvePlayerActionWithHits as resolve } from "./ControlledCombatTestHelpers";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

const pickupState = (kind: ItemKind): GameState => ({
	...createGameState(createCorridorEncounter()),
	equipment: createEquipment(),
	monsters: [],
	floorItems: [
		{
			item: { id: "pickup:1", kind },
			floorNumber: 1,
			coordinate: { row: 1, col: 1 },
		},
	],
});
const pickup = { type: "pickup", itemId: "pickup:1" } as const;
describe("Automatic equipment pickup", () => {
	it.each([
		["iron-sword", "mainHand"],
		["wooden-shield", "offHand"],
		["leather-armor", "chest"],
		["leather-cap", "head"],
		["copper-ring", "leftRing"],
	] as const)(
		"equips %s into empty %s in the pickup turn",
		(kind, slot: EquipmentSlot) => {
			const before = pickupState(kind);
			const snapshot = structuredClone(before);
			const result = resolve(before, pickup);
			expect(result.state.equipment[slot]).toBe(before.floorItems[0].item);
			expect(result.state.bag.items).toEqual([]);
			expect(result.state.floorItems).toEqual([]);
			expect(result.state.turn).toBe(1);
			expect(result.state.activityHistory.entries.map((e) => e.event)).toEqual([
				{ type: "item-picked-up", item: kind, turn: 1 },
				{ type: "item-equipped", item: kind, slot, turn: 1 },
			]);
			expect(before).toEqual(snapshot);
		},
	);
	it("fills the right ring after the left, then carries further rings without replacing either", () => {
		let state = pickupState("copper-ring");
		state = resolve(state, pickup).state;
		const left = state.equipment.leftRing;
		state = {
			...state,
			floorItems: [
				{
					item: { id: "pickup:2", kind: "ring-intelligence" },
					floorNumber: 1,
					coordinate: state.run.playerCoordinate,
				},
			],
		};
		state = resolve(state, { type: "pickup", itemId: "pickup:2" }).state;
		const right = state.equipment.rightRing;
		state = {
			...state,
			floorItems: [
				{
					item: { id: "pickup:3", kind: "ring-strength" },
					floorNumber: 1,
					coordinate: state.run.playerCoordinate,
				},
			],
		};
		const result = resolve(state, { type: "pickup", itemId: "pickup:3" }).state;
		expect(result.equipment.leftRing).toBe(left);
		expect(result.equipment.rightRing).toBe(right);
		expect(result.bag.items).toEqual([state.floorItems[0].item]);
	});
	it("equips directly even with a full bag", () => {
		const before = {
			...pickupState("leather-cap"),
			bag: createBag(
				Array.from({ length: 27 }, (_, i) => ({
					id: `bag:${i}`,
					kind: "short-sword",
				})),
			),
		};
		const result = resolve(before, pickup);
		expect(result.error).toBeUndefined();
		expect(result.state.equipment.head).toBe(before.floorItems[0].item);
		expect(result.state.bag).toBe(before.bag);
		expect(result.state.turn).toBe(1);
	});
	it("does not heal when auto-equipped gear increases capacity", () => {
		const before = {
			...pickupState("ring-vitality"),
			player: { health: 6, maxHealth: 10 },
		};
		const result = resolve(before, pickup).state;
		expect(result.equipment.leftRing?.kind).toBe("ring-vitality");
		expect(result.player.maxHealth).toBeGreaterThan(10);
		expect(result.player.health).toBe(6);
	});
	it("does not refill mana when a picked-up ring adds mana capacity", () => {
		const before = { ...pickupState("ring-mana"), mana: 2 };
		const result = resolve(before, pickup).state;
		expect(result.equipment.leftRing?.kind).toBe("ring-mana");
		expect(result.mana).toBe(2);
	});
	it("uses new armor before the one monster retaliation phase", () => {
		const before = pickupState("plate-armor");
		const actor = {
			id: "orc:1",
			kind: "orc" as const,
			floorNumber: 1,
			coordinate: { row: 1, col: 2 },
			health: 8,
			intent: { type: "idle" as const },
		};
		const result = resolve({ ...before, monsters: [actor] }, pickup).state;
		expect(result.player.health).toBe(before.player.health - 1);
		const attacks = result.activityHistory.entries.filter(
			(entry) => entry.event.type === "monster-hit",
		);
		expect(attacks).toHaveLength(1);
		expect(attacks[0].event).toMatchObject({ turn: 1, damage: 1 });
	});
	it("rejects an already-owned floor identity before auto-equipping", () => {
		const before = pickupState("leather-cap");
		before.bag = createBag([before.floorItems[0].item]);
		const result = resolve(before, pickup);
		expect(result.state).toBe(before);
		expect(result.turnAdvanced).toBe(false);
		expect(result.error).toMatch(/already own/);
	});
});
