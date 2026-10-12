// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
	eligibleMonsterKinds,
	MONSTER_DEFINITIONS,
	selectMonsterKind,
	validateMonsterDefinition,
} from "../domain/monsters/Monster";

describe("Floor-aware monster catalog", () => {
	it("defines the brute's floor-eligible windup profile", () => {
		expect(MONSTER_DEFINITIONS["dungeon-brute"]).toMatchObject({
			maxHealth: 10,
			attackDamage: 5,
			experienceReward: 12,
			detectionRadius: 6,
			preparesAttack: true,
			minFloor: 4,
			maxFloor: 12,
			spawnWeight: 1,
		});
	});
	it("defines the floor-eligible archer profile", () => {
		expect(MONSTER_DEFINITIONS["goblin-archer"]).toMatchObject({
			maxHealth: 5,
			attackDamage: 2,
			rangedAttackRange: 4,
			detectionRadius: 6,
			experienceReward: 6,
			minFloor: 2,
			maxFloor: 10,
			spawnWeight: 1,
		});
	});
	it("selects eligible kinds by relative weight, with inclusive floor boundaries", () => {
		expect(selectMonsterKind(1, () => 0)).toBe("goblin");
		expect(selectMonsterKind(1, () => 0.6)).toBe("giant-rat");
		for (const floor of [2, 3, 20]) {
			const kinds = eligibleMonsterKinds(floor);
			expect(selectMonsterKind(floor, () => 0)).toBe(kinds[0]);
			expect(selectMonsterKind(floor, () => 1 - Number.EPSILON)).toBe(
				kinds.at(-1),
			);
		}
		expect(selectMonsterKind(21, () => 0)).toBeUndefined();
	});

	it.each([
		[1, ["goblin", "giant-rat"]],
		[2, ["goblin", "giant-rat", "goblin-archer"]],
		[3, ["goblin", "giant-rat", "orc", "goblin-archer"]],
		[4, ["goblin", "giant-rat", "orc", "goblin-archer", "dungeon-brute"]],
		[5, ["goblin", "orc", "goblin-archer", "dungeon-brute"]],
		[
			20,
			[
				"stone-golem",
				"wraith",
				"wyvern",
				"frost-giant",
				"necromancer",
				"demon-warden",
			],
		],
		[21, []],
	] as const)("offers the eligible monsters on floor %i", (floor, kinds) => {
		if (kinds.length === 0) expect(eligibleMonsterKinds(floor)).toEqual([]);
		else
			expect(eligibleMonsterKinds(floor)).toEqual(
				expect.arrayContaining([...kinds]),
			);
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
