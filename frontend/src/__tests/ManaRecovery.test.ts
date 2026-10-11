// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createGameState, type GameState } from "../domain/game/GameState";
import type { PlayerAction } from "../domain/game/PlayerActions";
import { createBag } from "../domain/items/Bag";
import { resolvePlayerActionWithHits } from "./ControlledCombatTestHelpers";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

const quiet = (): GameState => ({
	...createGameState(createCorridorEncounter()),
	monsters: [],
	mana: 4,
});
describe("Mana recovery on committed turns", () => {
	it("recovers at 30 and 60, with no recovery at 29 or 31", () => {
		let state = { ...quiet(), turn: 28 };
		state = resolvePlayerActionWithHits(state, { type: "wait" }).state;
		expect(state.mana).toBe(4);
		state = resolvePlayerActionWithHits(state, { type: "wait" }).state;
		expect(state.mana).toBe(5);
		state = resolvePlayerActionWithHits(state, { type: "wait" }).state;
		expect(state.mana).toBe(5);
		for (let i = 0; i < 29; i++)
			state = resolvePlayerActionWithHits(state, { type: "wait" }).state;
		expect(state.turn).toBe(60);
		expect(state.mana).toBe(6);
		expect(state.activityHistory.entries).toHaveLength(0);
	});
	it.each([10, 20])("does not recover early at turn %i", (turn) => {
		const before = { ...quiet(), turn: turn - 1 };
		const after = resolvePlayerActionWithHits(before, { type: "wait" }).state;
		expect(after.turn).toBe(turn);
		expect(after.mana).toBe(before.mana);
	});

	const actions: PlayerAction[] = [
		{ type: "move", direction: "right" },
		{ type: "wait" },
		{ type: "equip", itemId: "starting:bag:1", slot: "mainHand" },
		{ type: "unequip", slot: "offHand" },
		{ type: "drop", itemId: "starting:bag:1" },
		{ type: "pickup", itemId: "ground" },
		{ type: "consume", itemId: "potion" },
		{ type: "use-hotbar", slot: 1 },
		{ type: "cast", spell: "heal" },
	];
	it.each(actions)("shares the same recovery boundary for $type", (action) => {
		const initial = quiet();
		const before = {
			...initial,
			turn: 29,
			player: { health: 3, maxHealth: 10 },
			bag: createBag([
				...initial.bag.items,
				{ id: "potion", kind: "healing-potion" },
			]),
			potionHotbar: ["healing-potion", null, null, null] as const,
			floorItems: [
				{
					floorNumber: 1,
					coordinate: initial.run.playerCoordinate,
					item: { id: "ground", kind: "leather-cap" as const },
				},
			],
		};
		const result = resolvePlayerActionWithHits(before, action);
		expect(result.turnAdvanced).toBe(true);
		expect(result.state.turn).toBe(30);
		expect(result.state.mana).toBe(action.type === "cast" ? 1 : 5);
	});
	it("applies capacity growth from a kill before capped recovery", () => {
		const before = {
			...quiet(),
			turn: 29,
			mana: 10,
			progression: { experience: 29 },
			monsters: [
				{
					id: "1:1",
					kind: "giant-rat" as const,
					floorNumber: 1,
					coordinate: { row: 1, col: 2 },
					health: 1,
				},
			],
		};
		const after = resolvePlayerActionWithHits(before, {
			type: "move",
			direction: "right",
		}).state;
		expect(after.mana).toBe(12);
		expect(after.progression.experience).toBe(31);
	});
	it("retains cadence through stairs and resets on replay", () => {
		const before = {
			...quiet(),
			turn: 29,
			run: { ...quiet().run, playerCoordinate: { row: 1, col: 11 } },
		};
		const after = resolvePlayerActionWithHits(before, {
			type: "move",
			direction: "right",
		}).state;
		expect(after.run.activeFloor).toBe(2);
		expect(after.mana).toBe(5);
		expect(after.turn).toBe(30);
		expect(createGameState(after.run)).toMatchObject({ turn: 0, mana: 10 });
	});
	it.each([
		{ type: "move", direction: "up" },
		{ type: "cast", spell: "heal" },
		{ type: "assign-hotbar", slot: 1, itemId: "potion" },
	] as const)(
		"cannot recover from a blocked, unaffordable or free $type action",
		(action) => {
			const before = {
				...quiet(),
				turn: 29,
				mana: 0,
				bag: createBag([{ id: "potion", kind: "healing-potion" }]),
			};
			const result = resolvePlayerActionWithHits(before, action);
			expect(result.turnAdvanced).toBe(false);
			expect(result.state.turn).toBe(29);
			expect(result.state.mana).toBe(0);
		},
	);
	it("caps recovery and does not regenerate after fatal retaliation or victory", () => {
		const capped = resolvePlayerActionWithHits(
			{ ...quiet(), turn: 29, mana: 14, progression: { experience: 100 } },
			{ type: "wait" },
		).state;
		expect(capped.mana).toBe(14);
		const dead = resolvePlayerActionWithHits(
			{
				...quiet(),
				turn: 29,
				player: { health: 1, maxHealth: 10 },
				monsters: [
					{
						id: "1:1",
						kind: "goblin",
						floorNumber: 1,
						coordinate: { row: 1, col: 2 },
						health: 9,
					},
				],
			},
			{ type: "wait" },
		).state;
		expect(dead.player.health).toBe(0);
		expect(dead.mana).toBe(4);
		const initial = quiet();
		const before = {
			...initial,
			turn: 29,
			run: { ...initial.run, playerCoordinate: { row: 1, col: 2 } },
			quest: { ...initial.quest, cureRecovered: true },
		};
		const won = resolvePlayerActionWithHits(before, {
			type: "move",
			direction: "left",
		}).state;
		expect(won.quest.victory).not.toBeNull();
		expect(won.mana).toBe(4);
	});
});
