// @vitest-environment node

import { describe, expect, it } from "vitest";
import { createGameState } from "../domain/game/GameState";
import { resolvePlayerAction } from "../domain/game/PlayerActions";
import { createBag } from "../domain/items/Bag";
import { spawnRunItems } from "../domain/items/ItemPlacement";
import { createMonsterDrop } from "../domain/items/MonsterDrops";
import { MONSTER_DEFINITIONS } from "../domain/monsters/Monster";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

const potion = { id: "potion:1", kind: "healing-potion" } as const;
const otherPotion = { id: "potion:2", kind: "healing-potion" } as const;
const injuredGame = (health = 3) => ({
	...createGameState(createCorridorEncounter()),
	player: { health, maxHealth: 10 },
	bag: createBag([potion, otherPotion]),
	monsters: [],
});
const drink = { type: "consume", itemId: potion.id } as const;
const adjacentGoblin = {
	id: "1:1",
	kind: "goblin",
	floorNumber: 1,
	coordinate: { row: 1, col: 2 },
	health: 4,
} as const;

describe("Drinking healing potions", () => {
	it.each([
		{ health: 3, recovered: 5 },
		{ health: 8, recovered: 2 },
	])(
		"restores $recovered health from $health and consumes only the selected copy",
		({ health, recovered }) => {
			const before = injuredGame(health);
			const snapshot = structuredClone(before);
			const result = resolvePlayerAction(before, drink);
			expect(result.turnAdvanced).toBe(true);
			expect(result.state.turn).toBe(1);
			expect(result.state.player.health).toBe(health + recovered);
			expect(result.state.bag.items).toEqual([otherPotion]);
			expect(result.state.run).toBe(before.run);
			expect(result.state.activityHistory.entries[0].event).toEqual({
				type: "item-consumed",
				item: "healing-potion",
				recovered,
				turn: 1,
			});
			expect(before).toEqual(snapshot);
		},
	);
	it("rejects full-health use without consuming the potion or waking monsters", () => {
		const before = { ...injuredGame(10), monsters: [adjacentGoblin] };
		const result = resolvePlayerAction(before, drink);
		expect(result.state).toBe(before);
		expect(result.turnAdvanced).toBe(false);
		expect(result.error).toMatch(/full health/i);
	});
	it("rejects drinking after death", () => {
		const before = injuredGame(0);
		expect(resolvePlayerAction(before, drink)).toEqual({
			state: before,
			turnAdvanced: false,
		});
	});
	it.each(["missing", "sword"])(
		"rejects consuming %s without changing state",
		(itemId) => {
			const before = {
				...injuredGame(),
				bag: createBag([potion, { id: "sword", kind: "iron-sword" }]),
			};
			const result = resolvePlayerAction(before, { type: "consume", itemId });
			expect(result.state).toBe(before);
			expect(result.turnAdvanced).toBe(false);
			expect(result.error).toBeTruthy();
		},
	);
	it("cannot consume the same item twice", () => {
		const used = resolvePlayerAction(injuredGame(1), drink).state;
		const result = resolvePlayerAction(used, drink);
		expect(result.state).toBe(used);
		expect(result.turnAdvanced).toBe(false);
	});
	it("heals before exactly one monster attack and records that order", () => {
		const before = { ...injuredGame(1), monsters: [adjacentGoblin] };
		const result = resolvePlayerAction(before, drink).state;
		expect(result.player.health).toBe(5); // 1 + 5 recovery - 1 goblin hit
		expect(result.turn).toBe(1);
		expect(
			result.activityHistory.entries.map(({ event }) => event.type),
		).toEqual(["item-consumed", "monster-hit"]);
		expect(result.monsters[0]).toBe(adjacentGoblin);
	});
	it("keeps the potion consumed and the recovery logged when retaliation is fatal", () => {
		const damage = MONSTER_DEFINITIONS.goblin.attackDamage;
		MONSTER_DEFINITIONS.goblin.attackDamage = 20;
		try {
			const dead = resolvePlayerAction(
				{ ...injuredGame(1), monsters: [adjacentGoblin] },
				drink,
			).state;
			expect(dead.player.health).toBe(0);
			expect(dead.bag.items).toEqual([otherPotion]);
			expect(
				dead.activityHistory.entries.map(({ event }) => event.type),
			).toEqual(["item-consumed", "monster-hit", "player-died"]);
		} finally {
			MONSTER_DEFINITIONS.goblin.attackDamage = damage;
		}
	});
	it.each(["mainHand", "offHand"] as const)(
		"cannot equip a potion in %s",
		(slot) => {
			const before = injuredGame();
			const result = resolvePlayerAction(before, {
				type: "equip",
				itemId: potion.id,
				slot,
			});
			expect(result.state).toBe(before);
			expect(result.turnAdvanced).toBe(false);
			expect(result.error).toMatch(/does not fit/i);
		},
	);
});

describe("Potions in the existing loot system", () => {
	it("drops and picks up distinct potions with ordinary item identity and turn rules", () => {
		const before = injuredGame();
		const dropped = resolvePlayerAction(before, {
			type: "drop",
			itemId: potion.id,
		}).state;
		expect(dropped.bag.items).toEqual([otherPotion]);
		expect(dropped.floorItems.at(-1)?.item).toBe(potion);
		const picked = resolvePlayerAction(dropped, {
			type: "pickup",
			itemId: potion.id,
		}).state;
		expect(picked.bag.items).toEqual([otherPotion, potion]);
		expect(picked.turn).toBe(2);
	});
	it("includes potions in reproducible floor loot and monster drops", () => {
		const runs = Array.from({ length: 20 }, (_, seed) => ({
			...createCorridorEncounter(),
			seed,
		}));
		const floorLoot = runs.flatMap((run) => spawnRunItems(run, []));
		const drops = runs.map((run) =>
			createMonsterDrop(run.seed, adjacentGoblin),
		);
		expect(
			floorLoot.some((entry) => entry.item.kind === "healing-potion"),
		).toBe(true);
		expect(drops.some((entry) => entry?.item.kind === "healing-potion")).toBe(
			true,
		);
		for (const run of runs)
			expect(spawnRunItems(run, [])).toEqual(spawnRunItems(run, []));
	});
	it("restores consumed floor loot, health, and history when replaying the seed", () => {
		const fresh = Array.from({ length: 20 }, (_, seed) =>
			createGameState({ ...createCorridorEncounter(), seed }),
		).find((game) =>
			game.floorItems.some((entry) => entry.item.kind === "healing-potion"),
		);
		if (!fresh) throw new Error("Expected a potion in the seeded test runs");
		const loot = fresh.floorItems.find(
			(entry) => entry.item.kind === "healing-potion",
		);
		if (!loot) throw new Error("Expected healing potion loot");
		const atPotion = {
			...fresh,
			monsters: [],
			player: { health: 3, maxHealth: 10 },
			run: {
				...fresh.run,
				activeFloor: loot.floorNumber,
				playerCoordinate: loot.coordinate,
			},
		};
		const picked = resolvePlayerAction(atPotion, {
			type: "pickup",
			itemId: loot.item.id,
		}).state;
		const used = resolvePlayerAction(picked, {
			type: "consume",
			itemId: loot.item.id,
		}).state;
		expect(
			used.floorItems.some((entry) => entry.item.id === loot.item.id),
		).toBe(false);
		expect(used.bag.items.some((item) => item.id === loot.item.id)).toBe(false);
		expect(used.player.health).toBe(8);
		const replay = createGameState(fresh.run);
		expect(replay).toEqual(fresh);
		expect(replay.floorItems).toContainEqual(loot);
	});
});
