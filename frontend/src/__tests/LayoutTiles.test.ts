import { describe, expect, it } from "vitest";
import {
	FLOOR,
	fixedDungeon,
	getDungeonCoordinateValue,
	MAX_SIZE,
	makeDungeon,
	type PartitionNode,
	type Region,
	recursivePartition,
	splitRegion,
	WALL,
} from "../LayoutTiles.ts";

const getTerminalRegions = (node: PartitionNode): Region[] => {
	if (!node.children) {
		return [node.region];
	}

	return node.children.flatMap(getTerminalRegions);
};

const getRegionArea = (region: Region): number => {
	const rowCount = region.endRow - region.startRow + 1;
	const colCount = region.endCol - region.startCol + 1;

	return rowCount * colCount;
};

describe("LayoutTiles Tests", () => {
	it("should return a # for WALL values in dungeon map", () => {
		expect(getDungeonCoordinateValue(0, 0, fixedDungeon)).toBe(WALL);
		expect(getDungeonCoordinateValue(1, 4, fixedDungeon)).toBe(WALL);
		expect(getDungeonCoordinateValue(2, 0, fixedDungeon)).toBe(WALL);
	});

	it("should return a . for FLOOR values in dungeon map", () => {
		expect(getDungeonCoordinateValue(1, 1, fixedDungeon)).toBe(FLOOR);
		expect(getDungeonCoordinateValue(2, 1, fixedDungeon)).toBe(FLOOR);
		expect(getDungeonCoordinateValue(3, 2, fixedDungeon)).toBe(FLOOR);
	});

	it("should return undefined for range outside of dungeon", () => {
		expect(getDungeonCoordinateValue(6, 6, fixedDungeon)).toBeUndefined();
		expect(getDungeonCoordinateValue(-1, 3, fixedDungeon)).toBeUndefined();
		expect(getDungeonCoordinateValue(3, -1, fixedDungeon)).toBeUndefined();
	});

	it("should expose the expected fixed dungeon layout", () => {
		expect(fixedDungeon).toEqual([
			[WALL, WALL, WALL, WALL, WALL],
			[WALL, FLOOR, FLOOR, FLOOR, WALL],
			[WALL, FLOOR, WALL, FLOOR, WALL],
			[WALL, FLOOR, FLOOR, FLOOR, WALL],
			[WALL, WALL, WALL, WALL, WALL],
		]);
	});

	it("should return undefined for custom size dungeon with < 1 row or < 1 col>", () => {
		expect(makeDungeon(0, 1)).toBeUndefined();
		expect(makeDungeon(-1, 1)).toBeUndefined();
		expect(makeDungeon(1, 0)).toBeUndefined();
		expect(makeDungeon(1, -1)).toBeUndefined();
	});

	it("should return undefined for custom size dungeon with dimensions greater than MAX_SIZE", () => {
		expect(makeDungeon(MAX_SIZE + 1, 1)).toBeUndefined();
		expect(makeDungeon(1, MAX_SIZE + 1)).toBeUndefined();
	});

	it("should return undefined for custom size dungeon with fractional numbers", () => {
		expect(makeDungeon(1.5, 1)).toBeUndefined();
		expect(makeDungeon(1, 1.3)).toBeUndefined();
	});

	it("should create a custom sized dungeon defaulted to all WALLS", () => {
		const newDungeon = makeDungeon(4, 7);

		expect(newDungeon).toHaveLength(4);
		expect(newDungeon?.[0]).toHaveLength(7);

		if (newDungeon) {
			for (let row = 0; row < 4; row++) {
				for (let col = 0; col < 7; col++) {
					expect(getDungeonCoordinateValue(col, row, newDungeon)).toBe(WALL);
				}
			}
		}
	});

	it("should allow coordinates to change independently", () => {
		const dungeon = makeDungeon(2, 2);

		expect(dungeon).toBeDefined();

		if (!dungeon) {
			throw new Error("Expected dungeon to be created");
		}

		dungeon[0][0] = FLOOR;

		expect(dungeon[0][0]).toBe(FLOOR);
		expect(dungeon[1][0]).toBe(WALL);
	});

	it("should split a square region into 2 equally sized child regions vertically", () => {
		const testRegion: Region = {
			startRow: 0,
			endRow: 5,
			startCol: 0,
			endCol: 5,
		};

		const expectedChild1: Region = {
			startRow: 0,
			endRow: 5,
			startCol: 0,
			endCol: 2,
		};

		const expectedChild2: Region = {
			startRow: 0,
			endRow: 5,
			startCol: 3,
			endCol: 5,
		};

		const childRegions = splitRegion(testRegion, "vertical", 2);

		expect(childRegions).toHaveLength(2);
		expect(childRegions?.[0]).toStrictEqual(expectedChild1);
		expect(childRegions?.[1]).toStrictEqual(expectedChild2);
	});

	it("should split a square region into 2 equally sized child regions horizontally", () => {
		const testRegion: Region = {
			startRow: 0,
			endRow: 5,
			startCol: 0,
			endCol: 5,
		};

		const expectedChild1: Region = {
			startRow: 0,
			endRow: 2,
			startCol: 0,
			endCol: 5,
		};

		const expectedChild2: Region = {
			startRow: 3,
			endRow: 5,
			startCol: 0,
			endCol: 5,
		};

		const childRegions = splitRegion(testRegion, "horizontal", 2);

		expect(childRegions).toHaveLength(2);
		expect(childRegions?.[0]).toStrictEqual(expectedChild1);
		expect(childRegions?.[1]).toStrictEqual(expectedChild2);
	});

	it("should return undefined if minChildSize is greater than region split size", () => {
		expect(
			splitRegion(
				{
					startRow: 0,
					endRow: 5,
					startCol: 0,
					endCol: 5,
				},
				"vertical",
				4,
			),
		).toBeUndefined();

		expect(
			splitRegion(
				{
					startRow: 0,
					endRow: 5,
					startCol: 0,
					endCol: 5,
				},
				"horizontal",
				4,
			),
		).toBeUndefined();
	});

	it("children regions should cover the entire parent region without gaps or overlaps when split horizontally", () => {
		const testRegion: Region = {
			startRow: 0,
			endRow: 5,
			startCol: 0,
			endCol: 5,
		};

		const childRegions = splitRegion(testRegion, "horizontal", 2);

		expect(childRegions).toHaveLength(2);

		if (childRegions) {
			expect(childRegions[0].startRow).toStrictEqual(testRegion.startRow);
			expect(childRegions[1].startRow).toStrictEqual(
				childRegions[0].endRow + 1,
			);

			expect(childRegions[0].endRow).toStrictEqual(
				childRegions[1].startRow - 1,
			);
			expect(childRegions[1].endRow).toStrictEqual(testRegion.endRow);

			expect(childRegions[0].startCol).toStrictEqual(testRegion.startCol);
			expect(childRegions[1].startCol).toStrictEqual(testRegion.startCol);

			expect(childRegions[0].endCol).toStrictEqual(testRegion.endCol);
			expect(childRegions[1].endCol).toStrictEqual(testRegion.endCol);
		}
	});

	it("children regions should cover the entire parent region without gaps or overlaps when split vertically", () => {
		const testRegion: Region = {
			startRow: 0,
			endRow: 5,
			startCol: 0,
			endCol: 5,
		};

		const childRegions = splitRegion(testRegion, "vertical", 2);

		expect(childRegions).toHaveLength(2);

		if (childRegions) {
			expect(childRegions[0].startCol).toStrictEqual(testRegion.startCol);
			expect(childRegions[1].startCol).toStrictEqual(
				childRegions[0].endCol + 1,
			);

			expect(childRegions[0].endCol).toStrictEqual(
				childRegions[1].startCol - 1,
			);
			expect(childRegions[1].endCol).toStrictEqual(testRegion.endCol);

			expect(childRegions[0].startRow).toStrictEqual(testRegion.startRow);
			expect(childRegions[1].startRow).toStrictEqual(testRegion.startRow);

			expect(childRegions[0].endRow).toStrictEqual(testRegion.endRow);
			expect(childRegions[1].endRow).toStrictEqual(testRegion.endRow);
		}
	});

	it("should split a rectangle region into 2 equally sized child regions vertically", () => {
		const testRegion: Region = {
			startRow: 0,
			endRow: 5,
			startCol: 0,
			endCol: 9,
		};

		const expectedChild1: Region = {
			startRow: 0,
			endRow: 5,
			startCol: 0,
			endCol: 4,
		};

		const expectedChild2: Region = {
			startRow: 0,
			endRow: 5,
			startCol: 5,
			endCol: 9,
		};

		const childRegions = splitRegion(testRegion, "vertical", 2);

		expect(childRegions).toHaveLength(2);
		expect(childRegions?.[0]).toStrictEqual(expectedChild1);
		expect(childRegions?.[1]).toStrictEqual(expectedChild2);
	});

	it("should split a rectangle region into 2 equally sized child regions horizontally", () => {
		const testRegion: Region = {
			startRow: 0,
			endRow: 9,
			startCol: 0,
			endCol: 5,
		};

		const expectedChild1: Region = {
			startRow: 0,
			endRow: 4,
			startCol: 0,
			endCol: 5,
		};

		const expectedChild2: Region = {
			startRow: 5,
			endRow: 9,
			startCol: 0,
			endCol: 5,
		};

		const childRegions = splitRegion(testRegion, "horizontal", 2);

		expect(childRegions).toHaveLength(2);
		expect(childRegions?.[0]).toStrictEqual(expectedChild1);
		expect(childRegions?.[1]).toStrictEqual(expectedChild2);
	});

	it("should correctly split a vertically offset region", () => {
		const region: Region = {
			startRow: 2,
			endRow: 7,
			startCol: 10,
			endCol: 19,
		};

		expect(splitRegion(region, "vertical", 2)).toStrictEqual([
			{
				startRow: 2,
				endRow: 7,
				startCol: 10,
				endCol: 14,
			},
			{
				startRow: 2,
				endRow: 7,
				startCol: 15,
				endCol: 19,
			},
		]);
	});

	it("should correctly split a horizontally offset region", () => {
		const region: Region = {
			startRow: 10,
			endRow: 19,
			startCol: 2,
			endCol: 7,
		};

		expect(splitRegion(region, "horizontal", 2)).toStrictEqual([
			{
				startRow: 10,
				endRow: 14,
				startCol: 2,
				endCol: 7,
			},
			{
				startRow: 15,
				endRow: 19,
				startCol: 2,
				endCol: 7,
			},
		]);
	});

	it("should split an odd-sized region without creating fractional coordinates", () => {
		const region: Region = {
			startRow: 0,
			endRow: 4,
			startCol: 10,
			endCol: 14,
		};

		expect(splitRegion(region, "vertical", 2)).toStrictEqual([
			{
				startRow: 0,
				endRow: 4,
				startCol: 10,
				endCol: 11,
			},
			{
				startRow: 0,
				endRow: 4,
				startCol: 12,
				endCol: 14,
			},
		]);
	});

	it("should reject a split when the non-split dimension is below the minimum", () => {
		const regionTooShortForVerticalSplit: Region = {
			startRow: 0,
			endRow: 0,
			startCol: 0,
			endCol: 5,
		};

		const regionTooNarrowForHorizontalSplit: Region = {
			startRow: 0,
			endRow: 5,
			startCol: 0,
			endCol: 0,
		};

		expect(
			splitRegion(regionTooShortForVerticalSplit, "vertical", 2),
		).toBeUndefined();

		expect(
			splitRegion(regionTooNarrowForHorizontalSplit, "horizontal", 2),
		).toBeUndefined();
	});

	it("should allow the non-split dimension to equal the minimum size", () => {
		const verticallySplitRegion: Region = {
			startRow: 0,
			endRow: 1, // Height 2
			startCol: 0,
			endCol: 5, // Width 6
		};

		const horizontallySplitRegion: Region = {
			startRow: 0,
			endRow: 5, // Height 6
			startCol: 0,
			endCol: 1, // Width 2
		};

		expect(splitRegion(verticallySplitRegion, "vertical", 2)).toBeDefined();
		expect(splitRegion(horizontallySplitRegion, "horizontal", 2)).toBeDefined();
	});

	it("when recursively partitioning the a region, it should return the region as a terminal partition when unable to split", () => {
		const regionTooSmall: Region = {
			startRow: 0,
			endRow: 2,
			startCol: 0,
			endCol: 2,
		};

		const minChildSize = 4;

		const partitions: PartitionNode = recursivePartition(
			regionTooSmall,
			minChildSize,
		);

		expect(partitions.region).toStrictEqual(regionTooSmall);
		expect(partitions.children).toBeUndefined();
	});

	it("when recursively partitioning the a region, it should return the the partitions with children", () => {
		const regionWithChildren: Region = {
			startRow: 0,
			endRow: 3,
			startCol: 0,
			endCol: 7,
		};

		const minChildSize = 4;

		const expectedChild1: PartitionNode = {
			region: {
				startRow: 0,
				endRow: 3,
				startCol: 0,
				endCol: 3,
			},
		};

		const expectedChild2: PartitionNode = {
			region: {
				startRow: 0,
				endRow: 3,
				startCol: 4,
				endCol: 7,
			},
		};

		const partitions: PartitionNode = recursivePartition(
			regionWithChildren,
			minChildSize,
		);

		expect(partitions.region).toStrictEqual(regionWithChildren);
		expect(partitions.children).toBeDefined();
		expect(partitions.children?.[0]).toStrictEqual(expectedChild1);
		expect(partitions.children?.[1]).toStrictEqual(expectedChild2);
	});

	it("should throw RangerError when minChildsize is 0 or negative numbers", async ({
		expect,
	}) => {
		const testRegion: Region = {
			startRow: 0,
			endRow: 3,
			startCol: 0,
			endCol: 7,
		};

		expect(() => recursivePartition(testRegion, 0)).toThrow(
			"minChildSize must be a positive integer",
		);
		expect(() => recursivePartition(testRegion, -1)).toThrow(
			"minChildSize must be a positive integer",
		);
	});

	it("should recursively partition a region through multiple levels", () => {
		const rootRegion: Region = {
			startRow: 0,
			endRow: 3,
			startCol: 0,
			endCol: 3,
		};

		const partitionTree = recursivePartition(rootRegion, 2);
		const terminalRegions = getTerminalRegions(partitionTree);

		expect(terminalRegions).toStrictEqual([
			{
				startRow: 0,
				endRow: 1,
				startCol: 0,
				endCol: 1,
			},
			{
				startRow: 2,
				endRow: 3,
				startCol: 0,
				endCol: 1,
			},
			{
				startRow: 0,
				endRow: 1,
				startCol: 2,
				endCol: 3,
			},
			{
				startRow: 2,
				endRow: 3,
				startCol: 2,
				endCol: 3,
			},
		]);
	});

	it("should initially split a tall region horizontally", () => {
		const tallRegion: Region = {
			startRow: 0,
			endRow: 7,
			startCol: 0,
			endCol: 3,
		};

		const partitionTree = recursivePartition(tallRegion, 4);

		expect(partitionTree.children?.[0].region).toStrictEqual({
			startRow: 0,
			endRow: 3,
			startCol: 0,
			endCol: 3,
		});

		expect(partitionTree.children?.[1].region).toStrictEqual({
			startRow: 4,
			endRow: 7,
			startCol: 0,
			endCol: 3,
		});
	});

	it("should produce repeatable partitions for the same inputs", () => {
		const rootRegion: Region = {
			startRow: 5,
			endRow: 16,
			startCol: 10,
			endCol: 29,
		};

		const firstResult = recursivePartition(rootRegion, 3);
		const secondResult = recursivePartition(rootRegion, 3);

		expect(firstResult).toStrictEqual(secondResult);
	});

	describe("recursive partition invariants", () => {
		const rootRegion: Region = {
			startRow: 5,
			endRow: 16,
			startCol: 10,
			endCol: 29,
		};

		const minChildSize = 3;
		const partitionTree = recursivePartition(rootRegion, minChildSize);
		const terminalRegions = getTerminalRegions(partitionTree);

		it("should keep every terminal region within the root bounds", () => {
			for (const region of terminalRegions) {
				expect(region.startRow).toBeGreaterThanOrEqual(rootRegion.startRow);
				expect(region.endRow).toBeLessThanOrEqual(rootRegion.endRow);
				expect(region.startCol).toBeGreaterThanOrEqual(rootRegion.startCol);
				expect(region.endCol).toBeLessThanOrEqual(rootRegion.endCol);
			}
		});

		it("should make every terminal region satisfy the minimum dimensions", () => {
			for (const region of terminalRegions) {
				const rowCount = region.endRow - region.startRow + 1;
				const colCount = region.endCol - region.startCol + 1;

				expect(rowCount).toBeGreaterThanOrEqual(minChildSize);
				expect(colCount).toBeGreaterThanOrEqual(minChildSize);
			}
		});

		it("should stop only when terminal regions cannot be split further", () => {
			for (const region of terminalRegions) {
				expect(splitRegion(region, "vertical", minChildSize)).toBeUndefined();

				expect(splitRegion(region, "horizontal", minChildSize)).toBeUndefined();
			}
		});

		it("should produce terminal regions that do not overlap", () => {
			const coveredCoordinates = new Set<string>();

			for (const region of terminalRegions) {
				for (let row = region.startRow; row <= region.endRow; row++) {
					for (let col = region.startCol; col <= region.endCol; col++) {
						const coordinate = `${row},${col}`;

						expect(coveredCoordinates.has(coordinate)).toBe(false);
						coveredCoordinates.add(coordinate);
					}
				}
			}
		});

		it("should completely cover the root region", () => {
			const terminalArea = terminalRegions.reduce(
				(total, region) => total + getRegionArea(region),
				0,
			);

			expect(terminalArea).toBe(getRegionArea(rootRegion));
		});
	});
});
