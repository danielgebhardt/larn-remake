import { describe, expect, it } from "vitest";
import { connectDungeonFloors, generateDungeonRun } from "../DungeonRun";
import { FLOOR, generateDungeon } from "../LayoutTiles";
import { createRoom } from "../Room";
import { MAX_SEED } from "../Seed";

describe("Room proportions", () => {
	it("applies configured room sizing to every generated room", () => {
		const dungeon = generateDungeon(
			{
				rows: 40,
				cols: 40,
				minPartitionSize: 10,
				roomPadding: 1,
				minRoomSize: 4,
				maxRoomAspectRatio: 2,
			},
			123,
		);
		for (const room of dungeon.rooms) {
			const height = room.endRow - room.startRow + 1;
			const width = room.endCol - room.startCol + 1;
			expect(Math.min(height, width)).toBeGreaterThanOrEqual(4);
			expect(
				Math.max(height, width) / Math.min(height, width),
			).toBeLessThanOrEqual(2);
		}
	});
	it.each([
		{ minRoomSize: 0, maxRoomAspectRatio: 3 },
		{ minRoomSize: 1.5, maxRoomAspectRatio: 3 },
		{ minRoomSize: 3, maxRoomAspectRatio: 0.5 },
		{ minRoomSize: 3, maxRoomAspectRatio: Number.POSITIVE_INFINITY },
	])("rejects invalid room rules: %o", (rules) => {
		expect(() =>
			createRoom(
				{ startRow: 0, endRow: 19, startCol: 0, endCol: 19 },
				1,
				() => 0,
				rules,
			),
		).toThrow(RangeError);
	});
	it("fits a constrained interior when configured size and ratio cannot both reach the minimum", () => {
		const room = createRoom(
			{ startRow: 0, endRow: 21, startCol: 0, endCol: 2 },
			1,
			() => 0,
			{ minRoomSize: 5, maxRoomAspectRatio: 2 },
		);
		expect(room).toEqual({ startRow: 1, endRow: 2, startCol: 1, endCol: 1 });
	});
	it.each([
		[0, 0],
		[0, 0.999999],
		[0.999999, 0],
		[0.999999, 0.999999],
		[0.5, 0.5],
	])(
		"keeps room dimensions usable with random choices %s and %s",
		(heightChoice, widthChoice) => {
			for (const [height, width] of [
				[8, 30],
				[30, 8],
				[3, 3],
			]) {
				const region = {
					startRow: 10,
					endRow: 10 + height + 1,
					startCol: 20,
					endCol: 20 + width + 1,
				};
				const choices = [heightChoice, widthChoice, 0.999999, 0.999999];
				const room = createRoom(region, 1, () => choices.shift() ?? 0);
				const h = room.endRow - room.startRow + 1,
					w = room.endCol - room.startCol + 1;
				expect(h).toBeGreaterThanOrEqual(3);
				expect(w).toBeGreaterThanOrEqual(3);
				expect(Math.max(h, w) / Math.min(h, w)).toBeLessThanOrEqual(3);
				expect(room.startRow).toBeGreaterThanOrEqual(11);
				expect(room.endRow).toBeLessThanOrEqual(region.endRow - 1);
				expect(room.startCol).toBeGreaterThanOrEqual(21);
				expect(room.endCol).toBeLessThanOrEqual(region.endCol - 1);
			}
		},
	);

	it.each([
		[1, 20],
		[20, 1],
		[2, 20],
		[20, 2],
		[1, 1],
	])(
		"fits constrained %s by %s interiors deterministically without excessive elongation",
		(height, width) => {
			const region = {
				startRow: 0,
				endRow: height + 1,
				startCol: 0,
				endCol: width + 1,
			};
			for (const random of [undefined, () => 0, () => 0.999999]) {
				const room = createRoom(region, 1, random);
				expect(createRoom(region, 1, random)).toEqual(room);
				const h = room.endRow - room.startRow + 1,
					w = room.endCol - room.startCol + 1;
				expect(h).toBeGreaterThanOrEqual(Math.min(3, height));
				expect(w).toBeGreaterThanOrEqual(Math.min(3, width));
				expect(Math.max(h, w) / Math.min(h, w)).toBeLessThanOrEqual(3);
				expect(room.startRow).toBeGreaterThanOrEqual(1);
				expect(room.endRow).toBeLessThanOrEqual(height);
				expect(room.startCol).toBeGreaterThanOrEqual(1);
				expect(room.endCol).toBeLessThanOrEqual(width);
			}
		},
	);

	it.each([
		[30, 100, 3],
		[40, 40, 3],
		[10, 10, 1],
		[10, 10, 3],
		[10, 100, 3],
		[100, 10, 3],
		[5, 5, 1],
		[5, 5, 3],
		[5, 100, 3],
		[100, 5, 3],
		[100, 100, 3],
	])(
		"keeps %s by %s runs with %s floors repeatable and connected",
		(rows, cols, floors) => {
			for (const seed of [0, 123, MAX_SEED]) {
				const config = { rows, cols, minPartitionSize: 8, roomPadding: 1 };
				const run = connectDungeonFloors(
					generateDungeonRun(seed, floors, config),
				);
				expect(
					connectDungeonFloors(generateDungeonRun(seed, floors, config)),
				).toEqual(run);
				for (const floor of run.floors) {
					for (const room of floor.rooms) {
						const h = room.endRow - room.startRow + 1,
							w = room.endCol - room.startCol + 1;
						expect(Math.min(h, w)).toBeGreaterThanOrEqual(3);
						expect(Math.max(h, w) / Math.min(h, w)).toBeLessThanOrEqual(3);
					}
					const start = floor.rooms[0];
					const queue = [{ row: start.startRow, col: start.startCol }];
					const visited = new Set([`${start.startRow},${start.startCol}`]);
					for (let i = 0; i < queue.length; i++) {
						const { row, col } = queue[i];
						for (const [dr, dc] of [
							[0, 1],
							[1, 0],
							[0, -1],
							[-1, 0],
						]) {
							const r = row + dr,
								c = col + dc,
								key = `${r},${c}`;
							if (floor.terrain[r]?.[c] === FLOOR && !visited.has(key)) {
								visited.add(key);
								queue.push({ row: r, col: c });
							}
						}
					}
					expect(visited.size).toBe(
						floor.terrain.flat().filter((tile) => tile === FLOOR).length,
					);
					for (const [link, reciprocalKey] of [
						[floor.downStair, "upStair"],
						[floor.upStair, "downStair"],
					] as const) {
						if (!link) continue;
						expect(
							visited.has(`${link.coordinate.row},${link.coordinate.col}`),
						).toBe(true);
						const reciprocal =
							run.floors[link.destinationFloor - 1][reciprocalKey];
						expect(reciprocal?.destinationFloor).toBe(floor.floorNumber);
						expect(reciprocal?.coordinate).toEqual(link.arrivalCoordinate);
						expect(reciprocal?.arrivalCoordinate).toEqual(link.coordinate);
					}
					if (floor.upStair && floor.downStair)
						expect(floor.upStair.coordinate).not.toEqual(
							floor.downStair.coordinate,
						);
				}
				expect(
					run.floors[0].terrain[run.playerCoordinate.row][
						run.playerCoordinate.col
					],
				).toBe(FLOOR);
			}
		},
	);
});
