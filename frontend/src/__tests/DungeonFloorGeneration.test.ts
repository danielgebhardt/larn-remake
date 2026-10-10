// @vitest-environment node

import { describe, expect, it } from "vitest";
import { generateDungeon } from "../domain/dungeon/DungeonGeneration.ts";
import { selectPlayerStart } from "../domain/dungeon/DungeonLocations.ts";
import {
	deriveFloorSeed,
	generateDungeonFloor,
	generateDungeonRun,
	hashStringToUint32,
} from "../domain/dungeon/DungeonRun.ts";
import type { DungeonConfig } from "../domain/dungeon/RunConfiguration.ts";
import { expectAllFloorTilesReachable } from "./testhelpers.ts";

describe("Floor seeds and run generation", () => {
	describe("hashStringToUint32 tests", () => {
		it("should return the same hash for the same string", () => {
			expect(hashStringToUint32("123:1")).toBe(hashStringToUint32("123:1"));
		});

		it("should produce different hashes for known different strings", () => {
			expect(hashStringToUint32("123:1")).not.toBe(hashStringToUint32("123:2"));
		});

		it("should return an unsigned 32-bit integer", () => {
			const result = hashStringToUint32("123:1");

			expect(Number.isInteger(result)).toBe(true);
			expect(result).toBeGreaterThanOrEqual(0);
			expect(result).toBeLessThanOrEqual(0xffffffff);
		});
	});

	describe("deriveFloorSeed tests", () => {
		it("should return the same floor seed for the same run seed and floor number", () => {
			expect(deriveFloorSeed(123, 1)).toBe(deriveFloorSeed(123, 1));
		});

		it("should derive different seeds for different floor numbers", () => {
			expect(deriveFloorSeed(123, 1)).not.toBe(deriveFloorSeed(123, 2));
			expect(deriveFloorSeed(123, 2)).not.toBe(deriveFloorSeed(123, 3));
		});

		it("should derive different seeds for different run seeds", () => {
			expect(deriveFloorSeed(123, 1)).not.toBe(deriveFloorSeed(124, 1));
		});

		it("should distinguish run and floor combinations that collide with simple addition", () => {
			expect(deriveFloorSeed(123, 2)).not.toBe(deriveFloorSeed(124, 1));
		});

		it.each([
			{ runSeed: 0, floorNumber: 1 },
			{ runSeed: 1, floorNumber: 1 },
			{ runSeed: 123, floorNumber: 2 },
			{ runSeed: 999, floorNumber: 3 },
		])(
			"should return an unsigned 32-bit integer for run seed $runSeed and floor $floorNumber",
			({ runSeed, floorNumber }) => {
				const result = deriveFloorSeed(runSeed, floorNumber);

				expect(Number.isInteger(result)).toBe(true);
				expect(result).toBeGreaterThanOrEqual(0);
				expect(result).toBeLessThanOrEqual(0xffffffff);
			},
		);

		it.each([0, -1, 1.5])(
			"should reject invalid floor number %s",
			(floorNumber) => {
				expect(() => deriveFloorSeed(123, floorNumber)).toThrow(
					new RangeError("Floor number must be a positive whole number"),
				);
			},
		);

		it("should preserve the established floor-seed derivation", () => {
			expect(deriveFloorSeed(123, 1)).toBe(3576711657);
		});
	});

	describe("generateDungeonFloor tests", () => {
		const config: DungeonConfig = {
			rows: 12,
			cols: 20,
			minPartitionSize: 5,
			roomPadding: 1,
		};

		it("should generate an identifiable floor from the run seed and floor number", () => {
			const floor = generateDungeonFloor(123, 2, config);

			expect(floor.floorNumber).toBe(2);
		});

		it("should generate the floor using its derived floor seed", () => {
			const expectedDungeon = generateDungeon(config, deriveFloorSeed(123, 2));

			const floor = generateDungeonFloor(123, 2, config);

			expect(floor).toStrictEqual({
				floorNumber: 2,
				...expectedDungeon,
			});
		});

		it("should generate the same floor for the same run seed, floor number, and config", () => {
			const first = generateDungeonFloor(123, 2, config);
			const second = generateDungeonFloor(123, 2, config);

			expect(second).toStrictEqual(first);
		});

		it("should generate different layouts for known different floor identities", () => {
			const floor1 = generateDungeonFloor(123, 1, config);
			const floor2 = generateDungeonFloor(123, 2, config);

			expect(floor2.terrain).not.toStrictEqual(floor1.terrain);
		});
	});

	describe("generateDungeonRun tests", () => {
		const config: DungeonConfig = {
			rows: 12,
			cols: 20,
			minPartitionSize: 5,
			roomPadding: 1,
		};

		it("should generate the requested number of floors", () => {
			const run = generateDungeonRun(123, 3, config);

			expect(run.floors).toHaveLength(3);
		});

		it("should number generated floors consecutively starting at 1", () => {
			const run = generateDungeonRun(123, 3, config);

			expect(run.floors.map((floor) => floor.floorNumber)).toStrictEqual([
				1, 2, 3,
			]);
		});

		it("should generate each floor from the run seed and floor number", () => {
			const run = generateDungeonRun(123, 3, config);

			expect(run.floors[0]).toStrictEqual(generateDungeonFloor(123, 1, config));
			expect(run.floors[1]).toStrictEqual(generateDungeonFloor(123, 2, config));
			expect(run.floors[2]).toStrictEqual(generateDungeonFloor(123, 3, config));
		});

		it("should generate the same complete run for the same seed, floor count, and config", () => {
			const first = generateDungeonRun(123, 3, config);
			const second = generateDungeonRun(123, 3, config);

			expect(second).toStrictEqual(first);
		});

		it("should begin the generated run on floor 1", () => {
			const run = generateDungeonRun(123, 3, config);

			expect(run.activeFloor).toBe(1);
		});

		it("should place the player at floor 1's selected start", () => {
			const run = generateDungeonRun(123, 3, config);
			const expectedStart = selectPlayerStart(run.floors[0]);

			expect(run.playerCoordinate).toStrictEqual(expectedStart);
		});

		it("should support generating a one-floor run", () => {
			const run = generateDungeonRun(123, 1, config);

			expect(run.floors).toHaveLength(1);
			expect(run.floors[0].floorNumber).toBe(1);
			expect(run.activeFloor).toBe(1);
		});

		it("should reject a floor count less than 1", () => {
			expect(() => generateDungeonRun(123, 0, config)).toThrow(
				new RangeError("Floor count must be a positive whole number"),
			);
		});

		it.each([-1, 1.5])("should reject invalid floor count %s", (floorCount) => {
			expect(() => generateDungeonRun(123, floorCount, config)).toThrow(
				new RangeError("Floor count must be a positive whole number"),
			);
		});

		it("should generate the same floor regardless of generation order", () => {
			const floor3First = generateDungeonFloor(123, 3, config);

			generateDungeonFloor(123, 1, config);
			generateDungeonFloor(123, 2, config);

			const floor3Again = generateDungeonFloor(123, 3, config);

			expect(floor3Again).toStrictEqual(floor3First);
		});

		it("should reproduce the same floors when generated individually in a different order", () => {
			const run = generateDungeonRun(123, 3, config);

			const floorsGeneratedOutOfOrder = [
				generateDungeonFloor(123, 3, config),
				generateDungeonFloor(123, 1, config),
				generateDungeonFloor(123, 2, config),
			];

			expect(floorsGeneratedOutOfOrder[0]).toStrictEqual(run.floors[2]);
			expect(floorsGeneratedOutOfOrder[1]).toStrictEqual(run.floors[0]);
			expect(floorsGeneratedOutOfOrder[2]).toStrictEqual(run.floors[1]);
		});

		it("should generate rectangular terrain for every floor", () => {
			const run = generateDungeonRun(123, 3, config);

			for (const floor of run.floors) {
				expect(floor.terrain).toHaveLength(config.rows);

				for (const row of floor.terrain) {
					expect(row).toHaveLength(config.cols);
				}
			}
		});

		it("should generate valid rooms within terrain bounds on every floor", () => {
			const run = generateDungeonRun(123, 3, config);

			for (const floor of run.floors) {
				for (const room of floor.rooms) {
					expect(room.startRow).toBeGreaterThanOrEqual(0);
					expect(room.startCol).toBeGreaterThanOrEqual(0);
					expect(room.endRow).toBeLessThan(config.rows);
					expect(room.endCol).toBeLessThan(config.cols);
				}
			}
		});

		it("should generate connected traversable terrain on every floor", () => {
			const run = generateDungeonRun(123, 3, config);

			for (const floor of run.floors) {
				const start = selectPlayerStart(floor);

				expectAllFloorTilesReachable(floor.terrain, start);
			}
		});

		it("should allow different floors in the same run to have different layouts", () => {
			const run = generateDungeonRun(123, 3, config);

			const terrains = run.floors.map((floor) => JSON.stringify(floor.terrain));

			expect(new Set(terrains).size).toBeGreaterThan(1);
		});
	});
});
