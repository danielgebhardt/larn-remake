// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { attackProfile, resolveMeleeAttack } from "../domain/game/MeleeRules";

describe("Bounded melee outcomes", () => {
	it.each([
		[3, false],
		[4, true],
		[20, true],
	] as const)("player roll %i yields hit=%s", (roll, hit) => {
		const damage = vi.fn(() => 3);
		const result = resolveMeleeAttack(attackProfile(3, 4), {
			d20: () => roll,
			damage,
		});
		expect(result.hit).toBe(hit);
		expect(result.damage).toBe(hit ? 3 : 0);
		expect(damage).toHaveBeenCalledTimes(hit ? 1 : 0);
	});
	it.each([
		[4, false],
		[5, true],
	] as const)("monster roll %i yields hit=%s", (roll, hit) =>
		expect(
			resolveMeleeAttack(attackProfile(4, 5), {
				d20: () => roll,
				damage: () => 4,
			}).hit,
		).toBe(hit),
	);
	it("bounds base and equipped nominal damage without applying bonuses twice", () => {
		expect(attackProfile(1, 4)).toEqual({
			hitThreshold: 4,
			minDamage: 1,
			maxDamage: 2,
		});
		expect(attackProfile(3, 4)).toEqual({
			hitThreshold: 4,
			minDamage: 2,
			maxDamage: 4,
		});
	});
	it.each([
		[2, 0, 2],
		[4, 1, 3],
		[2, 20, 1],
	])("resolves raw %i damage with %i armor as %i", (raw, armor, expected) =>
		expect(
			resolveMeleeAttack(
				attackProfile(3, 4),
				{ d20: () => 20, damage: () => raw },
				armor,
			).damage,
		).toBe(expected),
	);
	it("allows a one-value damage range", () =>
		expect(
			resolveMeleeAttack(
				{ hitThreshold: 4, minDamage: 2, maxDamage: 2 },
				{ d20: () => 4, damage: () => 2 },
			).damage,
		).toBe(2));
	it.each([
		[0, 4],
		[2, 0],
		[2, 21],
		[2.5, 4],
	])(
		"rejects invalid nominal damage %s or hit threshold %s",
		(damage, threshold) =>
			expect(() => attackProfile(damage, threshold)).toThrow(RangeError),
	);
	it.each([0, 21, 1.5, NaN])("rejects invalid D20 rolls %s", (roll) =>
		expect(() =>
			resolveMeleeAttack(attackProfile(2, 4), {
				d20: () => roll,
				damage: () => 2,
			}),
		).toThrow(RangeError),
	);
	it("rejects damage outside its inclusive range and negative armor", () => {
		expect(() =>
			resolveMeleeAttack(attackProfile(2, 4), {
				d20: () => 20,
				damage: () => 4,
			}),
		).toThrow(RangeError);
		expect(() =>
			resolveMeleeAttack(
				attackProfile(2, 4),
				{ d20: () => 20, damage: () => 2 },
				-1,
			),
		).toThrow(RangeError);
	});
});
