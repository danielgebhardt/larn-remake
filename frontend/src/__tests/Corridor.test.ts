import { describe, expect, it } from "vitest";
import { type Corridor, createCorridor, getRoomEndpoint } from "../Corridor.ts";
import type { Room } from "../Room.ts";

describe("Corridor tests", () => {
	it("should select an endpoint inside each room", () => {
		const room1: Room = {
			startRow: 1,
			endRow: 2,
			startCol: 1,
			endCol: 2,
		};

		const room2: Room = {
			startRow: 1,
			endRow: 2,
			startCol: 4,
			endCol: 5,
		};

		expect(getRoomEndpoint(room1)).toStrictEqual({ row: 1, col: 1 });
		expect(getRoomEndpoint(room2)).toStrictEqual({ row: 1, col: 4 });
	});

	it("should create a straight horizontal line corridor between aligned rooms", () => {
		const room1: Room = {
			startRow: 1,
			endRow: 2,
			startCol: 1,
			endCol: 2,
		};

		const room2: Room = {
			startRow: 1,
			endRow: 2,
			startCol: 4,
			endCol: 5,
		};

		const corridor: Corridor = createCorridor(room1, room2);
		expect(corridor).toStrictEqual([
			{ row: 1, col: 2 },
			{ row: 1, col: 3 },
		]);
	});

	it("should create a straight vertical line corridor between aligned rooms", () => {
		const room1: Room = {
			startRow: 1,
			endRow: 2,
			startCol: 1,
			endCol: 2,
		};

		const room2: Room = {
			startRow: 4,
			endRow: 5,
			startCol: 1,
			endCol: 2,
		};

		const corridor: Corridor = createCorridor(room1, room2);
		expect(corridor).toStrictEqual([
			{ row: 2, col: 1 },
			{ row: 3, col: 1 },
		]);
	});
});
