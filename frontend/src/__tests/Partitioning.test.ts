// @vitest-environment node

import { describe, expect, it } from "vitest";
import { type Region, splitRegion } from "../domain/dungeon/Partitioning.ts";

describe("Region splitting", () => {
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
});
