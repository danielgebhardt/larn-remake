// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createGameState } from "../domain/game/GameState";
import { resolvePlayerAction } from "../domain/game/PlayerActions";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

const wait = (state: ReturnType<typeof createGameState>) =>
	resolvePlayerAction(state, { type: "wait" });

describe("Waiting for a turn", () => {
	it("advances exactly one turn without moving, attacking or adding empty activity", () => {
		const state = {
			...createGameState(createCorridorEncounter()),
			turn: 7,
			monsters: [],
		};
		const result = wait(state);
		expect(result.turnAdvanced).toBe(true);
		expect(result.state.turn).toBe(8);
		expect(result.state.run).toBe(state.run);
		expect(result.state.player).toBe(state.player);
		expect(result.state.activityHistory).toBe(state.activityHistory);
	});
	it("lets a lone goblin approach, then attack, while the player never attacks it", () => {
		const state = {
			...createGameState(createCorridorEncounter()),
			monsters: [
				{
					id: "1:1",
					kind: "goblin" as const,
					floorNumber: 1,
					coordinate: { row: 1, col: 3 },
					health: 4,
				},
			],
		};
		const before = structuredClone(state);
		const approached = wait(state).state;
		expect(approached.monsters[0].coordinate).toEqual({ row: 1, col: 2 });
		expect(approached.player.health).toBe(10);
		expect(approached.activityHistory.entries).toEqual([]);
		const attacked = wait(approached).state;
		expect(attacked.turn).toBe(2);
		expect(attacked.player.health).toBe(9);
		expect(attacked.run).toBe(state.run);
		expect(attacked.monsters[0].health).toBe(4);
		expect(
			attacked.activityHistory.entries.map((entry) => entry.event),
		).toEqual([{ type: "monster-hit", monster: "goblin", damage: 1, turn: 2 }]);
		expect(state).toEqual(before);
	});
	it("does not activate a stair or evolve monsters on inactive floors", () => {
		const run = createCorridorEncounter();
		run.playerCoordinate = { row: 1, col: 12 };
		const state = {
			...createGameState(run),
			monsters: [
				{
					id: "2:1",
					kind: "goblin" as const,
					floorNumber: 2,
					coordinate: { row: 1, col: 2 },
					health: 4,
				},
			],
		};
		const result = wait(state).state;
		expect(result.turn).toBe(1);
		expect(result.run).toBe(run);
		expect(result.monsters).toBe(state.monsters);
		expect(result.player).toBe(state.player);
	});
	it("records fatal monster damage and rejects all subsequent waits", () => {
		const state = {
			...createGameState(createCorridorEncounter()),
			player: { health: 1, maxHealth: 10 },
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
		const dead = wait(state).state;
		expect(dead.player.health).toBe(0);
		expect(dead.turn).toBe(1);
		expect(
			dead.activityHistory.entries.map((entry) => entry.event.type),
		).toEqual(["monster-hit", "player-died"]);
		expect(wait(dead)).toEqual({ state: dead, turnAdvanced: false });
		expect(wait(dead).state).toBe(dead);
	});
});
