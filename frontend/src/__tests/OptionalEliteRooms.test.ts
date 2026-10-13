// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
	connectDungeonFloors,
	type DungeonFloor,
	generateDungeonRun,
} from "../domain/dungeon/DungeonRun";
import { createGameState } from "../domain/game/GameState";
import {
	addOptionalEliteRooms,
	findOptionalEliteRooms,
} from "../domain/objects/OptionalEliteRooms";
import { COMPACT_TEST_CONFIGURATION } from "./TestRunConfiguration";

const chamber = () => {
	const terrain = Array.from({ length: 10 }, () => Array<string>(18).fill("#"));
	const rooms = [
		{ startRow: 3, endRow: 5, startCol: 3, endCol: 5 },
		{ startRow: 3, endRow: 5, startCol: 12, endCol: 14 },
	];
	for (const room of rooms)
		for (let row = room.startRow; row <= room.endRow; row++)
			for (let col = room.startCol; col <= room.endCol; col++)
				terrain[row][col] = ".";
	for (let col = 6; col <= 11; col++) terrain[4][col] = ".";
	return { terrain, rooms };
};
const required = [
	{ row: 4, col: 13 },
	{ row: 5, col: 14 },
];

describe("Optional elite chamber geometry", () => {
	it("seals a side room while keeping both required locations connected", () => {
		const floor = chamber();
		expect(findOptionalEliteRooms(floor, required)).toEqual([
			{ room: floor.rooms[0], gate: { row: 4, col: 6 } },
		]);
	});
	it("rejects rooms with a second entrance", () => {
		const floor = chamber();
		for (let col = 6; col <= 11; col++) floor.terrain[5][col] = ".";
		expect(findOptionalEliteRooms(floor, required)).toEqual([]);
	});
	it("never puts a required objective inside the chamber", () => {
		expect(
			findOptionalEliteRooms(chamber(), [...required, { row: 4, col: 4 }]),
		).toEqual([]);
	});
	it("adds one deterministic champion and gate without replacing ordinary content", () => {
		const state = createGameState(
			connectDungeonFloors(
				generateDungeonRun(123, 10, COMPACT_TEST_CONFIGURATION),
			),
		);
		const floor: DungeonFloor = {
			...state.run.floors[7],
			...chamber(),
			floorNumber: 8,
			upStair: {
				coordinate: required[0],
				destinationFloor: 7,
				arrivalCoordinate: { row: 1, col: 1 },
			},
			downStair: {
				coordinate: required[1],
				destinationFloor: 9,
				arrivalCoordinate: { row: 1, col: 1 },
			},
		};
		const source = {
			...state,
			run: {
				...state.run,
				floors: state.run.floors.map((f) =>
					f.floorNumber === 8
						? floor
						: {
								...f,
								upStair:
									f.upStair?.destinationFloor === 8
										? { ...f.upStair, arrivalCoordinate: required[1] }
										: f.upStair,
								downStair:
									f.downStair?.destinationFloor === 8
										? { ...f.downStair, arrivalCoordinate: required[0] }
										: f.downStair,
							},
				),
			},
			monsters: state.monsters.filter((m) => m.floorNumber !== 8),
			objects: state.objects.filter((o) => o.floorNumber !== 8),
			floorItems: state.floorItems.filter((i) => i.floorNumber !== 8),
		};
		const placed = addOptionalEliteRooms(source, { chance: 1 });
		expect(placed).toEqual(addOptionalEliteRooms(source, { chance: 1 }));
		expect(placed.monsters.filter((m) => m.floorNumber === 8)).toMatchObject([
			{ kind: "iron-champion", coordinate: { row: 4, col: 4 } },
		]);
		expect(placed.objects.filter((o) => o.floorNumber === 8)).toMatchObject([
			{ kind: "elite-door", activated: false, coordinate: { row: 4, col: 6 } },
		]);
		expect(
			addOptionalEliteRooms({ ...source, ...placed }, { chance: 1 }),
		).toEqual(placed);
		expect(source.run.floors[7].terrain).toEqual(chamber().terrain);
	});
});
