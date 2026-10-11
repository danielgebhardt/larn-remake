// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import * as DungeonRun from "../domain/dungeon/DungeonRun";
import { DEFAULT_RUN_CONFIGURATION } from "../domain/dungeon/RunConfiguration";
import { createAttackRolls } from "../domain/game/CombatRandomness";

const context = {
	seed: 123,
	floorNumber: 2,
	turn: 5,
	attackerId: "player",
	targetId: "2:1",
};
const result = () => {
	const rolls = createAttackRolls(context);
	return { hit: rolls.d20(), damage: rolls.damage(2, 4) };
};
describe("Independently seeded attack rolls", () => {
	it("repeats the same attack without global randomness or mutable roll state", () => {
		const globalRandom = vi.spyOn(Math, "random").mockImplementation(() => {
			throw new Error("Global random used");
		});
		try {
			expect(result()).toEqual(result());
			const rolls = createAttackRolls(context);
			expect(rolls.d20()).toBe(rolls.d20());
		} finally {
			globalRandom.mockRestore();
		}
	});
	it("is independent of terrain generation and the order hit/damage are requested", () => {
		const expected = result();
		DungeonRun.generateDungeonRun(123, 5, DEFAULT_RUN_CONFIGURATION);
		const rolls = createAttackRolls(context);
		expect(rolls.damage(2, 4)).toBe(expected.damage);
		expect(rolls.d20()).toBe(expected.hit);
	});
	it("separates actors, targets, turns, floors, and hit/damage purposes", () => {
		const hash = vi.spyOn(DungeonRun, "hashStringToUint32");
		try {
			for (const next of [
				context,
				{ ...context, attackerId: "2:2" },
				{ ...context, targetId: "2:2" },
				{ ...context, turn: 6 },
				{ ...context, floorNumber: 3 },
			]) {
				const rolls = createAttackRolls(next);
				rolls.d20();
				rolls.damage(2, 4);
			}
			expect(new Set(hash.mock.calls.map(([key]) => key)).size).toBe(10);
		} finally {
			hash.mockRestore();
		}
	});
	it("produces inclusive bounded rolls, including a single-value damage range", () => {
		for (let turn = 1; turn <= 20; turn++) {
			const rolls = createAttackRolls({ ...context, turn });
			expect(rolls.d20()).toBeGreaterThanOrEqual(1);
			expect(rolls.d20()).toBeLessThanOrEqual(20);
			expect(rolls.damage(2, 4)).toBeGreaterThanOrEqual(2);
			expect(rolls.damage(2, 4)).toBeLessThanOrEqual(4);
			expect(rolls.damage(3, 3)).toBe(3);
		}
	});
});
