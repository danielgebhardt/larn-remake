// @vitest-environment node
import { describe, expect, it } from "vitest";
import { mixedEncounter } from "../../src/__tests/TacticalReplayTestHelpers";
import { experienceBudget } from "../experience-budget.mjs";

describe("Ordinary experience potential", () => {
	it("counts depth cumulatively and excludes optional elites and return waves", () => {
		const state = mixedEncounter();
		const report = experienceBudget({
			...state,
			monsters: [
				{ ...state.monsters[0], kind: "goblin", floorNumber: 1, id: "1:1" },
				{ ...state.monsters[0], kind: "orc", floorNumber: 4, id: "4:1" },
				{
					...state.monsters[0],
					kind: "iron-champion",
					floorNumber: 4,
					id: "4:20001",
				},
				{ ...state.monsters[0], floorNumber: 4, id: "4:10001" },
			],
		});
		expect(report[0]).toMatchObject({ floor: 1, experience: 5, level: 1 });
		expect(report[3]).toMatchObject({
			floor: 4,
			experience: 15,
			level: 2,
			toNextLevel: 15,
		});
	});
	it("does not confuse unearned rewards with current character experience", () => {
		const state = {
			...mixedEncounter(),
			progression: { experience: 3700 },
			monsters: [],
		};
		expect(
			experienceBudget(state).every(
				(floor) => floor.level === 1 && floor.experience === 0,
			),
		).toBe(true);
	});
});
