// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import type { Coordinate } from "../domain/dungeon/DungeonTypes";
import { createGameState, type GameState } from "../domain/game/GameState";
import { maximumMana } from "../domain/game/Mana";
import {
	type PlayerAction,
	resolvePlayerAction,
} from "../domain/game/PlayerActions";
import { createBag } from "../domain/items/Bag";
import { resolvePlayerActionWithHits } from "./ControlledCombatTestHelpers";
import {
	createTestDungeonFloor,
	createThreeFloorTraversalRun,
	findFloorPath,
} from "./testhelpers";

const walk = (before: GameState, target: Coordinate) => {
	let state = before;
	const path = findFloorPath(
		state.run.floors[state.run.activeFloor - 1].terrain,
		state.run.playerCoordinate,
		target,
	);
	for (const point of path.slice(1)) {
		const previous = state.run.playerCoordinate;
		const direction =
			point.row < previous.row
				? "up"
				: point.row > previous.row
					? "down"
					: point.col < previous.col
						? "left"
						: "right";
		state = resolvePlayerActionWithHits(state, {
			type: "move",
			direction,
		}).state;
	}
	return state;
};
describe("Spellcasting through a complete adventure", () => {
	it("shares spell/melee rewards, healing, potion shortcuts, recovery, stairs, cure return and replay", () => {
		const run = createThreeFloorTraversalRun();
		run.floors[0] = createTestDungeonFloor({
			floorNumber: 1,
			rows: 4,
			cols: 6,
			room: { startRow: 1, endRow: 2, startCol: 1, endCol: 4 },
			downStair: {
				coordinate: { row: 1, col: 4 },
				destinationFloor: 2,
				arrivalCoordinate: { row: 1, col: 1 },
			},
		});
		run.floors[1].upStair = {
			coordinate: { row: 1, col: 1 },
			destinationFloor: 1,
			arrivalCoordinate: { row: 1, col: 4 },
		};
		const fresh = createGameState(run);
		const cure = fresh.floorItems.find((entry) => entry.item.kind === "cure");
		if (!cure) throw new Error("Expected cure");
		const before: GameState = {
			...fresh,
			progression: { experience: 29 },
			player: { health: 3, maxHealth: 12 },
			bag: createBag([{ id: "health", kind: "healing-potion" }]),
			potionHotbar: ["healing-potion", null, null, null],
			monsters: [
				{
					id: "1:1",
					kind: "orc",
					floorNumber: 1,
					coordinate: { row: 2, col: 1 },
					health: 1,
				},
				{
					id: "1:2",
					kind: "goblin",
					floorNumber: 1,
					coordinate: { row: 2, col: 3 },
					health: 1,
				},
			],
			floorItems: [
				cure,
				{
					item: { id: "mana", kind: "mana-potion" },
					floorNumber: 1,
					coordinate: { row: 1, col: 2 },
				},
			],
		};
		let state = resolvePlayerActionWithHits(before, {
			type: "cast",
			spell: "magic-missile",
			targetId: "1:1",
		}).state;
		expect(state).toMatchObject({
			progression: { experience: 39 },
			mana: 9,
			player: { health: 5, maxHealth: 14 },
		});
		state = resolvePlayerActionWithHits(state, {
			type: "move",
			direction: "right",
		}).state;
		state = resolvePlayerActionWithHits(state, {
			type: "move",
			direction: "right",
		}).state;
		expect(state.monstersDefeated).toBe(2);
		expect(state.progression.experience).toBe(44);
		state = resolvePlayerActionWithHits(state, {
			type: "cast",
			spell: "heal",
		}).state;
		expect(state.player.health).toBe(9);
		expect(state.mana).toBe(5);
		state = resolvePlayerActionWithHits(state, {
			type: "pickup",
			itemId: "mana",
		}).state;
		expect(state.potionHotbar[1]).toBe("mana-potion");
		state = resolvePlayerActionWithHits(state, {
			type: "use-hotbar",
			slot: 2,
		}).state;
		expect(state.mana).toBe(10);
		state = resolvePlayerActionWithHits(state, {
			type: "use-hotbar",
			slot: 1,
		}).state;
		expect(state.player.health).toBe(14);
		while (state.turn < 30)
			state = resolvePlayerActionWithHits(state, { type: "wait" }).state;
		expect(state.mana).toBe(11);
		state = walk(state, { row: 1, col: 4 });
		expect(state.run.activeFloor).toBe(2);
		expect(state.knownSpells).toBe(before.knownSpells);
		state = walk(state, { row: 1, col: 3 });
		expect(state.run.activeFloor).toBe(3);
		state = walk(state, cure.coordinate);
		state = resolvePlayerActionWithHits(state, {
			type: "pickup",
			itemId: cure.item.id,
		}).state;
		state = walk(state, { row: 1, col: 1 });
		state = walk(state, { row: 1, col: 1 });
		state = walk(state, state.quest.entrance);
		expect(state.quest.victory).toMatchObject({
			level: 3,
			experience: 44,
			monstersDefeated: 2,
			health: 14,
		});
		expect(state.monsters).toEqual([]);
		expect(state.mana).toBeLessThanOrEqual(maximumMana(state.progression));
		for (const action of [
			{ type: "cast", spell: "heal" },
			{ type: "cast", spell: "magic-missile", targetId: "1:1" },
			{ type: "wait" },
		] as const)
			expect(resolvePlayerAction(state, action).state).toBe(state);
		expect(createGameState(run)).toEqual(fresh);
		expect(before.mana).toBe(10);
	});
	it("replays real seeded casts, melee, healing and waiting including rejection without using global randomness", () => {
		const run = createThreeFloorTraversalRun();
		run.floors[0] = createTestDungeonFloor({
			floorNumber: 1,
			rows: 4,
			cols: 5,
			room: { startRow: 1, endRow: 2, startCol: 1, endCol: 3 },
		});
		const initial: GameState = {
			...createGameState(run),
			player: { health: 3, maxHealth: 10 },
			monsters: [
				{
					id: "1:1",
					kind: "orc" as const,
					floorNumber: 1,
					coordinate: { row: 1, col: 2 },
					health: 20,
				},
			],
			floorItems: [],
		};
		const actions: PlayerAction[] = [
			{ type: "cast", spell: "heal" },
			{ type: "cast", spell: "magic-missile", targetId: "missing" },
			{ type: "cast", spell: "magic-missile", targetId: "1:1" },
			{ type: "move", direction: "right" },
			{ type: "wait" },
			{ type: "cast", spell: "heal" },
		];
		const play = () =>
			actions.reduce(
				(state, action) => resolvePlayerAction(state, action).state,
				initial,
			);
		const global = vi.spyOn(Math, "random").mockImplementation(() => {
			throw new Error("Spell replay must be seeded");
		});
		let result: GameState;
		try {
			result = play();
			expect(play()).toEqual(result);
		} finally {
			global.mockRestore();
		}
		expect(result.turn).toBeGreaterThan(0);
		const dead = { ...result, player: { ...result.player, health: 0 } };
		expect(
			resolvePlayerAction(dead, { type: "cast", spell: "heal" }).state,
		).toBe(dead);
	});
});
