// @vitest-environment node

import { describe, expect, it } from "vitest";
import { createGameState } from "../domain/game/GameState";
import {
	BAG_CAPACITY,
	createBag,
	createStartingBag,
} from "../domain/items/Bag";
import type { ItemInstance } from "../domain/items/Item";
import { bagWithSpareGear } from "./CarriedGearTestHelpers";
import { resolvePlayerActionWithHits as resolvePlayerAction } from "./ControlledCombatTestHelpers";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";
import { createThreeFloorTraversalRun } from "./testhelpers";

const swords = (count: number): ItemInstance[] =>
	Array.from({ length: count }, (_, index) => ({
		id: `sword:${index + 1}`,
		kind: "short-sword",
	}));

describe("Bag capacity and ownership", () => {
	it("starts empty when no items are supplied", () => {
		expect(createBag().items).toEqual([]);
		expect(BAG_CAPACITY).toBe(27);
	});
	it.each([2, 27])(
		"holds %i distinct item copies, including copies of the same kind",
		(count) => {
			const items = swords(count);
			const bag = createBag(items);
			expect(bag.items).toEqual(items);
			expect(new Set(bag.items.map((item) => item.id)).size).toBe(count);
		},
	);
	it("rejects more than twenty-seven occupied slots", () => {
		expect(() => createBag(swords(28))).toThrow(/27/);
	});
	it("rejects duplicate ownership of the same item identity", () => {
		const item = swords(1)[0];
		expect(() => createBag([item, item])).toThrow(/same item/i);
	});
	it("does not retain the caller's mutable array", () => {
		const items = swords(2);
		const bag = createBag(items);
		items.pop();
		expect(bag.items).toHaveLength(2);
	});
});

describe("Starting and retained bags", () => {
	it("starts with an empty bag while keeping the equipped sword and shield", () => {
		const game = createGameState(createThreeFloorTraversalRun());
		expect(game.bag.items).toEqual([]);
		expect(game.equipment.mainHand?.kind).toBe("short-sword");
		expect(game.equipment.offHand?.kind).toBe("wooden-shield");
	});
	it("creates fresh bag instances with reproducible initial contents", () => {
		const first = createStartingBag();
		const next = createStartingBag();
		expect(next).toEqual(first);
		expect(next.items).not.toBe(first.items);
		expect(next.items).toEqual([]);
	});
	it("empties the bag on replay without changing the previous bag", () => {
		const original = createGameState(createThreeFloorTraversalRun());
		const changed = { ...original, bag: bagWithSpareGear() };
		expect(createGameState(changed.run).bag).toEqual(original.bag);
		expect(changed.bag.items).toEqual(bagWithSpareGear().items);
	});
	it("retains the bag through movement, floor traversal, waiting, and blocked movement", () => {
		const original = {
			...createGameState(createThreeFloorTraversalRun()),
			monsters: [],
		};
		const descended = resolvePlayerAction(original, {
			type: "move",
			direction: "right",
		}).state;
		const walked = resolvePlayerAction(descended, {
			type: "move",
			direction: "right",
		}).state;
		const ascended = resolvePlayerAction(walked, {
			type: "move",
			direction: "left",
		}).state;
		const waited = resolvePlayerAction(ascended, { type: "wait" }).state;
		const blocked = resolvePlayerAction(waited, {
			type: "move",
			direction: "up",
		}).state;
		expect(descended.run.activeFloor).toBe(2);
		expect(ascended.run.activeFloor).toBe(1);
		for (const game of [descended, walked, ascended, waited, blocked])
			expect(game.bag).toBe(original.bag);
	});
	it("retains carried gear in combat without adding its bonuses to attack or armor", () => {
		const game = {
			...createGameState(createCorridorEncounter()),
			bag: bagWithSpareGear(),
			monsters: [
				{
					intent: { type: "idle" as const },
					id: "1:1",
					kind: "goblin" as const,
					floorNumber: 1,
					coordinate: { row: 1, col: 2 },
					health: 4,
				},
			],
		};
		const result = resolvePlayerAction(game, {
			type: "move",
			direction: "right",
		}).state;
		expect(result.bag).toBe(game.bag);
		expect(result.monsters[0].health).toBe(2);
		expect(result.player.health).toBe(9);
	});
});
