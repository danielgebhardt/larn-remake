// @vitest-environment node
import { describe, expect, it } from "vitest";
import { selectWeighted } from "../domain/content/WeightedSelection";

describe("Relative weighted content selection", () => {
	const pool = [
		{ value: "basic", weight: 3 },
		{ value: "upgrade", weight: 1 },
	];
	it.each([
		[0, "basic"],
		[0.749, "basic"],
		[0.75, "upgrade"],
		[0.999, "upgrade"],
	] as const)("maps roll %s to %s", (roll, value) =>
		expect(selectWeighted(pool, () => roll)).toBe(value),
	);
	it("returns no selection from an empty eligible pool without rolling", () =>
		expect(
			selectWeighted([], () => {
				throw new Error("No roll needed");
			}),
		).toBeUndefined());
	it.each([-1, 1, NaN, Infinity])(
		"rejects an invalid random value %s",
		(roll) =>
			expect(() => selectWeighted(pool, () => roll)).toThrow(RangeError),
	);
	it.each([0, -1, Infinity, NaN])("rejects an invalid weight %s", (weight) =>
		expect(() => selectWeighted([{ value: "item", weight }], () => 0)).toThrow(
			RangeError,
		),
	);
});
