// @vitest-environment node

import { describe, expect, it, vi } from "vitest";
import {
	type PartitionNode,
	type Region,
	recursivePartition,
} from "../domain/dungeon/Partitioning.ts";
import {
	assignRoomsToPartition,
	createRoom,
	getRepresentativeRoom,
	getTerminalRooms,
	type Room,
} from "../domain/dungeon/Room.ts";
import { createSeededRandom } from "../domain/dungeon/Seed.ts";

describe("Room Tests", () => {
	describe("createRoom tests", () => {
		it("should create a room that fills a region when padding is zero", () => {
			const testRegion: Region = {
				startRow: 0,
				endRow: 5,
				startCol: 0,
				endCol: 5,
			};

			const expectedRoom: Room = {
				startRow: 0,
				endRow: 5,
				startCol: 0,
				endCol: 5,
			};

			expect(createRoom(testRegion, 0)).toStrictEqual(expectedRoom);
		});

		it("should inset the room from every partition edge by the configured padding", () => {
			const testRegion: Region = {
				startRow: 0,
				endRow: 9,
				startCol: 0,
				endCol: 12,
			};

			const expectedRoomPadding1: Room = {
				startRow: 1,
				endRow: 8,
				startCol: 1,
				endCol: 11,
			};

			const expectedRoomPadding3: Room = {
				startRow: 3,
				endRow: 6,
				startCol: 3,
				endCol: 9,
			};

			expect(createRoom(testRegion, 1)).toStrictEqual(expectedRoomPadding1);
			expect(createRoom(testRegion, 3)).toStrictEqual(expectedRoomPadding3);
		});

		it("should create a room within an offset region", () => {
			const testRegion: Region = {
				startRow: 3,
				endRow: 9,
				startCol: 2,
				endCol: 12,
			};

			const expectedRoomPadding1: Room = {
				startRow: 4,
				endRow: 8,
				startCol: 3,
				endCol: 11,
			};

			expect(createRoom(testRegion, 1)).toStrictEqual(expectedRoomPadding1);
		});

		it("should throw RangeError when padding is negative or not a whole number", () => {
			const testRegion: Region = {
				startRow: 0,
				endRow: 3,
				startCol: 0,
				endCol: 7,
			};

			for (const invalidSize of [-1, 1.5]) {
				expect(() => createRoom(testRegion, invalidSize)).toThrow(
					new RangeError("padding must be zero or a positive integer"),
				);
			}
		});

		it("should throw RangeError when the region is too small for the configured padding", () => {
			const testRegion: Region = {
				startRow: 0,
				endRow: 3,
				startCol: 0,
				endCol: 3,
			};

			expect(() => createRoom(testRegion, 5)).toThrow(
				new RangeError("region is too small for the configured padding"),
			);
			expect(() => createRoom(testRegion, 2)).toThrow(
				new RangeError("region is too small for the configured padding"),
			);
		});

		it("should not modify the original region", () => {
			const testRegion: Region = {
				startRow: 3,
				endRow: 9,
				startCol: 2,
				endCol: 12,
			};

			const expectedRegion: Region = {
				startRow: 3,
				endRow: 9,
				startCol: 2,
				endCol: 12,
			};

			const expectedRoomPadding1: Room = {
				startRow: 4,
				endRow: 8,
				startCol: 3,
				endCol: 11,
			};

			expect(createRoom(testRegion, 1)).toStrictEqual(expectedRoomPadding1);
			expect(expectedRegion).toStrictEqual(testRegion);
		});

		it("should create a one-by-one room from the smallest eligible region", () => {
			const testRegion: Region = {
				startRow: 0,
				endRow: 2,
				startCol: 0,
				endCol: 2,
			};

			const expectedRoomPadding1: Room = {
				startRow: 1,
				endRow: 1,
				startCol: 1,
				endCol: 1,
			};

			expect(createRoom(testRegion, 1)).toStrictEqual(expectedRoomPadding1);
		});

		it("creates the smallest room at the padded origin when random choices are zero", () => {
			const region: Region = {
				startRow: 10,
				endRow: 19,
				startCol: 20,
				endCol: 31,
			};
			const random = () => 0;

			expect(createRoom(region, 1, random)).toStrictEqual({
				startRow: 11,
				endRow: 13,
				startCol: 21,
				endCol: 23,
			});
		});

		it("creates the largest room at the padded origin when random choices are 0.99", () => {
			const region: Region = {
				startRow: 10,
				endRow: 19,
				startCol: 20,
				endCol: 31,
			};
			const random = () => 0.99;

			expect(createRoom(region, 1, random)).toStrictEqual({
				startRow: 11,
				endRow: 18,
				startCol: 21,
				endCol: 30,
			});
		});

		it("creates an intermediate-sized room offset within the padded region", () => {
			const region: Region = {
				startRow: 10,
				endRow: 19,
				startCol: 20,
				endCol: 31,
			};
			const random = () => 0.5;

			expect(createRoom(region, 1, random)).toStrictEqual({
				startRow: 12,
				endRow: 17,
				startCol: 23,
				endCol: 29,
			});
		});

		it("places the smallest room at the bottom-right of the padded region", () => {
			const region: Region = {
				startRow: 10,
				endRow: 19,
				startCol: 20,
				endCol: 31,
			};
			const random = vi
				.fn()
				.mockReturnValueOnce(0)
				.mockReturnValueOnce(0)
				.mockReturnValueOnce(0.99)
				.mockReturnValueOnce(0.99);

			expect(createRoom(region, 1, random)).toStrictEqual({
				startRow: 16,
				endRow: 18,
				startCol: 28,
				endCol: 30,
			});
		});

		it.each([0, 0.5, 0.99])(
			"creates the only valid room when random returns %s",
			(value) => {
				const region: Region = {
					startRow: 10,
					endRow: 12,
					startCol: 20,
					endCol: 22,
				};

				expect(createRoom(region, 1, () => value)).toStrictEqual({
					startRow: 11,
					endRow: 11,
					startCol: 21,
					endCol: 21,
				});
			},
		);

		it.each([0, 0.25, 0.5, 0.75, 0.99])(
			"creates a nonempty integer room within the padded bounds when random returns %s",
			(value) => {
				const region: Region = {
					startRow: 10,
					endRow: 19,
					startCol: 20,
					endCol: 31,
				};

				const room = createRoom(region, 1, () => value);

				for (const coordinate of Object.values(room)) {
					expect(Number.isInteger(coordinate)).toBe(true);
				}

				expect(room.startRow).toBeGreaterThanOrEqual(11);
				expect(room.endRow).toBeLessThanOrEqual(18);
				expect(room.startCol).toBeGreaterThanOrEqual(21);
				expect(room.endCol).toBeLessThanOrEqual(30);

				expect(room.endRow).toBeGreaterThanOrEqual(room.startRow);
				expect(room.endCol).toBeGreaterThanOrEqual(room.startCol);
			},
		);

		it.each([0, 0.5, 0.99])(
			"rejects a region too small for padding when random returns %s",
			(value) => {
				const region: Region = {
					startRow: 10,
					endRow: 11,
					startCol: 20,
					endCol: 23,
				};

				expect(() => createRoom(region, 1, () => value)).toThrow(RangeError);
			},
		);

		it("does not modify the region when creating a varied room", () => {
			const region: Region = {
				startRow: 10,
				endRow: 19,
				startCol: 20,
				endCol: 31,
			};
			const original = { ...region };

			createRoom(region, 1, () => 0.5);

			expect(region).toStrictEqual(original);
		});

		it("creates identical room geometry from the same seed", () => {
			const region: Region = {
				startRow: 10,
				endRow: 19,
				startCol: 20,
				endCol: 31,
			};

			const first = createRoom(region, 1, createSeededRandom(123));
			const second = createRoom(region, 1, createSeededRandom(123));

			expect(first).toStrictEqual(second);
		});

		it("can create different room geometry across seeds", () => {
			const region: Region = {
				startRow: 10,
				endRow: 19,
				startCol: 20,
				endCol: 31,
			};

			const rooms = Array.from({ length: 20 }, (_, seed) =>
				createRoom(region, 1, createSeededRandom(seed)),
			);
			const uniqueRooms = new Set(rooms.map((room) => JSON.stringify(room)));

			expect(uniqueRooms.size).toBeGreaterThan(1);
		});
	});

	describe("assignRoomsToPartition tests", () => {
		it("should add a room to a terminal partition using the configured padding", () => {
			const terminalRegion: Region = {
				startRow: 0,
				endRow: 5,
				startCol: 0,
				endCol: 5,
			};

			const expectedRoom: Room = {
				startRow: 2,
				endRow: 3,
				startCol: 2,
				endCol: 3,
			};

			const minChildSize = 4;

			const partitions: PartitionNode = recursivePartition(
				terminalRegion,
				minChildSize,
			);

			const partitionWithRooms = assignRoomsToPartition(partitions, 2);

			expect(partitionWithRooms.region).toStrictEqual(terminalRegion);
			expect(partitionWithRooms.children).toBeUndefined();
			expect(partitionWithRooms.room).toStrictEqual(expectedRoom);
		});

		it("should not add a room to an internal partition", () => {
			const tallRegion: Region = {
				startRow: 0,
				endRow: 7,
				startCol: 0,
				endCol: 3,
			};

			const partitionTree = recursivePartition(tallRegion, 4);
			const partitionWithRooms = assignRoomsToPartition(partitionTree, 1);

			expect(partitionWithRooms.room).toBeUndefined();
		});

		it("should recursively add rooms to a partition tree through multiple levels", () => {
			const rootRegion: Region = {
				startRow: 0,
				endRow: 7,
				startCol: 0,
				endCol: 7,
			};

			const partitionTree = recursivePartition(rootRegion, 4);
			const partitionWithRooms = assignRoomsToPartition(partitionTree, 1);

			const terminalRooms = getTerminalRooms(partitionWithRooms);

			expect(terminalRooms).toHaveLength(4);
			expect(terminalRooms).toStrictEqual([
				{
					startRow: 1,
					endRow: 2,
					startCol: 1,
					endCol: 2,
				},
				{
					startRow: 5,
					endRow: 6,
					startCol: 1,
					endCol: 2,
				},
				{
					startRow: 1,
					endRow: 2,
					startCol: 5,
					endCol: 6,
				},
				{
					startRow: 5,
					endRow: 6,
					startCol: 5,
					endCol: 6,
				},
			]);
		});

		it("should not modify the original partition tree", () => {
			const rootRegion: Region = {
				startRow: 0,
				endRow: 7,
				startCol: 0,
				endCol: 7,
			};

			const partitionTree = recursivePartition(rootRegion, 4);
			const originalPartitionTree = structuredClone(partitionTree);

			const partitionTreeWithRooms = assignRoomsToPartition(partitionTree, 1);

			expect(partitionTree).toStrictEqual(originalPartitionTree);
			expect(partitionTreeWithRooms).not.toBe(partitionTree);
			expect(partitionTreeWithRooms.children?.[0]).not.toBe(
				partitionTree.children?.[0],
			);
			expect(partitionTreeWithRooms.children?.[1]).not.toBe(
				partitionTree.children?.[1],
			);
		});

		it("should throw RangeError when a terminal partition is too small for the configured padding", () => {
			const smallRegion: Region = {
				startRow: 0,
				endRow: 1,
				startCol: 0,
				endCol: 1,
			};

			const partitionTree = recursivePartition(smallRegion, 2);

			expect(() => assignRoomsToPartition(partitionTree, 1)).toThrow(
				new RangeError("region is too small for the configured padding"),
			);
		});

		it("assigns minimum-sized rooms to every terminal partition using the supplied random source", () => {
			const partition: PartitionNode = {
				region: {
					startRow: 0,
					endRow: 4,
					startCol: 0,
					endCol: 9,
				},
				children: [
					{
						region: {
							startRow: 0,
							endRow: 4,
							startCol: 0,
							endCol: 4,
						},
					},
					{
						region: {
							startRow: 0,
							endRow: 4,
							startCol: 5,
							endCol: 9,
						},
					},
				],
			};
			const original = structuredClone(partition);
			const random = vi
				.fn()
				.mockReturnValueOnce(0)
				.mockReturnValueOnce(0)
				.mockReturnValueOnce(0)
				.mockReturnValueOnce(0)
				.mockReturnValueOnce(0)
				.mockReturnValueOnce(0)
				.mockReturnValueOnce(0.99)
				.mockReturnValueOnce(0.99);

			const result = assignRoomsToPartition(partition, 1, random);

			expect(getTerminalRooms(result)).toStrictEqual([
				{
					startRow: 1,
					endRow: 3,
					startCol: 1,
					endCol: 3,
				},
				{
					startRow: 1,
					endRow: 3,
					startCol: 6,
					endCol: 8,
				},
			]);
			expect(partition).toStrictEqual(original);
		});
	});

	describe("getRepresentativeRoom tests", () => {
		it("should return the room attached to a terminal partition", () => {
			const region: Region = {
				startRow: 0,
				endRow: 3,
				startCol: 0,
				endCol: 3,
			};
			const room: Room = {
				startRow: 1,
				endRow: 2,
				startCol: 1,
				endCol: 2,
			};

			const partition: PartitionNode = {
				region: region,
				room: room,
			};

			const representativeRoom = getRepresentativeRoom(partition);

			expect(representativeRoom).toStrictEqual(room);
		});

		it("should select the representative room from the first child subtree", () => {
			const regionRoot: Region = {
				startRow: 0,
				endRow: 5,
				startCol: 0,
				endCol: 5,
			};

			const region1: Region = {
				startRow: 0,
				endRow: 5,
				startCol: 0,
				endCol: 2,
			};

			const region2: Region = {
				startRow: 0,
				endRow: 5,
				startCol: 3,
				endCol: 5,
			};

			const room1: Room = {
				startRow: 1,
				endRow: 4,
				startCol: 1,
				endCol: 1,
			};

			const room2: Room = {
				startRow: 1,
				endRow: 4,
				startCol: 4,
				endCol: 4,
			};

			const child1: PartitionNode = {
				region: region1,
				room: room1,
			};

			const child2: PartitionNode = {
				region: region2,
				room: room2,
			};

			const partitionRoot: PartitionNode = {
				region: regionRoot,
				children: [child1, child2],
			};

			expect(getRepresentativeRoom(partitionRoot)).toStrictEqual(room1);
		});

		it("should throw Error when the selected terminal partition has no room", () => {
			const regionRoot: Region = {
				startRow: 0,
				endRow: 5,
				startCol: 0,
				endCol: 5,
			};

			const partitionRoot: PartitionNode = {
				region: regionRoot,
			};

			expect(() => getRepresentativeRoom(partitionRoot)).toThrow(
				"Terminal partition does not contain a room",
			);
		});

		it("should select a representative room through multiple partition levels", () => {
			const region: Region = {
				startRow: 0,
				endRow: 7,
				startCol: 0,
				endCol: 7,
			};

			const partition = assignRoomsToPartition(
				recursivePartition(region, 2),
				0,
			);
			const terminalRooms = getTerminalRooms(partition);

			const representativeRoom = getRepresentativeRoom(partition);

			expect(representativeRoom).toBe(terminalRooms[0]);
		});

		it("should not modify the partition tree when selecting a representative room", () => {
			const region: Region = {
				startRow: 0,
				endRow: 7,
				startCol: 0,
				endCol: 7,
			};

			const partition = assignRoomsToPartition(
				recursivePartition(region, 2),
				0,
			);
			const originalPartition = structuredClone(partition);

			getRepresentativeRoom(partition);

			expect(partition).toStrictEqual(originalPartition);
		});
	});
});
