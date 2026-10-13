// @vitest-environment node
import { describe, expect, it } from "vitest";
import { mixedEncounter } from "../../src/__tests/TacticalReplayTestHelpers";
import { rewardBudget } from "../reward-budget.mjs";

describe("Generated supply budgets", () => {
	it("separates floor loot, seeded drops, chests and merchant stock", () => {
		const base = mixedEncounter();
		const state = {
			...base,
			monsters: [base.monsters[0]],
			objects: [
				{ id: "chest", kind: "chest", activated: false, floorNumber: 4 },
			],
			floorItems: [
				{
					item: { id: "found", kind: "greater-healing-potion" },
					floorNumber: 4,
				},
				{ item: { id: "book", kind: "book-sleep" }, floorNumber: 4 },
			],
		};
		const report = rewardBudget(
			state,
			(_seed, monster) => ({
				item: { kind: "mana-potion" },
				floorNumber: monster.floorNumber,
			}),
			(_seed, chest) => ({
				item: { kind: "antidote" },
				floorNumber: chest.floorNumber,
			}),
		);
		const floor = report.floors.find((entry) => entry.floor === 4);
		expect(floor.supplies).toMatchObject({
			"greater-healing-potion": 1,
			"mana-potion": 1,
			antidote: 1,
		});
		expect(floor.restoration).toEqual({ health: 15, mana: 5 });
		expect(report.sources).toEqual({ found: 1, drop: 1, chest: 1 });
		expect(report.merchant).toMatchObject({
			bottles: 40,
			restoration: { health: 200, mana: 170 },
		});
	});
	it("does not count dead actors, opened chests, elite or return rewards as ordinary supplies", () => {
		const base = mixedEncounter();
		const state = {
			...base,
			floorItems: [],
			objects: [],
			monsters: [
				{ ...base.monsters[0], health: 0 },
				{ ...base.monsters[0], id: "4:10001" },
				{ ...base.monsters[0], kind: "iron-champion", id: "4:20001" },
			],
		};
		expect(
			rewardBudget(
				state,
				() => {
					throw Error("must not generate excluded loot");
				},
				() => null,
			).sources,
		).toEqual({ found: 0, drop: 0, chest: 0 });
	});
});
