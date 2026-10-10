// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createGameState } from "../domain/game/GameState";
import { resolvePlayerAction } from "../domain/game/PlayerActions";
import { createBag } from "../domain/items/Bag";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

const state = () => ({
	...createGameState(createCorridorEncounter()),
	monsters: [],
	floorItems: [
		{
			item: { id: "loot:1", kind: "iron-sword" as const },
			floorNumber: 1,
			coordinate: { row: 1, col: 1 },
		},
		{
			item: { id: "loot:2", kind: "wooden-shield" as const },
			floorNumber: 1,
			coordinate: { row: 1, col: 1 },
		},
	],
});

describe("Floor item transfers", () => {
	it("picks up one chosen item without losing other items on the tile", () => {
		const before = state();
		const snapshot = structuredClone(before);
		const result = resolvePlayerAction(before, {
			type: "pickup",
			itemId: "loot:2",
		}).state;
		expect(result.bag.items.at(-1)).toBe(before.floorItems[1].item);
		expect(result.floorItems).toEqual([before.floorItems[0]]);
		expect(result.turn).toBe(1);
		expect(result.activityHistory.entries[0].event).toMatchObject({
			type: "item-picked-up",
			item: "wooden-shield",
		});
		expect(before).toEqual(snapshot);
	});
	it("drops a carried item onto the current tile without duplicating its identity", () => {
		const before = state();
		const item = before.bag.items[0];
		const result = resolvePlayerAction(before, {
			type: "drop",
			itemId: item.id,
		}).state;
		expect(result.bag.items).toEqual([before.bag.items[1]]);
		expect(result.floorItems.at(-1)).toEqual({
			item,
			floorNumber: 1,
			coordinate: { row: 1, col: 1 },
		});
		expect(result.floorItems).toHaveLength(3);
		expect(result.turn).toBe(1);
	});
	it("rejects pickup when the bag is full without a turn or monster phase", () => {
		const before = {
			...state(),
			bag: createBag(
				Array.from({ length: 20 }, (_, index) => ({
					id: `spare:${index}`,
					kind: "short-sword",
				})),
			),
		};
		const result = resolvePlayerAction(before, {
			type: "pickup",
			itemId: "loot:1",
		});
		expect(result.state).toBe(before);
		expect(result.turnAdvanced).toBe(false);
		expect(result.error).toMatch(/full/i);
	});
	it.each(["missing", "starting:main-hand"])(
		"rejects dropping an unavailable or equipped item %s",
		(itemId) => {
			const before = state();
			expect(resolvePlayerAction(before, { type: "drop", itemId }).state).toBe(
				before,
			);
		},
	);
	it.each(["other tile", "other floor"])(
		"rejects pickup from an %s",
		(location) => {
			const before = state();
			before.floorItems = [
				{
					...before.floorItems[0],
					floorNumber: location === "other floor" ? 2 : 1,
					coordinate: { row: 1, col: 2 },
				},
			];
			const result = resolvePlayerAction(before, {
				type: "pickup",
				itemId: "loot:1",
			});
			expect(result.state).toBe(before);
			expect(result.turnAdvanced).toBe(false);
		},
	);
	it("retains dropped items across floor visits and restores the fresh-run state on replay", () => {
		const before = state();
		const dropped = resolvePlayerAction(before, {
			type: "drop",
			itemId: "starting:bag:1",
		}).state;
		const onStair = {
			...dropped,
			run: { ...dropped.run, playerCoordinate: { row: 1, col: 11 } },
		};
		const descended = resolvePlayerAction(onStair, {
			type: "move",
			direction: "right",
		}).state;
		const away = resolvePlayerAction(descended, {
			type: "move",
			direction: "right",
		}).state;
		const returned = resolvePlayerAction(away, {
			type: "move",
			direction: "left",
		}).state;
		expect(returned.run.activeFloor).toBe(1);
		expect(returned.floorItems).toBe(dropped.floorItems);
		const fresh = createGameState(before.run);
		expect(
			fresh.floorItems.some((entry) => entry.item.id === "starting:bag:1"),
		).toBe(false);
		expect(fresh.bag.items.some((item) => item.id === "starting:bag:1")).toBe(
			true,
		);
	});
	it.each(["pickup", "drop"] as const)(
		"runs one monster phase after a successful %s",
		(type) => {
			const before = {
				...state(),
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
				type,
				itemId: type === "pickup" ? "loot:1" : "starting:bag:1",
			}).state;
			expect(result.turn).toBe(1);
			expect(result.player.health).toBe(9);
			expect(
				result.activityHistory.entries.map((entry) => entry.event.type),
			).toEqual([
				type === "pickup" ? "item-picked-up" : "item-dropped",
				"monster-hit",
			]);
		},
	);
	it("does not activate a stair when dropping on it, and the item does not block later traversal", () => {
		const before = state();
		before.run = { ...before.run, playerCoordinate: { row: 1, col: 12 } };
		const dropped = resolvePlayerAction(before, {
			type: "drop",
			itemId: "starting:bag:1",
		}).state;
		expect(dropped.run).toBe(before.run);
		const away = resolvePlayerAction(dropped, {
			type: "move",
			direction: "left",
		}).state;
		expect(
			resolvePlayerAction(away, { type: "move", direction: "right" }).state.run
				.activeFloor,
		).toBe(2);
	});
	it.each(["pickup", "drop"] as const)(
		"does not allow %s after death",
		(type) => {
			const before = { ...state(), player: { health: 0, maxHealth: 10 } };
			expect(resolvePlayerAction(before, { type, itemId: "loot:1" })).toEqual({
				state: before,
				turnAdvanced: false,
			});
		},
	);
});
