// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { createGameState } from "../domain/game/GameState";
import { resolvePlayerAction } from "../domain/game/PlayerActions";
import { createMonsterDrop } from "../domain/items/MonsterDrops";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

const goblin = {
	id: "1:1",
	kind: "goblin" as const,
	floorNumber: 1,
	coordinate: { row: 1, col: 2 },
	health: 1,
};
const encounter = (seed = 1) => ({
	...createGameState({ ...createCorridorEncounter(), seed }),
	monsters: [goblin],
	floorItems: [],
});
describe("Deterministic monster loot", () => {
	it("has a reproducible dropping seed and a non-dropping seed without global randomness", () => {
		const random = vi.spyOn(Math, "random").mockImplementation(() => {
			throw new Error("Global randomness used");
		});
		try {
			expect(createMonsterDrop(1, goblin)).toBeDefined();
			expect(createMonsterDrop(1, goblin)).toEqual(
				createMonsterDrop(1, goblin),
			);
			expect(createMonsterDrop(0, goblin)).toBeUndefined();
		} finally {
			random.mockRestore();
		}
	});
	it("keeps drops attached to spawn identity regardless of evaluation order", () => {
		const second = { ...goblin, id: "1:2" };
		const firstOrder = [goblin, second].map((monster) =>
			createMonsterDrop(1, monster),
		);
		const reverseOrder = [second, goblin]
			.map((monster) => createMonsterDrop(1, monster))
			.reverse();
		expect(firstOrder).toEqual(reverseOrder);
	});
	it("places the chosen item on the death tile after the hit and death log entries", () => {
		const before = encounter();
		const snapshot = structuredClone(before);
		const result = resolvePlayerAction(before, {
			type: "move",
			direction: "right",
		}).state;
		expect(result.monsters).toEqual([]);
		expect(result.floorItems).toEqual([createMonsterDrop(1, goblin)]);
		expect(result.floorItems[0].coordinate).toEqual(goblin.coordinate);
		expect(
			result.activityHistory.entries.map((entry) => entry.event.type),
		).toEqual(["player-hit", "monster-died", "monster-loot"]);
		expect(result.player.health).toBe(10);
		expect(before).toEqual(snapshot);
	});
	it("leaves no floor item or loot announcement when the roll yields no drop", () => {
		const result = resolvePlayerAction(encounter(0), {
			type: "move",
			direction: "right",
		}).state;
		expect(result.floorItems).toEqual([]);
		expect(
			result.activityHistory.entries.map((entry) => entry.event.type),
		).toEqual(["player-hit", "monster-died"]);
	});
	it("coexists with another floor item and never resolves a second drop on later actions", () => {
		const before = {
			...encounter(),
			floorItems: [
				{
					item: { id: "existing", kind: "short-sword" as const },
					floorNumber: 1,
					coordinate: goblin.coordinate,
				},
			],
		};
		const killed = resolvePlayerAction(before, {
			type: "move",
			direction: "right",
		}).state;
		expect(killed.floorItems).toHaveLength(2);
		const entered = resolvePlayerAction(killed, {
			type: "move",
			direction: "right",
		}).state;
		expect(entered.run.playerCoordinate).toEqual(goblin.coordinate);
		expect(entered.floorItems).toBe(killed.floorItems);
		expect(
			resolvePlayerAction(entered, { type: "wait" }).state.floorItems,
		).toBe(killed.floorItems);
	});
	it("retains the dropped item across floor visits", () => {
		const killed = resolvePlayerAction(encounter(), {
			type: "move",
			direction: "right",
		}).state;
		const atStair = {
			...killed,
			run: { ...killed.run, playerCoordinate: { row: 1, col: 11 } },
		};
		const down = resolvePlayerAction(atStair, {
			type: "move",
			direction: "right",
		}).state;
		const away = resolvePlayerAction(down, {
			type: "move",
			direction: "right",
		}).state;
		const up = resolvePlayerAction(away, {
			type: "move",
			direction: "left",
		}).state;
		expect(up.floorItems).toBe(killed.floorItems);
	});
});
