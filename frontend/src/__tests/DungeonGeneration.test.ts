// @vitest-environment node

import { describe, expect, it } from "vitest";
import { generateDungeon } from "../domain/dungeon/DungeonGeneration.ts";
import { selectPlayerStart } from "../domain/dungeon/DungeonLocations.ts";
import type { Dungeon } from "../domain/dungeon/DungeonTypes.ts";
import type { DungeonConfig } from "../domain/dungeon/RunConfiguration.ts";
import { FLOOR, WALL } from "../domain/dungeon/Tiles.ts";
import { expectAllFloorTilesReachable } from "./testhelpers.ts";

describe("Dungeon generation", () => {
	it("should produce an exact expected terrain map from a known deterministic configuration", () => {
		const connectedDungeon = generateDungeon({
			rows: 6,
			cols: 6,
			minPartitionSize: 3,
			roomPadding: 1,
		});

		const expectedDungeon: Dungeon = [
			[WALL, WALL, WALL, WALL, WALL, WALL],
			[WALL, FLOOR, FLOOR, FLOOR, FLOOR, WALL],
			[WALL, FLOOR, WALL, WALL, FLOOR, WALL],
			[WALL, FLOOR, WALL, WALL, FLOOR, WALL],
			[WALL, FLOOR, WALL, WALL, FLOOR, WALL],
			[WALL, WALL, WALL, WALL, WALL, WALL],
		];

		expect(connectedDungeon.terrain).toStrictEqual(expectedDungeon);
	});

	describe.each([
		{ label: "without a seed", seed: undefined },
		{ label: "with seed 0", seed: 0 },
		{ label: "with seed 1", seed: 1 },
		{ label: "with seed 123", seed: 123 },
		{ label: "with seed 999", seed: 999 },
	])("Generate complete connected dungeon tests $label", ({ seed }) => {
		it("should generate a rectangular dungeon with the configured dimensions", () => {
			const config: DungeonConfig = {
				rows: 6,
				cols: 9,
				minPartitionSize: 3,
				roomPadding: 1,
			};

			const result = generateDungeon(config, seed);

			expect(result.terrain).toHaveLength(6);

			for (const row of result.terrain) {
				expect(row).toHaveLength(9);
			}
		});

		it("should carve every generated room and corridor into the terrain", () => {
			const config: DungeonConfig = {
				rows: 12,
				cols: 12,
				minPartitionSize: 3,
				roomPadding: 1,
			};

			const result = generateDungeon(config, seed);

			for (const room of result.rooms) {
				for (let row = room.startRow; row <= room.endRow; row++) {
					for (let col = room.startCol; col <= room.endCol; col++) {
						expect(result.terrain[row][col]).toBe(FLOOR);
					}
				}
			}

			for (const corridor of result.corridors) {
				for (const coordinate of corridor) {
					expect(result.terrain[coordinate.row][coordinate.col]).toBe(FLOOR);
				}
			}
		});

		it("should generate identical results from identical configuration", () => {
			const config: DungeonConfig = {
				rows: 12,
				cols: 15,
				minPartitionSize: 3,
				roomPadding: 1,
			};

			const firstResult = generateDungeon(config, seed);
			const secondResult = generateDungeon(config, seed);

			expect(secondResult).toStrictEqual(firstResult);
		});

		it("should reject configuration when terminal partitions cannot support the requested room padding", () => {
			const config: DungeonConfig = {
				rows: 6,
				cols: 6,
				minPartitionSize: 3,
				roomPadding: 2,
			};

			expect(() => generateDungeon(config, seed)).toThrow(RangeError);
		});

		it("should make every floor tile reachable from the selected player start", () => {
			const config: DungeonConfig = {
				rows: 12,
				cols: 12,
				minPartitionSize: 3,
				roomPadding: 1,
			};

			const result = generateDungeon(config, seed);
			const start = selectPlayerStart(result);

			expectAllFloorTilesReachable(result.terrain, start);
		});
	});

	describe("Generated deterministic dungeons from different seeds", () => {
		it("can generate different terrain from different seeds", () => {
			const config: DungeonConfig = {
				rows: 12,
				cols: 20,
				minPartitionSize: 5,
				roomPadding: 1,
			};

			const dungeons = Array.from({ length: 20 }, (_, seed) =>
				generateDungeon(config, seed),
			);
			const uniqueTerrain = new Set(
				dungeons.map((dungeon) => JSON.stringify(dungeon.terrain)),
			);

			expect(uniqueTerrain.size).toBeGreaterThan(1);
		});

		it("reproduces the complete dungeon from the same configuration and seed", () => {
			const config: DungeonConfig = {
				rows: 12,
				cols: 20,
				minPartitionSize: 5,
				roomPadding: 1,
			};

			const first = generateDungeon(config, 123);

			generateDungeon(config, 456);

			const second = generateDungeon(config, 123);

			expect(second).toStrictEqual(first);
		});
	});
});
