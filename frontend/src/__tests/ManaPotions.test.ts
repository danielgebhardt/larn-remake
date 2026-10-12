// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
	connectDungeonFloors,
	generateDungeonRun,
} from "../domain/dungeon/DungeonRun";
import { DEFAULT_RUN_CONFIGURATION } from "../domain/dungeon/RunConfiguration";
import { createGameState } from "../domain/game/GameState";
import { createBag } from "../domain/items/Bag";
import { eligibleLootKinds } from "../domain/items/Item";
import { spawnRunItems } from "../domain/items/ItemPlacement";
import { createMonsterDrop } from "../domain/items/MonsterDrops";
import { hotbarSlotContents } from "../domain/items/PotionHotbar";
import { resolvePlayerActionWithHits } from "./ControlledCombatTestHelpers";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

const potion = { id: "mana:1", kind: "mana-potion" } as const;
const ready = (mana = 0) => ({
	...createGameState(createCorridorEncounter()),
	mana,
	monsters: [],
	bag: createBag([
		potion,
		{ id: "mana:2", kind: "mana-potion" },
		{ id: "health", kind: "healing-potion" },
	]),
});
describe("Mana potions", () => {
	it.each([
		[0, 5],
		[8, 10],
	])(
		"restores mana from %i to %i, removing only that copy",
		(mana, expected) => {
			const before = ready(mana);
			const result = resolvePlayerActionWithHits(before, {
				type: "consume",
				itemId: potion.id,
			});
			expect(result.turnAdvanced).toBe(true);
			expect(result.state.mana).toBe(expected);
			expect(result.state.player).toBe(before.player);
			expect(result.state.turn).toBe(1);
			expect(result.state.bag.items.map((i) => i.id)).toEqual([
				"mana:2",
				"health",
			]);
			expect(result.state.activityHistory.entries[0].event).toMatchObject({
				type: "item-consumed",
				item: "mana-potion",
				recovered: expected - mana,
			});
		},
	);
	it("uses earned capacity and restores before normal retaliation", () => {
		const before = {
			...ready(10),
			progression: { experience: 100 },
			monsters: [
				{
					intent: { type: "idle" as const },
					id: "1:1",
					kind: "orc" as const,
					floorNumber: 1,
					coordinate: { row: 1, col: 2 },
					health: 9,
				},
			],
		};
		const after = resolvePlayerActionWithHits(before, {
			type: "consume",
			itemId: potion.id,
		}).state;
		expect(after.mana).toBe(14);
		expect(after.player.health).toBeLessThan(10);
		expect(after.activityHistory.entries.map((e) => e.event.type)).toEqual([
			"item-consumed",
			"monster-hit",
		]);
	});
	it("keeps a full-mana potion and rejects stale or ended uses for free", () => {
		const before = ready(10);
		const result = resolvePlayerActionWithHits(before, {
			type: "consume",
			itemId: potion.id,
		});
		expect(result.state).toBe(before);
		expect(result.error).toMatch(/full mana/);
		const stale = ready();
		expect(
			resolvePlayerActionWithHits(stale, { type: "consume", itemId: "missing" })
				.state,
		).toBe(stale);
		const dead = { ...ready(), player: { health: 0, maxHealth: 10 } };
		expect(
			resolvePlayerActionWithHits(dead, { type: "consume", itemId: potion.id })
				.state,
		).toBe(dead);
	});
	it("automatically assigns a new potion kind to the first free slot and counts each kind separately", () => {
		const initial = createGameState(createCorridorEncounter());
		const before = {
			...initial,
			mana: 0,
			monsters: [],
			bag: createBag([{ id: "health", kind: "healing-potion" }]),
			potionHotbar: ["healing-potion", null, null, null] as const,
			floorItems: [
				{
					floorNumber: 1,
					coordinate: initial.run.playerCoordinate,
					item: potion,
				},
			],
		};
		const picked = resolvePlayerActionWithHits(before, {
			type: "pickup",
			itemId: potion.id,
		}).state;
		expect(picked.potionHotbar).toEqual([
			"healing-potion",
			"mana-potion",
			null,
			null,
		]);
		expect(hotbarSlotContents(picked, 2).count).toBe(1);
		const used = resolvePlayerActionWithHits(picked, {
			type: "use-hotbar",
			slot: 2,
		}).state;
		expect(used.mana).toBe(5);
		expect(used.turn).toBe(2);
		expect(hotbarSlotContents(used, 1).count).toBe(1);
		expect(hotbarSlotContents(used, 2).count).toBe(0);
	});
	it("is eligible through floor 20 and deterministic in found and dropped loot", () => {
		for (const floor of [1, 5, 20])
			for (const source of ["found", "drop"] as const)
				expect(eligibleLootKinds(floor, source)).toContain("mana-potion");
		const run = connectDungeonFloors(
			generateDungeonRun(123, 5, DEFAULT_RUN_CONFIGURATION),
		);
		const items = spawnRunItems(run, [], 20);
		expect(items.some((entry) => entry.item.kind === "mana-potion")).toBe(true);
		expect(spawnRunItems(run, [], 20)).toEqual(items);
		const extended = connectDungeonFloors(
			generateDungeonRun(123, 10, DEFAULT_RUN_CONFIGURATION),
		);
		expect(
			spawnRunItems(extended, [], 20).filter((entry) => entry.floorNumber <= 5),
		).toEqual(items);
		const drops = Array.from({ length: 40 }, (_, seed) =>
			createMonsterDrop(seed, {
				intent: { type: "idle" as const },
				id: "1:1",
				kind: "goblin",
				health: 0,
				floorNumber: 1,
				coordinate: { row: 1, col: 2 },
			}),
		);
		expect(drops.some((drop) => drop?.item.kind === "mana-potion")).toBe(true);
	});
});
