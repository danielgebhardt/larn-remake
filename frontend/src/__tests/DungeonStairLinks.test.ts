// @vitest-environment node

import { describe, expect, it } from "vitest";
import {
	connectDungeonFloors,
	generateDungeonRun,
} from "../domain/dungeon/DungeonRun.ts";
import type { Coordinate } from "../domain/dungeon/DungeonTypes.ts";
import type { DungeonConfig } from "../domain/dungeon/RunConfiguration.ts";
import { FLOOR } from "../domain/dungeon/Tiles.ts";
import { expectAllFloorTilesReachable } from "./testhelpers.ts";

describe("Dungeon stair links", () => {
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

			expect(shallower.downStair?.destinationFloor).toBe(deeper.floorNumber);

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
				expectAllFloorTilesReachable(floor.terrain, floor.upStair.coordinate);
			}

			if (floor.downStair) {
				expectAllFloorTilesReachable(floor.terrain, floor.downStair.coordinate);
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

		const run = connectDungeonFloors(generateDungeonRun(123, 3, oneRoomConfig));

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

		expect(connected.playerCoordinate).toStrictEqual(original.playerCoordinate);
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
});
