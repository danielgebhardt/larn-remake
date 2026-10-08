import { describe, expect, it } from "vitest";
import {
	connectDungeonFloors,
	createDungeonRun,
	type DungeonFloor,
	type DungeonRun,
	deriveFloorSeed,
	descendDungeonRun,
	generateDungeonFloor,
	generateDungeonRun,
	hashStringToUint32,
} from "../DungeonRun.ts";
import {
	type Coordinate,
	type DungeonConfig,
	FLOOR,
	generateDungeon,
	PLAYER,
	selectPlayerStart,
} from "../LayoutTiles.ts";
import { expectAllFloorTilesReachable } from "./testhelpers.ts";

describe("Dungeon run tests", () => {
	const config: DungeonConfig = {
		rows: 12,
		cols: 20,
		minPartitionSize: 5,
		roomPadding: 1,
	};

	const makeFloor = (floorNumber: number, seed: number): DungeonFloor => ({
		floorNumber,
		...generateDungeon(config, seed),
	});

	it("should create a three-floor run with the supplied seed", () => {
		const floors = [makeFloor(1, 101), makeFloor(2, 102), makeFloor(3, 103)];

		const run = createDungeonRun(123, floors);

		expect(run.seed).toBe(123);
		expect(run.floors).toHaveLength(3);
		expect(run.floors.map((floor) => floor.floorNumber)).toStrictEqual([
			1, 2, 3,
		]);
	});

	it("should begin a new run on floor 1", () => {
		const floors = [makeFloor(1, 101), makeFloor(2, 102), makeFloor(3, 103)];

		const run = createDungeonRun(123, floors);

		expect(run.activeFloor).toBe(1);
	});

	it("should place the player at floor 1's selected valid start", () => {
		const floors = [makeFloor(1, 101), makeFloor(2, 102), makeFloor(3, 103)];

		const expectedStart = selectPlayerStart(floors[0]);

		const run = createDungeonRun(123, floors);

		expect(run.playerCoordinate).toStrictEqual(expectedStart);
		expect(
			run.floors[0].terrain[run.playerCoordinate.row][run.playerCoordinate.col],
		).toBe(FLOOR);
	});

	it("should support a one-floor run", () => {
		const floors = [makeFloor(1, 101)];

		const run = createDungeonRun(123, floors);

		expect(run.seed).toBe(123);
		expect(run.floors).toHaveLength(1);
		expect(run.floors[0].floorNumber).toBe(1);
		expect(run.activeFloor).toBe(1);
		expect(run.playerCoordinate).toStrictEqual(selectPlayerStart(floors[0]));
	});

	it("should keep player position separate from floor terrain", () => {
		const floors = [makeFloor(1, 101), makeFloor(2, 102), makeFloor(3, 103)];

		const run = createDungeonRun(123, floors);

		expect(
			run.floors[0].terrain[run.playerCoordinate.row][run.playerCoordinate.col],
		).toBe(FLOOR);

		expect(run.floors[0].terrain.flat().includes(PLAYER)).toBe(false);
	});

	it("should reject a run with no floors", () => {
		expect(() => createDungeonRun(123, [])).toThrow(
			new RangeError("Dungeon run must contain at least one floor"),
		);
	});

	it("should reject floors that are not numbered consecutively starting at 1", () => {
		const floors = [makeFloor(1, 101), makeFloor(3, 103)];

		expect(() => createDungeonRun(123, floors)).toThrow(
			new RangeError("Dungeon floor numbers must be sequential"),
		);
	});

	it("should reject floors that do not start at floor 1", () => {
		const floors = [makeFloor(2, 102), makeFloor(3, 103)];

		expect(() => createDungeonRun(123, floors)).toThrow(
			new RangeError("Dungeon floor numbers must be sequential"),
		);
	});

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

		describe("connectDungeonFloors tests", () => {
			const config: DungeonConfig = {
				rows: 12,
				cols: 20,
				minPartitionSize: 5,
				roomPadding: 1,
			};

			it("should connect two adjacent floors with reciprocal stairs", () => {
				const run = connectDungeonFloors(generateDungeonRun(123, 2, config));

				const floor1 = run.floors[0];
				const floor2 = run.floors[1];

				expect(floor1.downStair).toBeDefined();
				expect(floor2.upStair).toBeDefined();

				expect(floor1.downStair?.destinationFloor).toBe(2);
				expect(floor2.upStair?.destinationFloor).toBe(1);

				expect(floor1.downStair?.arrivalCoordinate).toStrictEqual(
					floor2.upStair?.coordinate,
				);

				expect(floor2.upStair?.arrivalCoordinate).toStrictEqual(
					floor1.downStair?.coordinate,
				);
			});

			it("should connect every neighboring pair in a three-floor run", () => {
				const run = connectDungeonFloors(generateDungeonRun(123, 3, config));

				const floor1 = run.floors[0];
				const floor2 = run.floors[1];
				const floor3 = run.floors[2];

				expect(floor1.downStair?.destinationFloor).toBe(2);
				expect(floor2.upStair?.destinationFloor).toBe(1);

				expect(floor2.downStair?.destinationFloor).toBe(3);
				expect(floor3.upStair?.destinationFloor).toBe(2);
			});

			it("should make every adjacent stair pair reciprocal", () => {
				const run = connectDungeonFloors(generateDungeonRun(123, 3, config));

				for (let i = 0; i < run.floors.length - 1; i++) {
					const shallower = run.floors[i];
					const deeper = run.floors[i + 1];

					expect(shallower.downStair?.destinationFloor).toBe(
						deeper.floorNumber,
					);

					expect(deeper.upStair?.destinationFloor).toBe(shallower.floorNumber);

					expect(shallower.downStair?.arrivalCoordinate).toStrictEqual(
						deeper.upStair?.coordinate,
					);

					expect(deeper.upStair?.arrivalCoordinate).toStrictEqual(
						shallower.downStair?.coordinate,
					);
				}
			});

			it("should place every stair on a floor tile", () => {
				const run = connectDungeonFloors(generateDungeonRun(123, 3, config));

				for (const floor of run.floors) {
					if (floor.upStair) {
						expect(
							floor.terrain[floor.upStair.coordinate.row][
								floor.upStair.coordinate.col
							],
						).toBe(FLOOR);
					}

					if (floor.downStair) {
						expect(
							floor.terrain[floor.downStair.coordinate.row][
								floor.downStair.coordinate.col
							],
						).toBe(FLOOR);
					}
				}
			});

			it("should make every stair reachable from all traversable terrain on its floor", () => {
				const run = connectDungeonFloors(generateDungeonRun(123, 3, config));

				for (const floor of run.floors) {
					if (floor.upStair) {
						expectAllFloorTilesReachable(
							floor.terrain,
							floor.upStair.coordinate,
						);
					}

					if (floor.downStair) {
						expectAllFloorTilesReachable(
							floor.terrain,
							floor.downStair.coordinate,
						);
					}
				}
			});

			it("should place up and down stairs at different coordinates on an intermediate floor", () => {
				const run = connectDungeonFloors(generateDungeonRun(123, 3, config));

				const floor2 = run.floors[1];

				expect(floor2.upStair).toBeDefined();
				expect(floor2.downStair).toBeDefined();

				expect(floor2.downStair?.coordinate).not.toStrictEqual(
					floor2.upStair?.coordinate,
				);
			});

			it("should prefer different rooms for up and down stairs on an intermediate floor", () => {
				const run = connectDungeonFloors(generateDungeonRun(123, 3, config));

				const floor2 = run.floors[1];

				const roomContaining = (coordinate: Coordinate) =>
					floor2.rooms.findIndex(
						(room) =>
							coordinate.row >= room.startRow &&
							coordinate.row <= room.endRow &&
							coordinate.col >= room.startCol &&
							coordinate.col <= room.endCol,
					);

				expect(floor2.upStair).toBeDefined();
				expect(floor2.downStair).toBeDefined();

				if (!floor2.upStair || !floor2.downStair) {
					throw new Error("Expected intermediate floor to have both stairs");
				}

				const upRoom = roomContaining(floor2.upStair.coordinate);
				const downRoom = roomContaining(floor2.downStair.coordinate);

				expect(upRoom).toBeGreaterThanOrEqual(0);
				expect(downRoom).toBeGreaterThanOrEqual(0);
				expect(downRoom).not.toBe(upRoom);
			});

			it("should fall back to distinct coordinates when an intermediate floor has only one room", () => {
				const oneRoomConfig: DungeonConfig = {
					rows: 5,
					cols: 5,
					minPartitionSize: 5,
					roomPadding: 1,
				};

				const run = connectDungeonFloors(
					generateDungeonRun(123, 3, oneRoomConfig),
				);

				const floor2 = run.floors[1];

				expect(floor2.upStair).toBeDefined();
				expect(floor2.downStair).toBeDefined();

				if (!floor2.upStair || !floor2.downStair) {
					throw new Error("Expected intermediate floor to have both stairs");
				}

				expect(floor2.downStair?.coordinate).not.toStrictEqual(
					floor2.upStair?.coordinate,
				);

				expect(
					floor2.terrain[floor2.upStair.coordinate.row][
						floor2.upStair.coordinate.col
					],
				).toBe(FLOOR);

				expect(
					floor2.terrain[floor2.downStair.coordinate.row][
						floor2.downStair.coordinate.col
					],
				).toBe(FLOOR);
			});

			it("should not create an up stair on floor 1", () => {
				const run = connectDungeonFloors(generateDungeonRun(123, 3, config));

				expect(run.floors[0].upStair).toBeUndefined();
			});

			it("should not create a down stair on the deepest floor", () => {
				const run = connectDungeonFloors(generateDungeonRun(123, 3, config));

				expect(run.floors[2].downStair).toBeUndefined();
			});

			it("should create no inter-floor stairs for a one-floor run", () => {
				const run = connectDungeonFloors(generateDungeonRun(123, 1, config));

				expect(run.floors[0].upStair).toBeUndefined();
				expect(run.floors[0].downStair).toBeUndefined();
			});

			it("should produce the same stair links for the same run seed and configuration", () => {
				const first = connectDungeonFloors(generateDungeonRun(123, 3, config));

				const second = connectDungeonFloors(generateDungeonRun(123, 3, config));

				expect(second).toStrictEqual(first);
			});

			it("should allow the player start to reach every floor through down-stair links", () => {
				const run = connectDungeonFloors(generateDungeonRun(123, 3, config));

				const visitedFloors: number[] = [];
				let floorNumber = run.activeFloor;

				while (true) {
					visitedFloors.push(floorNumber);

					const floor = run.floors[floorNumber - 1];

					if (!floor.downStair) {
						break;
					}

					floorNumber = floor.downStair.destinationFloor;
				}

				expect(visitedFloors).toStrictEqual([1, 2, 3]);
			});

			it("should preserve the player's initial coordinate", () => {
				const original = generateDungeonRun(123, 3, config);
				const connected = connectDungeonFloors(original);

				expect(connected.playerCoordinate).toStrictEqual(
					original.playerCoordinate,
				);
			});

			it("should preserve underlying terrain when adding stair links", () => {
				const original = generateDungeonRun(123, 3, config);

				const terrainBefore = original.floors.map((floor) =>
					floor.terrain.map((row) => [...row]),
				);

				const connected = connectDungeonFloors(original);

				for (let i = 0; i < connected.floors.length; i++) {
					expect(connected.floors[i].terrain).toStrictEqual(terrainBefore[i]);
				}
			});

			it("should fail clearly when a floor cannot provide a distinct stair location", () => {
				const run = generateDungeonRun(123, 3, config);

				run.floors[1].terrain = [[FLOOR]];
				run.floors[1].rooms = [
					{
						startRow: 0,
						endRow: 0,
						startCol: 0,
						endCol: 0,
					},
				];

				expect(() => connectDungeonFloors(run)).toThrow(
					new RangeError("No valid coordinate available for staircase"),
				);
			});

			it("should not partially modify the original run when stair linking fails", () => {
				const run = generateDungeonRun(123, 3, config);

				run.floors[1].terrain = [[FLOOR]];
				run.floors[1].rooms = [
					{
						startRow: 0,
						endRow: 0,
						startCol: 0,
						endCol: 0,
					},
				];

				const before = structuredClone(run);

				expect(() => connectDungeonFloors(run)).toThrow();

				expect(run).toStrictEqual(before);
			});

			it("descends to the linked floor when the player is standing on a down stair", () => {
				const run: DungeonRun = connectDungeonFloors(
					generateDungeonRun(123, 3, config),
				);

				const floor1 = run.floors[0];

				expect(floor1.downStair).toBeDefined();

				if (!floor1.downStair) {
					throw new Error("Expected floor 1 to have a down stair");
				}

				const runOnStairs: DungeonRun = {
					...run,
					playerCoordinate: floor1.downStair.coordinate,
				};

				const descended = descendDungeonRun(runOnStairs);

				expect(descended.activeFloor).toBe(floor1.downStair.destinationFloor);

				expect(descended.playerCoordinate).toEqual(
					floor1.downStair.arrivalCoordinate,
				);
			});

			it("does not descend when the player is not standing on the down stair", () => {
				const run = connectDungeonFloors(generateDungeonRun(123, 3, config));

				const descended = descendDungeonRun(run);

				expect(descended).toEqual(run);
			});

			it("does not descend when the active floor has no down stair", () => {
				const run = connectDungeonFloors(generateDungeonRun(123, 3, config));

				const deepestFloor = run.floors[run.floors.length - 1];

				const deepestRun = {
					...run,
					activeFloor: deepestFloor.floorNumber,
					playerCoordinate: { row: 0, col: 0 },
				};

				const descended = descendDungeonRun(deepestRun);

				expect(descended).toEqual(deepestRun);
			});

			it("descends when the player has the same coordinate values as the down stair", () => {
				const run = connectDungeonFloors(generateDungeonRun(123, 3, config));

				const floor1 = run.floors[0];

				expect(floor1.downStair).toBeDefined();

				if (!floor1.downStair) {
					throw new Error("Expected floor 1 to have a down stair");
				}

				const runOnStairs = {
					...run,
					playerCoordinate: {
						row: floor1.downStair.coordinate.row,
						col: floor1.downStair.coordinate.col,
					},
				};

				const descended = descendDungeonRun(runOnStairs);

				expect(descended.activeFloor).toBe(floor1.downStair.destinationFloor);

				expect(descended.playerCoordinate).toEqual(
					floor1.downStair.arrivalCoordinate,
				);
			});

			it("does not change generated floors when descending", () => {
				const run = connectDungeonFloors(generateDungeonRun(123, 3, config));

				const floor1 = run.floors[0];

				expect(floor1.downStair).toBeDefined();

				if (!floor1.downStair) {
					throw new Error("Expected floor 1 to have a down stair");
				}

				const runOnStairs = {
					...run,
					playerCoordinate: {
						row: floor1.downStair.coordinate.row,
						col: floor1.downStair.coordinate.col,
					},
				};

				const floorsBefore = structuredClone(runOnStairs.floors);

				const descended = descendDungeonRun(runOnStairs);

				expect(descended.floors).toEqual(floorsBefore);
			});
		});
	});
});
