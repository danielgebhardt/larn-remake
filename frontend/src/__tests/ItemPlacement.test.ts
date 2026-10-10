// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import {
	connectDungeonFloors,
	generateDungeonRun,
} from "../domain/dungeon/DungeonRun";
import { createGameState } from "../domain/game/GameState";
import { resolvePlayerAction } from "../domain/game/PlayerActions";
import { spawnRunItems } from "../domain/items/ItemPlacement";
import { spawnRunMonsters } from "../domain/monsters/MonsterPlacement";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";
import { createTestDungeonFloor } from "./testhelpers";

const generatedRun = (seed = 123) =>
	connectDungeonFloors(
		generateDungeonRun(seed, 3, {
			rows: 15,
			cols: 15,
			minPartitionSize: 10,
			roomPadding: 1,
			minRoomSize: 4,
			maxRoomAspectRatio: 2,
		}),
	);
describe("Seeded floor loot", () => {
	it("reproduces two distinct item instances per floor without using global randomness", () => {
		const run = generatedRun();
		const monsters = spawnRunMonsters(run);
		const random = vi.spyOn(Math, "random").mockImplementation(() => {
			throw new Error("Global randomness used");
		});
		try {
			const items = spawnRunItems(run, monsters);
			expect(items).toEqual(spawnRunItems(run, monsters));
			expect(items).toHaveLength(6);
			expect(new Set(items.map((entry) => entry.item.id)).size).toBe(6);
		} finally {
			random.mockRestore();
		}
	});
	it("uses walkable room tiles and excludes stairs, arrivals, player start, and initial monsters", () => {
		const run = generatedRun();
		const monsters = spawnRunMonsters(run);
		const items = spawnRunItems(run, monsters);
		for (const entry of items) {
			const floor = run.floors[entry.floorNumber - 1];
			const { row, col } = entry.coordinate;
			expect(floor.terrain[row][col]).toBe(".");
			expect(
				floor.rooms.some(
					(room) =>
						row >= room.startRow &&
						row <= room.endRow &&
						col >= room.startCol &&
						col <= room.endCol,
				),
			).toBe(true);
			expect(entry.coordinate).not.toEqual(floor.upStair?.coordinate);
			expect(entry.coordinate).not.toEqual(floor.downStair?.coordinate);
			if (entry.floorNumber === 1)
				expect(entry.coordinate).not.toEqual(run.playerCoordinate);
			expect(
				monsters.some(
					(monster) =>
						monster.floorNumber === entry.floorNumber &&
						monster.coordinate.row === row &&
						monster.coordinate.col === col,
				),
			).toBe(false);
		}
		expect(
			new Set(
				items.map(
					(entry) =>
						`${entry.floorNumber}:${entry.coordinate.row}:${entry.coordinate.col}`,
				),
			).size,
		).toBe(items.length);
	});
	it("keeps existing item placements stable when only the requested item count increases", () => {
		const run = generatedRun();
		const monsters = spawnRunMonsters(run);
		const one = spawnRunItems(run, monsters, 1);
		const two = spawnRunItems(run, monsters, 2);
		expect(two.filter((entry) => entry.item.id.endsWith(":1"))).toEqual(one);
	});
	it("does not alter terrain, stairs, or monster streams when loot count changes", () => {
		const run = generatedRun();
		const before = structuredClone(run);
		const monsters = spawnRunMonsters(run);
		spawnRunItems(run, monsters, 4);
		expect(run).toEqual(before);
		expect(spawnRunMonsters(run)).toEqual(monsters);
		expect(generatedRun()).toEqual(before);
	});
	it("varies loot across seeds", () => {
		const layouts = Array.from({ length: 6 }, (_, seed) =>
			JSON.stringify(spawnRunItems(generatedRun(seed), [])),
		);
		expect(new Set(layouts).size).toBeGreaterThan(1);
	});
	it("gracefully creates only as much loot as legal space permits", () => {
		const floor = createTestDungeonFloor({
			floorNumber: 1,
			rows: 3,
			cols: 4,
			room: { startRow: 1, endRow: 1, startCol: 1, endCol: 2 },
		});
		const run = {
			seed: 123,
			activeFloor: 1,
			playerCoordinate: { row: 1, col: 1 },
			floors: [floor],
		};
		expect(spawnRunItems(run, [], 20)).toHaveLength(1);
		expect(
			spawnRunItems(run, [
				{
					id: "1:1",
					kind: "goblin",
					floorNumber: 1,
					coordinate: { row: 1, col: 2 },
					health: 4,
				},
			]),
		).toEqual([]);
		expect(spawnRunItems(run, [], 0)).toEqual([]);
	});
	it.each([-1, 1.5, NaN])("rejects invalid spawn count %s", (count) => {
		expect(() => spawnRunItems(generatedRun(), [], count)).toThrow(RangeError);
	});
	it("retains picked-up loot across later actions and restores it on replay", () => {
		const game = createGameState(createCorridorEncounter());
		const target = game.floorItems[0];
		expect(target).toBeDefined();
		const atItem = {
			...game,
			monsters: [],
			run: {
				...game.run,
				playerCoordinate: target.coordinate,
				activeFloor: target.floorNumber,
			},
		};
		const picked = resolvePlayerAction(atItem, {
			type: "pickup",
			itemId: target.item.id,
		}).state;
		const waited = resolvePlayerAction(picked, { type: "wait" }).state;
		expect(
			waited.floorItems.some((entry) => entry.item.id === target.item.id),
		).toBe(false);
		expect(waited.bag.items.some((item) => item.id === target.item.id)).toBe(
			true,
		);
		expect(createGameState(game.run).floorItems).toEqual(game.floorItems);
	});
});
