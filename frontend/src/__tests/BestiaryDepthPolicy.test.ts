// @vitest-environment node
import { expect, it } from "vitest";
import { eligibleMonsterKinds } from "../domain/monsters/Monster";

it("early opponents leave the deep pool rather than dominating floor twenty", () => {
	const deep = eligibleMonsterKinds(20);
	for (const kind of [
		"goblin",
		"giant-rat",
		"orc",
		"goblin-archer",
		"dungeon-brute",
		"skeleton",
		"zombie",
		"wolf",
		"kobold-slinger",
		"spider",
	])
		expect(deep).not.toContain(kind);
	expect(deep).toEqual(
		expect.arrayContaining([
			"stone-golem",
			"wraith",
			"wyvern",
			"frost-giant",
			"necromancer",
			"demon-warden",
		]),
	);
});
it("keeps overlapping transitions between early and middle floor bands", () => {
	expect(eligibleMonsterKinds(5)).toContain("goblin");
	expect(eligibleMonsterKinds(6)).not.toContain("goblin");
	expect(eligibleMonsterKinds(10)).toContain("orc");
	expect(eligibleMonsterKinds(11)).not.toContain("orc");
	expect(eligibleMonsterKinds(12)).toContain("dungeon-brute");
	expect(eligibleMonsterKinds(13)).not.toContain("dungeon-brute");
});
