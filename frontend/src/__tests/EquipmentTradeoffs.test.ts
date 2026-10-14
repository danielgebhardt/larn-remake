// @vitest-environment node
import { expect, it } from "vitest";
import { createEquipment } from "../domain/items/Equipment";
import { compareEquipment } from "../domain/items/EquipmentComparison";
import { eligibleLootKinds } from "../domain/items/Item";

import { createComparisonContext } from "./EquipmentComparisonTestHelpers";

const item = (
	kind:
		| "scholar-robe"
		| "plate-armor"
		| "ring-strength"
		| "ring-intelligence"
		| "copper-ring",
) => ({ id: kind, kind });
it("labels losing armor for Intelligence as a tradeoff and explains both values", () => {
	const result = compareEquipment(
		item("scholar-robe"),
		createComparisonContext(createEquipment(null, null, item("plate-armor"))),
	);
	expect(result?.label).toBe("Tradeoff");
	expect(result).toMatchObject({
		before: { armor: 3, intelligence: 10, maxMana: 10 },
		after: { armor: 1, intelligence: 12, maxMana: 12 },
	});
});
it("compares a ring against either explicit slot, preserving the other ring", () => {
	const equipment = createEquipment(
		null,
		null,
		null,
		null,
		item("ring-strength"),
		null,
	);
	expect(
		compareEquipment(
			item("ring-intelligence"),
			createComparisonContext(equipment),
			"leftRing",
		)?.label,
	).toBe("Tradeoff");
	expect(
		compareEquipment(
			item("ring-intelligence"),
			createComparisonContext(equipment),
			"rightRing",
		)?.label,
	).toBe("Better");
	expect(
		compareEquipment(
			item("ring-intelligence"),
			createComparisonContext(equipment),
		)?.slot,
	).toBe("rightRing");
	expect(equipment.rightRing).toBeNull();
});
it("does not treat a ring as compatible with head armor", () =>
	expect(
		compareEquipment(item("copper-ring"), createComparisonContext(), "head"),
	).toBeNull());
it("removes obsolete basic equipment from deep found and dropped loot but keeps supplies", () => {
	for (const source of ["found", "drop"] as const) {
		const kinds = eligibleLootKinds(20, source);
		for (const kind of [
			"short-sword",
			"iron-sword",
			"wooden-shield",
			"leather-armor",
			"leather-cap",
			"chain-armor",
			"iron-helmet",
		])
			expect(kinds).not.toContain(kind);
		expect(kinds).toContain("healing-potion");
		expect(kinds).toContain("mana-potion");
		expect(kinds).toContain("star-forged-blade");
	}
});
