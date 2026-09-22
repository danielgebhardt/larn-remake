import { describe, expect, it } from "vitest";
import {
	type PartitionNode,
	type Region,
	recursivePartition,
} from "../Partitioning.ts";
import { assignRoomsToPartition, createRoom, type Room } from "../Room.ts";
import { getTerminalRooms } from "./testhelpers.ts";

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
	});

	describe("assignRoomsToPartition tests", () => {
		it("should add a room to a terminal partition", () => {
			const regionTooSmall: Region = {
				startRow: 0,
				endRow: 2,
				startCol: 0,
				endCol: 2,
			};

			const expectedRoom: Room = {
				startRow: 1,
				endRow: 1,
				startCol: 1,
				endCol: 1,
			};

			const minChildSize = 4;

			const partitions: PartitionNode = recursivePartition(
				regionTooSmall,
				minChildSize,
			);

			const partitionWithRooms = assignRoomsToPartition(partitions, 1);

			expect(partitionWithRooms.region).toStrictEqual(regionTooSmall);
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
	});
});
