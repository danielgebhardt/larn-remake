// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
	eligibleMonsterKinds,
	MONSTER_DEFINITIONS,
	selectMonsterKind,
	validateMonsterDefinition,
} from "../domain/monsters/Monster";

describe("Floor-aware monster catalog", () => {
	it("defines the brute's windup profile but leaves seeded rollout disabled", () => {
		expect(MONSTER_DEFINITIONS["dungeon-brute"]).toMatchObject({
			maxHealth: 10,
			attackDamage: 5,
			experienceReward: 12,
			detectionRadius: 6,
			preparesAttack: true,
			minFloor: 4,
			maxFloor: 20,
			spawnWeight: 1,
			spawnEnabled: false,
		});
		for (let floor = 1; floor <= 20; floor++)
			expect(eligibleMonsterKinds(floor)).not.toContain("dungeon-brute");
	});
	it("defines the provisional archer profile without enabling seeded encounters yet", () => {
		expect(MONSTER_DEFINITIONS["goblin-archer"]).toMatchObject({
			maxHealth: 5,
			attackDamage: 2,
			rangedAttackRange: 4,
			detectionRadius: 6,
			experienceReward: 6,
			minFloor: 2,
			maxFloor: 20,
			spawnWeight: 1,
			spawnEnabled: false,
		});
		for (let floor = 1; floor <= 20; floor++)
			expect(eligibleMonsterKinds(floor)).not.toContain("goblin-archer");
	});
	it("selects eligible kinds by relative weight, with inclusive floor boundaries", () => {
		expect(selectMonsterKind(1, () => 0)).toBe("goblin");
		expect(selectMonsterKind(1, () => 0.6)).toBe("giant-rat");
		expect(selectMonsterKind(3, () => 0.99)).toBe("orc");
		expect(selectMonsterKind(20, () => 0.99)).toBe("orc");
		expect(selectMonsterKind(21, () => 0)).toBeUndefined();
	});

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
		{ rangedAttackRange: 1 },
		{ rangedAttackRange: 2.5 },
		{ rangedAttackRange: 4, preparesAttack: true },
	])("rejects unusable definitions: %j", (overrides) => {
		expect(() =>
			validateMonsterDefinition({
				...MONSTER_DEFINITIONS.goblin,
				...overrides,
			}),
		).toThrow(RangeError);
	});
});
