// @vitest-environment node

import { describe, expect, it, vi } from "vitest";
import * as DungeonRun from "../domain/dungeon/DungeonRun.ts";
import { FLOOR } from "../domain/dungeon/Tiles.ts";
import { createGameState } from "../domain/game/GameState.ts";
import { resolvePlayerAction } from "../domain/game/PlayerActions.ts";
import { MONSTER_DEFINITIONS } from "../domain/monsters/Monster.ts";
import { spawnRunMonsters } from "../domain/monsters/MonsterPlacement.ts";
import {
	createTestDungeonFloor,
	createThreeFloorTraversalRun,
} from "./testhelpers.ts";

const roomyRun = (seed = 123) => ({
	seed,
	activeFloor: 1,
	playerCoordinate: { row: 2, col: 2 },
	floors: [
		createTestDungeonFloor({
			floorNumber: 1,
			rows: 6,
			cols: 8,
			room: { startRow: 1, endRow: 4, startCol: 1, endCol: 6 },
			downStair: {
				coordinate: { row: 4, col: 6 },
				destinationFloor: 2,
				arrivalCoordinate: { row: 1, col: 1 },
			},
		}),
	],
});

describe("First goblin placement", () => {
	it("uses the seed, floor, monsters namespace, and first actor index", () => {
		const hash = vi.spyOn(DungeonRun, "hashStringToUint32");
		try {
			spawnRunMonsters(roomyRun(123));
			expect(hash).toHaveBeenCalledExactlyOnceWith("123:1:monsters:1");
		} finally {
			hash.mockRestore();
		}
	});

	it("spawns only on floor one even when later floors have room", () => {
		const first = roomyRun();
		const later = createThreeFloorTraversalRun().floors.slice(1);
		const monsters = spawnRunMonsters({
			...first,
			floors: [...first.floors, ...later],
		});
		expect(monsters).toHaveLength(1);
		expect(monsters[0].floorNumber).toBe(1);
	});

	it("places one full-health goblin using the shared definition", () => {
		const monsters = spawnRunMonsters(roomyRun());
		expect(monsters).toHaveLength(1);
		expect(monsters[0]).toMatchObject({
			kind: "goblin",
			floorNumber: 1,
			health: 4,
		});
		expect(MONSTER_DEFINITIONS.goblin).toEqual({
			maxHealth: 4,
			attackDamage: 1,
		});
	});

	it("is reproducible without using global randomness or changing dungeon data", () => {
		const run = roomyRun();
		const before = structuredClone(run);
		const random = vi.spyOn(Math, "random").mockImplementation(() => {
			throw new Error("Use seeded randomness");
		});
		try {
			expect(spawnRunMonsters(run)).toEqual(
				spawnRunMonsters(structuredClone(run)),
			);
			expect(random).not.toHaveBeenCalled();
			expect(run).toEqual(before);
		} finally {
			random.mockRestore();
		}
	});

	it("uses different seeds to choose valid floor tiles excluding the player and stairs", () => {
		const coordinates = new Set<string>();
		for (let seed = 0; seed < 20; seed++) {
			const run = roomyRun(seed);
			const goblin = spawnRunMonsters(run)[0];
			expect(
				run.floors[0].terrain[goblin.coordinate.row][goblin.coordinate.col],
			).toBe(FLOOR);
			expect(goblin.coordinate).not.toEqual(run.playerCoordinate);
			expect(goblin.coordinate).not.toEqual(
				run.floors[0].downStair?.coordinate,
			);
			coordinates.add(JSON.stringify(goblin.coordinate));
		}
		expect(coordinates.size).toBeGreaterThan(1);
	});

	it("leaves an exhausted first floor empty instead of spawning on another floor", () => {
		expect(spawnRunMonsters(createThreeFloorTraversalRun())).toEqual([]);
	});

	it("recreates a fresh goblin on seed replay rather than carrying injured state", () => {
		const run = roomyRun();
		const initial = createGameState(run);
		const injured = {
			...initial,
			monsters: initial.monsters.map((monster) => ({ ...monster, health: 1 })),
		};
		const restarted = createGameState(injured.run);
		expect(restarted.monsters).toEqual(initial.monsters);
		expect(restarted.monsters).not.toBe(initial.monsters);
		expect(injured.monsters[0].health).toBe(1);
	});
});

describe("Monster occupancy and retention", () => {
	it("attacks an occupied destination while retaining the original player position", () => {
		const initial = createGameState(roomyRun());
		const game = {
			...initial,
			monsters: [
				{
					id: "1:1",
					kind: "goblin" as const,
					floorNumber: 1,
					coordinate: { row: 2, col: 3 },
					health: 3,
				},
			],
		};
		const result = resolvePlayerAction(game, {
			type: "move",
			direction: "right",
		});
		expect(result.turnAdvanced).toBe(true);
		expect(result.state.run).toBe(game.run);
		expect(result.state.turn).toBe(game.turn + 1);
		expect(result.state.monsters[0].health).toBe(1);
		expect(game.monsters[0].health).toBe(3);
	});

	it("retains the same injured monster through ordinary movement and floor revisits", () => {
		const run = createThreeFloorTraversalRun();
		run.floors[0] = createTestDungeonFloor({
			floorNumber: 1,
			rows: 3,
			cols: 5,
			room: { startRow: 1, endRow: 1, startCol: 1, endCol: 3 },
			downStair: run.floors[0].downStair,
		});
		const initial = createGameState(run);
		const game = {
			...initial,
			monsters: [
				{
					id: "1:1",
					kind: "goblin" as const,
					floorNumber: 1,
					coordinate: { row: 1, col: 3 },
					health: 2,
				},
			],
		};
		// Descend, walk away from the arrival, then return to the entry stair.
		const down = resolvePlayerAction(game, {
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
		expect(up.run.activeFloor).toBe(1);
		expect(up.monsters).toBe(game.monsters);
		expect(up.monsters[0].health).toBe(2);
	});
});
