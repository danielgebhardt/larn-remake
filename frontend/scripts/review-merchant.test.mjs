// @vitest-environment node
import { expect, it } from "vitest";
import { merchantGoldBudget } from "./merchant-budget.mjs";

it("separates ordinary generated income from optional elites and reports cumulative checkpoint budgets", () => {
	const state = {
		run: { seed: 123, floors: Array(20) },
		monsters: [
			{ id: "1:1", floorNumber: 1, kind: "goblin" },
			{ id: "5:1", floorNumber: 5, kind: "orc" },
			{ id: "8:20001", floorNumber: 8, kind: "iron-champion" },
			{ id: "10:1", floorNumber: 10, kind: "troll" },
		],
		objects: [
			{ id: "coin", kind: "gold", floorNumber: 5, activated: false },
			{ id: "spent", kind: "gold", floorNumber: 1, activated: true },
			{ id: "chest", kind: "chest", floorNumber: 1, activated: false },
		],
	};
	expect(
		merchantGoldBudget(
			state,
			() => 100,
			{ "healing-potion": { price: 150 } },
			[5, 10, 15],
		),
	).toEqual({
		ordinaryGoldPotential: 400,
		stockClearanceCost: 1500,
		checkpoints: [
			{
				floor: 5,
				ordinaryGoldPotential: 300,
				allInBottles: { "healing-potion": 2 },
			},
			{
				floor: 10,
				ordinaryGoldPotential: 400,
				allInBottles: { "healing-potion": 2 },
			},
			{
				floor: 15,
				ordinaryGoldPotential: 400,
				allInBottles: { "healing-potion": 2 },
			},
		],
	});
});
