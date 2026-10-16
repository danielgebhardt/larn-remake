// @vitest-environment node
import { describe, expect, it } from "vitest";
import { deriveAttributes } from "../domain/game/Attributes";
import { createGameState, type GameState } from "../domain/game/GameState";
import {
	accuracyThresholds,
	attackProfile,
	deriveAccuracy,
	resolveMeleeAttack,
} from "../domain/game/MeleeRules";
import { resolvePlayerAction } from "../domain/game/PlayerActions";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

describe("Earned Dexterity and melee accuracy", () => {
	it.each([
		[10, 20],
		[14, 30],
		[20, 45],
		[21, 45],
		[22, 45],
		[23, 45],
		[24, 50],
		[26, 50],
		[28, 55],
		[30, 55],
		[32, 60],
		[34, 60],
		[36, 65],
		[60, 95],
	])(
		"gives Dexterity %i the approved %i percent evasion without changing player accuracy",
		(dexterity, evasion) => {
			const modifier = Math.floor((dexterity - 10) / 2);
			const thresholds = accuracyThresholds(modifier);
			expect((thresholds.monsterHitThreshold - 1) * 5).toBe(evasion);
			expect((21 - thresholds.playerHitThreshold) * 5).toBe(
				Math.min(95, 85 + modifier * 5),
			);
		},
	);
	it("combines a ring and temporary Dexterity across a diminished-return step, then expires it", () => {
		const initial = createGameState(createCorridorEncounter());
		let state: GameState = {
			...initial,
			progression: { experience: 800 },
			monsters: [],
			knownSpells: ["dexterity"],
			equipment: {
				...initial.equipment,
				leftRing: { id: "dex-ring", kind: "ring-dexterity" as const },
			},
		};
		expect(
			deriveAccuracy(state.progression, [], state.equipment).evadeChance,
		).toBe(45);
		state = resolvePlayerAction(state, {
			type: "cast",
			spell: "dexterity",
		}).state;
		expect(
			deriveAttributes(state.progression, state.effects, state.equipment)
				.dexterity,
		).toBe(24);
		expect(
			deriveAccuracy(state.progression, state.effects, state.equipment)
				.evadeChance,
		).toBe(50);
		for (let turn = 0; turn < 19; turn++)
			state = resolvePlayerAction(state, { type: "wait" }).state;
		expect(state.effects).toEqual([]);
		expect(
			deriveAccuracy(state.progression, state.effects, state.equipment)
				.evadeChance,
		).toBe(45);
	});
	it.each([
		[0, 10, 0],
		[10, 12, 1],
		[30, 12, 1],
		[60, 14, 2],
		[100, 14, 2],
		[1000, 20, 5],
	])(
		"derives earned Dexterity from %i XP",
		(experience, dexterity, dexterityModifier) => {
			expect(deriveAttributes({ experience })).toMatchObject({
				dexterity,
				dexterityModifier,
			});
		},
	);
	it.each([
		[0, 85, 20],
		[10, 90, 25],
		[60, 95, 30],
		[1000, 95, 45],
	])(
		"shows real accuracy and evasion for %i XP",
		(experience, playerHitChance, evadeChance) => {
			expect(deriveAccuracy({ experience })).toMatchObject({
				playerHitChance,
				evadeChance,
			});
		},
	);
	it.each([
		[0, 4, 5],
		[10, 3, 6],
		[60, 2, 7],
	])(
		"resolves exact hit/miss boundaries for %i XP",
		(experience, playerThreshold, monsterThreshold) => {
			const accuracy = deriveAccuracy({ experience });
			for (const [actual, expected] of [
				[accuracy.playerHitThreshold, playerThreshold],
				[accuracy.monsterHitThreshold, monsterThreshold],
			]) {
				const profile = attackProfile(3, actual);
				expect(
					resolveMeleeAttack(profile, {
						d20: () => expected - 1,
						damage: () => {
							throw new Error("Miss should not roll damage");
						},
					}),
				).toEqual({ hit: false, damage: 0 });
				expect(
					resolveMeleeAttack(
						profile,
						{ d20: () => expected, damage: () => 3 },
						1,
					),
				).toEqual({ hit: true, damage: 2 });
			}
		},
	);
	it("caps chances at five and ninety-five percent, including future larger modifiers", () => {
		expect(accuracyThresholds(100)).toEqual({
			playerHitThreshold: 2,
			monsterHitThreshold: 20,
		});
		expect(accuracyThresholds(-100)).toEqual({
			playerHitThreshold: 20,
			monsterHitThreshold: 2,
		});
		expect(() => accuracyThresholds(1.5)).toThrow(RangeError);
	});
	it("applies newly earned evasion before the surviving monster phase", () => {
		const initial = createGameState(createCorridorEncounter());
		const before = {
			...initial,
			run: { ...initial.run, playerCoordinate: { row: 1, col: 2 } },
			progression: { experience: 9 },
			player: { health: 6, maxHealth: 10 },
			monsters: [
				{
					intent: { type: "idle" as const },
					id: "1:1",
					kind: "goblin" as const,
					floorNumber: 1,
					coordinate: { row: 1, col: 3 },
					health: 1,
				},
				{
					intent: { type: "idle" as const },
					id: "1:2",
					kind: "orc" as const,
					floorNumber: 1,
					coordinate: { row: 1, col: 1 },
					health: 7,
				},
			],
		};
		const outcome = resolvePlayerAction(
			before,
			{ type: "move", direction: "right" },
			(context) => ({
				d20: () => (context.attackerId === "player" ? 20 : 5),
				damage: (min, max) => Math.floor((min + max) / 2),
			}),
		).state;
		expect(outcome.player).toEqual({ health: 8, maxHealth: 12 });
		expect(
			outcome.activityHistory.entries.map((entry) => entry.event),
		).toContainEqual({
			type: "attribute-gained",
			attribute: "Dexterity",
			value: 12,
			turn: 1,
		});
		expect(outcome.activityHistory.entries.at(-1)?.event).toMatchObject({
			type: "monster-missed",
			monster: "orc",
		});
	});
});
