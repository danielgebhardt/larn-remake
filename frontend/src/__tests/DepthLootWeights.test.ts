// @vitest-environment node
import { describe, expect, it } from "vitest";
import { lootWeights } from "../domain/items/LootWeights";

describe("Depth-sensitive equipment weights", () => {
	it("prefers current plain gear while preserving the total equipment and potion bands", () => {
		const base = lootWeights(8, "found", {}, false);
		const tuned = lootWeights(8, "found");
		const weight = (entries: typeof base, kind: string) =>
			entries.find((entry) => entry.value === kind)?.weight ?? 0;
		expect(weight(tuned, "iron-sword")).toBeLessThan(
			weight(base, "iron-sword"),
		);
		expect(weight(tuned, "battle-axe")).toBeGreaterThan(
			weight(base, "battle-axe"),
		);
		expect(weight(tuned, "greater-healing-potion")).toBe(
			weight(base, "greater-healing-potion"),
		);
		expect(tuned.reduce((sum, entry) => sum + entry.weight, 0)).toBeCloseTo(
			base.reduce((sum, entry) => sum + entry.weight, 0),
		);
	});
	it("retains rings, stat tradeoffs, preferences and all eligible alternatives", () => {
		const base = lootWeights(8, "drop", { "iron-sword": 2 }, false);
		const tuned = lootWeights(8, "drop", { "iron-sword": 2 });
		for (const kind of ["scholar-robe", "ring-strength", "ring-intelligence"])
			expect(tuned.find((entry) => entry.value === kind)).toEqual(
				base.find((entry) => entry.value === kind),
			);
		expect(tuned.map((entry) => entry.value)).toEqual(
			base.map((entry) => entry.value),
		);
		expect(tuned.every((entry) => entry.weight > 0)).toBe(true);
		expect(lootWeights(21, "found")).toEqual([]);
	});
	it("leaves a floor with no superior same-slot equipment unchanged", () => {
		expect(lootWeights(1, "found")).toEqual(lootWeights(1, "found", {}, false));
	});
});
