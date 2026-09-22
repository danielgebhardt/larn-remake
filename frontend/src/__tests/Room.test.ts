import { describe, expect, it } from "vitest";
import type { Region } from "../Partitioning.ts";
import { createRoom, type Room } from "../Room.ts";

describe("Room Tests", () => {
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
		expect(expectedRegion).toStrictEqual(expectedRegion);
	});
});
