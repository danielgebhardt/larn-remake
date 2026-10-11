// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import type { AttackRollSource } from "../domain/game/CombatRandomness";
import { createGameState, type GameState } from "../domain/game/GameState";
import { resolvePlayerAction } from "../domain/game/PlayerActions";
import { createBag } from "../domain/items/Bag";
import { createEquipment } from "../domain/items/Equipment";
import { createTestDungeonFloor } from "./testhelpers";

const game = (): GameState => ({
	...createGameState({
		seed: 0,
		activeFloor: 1,
		playerCoordinate: { row: 2, col: 2 },
		floors: [
			createTestDungeonFloor({
				floorNumber: 1,
				rows: 5,
				cols: 5,
				room: { startRow: 1, endRow: 3, startCol: 1, endCol: 3 },
			}),
		],
	}),
	floorItems: [],
	monsters: [
		{
			id: "1:1",
			kind: "goblin",
			floorNumber: 1,
			coordinate: { row: 2, col: 3 },
			health: 4,
		},
		{
			id: "1:2",
			kind: "goblin",
			floorNumber: 1,
			coordinate: { row: 3, col: 2 },
			health: 4,
		},
	],
});
const highRolls: AttackRollSource = () => ({
	d20: () => 20,
	damage: (_min, max) => max,
});
describe("Randomized monster turns", () => {
	it("resolves separate hit/miss outcomes in numeric spawn order", () => {
		const before = { ...game(), monsters: [...game().monsters].reverse() };
		const source: AttackRollSource = (context) => ({
			d20: () => (context.attackerId === "1:1" ? 4 : 5),
			damage: () => 2,
		});
		const result = resolvePlayerAction(before, { type: "wait" }, source).state;
		expect(result.player.health).toBe(9);
		expect(
			result.activityHistory.entries.map((entry) => entry.event.type),
		).toEqual(["monster-missed", "monster-hit"]);
	});
	it("sums worn armor once against a rolled orc hit", () => {
		const before = {
			...game(),
			equipment: createEquipment(
				null,
				{ id: "shield", kind: "wooden-shield" },
				{ id: "chest", kind: "leather-armor" },
				{ id: "head", kind: "leather-cap" },
			),
			monsters: [{ ...game().monsters[0], kind: "orc" as const, health: 7 }],
		};
		const result = resolvePlayerAction(
			before,
			{ type: "wait" },
			highRolls,
		).state;
		expect(result.player.health).toBe(8);
		expect(result.activityHistory.entries[0].event).toMatchObject({
			damage: 2,
		});
	});
	it("clamps a fatal first hit, emits one death, and never rolls for later attackers", () => {
		const before = { ...game(), player: { health: 1, maxHealth: 10 } };
		const source = vi.fn(highRolls);
		const result = resolvePlayerAction(before, { type: "wait" }, source).state;
		expect(result.player.health).toBe(0);
		expect(source).toHaveBeenCalledTimes(1);
		expect(
			result.activityHistory.entries.map((entry) => entry.event.type),
		).toEqual(["monster-hit", "player-died"]);
	});
	it("heals through a hotbar action before applying the supplied monster rolls", () => {
		const before = {
			...game(),
			monsters: [game().monsters[0]],
			player: { health: 1, maxHealth: 10 },
			bag: createBag([{ id: "potion", kind: "healing-potion" }]),
			potionHotbar: ["healing-potion", null, null, null] as const,
		};
		const source: AttackRollSource = () => ({
			d20: () => 1,
			damage: () => {
				throw new Error("Misses do not roll damage");
			},
		});
		const result = resolvePlayerAction(
			before,
			{ type: "use-hotbar", slot: 1 },
			source,
		).state;
		expect(result.player.health).toBe(6);
		expect(
			result.activityHistory.entries.map((entry) => entry.event.type),
		).toEqual(["item-consumed", "monster-missed"]);
	});
	it("does not roll when a pursuing monster only moves into adjacency", () => {
		const before = {
			...game(),
			monsters: [{ ...game().monsters[0], coordinate: { row: 1, col: 3 } }],
		};
		const source = vi.fn(highRolls);
		const result = resolvePlayerAction(before, { type: "wait" }, source).state;
		expect(result.player.health).toBe(10);
		expect(source).not.toHaveBeenCalled();
	});
});
