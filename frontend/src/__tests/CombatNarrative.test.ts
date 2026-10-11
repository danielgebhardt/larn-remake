// @vitest-environment node
import { describe, expect, it } from "vitest";
import { formatActivityEvent } from "../components/game/ActivityMessages";
import type { AttackRollSource } from "../domain/game/CombatRandomness";
import { createGameState, type GameState } from "../domain/game/GameState";
import { resolvePlayerAction } from "../domain/game/PlayerActions";
import { createBag } from "../domain/items/Bag";
import { createTestDungeonFloor } from "./testhelpers";

const game = (): GameState => ({
	...createGameState({
		seed: 1,
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
			health: 1,
		},
		{
			id: "1:2",
			kind: "giant-rat",
			floorNumber: 1,
			coordinate: { row: 3, col: 2 },
			health: 2,
		},
	],
});
const source: AttackRollSource = () => ({
	d20: () => 20,
	damage: (min, max) => Math.floor((min + max) / 2),
});
const messages = (state: GameState) =>
	state.activityHistory.entries.map((entry) =>
		formatActivityEvent(entry.event),
	);
describe("Combat activity narrative", () => {
	it("orders a kill and drop before remaining opponents attack", () => {
		const result = resolvePlayerAction(
			game(),
			{ type: "move", direction: "right" },
			source,
		).state;
		expect(
			result.activityHistory.entries.map((entry) => entry.event.type),
		).toEqual(["player-hit", "monster-died", "monster-loot", "monster-hit"]);
		expect(messages(result)[0]).toBe(
			"Turn 1 — You hit the goblin for 2 damage.",
		);
		expect(messages(result)[1]).toBe("Turn 1 — The goblin dies.");
		expect(messages(result)[2]).toMatch(/^Turn 1 — The goblin drops /);
		expect(messages(result)[3]).toBe(
			"Turn 1 — The giant rat hits you for 1 damage.",
		);
	});
	it("orders a player miss followed by each surviving monster outcome", () => {
		const rolls: AttackRollSource = (context) => ({
			d20: () => (context.attackerId === "1:2" ? 20 : 1),
			damage: () => 1,
		});
		const result = resolvePlayerAction(
			game(),
			{ type: "move", direction: "right" },
			rolls,
		).state;
		expect(messages(result)).toEqual([
			"Turn 1 — You miss the goblin.",
			"Turn 1 — The goblin misses you.",
			"Turn 1 — The giant rat hits you for 1 damage.",
		]);
	});
	it("announces healing before attacks and death, without inactive-floor events", () => {
		const before = {
			...game(),
			player: { health: 1, maxHealth: 10 },
			bag: createBag([{ id: "potion", kind: "healing-potion" }]),
			monsters: [
				{ ...game().monsters[0], kind: "orc" as const },
				{ ...game().monsters[1], kind: "orc" as const },
				{ ...game().monsters[1], id: "2:1", floorNumber: 2 },
			],
		};
		const result = resolvePlayerAction(
			before,
			{ type: "consume", itemId: "potion" },
			() => ({ d20: () => 20, damage: () => 5 }),
		).state;
		expect(messages(result)).toEqual([
			"Turn 1 — You drink Healing potion and recover 5 health.",
			"Turn 1 — The orc hits you for 4 damage.",
			"Turn 1 — The orc hits you for 4 damage.",
			"Turn 1 — You die.",
		]);
	});
});
