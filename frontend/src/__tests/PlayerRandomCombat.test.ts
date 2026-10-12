// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import type { AttackRollSource } from "../domain/game/CombatRandomness";
import { createGameState, type GameState } from "../domain/game/GameState";
import { resolvePlayerAction } from "../domain/game/PlayerActions";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

const game = (): GameState => ({
	...createGameState({ ...createCorridorEncounter(), seed: 0 }),
	floorItems: [],
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
});
const attack = { type: "move", direction: "right" } as const;
describe("Randomized player bump attacks", () => {
	it("spends a miss turn in place without damage, then runs the monster response", () => {
		const before = game();
		const damage = vi.fn(() => {
			throw new Error("Misses must not roll damage");
		});
		const source: AttackRollSource = (context) =>
			context.attackerId === "player"
				? { d20: () => 3, damage }
				: { d20: () => 20, damage: (min, max) => Math.floor((min + max) / 2) };
		const result = resolvePlayerAction(before, attack, source);
		expect(result.state.run).toBe(before.run);
		expect(result.state.turn).toBe(1);
		expect(result.state.monsters[0].health).toBe(4);
		expect(result.state.player.health).toBe(9);
		expect(
			result.state.activityHistory.entries.map((entry) => entry.event.type),
		).toEqual(["player-missed", "monster-hit"]);
		expect(damage).not.toHaveBeenCalled();
	});
	it.each([1, 3])(
		"applies a landed roll of %i once, without moving into the monster",
		(damage) => {
			const before = game();
			const result = resolvePlayerAction(before, attack, (context) => ({
				d20: () => 20,
				damage: (min) => (context.attackerId === "player" ? damage : min),
			})).state;
			expect(result.run).toBe(before.run);
			expect(result.monsters[0].health).toBe(4 - damage);
			expect(result.activityHistory.entries[0].event).toMatchObject({
				type: "player-hit",
				damage,
			});
		},
	);
	it("kills once and prevents retaliation from that monster", () => {
		const before = {
			...game(),
			monsters: [{ ...game().monsters[0], health: 1 }],
		};
		const result = resolvePlayerAction(before, attack, () => ({
			d20: () => 20,
			damage: () => 3,
		})).state;
		expect(result.monsters).toEqual([]);
		expect(result.player.health).toBe(10);
		expect(
			result.activityHistory.entries.map((entry) => entry.event.type),
		).toEqual(["player-hit", "monster-died", "experience-gained"]);
	});
	it("repeats a seeded action sequence and leaves rejected actions free", () => {
		const play = () => {
			let state = game();
			for (let i = 0; i < 3; i++)
				state = resolvePlayerAction(state, attack).state;
			return state;
		};
		expect(play()).toEqual(play());
		const before = game();
		const source = vi.fn(() => ({ d20: () => 20, damage: () => 2 }));
		expect(
			resolvePlayerAction(before, { type: "move", direction: "up" }, source)
				.state,
		).toBe(before);
		expect(source).not.toHaveBeenCalled();
	});
});
