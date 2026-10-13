// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createGameState, type GameState } from "../domain/game/GameState";
import { createBag } from "../domain/items/Bag";
import { resolvePlayerActionWithHits as resolvePlayerAction } from "./ControlledCombatTestHelpers";
import { createThreeFloorTraversalRun } from "./testhelpers";

const ready = (): GameState => ({
	...createGameState({
		...createThreeFloorTraversalRun(),
		activeFloor: 3,
		playerCoordinate: { row: 1, col: 2 },
	}),
	floorItems: [
		{
			item: { id: "quest:cure", kind: "cure" },
			floorNumber: 3,
			coordinate: { row: 1, col: 2 },
		},
	],
	monsters: [
		{
			intent: { type: "idle" as const },
			id: "3:1",
			kind: "goblin",
			floorNumber: 3,
			coordinate: { row: 2, col: 2 },
			health: 4,
		},
	],
});
describe("Protected cure recovery", () => {
	it("recovers with a full bag, uses one turn, and then runs monster retaliation", () => {
		const before = {
			...ready(),
			bag: createBag(
				Array.from({ length: 27 }, (_, i) => ({
					id: `potion:${i}`,
					kind: "healing-potion" as const,
				})),
			),
		};
		const picked = resolvePlayerAction(before, {
			type: "pickup",
			itemId: "quest:cure",
		}).state;
		expect(picked.quest.cureRecovered).toBe(true);
		expect(picked.escape).toEqual({ startedTurn: 1, activatedFloors: [] });
		expect(picked.bag).toBe(before.bag);
		expect(picked.floorItems).toEqual([]);
		expect(picked.turn).toBe(1);
		expect(picked.player.health).toBe(9);
		expect(picked.activityHistory.entries.map((x) => x.event.type)).toEqual([
			"item-picked-up",
			"escape-started",
			"monster-hit",
		]);
		expect(before.quest.cureRecovered).toBe(false);
	});
	it("cannot recover twice, drop, drink, or equip the protected cure", () => {
		const picked = resolvePlayerAction(ready(), {
			type: "pickup",
			itemId: "quest:cure",
		}).state;
		for (const action of [
			{ type: "pickup", itemId: "quest:cure" },
			{ type: "drop", itemId: "quest:cure" },
			{ type: "consume", itemId: "quest:cure" },
			{ type: "equip", itemId: "quest:cure", slot: "mainHand" },
		] as const) {
			const result = resolvePlayerAction(picked, action);
			expect(result.state).toBe(picked);
			expect(result.turnAdvanced).toBe(false);
			expect(result.error).toBeTruthy();
		}
	});
	it("can still die on the recovery turn and cannot recover after death", () => {
		const before = { ...ready(), player: { health: 1, maxHealth: 10 } };
		const picked = resolvePlayerAction(before, {
			type: "pickup",
			itemId: "quest:cure",
		}).state;
		expect(picked.quest.cureRecovered).toBe(true);
		expect(picked.player.health).toBe(0);
		expect(picked.quest.victory).toBeNull();
		const dead = { ...ready(), player: { health: 0, maxHealth: 10 } };
		expect(
			resolvePlayerAction(dead, { type: "pickup", itemId: "quest:cure" }).state,
		).toBe(dead);
	});
});
