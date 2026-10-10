// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import * as DungeonRun from "../domain/dungeon/DungeonRun";
import { FLOOR } from "../domain/dungeon/Tiles";
import { createGameState } from "../domain/game/GameState";
import {
	DEFAULT_MONSTERS_PER_FLOOR,
	spawnRunMonsters,
} from "../domain/monsters/MonsterPlacement";
import {
	createTestDungeonFloor,
	createThreeFloorTraversalRun,
} from "./testhelpers";

const roomyRun = (floorCount = 3, seed = 123): DungeonRun.DungeonRun => ({
	seed,
	activeFloor: 1,
	playerCoordinate: { row: 2, col: 2 },
	floors: Array.from({ length: floorCount }, (_, index) =>
		createTestDungeonFloor({
			floorNumber: index + 1,
			rows: 6,
			cols: 8,
			room: { startRow: 1, endRow: 4, startCol: 1, endCol: 6 },
			...(index > 0
				? {
						upStair: {
							coordinate: { row: 1, col: 1 },
							destinationFloor: index,
							arrivalCoordinate: { row: 4, col: 6 },
						},
					}
				: {}),
			...(index < floorCount - 1
				? {
						downStair: {
							coordinate: { row: 4, col: 6 },
							destinationFloor: index + 2,
							arrivalCoordinate: { row: 1, col: 1 },
						},
					}
				: {}),
		}),
	),
});

describe("Seeded monster populations", () => {
	it("starts each floor with three full-health goblins and stable unique IDs", () => {
		const monsters = spawnRunMonsters(roomyRun());
		expect(DEFAULT_MONSTERS_PER_FLOOR).toBe(3);
		expect(monsters).toHaveLength(9);
		expect(monsters.map((m) => m.id)).toEqual([
			"1:1",
			"1:2",
			"1:3",
			"2:1",
			"2:2",
			"2:3",
			"3:1",
			"3:2",
			"3:3",
		]);
		for (const monster of monsters) expect(monster.health).toBe(4);
	});
	it("uses an independent seed namespace for each floor and actor", () => {
		const hash = vi.spyOn(DungeonRun, "hashStringToUint32");
		try {
			spawnRunMonsters(roomyRun(2), 2);
			expect(
				hash.mock.calls
					.map(([namespace]) => namespace)
					.filter((namespace) => namespace.includes(":monsters:")),
			).toEqual([
				"123:1:monsters:1",
				"123:1:monsters:2",
				"123:2:monsters:1",
				"123:2:monsters:2",
			]);
		} finally {
			hash.mockRestore();
		}
	});
	it("repeats placements without global randomness or changing dungeon data", () => {
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
	it("excludes player/arrival buffers and stairs and never overlaps, across several seeds", () => {
		const firstPositions = new Set<string>();
		for (let seed = 0; seed < 20; seed++) {
			const run = roomyRun(3, seed);
			const monsters = spawnRunMonsters(run, 100);
			const positions = new Set<string>();
			for (const monster of monsters) {
				const { row, col } = monster.coordinate;
				const floor = run.floors[monster.floorNumber - 1];
				expect(floor.terrain[row][col]).toBe(FLOOR);
				const buffers = monster.floorNumber === 1 ? [run.playerCoordinate] : [];
				if (floor.upStair) buffers.push(floor.upStair.coordinate);
				if (floor.downStair) buffers.push(floor.downStair.coordinate);
				for (const entry of buffers)
					expect(
						Math.abs(row - entry.row) + Math.abs(col - entry.col),
					).toBeGreaterThan(1);
				const key = `${monster.floorNumber}:${row}:${col}`;
				expect(positions.has(key)).toBe(false);
				positions.add(key);
			}
			firstPositions.add(JSON.stringify(monsters[0].coordinate));
		}
		expect(firstPositions.size).toBeGreaterThan(1);
	});
	it("allows an exhausted floor to remain empty while populating a later floor", () => {
		const run = roomyRun(2);
		run.floors[0] = createThreeFloorTraversalRun().floors[0];
		run.playerCoordinate = { row: 1, col: 1 };
		const monsters = spawnRunMonsters(run);
		expect(monsters).toHaveLength(3);
		expect(monsters.every((m) => m.floorNumber === 2)).toBe(true);
		expect(spawnRunMonsters(createThreeFloorTraversalRun())).toEqual([]);
	});
	it("caps the population at available space without duplicate placements", () => {
		const run = roomyRun(1);
		const monsters = spawnRunMonsters(run, 100);
		// 24 room tiles minus five start tiles and one additional future-stair tile.
		expect(monsters).toHaveLength(18);
		expect(
			new Set(monsters.map((m) => JSON.stringify(m.coordinate))).size,
		).toBe(18);
	});
	it("preserves existing floor placements when adding a floor with the same entry links", () => {
		const run = roomyRun(3);
		const fourth = {
			...roomyRun(4).floors[3],
			upStair: {
				coordinate: { row: 1, col: 1 },
				destinationFloor: 3,
				arrivalCoordinate: { row: 1, col: 1 },
			},
		};
		const existing = spawnRunMonsters(run);
		expect(
			spawnRunMonsters({ ...run, floors: [...run.floors, fourth] }).filter(
				(m) => m.floorNumber <= 3,
			),
		).toEqual(existing);
	});
	it("keeps actual generated floor populations identical when increasing floor count", () => {
		const config = {
			rows: 15,
			cols: 15,
			minPartitionSize: 8,
			roomPadding: 1,
			minRoomSize: 3,
			maxRoomAspectRatio: 3,
		};
		for (const seed of [0, 123, 987]) {
			const initial = DungeonRun.connectDungeonFloors(
				DungeonRun.generateDungeonRun(seed, 2, config),
			);
			const extended = DungeonRun.connectDungeonFloors(
				DungeonRun.generateDungeonRun(seed, 3, config),
			);
			expect(
				spawnRunMonsters(extended).filter((m) => m.floorNumber <= 2),
			).toEqual(spawnRunMonsters(initial));
		}
	});
	it("preserves the per-floor placement prefix when the count increases", () => {
		const run = roomyRun();
		const one = spawnRunMonsters(run, 1);
		const three = spawnRunMonsters(run, 3);
		for (const monster of one)
			expect(three.find((m) => m.id === monster.id)).toEqual(monster);
	});
	it("restores initial populations and health on a fresh run", () => {
		const run = roomyRun();
		const initial = createGameState(run);
		const injured = {
			...initial,
			monsters: initial.monsters
				.slice(1)
				.map((m) => ({ ...m, health: 1, coordinate: { row: 3, col: 3 } })),
		};
		const restarted = createGameState(run);
		expect(restarted.monsters).toEqual(initial.monsters);
		expect(restarted.monsters).not.toBe(initial.monsters);
		expect(injured.monsters.every((m) => m.health === 1)).toBe(true);
	});
});
