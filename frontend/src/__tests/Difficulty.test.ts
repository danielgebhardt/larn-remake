// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createGameState } from "../domain/game/GameState";
import { attackProfile, resolveMeleeAttack } from "../domain/game/MeleeRules";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

describe("Adventure difficulty", () => {
	it("defaults to Normal and changes enemy health without changing seeded content", () => {
		const run = createCorridorEncounter();
		const normal = createGameState(run);
		const easier = createGameState(run, 0.75);
		const harder = createGameState(run, 1.25);
		expect(normal.difficulty).toBe(1);
		expect(easier.difficulty).toBe(0.75);
		expect(harder.difficulty).toBe(1.25);
		expect(normal.monsters.length).toBeGreaterThan(0);
		expect(normal.monsters.every((actor) => actor.kind === "goblin")).toBe(
			true,
		);
		expect(normal.monsters.map((actor) => actor.health)).toEqual(
			normal.monsters.map(() => 4),
		);
		expect(easier.monsters.map((actor) => actor.health)).toEqual(
			normal.monsters.map(() => 3),
		);
		expect(harder.monsters.map((actor) => actor.health)).toEqual(
			normal.monsters.map(() => 5),
		);
		const identities = (state: typeof normal) =>
			state.monsters.map(({ health: _health, ...actor }) => actor);
		expect(identities(easier)).toEqual(identities(normal));
		expect(identities(harder)).toEqual(identities(normal));
		expect(easier.floorItems).toEqual(normal.floorItems);
		expect(harder.objects).toEqual(normal.objects);
		expect(harder.player).toEqual(normal.player);
	});
	it.each([0, -1, 0.5, 2, Number.NaN, Number.POSITIVE_INFINITY])(
		"rejects unsupported difficulty %s",
		(difficulty) => {
			expect(() =>
				createGameState(createCorridorEncounter(), difficulty),
			).toThrow(RangeError);
		},
	);
	it.each([
		[0.75, 4],
		[1, 6],
		[1.25, 8],
	] as const)(
		"scales raw damage by %s before subtracting armor",
		(difficulty, damage) => {
			const rolls = { d20: () => 20, damage: () => 8 };
			expect(
				resolveMeleeAttack(attackProfile(8, 5), rolls, 2, difficulty),
			).toEqual({ hit: true, damage });
		},
	);
	it("preserves misses, tiny hits and rounding under either non-normal preset", () => {
		const profile = attackProfile(1, 5);
		for (const difficulty of [0.75, 1.25] as const) {
			expect(
				resolveMeleeAttack(
					profile,
					{
						d20: () => 1,
						damage: () => {
							throw new Error("A miss must not roll damage");
						},
					},
					0,
					difficulty,
				),
			).toEqual({ hit: false, damage: 0 });
			expect(
				resolveMeleeAttack(
					profile,
					{ d20: () => 20, damage: () => 1 },
					10,
					difficulty,
				),
			).toEqual({ hit: true, damage: 1 });
		}
	});
});
