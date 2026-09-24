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
			{ row: 1, col: 1 },
			{ row: 1, col: 2 },
			{ row: 1, col: 3 },
			{ row: 1, col: 4 },
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
			{ row: 1, col: 1 },
			{ row: 2, col: 1 },
			{ row: 3, col: 1 },
			{ row: 4, col: 1 },
		]);
	});

	it("should create a horizontal corridor when the second room is left of the first room", () => {
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

		const corridor: Corridor = createCorridor(room2, room1);
		expect(corridor).toStrictEqual([
			{ row: 1, col: 4 },
			{ row: 1, col: 3 },
			{ row: 1, col: 2 },
			{ row: 1, col: 1 },
		]);
	});

	it("should create a vertical corridor when the second room is above the first room", () => {
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

		const corridor: Corridor = createCorridor(room2, room1);
		expect(corridor).toStrictEqual([
			{ row: 4, col: 1 },
			{ row: 3, col: 1 },
			{ row: 2, col: 1 },
			{ row: 1, col: 1 },
		]);
	});

	it("should create a corridor with one right-angle bend between offset rooms", () => {
		const room1: Room = {
			startRow: 1,
			endRow: 2,
			startCol: 1,
			endCol: 2,
		};

		const room2: Room = {
			startRow: 4,
			endRow: 5,
			startCol: 4,
			endCol: 5,
		};

		const corridor: Corridor = createCorridor(room1, room2);

		expect(corridor).toStrictEqual([
			{ row: 1, col: 1 },
			{ row: 1, col: 2 },
			{ row: 1, col: 3 },
			{ row: 1, col: 4 },
			{ row: 2, col: 4 },
			{ row: 3, col: 4 },
			{ row: 4, col: 4 },
		]);
	});

	it("should include both room endpoints", () => {
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
		expect(corridor).toContainEqual({ row: 1, col: 1 });
		expect(corridor).toContainEqual({ row: 1, col: 4 });
	});

	it("should produce only cardinally adjacent consecutive coordinates (no diagonal)", () => {
		const room1: Room = {
			startRow: 5,
			endRow: 6,
			startCol: 5,
			endCol: 6,
		};

		const room2: Room = {
			startRow: 1,
			endRow: 2,
			startCol: 1,
			endCol: 2,
		};

		const corridor = createCorridor(room1, room2);

		for (let index = 1; index < corridor.length; index++) {
			const previous = corridor[index - 1];
			const current = corridor[index];

			const distance =
				Math.abs(current.row - previous.row) +
				Math.abs(current.col - previous.col);

			expect(distance).toBe(1);
		}
	});

	it("should not modify the rooms when creating a corridor", () => {
		const room1: Room = {
			startRow: 1,
			endRow: 2,
			startCol: 1,
			endCol: 2,
		};

		const room2: Room = {
			startRow: 4,
			endRow: 5,
			startCol: 4,
			endCol: 5,
		};

		const originalRoom1 = structuredClone(room1);
		const originalRoom2 = structuredClone(room2);

		createCorridor(room1, room2);

		expect(room1).toStrictEqual(originalRoom1);
		expect(room2).toStrictEqual(originalRoom2);
	});
});
