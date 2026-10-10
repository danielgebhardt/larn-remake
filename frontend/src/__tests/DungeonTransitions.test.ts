// @vitest-environment node

import { describe, expect, it } from "vitest";
import {
	ascendDungeonRun,
	connectDungeonFloors,
	type DungeonRun,
	descendDungeonRun,
	generateDungeonRun,
} from "../domain/dungeon/DungeonRun.ts";
import type { DungeonConfig } from "../domain/dungeon/RunConfiguration.ts";
import { FLOOR } from "../domain/dungeon/Tiles.ts";

describe("Dungeon stair transitions", () => {
	const config: DungeonConfig = {
		rows: 12,
		cols: 20,
		minPartitionSize: 5,
		roomPadding: 1,
	};

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

		expect(descended.run.activeFloor).toBe(floor1.downStair.destinationFloor);

		expect(descended.run.playerCoordinate).toEqual(
			floor1.downStair.arrivalCoordinate,
		);

		expect(descended.transitioned).toBe(true);
	});

	it("does not descend when the player is not standing on the down stair", () => {
		const run = connectDungeonFloors(generateDungeonRun(123, 3, config));

		const descended = descendDungeonRun(run);

		expect(descended.run).toEqual(run);
		expect(descended.transitioned).toBe(false);
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

		expect(descended.run).toEqual(deepestRun);
		expect(descended.transitioned).toBe(false);
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

		expect(descended.run.activeFloor).toBe(floor1.downStair.destinationFloor);

		expect(descended.run.playerCoordinate).toEqual(
			floor1.downStair.arrivalCoordinate,
		);

		expect(descended.transitioned).toBe(true);
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

		expect(descended.run.floors).toEqual(floorsBefore);
		expect(descended.transitioned).toBe(true);
	});

	it("throws when the down stair links to a nonexistent floor", () => {
		const run = connectDungeonFloors(generateDungeonRun(123, 3, config));

		const floor1 = run.floors[0];

		expect(floor1.downStair).toBeDefined();

		if (!floor1.downStair) {
			throw new Error("Expected floor 1 to have a down stair");
		}

		const runWithInvalidLink: DungeonRun = {
			...run,
			floors: [
				{
					...floor1,
					downStair: {
						...floor1.downStair,
						destinationFloor: 99,
					},
				},
				...run.floors.slice(1),
			],
			playerCoordinate: {
				row: floor1.downStair.coordinate.row,
				col: floor1.downStair.coordinate.col,
			},
		};

		const before = structuredClone(runWithInvalidLink);

		expect(() => descendDungeonRun(runWithInvalidLink)).toThrow(
			new RangeError("Stair destination floor 99 does not exist"),
		);
		expect(runWithInvalidLink).toEqual(before);
	});

	it("ascends to the linked floor when the player is standing on an up stair", () => {
		const run = connectDungeonFloors(generateDungeonRun(123, 3, config));

		const floor2 = run.floors[1];

		expect(floor2.upStair).toBeDefined();

		if (!floor2.upStair) {
			throw new Error("Expected floor 2 to have an up stair");
		}

		const runOnStairs: DungeonRun = {
			...run,
			activeFloor: 2,
			playerCoordinate: {
				row: floor2.upStair.coordinate.row,
				col: floor2.upStair.coordinate.col,
			},
		};

		const ascended = ascendDungeonRun(runOnStairs);

		expect(ascended.run.activeFloor).toBe(floor2.upStair.destinationFloor);
		expect(ascended.run.playerCoordinate).toEqual(
			floor2.upStair.arrivalCoordinate,
		);
		expect(ascended.transitioned).toBe(true);
	});

	it("does not ascend when the player is not standing on the up stair", () => {
		const run = connectDungeonFloors(generateDungeonRun(123, 3, config));

		const runAwayFromStairs: DungeonRun = {
			...run,
			activeFloor: 2,
			playerCoordinate: { row: 0, col: 0 },
		};

		const ascended = ascendDungeonRun(runAwayFromStairs);

		expect(ascended.run).toEqual(runAwayFromStairs);
		expect(ascended.transitioned).toBe(false);
	});

	it("does not ascend when the active floor has no up stair", () => {
		const run = connectDungeonFloors(generateDungeonRun(123, 3, config));

		const floor1Run: DungeonRun = {
			...run,
			activeFloor: 1,
			playerCoordinate: { row: 0, col: 0 },
		};

		const ascended = ascendDungeonRun(floor1Run);

		expect(ascended.run).toEqual(floor1Run);
		expect(ascended.transitioned).toBe(false);
	});

	it("ascends when the player has the same coordinate values as the up stair", () => {
		const run = connectDungeonFloors(generateDungeonRun(123, 3, config));

		const floor2 = run.floors[1];

		expect(floor2.upStair).toBeDefined();

		if (!floor2.upStair) {
			throw new Error("Expected floor 2 to have an up stair");
		}

		const runOnStairs: DungeonRun = {
			...run,
			activeFloor: 2,
			playerCoordinate: {
				row: floor2.upStair.coordinate.row,
				col: floor2.upStair.coordinate.col,
			},
		};

		const ascended = ascendDungeonRun(runOnStairs);

		expect(ascended.run.activeFloor).toBe(floor2.upStair.destinationFloor);
		expect(ascended.run.playerCoordinate).toEqual(
			floor2.upStair.arrivalCoordinate,
		);
		expect(ascended.transitioned).toBe(true);
	});

	it("does not change generated floors when ascending", () => {
		const run = connectDungeonFloors(generateDungeonRun(123, 3, config));

		const floor2 = run.floors[1];

		expect(floor2.upStair).toBeDefined();

		if (!floor2.upStair) {
			throw new Error("Expected floor 2 to have an up stair");
		}

		const runOnStairs: DungeonRun = {
			...run,
			activeFloor: 2,
			playerCoordinate: {
				row: floor2.upStair.coordinate.row,
				col: floor2.upStair.coordinate.col,
			},
		};

		const floorsBefore = structuredClone(runOnStairs.floors);

		const ascended = ascendDungeonRun(runOnStairs);

		expect(ascended.run.floors).toEqual(floorsBefore);
		expect(ascended.transitioned).toBe(true);
	});

	it("throws when the up stair links to a nonexistent floor", () => {
		const run = connectDungeonFloors(generateDungeonRun(123, 3, config));

		const floor2 = run.floors[1];

		expect(floor2.upStair).toBeDefined();

		if (!floor2.upStair) {
			throw new Error("Expected floor 2 to have an up stair");
		}

		const runWithInvalidLink: DungeonRun = {
			...run,
			activeFloor: 2,
			floors: [
				run.floors[0],
				{
					...floor2,
					upStair: {
						...floor2.upStair,
						destinationFloor: 99,
					},
				},
				...run.floors.slice(2),
			],
			playerCoordinate: {
				row: floor2.upStair.coordinate.row,
				col: floor2.upStair.coordinate.col,
			},
		};

		const before = structuredClone(runWithInvalidLink);

		expect(() => ascendDungeonRun(runWithInvalidLink)).toThrow(
			new RangeError("Stair destination floor 99 does not exist"),
		);
		expect(runWithInvalidLink).toEqual(before);
	});

	describe.each([
		{ direction: "descending", transition: descendDungeonRun },
		{ direction: "ascending", transition: ascendDungeonRun },
	])("invalid active floor when $direction", ({ transition }) => {
		it.each([0, -1, 99, 1.5, Number.NaN])(
			"throws without modifying the run for active floor %s",
			(activeFloor) => {
				const run = connectDungeonFloors(generateDungeonRun(123, 3, config));
				const invalidRun = { ...run, activeFloor };
				const before = structuredClone(invalidRun);

				expect(() => transition(invalidRun)).toThrow(
					new RangeError(`Active floor ${activeFloor} does not exist`),
				);
				expect(invalidRun).toEqual(before);
			},
		);
	});

	it.each([
		{
			direction: "descent",
			transition: descendDungeonRun,
			stairKey: "downStair" as const,
		},
		{
			direction: "ascent",
			transition: ascendDungeonRun,
			stairKey: "upStair" as const,
		},
	])(
		"ignores a stale $direction attempt after the player leaves the stair",
		({ transition, stairKey }) => {
			const run = connectDungeonFloors(generateDungeonRun(123, 3, config));
			const floor = run.floors[1];
			const stair = floor[stairKey];
			if (!stair) {
				throw new Error(`Expected floor 2 to have a ${stairKey}`);
			}

			const onStair = {
				...run,
				activeFloor: 2,
				playerCoordinate: { ...stair.coordinate },
			};
			expect(transition(onStair).transitioned).toBe(true);

			const awayCoordinate = floor.terrain
				.flatMap((row, rowIndex) =>
					row.flatMap((tile, col) =>
						tile === FLOOR ? [{ row: rowIndex, col }] : [],
					),
				)
				.find((coordinate) =>
					[floor.upStair, floor.downStair].every(
						(link) =>
							!link ||
							coordinate.row !== link.coordinate.row ||
							coordinate.col !== link.coordinate.col,
					),
				);
			if (!awayCoordinate) {
				throw new Error("Expected a floor tile away from both stairs");
			}

			const movedAway = { ...onStair, playerCoordinate: awayCoordinate };
			const before = structuredClone(movedAway);
			const result = transition(movedAway);

			expect(result.transitioned).toBe(false);
			expect(result.run).toEqual(before);
			expect(movedAway).toEqual(before);
		},
	);

	describe.each([
		{
			direction: "descending",
			transition: descendDungeonRun,
			activeFloor: 1,
			stairKey: "downStair" as const,
		},
		{
			direction: "ascending",
			transition: ascendDungeonRun,
			activeFloor: 2,
			stairKey: "upStair" as const,
		},
	])(
		"invalid arrival when $direction",
		({ transition, activeFloor, stairKey }) => {
			it.each([
				{ row: -1, col: 1 },
				{ row: 999, col: 1 },
				{ row: 1, col: -1 },
				{ row: 1, col: 999 },
				{ row: 1.5, col: 1 },
				{ row: 1, col: 1.5 },
				{ row: 0, col: 0 },
			])(
				"throws without modifying the run for arrival ($row, $col)",
				(arrivalCoordinate) => {
					const run = connectDungeonFloors(generateDungeonRun(123, 3, config));
					const currentFloor = run.floors[activeFloor - 1];
					const stair = currentFloor[stairKey];

					if (!stair) {
						throw new Error(
							`Expected floor ${activeFloor} to have a ${stairKey}`,
						);
					}

					const runWithInvalidArrival: DungeonRun = {
						...run,
						activeFloor,
						floors: run.floors.map((floor) =>
							floor.floorNumber === activeFloor
								? { ...floor, [stairKey]: { ...stair, arrivalCoordinate } }
								: floor,
						),
						playerCoordinate: { ...stair.coordinate },
					};
					const before = structuredClone(runWithInvalidArrival);

					expect(() => transition(runWithInvalidArrival)).toThrow(
						new RangeError(
							"Stair arrival coordinate must be an in-bounds floor tile",
						),
					);
					expect(runWithInvalidArrival).toEqual(before);
				},
			);
		},
	);
});
