// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
	eligibleMonsterKinds,
	MONSTER_DEFINITIONS,
	validateMonsterDefinition,
} from "../domain/monsters/Monster";

describe("Floor-aware monster catalog", () => {
	it.each([
		[1, ["goblin", "giant-rat"]],
		[3, ["goblin", "giant-rat", "orc"]],
		[4, ["goblin", "giant-rat", "orc"]],
		[5, ["goblin", "orc"]],
		[20, ["goblin", "orc"]],
	] as const)("offers the eligible monsters on floor %i", (floor, kinds) => {
		expect(eligibleMonsterKinds(floor)).toEqual(kinds);
	});
	it("gives stronger encounters enough damage for armor to matter", () => {
		expect(MONSTER_DEFINITIONS.orc.attackDamage).toBeGreaterThan(
			MONSTER_DEFINITIONS.goblin.attackDamage,
		);
		expect(MONSTER_DEFINITIONS.orc.maxHealth).toBeGreaterThan(
			MONSTER_DEFINITIONS.goblin.maxHealth,
		);
	});
	it.each([
		{ minFloor: 0 },
		{ maxFloor: 21 },
		{ minFloor: 5, maxFloor: 4 },
		{ spawnWeight: 0 },
		{ maxHealth: 0 },
		{ attackDamage: 1.5 },
		{ detectionRadius: -1 },
	])("rejects unusable definitions: %j", (overrides) => {
		expect(() =>
			validateMonsterDefinition({
				...MONSTER_DEFINITIONS.goblin,
				...overrides,
			}),
		).toThrow(RangeError);
	});
});
