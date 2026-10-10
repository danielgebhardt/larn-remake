// @vitest-environment node

import { describe, expect, it } from "vitest";
import {
	type Region,
	recursivePartition,
	splitRegion,
} from "../domain/dungeon/Partitioning.ts";
import { createSeededRandom } from "../domain/dungeon/Seed.ts";
import { getRegionArea, getTerminalRegions } from "./testhelpers.ts";

describe("Seeded region splitting", () => {
	it("creates the earliest valid vertical split when random returns zero", () => {
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
			endCol: 1,
		};

		const expectedChild2: Region = {
			startRow: 0,
			endRow: 5,
			startCol: 2,
			endCol: 5,
		};

		const random = () => 0;

		const childRegions = splitRegion(testRegion, "vertical", 2, random);

		expect(childRegions?.[0]).toStrictEqual(expectedChild1);
		expect(childRegions?.[1]).toStrictEqual(expectedChild2);
	});

	it("creates the latest valid vertical split when random returns 0.99", () => {
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
			endCol: 3,
		};

		const expectedChild2: Region = {
			startRow: 0,
			endRow: 5,
			startCol: 4,
			endCol: 5,
		};

		const random = () => 0.99;

		const childRegions = splitRegion(testRegion, "vertical", 2, random);

		expect(childRegions?.[0]).toStrictEqual(expectedChild1);
		expect(childRegions?.[1]).toStrictEqual(expectedChild2);
	});

	it("creates an intermediate valid vertical split when random returns 0.5", () => {
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

		const random = () => 0.5;

		const childRegions = splitRegion(testRegion, "vertical", 2, random);

		expect(childRegions?.[0]).toStrictEqual(expectedChild1);
		expect(childRegions?.[1]).toStrictEqual(expectedChild2);
	});

	it("creates an intermediate valid vertical split on an offset region when random returns 0.5", () => {
		const testRegion: Region = {
			startRow: 2,
			endRow: 7,
			startCol: 2,
			endCol: 7,
		};

		const expectedChild1: Region = {
			startRow: 2,
			endRow: 7,
			startCol: 2,
			endCol: 4,
		};

		const expectedChild2: Region = {
			startRow: 2,
			endRow: 7,
			startCol: 5,
			endCol: 7,
		};

		const random = () => 0.5;

		const childRegions = splitRegion(testRegion, "vertical", 2, random);

		expect(childRegions?.[0]).toStrictEqual(expectedChild1);
		expect(childRegions?.[1]).toStrictEqual(expectedChild2);
	});

	it.each([0, 0.25, 0.5, 0.75, 0.99])(
		"creates the only valid vertical split on an offset region regardless of what the value of random returns",
		(value: number) => {
			const testRegion: Region = {
				startRow: 2,
				endRow: 7,
				startCol: 2,
				endCol: 7,
			};

			const expectedChild1: Region = {
				startRow: 2,
				endRow: 7,
				startCol: 2,
				endCol: 4,
			};

			const expectedChild2: Region = {
				startRow: 2,
				endRow: 7,
				startCol: 5,
				endCol: 7,
			};

			const random = () => value;

			const childRegions = splitRegion(testRegion, "vertical", 3, random);

			expect(childRegions?.[0]).toStrictEqual(expectedChild1);
			expect(childRegions?.[1]).toStrictEqual(expectedChild2);
		},
	);

	it("creates the earliest valid horizontal split when random returns zero", () => {
		const testRegion: Region = {
			startRow: 0,
			endRow: 5,
			startCol: 0,
			endCol: 5,
		};

		const expectedChild1: Region = {
			startRow: 0,
			endRow: 1,
			startCol: 0,
			endCol: 5,
		};

		const expectedChild2: Region = {
			startRow: 2,
			endRow: 5,
			startCol: 0,
			endCol: 5,
		};

		const random = () => 0;

		const childRegions = splitRegion(testRegion, "horizontal", 2, random);

		expect(childRegions?.[0]).toStrictEqual(expectedChild1);
		expect(childRegions?.[1]).toStrictEqual(expectedChild2);
	});

	it("creates the latest valid horizontal split when random returns 0.99", () => {
		const testRegion: Region = {
			startRow: 0,
			endRow: 5,
			startCol: 0,
			endCol: 5,
		};

		const expectedChild1: Region = {
			startRow: 0,
			endRow: 3,
			startCol: 0,
			endCol: 5,
		};

		const expectedChild2: Region = {
			startRow: 4,
			endRow: 5,
			startCol: 0,
			endCol: 5,
		};

		const random = () => 0.99;

		const childRegions = splitRegion(testRegion, "horizontal", 2, random);

		expect(childRegions?.[0]).toStrictEqual(expectedChild1);
		expect(childRegions?.[1]).toStrictEqual(expectedChild2);
	});

	it("creates an intermediate valid horizontal split when random returns 0.5", () => {
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

		const random = () => 0.5;

		const childRegions = splitRegion(testRegion, "horizontal", 2, random);

		expect(childRegions?.[0]).toStrictEqual(expectedChild1);
		expect(childRegions?.[1]).toStrictEqual(expectedChild2);
	});

	it("creates an intermediate valid horizontal split on an offset region when random returns 0.5", () => {
		const testRegion: Region = {
			startRow: 2,
			endRow: 7,
			startCol: 2,
			endCol: 7,
		};

		const expectedChild1: Region = {
			startRow: 2,
			endRow: 4,
			startCol: 2,
			endCol: 7,
		};

		const expectedChild2: Region = {
			startRow: 5,
			endRow: 7,
			startCol: 2,
			endCol: 7,
		};

		const random = () => 0.5;

		const childRegions = splitRegion(testRegion, "horizontal", 2, random);

		expect(childRegions?.[0]).toStrictEqual(expectedChild1);
		expect(childRegions?.[1]).toStrictEqual(expectedChild2);
	});

	it.each([0, 0.25, 0.5, 0.75, 0.99])(
		"creates the only valid horizontal split on an offset region regardless of what the value of random returns",
		(value: number) => {
			const testRegion: Region = {
				startRow: 2,
				endRow: 7,
				startCol: 2,
				endCol: 7,
			};

			const expectedChild1: Region = {
				startRow: 2,
				endRow: 4,
				startCol: 2,
				endCol: 7,
			};

			const expectedChild2: Region = {
				startRow: 5,
				endRow: 7,
				startCol: 2,
				endCol: 7,
			};

			const random = () => value;

			const childRegions = splitRegion(testRegion, "horizontal", 3, random);

			expect(childRegions?.[0]).toStrictEqual(expectedChild1);
			expect(childRegions?.[1]).toStrictEqual(expectedChild2);
		},
	);

	describe.each([
		{ label: "without a seed", seed: undefined },
		{ label: "with seed 0", seed: 0 },
		{ label: "with seed 1", seed: 1 },
		{ label: "with seed 123", seed: 123 },
		{ label: "with seed 999", seed: 999 },
	])("recursive partition invariants $label", ({ seed }) => {
		const rootRegion: Region = {
			startRow: 5,
			endRow: 16,
			startCol: 10,
			endCol: 29,
		};
		const minChildSize = 3;
		const random = seed === undefined ? undefined : createSeededRandom(seed);
		const partitionTree = recursivePartition(rootRegion, minChildSize, random);
		const terminalRegions = getTerminalRegions(partitionTree);

		it("keeps every terminal region within the root bounds", () => {
			for (const region of terminalRegions) {
				expect(region.startRow).toBeGreaterThanOrEqual(rootRegion.startRow);
				expect(region.endRow).toBeLessThanOrEqual(rootRegion.endRow);
				expect(region.startCol).toBeGreaterThanOrEqual(rootRegion.startCol);
				expect(region.endCol).toBeLessThanOrEqual(rootRegion.endCol);
			}
		});

		it("makes every terminal region satisfy the minimum dimensions", () => {
			for (const region of terminalRegions) {
				const rowCount = region.endRow - region.startRow + 1;
				const colCount = region.endCol - region.startCol + 1;

				expect(rowCount).toBeGreaterThanOrEqual(minChildSize);
				expect(colCount).toBeGreaterThanOrEqual(minChildSize);
			}
		});

		it("stops only when terminal regions cannot be split further", () => {
			for (const region of terminalRegions) {
				expect(splitRegion(region, "vertical", minChildSize)).toBeUndefined();
				expect(splitRegion(region, "horizontal", minChildSize)).toBeUndefined();
			}
		});

		it("produces terminal regions that do not overlap", () => {
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

		it("completely covers the root region", () => {
			const terminalArea = terminalRegions.reduce(
				(total, region) => total + getRegionArea(region),
				0,
			);

			expect(terminalArea).toBe(getRegionArea(rootRegion));
		});
	});
});
